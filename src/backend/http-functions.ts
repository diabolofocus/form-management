import { handleGetForms, handleGetSubmissions } from './exports';

// These functions are designed to work with standard web APIs
// They can be used with any HTTP server framework (Express, Fastify, etc.)

/**
 * Handle GET /_api/forms request
 */
export async function handleFormsRequest(request: Request): Promise<Response> {
    try {
        return await handleGetForms(request);
    } catch (error) {
        console.error('Error in handleFormsRequest:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Handle GET /_api/submissions request
 */
export async function handleSubmissionsRequest(request: Request): Promise<Response> {
    try {
        return await handleGetSubmissions(request);
    } catch (error) {
        console.error('Error in handleSubmissionsRequest:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Main request handler that routes requests to the appropriate handler
 */
export async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/_api/forms') {
        return handleFormsRequest(request);
    } else if (path === '/_api/submissions') {
        return handleSubmissionsRequest(request);
    }

    return new Response(
        JSON.stringify({ error: 'Not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
}
