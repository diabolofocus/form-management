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
  TagList,
  TextButton
} from '@wix/design-system';
import type { DropdownProps } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { Confirm, Dismiss } from '@wix/wix-ui-icons-common';

interface FormOption {
  id: string;
  value: string;
  label: string;
  disabled?: boolean;
  namespace?: string;
  type?: string;
  submissionCount?: number;
}

// Helper function to get readable namespace names
const getNamespaceDisplayName = (namespace: string): string => {
  switch (namespace) {
    case 'wix.form_app.form': return 'New Forms';
    case 'wix.site.form': return 'Legacy Site Forms';
    case 'wix.contacts.form': return 'Contact Forms';
    case 'wix.bookings.form': return 'Bookings';
    case 'wix.events.form': return 'Events';
    case 'wix.stores.form': return 'Stores';
    case 'wix.pro_gallery.form': return 'Pro Gallery';
    case 'wix.blog.form': return 'Blog';
    case 'wix.members.form': return 'Members';
    case 'wix.marketing.form': return 'Marketing';
    case 'wix.automation.form': return 'Automation';
    case 'wix.crm.form': return 'CRM';
    case 'forms': return 'Generic Forms';
    case 'site.forms': return 'Site Forms';
    case 'standalone.forms': return 'Standalone Forms';
    case 'custom.forms': return 'Custom Forms';
    default: return 'Unknown';
  }
};

