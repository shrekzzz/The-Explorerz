import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImages, deleteUploadedImage, upload } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/single',
  authenticate,
  requirePermission(PERMISSIONS.UPLOAD_FILES),
  uploadLimiter,
  upload.single('image'),
  uploadSingleImage
);

router.post('/multiple',
  authenticate,
  requirePermission(PERMISSIONS.UPLOAD_FILES),
  uploadLimiter,
  upload.array('images', 5),
  uploadMultipleImages
);

router.delete('/',
  authenticate,
  requirePermission(PERMISSIONS.UPLOAD_FILES),
  deleteUploadedImage
);

export default router;
