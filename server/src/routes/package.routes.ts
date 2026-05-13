import { Router } from 'express';
import { listPackages, getPackage, createPackage, updatePackage, deletePackage } from '../controllers/package.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createPackageSchema, updatePackageSchema, packageQuerySchema } from '../validators/package.schema.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

// Public routes
router.get('/', optionalAuth, validateQuery(packageQuerySchema), listPackages);
router.get('/:id', optionalAuth, getPackage);

// Protected routes (staff+ can create/update, admin+ can delete)
router.post('/',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGE_CREATE),
  validateBody(createPackageSchema),
  auditLog({ action: 'PACKAGE_CREATE', resource: 'package' }),
  createPackage
);

router.put('/:id',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGE_UPDATE),
  validateBody(updatePackageSchema),
  auditLog({ action: 'PACKAGE_UPDATE', resource: 'package' }),
  updatePackage
);

router.delete('/:id',
  authenticate,
  requirePermission(PERMISSIONS.PACKAGE_DELETE),
  auditLog({ action: 'PACKAGE_DELETE', resource: 'package' }),
  deletePackage
);

export default router;
