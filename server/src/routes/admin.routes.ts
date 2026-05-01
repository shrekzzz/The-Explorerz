import { Router } from 'express';
import {
  getDashboardStats,
  listUsers,
  updateUserRole,
  toggleUserActive,
  getAdminAuditLogs,
  getRevenueAnalytics,
  getPackageAnalytics,
  getUserActivityLogs,
  getSystemHealth,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPERADMIN'));

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/analytics/packages', getPackageAnalytics);
router.get('/system/health', getSystemHealth);

// User Management
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

// Activity & Audit Logs
router.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_VIEW), getAdminAuditLogs);
router.get('/activity', getUserActivityLogs);
router.get('/activity/:userId', getUserActivityLogs);

export default router;
