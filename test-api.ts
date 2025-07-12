import { handleGetForms, handleGetSubmissions } from './src/backend/api';

// Test the API handlers directly
async function testApi() {
    console.log('Testing API handlers...');

    // Test handleGetForms
    console.log('\n=== Testing handleGetForms ===');
    const formsRequest = new Request('http://localhost:3000/_api/forms?namespace=wix.form_app.form');
    const formsResponse = await handleGetForms(formsRequest);
    const formsData = await formsResponse.json();
    console.log('Forms response status:', formsResponse.status);
    console.log('Forms data:', JSON.stringify(formsData, null, 2));

    if (formsData.forms && formsData.forms.length > 0) {
        const formId = formsData.forms[0].formId;
        
        // Test handleGetSubmissions with the first form
        console.log('\n=== Testing handleGetSubmissions ===');
        const submissionsRequest = new Request(
            `http://localhost:3000/_api/submissions?namespace=wix.form_app.form&formId=${formId}&limit=5`
        );
        const submissionsResponse = await handleGetSubmissions(submissionsRequest);
        const submissionsData = await submissionsResponse.json();
        console.log('Submissions response status:', submissionsResponse.status);
        console.log('Submissions data:', JSON.stringify({
            items: submissionsData.items?.length || 0,
            totalCount: submissionsData.totalCount,
            hasNext: submissionsData.hasNext,
            hasPrev: submissionsData.hasPrev
        }, null, 2));
    } else {
        console.log('No forms found to test submissions');
    }
}

testApi().catch(console.error);
