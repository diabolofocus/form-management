// src/backend/api.ts
import { submissions } from '@wix/forms';
import { auth } from '@wix/essentials';
import type {
    CleanFormSubmission,
    FieldType,
    FieldStatistics,
    QuerySubmissionsOptions,
    SubmissionsQueryResult,
    SortableField
} from '../types';

// Remove FormSubmission import to avoid conflicts with Wix SDK types

const elevatedQuerySubmissionsByNamespace = auth.elevate(submissions.querySubmissionsByNamespace);
const elevatedGetSubmission = auth.elevate(submissions.getSubmission);

// Type guard to check if Wix submission is valid
function isValidWixSubmission(submission: any): boolean {
    return !!(
        submission &&
        submission._id &&
        submission.formId &&
        submission.namespace &&
        submission._createdDate
    );
}

// Convert Wix SDK submission to our clean submission type
function convertToCleanSubmission(submission: any): CleanFormSubmission | null {
    if (!isValidWixSubmission(submission)) {
        return null;
    }

    // Safely convert dates
    const createdDate = submission._createdDate ? new Date(submission._createdDate) : new Date();
    const updatedDate = submission._updatedDate ? new Date(submission._updatedDate) : createdDate;

    return {
        _id: submission._id,
        _createdDate: createdDate,
        _updatedDate: updatedDate,
        formId: submission.formId,
        namespace: submission.namespace,
        status: submission.status || 'UNKNOWN_SUBMISSION_STATUS',
        submissions: submission.submissions || {},
        submitter: submission.submitter ? {
            memberId: submission.submitter.memberId || undefined,
            visitorId: submission.submitter.visitorId || undefined,
            userId: submission.submitter.userId || undefined,
            applicationId: submission.submitter.applicationId || undefined,
        } : undefined,
        seen: submission.seen || false,
        contactId: submission.contactId || undefined,
        revision: submission.revision || undefined,
    };
}

// Helper function to safely convert cursors
function convertCursors(wixCursors: any): { next?: string; prev?: string } {
    return {
        next: wixCursors?.next || undefined,
        prev: wixCursors?.prev || undefined
    };
}

/**
 * Query form submissions by namespace
 */
