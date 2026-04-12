import { Router } from 'express';
import { getDashboardStats, listUsers, updateUserRole, toggleUserActive, getAdminAuditLogs } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPERADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/users', requirePermission(PERMISSIONS.USER_VIEW_ALL), listUsers);
router.patch('/users/:id/role',
  requirePermission(PERMISSIONS.USER_UPDATE_ALL),
  auditLog({ action: 'USER_ROLE_UPDATE', resource: 'user' }),
  updateUserRole
);
router.patch('/users/:id/toggle-active',
  requirePermission(PERMISSIONS.USER_UPDATE_ALL),
  auditLog({ action: 'USER_TOGGLE_ACTIVE', resource: 'user' }),
  toggleUserActive
);
router.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_VIEW), getAdminAuditLogs);

export default router;