// Comprehensive form discovery function using existing imports
const discoverAllForms = async () => {
  const discoveredForms: any[] = [];
  const discoveryResults: string[] = [];

  // Extended list of namespaces to try (including more possibilities)
  const namespacesToTry = [
    'wix.form_app.form',           // New Wix Forms
    'wix.site.form',               // Legacy site forms
    'wix.contacts.form',           // Contact forms
    'wix.bookings.form',           // Bookings forms
    'wix.events.form',             // Events forms
    'wix.stores.form',             // Stores forms
    'wix.pro_gallery.form',        // Pro Gallery forms
    'wix.blog.form',               // Blog forms
    'wix.members.form',            // Members forms
    'wix.marketing.form',          // Marketing forms
    'wix.automation.form',         // Automation forms
    'wix.crm.form',                // CRM forms
    'forms',                       // Generic forms
    'site.forms',                  // Site forms
    'standalone.forms',            // Standalone forms
    'custom.forms'                 // Custom forms
  ];

  try {
    const { getForms } = await import('../../backend/submissions.web');

    discoveryResults.push('🔍 Testing ALL possible namespaces...');

    for (const namespace of namespacesToTry) {
      try {
        console.log(`Testing namespace: ${namespace}`);
        const namespaceForms = await getForms(namespace);

        if (namespaceForms.length > 0) {
          console.log(`Forms from ${namespace}:`, namespaceForms);
          console.log('First form structure:', namespaceForms[0]);

          const formsWithNamespace = namespaceForms.map((form: any) => ({
            ...form,
            namespace: namespace,
            type: 'submission',
            formName: form.formName || form.displayName || form.title || form.name || form.formTitle || `Form ${form.formId}`,
            displayName: form.formName || form.displayName || form.title || form.name || form.formTitle || `Form ${form.formId}`
          }));

          discoveredForms.push(...formsWithNamespace);
          discoveryResults.push(`✅ ${namespace}: ${namespaceForms.length} forms found`);
        } else {
          discoveryResults.push(`❌ ${namespace}: No forms`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        discoveryResults.push(`❌ ${namespace}: Error - ${errorMsg}`);
        console.log(`Namespace ${namespace} error:`, error);
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    discoveryResults.push(`❌ Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { discoveredForms, discoveryResults };
};

const StableDashboard: React.FC = () => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedDataType, setSelectedDataType] = useState<'form' | 'cms' | ''>('');
  const [cmsCollections, setCMSCollections] = useState<any[]>([]);
  const [availableApps, setAvailableApps] = useState<string>('Loading apps...');
  const [realForms, setRealForms] = useState<FormOption[]>([]);
  const [realSubmissions, setRealSubmissions] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<string[]>([]);
  const [testingCMS, setTestingCMS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load CMS collections when CMS data type is selected
  useEffect(() => {
    const loadCMSCollections = async () => {
      if (selectedNamespace === 'cms.collections') {
        try {
          setAvailableApps('🔄 Loading CMS collections...');
          console.log('Loading CMS collections...');

          const { getCMSCollectionsList } = await import('../../backend/submissions.web');
          const collections = await getCMSCollectionsList();

          console.log('CMS collections loaded:', collections);

          const collectionOptions = collections.map(collection => ({
            id: collection.collectionId,
            value: collection.collectionId,
            label: `${collection.collectionName} (${collection.itemCount} items)`,
            type: 'cms',
            submissionCount: collection.itemCount
          }));

          setCMSCollections(collectionOptions);
          setAvailableApps(`✅ Found ${collections.length} CMS collections:\n${collections.map(c => `• ${c.collectionName} (${c.itemCount} items)`).join('\n')}`);
        } catch (error) {
          console.error('Error loading CMS collections:', error);
          setAvailableApps(`❌ Error loading CMS collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };

    loadCMSCollections();
  }, [selectedNamespace]);

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
        setAvailableApps('🔍 Checking multiple form namespaces...');

        // For now, let's use the submissions approach but check multiple namespaces
        const { getForms } = await import('../../backend/submissions.web');

        // Try multiple namespaces to find different types of forms
        const namespacesToTry = [
          'wix.form_app.form',      // New Wix Forms
          'wix.site.form',          // Legacy site forms
          'wix.contacts.form',      // Contact forms
          'wix.bookings.form',      // Bookings forms
          'wix.events.form',        // Events forms
          'wix.stores.form'         // Stores forms
        ];

        let allForms: any[] = [];
        let namespaceResults: string[] = [];

        for (const namespace of namespacesToTry) {
          try {
            console.log(`Checking namespace: ${namespace}`);
            const namespaceForms = await getForms(namespace);

            if (namespaceForms.length > 0) {
              // Add namespace info to each form
              const formsWithNamespace = namespaceForms.map(form => ({
                ...form,
                namespace: namespace,
                displayName: `${form.formName} (${getNamespaceDisplayName(namespace)})`
              }));

              allForms.push(...formsWithNamespace);
              namespaceResults.push(`✅ ${namespace}: ${namespaceForms.length} forms`);
            } else {
              namespaceResults.push(`❌ ${namespace}: No forms found`);
            }
          } catch (error) {
            namespaceResults.push(`❌ ${namespace}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        const wixForms = allForms;

        if (wixForms.length > 0) {
          // Debug: log the actual form structure
          console.log('All forms structure:', wixForms);
          console.log('First form detailed:', wixForms[0]);

          const formsList = wixForms.map(form => {
            // Try different possible name fields
            const formName = form.formName ||
              form.displayName ||
              form.name ||
              form.title ||
              form.formTitle ||
              `Form ${form.formId}`;

            console.log(`Form ${form.formId} name resolution:`, {
              formName: form.formName,
              displayName: form.displayName,
              name: form.name,
              title: form.title,
              formTitle: form.formTitle,
              resolvedName: formName
            });

            return `• ${formName} (${form.submissionCount} submissions)`;
          }).join('\n');

          setAvailableApps(`✅ Found ${wixForms.length} forms:\n${formsList}`);

          // Update available forms dropdown with clean names
          const formOptions = wixForms.map(form => {
            const formName = form.formName ||
              form.displayName ||
              form.name ||
              form.title ||
              form.formTitle ||
              `Form ${form.formId}`;

            return {
              id: form.formId,
              value: form.formId,
              label: formName, // Use the resolved name
              namespace: form.namespace,
              type: 'submission',
              submissionCount: form.submissionCount
            };
          });

          setRealForms(formOptions);
        } else {
          setAvailableApps('❌ No forms with submissions found. Submit test data to forms to make them discoverable.');
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

        // First, collect all unique field names from all submissions in consistent order
        // Use the first submission as the reference for field order
        const firstSubmission = submissionsData.items[0];
        const fieldOrderReference = firstSubmission ? Object.keys(firstSubmission.submissions || {}) : [];

        // Collect all unique field names while preserving order from first submission
        const allFieldNames = new Set<string>();
        const fieldNamesArray: string[] = [];

        // Add fields in the order they appear in the first submission
        fieldOrderReference.forEach(key => {
          if (!allFieldNames.has(key)) {
            allFieldNames.add(key);
            fieldNamesArray.push(key);
          }
        });

        // Add any additional fields found in other submissions
        submissionsData.items.forEach(sub => {
          const formData = sub.submissions || {};
          Object.keys(formData).forEach(key => {
            if (!allFieldNames.has(key)) {
              allFieldNames.add(key);
              fieldNamesArray.push(key);
            }
          });
        });
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

            // Helper function to check if string is URL
            const isUrl = (str: string) => {
              try {
                return str.startsWith('http://') || str.startsWith('https://');
              } catch {
                return false;
              }
            };

            // Helper function to check if object is image/file related
            const isImageObject = (obj: any) => {
              return obj && typeof obj === 'object' && (
                obj.hasOwnProperty('displayName') ||
                obj.hasOwnProperty('fileName') ||
                obj.hasOwnProperty('url') ||
                obj.hasOwnProperty('src')
              );
            };

            // Handle different data types - keep original values for arrays
            if (value === null || value === undefined) {
              submission[fieldName] = { type: 'null', value: '' };
            } else if (typeof value === 'boolean') {
              submission[fieldName] = { type: 'boolean', value: value };
            } else if (Array.isArray(value)) {
              // Check if array contains image/file objects
              const hasImageObjects = value.some(item => isImageObject(item));
              submission[fieldName] = {
                type: hasImageObjects ? 'media-array' : 'array',
                value: value
              };
            } else if (typeof value === 'object') {
              submission[fieldName] = { type: 'object', value: '[Object]' };
            } else if (typeof value === 'string' && isUrl(value)) {
              submission[fieldName] = { type: 'url', value: value };
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

  const dataTypes: FormOption[] = [
    { id: 'forms-new', value: 'wix.form_app.form', label: 'Wix Forms (New)', type: 'form' },
    { id: 'forms-legacy', value: 'wix.site.form', label: 'Site Forms (Legacy)', type: 'form' },
    { id: 'forms-contact', value: 'wix.contacts.form', label: 'Contact Forms', type: 'form' },
    { id: 'bookings-forms', value: 'wix.bookings.form', label: 'Wix Bookings Forms', type: 'form' },
    { id: 'events-forms', value: 'wix.events.form', label: 'Wix Events Forms', type: 'form' },
    { id: 'stores-forms', value: 'wix.stores.form', label: 'Wix Stores Forms', type: 'form' },
    { id: 'cms-collections', value: 'cms.collections', label: 'CMS Collections', type: 'cms' }
  ];

  // Show forms when namespace is selected - filter by namespace and data type
  const availableForms: FormOption[] = selectedNamespace ?
    (selectedDataType === 'cms' ? cmsCollections :
      realForms.filter(form => form.namespace ? form.namespace === selectedNamespace : true)) : [];

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
              {/* Blank cell */}
            </div>
          );
        }

        // Handle null values with blank cells
        if (cellData.type === 'null') {
          return (
            <div style={{ maxWidth: '150px' }}>
              {/* Blank cell */}
            </div>
          );
        }

        // Handle boolean values with icons
        if (cellData.type === 'boolean') {
          return (
            <div style={{
              maxWidth: '150px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '4px'
            }}>
              {cellData.value ? (
                <Confirm style={{ color: '#4CAF50', fontSize: '16px' }} />
              ) : (
                <Dismiss style={{ color: '#F44336', fontSize: '16px' }} />
              )}
            </div>
          );
        }

        // Handle media arrays (images/files) differently
        if (cellData.type === 'media-array') {
          return (
            <div style={{ maxWidth: '150px' }}>
              <Text size="small" secondary>
                📎 {cellData.value.length} file{cellData.value.length !== 1 ? 's' : ''}
              </Text>
              {cellData.value.slice(0, 2).map((item: any, index: number) => (
                <div key={index} style={{ marginTop: '2px' }}>
                  <Text size="tiny" title={JSON.stringify(item)}>
                    {item.displayName || item.fileName || item.name || `File ${index + 1}`}
                  </Text>
                </div>
              ))}
              {cellData.value.length > 2 && (
                <Text size="tiny" secondary>+{cellData.value.length - 2} more</Text>
              )}
            </div>
          );
        }

        // Handle regular arrays with TagList
        if (cellData.type === 'array') {
          return (
            <div style={{ maxWidth: '150px' }}>
              <TagList
                tags={cellData.value.map((item: any, index: number) => {
                  let displayValue;

                  // Handle objects in arrays
                  if (typeof item === 'object' && item !== null) {
                    // Try to find a meaningful property to display
                    displayValue = item.name || item.title || item.label || item.value || 'Object';
                  } else {
                    displayValue = String(item);
                  }

                  return {
                    id: `${fieldName}-${index}`,
                    children: displayValue.length > 15 ? displayValue.substring(0, 15) + '...' : displayValue
                  };
                })}
                size="small"
                maxVisibleTags={3}
              />
            </div>
          );
        }

        // Handle URLs as clickable TextButton
        if (cellData.type === 'url') {
          return (
            <div style={{ maxWidth: '150px' }}>
              <TextButton
                as="a"
                href={cellData.value}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                underline="onHover"
                ellipsis
              >
                {cellData.value.length > 25 ? cellData.value.substring(0, 25) + '...' : cellData.value}
              </TextButton>
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
    const newNamespace = option?.value as string || '';
    setSelectedNamespace(newNamespace);
    setSelectedForm(''); // Reset form when namespace changes

    // Determine data type
    const dataType = dataTypes.find(dt => dt.value === newNamespace);
    setSelectedDataType(dataType?.type as 'form' | 'cms' || '');
  };

  const handleFormChange: DropdownProps['onSelect'] = (option) => {
    setSelectedForm(option?.value as string || '');
  };

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
              {/* Compact debug section */}
              <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text size="small" weight="bold">🔍 Found {realForms.length} forms</Text>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={async () => {
                        const { discoveredForms } = await discoverAllForms();
                        if (discoveredForms.length > 0) {
                          const formOptions = discoveredForms.map(form => ({
                            id: form.formId,
                            value: form.formId,
                            label: form.formName || form.displayName || `Form ${form.formId}`, // Clean, simple name
                            namespace: form.namespace,
                            type: form.type,
                            submissionCount: form.submissionCount
                          }));
                          setRealForms(formOptions);
                        }
                      }}
                      size="tiny"
                      skin="light"
                    >
                      🔄 Refresh
                    </Button>
                    <Button
                      onClick={() => setAvailableApps('📝 Submit test data to forms with 0 submissions to make them discoverable.')}
                      size="tiny"
                      skin="light"
                    >
                      💡 Help
                    </Button>
                  </div>
                </div>

                {availableApps && (
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    maxHeight: '60px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    padding: '6px',
                    borderRadius: '3px',
                    border: '1px solid #eee'
                  }}>
                    {availableApps}
                  </div>
                )}
              </div>

              {/* Table section */}
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

                  <div style={{
                    overflowX: 'auto',
                    maxWidth: '100%',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    width: '100%' // Constrain to parent width
                  }}>
                    <div style={{
                      minWidth: `${(formFields.length + 3) * 150}px` // Apply minWidth to inner content
                    }}>
                      <Table
                        data={submissions}
                        columns={tableColumns}
                        skin="standard"
                      />
                    </div>
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