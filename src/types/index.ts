// src/types/index.ts
// Update these interfaces to match Wix SDK types

export interface FormSubmission {
    _id: string | null | undefined;
    _createdDate: Date | null | undefined;
    _updatedDate: Date | null | undefined;
    formId: string | null | undefined;
    namespace: string | null | undefined;
    status: FormSubmissionStatus;
    submissions: Record<string, any> | null | undefined;
    submitter?: Submitter;
    seen: boolean | null | undefined;
    contactId?: string | null | undefined;
    revision?: string | null | undefined;
    accessRestriction?: string | null | undefined;
    orderDetails?: OrderDetails;
}

export type FormSubmissionStatus =
    | 'CONFIRMED'
    | 'PENDING'
    | 'PAYMENT_WAITING'
    | 'PAYMENT_CANCELED'
    | 'UNKNOWN_SUBMISSION_STATUS';

export interface Submitter {
    memberId?: string | null | undefined;
    visitorId?: string | null | undefined;
    userId?: string | null | undefined;
    applicationId?: string | null | undefined;
}

export interface OrderDetails {
    checkoutId?: string | null | undefined;
    currency?: string | null | undefined;
    itemSubtotal?: string | null | undefined;
    number?: string | null | undefined;
    orderId?: string | null | undefined;
}

export interface FormNamespace {
    id: string | number;
    value: string;
    label: string;
    description?: string;
}

// Submission query types
export interface SubmissionsQueryResult {
    items: CleanFormSubmission[];
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    cursors: {
        next?: string | null;
        prev?: string | null;
    };
    length: number;
    pageSize: number;
    nextCursor?: string | null;
    previousCursor?: string | null;
    pageInfo?: {
        hasNext: boolean;
        hasPrevious: boolean;
        nextCursor?: string | null;
        previousCursor?: string | null;
    };
}

export type SortableField =
    | '_id'
    | '_createdDate'
    | '_updatedDate'
    | 'formId'
    | 'status'
    | 'submitter.memberId'
    | 'submitter.visitorId'
    | 'submitter.applicationId'
    | 'submitter.userId'
    | 'seen';

export interface QuerySubmissionsOptions {
    namespace: string;
    formId?: string;
    limit?: number;
    cursor?: string | null;
    status?: string | null;
    seen?: boolean;
    sortBy?: SortableField | string;
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
}

export interface CleanFormSubmission {
    _id: string;
    _createdDate: Date;
    _updatedDate: Date;
    formId: string;
    namespace: string;
    status: FormSubmissionStatus;
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

export interface SubmissionTableRow {
    id: string;
    createdDate: Date;
    updatedDate: Date;
    status: FormSubmissionStatus;
    seen: boolean;
    formData: Record<string, any>;
    submitter?: {
        memberId?: string;
        visitorId?: string;
        userId?: string;
        applicationId?: string;
    };
}
export interface FormInfo {
    formId: string;
    formName: string;
    submissionCount: number;
    namespace: string;
    lastSubmissionDate: Date;
}

export interface FieldSetting {
    name: string;
    visible: boolean;
    order: number;
    type: FieldType;
    usage?: number;
    required?: boolean;
    label?: string;
}

export type FieldType =
    | 'text'
    | 'email'
    | 'phone'
    | 'number'
    | 'date'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'url';

export interface FieldStatistics {
    totalResponses: number;
    uniqueValues: number;
    mostCommon: { value: any; count: number } | null;
    isEmpty: boolean;
    averageLength?: number;
    dateRange?: { min: Date; max: Date };
}