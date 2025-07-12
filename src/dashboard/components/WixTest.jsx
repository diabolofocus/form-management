// src/components/WixTest.jsx
import React, { useState } from 'react';
import { submissions } from '@wix/forms';
import { auth } from '@wix/essentials';

const WixTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const addResult = (test, result, error = null) => {
        setTestResults(prev => [...prev, {
            test,
            result,
            error,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const runTests = async () => {
        setLoading(true);
        setTestResults([]);

        // Test 1: Check if Wix SDK is loaded
        addResult('Wix SDK Loading', submissions ? '✅ @wix/forms loaded' : '❌ @wix/forms not loaded');
        addResult('Auth SDK Loading', auth ? '✅ @wix/essentials loaded' : '❌ @wix/essentials not loaded');

        if (!submissions || !auth) {
            setLoading(false);
            return;
        }

        // Test 2: Try to create elevated function
        try {
            const elevatedQuery = auth.elevate(submissions.querySubmissionsByNamespace);
            addResult('Create Elevated Function', '✅ Successfully created elevated function');

            // Test 3: Try basic query
            try {
                console.log('Attempting basic query...');
                const query = elevatedQuery().eq('namespace', 'wix.form_app.form').limit(1);
                addResult('Build Query', '✅ Successfully built query');

                // Test 4: Execute query
                try {
                    console.log('Executing query...');
                    const result = await query.find();
                    console.log('Query result:', result);

                    addResult('Execute Query', `✅ Query executed - Found ${result.items?.length || 0} items`);

                    if (result.items && result.items.length > 0) {
                        addResult('Sample Data', `✅ First item ID: ${result.items[0]._id || 'No ID'}`);
                        addResult('Sample Data', `✅ First item formId: ${result.items[0].formId || 'No formId'}`);
                        addResult('Sample Data', `✅ First item namespace: ${result.items[0].namespace || 'No namespace'}`);
                        console.log('Sample submission:', result.items[0]);
                    } else {
                        addResult('No Data', '⚠️ Query successful but no submissions found');
                    }
                } catch (queryError) {
                    console.error('Query execution error:', queryError);
                    addResult('Execute Query', '❌ Query execution failed', queryError.message);
                }
            } catch (buildError) {
                console.error('Query building error:', buildError);
                addResult('Build Query', '❌ Failed to build query', buildError.message);
            }
        } catch (elevateError) {
            console.error('Elevation error:', elevateError);
            addResult('Create Elevated Function', '❌ Failed to create elevated function', elevateError.message);
        }

        setLoading(false);
    };

    const testApiEndpoint = async () => {
        setTestResults([]);
        addResult('API Test', 'Testing API endpoint...');

        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getForms',
                    namespace: 'wix.form_app.form'
                })
            });

            const data = await response.json();

            if (response.ok) {
                addResult('API Endpoint', `✅ API responded successfully`);
                addResult('API Data', `✅ Forms found: ${data.forms?.length || 0}`);
                if (data.forms && data.forms.length > 0) {
                    data.forms.forEach((form, index) => {
                        addResult(`Form ${index + 1}`, `${form.formName} (${form.submissionCount} submissions)`);
                    });
                }
            } else {
                addResult('API Endpoint', `❌ API error: ${response.status}`, data.error);
            }
        } catch (error) {
            addResult('API Endpoint', '❌ API request failed', error.message);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
            <h2>Wix SDK Test</h2>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={runTests}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px 20px' }}
                >
                    {loading ? 'Testing...' : 'Test Wix SDK'}
                </button>

                <button
                    onClick={testApiEndpoint}
                    style={{ padding: '10px 20px' }}
                >
                    Test API Endpoint
                </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', padding: '10px' }}>
                {testResults.map((result, index) => (
                    <div key={index} style={{ marginBottom: '5px', fontFamily: 'monospace' }}>
                        <strong>[{result.timestamp}]</strong> {result.test}: {result.result}
                        {result.error && (
                            <div style={{ color: 'red', marginLeft: '20px', fontSize: '12px' }}>
                                Error: {result.error}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WixTest;