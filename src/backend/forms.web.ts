/**
This file allows you to define backend functions that you can call from the front end of this app with type-safety.

Here's how you can call your web method from your frontend code:

import { multiply } from '<path-to-your-web-methods-directory>/forms.web';

multiply(3, 4)
    .then(result => console.log(result));

To learn more, check out our documentation: https://wix.to/6LV6Oka.
*/

import { webMethod, Permissions } from '@wix/web-methods';

export const multiply = webMethod(
  Permissions.Anyone,
  (a: number, b: number) => {
    return a * b;
  },
);

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
        const formIds = [...new Set(
          submissions.items
            .map(sub => sub.formId)
            .filter((formId): formId is string => !!formId)
        )];

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