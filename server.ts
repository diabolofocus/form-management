import express from 'express';
import { handleGetForms, handleGetSubmissions } from './src/backend/exports';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Simple request handler wrapper
const handleApiRequest = (handler: (req: Request) => Promise<Response>) => {
    return async (expressReq: express.Request, expressRes: express.Response) => {
        try {
            // Convert Express request to standard Request object
            const url = new URL(expressReq.originalUrl, `http://${expressReq.hostname}`);
            const headers = new Headers();
            
            Object.entries(expressReq.headers).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(v => headers.append(key, v));
                } else if (value) {
                    headers.set(key, value);
                }
            });

            const request = new Request(url.toString(), {
                method: expressReq.method,
                headers,
                body: expressReq.method !== 'GET' && expressReq.method !== 'HEAD' 
                    ? JSON.stringify(expressReq.body) 
                    : undefined
            });

            // Handle the request
            const response = await handler(request);

            // Convert Response to Express response
            const responseBody = await response.json();
            expressRes
                .status(response.status)
                .set(Object.fromEntries(response.headers.entries()))
                .json(responseBody);
        } catch (error) {
            console.error('Error handling request:', error);
            expressRes.status(500).json({ error: 'Internal server error' });
        }
    };
};

// Define API routes
app.get('/_api/forms', handleApiRequest(handleGetForms));
app.get('/_api/submissions', handleApiRequest(handleGetSubmissions));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET  /_api/forms`);
    console.log(`  GET  /_api/submissions`);
});
