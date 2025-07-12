
// ================================================================
// src/utils/validation.ts
import type { FieldSetting } from '../types';

/**
 * Validate namespace format
 */
export function validateNamespace(namespace: string): { valid: boolean; error?: string } {
    if (!namespace || namespace.trim().length === 0) {
        return { valid: false, error: 'Namespace cannot be empty' };
    }

    // Basic namespace format validation
    const namespaceRegex = /^[a-z0-9._-]+$/i;
    if (!namespaceRegex.test(namespace)) {
        return { valid: false, error: 'Invalid namespace format' };
    }

    return { valid: true };
}

/**
 * Validate field settings
 */
export function validateFieldSettings(fieldSettings: FieldSetting[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for duplicate field names
    const fieldNames = fieldSettings.map(f => f.name);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
        errors.push(`Duplicate field names: ${duplicates.join(', ')}`);
    }

    // Check for invalid order values
    const orders = fieldSettings.map(f => f.order).sort((a, b) => a - b);
    const expectedOrders = fieldSettings.map((_, index) => index);
    if (JSON.stringify(orders) !== JSON.stringify(expectedOrders)) {
        errors.push('Invalid field order sequence');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(limit?: number, cursor?: string): {
    valid: boolean;
    sanitized: { limit: number; cursor?: string }
} {
    const sanitizedLimit = Math.min(Math.max(limit || 50, 1), 200); // Between 1 and 200

    return {
        valid: true,
        sanitized: {
            limit: sanitizedLimit,
            cursor: cursor?.trim() || undefined
        }
    };
}