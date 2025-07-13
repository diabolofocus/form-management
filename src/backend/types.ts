// src/backend/types.ts
// Re-export your existing types to avoid conflicts
export type FormSubmission = CleanFormSubmission;

// Import your existing types
export interface CleanFormSubmission {
    _id: string;
    _createdDate: Date;  // Changed from string to Date
    _updatedDate: Date;  // Changed from string to Date  
    formId: string;
    namespace: string;
    status: string;
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

// New types for CMS collections
export interface CMSCollection {
    _id: string;
    _createdDate: Date;
    _updatedDate: Date;
    displayName: string;
    collectionType: 'NATIVE' | 'WIX_APP' | 'EXTERNAL' | 'BLOCKS_APP';
    fields: CMSField[];
    permissions: {
        read: 'ANYONE' | 'SITE_MEMBER' | 'SITE_MEMBER_AUTHOR' | 'ADMIN';
        insert: 'ANYONE' | 'SITE_MEMBER' | 'SITE_MEMBER_AUTHOR' | 'ADMIN';
        update: 'ANYONE' | 'SITE_MEMBER' | 'SITE_MEMBER_AUTHOR' | 'ADMIN';
        remove: 'ANYONE' | 'SITE_MEMBER' | 'SITE_MEMBER_AUTHOR' | 'ADMIN';
    };
    itemCount?: number;
}

export interface CMSField {
    key: string;
    displayName: string;
    type: 'TEXT' | 'NUMBER' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARRAY' | 'OBJECT' | 'REFERENCE' | 'MULTI_REFERENCE' | 'URL' | 'RICH_TEXT' | 'RICH_CONTENT';
    required: boolean;
    readOnly: boolean;
}

export interface CMSItem {
    _id: string;
    _createdDate: Date;
    _updatedDate: Date;
    _owner?: string;
    [key: string]: any; // Dynamic fields based on collection schema
}

export interface CMSQueryResult {
    items: CMSItem[];
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

export interface CMSQueryOptions {
    collectionId: string;
    limit?: number;
    cursor?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filter?: Record<string, any>;
    fields?: string[];
    searchQuery?: string;
}

export interface CollectionInfo {
    collectionId: string;
    collectionName: string;
    itemCount: number;
    collectionType: string;
    lastUpdatedDate: Date;
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
