import { Request, Response, NextFunction } from 'express';
import {
  sendVerificationEmail,
  verifyEmail,
  initiatePasswordReset,
  resetPassword,
  changePassword,
} from '../services/account.service.js';
import { logAuditEvent } from '../services/audit.service.js';

export async function requestVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { default: prisma } = await import('../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, firstName: true, isEmailVerified: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'User not found' } });
      return;
    }
    if (user.isEmailVerified) {
      res.json({ success: true, message: 'Email already verified' });
      return;
    }

    await sendVerificationEmail(user.id, user.email, user.firstName);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    next(err);
  }
}

export async function confirmVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: { message: 'Token required' } });
      return;
    }

    const result = await verifyEmail(token);
    await logAuditEvent(null, 'EMAIL_VERIFIED', 'user', null, { email: result.email }, req.ip);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { message: 'Email required' } });
      return;
    }

    await initiatePasswordReset(email);
    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
  } catch (err) {
    next(err);
  }
}

export async function handleResetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, error: { message: 'Token and password required' } });
      return;
    }

    await resetPassword(token, password);
    res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (err) {
    next(err);
  }
}

export async function handleChangePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
    await logAuditEvent(req.user!.userId, 'PASSWORD_CHANGED', 'user', req.user!.userId, {}, req.ip);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}
