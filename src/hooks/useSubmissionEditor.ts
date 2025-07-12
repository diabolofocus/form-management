
// ================================================================
// src/hooks/useSubmissionEditor.ts
import { useState, useCallback } from 'react';
import type {
  FormSubmission,
  FieldSetting
} from '../types';
import { validateFieldValue } from '../utils/formHelpers';

interface UseSubmissionEditorReturn {
  editingSubmission: FormSubmission | null;
  editedData: Record<string, any>;
  validationErrors: Record<string, string>;
  isModified: boolean;
  startEditing: (submission: FormSubmission) => void;
  updateField: (fieldName: string, value: any) => void;
  saveChanges: () => Promise<void>;
  cancelEditing: () => void;
  validateForm: () => boolean;
}

export function useSubmissionEditor(
  fieldSettings: FieldSetting[],
  onSave?: (submission: FormSubmission, changes: Record<string, any>) => Promise<void>
): UseSubmissionEditorReturn {
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isModified = Object.keys(editedData).length > 0;

  const startEditing = useCallback((submission: FormSubmission) => {
    setEditingSubmission(submission);
    setEditedData({});
    setValidationErrors({});
  }, []);

  const updateField = useCallback((fieldName: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!editingSubmission) return false;

    const errors: Record<string, string> = {};

    Object.entries(editedData).forEach(([fieldName, value]) => {
      const fieldSetting = fieldSettings.find(f => f.name === fieldName);
      if (fieldSetting) {
        const validation = validateFieldValue(value, fieldSetting.type);
        if (!validation.valid && validation.error) {
          errors[fieldName] = validation.error;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editingSubmission, editedData, fieldSettings]);

  const saveChanges = useCallback(async () => {
    if (!editingSubmission || !validateForm()) {
      return;
    }

    try {
      if (onSave) {
        await onSave(editingSubmission, editedData);
      }

      // Reset state
      setEditingSubmission(null);
      setEditedData({});
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving submission:', error);
      throw error;
    }
  }, [editingSubmission, editedData, validateForm, onSave]);

  const cancelEditing = useCallback(() => {
    setEditingSubmission(null);
    setEditedData({});
    setValidationErrors({});
  }, []);

  return {
    editingSubmission,
    editedData,
    validationErrors,
    isModified,
    startEditing,
    updateField,
    saveChanges,
    cancelEditing,
    validateForm
  };
}