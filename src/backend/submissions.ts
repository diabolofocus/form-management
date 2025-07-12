

// ================================================================
// src/backend/submissions.ts
import type { FormSubmission } from './types';

/**
 * Extract unique field names from submissions
 */
export function extractFieldNames(submissions: FormSubmission[]): string[] {
    const fieldSet = new Set<string>();

    submissions.forEach(submission => {
        Object.keys(submission.submissions || {}).forEach(key => {
            fieldSet.add(key);
        });
    });

    return Array.from(fieldSet).sort();
}

/**
 * Get field statistics for a set of submissions
 */
export function getFieldStatistics(submissions: FormSubmission[], fieldName: string) {
    const values = submissions
        .map(submission => submission.submissions?.[fieldName])
        .filter(value => value != null);

    return {
        totalResponses: values.length,
        uniqueValues: new Set(values).size,
        mostCommon: getMostCommonValue(values),
        isEmpty: values.length === 0
    };
}

/**
 * Format submission data for table display
 */
export function formatSubmissionForTable(submission: FormSubmission, visibleFields: string[]) {
    const formatted: Record<string, any> = {
        id: submission._id,
        createdDate: submission._createdDate,
        status: submission.status,
        seen: submission.seen
    };

    // Add visible field data
    visibleFields.forEach(fieldName => {
        formatted[fieldName] = submission.submissions?.[fieldName] || '';
    });

    return formatted;
}

/**
 * Validate and sanitize form submission data
 */
export function validateSubmissionData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
        // Basic sanitization
        if (value != null) {
            if (typeof value === 'string') {
                sanitized[key] = value.trim();
            } else {
                sanitized[key] = value;
            }
        }
    });

    return sanitized;
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
