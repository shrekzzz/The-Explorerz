import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { logAuditEvent } from '../services/audit.service.js';
import logger from '../utils/logger.js';
import { sendConsentFormConfirmationEmail, sendConsentFormNotificationEmail } from '../services/email.service.js';
import { format } from 'date-fns';

// ─── Create Consent Form (Public) ───────

export async function createConsentForm(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body;

    // Create consent form in database
    const consentForm = await prisma.consentForm.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        nationality: data.nationality,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        emergencyName: data.emergencyName,
        emergencyPhone: data.emergencyPhone,
        emergencyRelation: data.emergencyRelation,
        packageName: data.packageName,
        travelDate: new Date(data.travelDate),
        numberOfTravelers: data.numberOfTravelers,
        medicalConditions: data.medicalConditions || null,
        allergies: data.allergies || null,
        medications: data.medications || null,
        bloodGroup: data.bloodGroup || null,
        photoUrl: data.photoUrl || null,
        photoPublicId: data.photoPublicId || null,
        idProofUrl: data.idProofUrl || null,
        idProofPublicId: data.idProofPublicId || null,
        idProofType: data.idProofType || null,
        idNumber: data.idNumber || null,
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
        medicalConsent: data.medicalConsent,
        photoConsent: data.photoConsent,
        specialRequests: data.specialRequests || null,
        dietaryPreference: data.dietaryPreference || null,
        status: 'PENDING',
      },
    });

    // Send emails asynchronously (non-blocking) to avoid timeout
    // Don't await - let them run in background
    const travelDateFormatted = format(new Date(data.travelDate), 'PPP');
    
    // Send confirmation email to user (fire and forget)
    sendConsentFormConfirmationEmail(
      data.email,
      data.fullName,
      data.packageName,
      travelDateFormatted
    ).catch((emailErr) => {
      logger.error({ err: emailErr, consentFormId: consentForm.id }, 'Failed to send confirmation email');
    });

    // Send notification email to admin (fire and forget)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM;
    if (adminEmail) {
      sendConsentFormNotificationEmail(adminEmail, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        packageName: data.packageName,
        travelDate: travelDateFormatted,
        numberOfTravelers: data.numberOfTravelers,
      }).catch((emailErr) => {
        logger.error({ err: emailErr, consentFormId: consentForm.id }, 'Failed to send admin notification');
      });
    }

    // Log audit event
    await logAuditEvent(null, 'CONSENT_FORM_CREATED', 'consent_form', consentForm.id, { packageName: data.packageName }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Consent form submitted successfully. Check your email for confirmation.',
      data: { id: consentForm.id },
    });
  } catch (err) {
    next(err);
  }
}

// ─── List Consent Forms (Admin) ─────────

export async function listConsentForms(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [consentForms, total] = await Promise.all([
      prisma.consentForm.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.consentForm.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        consentForms,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Consent Form Details (Admin) ───

export async function getConsentFormDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const consentForm = await prisma.consentForm.findUnique({
      where: { id: id as string },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!consentForm) {
      res.status(404).json({
        success: false,
        error: { message: 'Consent form not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: consentForm,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Update Consent Form Status (Admin) ─

export async function updateConsentFormStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const reviewerId = req.user?.userId;

    const consentForm = await prisma.consentForm.update({
      where: { id: id as string },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await logAuditEvent(
      reviewerId || null,
      'CONSENT_FORM_STATUS_UPDATED',
      'consent_form',
      id as string,
      { newStatus: status, adminNotes },
      req.ip
    );

    res.json({
      success: true,
      message: 'Consent form status updated successfully',
      data: consentForm,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Consent Form Stats (Admin) ─────

export async function getConsentFormStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.consentForm.count(),
      prisma.consentForm.count({ where: { status: 'PENDING' } }),
      prisma.consentForm.count({ where: { status: 'APPROVED' } }),
      prisma.consentForm.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          PENDING: pendingCount,
          APPROVED: approvedCount,
          REJECTED: rejectedCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
