// ================================================================
// src/utils/formHelpers.ts
import type {
    FormSubmission,
    FieldType,
    FieldStatistics,
    CleanFormSubmission
} from '../types';

/**
 * Extract unique field names from form submissions
 */
export function extractFieldNames(submissions: CleanFormSubmission[]): string[] {
    const fieldSet = new Set<string>();

    submissions.forEach(submission => {
        Object.keys(submission.submissions || {}).forEach(key => {
            fieldSet.add(key);
        });
    });

    return Array.from(fieldSet).sort();
}

/**
 * Detect field type based on submission data
 */
export function detectFieldType(fieldName: string, submissions: CleanFormSubmission[]): FieldType {
    const values = submissions
        .map(s => s.submissions?.[fieldName])
        .filter(v => v != null && v !== '');

    if (values.length === 0) return 'text';

    // Check for email pattern
    if (fieldName.toLowerCase().includes('email') ||
        values.some(v => typeof v === 'string' && /\S+@\S+\.\S+/.test(v))) {
        return 'email';
    }

    // Check for phone pattern
    if (fieldName.toLowerCase().includes('phone') ||
        values.some(v => typeof v === 'string' && /^\+?[\d\s\-\(\)]+$/.test(v))) {
        return 'phone';
    }

    // Check for URL pattern
    if (fieldName.toLowerCase().includes('url') || fieldName.toLowerCase().includes('website') ||
        values.some(v => typeof v === 'string' && /^https?:\/\//.test(v))) {
        return 'url';
    }

    // Check for date pattern
    if (fieldName.toLowerCase().includes('date') ||
        values.some(v => !isNaN(Date.parse(v)))) {
        return 'date';
    }

    // Check for number pattern
    if (values.every(v => !isNaN(Number(v)))) {
        return 'number';
    }

    // Check for long text (textarea)
    if (values.some(v => typeof v === 'string' && v.length > 100)) {
        return 'textarea';
    }

    return 'text';
}

/**
 * Generate field statistics
 */
export function generateFieldStatistics(
    fieldName: string,
    submissions: CleanFormSubmission[]
): FieldStatistics {
    const values = submissions
        .map(s => s.submissions?.[fieldName])
        .filter(v => v != null && v !== '');

    if (values.length === 0) {
        return {
            totalResponses: 0,
            uniqueValues: 0,
            mostCommon: null,
            isEmpty: true
        };
    }

    const uniqueValues = new Set(values).size;
    const mostCommon = getMostCommonValue(values);

    const stats: FieldStatistics = {
        totalResponses: values.length,
        uniqueValues,
        mostCommon,
        isEmpty: false
    };

    // Add type-specific statistics
    const stringValues = values.filter(v => typeof v === 'string') as string[];
    if (stringValues.length > 0) {
        stats.averageLength = stringValues.reduce((sum, v) => sum + v.length, 0) / stringValues.length;
    }

    const dateValues = values
        .map(v => new Date(v))
        .filter(d => !isNaN(d.getTime()));
    if (dateValues.length > 0) {
        stats.dateRange = {
            min: new Date(Math.min(...dateValues.map(d => d.getTime()))),
            max: new Date(Math.max(...dateValues.map(d => d.getTime())))
        };
    }

    return stats;
}

/**
 * Format submission value for display
 */
export function formatSubmissionValue(value: any, fieldType: FieldType): string {
    if (value == null || value === '') return '-';

    switch (fieldType) {
        case 'date':
            return new Date(value).toLocaleDateString();
        case 'email':
            return String(value).toLowerCase();
        case 'phone':
            return formatPhoneNumber(String(value));
        case 'url':
            return String(value);
        case 'textarea':
            return String(value).substring(0, 100) + (String(value).length > 100 ? '...' : '');
        default:
            return String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
    }
}

/**
 * Validate field value
 */
export function validateFieldValue(value: any, fieldType: FieldType): { valid: boolean; error?: string } {
    if (value == null || value === '') {
        return { valid: true }; // Empty values are typically valid
    }

    switch (fieldType) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(String(value))
                ? { valid: true }
                : { valid: false, error: 'Invalid email format' };

        case 'phone':
            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
            return phoneRegex.test(String(value))
                ? { valid: true }
                : { valid: false, error: 'Invalid phone format' };

        case 'url':
            try {
                new URL(String(value));
                return { valid: true };
            } catch {
                return { valid: false, error: 'Invalid URL format' };
            }

        case 'number':
            return !isNaN(Number(value))
                ? { valid: true }
                : { valid: false, error: 'Must be a number' };

        case 'date':
            return !isNaN(Date.parse(String(value)))
                ? { valid: true }
                : { valid: false, error: 'Invalid date format' };

        default:
            return { valid: true };
    }
}

// Helper functions
function getMostCommonValue(values: any[]): { value: any; count: number } | null {
    if (values.length === 0) return null;

    const counts = new Map();
    values.forEach(value => {
        counts.set(value, (counts.get(value) || 0) + 1);
    });

    let maxCount = 0;
    let mostCommon = null;

    counts.forEach((count, value) => {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = value;
        }
    });

    return { value: mostCommon, count: maxCount };
}

function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}
