import React, { useState } from 'react';
import { dashboard } from '@wix/dashboard';
import {
  Card,
  Dropdown,
  EmptyState,
  FormField,
  Page,
  TableToolbar,
  WixDesignSystemProvider,
  Table,
  Text
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
  // ✅ CORRECT - All hooks are INSIDE the component
  const [namespaces] = useState<FormOption[]>([
    { id: 'forms', value: 'wix.form_app.form', label: 'Wix Forms' }
  ]);

  const [forms, setForms] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // When namespace is selected, show the available forms
  const availableForms = selectedNamespace ? [
    {
      id: 'cf104539-8559-4f91-92ee-2024a5169498',
      value: 'cf104539-8559-4f91-92ee-2024a5169498',
      label: 'Form Test (2 submissions)'
    }
  ] : [];

  // Your real submission data
  const submissions = selectedForm ? [
    {
      id: '27c4319a-1dff-4d25-bc97-fce3ed0844fb',
      firstName: 'John',
      lastName: 'MacKey',
      email: 'john.mackey@mackey.com',
      message: 'This is a sunny day',
      created: '2025-07-01'
    },
    {
      id: '7160477e-de05-43f8-a0da-10825e5daefe',
      firstName: 'Guillaume',
      lastName: 'Ka',
      email: 'gui.ka@karpo.com',
      message: 'testing form dash',
      created: '2025-07-01'
    }
  ] : [];

  const handleNamespaceChange: DropdownProps['onSelect'] = (option) => {
    try {
      if (!option) {
        setSelectedNamespace('');
        setSelectedForm(''); // Also reset form
        return;
      }
      setSelectedNamespace(option.value as string);
      setSelectedForm(''); // Reset form when namespace changes
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select namespace';
      setError(errorMessage);
      console.error('Error in handleNamespaceChange:', err);
    }
  };

  const handleFormChange: DropdownProps['onSelect'] = (option) => {
    try {
      if (!option) {
        setSelectedForm('');
        return;
      }
      setSelectedForm(option.value as string);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select form';
      setError(errorMessage);
      console.error('Error in handleFormChange:', err);
    }
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
              {error ? (
                <EmptyState
                  title="Error"
                  subtitle={error}
                />
              ) : selectedForm && submissions.length > 0 ? (
                <div>
                  <Text size="medium" weight="bold">
                    {submissions.length} submissions for Form Test
                  </Text>
                  <Table
                    data={submissions}
                    columns={[
                      {
                        title: 'Name',
                        render: (row: any) => `${row.firstName} ${row.lastName}`,
                        width: '200px'
                      },
                      {
                        title: 'Email',
                        render: (row: any) => row.email,
                        width: '250px'
                      },
                      {
                        title: 'Message',
                        render: (row: any) => row.message
                      },
                      {
                        title: 'Date',
                        render: (row: any) => row.created,
                        width: '120px'
                      }
                    ]}
                  />
                </div>
              ) : selectedNamespace && availableForms.length === 0 ? (
                <EmptyState
                  title="No forms found"
                  subtitle="No forms found for this namespace"
                />
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