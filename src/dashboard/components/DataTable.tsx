// src/components/DataTable.tsx
import React from 'react';
import { Table, Text, TagList, TextButton } from '@wix/design-system';
import { Confirm, Dismiss } from '@wix/wix-ui-icons-common';
import { ProcessedDataItem, FormFieldData, DataType } from '../../types/dashboard';

interface DataTableProps {
    data: ProcessedDataItem[];
    fields: string[];
    dataType: DataType;
    maxColumns?: number;
}

const DataTable: React.FC<DataTableProps> = ({
    data,
    fields,
    dataType,
    maxColumns = 10
}) => {
    const tableColumns = data.length > 0 ? [
        {
            title: 'ID',
            render: (row: ProcessedDataItem) => (
                <Text size="small">{String(row.id || '')}</Text>
            ),
            width: '120px'
        },
        {
            title: 'Date',
            render: (row: ProcessedDataItem) => (
                <Text size="small">{String(row.date || '')}</Text>
            ),
            width: '100px'
        },
        {
            title: 'Status',
            render: (row: ProcessedDataItem) => (
                <Text size="small">{String(row.status || '')}</Text>
            ),
            width: '80px'
        },
        // Dynamic columns based on data type
        ...fields.slice(0, maxColumns).map(fieldName => ({
            title: fieldName.replace(/_[a-z0-9]+$/i, '').replace(/_/g, ' '),
            render: (row: ProcessedDataItem) => {
                const cellData = row[fieldName];

                if (dataType === 'form') {
                    return renderFormCell(cellData, fieldName);
                } else {
                    return renderCMSCell(cellData);
                }
            },
            width: '150px'
        }))
    ] : [];

    return (
        <div style={{
            overflowX: 'auto',
            maxWidth: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            width: '100%'
        }}>
            <div style={{
                minWidth: `${(fields.length + 3) * 150}px`
            }}>
                <Table
                    data={data}
                    columns={tableColumns}
                    skin="standard"
                />
            </div>
        </div>
    );
};

// Render form data cells with complex logic
const renderFormCell = (cellData: any, fieldName: string) => {
    if (!cellData || typeof cellData !== 'object') {
        return (
            <div style={{ maxWidth: '150px' }}>
                <Text size="small">{cellData ? String(cellData) : ''}</Text>
            </div>
        );
    }

    const data = cellData as FormFieldData;

    // Handle null values
    if (data.type === 'null') {
        return <div style={{ maxWidth: '150px' }}></div>;
    }

    // Handle boolean values with icons
    if (data.type === 'boolean') {
        return (
            <div style={{
                maxWidth: '150px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '4px'
            }}>
                {data.value ? (
                    <Confirm style={{ color: '#4CAF50', fontSize: '16px' }} />
                ) : (
                    <Dismiss style={{ color: '#F44336', fontSize: '16px' }} />
                )}
            </div>
        );
    }

    // Handle media arrays
    if (data.type === 'media-array') {
        return (
            <div style={{ maxWidth: '150px' }}>
                <Text size="small" secondary>
                    📎 {data.value.length} file{data.value.length !== 1 ? 's' : ''}
                </Text>
            </div>
        );
    }

    // Handle regular arrays with TagList
    if (data.type === 'array') {
        return (
            <div style={{ maxWidth: '150px' }}>
                <TagList
                    tags={data.value.slice(0, 3).map((item: any, index: number) => {
                        let displayValue;
                        if (typeof item === 'object' && item !== null) {
                            displayValue = item.name || item.title || item.label || item.value || 'Object';
                        } else {
                            displayValue = String(item);
                        }
                        return {
                            id: `${fieldName}-${index}`,
                            children: displayValue.length > 15 ? displayValue.substring(0, 15) + '...' : displayValue
                        };
                    })}
                    size="small"
                    maxVisibleTags={3}
                />
            </div>
        );
    }

    // Handle URLs as clickable TextButton
    if (data.type === 'url') {
        return (
            <div style={{ maxWidth: '150px' }}>
                <TextButton
                    as="a"
                    href={data.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    underline="onHover"
                    ellipsis
                >
                    {data.value.length > 25 ? data.value.substring(0, 25) + '...' : data.value}
                </TextButton>
            </div>
        );
    }

    // Handle regular text (default)
    return (
        <div style={{
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }}>
            <Text size="small" title={data.fullValue || data.value}>
                {data.value}
            </Text>
        </div>
    );
};

// Render CMS data cells with simple logic
const renderCMSCell = (cellData: any) => {
    const stringValue = String(cellData || '');
    return (
        <div style={{
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }}>
            <Text size="small">{stringValue}</Text>
        </div>
    );
};

export default DataTable;