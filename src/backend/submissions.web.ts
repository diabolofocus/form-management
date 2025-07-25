// backend/submissions.web.ts
import { webMethod, Permissions } from '@wix/web-methods';
import { querySubmissions } from './forms';
import type {
  FormInfo,
  CleanFormSubmission,
  QuerySubmissionsOptions,
  SubmissionsQueryResult,
  CMSCollection,
  CMSQueryResult,
  CMSQueryOptions,
  CollectionInfo
} from '../types/index';

import {
  getCMSCollections,
  queryCMSItems,
  getCMSCollectionsWithCounts
} from './forms';

// Generate form names based on submission data
function generateFormName(submission: CleanFormSubmission, formId: string): string {
  const submissionData = submission.submissions || {};
  const fieldKeys = Object.keys(submissionData);

  const nameFields = fieldKeys.filter(key =>
    key.toLowerCase().includes('name') ||
    key.toLowerCase().includes('title') ||
    key.toLowerCase().includes('subject')
  );

  const emailFields = fieldKeys.filter(key =>
    key.toLowerCase().includes('email')
  );

  const phoneFields = fieldKeys.filter(key =>
    key.toLowerCase().includes('phone')
  );

  let name = 'Form';

  if (nameFields.length > 0) {
    name = `${nameFields.join(', ')} Form`;
  } else if (emailFields.length > 0 && phoneFields.length > 0) {
    name = 'Contact Form';
  } else if (emailFields.length > 0) {
    name = 'Email Form';
  } else if (fieldKeys.length > 0) {
    name = `${fieldKeys.slice(0, 2).join(', ')} Form`;
  }

  return `${name} (${formId.substring(0, 8)}...)`;
}
export const getForms = webMethod(
  Permissions.Anyone,
  async (namespace: string): Promise<FormInfo[]> => {
    try {
      console.log('Getting forms for namespace:', namespace);

      const submissions = await querySubmissions({
        namespace,
        limit: 100
      });

      const formMap = new Map<string, {
        formId: string;
        count: number;
        lastSubmissionDate: Date;
        firstSubmission: CleanFormSubmission;
      }>();

      submissions.items.forEach(submission => {
        const formId = submission.formId;
        if (formMap.has(formId)) {
          const existing = formMap.get(formId)!;
          existing.count += 1;
          if (submission._createdDate > existing.lastSubmissionDate) {
            existing.lastSubmissionDate = submission._createdDate;
          }
        } else {
          formMap.set(formId, {
            formId,
            count: 1,
            lastSubmissionDate: submission._createdDate,
            firstSubmission: submission
          });
        }
      });

      const forms: FormInfo[] = Array.from(formMap.values()).map(form => ({
        formId: form.formId,
        formName: generateFormName(form.firstSubmission, form.formId),
        submissionCount: form.count,
        namespace,
        lastSubmissionDate: form.lastSubmissionDate
      }));

      forms.sort((a, b) => b.lastSubmissionDate.getTime() - a.lastSubmissionDate.getTime());
      console.log(`Found ${forms.length} forms for namespace ${namespace}`);
      return forms;
    } catch (error) {
      console.error('Error getting forms for namespace:', error);
      return [];
    }
  }
);

// Add this simple test function to verify the web method is working
export const testGetForms = webMethod(
  Permissions.Anyone,
  async (): Promise<string> => {
    try {
      console.log('Test function called');
      return 'Web method is working!';
    } catch (error) {
      console.error('Test error:', error);
      return 'Error in web method';
    }
  }
);

// Get submissions for a specific form
export const getSubmissions = webMethod(
  Permissions.Anyone,
  async (options: {
    namespace: string;
    formId: string;
    limit?: number;
    cursor?: string | null;
    status?: string | null;
    searchQuery?: string;
  }): Promise<SubmissionsQueryResult> => {
    try {
      console.log('Getting submissions with options:', options);

      const queryOptions: QuerySubmissionsOptions = {
        namespace: options.namespace,
        formId: options.formId,
        limit: options.limit || 50,
        cursor: options.cursor || undefined,
        status: options.status || undefined,
        searchQuery: options.searchQuery
      };

      const result = await querySubmissions(queryOptions);
      console.log(`Found ${result.items.length} submissions`);
      return result;
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw new Error(`Failed to get submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Get all submissions for a namespace (for listing all submissions)
export const getAllSubmissions = webMethod(
  Permissions.Anyone,
  async (options: {
    namespace: string;
    limit?: number;
    cursor?: string | null;
    status?: string | null;
  }): Promise<SubmissionsQueryResult> => {
    try {
      console.log('Getting all submissions for namespace:', options.namespace);

      const queryOptions: QuerySubmissionsOptions = {
        namespace: options.namespace,
        limit: options.limit || 50,
        cursor: options.cursor || undefined,
        status: options.status || undefined
      };

      const result = await querySubmissions(queryOptions);
      console.log(`Found ${result.items.length} submissions for namespace`);
      return result;
    } catch (error) {
      console.error('Error getting all submissions:', error);
      throw new Error(`Failed to get submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// ================================================================
// CMS Collections Web Methods


// Get all CMS collections
export const getCMSCollectionsList = webMethod(
  Permissions.Anyone,
  async (): Promise<CollectionInfo[]> => {
    try {
      console.log('Getting CMS collections list');
      const collections = await getCMSCollectionsWithCounts();
      console.log(`Found ${collections.length} CMS collections`);
      return collections;
    } catch (error) {
      console.error('Error getting CMS collections:', error);
      return [];
    }
  }
);

// Get CMS collection details
export const getCMSCollectionDetails = webMethod(
  Permissions.Anyone,
  async (collectionId: string): Promise<CMSCollection | null> => {
    try {
      console.log('Getting CMS collection details for:', collectionId);
      const collections = await getCMSCollections();
      const collection = collections.find(c => c._id === collectionId);
      return collection || null;
    } catch (error) {
      console.error('Error getting CMS collection details:', error);
      return null;
    }
  }
);

// Get CMS collection items
export const getCMSCollectionItems = webMethod(
  Permissions.Anyone,
  async (options: {
    collectionId: string;
    limit?: number;
    cursor?: string | null;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
    searchQuery?: string;
    fields?: string[];
  }): Promise<CMSQueryResult> => {
    try {
      console.log('Getting CMS collection items with options:', options);

      const queryOptions: CMSQueryOptions = {
        collectionId: options.collectionId,
        limit: options.limit || 50,
        cursor: options.cursor || undefined,
        sortBy: options.sortBy || undefined,
        sortOrder: options.sortOrder || undefined,
        searchQuery: options.searchQuery,
        fields: options.fields
      };

      const result = await queryCMSItems(queryOptions);
      console.log(`Found ${result.items.length} CMS items`);
      return result;
    } catch (error) {
      console.error('Error getting CMS collection items:', error);
      throw new Error(`Failed to get CMS collection items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);