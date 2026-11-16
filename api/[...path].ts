import app from '../server';

// Keep the raw multipart request stream available to Multer for image uploads.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Vercel routes /api/* requests through the Express API application.
export default app;
