// backend/submissions.web.ts
import { webMethod, Permissions } from '@wix/web-methods';
import { querySubmissions } from './forms';
import type { FormInfo, CleanFormSubmission, QuerySubmissionsOptions, SubmissionsQueryResult } from '../types/index';

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

// Get forms for a specific namespace
export const getForms = webMethod(
  Permissions.Anyone,
  async (namespace: string): Promise<FormInfo[]> => {
    try {
      console.log('Getting forms for namespace:', namespace);

      const submissions = await querySubmissions({
        namespace,
        limit: 1000
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