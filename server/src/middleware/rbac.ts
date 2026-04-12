import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';

// ─── Permission Definitions ────────────

export const PERMISSIONS = {
  // Package permissions
  PACKAGE_VIEW: 'package:view',
  PACKAGE_CREATE: 'package:create',
  PACKAGE_UPDATE: 'package:update',
  PACKAGE_DELETE: 'package:delete',

  // Trip permissions
  TRIP_VIEW_OWN: 'trip:view_own',
  TRIP_VIEW_ALL: 'trip:view_all',
  TRIP_CREATE: 'trip:create',
  TRIP_DELETE_OWN: 'trip:delete_own',
  TRIP_DELETE_ALL: 'trip:delete_all',

  // Booking permissions
  BOOKING_VIEW_OWN: 'booking:view_own',
  BOOKING_VIEW_ALL: 'booking:view_all',
  BOOKING_CREATE: 'booking:create',
  BOOKING_UPDATE: 'booking:update',
  BOOKING_CANCEL_OWN: 'booking:cancel_own',
  BOOKING_CANCEL_ALL: 'booking:cancel_all',

  // User permissions
  USER_VIEW_OWN: 'user:view_own',
  USER_VIEW_ALL: 'user:view_all',
  USER_UPDATE_OWN: 'user:update_own',
  USER_UPDATE_ALL: 'user:update_all',
  USER_DELETE: 'user:delete',

  // Review permissions
  REVIEW_CREATE: 'review:create',
  REVIEW_DELETE_OWN: 'review:delete_own',
  REVIEW_DELETE_ALL: 'review:delete_all',

  // Admin permissions
  AUDIT_VIEW: 'audit:view',
  SYSTEM_CONFIG: 'system:config',
  UPLOAD_FILES: 'upload:files',
} as const;

// ─── Role → Permission Mapping ─────────

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  USER: [
    PERMISSIONS.PACKAGE_VIEW,
    PERMISSIONS.TRIP_VIEW_OWN,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_CANCEL_OWN,
    PERMISSIONS.USER_VIEW_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.REVIEW_CREATE,
    PERMISSIONS.REVIEW_DELETE_OWN,
    PERMISSIONS.UPLOAD_FILES,
  ],
  STAFF: [
    PERMISSIONS.PACKAGE_VIEW,
    PERMISSIONS.PACKAGE_CREATE,
    PERMISSIONS.PACKAGE_UPDATE,
    PERMISSIONS.TRIP_VIEW_OWN,
    PERMISSIONS.TRIP_VIEW_ALL,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_VIEW_ALL,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL_OWN,
    PERMISSIONS.USER_VIEW_OWN,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.REVIEW_CREATE,
    PERMISSIONS.REVIEW_DELETE_OWN,
    PERMISSIONS.UPLOAD_FILES,
  ],
  ADMIN: [
    PERMISSIONS.PACKAGE_VIEW,
    PERMISSIONS.PACKAGE_CREATE,
    PERMISSIONS.PACKAGE_UPDATE,
    PERMISSIONS.PACKAGE_DELETE,
    PERMISSIONS.TRIP_VIEW_OWN,
    PERMISSIONS.TRIP_VIEW_ALL,
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_DELETE_OWN,
    PERMISSIONS.TRIP_DELETE_ALL,
    PERMISSIONS.BOOKING_VIEW_OWN,
    PERMISSIONS.BOOKING_VIEW_ALL,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_UPDATE,
    PERMISSIONS.BOOKING_CANCEL_OWN,
    PERMISSIONS.BOOKING_CANCEL_ALL,
    PERMISSIONS.USER_VIEW_OWN,
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_UPDATE_ALL,
    PERMISSIONS.REVIEW_CREATE,
    PERMISSIONS.REVIEW_DELETE_OWN,
    PERMISSIONS.REVIEW_DELETE_ALL,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.UPLOAD_FILES,
  ],
  SUPERADMIN: Object.values(PERMISSIONS),
};

// ─── Middleware Factories ───────────────

/**
 * Require the user to have specific role(s).
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Requires one of roles: ${roles.join(', ')}`));
    }

    next();
  };
}

/**
 * Require the user to have specific permission(s).
 * All listed permissions must be present.
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const missingPermissions = permissions.filter((p) => !userPermissions.includes(p));

    if (missingPermissions.length > 0) {
      return next(
        new ForbiddenError(`Missing permissions: ${missingPermissions.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Require the user to have at least one of the specified permissions.
 */
export function requireAnyPermission(...permissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    const userPermissions = req.user.permissions || [];
    const hasAny = permissions.some((p) => userPermissions.includes(p));

    if (!hasAny) {
      return next(
        new ForbiddenError(`Requires one of permissions: ${permissions.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Get permissions for a given role.
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
