// src/backend/cms.web.ts
import { webMethod, Permissions } from '@wix/web-methods';
import { items, collections } from '@wix/data';
import { auth } from '@wix/essentials';

const elevatedQuery = auth.elevate(items.query);
const elevatedListCollections = auth.elevate(collections.listDataCollections);
const elevatedGetDataCollection = auth.elevate(collections.getDataCollection);

// Get CMS collection items using direct data API
export const getCMSItems = webMethod(
    Permissions.Anyone,
    async (collectionId: string, limit: number = 50): Promise<{
        items: any[];
        totalCount: number;
        hasNext: boolean;
        hasPrev: boolean;
        collectionInfo?: any;
    }> => {
        try {
            console.log(`🔄 Loading CMS items from collection: ${collectionId}`);

            // First get collection metadata
            let collectionInfo = null;
            try {
                collectionInfo = await elevatedGetDataCollection(collectionId);
                console.log('Collection metadata:', collectionInfo);
            } catch (metaError) {
                console.log('Could not get collection metadata:', metaError);
            }

            // Query the collection items
            const query = elevatedQuery(collectionId)
                .descending('_createdDate')
                .limit(limit);

            const result = await query.find({
                returnTotalCount: true,
                consistentRead: true
            });

            console.log(`✅ Found ${result.items.length} items in collection ${collectionId}`);
            console.log('Sample item:', result.items[0]);

            return {
                items: result.items,
                totalCount: result.totalCount || result.items.length,
                hasNext: result.hasNext(),
                hasPrev: result.hasPrev(),
                collectionInfo
            };
        } catch (error) {
            console.error('Error loading CMS items:', error);
            throw new Error(`Failed to load CMS items: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
);

// Get collection metadata using getDataCollection
export const getCollectionMetadata = webMethod(
    Permissions.Anyone,
    async (collectionId: string): Promise<{
        id: string;
        displayName: string;
        fields: Array<{
            key: string;
            displayName: string;
            type: string;
        }>;
    } | null> => {
        try {
            const collection = await elevatedGetDataCollection(collectionId);

            if (!collection || !collection._id) {
                return null;
            }

            return {
                id: collection._id,
                displayName: collection.displayName || 'Unknown Collection',
                fields: (collection.fields || [])
                    .filter(field => field.key && field.displayName) // Only include fields with valid key and displayName
                    .map(field => ({
                        key: field.key!,
                        displayName: field.displayName!,
                        type: String(field.type || 'TEXT')
                    }))
            };
        } catch (error) {
            console.error('Error getting collection metadata:', error);
            return null;
        }
    }
);

// Test function to verify CMS connection
export const testCMSConnection = webMethod(
    Permissions.Anyone,
    async (): Promise<string> => {
        try {
            const collectionsResult = await elevatedListCollections({
                paging: { limit: 5, offset: 0 }
            });

            return `✅ CMS connection working! Found ${collectionsResult.collections?.length || 0} collections.`;
        } catch (error) {
            return `❌ CMS connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
);

// Debug function to check if a collection ID exists and what type it is
export const debugCollectionType = webMethod(
    Permissions.Anyone,
    async (collectionId: string): Promise<string> => {
        try {
            console.log(`🔍 Debugging collection: ${collectionId}`);

            // Check if it's in the collections list
            const collectionsResult = await elevatedListCollections({
                paging: { limit: 100, offset: 0 }
            });

            const foundCollection = collectionsResult.collections?.find(c => c._id === collectionId);

            if (foundCollection) {
                return `✅ Collection found: ${foundCollection.displayName} (Type: ${foundCollection.collectionType})`;
            } else {
                return `❌ Collection not found in collections list`;
            }
        } catch (error) {
            return `❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
);