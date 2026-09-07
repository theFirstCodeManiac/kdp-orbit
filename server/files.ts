import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { requireAuth, AuthenticatedRequest } from './auth.ts';

export const filesRouter = express.Router();

const STORAGE_DIR = path.join(process.cwd(), '.storage', 'uploads');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Allowed MIME types and corresponding extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    // Generate safe filename (uuid)
    const ext = path.extname(file.originalname).toLowerCase();
    const safeFilename = crypto.randomUUID() + ext;
    cb(null, safeFilename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid MIME type. Only JPEG, PNG, and WEBP are allowed.'));
    }
    // Validate Extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file extension.'));
    }
    cb(null, true);
  }
});

// A simple in-memory map to store file ownership
// In a real app, this goes to the DB
export const fileOwnership = new Map<string, string>(); // fileId -> userId

filesRouter.post('/upload', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  // Use multer middleware
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
         return res.status(400).json({ success: false, error: 'File size exceeds the 5MB limit.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const fileId = req.file.filename;
    fileOwnership.set(fileId, req.user!.id);

    // Return a path that the client can use to fetch the file
    res.json({
      success: true,
      data: {
        fileId,
        url: `/api/files/${fileId}`
      }
    });
  });
});

// Download/View file
filesRouter.get('/:fileId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { fileId } = req.params;
  const userId = req.user!.id;

  // Prevent path traversal
  if (!/^[0-9a-fA-F-]+(?:\.(?:jpg|jpeg|png|webp))?$/.test(fileId)) {
    return res.status(400).json({ success: false, error: 'Invalid file ID format.' });
  }

  // Ensure user can only access their own private files
  const ownerId = fileOwnership.get(fileId);
  if (!ownerId) {
    return res.status(404).json({ success: false, error: 'File not found.' });
  }

  if (ownerId !== userId) {
    return res.status(403).json({ success: false, error: 'Access denied.' });
  }

  const filePath = path.join(STORAGE_DIR, fileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found on disk.' });
  }

  // Prevent execution by forcing content disposition or correct content types
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  res.sendFile(filePath);
});

