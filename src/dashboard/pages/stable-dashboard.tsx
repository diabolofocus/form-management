// import React, { useState } from 'react';
// import {
//     Card,
//     Dropdown,
//     EmptyState,
//     FormField,
//     Page,
//     TableToolbar,
//     WixDesignSystemProvider,
//     Table,
//     Text
// } from '@wix/design-system';
// import type { DropdownProps } from '@wix/design-system';
// import '@wix/design-system/styles.global.css';

// interface FormOption {
//     id: string;
//     value: string;
//     label: string;
// }

// const StableDashboard: React.FC = () => {
//     // Simple state - no external dependencies
//     const [selectedNamespace, setSelectedNamespace] = useState<string>('');
//     const [selectedForm, setSelectedForm] = useState<string>('');

//     // Static data for now
//     const namespaces: FormOption[] = [
//         { id: 'forms', value: 'wix.form_app.form', label: 'Wix Forms' }
//     ];

//     const forms: FormOption[] = selectedNamespace ? [
//         { id: 'cf104539-8559-4f91-92ee-2024a5169498', value: 'cf104539-8559-4f91-92ee-2024a5169498', label: 'Form Test (2 submissions)' }
//     ] : [];

//     // Your real form data (from the API call I just made)
//     const submissions = selectedForm ? [
//         {
//             id: '27c4319a-1dff-4d25-bc97-fce3ed0844fb',
//             firstName: 'John',
//             lastName: 'MacKey',
//             email: 'john.mackey@mackey.com',
//             message: 'This is a sunny day',
//             created: '2025-07-01'
//         },
//         {
//             id: '7160477e-de05-43f8-a0da-10825e5daefe',
//             firstName: 'Guillaume',
//             lastName: 'Ka',
//             email: 'gui.ka@karpo.com',
//             message: 'testing form dash',
//             created: '2025-07-01'
//         }
//     ] : [];

//     const handleNamespaceChange: DropdownProps['onSelect'] = (option) => {
//         setSelectedNamespace(option?.value as string || '');
//         setSelectedForm(''); // Reset form when namespace changes
//     };

//     const handleFormChange: DropdownProps['onSelect'] = (option) => {
//         setSelectedForm(option?.value as string || '');
//     };

//     return (
//         <WixDesignSystemProvider features={{ newColorsBranding: true }}>
//             <Page>
//                 <Page.Header
//                     title="Form Submissions"
//                     subtitle="View and manage your form submissions"
//                 />
//                 <Page.Content>
//                     <Card>
//                         <TableToolbar>
//                             <TableToolbar.ItemGroup position="start">
//                                 <TableToolbar.Item>
//                                     <FormField label="Form Type">
//                                         <Dropdown
//                                             placeholder="Select form type"
//                                             options={namespaces}
//                                             selectedId={namespaces.find(n => n.value === selectedNamespace)?.id}
//                                             onSelect={handleNamespaceChange}
//                                             size="small"
//                                         />
//                                     </FormField>
//                                 </TableToolbar.Item>

//                                 {selectedNamespace && (
//                                     <TableToolbar.Item>
//                                         <FormField label="Form">
//                                             <Dropdown
//                                                 placeholder="Select a form"
//                                                 options={forms}
//                                                 selectedId={forms.find(f => f.value === selectedForm)?.id}
//                                                 onSelect={handleFormChange}
//                                                 size="small"
//                                             />
//                                         </FormField>
//                                     </TableToolbar.Item>
//                                 )}
//                             </TableToolbar.ItemGroup>
//                         </TableToolbar>

//                         <Card.Content>
//                             {selectedForm && submissions.length > 0 ? (
//                                 <div>
//                                     <Text size="medium" weight="bold">
//                                         {submissions.length} submissions for Form Test
//                                     </Text>
//                                     <Table
//                                         data={submissions}
//                                         columns={[
//                                             {
//                                                 title: 'Name',
//                                                 render: (row: any) => `${row.firstName} ${row.lastName}`,
//                                                 width: '200px'
//                                             },
//                                             {
//                                                 title: 'Email',
//                                                 render: (row: any) => row.email,
//                                                 width: '250px'
//                                             },
//                                             {
//                                                 title: 'Message',
//                                                 render: (row: any) => row.message,
//                                                 width: '300px'
//                                             },
//                                             {
//                                                 title: 'Date',
//                                                 render: (row: any) => row.created,
//                                                 width: '120px'
//                                             }
//                                         ]}
//                                     />
//                                 </div>
//                             ) : selectedNamespace && forms.length === 0 ? (
//                                 <EmptyState
//                                     title="No forms found"
//                                     subtitle="No forms found for this namespace"
//                                 />
//                             ) : (
//                                 <EmptyState
//                                     title="Select a form type and form to begin"
//                                     subtitle="Choose from the dropdown menus above"
//                                 />
//                             )}
//                         </Card.Content>
//                     </Card>
//                 </Page.Content>
//             </Page>
//         </WixDesignSystemProvider>
//     );
// };

// export default StableDashboard;