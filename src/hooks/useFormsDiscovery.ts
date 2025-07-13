// src/hooks/useFormsDiscovery.ts
import { useState, useEffect, useCallback } from 'react';
import { FormOption } from '../types/dashboard';

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

export const useFormsDiscovery = () => {
    const [realForms, setRealForms] = useState<FormOption[]>([]);
    const [cmsCollections, setCMSCollections] = useState<FormOption[]>([]);
    const [statusMessage, setStatusMessage] = useState<string>('Loading forms...');

    const discoverAllForms = useCallback(async () => {
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
            setStatusMessage('🔍 Checking multiple form namespaces...');
            const { getForms } = await import('../backend/submissions.web');

            let allForms: any[] = [];

            for (const namespace of namespacesToTry) {
                try {
                    console.log(`Checking namespace: ${namespace}`);
                    const namespaceForms = await getForms(namespace);

                    if (namespaceForms.length > 0) {
                        const formsWithNamespace = namespaceForms.map(form => ({
                            ...form,
                            namespace: namespace,
                            displayName: `${form.formName} (${getNamespaceDisplayName(namespace)})`
                        }));

                        allForms.push(...formsWithNamespace);
                    }
                } catch (error) {
                    console.log(`Namespace ${namespace} error:`, error);
                }

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (allForms.length > 0) {
                const formOptions = allForms.map(form => {
                    const formName = form.formName ||
                        form.displayName ||
                        form.name ||
                        form.title ||
                        form.formTitle ||
                        `Form ${form.formId}`;

                    return {
                        id: form.formId,
                        value: form.formId,
                        label: formName,
                        namespace: form.namespace,
                        type: 'submission',
                        submissionCount: form.submissionCount
                    };
                });

                setRealForms(formOptions);

                const formsList = allForms.map(form => {
                    const formName = form.formName ||
                        form.displayName ||
                        form.name ||
                        form.title ||
                        form.formTitle ||
                        `Form ${form.formId}`;
                    return `• ${formName} (${form.submissionCount} submissions)`;
                }).join('\n');

                setStatusMessage(`✅ Found ${allForms.length} forms:\n${formsList}`);
            } else {
                setStatusMessage('❌ No forms with submissions found. Submit test data to forms to make them discoverable.');
            }

            return allForms;
        } catch (error) {
            setStatusMessage(`❌ Error loading forms: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Error loading forms:', error);
            return [];
        }
    }, []);

    const loadCMSCollections = useCallback(async () => {
        try {
            setStatusMessage('🔄 Loading CMS collections...');
            console.log('Loading CMS collections...');

            const { getCMSCollectionsList } = await import('../backend/submissions.web');
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
            setStatusMessage(`✅ Found ${collections.length} CMS collections:\n${collections.map(c => `• ${c.collectionName} (${c.itemCount} items)`).join('\n')}`);
        } catch (error) {
            console.error('Error loading CMS collections:', error);
            setStatusMessage(`❌ Error loading CMS collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, []);

    // Auto-discover forms on mount
    useEffect(() => {
        discoverAllForms();
    }, [discoverAllForms]);

    return {
        realForms,
        cmsCollections,
        statusMessage,
        discoverAllForms,
        loadCMSCollections
    };
};