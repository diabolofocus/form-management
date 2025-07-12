// src/utils/tableHelpers.ts
import type {
    CleanFormSubmission,
    FieldSetting,
    SubmissionTableRow
} from '../types';
import { formatSubmissionValue } from './formHelpers';

/**
 * Convert form submissions to table rows
 */
export function convertSubmissionsToTableRows(
    submissions: CleanFormSubmission[],
    fieldSettings: FieldSetting[]
): SubmissionTableRow[] {
    return submissions.map(submission => ({
        id: submission._id,
        createdDate: submission._createdDate,
        updatedDate: submission._updatedDate,
        status: submission.status,
        seen: submission.seen,
        formData: submission.submissions || {},
        submitter: submission.submitter
    }));
}

/**
 * Create table columns based on field settings
 */
export function createTableColumns(fieldSettings: FieldSetting[]) {
    const visibleFields = fieldSettings
        .filter(field => field.visible)
        .sort((a, b) => a.order - b.order);

    // Base columns
    const baseColumns = [
        {
            title: 'ID',
            render: (row: SubmissionTableRow) => row.id.substring(0, 8) + '...',
            width: '100px'
        },
        {
            title: 'Status',
            render: (row: SubmissionTableRow) => row.status,
            width: '120px'
        },
        {
            title: 'Date',
            render: (row: SubmissionTableRow) =>
                row.createdDate.toLocaleDateString(),
            width: '100px'
        }
    ];

    // Field columns
    const fieldColumns = visibleFields.map(field => ({
        title: field.label || field.name,
        render: (row: SubmissionTableRow) => {
            const value = row.formData[field.name];
            return formatSubmissionValue(value, field.type);
        }
    }));

    return [...baseColumns, ...fieldColumns];
}

/**
 * Filter submissions based on search query
 */
export function filterSubmissions(
    submissions: CleanFormSubmission[],
    searchQuery: string,
    fieldSettings: FieldSetting[]
): CleanFormSubmission[] {
    if (!searchQuery) return submissions;

    const searchLower = searchQuery.toLowerCase();
    const searchableFields = fieldSettings.filter(f => f.visible).map(f => f.name);

    return submissions.filter(submission => {
        // Search in submission ID
        if (submission._id && submission._id.toLowerCase().includes(searchLower)) return true;

        // Search in status
        if (submission.status && submission.status.toLowerCase().includes(searchLower)) return true;

        // Search in form data
        return searchableFields.some(fieldName => {
            const value = submission.submissions?.[fieldName];
            return value && String(value).toLowerCase().includes(searchLower);
        });
    });
}

/**
 * Sort submissions
 */
export function sortSubmissions(
    submissions: CleanFormSubmission[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
): CleanFormSubmission[] {
    return [...submissions].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortBy) {
            case 'createdDate':
                aValue = a._createdDate.getTime();
                bValue = b._createdDate.getTime();
                break;
            case 'updatedDate':
                aValue = a._updatedDate.getTime();
                bValue = b._updatedDate.getTime();
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                // Sort by form field
                aValue = a.submissions?.[sortBy] || '';
                bValue = b.submissions?.[sortBy] || '';
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Safe date creation helper
 */
export function createSafeDate(dateValue: Date | string | number | null | undefined): Date {
    if (!dateValue) {
        return new Date(); // Return current date as fallback
    }

    try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? new Date() : date;
    } catch (error) {
        return new Date(); // Return current date if parsing fails
    }
}

/**
 * Safe string extraction helper
 */
export function safeString(value: string | null | undefined, fallback = ''): string {
    return value ?? fallback;
}

/**
 * Safe boolean extraction helper
 */
export function safeBoolean(value: boolean | null | undefined, fallback = false): boolean {
    return value ?? fallback;
}