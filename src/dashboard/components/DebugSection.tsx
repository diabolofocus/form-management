// src/components/DebugSection.tsx
import React from 'react';
import { Text, Button } from '@wix/design-system';

interface DebugSectionProps {
    realFormsCount: number;
    availableApps: string;
    selectedForm: string;
    onRefreshForms: () => Promise<void>;
    onTestCMS: () => Promise<void>;
    onDebugCollection: () => Promise<void>;
    onShowHelp: () => void;
}

const DebugSection: React.FC<DebugSectionProps> = ({
    realFormsCount,
    availableApps,
    selectedForm,
    onRefreshForms,
    onTestCMS,
    onDebugCollection,
    onShowHelp
}) => {
    return (
        <div style={{
            marginBottom: '16px',
            padding: '8px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            fontSize: '12px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
            }}>
                <Text size="small" weight="bold">
                    🔍 Found {realFormsCount} forms
                </Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        onClick={onRefreshForms}
                        size="tiny"
                        skin="light"
                    >
                        🔄 Refresh
                    </Button>
                    <Button
                        onClick={onTestCMS}
                        size="tiny"
                        skin="light"
                    >
                        🧪 Test CMS
                    </Button>
                    <Button
                        onClick={onDebugCollection}
                        size="tiny"
                        skin="light"
                        disabled={!selectedForm}
                    >
                        🔍 Debug
                    </Button>
                    <Button
                        onClick={onShowHelp}
                        size="tiny"
                        skin="light"
                    >
                        💡 Help
                    </Button>
                </div>
            </div>

            {availableApps && (
                <div style={{
                    fontSize: '11px',
                    color: '#666',
                    maxHeight: '60px',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    padding: '6px',
                    borderRadius: '3px',
                    border: '1px solid #eee'
                }}>
                    {availableApps}
                </div>
            )}
        </div>
    );
};

export default DebugSection;