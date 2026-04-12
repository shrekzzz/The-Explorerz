import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../services/upload.service.js';
import { BadRequestError } from '../utils/errors.js';

// ─── Multer Configuration ───────────────

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,                   // Max 5 files per request
  },
});

// ─── Controllers ────────────────────────

export async function uploadSingleImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new BadRequestError('No file uploaded');

    const folder = (req.query.folder as string) || 'explorerz';
    const result = await uploadImage(req.file.buffer, req.file.originalname, folder);

    res.status(201).json({
      success: true,
      data: {
        url: result.secureUrl,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadMultipleImages(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    const folder = (req.query.folder as string) || 'explorerz';
    const files = req.files as Express.Multer.File[];
    const results = await Promise.all(
      files.map((file) => uploadImage(file.buffer, file.originalname, folder))
    );

    res.status(201).json({
      success: true,
      data: results.map((r) => ({
        url: r.secureUrl,
        publicId: r.publicId,
        width: r.width,
        height: r.height,
        format: r.format,
        bytes: r.bytes,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteUploadedImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { publicId } = req.body;
    if (!publicId) throw new BadRequestError('publicId is required');

    await deleteImage(publicId);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    next(err);
  }
}
