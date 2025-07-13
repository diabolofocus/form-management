// src/hooks/useCMSData.ts
import { useState, useCallback } from 'react';
import { DataLoadResult, CMSItem } from '../types/dashboard';
import { processCMSItems, extractCMSFieldNames } from '../utils/dataProcessing';

export const useCMSData = () => {
    const [isLoading, setIsLoading] = useState(false);

    const loadCMSData = useCallback(async (
        collectionId: string,
        limit: number = 25
    ): Promise<DataLoadResult> => {
        setIsLoading(true);
        try {
            console.log('🔄 [CMS] Loading CMS collection items:', collectionId);

            // Debug the collection type first
            const { debugCollectionType } = await import('../backend/cms.web');
            const debugResult = await debugCollectionType(collectionId);
            console.log('🔍 Collection debug:', debugResult);

            // Get CMS items
            const { getCMSItems } = await import('../backend/cms.web');
            const cmsData = await getCMSItems(collectionId, limit);

            console.log('✅ [CMS] Items loaded:', cmsData);
            console.log('📊 [CMS] Number of items:', cmsData.items.length);

            if (cmsData.items.length > 0) {
                // Extract field names (limit for performance)
                const fieldNames = extractCMSFieldNames(cmsData.items, 15);

                console.log('📋 [CMS] Field names extracted:', fieldNames);

                // Process CMS items
                const processedItems = processCMSItems(cmsData.items, fieldNames);

                console.log('✅ [CMS] Display items prepared:', processedItems.length);

                return {
                    items: processedItems,
                    fields: fieldNames,
                    totalCount: cmsData.totalCount || processedItems.length,
                    message: `✅ Loaded ${processedItems.length} items from selected collection!`
                };
            } else {
                return {
                    items: [],
                    fields: [],
                    totalCount: 0,
                    message: '📝 No items found in this collection. Collection might be empty or you might not have read permissions.'
                };
            }
        } catch (error) {
            console.error('❌ [CMS] Error loading collection:', error);
            throw new Error(`Failed to load CMS collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        loadCMSData,
        isLoading
    };
};