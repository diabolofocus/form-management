import { FormSubmission, FormSubmissionStatus, Submitter } from ".";

// src/types/submissions.ts
export interface SubmissionsQueryResult {
    items: FormSubmission[];
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursors: {
        next?: string;
        prev?: string;
    };
    length: number;
    pageSize: number;
}

export interface QuerySubmissionsOptions {
    namespace: string;
    limit?: number;
    cursor?: string;
    status?: FormSubmissionStatus;
    seen?: boolean;
    sortBy?: 'createdDate' | 'updatedDate' | 'status';
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
}

export interface SubmissionTableRow {
    id: string;
    createdDate: Date;
    updatedDate: Date;
    status: FormSubmissionStatus;
    seen: boolean;
    formData: Record<string, any>;
    submitter?: Submitter;
}