// src/pages/page.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Dropdown,
  EmptyState,
  FormField,
  Page,
  TableToolbar,
  WixDesignSystemProvider,
  Text
} from '@wix/design-system';
import type { DropdownProps } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

// Import our custom hooks and components
import { useFormsDiscovery } from '../../hooks/useFormsDiscovery';
import { useFormsData } from '../../hooks/useFormsData';
import { useCMSData } from '../../hooks/useCMSData';
import DataTable from '../components/DataTable';
import DebugSection from '../components/DebugSection';
import { FormOption, DataType, ProcessedDataItem } from '../../types/dashboard';

const StableDashboard: React.FC = () => {
  // State management
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<DataType>('');
  const [submissions, setSubmissions] = useState<ProcessedDataItem[]>([]);
  const [formFields, setFormFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Custom hooks
  const {
    realForms,
    cmsCollections,
    statusMessage: discoveryMessage,
    discoverAllForms,
    loadCMSCollections
  } = useFormsDiscovery();

  const { loadFormData, isLoading: isLoadingForms } = useFormsData();
  const { loadCMSData, isLoading: isLoadingCMS } = useCMSData();

  // Data types configuration
  const dataTypes: FormOption[] = [
    { id: 'forms-new', value: 'wix.form_app.form', label: 'Wix Forms (New)', type: 'form' },
    { id: 'forms-legacy', value: 'wix.site.form', label: 'Site Forms (Legacy)', type: 'form' },
    { id: 'forms-contact', value: 'wix.contacts.form', label: 'Contact Forms', type: 'form' },
    { id: 'bookings-forms', value: 'wix.bookings.form', label: 'Wix Bookings Forms', type: 'form' },
    { id: 'events-forms', value: 'wix.events.form', label: 'Wix Events Forms', type: 'form' },
    { id: 'stores-forms', value: 'wix.stores.form', label: 'Wix Stores Forms', type: 'form' },
    { id: 'cms-collections', value: 'cms.collections', label: 'CMS Collections', type: 'cms' }
  ];

  // Load CMS collections when CMS namespace is selected
  useEffect(() => {
    if (selectedNamespace === 'cms.collections') {
      loadCMSCollections();
    }
  }, [selectedNamespace, loadCMSCollections]);

  // Load data when form/collection is selected
  useEffect(() => {
    const loadData = async () => {
      if (!selectedForm || !selectedNamespace) {
        setSubmissions([]);
        setFormFields([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const isCMSCollection = selectedDataType === 'cms' || selectedNamespace === 'cms.collections';

        if (isCMSCollection) {
          // Load CMS data
          const result = await loadCMSData(selectedForm, 25);
          setSubmissions(result.items);
          setFormFields(result.fields);
          setStatusMessage(prev => prev.split('\n\n🔄')[0] + `\n\n${result.message}`);
        } else {
          // Load form data
          const result = await loadFormData(selectedNamespace, selectedForm, 50);
          setSubmissions(result.items);
          setFormFields(result.fields);
          setStatusMessage(prev => prev.split('\n\n🔄')[0] + `\n\n${result.message}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        setSubmissions([]);
        setFormFields([]);
        setStatusMessage(prev => prev.split('\n\n🔄')[0] + `\n\n❌ Error loading data: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedForm, selectedNamespace, selectedDataType, loadFormData, loadCMSData]);

  // Update status message from discovery
  useEffect(() => {
    if (discoveryMessage) {
      setStatusMessage(discoveryMessage);
    }
  }, [discoveryMessage]);

  // Determine available forms/collections based on selection
  const availableForms: FormOption[] = selectedNamespace ?
    (selectedDataType === 'cms' ? cmsCollections :
      realForms.filter(form => form.namespace ? form.namespace === selectedNamespace : true)) : [];

  // Event handlers
  const handleNamespaceChange: DropdownProps['onSelect'] = (option) => {
    const newNamespace = option?.value as string || '';
    setSelectedNamespace(newNamespace);
    setSelectedForm(''); // Reset form when namespace changes

    // Determine data type
    const dataType = dataTypes.find(dt => dt.value === newNamespace);
    setSelectedDataType(dataType?.type as DataType || '');
  };

  const handleFormChange: DropdownProps['onSelect'] = (option) => {
    setSelectedForm(option?.value as string || '');
  };

  // Debug action handlers
  const handleRefreshForms = async () => {
    await discoverAllForms();
  };

  const handleTestCMS = async () => {
    try {
      const { testCMSConnection } = await import('../../backend/cms.web');
      const result = await testCMSConnection();
      setStatusMessage(result);
    } catch (error) {
      setStatusMessage(`❌ CMS test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDebugCollection = async () => {
    if (selectedForm) {
      try {
        const { debugCollectionType } = await import('../../backend/cms.web');
        const result = await debugCollectionType(selectedForm);
        setStatusMessage(`🔍 Debug Result: ${result}`);
      } catch (error) {
        setStatusMessage(`❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      setStatusMessage('⚠️ Please select a collection first');
    }
  };

  const handleShowHelp = () => {
    setStatusMessage('📝 Submit test data to forms with 0 submissions to make them discoverable.');
  };

  const isCurrentlyLoading = isLoading || isLoadingForms || isLoadingCMS;

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Data Viewer"
          subtitle="View and manage your form submissions and CMS collections"
        />
        <Page.Content>
          <Card>
            <TableToolbar>
              <TableToolbar.ItemGroup position="start">
                <TableToolbar.Item>
                  <FormField label="Data Type">
                    <Dropdown
                      placeholder="Select data type"
                      options={dataTypes}
                      selectedId={dataTypes.find(n => n.value === selectedNamespace)?.id}
                      onSelect={handleNamespaceChange}
                      size="small"
                    />
                  </FormField>
                </TableToolbar.Item>

                {selectedNamespace && (
                  <TableToolbar.Item>
                    <FormField label={selectedDataType === 'cms' ? 'Collection' : 'Form'}>
                      <Dropdown
                        placeholder={selectedDataType === 'cms' ? 'Select a collection' : 'Select a form'}
                        options={availableForms}
                        selectedId={availableForms.find(f => f.value === selectedForm)?.id}
                        onSelect={handleFormChange}
                        size="small"
                      />
                    </FormField>
                  </TableToolbar.Item>
                )}
              </TableToolbar.ItemGroup>
            </TableToolbar>

            <Card.Content>
              {/* Debug Section */}
              <DebugSection
                realFormsCount={realForms.length}
                availableApps={statusMessage}
                selectedForm={selectedForm}
                onRefreshForms={handleRefreshForms}
                onTestCMS={handleTestCMS}
                onDebugCollection={handleDebugCollection}
                onShowHelp={handleShowHelp}
              />

              {/* Main Content */}
              {error ? (
                <EmptyState
                  title="Error"
                  subtitle={error}
                />
              ) : isCurrentlyLoading ? (
                <EmptyState
                  title="Loading..."
                  subtitle="Please wait while we load your data"
                />
              ) : selectedForm && submissions.length > 0 ? (
                <div>
                  <Text size="medium" weight="bold">
                    {submissions.length} {selectedDataType === 'cms' ? 'items' : 'submissions'} for {availableForms.find(f => f.value === selectedForm)?.label || 'selected item'}
                  </Text>
                  <Text size="small" style={{ marginTop: '8px', marginBottom: '16px', display: 'block' }}>
                    📊 {formFields.length} {selectedDataType === 'cms' ? 'fields' : 'form fields'} • Scroll horizontally to see all columns
                  </Text>

                  <DataTable
                    data={submissions}
                    fields={formFields}
                    dataType={selectedDataType}
                    maxColumns={10}
                  />

                  {formFields.length > 6 && (
                    <Text size="small" style={{ marginTop: '8px', color: '#666' }}>
                      💡 Tip: This {selectedDataType === 'cms' ? 'collection' : 'form'} has {formFields.length} fields. Use horizontal scroll to view all columns.
                    </Text>
                  )}
                </div>
              ) : (
                <EmptyState
                  title={`Select a ${selectedDataType === 'cms' ? 'collection' : 'form type and form'} to begin`}
                  subtitle="Choose from the dropdown menus above"
                />
              )}
            </Card.Content>
          </Card>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
};

export default StableDashboard;