import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: File uploads are not available on Vercel serverless functions
// as the filesystem is ephemeral. This endpoint returns an error message.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Vercel serverless functions have ephemeral filesystems
  // Uploaded files won't persist between deployments
  res.status(503).json({ 
    error: 'Image upload is not available on this deployment',
    message: 'For production file storage, integrate with Vercel Blob, AWS S3, or similar cloud storage services'
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};