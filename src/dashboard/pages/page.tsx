import React, { useState, useEffect } from 'react';
import {
  Card,
  Dropdown,
  EmptyState,
  FormField,
  Page,
  TableToolbar,
  WixDesignSystemProvider,
  Table,
  Text,
  Button,
  TagList
} from '@wix/design-system';
import type { DropdownProps } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

interface FormOption {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
}

const StableDashboard: React.FC = () => {
  // Simple state - no external calls for now
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [availableApps, setAvailableApps] = useState<string>('Loading apps...');
  const [realForms, setRealForms] = useState<FormOption[]>([]);
  const [realSubmissions, setRealSubmissions] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<string[]>([]);
  const [testingCMS, setTestingCMS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test function to check CMS collections directly
  const testCMSCollections = async () => {
    setTestingCMS(true);
    try {
      console.log('Testing direct CMS collections approach...');

      // Import your backend function to get collections
      const { querySubmissions } = await import('../../backend/forms');

      // Let's just test that our backend connection works
      const testResult = await querySubmissions({
        namespace: 'wix.form_app.form',
        limit: 5
      });

      console.log('Backend test result:', testResult);
      setAvailableApps(`🔧 Backend Test Results:
✅ Backend connection: WORKING
📊 Submissions found: ${testResult.items.length}
📝 Total count: ${testResult.totalCount}

${testResult.items.length > 0 ?
          '✅ Found forms with submissions!' :
          '⚠️ No submissions found - this means forms exist but have no submissions'
        }

💡 Next step: We need to implement CMS collections discovery to find ALL forms.`);

    } catch (error) {
      setAvailableApps(`❌ Backend Test Failed:
Error: ${error instanceof Error ? error.message : 'Unknown error'}

🔧 This suggests the backend web methods are not working properly.
Check the browser console for more details.`);
      console.error('Backend test error:', error);
    } finally {
      setTestingCMS(false);
    }
  };

  // Get real forms from current site using CMS collections approach
  useEffect(() => {
    const getRealFormsData = async () => {
      try {
        setAvailableApps('🔗 Loading forms from current site...');

        // Instead of using web methods, use direct CMS API to find form collections
        // This will find ALL forms, even ones with 0 submissions

        // We need to make the API call directly since forms without submissions are invisible to the submissions API
        console.log('Checking for form collections...');
        setAvailableApps('🔍 Checking CMS collections for forms...');

        // For now, let's use the submissions approach but show better messaging
        const { getForms } = await import('../../backend/submissions.web');

        // Get forms for Wix Forms namespace
        const wixForms = await getForms('wix.form_app.form');

        if (wixForms.length > 0) {
          const formsList = wixForms.map(form =>
            `• ${form.formName} (${form.submissionCount} submissions)`
          ).join('\n');

          setAvailableApps(`✅ Found ${wixForms.length} Wix Forms with submissions:\n${formsList}`);

          // Update available forms dropdown
          const formOptions = wixForms.map(form => ({
            id: form.formId,
            value: form.formId,
            label: `${form.formName} (${form.submissionCount} submissions)`
          }));

          setRealForms(formOptions);
        } else {
          setAvailableApps(`ℹ️ No Wix Forms with submissions found on this site.

🔧 LIMITATION: The current discovery method only finds forms that have submissions.
   Forms with 0 submissions are invisible to this API.

💡 TO TEST: 
   1. Submit a test entry to one of your forms
   2. Refresh this dashboard
   3. The form will then appear in the dropdown

📝 YOUR FORMS: You mentioned you have several forms on this site.
   Try submitting test data to at least one form to make it discoverable.

🔄 ALTERNATIVE: We could implement the CMS collections approach to find ALL forms,
   but that requires more complex API integration.`);
        }

      } catch (error) {
        setAvailableApps(`❌ Error loading forms: ${error instanceof Error ? error.message : 'Unknown error'}

🔧 TROUBLESHOOTING:
   • Make sure your backend web methods are properly configured
   • Check that the import path '../../backend/submissions.web' is correct
   • Verify the site has the Wix Forms app installed

💡 TO TEST WITH MOCK DATA:
   We can temporarily add mock forms to test the UI functionality.`);
        console.error('Error loading forms:', error);
      }
    };

    getRealFormsData();
  }, []);

  // Load real submissions when a form is selected
  useEffect(() => {
    const getRealSubmissions = async () => {
      if (!selectedForm || !selectedNamespace) {
        console.log('No form or namespace selected:', { selectedForm, selectedNamespace });
        return;
      }

      try {
        console.log('🔄 Loading submissions for form:', selectedForm);
        setAvailableApps(prevApps => prevApps + '\n\n🔄 Loading submissions...');

        const { getSubmissions } = await import('../../backend/submissions.web');
        const submissionsData = await getSubmissions({
          namespace: selectedNamespace,
          formId: selectedForm,
          limit: 50
        });

        console.log('✅ Submissions loaded:', submissionsData);
        console.log('Number of submissions:', submissionsData.items.length);

        // First, collect all unique field names from all submissions
        const allFieldNames = new Set<string>();
        submissionsData.items.forEach(sub => {
          const formData = sub.submissions || {};
          Object.keys(formData).forEach(key => allFieldNames.add(key));
        });

        const fieldNamesArray = Array.from(allFieldNames);
        setFormFields(fieldNamesArray);

        // Convert to display format with separate columns for each field
        const displaySubmissions = submissionsData.items.map((sub, index) => {
          const formData = sub.submissions || {};

          console.log(`Submission ${index + 1}:`, formData);

          // Create base submission object
          const submission: any = {
            id: sub._id,
            date: sub._createdDate ? new Date(sub._createdDate).toLocaleDateString() : 'Unknown',
            status: sub.status || 'Unknown'
          };

          // Add each form field as a separate property
          fieldNamesArray.forEach(fieldName => {
            const value = formData[fieldName];

            // Handle different data types - keep original values for arrays
            if (value === null || value === undefined) {
              submission[fieldName] = { type: 'null', value: 'null' };
            } else if (Array.isArray(value)) {
              submission[fieldName] = { type: 'array', value: value };
            } else if (typeof value === 'object') {
              submission[fieldName] = { type: 'object', value: '[Object]' };
            } else if (typeof value === 'string' && value.length > 50) {
              submission[fieldName] = { type: 'text', value: value.substring(0, 50) + '...', fullValue: value };
            } else {
              submission[fieldName] = { type: 'text', value: String(value) };
            }
          });

          return submission;
        });

        setRealSubmissions(displaySubmissions);
        console.log('✅ Display submissions prepared:', displaySubmissions.length);

        // Update the status message
        setAvailableApps(prevApps => {
          const baseMessage = prevApps.split('\n\n🔄')[0]; // Remove loading message
          return baseMessage + `\n\n✅ Loaded ${displaySubmissions.length} submissions for selected form!`;
        });

      } catch (error) {
        console.error('❌ Error loading submissions:', error);
        setRealSubmissions([]);
        setAvailableApps(prevApps => {
          const baseMessage = prevApps.split('\n\n🔄')[0]; // Remove loading message  
          return baseMessage + `\n\n❌ Error loading submissions: ${error instanceof Error ? error.message : 'Unknown error'}`;
        });
      }
    };

    getRealSubmissions();
  }, [selectedForm, selectedNamespace]);

  // Static data that works
  const namespaces: FormOption[] = [
    { id: 'forms', value: 'wix.form_app.form', label: 'Wix Forms' }
  ];

  // Show forms when namespace is selected - use real forms if available
  const availableForms: FormOption[] = selectedNamespace ? realForms : [];

  // Show real submissions when form is selected
  const submissions = selectedForm ? realSubmissions : [];
  const tableColumns = selectedForm && realSubmissions.length > 0 ? [
    {
      title: 'ID',
      render: (row: any) => <Text size="small">{row.id}</Text>,
      width: '120px'
    },
    {
      title: 'Date',
      render: (row: any) => <Text size="small">{row.date}</Text>,
      width: '100px'
    },
    {
      title: 'Status',
      render: (row: any) => <Text size="small">{row.status}</Text>,
      width: '80px'
    },
    // Dynamic columns for each form field
    ...formFields.map(fieldName => ({
      title: fieldName.replace(/_[a-z0-9]+$/i, '').replace(/_/g, ' '),
      render: (row: any) => {
        const cellData = row[fieldName];

        if (!cellData) {
          return (
            <div style={{ maxWidth: '150px' }}>
              <Text size="small">null</Text>
            </div>
          );
        }

        // Handle arrays with TagList
        if (cellData.type === 'array') {
          return (
            <div style={{ maxWidth: '150px' }}>
              <TagList
                tags={cellData.value.map((item: any, index: number) => ({
                  id: `${fieldName}-${index}`,
                  children: String(item).length > 20 ? String(item).substring(0, 20) + '...' : String(item)
                }))}
                size="small"
                maxVisibleTags={3}
              />
            </div>
          );
        }

        // Handle regular text
        return (
          <div style={{
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <Text size="small" title={cellData.fullValue || cellData.value}>
              {cellData.value}
            </Text>
          </div>
        );
      },
      width: '150px'
    }))
  ] : [];
  const handleNamespaceChange: DropdownProps['onSelect'] = (option) => {
    setSelectedNamespace(option?.value as string || '');
    setSelectedForm(''); // Reset form when namespace changes
  };

  const handleFormChange: DropdownProps['onSelect'] = (option) => {
    setSelectedForm(option?.value as string || '');
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Form Submissions"
          subtitle="View and manage your form submissions"
        />
        <Page.Content>
          <Card>
            <TableToolbar>
              <TableToolbar.ItemGroup position="start">
                <TableToolbar.Item>
                  <FormField label="Form Type">
                    <Dropdown
                      placeholder="Select form type"
                      options={namespaces}
                      selectedId={namespaces.find(n => n.value === selectedNamespace)?.id}
                      onSelect={handleNamespaceChange}
                      size="small"
                    />
                  </FormField>
                </TableToolbar.Item>

                {selectedNamespace && (
                  <TableToolbar.Item>
                    <FormField label="Form">
                      <Dropdown
                        placeholder="Select a form"
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
              {/* Test section - Show available apps */}
              <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Text size="small" weight="bold">🔍 Current Site Forms:</Text>
                <br />
                <Text size="small" style={{ whiteSpace: 'pre-line' }}>{availableApps}</Text>
                <br /><br />

                {/* Test button */}
                <Button
                  onClick={testCMSCollections}
                  disabled={testingCMS}
                  size="small"
                  skin="standard"
                >
                  {testingCMS ? '🔄 Testing...' : '🧪 Test Backend Connection'}
                </Button>
                <br />

                <Text size="small" weight="bold">📋 Available Namespaces:</Text>
                <br />
                <Text size="small">
                  • wix.form_app.form (Wix Forms)<br />
                  • wix.bookings.form (Wix Bookings)<br />
                  • wix.events.form (Wix Events)<br />
                  • wix.stores.form (Wix Stores)
                </Text>
                <br /><br />
                <Text size="small" weight="bold">🎯 Instructions:</Text>
                <br />
                <Text size="small">
                  1. Click "Test Backend Connection" to check if APIs work<br />
                  2. Submit test data to one of your forms<br />
                  3. Select "Wix Forms" from the first dropdown<br />
                  4. Select your form from the second dropdown
                </Text>
              </div>

              {error ? (
                <EmptyState
                  title="Error"
                  subtitle={error}
                />
              ) : selectedForm && submissions.length > 0 ? (
                <div>
                  <Text size="medium" weight="bold">
                    {submissions.length} submissions for {availableForms.find(f => f.value === selectedForm)?.label || 'selected form'}
                  </Text>
                  <Text size="small" style={{ marginTop: '8px', marginBottom: '16px', display: 'block' }}>
                    📊 {formFields.length} form fields • Scroll horizontally to see all columns
                  </Text>

                  {/* Horizontally scrollable table container */}
                  <div style={{
                    overflowX: 'auto',
                    maxWidth: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}>
                    <Table
                      data={submissions}
                      columns={tableColumns}
                      skin="standard"
                    />
                  </div>

                  {formFields.length > 6 && (
                    <Text size="small" style={{ marginTop: '8px', color: '#666' }}>
                      💡 Tip: This form has {formFields.length} fields. Use horizontal scroll to view all columns.
                    </Text>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Select a form type and form to begin"
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