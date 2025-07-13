// src/backend/forms.ts
import { submissions } from '@wix/forms';
import { auth } from '@wix/essentials';
import type {
    CleanFormSubmission,
    QuerySubmissionsOptions,
    SubmissionsQueryResult
} from '../types';

console.log('Backend forms.ts loaded');
console.log('submissions object:', submissions);
console.log('auth object:', auth);

const elevatedQuerySubmissionsByNamespace = auth.elevate(submissions.querySubmissionsByNamespace);
const elevatedGetSubmission = auth.elevate(submissions.getSubmission);


import { collections, items } from '@wix/data';
import type { CMSCollection, CMSQueryOptions, CMSQueryResult, CollectionInfo, CMSItem } from '../types';

console.log('Elevated functions created');

// Define type for raw Wix submission (to avoid conflicts)
interface RawWixSubmission {
    _id?: string | null;
    _createdDate?: Date | string | null;
    _updatedDate?: Date | string | null;
    formId?: string | null;
    namespace?: string | null;
    status?: string;
    submissions?: Record<string, any> | null;
    submitter?: {
        memberId?: string | null;
        visitorId?: string | null;
        userId?: string | null;
        applicationId?: string | null;
    } | null;
    seen?: boolean | null;
    contactId?: string | null;
    revision?: string | null;
}

// Type guard to check if Wix submission is valid
function isValidWixSubmission(submission: any): submission is RawWixSubmission {
    const isValid = !!(
        submission &&
        submission._id &&
        submission.formId &&
        submission.namespace &&
        submission._createdDate
    );
    console.log('Checking submission validity:', {
        submission: submission ? 'exists' : 'null',
        _id: submission?._id ? 'exists' : 'missing',
        formId: submission?.formId ? 'exists' : 'missing',
        namespace: submission?.namespace ? 'exists' : 'missing',
        _createdDate: submission?._createdDate ? 'exists' : 'missing',
        isValid
    });
    return isValid;
}

