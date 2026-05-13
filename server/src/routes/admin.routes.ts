import { Router } from 'express';
import { getDashboardStats, listUsers, createUser, updateUserRole, toggleUserActive, getAdminAuditLogs, listAllTrips } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('SUPERADMIN', 'STAFF'));

router.get('/dashboard', getDashboardStats);
router.get('/users', requirePermission(PERMISSIONS.USER_VIEW_ALL), listUsers);
router.post('/users', requirePermission(PERMISSIONS.USER_UPDATE_ALL), createUser);
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
router.get('/trips', listAllTrips);

export default router;
