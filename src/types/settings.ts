// src/types/settings.ts
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
    averageLength?: number; // For text fields
    dateRange?: { min: Date; max: Date }; // For date fields
}

export interface TableSettings {
    visibleFields: string[];
    fieldOrder: string[];
    rowsPerPage: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface AppSettings {
    selectedNamespace?: string;
    tableSettings: TableSettings;
    fieldSettings: Record<string, FieldSetting>;
    autoRefresh?: boolean;
    refreshInterval?: number;
}