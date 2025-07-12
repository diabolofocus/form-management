// src/hooks/useTableFilters.ts
import { useState, useMemo, useCallback } from 'react';
import type {
    CleanFormSubmission,
    FieldSetting
} from '../types';
import { filterSubmissions, sortSubmissions } from '../utils/tableHelpers';

interface UseTableFiltersReturn {
    filteredSubmissions: CleanFormSubmission[];
    searchQuery: string;
    statusFilter: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    setSearchQuery: (query: string) => void;
    setStatusFilter: (status: string) => void;
    setSorting: (field: string, order: 'asc' | 'desc') => void;
    clearFilters: () => void;
}

export function useTableFilters(
    submissions: CleanFormSubmission[],
    fieldSettings: FieldSetting[]
): UseTableFiltersReturn {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState('createdDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Apply filters and sorting
    const filteredSubmissions = useMemo(() => {
        let filtered: CleanFormSubmission[] = submissions;

        // Apply search filter
        if (searchQuery) {
            filtered = filterSubmissions(filtered, searchQuery, fieldSettings);
        }

        // Apply status filter
        if (statusFilter) {
            filtered = filtered.filter(submission => submission.status === statusFilter);
        }

        // Apply sorting
        filtered = sortSubmissions(filtered, sortBy, sortOrder);

        return filtered;
    }, [submissions, searchQuery, statusFilter, sortBy, sortOrder, fieldSettings]);

    const setSorting = useCallback((field: string, order: 'asc' | 'desc') => {
        setSortBy(field);
        setSortOrder(order);
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQuery('');
        setStatusFilter('');
        setSortBy('createdDate');
        setSortOrder('desc');
    }, []);

    return {
        filteredSubmissions,
        searchQuery,
        statusFilter,
        sortBy,
        sortOrder,
        setSearchQuery,
        setStatusFilter,
        setSorting,
        clearFilters
    };
}