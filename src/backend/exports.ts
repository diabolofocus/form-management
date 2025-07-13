// Re-export all necessary functions and types
import type { CleanFormSubmission, QuerySubmissionsOptions, SubmissionsQueryResult } from '../types';
import {
    querySubmissions,
    getSubmission,
    searchSubmissions,
    getFormNamespaces,
    handleGetForms,
    handleGetSubmissions
} from './api';

export type { CleanFormSubmission, QuerySubmissionsOptions, SubmissionsQueryResult };

export {
    querySubmissions,
    getSubmission,
    searchSubmissions,
    getFormNamespaces,
    handleGetForms,
    handleGetSubmissions
};
