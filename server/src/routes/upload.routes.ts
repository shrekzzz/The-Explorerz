import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImages, deleteUploadedImage, upload, uploadPPT, uploadDoc } from '../controllers/upload.controller.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/single',
  uploadLimiter,
  upload.single('image'),
  uploadSingleImage
);

router.post('/multiple',
  uploadLimiter,
  upload.array('images', 5),
  uploadMultipleImages
);

router.delete('/',
  deleteUploadedImage
);

router.post('/ppt',
  uploadLimiter,
  uploadDoc.single('ppt'),
  uploadPPT
);

export default router;
