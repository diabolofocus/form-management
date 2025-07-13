// src/hooks/useFormsData.ts
import { useState, useCallback } from 'react';
import { DataLoadResult, CleanFormSubmission, SubmissionsQueryResult } from '../types/dashboard';
import { processFormSubmissions, extractFormFieldNames } from '../utils/dataProcessing';

export const useFormsData = () => {
    const [isLoading, setIsLoading] = useState(false);

    const loadFormData = useCallback(async (
        namespace: string,
        formId: string,
        limit: number = 50
    ): Promise<DataLoadResult> => {
        setIsLoading(true);
        try {
            console.log('🔄 [FORMS] Loading submissions for form:', formId);

            const { getSubmissions } = await import('../backend/submissions.web');
            const submissionsData: SubmissionsQueryResult = await getSubmissions({
                namespace: namespace,
                formId: formId,
                limit: limit
            });

            console.log('✅ [FORMS] Submissions loaded:', submissionsData);
            console.log('📊 [FORMS] Number of submissions:', submissionsData.items.length);

            if (submissionsData.items.length > 0) {
                // Type the submissions correctly - they should already be CleanFormSubmission
                const typedSubmissions = submissionsData.items as CleanFormSubmission[];

                // Extract field names from submissions
                const fieldNames = extractFormFieldNames(typedSubmissions);

                console.log('📋 [FORMS] Field names extracted:', fieldNames);

                // Process form submissions
                const processedSubmissions = processFormSubmissions(typedSubmissions, fieldNames);

                console.log('✅ [FORMS] Display submissions prepared:', processedSubmissions.length);

                return {
                    items: processedSubmissions,
                    fields: fieldNames,
                    totalCount: submissionsData.totalCount || processedSubmissions.length,
                    message: `✅ Loaded ${processedSubmissions.length} submissions for selected form!`
                };
            } else {
                return {
                    items: [],
                    fields: [],
                    totalCount: 0,
                    message: '📝 No submissions found for this form.'
                };
            }
        } catch (error) {
            console.error('❌ [FORMS] Error loading submissions:', error);
            throw new Error(`Failed to load form submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        loadFormData,
        isLoading
    };
};