export async function querySubmissions(options: QuerySubmissionsOptions): Promise<SubmissionsQueryResult> {
    try {
        console.log('Querying submissions with options:', options);

        // Start building the query
        let query = elevatedQuerySubmissionsByNamespace()
            .eq('namespace', options.namespace);

        // Add filters
        if (options.status) {
            query = query.eq('status', options.status);
        }
        if (options.seen !== undefined) {
            query = query.eq('seen', options.seen);
        }
        if (options.formId) {
            query = query.eq('formId', options.formId);
        }

        // Add sorting
        const sortOrder = options.sortOrder || 'desc';

        // Default sort field
        let sortField: SortableField = '_createdDate';

        // Map sortBy to valid SortableField
        if (options.sortBy) {
            if (['_createdDate', '_updatedDate', 'formId', 'status', 'seen'].includes(options.sortBy)) {
                sortField = options.sortBy as SortableField;
            } else if (options.sortBy === 'createdDate') {
                sortField = '_createdDate';
            } else if (options.sortBy === 'updatedDate') {
                sortField = '_updatedDate';
            }
        }

        // Apply sorting
        query = sortOrder === 'desc'
            ? query.descending(sortField)
            : query.ascending(sortField);

        // Add pagination
        const limit = options.limit || 50;
        query = query.limit(limit);

        if (options.cursor) {
            query = query.skipTo(options.cursor);
        }

        console.log('Executing query...');
        const result = await query.find();

        // Convert all submissions to our clean format
        const validSubmissions = result.items
            .map(submission => convertToCleanSubmission(submission))
            .filter((submission): submission is CleanFormSubmission => submission !== null);

        // Prepare the response
        const hasNext = result.hasNext ? result.hasNext() : false;
        const hasPrev = result.hasPrev ? result.hasPrev() : false;

        // Handle cursor values safely
        const nextCursor = result.cursors?.next || null;
        const previousCursor = result.cursors?.prev || null;

        // Build the response object
        const response: SubmissionsQueryResult = {
            items: validSubmissions,
            totalCount: validSubmissions.length,
            hasNext,
            hasPrev,
            cursors: {
                next: nextCursor,
                prev: previousCursor
            },
            length: validSubmissions.length,
            pageSize: limit,
            nextCursor,
            previousCursor,
            pageInfo: {
                hasNext,
                hasPrevious: hasPrev,
                nextCursor: nextCursor,
                previousCursor: previousCursor
            }
        };

        console.log('Query response prepared:', {
            itemCount: validSubmissions.length,
            hasNext,
            hasPrev,
            nextCursor,
            previousCursor
        });

        return response;
    } catch (error) {
        console.error('Error querying submissions:', error);
        throw new Error(`Failed to query submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(submissionId: string): Promise<CleanFormSubmission> {
    try {
        console.log('Getting submission:', submissionId);

        const submission = await elevatedGetSubmission(submissionId);
        const cleanSubmission = convertToCleanSubmission(submission);

        if (!cleanSubmission) {
            throw new Error('Invalid submission data received');
        }

        return cleanSubmission;
    } catch (error) {
        console.error('Error getting submission:', error);
        throw new Error(`Failed to get submission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Count submissions for a namespace
 */
export async function countSubmissions(namespace: string, status?: string): Promise<number> {
    try {
        console.log('Counting submissions for:', namespace, status);

        let query = elevatedQuerySubmissionsByNamespace()
            .eq('namespace', namespace);

        if (status) {
            query = query.eq('status', status);
        }

        const result = await query.find();

        // Count only valid submissions
        const validCount = result.items.filter(submission => isValidWixSubmission(submission)).length;
        return validCount;
    } catch (error) {
        console.error('Error counting submissions:', error);
        throw new Error(`Failed to count submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Search submissions by content
 */
export async function searchSubmissions(
    namespace: string,
    searchQuery: string,
    options: { limit?: number; cursor?: string } = {}
): Promise<SubmissionsQueryResult> {
    try {
        // Note: Wix Forms API doesn't support text search directly
        // So we need to get all submissions and filter client-side
        const allSubmissions = await querySubmissions({
            namespace,
            limit: options.limit || 200 // Get more results for better search
        });

        const searchLower = searchQuery.toLowerCase();
        const filteredItems = allSubmissions.items.filter(submission => {
            const submissionText = Object.values(submission.submissions || {})
                .join(' ')
                .toLowerCase();

            return submissionText.includes(searchLower) ||
                submission._id.toLowerCase().includes(searchLower) ||
                submission.status.toLowerCase().includes(searchLower);
        });

        return {
            items: filteredItems,
            totalCount: filteredItems.length,
            hasNext: false,
            hasPrev: false,
            cursors: {
                next: undefined,
                prev: undefined
            },
            length: filteredItems.length,
            pageSize: options.limit || 50
        };
    } catch (error) {
        console.error('Error searching submissions:', error);
        throw new Error(`Failed to search submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get available form namespaces with submission counts
 */
export async function getFormNamespaces(): Promise<Array<{ namespace: string; count: number; formIds: string[] }>> {
    const commonNamespaces = [
        'wix.form_app.form',
        'wix.bookings.form',
        'wix.events.form',
        'wix.stores.form'
    ];

    const results = [];

    for (const namespace of commonNamespaces) {
        try {
            const submissions = await querySubmissions({
                namespace,
                limit: 100 // Get a reasonable number to find unique form IDs
            });

            if (submissions.items.length > 0) {
                // Extract unique form IDs - they're now guaranteed to be strings
                const formIds = [...new Set(
                    submissions.items
                        .map(sub => sub.formId)
                        .filter((formId): formId is string => !!formId)
                )];

                results.push({
                    namespace,
                    count: submissions.totalCount,
                    formIds
                });
            }
        } catch (error) {
            console.log(`Skipping namespace ${namespace}:`, error);
        }
    }

    return results;
}

// ================================================================
// API endpoint handlers

export async function handleGetSubmissions(request: Request) {
    const url = new URL(request.url);
    const namespace = url.searchParams.get('namespace');
    const formId = url.searchParams.get('formId');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const cursor = url.searchParams.get('cursor') || undefined;
    const status = url.searchParams.get('status') as any;
    const searchQuery = url.searchParams.get('searchQuery') || undefined;

    if (!namespace) {
        return new Response(JSON.stringify({ error: 'Namespace is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const result = await querySubmissions({
            namespace,
            formId: formId || undefined,
            limit,
            cursor,
            status,
            searchQuery
        });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in handleGetSubmissions:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch submissions' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function handleGetForms(request: Request) {
    const url = new URL(request.url);
    const namespace = url.searchParams.get('namespace');

    if (!namespace) {
        return new Response(JSON.stringify({ error: 'Namespace is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // First, get all submissions to extract form information
        const submissions = await querySubmissions({
            namespace,
            limit: 1000,
            sortBy: 'createdDate',
            sortOrder: 'desc'
        });

        const formMap = new Map<string, {
            formId: string;
            formName: string;
            submissionCount: number;
            lastSubmissionDate: Date;
        }>();

        // Process submissions to get form information
        for (const submission of submissions.items) {
            if (!formMap.has(submission.formId)) {
                formMap.set(submission.formId, {
                    formId: submission.formId,
                    formName: submission.submissions?._form?.title || `Form ${submission.formId}`,
                    submissionCount: 0,
                    lastSubmissionDate: submission._createdDate
                });
            }

            const formInfo = formMap.get(submission.formId)!;
            formInfo.submissionCount += 1;

            // Update last submission date if this one is newer
            if (submission._createdDate > formInfo.lastSubmissionDate) {
                formInfo.lastSubmissionDate = submission._createdDate;
            }
        }

        // Sort forms by most recent submission
        const forms = Array.from(formMap.values()).sort((a, b) =>
            b.lastSubmissionDate.getTime() - a.lastSubmissionDate.getTime()
        );

        return new Response(JSON.stringify({
            items: forms,
            totalCount: forms.length,
            hasNext: false,
            hasPrev: false,
            cursors: {},
            length: forms.length,
            pageSize: forms.length,
            pageInfo: {
                hasNext: false,
                hasPrevious: false
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in handleGetForms:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch forms',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}