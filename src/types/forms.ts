// src/types/forms.ts
export interface FormSubmission {
    _id: string;
    _createdDate: Date;
    _updatedDate: Date;
    formId: string;
    namespace: string;
    status: FormSubmissionStatus;
    submissions: Record<string, any>;
    submitter?: Submitter;
    seen: boolean;
    contactId?: string;
    revision?: string;
    accessRestriction?: string;
    orderDetails?: OrderDetails;
}

export type FormSubmissionStatus =
    | 'CONFIRMED'
    | 'PENDING'
    | 'PAYMENT_WAITING'
    | 'PAYMENT_CANCELED'
    | 'UNKNOWN_SUBMISSION_STATUS';

export interface Submitter {
    memberId?: string;
    visitorId?: string;
    userId?: string;
    applicationId?: string;
}

export interface OrderDetails {
    checkoutId?: string;
    currency?: string;
    itemSubtotal?: string;
    number?: string;
    orderId?: string;
}

export interface FormNamespace {
    id: string;
    value: string;
    label: string;
    description?: string;
}