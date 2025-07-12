// src/hooks/useFieldSettings.ts
import { useState, useEffect, useCallback } from 'react';
import type {
    FieldSetting,
    FieldStatistics,
    CleanFormSubmission
} from '../types';
import { detectFieldType, generateFieldStatistics } from '../utils/formHelpers';

interface UseFieldSettingsReturn {
    fieldSettings: FieldSetting[];
    fieldStatistics: Record<string, FieldStatistics>;
    loading: boolean;
    updateFieldVisibility: (fieldName: string, visible: boolean) => void;
    updateFieldOrder: (fieldName: string, newOrder: number) => void;
    resetToDefaults: () => void;
    saveSettings: () => Promise<void>;
}

export function useFieldSettings(
    namespace: string,
    submissions: CleanFormSubmission[]
): UseFieldSettingsReturn {
    const [fieldSettings, setFieldSettings] = useState<FieldSetting[]>([]);
    const [fieldStatistics, setFieldStatistics] = useState<Record<string, FieldStatistics>>({});
    const [loading, setLoading] = useState(false);

    // Load settings from localStorage
    const loadSettings = useCallback(() => {
        const saved = localStorage.getItem(`fieldSettings_${namespace}`);
        if (saved) {
            try {
                setFieldSettings(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading field settings:', error);
            }
        }
    }, [namespace]);

    // Generate settings from submissions
    const generateSettingsFromSubmissions = useCallback(() => {
        if (submissions.length === 0) return;

        setLoading(true);

        try {
            const fieldNames = new Set<string>();
            submissions.forEach(submission => {
                Object.keys(submission.submissions || {}).forEach(key => {
                    fieldNames.add(key);
                });
            });

            const newSettings: FieldSetting[] = Array.from(fieldNames).map((name, index) => {
                const fieldType = detectFieldType(name, submissions);
                const usage = submissions.filter(s => s.submissions?.[name] != null).length;

                return {
                    name,
                    visible: true,
                    order: index,
                    type: fieldType,
                    usage,
                    label: name.charAt(0).toUpperCase() + name.slice(1)
                };
            });

            // Generate statistics
            const stats: Record<string, FieldStatistics> = {};
            Array.from(fieldNames).forEach(fieldName => {
                stats[fieldName] = generateFieldStatistics(fieldName, submissions);
            });

            setFieldSettings(newSettings);
            setFieldStatistics(stats);
        } finally {
            setLoading(false);
        }
    }, [submissions]);

    // Update field visibility
    const updateFieldVisibility = useCallback((fieldName: string, visible: boolean) => {
        setFieldSettings(settings =>
            settings.map(field =>
                field.name === fieldName ? { ...field, visible } : field
            )
        );
    }, []);

    // Update field order
    const updateFieldOrder = useCallback((fieldName: string, newOrder: number) => {
        setFieldSettings(settings => {
            const newSettings = [...settings];
            const fieldIndex = newSettings.findIndex(f => f.name === fieldName);

            if (fieldIndex === -1) return settings;

            const field = newSettings[fieldIndex];
            newSettings.splice(fieldIndex, 1);
            newSettings.splice(newOrder, 0, field);

            // Update order values
            return newSettings.map((setting, index) => ({
                ...setting,
                order: index
            }));
        });
    }, []);

    // Reset to defaults
    const resetToDefaults = useCallback(() => {
        setFieldSettings(settings =>
            settings.map((field, index) => ({
                ...field,
                visible: true,
                order: index
            }))
        );
    }, []);

    // Save settings
    const saveSettings = useCallback(async () => {
        try {
            localStorage.setItem(`fieldSettings_${namespace}`, JSON.stringify(fieldSettings));
        } catch (error) {
            console.error('Error saving field settings:', error);
            throw error;
        }
    }, [namespace, fieldSettings]);

    // Load settings on mount or namespace change
    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Generate settings when submissions change
    useEffect(() => {
        if (submissions.length > 0 && fieldSettings.length === 0) {
            generateSettingsFromSubmissions();
        }
    }, [submissions, fieldSettings.length, generateSettingsFromSubmissions]);

    return {
        fieldSettings,
        fieldStatistics,
        loading,
        updateFieldVisibility,
        updateFieldOrder,
        resetToDefaults,
        saveSettings
    };
}