// src/hooks/useFormsData.ts
import { useState, useEffect, useCallback } from 'react';
import type {
    CleanFormSubmission,
    QuerySubmissionsOptions,
    SubmissionsQueryResult
} from '../types';

interface UseFormsDataReturn {
    submissions: CleanFormSubmission[];
    loading: boolean;
    error: string | null;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    refetch: () => Promise<void>;
    loadMore: () => Promise<void>;
    search: (query: string) => Promise<void>;
}

export function useFormsData(options: QuerySubmissionsOptions): UseFormsDataReturn {
    const [submissions, setSubmissions] = useState<CleanFormSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrev, setHasPrev] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | undefined>();

    const fetchSubmissions = useCallback(async (opts: QuerySubmissionsOptions, append = false) => {
        if (!opts.namespace) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(opts)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch submissions');
            }

            const result: SubmissionsQueryResult = await response.json();

            if (append) {
                setSubmissions(prev => [...prev, ...result.items]);
            } else {
                setSubmissions(result.items);
            }

            setTotalCount(result.totalCount);
            setHasNext(result.hasNext);
            setHasPrev(result.hasPrev);

            // Handle cursor safely - filter out null/undefined values
            const nextCursorValue = result.cursors.next;
            setNextCursor(nextCursorValue || undefined);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch submissions');
        } finally {
            setLoading(false);
        }
    }, []);

    const refetch = useCallback(() => {
        return fetchSubmissions(options);
    }, [fetchSubmissions, options]);

    const loadMore = useCallback(async () => {
        if (!hasNext || !nextCursor) return;

        return fetchSubmissions({
            ...options,
            cursor: nextCursor
        }, true);
    }, [fetchSubmissions, options, hasNext, nextCursor]);

    const search = useCallback(async (query: string) => {
        // For now, we'll handle search client-side
        return fetchSubmissions({
            ...options,
            // Add search query to options if your API supports it
            searchQuery: query
        });
    }, [fetchSubmissions, options]);

    // Initial load and when options change
    useEffect(() => {
        refetch();
    }, [refetch]);

    return {
        submissions,
        loading,
        error,
        totalCount,
        hasNext,
        hasPrev,
        refetch,
        loadMore,
        search
    };
}