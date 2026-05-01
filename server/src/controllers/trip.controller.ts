import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { generateShareToken } from '../utils/crypto.js';
import { CreateTripInput, TripQuery } from '../validators/trip.schema.js';
import { paramId } from '../utils/params.js';

export async function listTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as TripQuery;
    const { page, limit, destination, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user!.userId };
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({
      success: true,
      data: trips,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: paramId(req, 'id') },
      include: {
        itinerary: {
          include: { activities: true },
          orderBy: { dayNumber: 'asc' },
        },
        hotels: true,
      },
    });

    if (!trip) throw new NotFoundError('Trip not found');

    // Check ownership or public
    if (trip.userId !== req.user?.userId && !trip.isPublic) {
      throw new ForbiddenError('You do not have access to this trip');
    }

    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function getSharedTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { shareToken: paramId(req, 'token') },
      include: {
        itinerary: {
          include: { activities: true },
          orderBy: { dayNumber: 'asc' },
        },
        hotels: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (!trip) throw new NotFoundError('Shared trip not found');
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function createTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateTripInput;

    const trip = await prisma.trip.create({
      data: {
        userId: req.user!.userId,
        destination: data.destination,
        days: data.days,
        budget: data.budget,
        interests: data.interests,
        budgetBreakdown: data.budgetBreakdown,
        isPublic: data.isPublic,
        shareToken: data.isPublic ? generateShareToken() : null,
        itinerary: {
          create: data.itinerary.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            activities: {
              create: day.activities.map((activity) => ({
                time: activity.time,
                title: activity.title,
                description: activity.description,
                locationName: activity.locationName,
                lat: activity.lat,
                lng: activity.lng,
                category: activity.category,
                cost: activity.cost,
              })),
            },
          })),
        },
        hotels: {
          create: data.hotels.map((hotel) => ({
            name: hotel.name,
            rating: hotel.rating,
            pricePerNight: hotel.pricePerNight,
            lat: hotel.lat,
            lng: hotel.lng,
          })),
        },
      },
      include: {
        itinerary: { include: { activities: true } },
        hotels: true,
      },
    });

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
}

export async function deleteTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: paramId(req, 'id') } });
    if (!trip) throw new NotFoundError('Trip not found');

    // Only owner or admin can delete
    if (trip.userId !== req.user?.userId && !['ADMIN', 'SUPERADMIN'].includes(req.user?.role || '')) {
      throw new ForbiddenError('You can only delete your own trips');
    }

    await prisma.trip.delete({ where: { id: paramId(req, 'id') } });
    res.json({ success: true, message: 'Trip deleted' });
  } catch (err) {
    next(err);
  }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: paramId(req, 'id') } });
    if (!trip) throw new NotFoundError('Trip not found');

    // Only owner can update
    if (trip.userId !== req.user?.userId) {
      throw new ForbiddenError('You can only update your own trips');
    }

    const { isPublic } = req.body;

    const updateData: any = {};
    if (typeof isPublic === 'boolean') {
      updateData.isPublic = isPublic;
      // Generate share token when making public, remove when making private
      updateData.shareToken = isPublic ? generateShareToken() : null;
    }

    const updated = await prisma.trip.update({
      where: { id: paramId(req, 'id') },
      data: updateData,
      include: {
        itinerary: { include: { activities: true } },
        hotels: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

