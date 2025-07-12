import React, { useState, useEffect } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  FormField,
  Page,
  Text,
  TextButton,
  WixDesignSystemProvider,
  Box,
  Loader,
  Badge,
  Layout,
  Cell,
  Heading
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import * as Icons from '@wix/wix-ui-icons-common';

// Types
interface FieldSetting {
  name: string;
  visible: boolean;
  order: number;
  type?: string;
  usage?: number; // How many submissions have this field
}

interface FieldStatistics {
  totalResponses: number;
  uniqueValues: number;
  mostCommon: { value: any; count: number } | null;
  isEmpty: boolean;
}

const Settings: React.FC = () => {
  // State
  const [availableFields, setAvailableFields] = useState<FieldSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [fieldStats, setFieldStats] = useState<Record<string, FieldStatistics>>({});

  // Load field settings from localStorage or set defaults
  useEffect(() => {
    loadFieldSettings();
  }, []);

  const loadFieldSettings = async () => {
    setLoading(true);
    try {
      // Get saved settings from localStorage
      const savedSettings = localStorage.getItem('formFieldSettings');
      const savedNamespace = localStorage.getItem('selectedFormNamespace');

      if (savedNamespace) {
        setSelectedNamespace(savedNamespace);

        // Load field statistics from the API
        await loadFieldStatistics(savedNamespace);
      }

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setAvailableFields(settings);
      }
    } catch (error) {
      console.error('Error loading field settings:', error);
      dashboard.showToast({
        message: 'Error loading settings',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFieldStatistics = async (namespace: string) => {
    try {
      const response = await fetch('/api/field-statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namespace })
      });

      if (response.ok) {
        const data = await response.json();
        setFieldStats(data.statistics || {});

        // Update available fields with usage data
        const fieldsWithStats = data.fields?.map((field: string, index: number) => ({
          name: field,
          visible: true, // Default to visible
          order: index,
          type: 'text', // Default type
          usage: data.statistics[field]?.totalResponses || 0
        })) || [];

        setAvailableFields(fieldsWithStats);
      }
    } catch (error) {
      console.error('Error loading field statistics:', error);
    }
  };

  const saveFieldSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('formFieldSettings', JSON.stringify(availableFields));

      dashboard.showToast({
        message: 'Field settings saved successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving field settings:', error);
      dashboard.showToast({
        message: 'Error saving settings',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFieldVisibility = (fieldName: string) => {
    setAvailableFields(fields =>
      fields.map(field =>
        field.name === fieldName
          ? { ...field, visible: !field.visible }
          : field
      )
    );
  };

  const moveFieldUp = (fieldName: string) => {
    setAvailableFields(fields => {
      const fieldIndex = fields.findIndex(f => f.name === fieldName);
      if (fieldIndex <= 0) return fields;

      const newFields = [...fields];
      [newFields[fieldIndex - 1], newFields[fieldIndex]] = [newFields[fieldIndex], newFields[fieldIndex - 1]];

      // Update order values
      return newFields.map((field, index) => ({ ...field, order: index }));
    });
  };

  const moveFieldDown = (fieldName: string) => {
    setAvailableFields(fields => {
      const fieldIndex = fields.findIndex(f => f.name === fieldName);
      if (fieldIndex >= fields.length - 1) return fields;

      const newFields = [...fields];
      [newFields[fieldIndex], newFields[fieldIndex + 1]] = [newFields[fieldIndex + 1], newFields[fieldIndex]];

      // Update order values
      return newFields.map((field, index) => ({ ...field, order: index }));
    });
  };

  const resetToDefaults = () => {
    setAvailableFields(fields =>
      fields.map((field, index) => ({
        ...field,
        visible: true,
        order: index
      }))
    );
  };

  const selectAll = () => {
    setAvailableFields(fields =>
      fields.map(field => ({ ...field, visible: true }))
    );
  };

  const selectNone = () => {
    setAvailableFields(fields =>
      fields.map(field => ({ ...field, visible: false }))
    );
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Icons.Email />;
      case 'phone': return <Icons.Phone />;
      case 'number': return <Icons.Number />;
      case 'date': return <Icons.Time />;
      default: return <Icons.Text />;
    }
  };

  const renderFieldItem = (field: FieldSetting, index: number) => {
    const stats = fieldStats[field.name];

    return (
      <Card key={field.name}>
        <Card.Content>
          <Box direction="vertical" gap="SP2">
            {/* Field header */}
            <Box align="space-between" verticalAlign="top">
              <Box direction="vertical" gap="SP1">
                <Box gap="SP2" verticalAlign="middle">
                  <Checkbox
                    checked={field.visible}
                    onChange={() => toggleFieldVisibility(field.name)}
                  />
                  {getFieldTypeIcon(field.type || 'text')}
                  <Text weight="bold">{field.name}</Text>
                  {field.usage !== undefined && (
                    <Badge skin="neutralLight" size="tiny">
                      {field.usage} responses
                    </Badge>
                  )}
                </Box>

                {stats && (
                  <Text size="tiny" secondary>
                    {stats.uniqueValues} unique values
                    {stats.mostCommon && ` • Most common: "${stats.mostCommon.value}"`}
                  </Text>
                )}
              </Box>

              {/* Reorder buttons */}
              <Box direction="vertical" gap="SP1">
                <Button
                  size="tiny"
                  priority="secondary"
                  prefixIcon={<Icons.ChevronUp />}
                  disabled={index === 0}
                  onClick={() => moveFieldUp(field.name)}
                />
                <Button
                  size="tiny"
                  priority="secondary"
                  prefixIcon={<Icons.ChevronDown />}
                  disabled={index === availableFields.length - 1}
                  onClick={() => moveFieldDown(field.name)}
                />
              </Box>
            </Box>
          </Box>
        </Card.Content>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Card>
          <Card.Content>
            <Box align="center" verticalAlign="middle" height="300px">
              <Loader size="medium" text="Loading field settings..." />
            </Box>
          </Card.Content>
        </Card>
      );
    }

    if (availableFields.length === 0) {
      return (
        <Card>
          <Card.Content>
            <EmptyState
              title="No form fields found"
              subtitle="Select a form type in the dashboard first to configure field settings."
              image="https://static.wixstatic.com/media/0fdc4b_7b6c1c7a1a4c4b7a9e8c2f1d5e6f7a8b~mv2.png"
            >
              <Button
                onClick={() => window.history.back()}
                prefixIcon={<Icons.ChevronLeft />}
              >
                Back to Dashboard
              </Button>
            </EmptyState>
          </Card.Content>
        </Card>
      );
    }

    const visibleFields = availableFields.filter(f => f.visible);
    const hiddenFields = availableFields.filter(f => !f.visible);

    return (
      <Layout>
        <Cell span={8}>
          <Card>
            <Card.Header
              title="Field Visibility & Order"
              subtitle="Configure which form fields to display and their order in the table"
            />
            <Card.Divider />
            <Card.Content>
              <Box direction="vertical" gap="SP4">
                {/* Action buttons */}
                <Box gap="SP2">
                  <Button size="small" onClick={selectAll}>
                    Show All
                  </Button>
                  <Button size="small" priority="secondary" onClick={selectNone}>
                    Hide All
                  </Button>
                  <TextButton size="small" onClick={resetToDefaults}>
                    Reset to Defaults
                  </TextButton>
                </Box>

                <Divider />

                {/* Field list */}
                <Box direction="vertical" gap="SP3">
                  {availableFields.map((field, index) => renderFieldItem(field, index))}
                </Box>
              </Box>
            </Card.Content>
          </Card>
        </Cell>

        <Cell span={4}>
          {/* Summary card */}
          <Card>
            <Card.Header title="Summary" />
            <Card.Divider />
            <Card.Content>
              <Box direction="vertical" gap="SP3">
                <Box direction="vertical" gap="SP1">
                  <Text size="small" secondary>Total Fields</Text>
                  <Text weight="bold">{availableFields.length}</Text>
                </Box>

                <Box direction="vertical" gap="SP1">
                  <Text size="small" secondary>Visible Fields</Text>
                  <Text weight="bold" skin="success">{visibleFields.length}</Text>
                </Box>

                <Box direction="vertical" gap="SP1">
                  <Text size="small" secondary>Hidden Fields</Text>
                  <Text weight="bold" skin="disabled">{hiddenFields.length}</Text>
                </Box>

                {selectedNamespace && (
                  <>
                    <Divider />
                    <Box direction="vertical" gap="SP1">
                      <Text size="small" secondary>Form Type</Text>
                      <Badge skin="standard">{selectedNamespace}</Badge>
                    </Box>
                  </>
                )}
              </Box>
            </Card.Content>
          </Card>

          {/* Preview order */}
          {visibleFields.length > 0 && (
            <Card>
              <Card.Header title="Column Order Preview" />
              <Card.Divider />
              <Card.Content>
                <Box direction="vertical" gap="SP2">
                  {visibleFields.map((field, index) => (
                    <Box key={field.name} gap="SP2" verticalAlign="middle">
                      <Text size="tiny" secondary>{index + 1}.</Text>
                      <Text size="small">{field.name}</Text>
                    </Box>
                  ))}
                </Box>
              </Card.Content>
            </Card>
          )}
        </Cell>
      </Layout>
    );
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Field Settings"
          subtitle="Configure which form fields to display and their order"
          breadcrumbs={[
            { id: 'dashboard', value: 'Dashboard' },
            { id: 'settings', value: 'Settings' }
          ]}
          actionsBar={
            <Box gap="SP2">
              <Button
                priority="secondary"
                onClick={() => window.history.back()}
                prefixIcon={<Icons.ChevronLeft />}
              >
                Back
              </Button>
              <Button
                onClick={saveFieldSettings}
                disabled={saving || availableFields.length === 0}
                prefixIcon={<Icons.Confirm />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          }
        />
        <Page.Content>
          {renderContent()}
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default Settings;