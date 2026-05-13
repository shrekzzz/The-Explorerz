import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { logAuditEvent } from '../services/audit.service.js';

// Registration removed — admin-only auth flow
// Admins can create users via admin.controller.ts → createUser

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.loginUser(
      req.body,
      req.ip || null,
      req.headers['user-agent'] || null
    );

    setRefreshTokenCookie(res, result.tokens.refreshToken);

    await logAuditEvent(result.user.id, 'USER_LOGIN', 'user', result.user.id, {}, req.ip);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token provided' },
      });
      return;
    }

    const tokens = await authService.refreshTokens(
      token,
      req.ip || null,
      req.headers['user-agent'] || null
    );

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logoutUser(token);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.userId) {
      await authService.logoutAllSessions(req.user.userId);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
    });

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { default: prisma } = await import('../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isEmailVerified: true,
        phone: true,
        createdAt: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// ─── Helpers ────────────────────────────

function setRefreshTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}
