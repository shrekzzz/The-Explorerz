import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { sendEnquiryConfirmationEmail, sendEnquiryNotificationEmail } from '../services/email.service.js';
import { logAuditEvent } from '../services/audit.service.js';
import logger from '../utils/logger.js';
import { format } from 'date-fns';

// ─── Create Enquiry (Public) ────────────

export async function createEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      email,
      phone,
      city,
      packageTitle,
      packagePrice,
      numberOfPeople,
      travelDate,
      selectedRoute,
      budgetMin,
      budgetMax,
      remarks,
    } = req.body;

    // Create enquiry in database
    const enquiry = await prisma.enquiry.create({
      data: {
        name,
        email,
        phone,
        city,
        packageTitle,
        packagePrice,
        numberOfPeople,
        travelDate: travelDate ? new Date(travelDate) : null,
        selectedRoute,
        budgetMin,
        budgetMax,
        remarks: remarks || null,
        status: 'NEW',
      },
    });

    // Send response immediately (don't wait for emails)
    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. Check your email for confirmation.',
      data: { id: enquiry.id },
    });

    // Send emails asynchronously in the background
    setImmediate(async () => {
      try {
        // Send confirmation email to user
        try {
          await sendEnquiryConfirmationEmail(email, name, packageTitle);
        } catch (emailErr) {
          logger.error({ err: emailErr, enquiryId: enquiry.id }, 'Failed to send confirmation email');
        }

        // Send notification email to admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM;
        if (adminEmail) {
          try {
            await sendEnquiryNotificationEmail(adminEmail, {
              name,
              email,
              phone,
              city,
              packageTitle,
              numberOfPeople,
              travelDate: travelDate ? format(new Date(travelDate), 'PPP') : 'Not specified',
              budgetMin,
              budgetMax,
              remarks: remarks || 'None',
            });
          } catch (emailErr) {
            logger.error({ err: emailErr, enquiryId: enquiry.id }, 'Failed to send admin notification email');
          }
        }

        // Log audit event
        await logAuditEvent(null, 'ENQUIRY_CREATED', 'enquiry', enquiry.id, { packageTitle }, req.ip);
      } catch (err) {
        logger.error({ err }, 'Error in background enquiry processing');
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── List Enquiries (Admin) ─────────────

export async function listEnquiries(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.enquiry.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        enquiries,
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

// ─── Update Enquiry Status (Admin) ──────

export async function updateEnquiryStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const enquiry = await prisma.enquiry.update({
      where: { id: id as string },
      data: { status },
    });

    await logAuditEvent(
      req.user?.userId || null,
      'ENQUIRY_STATUS_UPDATED',
      'enquiry',
      id as string,
      { oldStatus: enquiry.status, newStatus: status },
      req.ip
    );

    res.json({
      success: true,
      message: 'Enquiry status updated successfully',
      data: enquiry,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get Enquiry Stats (Admin) ──────────

export async function getEnquiryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [total, newCount, contactedCount, convertedCount, closedCount] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.enquiry.count({ where: { status: 'CONTACTED' } }),
      prisma.enquiry.count({ where: { status: 'CONVERTED' } }),
      prisma.enquiry.count({ where: { status: 'CLOSED' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          NEW: newCount,
          CONTACTED: contactedCount,
          CONVERTED: convertedCount,
          CLOSED: closedCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
