// src/backend/types.ts
export interface FormSubmission {
    _id: string;
    _createdDate: Date;
    _updatedDate: Date;
    formId: string;
    namespace: string;
    status: 'CONFIRMED' | 'PENDING' | 'PAYMENT_WAITING' | 'PAYMENT_CANCELED';
    submissions: Record<string, any>;
    submitter?: {
        memberId?: string;
        visitorId?: string;
        userId?: string;
        applicationId?: string;
    };
    seen: boolean;
    contactId?: string;
    revision?: string;
}

export interface SubmissionsQueryResult {
    items: FormSubmission[];
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursors: {
        next?: string;
        prev?: string;
    };
}

export interface QuerySubmissionsOptions {
    namespace: string;
    limit?: number;
    cursor?: string;
    status?: string;
    seen?: boolean;
    sortBy?: 'createdDate' | 'updatedDate';
    sortOrder?: 'asc' | 'desc';
}
