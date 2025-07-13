// src/types/dashboard.ts

// Import your existing types from the correct locations
export type {
    CleanFormSubmission,
    FormSubmission,
    SubmissionsQueryResult,
    QuerySubmissionsOptions,
    FormSubmissionStatus,
    CMSItem,
    CMSCollection,
    CMSQueryResult
} from './index'; // Import from your index file

// Additional types specific to the dashboard
export interface FormOption {
    id: string;
    value: string;
    label: string;
    disabled?: boolean;
    namespace?: string;
    type?: string;
    submissionCount?: number;
}

export interface ProcessedDataItem {
    id: string;
    date: string;
    status: string;
    dataType: 'form' | 'cms';
    [key: string]: any;
}

export interface FormFieldData {
    type: 'null' | 'boolean' | 'array' | 'media-array' | 'url' | 'text' | 'object';
    value: any;
    fullValue?: string;
}

export interface DataLoadResult {
    items: ProcessedDataItem[];
    fields: string[];
    totalCount: number;
    message: string;
}

export type DataType = 'form' | 'cms' | '';

export interface DashboardState {
    selectedNamespace: string;
    selectedForm: string;
    selectedDataType: DataType;
    cmsCollections: FormOption[];
    realForms: FormOption[];
    realSubmissions: ProcessedDataItem[];
    formFields: string[];
    isLoading: boolean;
    error: string | null;
    availableApps: string;
}