// src/utils/dataProcessing.ts
import { ProcessedDataItem, FormFieldData, CleanFormSubmission, CMSItem } from '../types/dashboard';

// Helper functions for form data processing
export const isUrl = (str: string): boolean => {
    try {
        return str.startsWith('http://') || str.startsWith('https://');
    } catch {
        return false;
    }
};

export const isImageObject = (obj: any): boolean => {
    return obj && typeof obj === 'object' && (
        obj.hasOwnProperty('displayName') ||
        obj.hasOwnProperty('fileName') ||
        obj.hasOwnProperty('url') ||
        obj.hasOwnProperty('src')
    );
};

// Helper function to safely format dates
const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'Unknown';

    try {
        if (date instanceof Date) {
            return date.toLocaleDateString();
        } else if (typeof date === 'string') {
            return new Date(date).toLocaleDateString();
        } else {
            return 'Unknown';
        }
    } catch (error) {
        console.warn('Error formatting date:', date, error);
        return 'Unknown';
    }
};

// Process form submissions into display format
export const processFormSubmissions = (
    submissions: CleanFormSubmission[],
    fieldNames: string[]
): ProcessedDataItem[] => {
    return submissions.map((sub, index) => {
        const formData = sub.submissions || {};

        console.log(`📝 [FORMS] Processing submission ${index + 1}:`, formData);

        const submission: ProcessedDataItem = {
            id: sub._id,
            date: formatDate(sub._createdDate),
            status: sub.status || 'Unknown',
            dataType: 'form'
        };

        // Process each form field with complex type handling
        fieldNames.forEach(fieldName => {
            const value = formData[fieldName];

            if (value === null || value === undefined) {
                submission[fieldName] = { type: 'null', value: '' };
            } else if (typeof value === 'boolean') {
                submission[fieldName] = { type: 'boolean', value: value };
            } else if (Array.isArray(value)) {
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
                submission[fieldName] = {
                    type: 'text',
                    value: value.substring(0, 50) + '...',
                    fullValue: value
                };
            } else {
                submission[fieldName] = { type: 'text', value: String(value) };
            }
        });

        return submission;
    });
};

// Process CMS items into display format
export const processCMSItems = (
    items: CMSItem[],
    fieldNames: string[]
): ProcessedDataItem[] => {
    return items.map((item, index) => {
        console.log(`📝 [CMS] Processing item ${index + 1}:`, item);

        const displayItem: ProcessedDataItem = {
            id: item._id || `item-${index}`,
            date: formatDate(item._createdDate),
            status: 'Published',
            dataType: 'cms'
        };

        // Process each field as simple string values for CMS
        fieldNames.forEach(fieldName => {
            const value = item[fieldName];

            if (value === null || value === undefined) {
                displayItem[fieldName] = '';
            } else if (typeof value === 'boolean') {
                displayItem[fieldName] = value ? 'Yes' : 'No';
            } else if (Array.isArray(value)) {
                displayItem[fieldName] = `[${value.length} items]`;
            } else if (typeof value === 'object') {
                displayItem[fieldName] = '[Object]';
            } else {
                const stringValue = String(value);
                displayItem[fieldName] = stringValue.length > 100 ?
                    stringValue.substring(0, 100) + '...' : stringValue;
            }
        });

        return displayItem;
    });
};

// Extract field names from form submissions
export const extractFormFieldNames = (submissions: CleanFormSubmission[]): string[] => {
    if (submissions.length === 0) return [];

    const firstSubmission = submissions[0];
    const fieldOrderReference = Object.keys(firstSubmission.submissions || {});

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
    submissions.forEach(sub => {
        const formData = sub.submissions || {};
        Object.keys(formData).forEach(key => {
            if (!allFieldNames.has(key)) {
                allFieldNames.add(key);
                fieldNamesArray.push(key);
            }
        });
    });

    return fieldNamesArray;
};

// Extract field names from CMS items
export const extractCMSFieldNames = (items: CMSItem[], maxFields: number = 15): string[] => {
    if (items.length === 0) return [];

    const firstItem = items[0];
    const allFieldNames = new Set<string>();
    const fieldNamesArray: string[] = [];

    // Add system fields first
    const systemFields = ['_id', '_createdDate', '_updatedDate', '_owner'];
    systemFields.forEach(field => {
        if (firstItem.hasOwnProperty(field)) {
            allFieldNames.add(field);
            fieldNamesArray.push(field);
        }
    });

    // Add custom fields (limit for performance)
    const customFields = Object.keys(firstItem).filter(key => !key.startsWith('_'));
    customFields.slice(0, maxFields).forEach(key => {
        if (!allFieldNames.has(key)) {
            allFieldNames.add(key);
            fieldNamesArray.push(key);
        }
    });

    // Add any additional fields found in other items
    items.forEach(item => {
        Object.keys(item).forEach(key => {
            if (!allFieldNames.has(key) && fieldNamesArray.length < maxFields + systemFields.length) {
                allFieldNames.add(key);
                fieldNamesArray.push(key);
            }
        });
    });

    return fieldNamesArray;
};