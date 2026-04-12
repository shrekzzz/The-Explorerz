import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import { PackageQuery, CreatePackageInput, UpdatePackageInput } from '../validators/package.schema.js';
import { Prisma } from '@prisma/client';
import {
  getCached, setCache, invalidatePackageCache,
  packageListKey, packageDetailKey,
  CACHE_TTL,
} from '../services/cache.service.js';

export async function listPackages(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as PackageQuery;
    const { page, limit, category, status, minPrice, maxPrice, search, sortBy, sortOrder } = query;

    // Check cache
    const cacheKey = packageListKey(Buffer.from(JSON.stringify(query)).toString('base64url'));
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const skip = (page - 1) * limit;
    const where: Prisma.PackageWhereInput = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subtitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: true, bookings: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.package.count({ where }),
    ]);

    const response = {
      success: true,
      data: packages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    // Cache for 5 minutes
    await setCache(cacheKey, response, CACHE_TTL.PACKAGE_LIST);

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getPackage(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = packageDetailKey(req.params.id);
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const pkg = await prisma.package.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    if (!pkg) throw new NotFoundError('Package not found');

    const response = { success: true, data: pkg };
    await setCache(cacheKey, response, CACHE_TTL.PACKAGE_DETAIL);

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function createPackage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreatePackageInput;
    const pkg = await prisma.package.create({
      data: {
        ...data,
        price: data.price,
        createdBy: req.user?.userId,
      },
    });

    // Invalidate package caches
    await invalidatePackageCache();

    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function updatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.package.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Package not found');

    const data = req.body as UpdatePackageInput;
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data,
    });

    // Invalidate caches
    await invalidatePackageCache(req.params.id);

    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function deletePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.package.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new NotFoundError('Package not found');

    await prisma.package.delete({ where: { id: req.params.id } });

    // Invalidate caches
    await invalidatePackageCache(req.params.id);

    res.json({ success: true, message: 'Package deleted' });
  } catch (err) {
    next(err);
  }
}