// Convert Wix SDK submission to our clean submission type
function convertToCleanSubmission(submission: RawWixSubmission): CleanFormSubmission | null {
    console.log('Converting submission:', submission);

    if (!isValidWixSubmission(submission)) {
        console.log('Submission invalid, returning null');
        return null;
    }

    // Safely convert dates
    const createdDate = submission._createdDate ? new Date(submission._createdDate) : new Date();
    const updatedDate = submission._updatedDate ? new Date(submission._updatedDate) : createdDate;

    const cleanSubmission: CleanFormSubmission = {
        _id: submission._id!,
        _createdDate: createdDate,
        _updatedDate: updatedDate,
        formId: submission.formId!,
        namespace: submission.namespace!,
        status: submission.status as any || 'UNKNOWN_SUBMISSION_STATUS',
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

    console.log('Converted to clean submission:', cleanSubmission);
    return cleanSubmission;
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
    console.log('=== querySubmissions called ===');
    console.log('Options:', options);

    try {
        console.log('Creating query for namespace:', options.namespace);

        let query = elevatedQuerySubmissionsByNamespace()
            .eq('namespace', options.namespace);

        console.log('Base query created');

        // Add status filter if provided
        if (options.status) {
            console.log('Adding status filter:', options.status);
            query = query.eq('status', options.status);
        }

        // Add seen filter if provided
        if (options.seen !== undefined) {
            console.log('Adding seen filter:', options.seen);
            query = query.eq('seen', options.seen);
        }

        // Add sorting
        const sortBy = options.sortBy || 'createdDate';
        const sortOrder = options.sortOrder || 'desc';
        console.log('Adding sort:', { sortBy, sortOrder });

        let sortProperty: string;
        if (sortBy === 'createdDate') {
            sortProperty = '_createdDate';
        } else if (sortBy === 'updatedDate') {
            sortProperty = '_updatedDate';
        } else if (sortBy === 'status') {
            sortProperty = 'status';
        } else {
            sortProperty = '_createdDate';
        }

        // if (sortOrder === 'desc') {
        //     query = query.descending(sortProperty);
        // } else {
        //     query = query.ascending(sortProperty);
        // }

        // Add pagination
        if (options.limit) {
            console.log('Adding limit:', options.limit);
            query = query.limit(options.limit);
        }

        if (options.cursor) {
            console.log('Adding cursor:', options.cursor);
            query = query.skipTo(options.cursor);
        }

        console.log('Executing query...');
        const result = await query.find();
        console.log('Raw query result:', result);
        console.log('Raw items count:', result.items?.length || 0);

        // Convert all submissions to our clean format
        console.log('Converting submissions...');
        const validSubmissions = result.items
            .map((submission: RawWixSubmission) => convertToCleanSubmission(submission))
            .filter((submission): submission is CleanFormSubmission => submission !== null);

        console.log('Valid submissions after conversion:', validSubmissions.length);

        const finalResult: SubmissionsQueryResult = {
            items: validSubmissions,
            totalCount: validSubmissions.length,
            hasNext: result.hasNext(),
            hasPrev: result.hasPrev(),
            cursors: convertCursors(result.cursors),
            length: validSubmissions.length,
            pageSize: result.pageSize
        };

        console.log('Final result:', finalResult);
        console.log('=== querySubmissions completed ===');

        return finalResult;
    } catch (error: unknown) {
        console.error('=== querySubmissions ERROR ===');
        console.error('Error details:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error message:', errorMessage);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
        throw new Error(`Failed to query submissions: ${errorMessage}`);
    }
}

/**
 * Get a single submission by ID
 */
export async function getSubmission(submissionId: string): Promise<CleanFormSubmission> {
    console.log('Getting submission:', submissionId);

    try {
        const submission = await elevatedGetSubmission(submissionId);
        console.log('Raw submission:', submission);

        const cleanSubmission = convertToCleanSubmission(submission);

        if (!cleanSubmission) {
            throw new Error('Invalid submission data received');
        }

        return cleanSubmission;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error getting submission:', error);
        throw new Error(`Failed to get submission: ${errorMessage}`);
    }
}

/**
 * Get available form namespaces with submission counts
 */
export async function getFormNamespaces(): Promise<Array<{ namespace: string; count: number; formIds: string[] }>> {
    console.log('=== getFormNamespaces called ===');

    const commonNamespaces = [
        'wix.form_app.form',
        'wix.bookings.form',
        'wix.events.form',
        'wix.stores.form'
    ];

    const results: Array<{ namespace: string; count: number; formIds: string[] }> = [];

    for (const namespace of commonNamespaces) {
        console.log(`Checking namespace: ${namespace}`);

        try {
            const submissions = await querySubmissions({
                namespace,
                limit: 100
            });

            console.log(`Namespace ${namespace} - found ${submissions.items.length} submissions`);

            if (submissions.items.length > 0) {
                const formIds = Array.from(new Set(
                    submissions.items
                        .map(sub => sub.formId)
                        .filter((formId): formId is string => !!formId)
                ));

                console.log(`Namespace ${namespace} - unique form IDs:`, formIds);

                results.push({
                    namespace,
                    count: submissions.totalCount,
                    formIds
                });
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.log(`Skipping namespace ${namespace} due to error:`, errorMessage);
        }
    }

    console.log('Final namespace results:', results);
    console.log('=== getFormNamespaces completed ===');

    return results;
}

// ================================================================
// CMS Collections Functions


const elevatedListDataCollections = auth.elevate(collections.listDataCollections);
const elevatedQueryDataItems = auth.elevate(items.query);

/**
 * Get all CMS collections
 */
export async function getCMSCollections(): Promise<CMSCollection[]> {
    console.log('=== getCMSCollections called ===');

    try {
        const result = await elevatedListDataCollections({
            paging: {
                limit: 100,
                offset: 0
            },
            consistentRead: true
        });

        console.log('Raw collections result:', result);

        if (!result.collections) {
            console.log('No collections found');
            return [];
        }

        const cmsCollections: CMSCollection[] = result.collections
            .filter(collection => collection._id && collection.displayName)
            .map(collection => ({
                _id: collection._id!,
                _createdDate: collection._createdDate || new Date(),
                _updatedDate: collection._updatedDate || new Date(),
                displayName: collection.displayName!,
                collectionType: (collection.collectionType as any) || 'NATIVE',
                fields: (collection.fields || [])
                    .filter(field => field.key && field.displayName) // Only include fields with valid key and displayName
                    .map(field => ({
                        key: field.key!,
                        displayName: field.displayName!,
                        type: (field.type as any) || 'TEXT',
                        required: field.required || false,
                        readOnly: field.readOnly || false
                    })),
                permissions: {
                    read: (collection.permissions?.read as any) || 'ANYONE',
                    insert: (collection.permissions?.insert as any) || 'ANYONE',
                    update: (collection.permissions?.update as any) || 'ANYONE',
                    remove: (collection.permissions?.remove as any) || 'ANYONE'
                }
            }));

        console.log('Processed CMS collections:', cmsCollections.length);
        return cmsCollections;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error getting CMS collections:', error);
        throw new Error(`Failed to get CMS collections: ${errorMessage}`);
    }
}

/**
 * Query CMS collection items
 */
export async function queryCMSItems(options: CMSQueryOptions): Promise<CMSQueryResult> {
    console.log('=== queryCMSItems called ===');
    console.log('Options:', options);

    try {
        let query = elevatedQueryDataItems(options.collectionId);

        // Add sorting
        if (options.sortBy && options.sortOrder) {
            if (options.sortOrder === 'desc') {
                query = query.descending(options.sortBy);
            } else {
                query = query.ascending(options.sortBy);
            }
        } else {
            // Default sort by creation date, descending
            query = query.descending('_createdDate');
        }

        // Add pagination
        if (options.limit) {
            query = query.limit(options.limit);
        }
        // Note: Field selection removed due to API compatibility issues
        // All fields will be returned in the query results
        if (options.fields && options.fields.length > 0) {
            console.log('Field selection requested but skipped for compatibility:', options.fields);
        }

        // Add basic text search if provided
        if (options.searchQuery) {
            // Create separate filters for different field types
            let searchFilter = items.filter().contains('title', options.searchQuery);

            try {
                searchFilter = searchFilter
                    .or(items.filter().contains('name', options.searchQuery))
                    .or(items.filter().contains('description', options.searchQuery));
            } catch (e) {
                // If these fields don't exist, just use title search
                console.log('Some search fields may not exist, using basic search');
            }

            query = query.and(searchFilter);
        }

        console.log('Executing CMS query...');
        const result = await query.find({
            returnTotalCount: true,
            consistentRead: true
        });

        console.log('CMS query result:', result);

        const finalResult: CMSQueryResult = {
            items: result.items as CMSItem[],
            totalCount: result.totalCount || result.items.length,
            hasNext: result.hasNext(),
            hasPrev: result.hasPrev(),
            cursors: {
                next: undefined, // Wix Data doesn't expose cursors directly
                prev: undefined
            },
            length: result.items.length,
            pageSize: result.pageSize || 50
        };

        console.log('Final CMS result:', finalResult);
        return finalResult;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error querying CMS items:', error);
        throw new Error(`Failed to query CMS items: ${errorMessage}`);
    }
}

/**
 * Get CMS collections with item counts
 */
export async function getCMSCollectionsWithCounts(): Promise<CollectionInfo[]> {
    console.log('=== getCMSCollectionsWithCounts called ===');

    try {
        const collections = await getCMSCollections();
        const collectionsInfo: CollectionInfo[] = [];

        for (const collection of collections) {
            try {
                // Get item count for each collection
                const itemsResult = await queryCMSItems({
                    collectionId: collection._id,
                    limit: 1
                });

                collectionsInfo.push({
                    collectionId: collection._id,
                    collectionName: collection.displayName,
                    itemCount: itemsResult.totalCount,
                    collectionType: collection.collectionType,
                    lastUpdatedDate: collection._updatedDate
                });
            } catch (error) {
                console.log(`Error getting count for collection ${collection._id}:`, error);
                // Still add the collection even if we can't get the count
                collectionsInfo.push({
                    collectionId: collection._id,
                    collectionName: collection.displayName,
                    itemCount: 0,
                    collectionType: collection.collectionType,
                    lastUpdatedDate: collection._updatedDate
                });
            }
        }

        // Sort by item count descending
        collectionsInfo.sort((a, b) => b.itemCount - a.itemCount);

        console.log('Collections with counts:', collectionsInfo);
        return collectionsInfo;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error getting CMS collections with counts:', error);
        throw new Error(`Failed to get CMS collections with counts: ${errorMessage}`);
    }
}