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
    const query = (req.query as any) as PackageQuery;
    const { category, status, minPrice, maxPrice, search, sortBy, sortOrder } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

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
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true, bookings: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.package.count({ where }),
    ]);

    console.log('Sample package from DB:', packages[0] ? {
      id: packages[0].id,
      title: packages[0].title,
      images: packages[0].images,
      highlightImages: (packages[0] as any).highlightImages,
      routes: (packages[0] as any).routes,
      rating: packages[0].rating,
      reviewCount: packages[0].reviewCount,
    } : 'No packages');

    const response = {
      success: true,
      data: packages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    console.log('📤 Sending response with', packages.length, 'packages');
    console.log('📤 First package in response:', {
      id: packages[0]?.id,
      title: packages[0]?.title,
      hasImages: !!(packages[0] as any)?.images,
      imagesCount: (packages[0] as any)?.images?.length || 0,
      images: (packages[0] as any)?.images,
    });

    // Cache for 5 minutes
    await setCache(cacheKey, response, CACHE_TTL.PACKAGE_LIST);

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getPackage(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = packageDetailKey((req.params.id as string));
    const cached = await getCached<any>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const pkg = await prisma.package.findUnique({
      where: { id: (req.params.id as string) },
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
    
    console.log('Creating package with data:', JSON.stringify(data, null, 2));
    
    // Extract images array if provided
    const images = data.images || [];
    const { images: _, ...packageData } = data as any;
    
    console.log('Package data after extracting images:', JSON.stringify(packageData, null, 2));
    console.log('Images to create:', JSON.stringify(images, null, 2));
    
    // Create package with transaction to handle images
    const pkg = await prisma.$transaction(async (tx) => {
      const newPackage = await tx.package.create({
        data: {
          ...packageData,
          price: data.price,
          createdBy: req.user?.userId ?? null,
        } as any,
      });

      console.log('Package created:', newPackage.id);

      // Create package images if provided
      if (images.length > 0) {
        await tx.packageImage.createMany({
          data: images.map((img, index) => ({
            packageId: newPackage.id,
            url: img.url,
            publicId: img.publicId || '',
            isPrimary: img.isPrimary || index === 0,
            sortOrder: img.sortOrder || index,
          })),
        });
        console.log('Created', images.length, 'images');
      }

      // Fetch the complete package with images
      return await tx.package.findUnique({
        where: { id: newPackage.id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true, bookings: true } },
        },
      });
    });

    // Invalidate package caches
    await invalidatePackageCache();

    res.status(201).json({ success: true, data: pkg });
  } catch (err) {
    console.error('Error creating package:', err);
    next(err);
  }
}

export async function updatePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.package.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing) throw new NotFoundError('Package not found');

    const data = req.body as UpdatePackageInput;
    
    // Extract images array if provided
    const images = (data as any).images;
    const { images: _, ...packageData } = data as any;

    // Update package with transaction to handle images
    const pkg = await prisma.$transaction(async (tx) => {
      const updatedPackage = await tx.package.update({
        where: { id: (req.params.id as string) },
        data: packageData,
      });

      // Update images if provided
      if (images !== undefined) {
        // Delete existing images
        await tx.packageImage.deleteMany({
          where: { packageId: updatedPackage.id },
        });

        // Create new images
        if (images.length > 0) {
          await tx.packageImage.createMany({
            data: images.map((img: any, index: number) => ({
              packageId: updatedPackage.id,
              url: img.url,
              publicId: img.publicId || '',
              isPrimary: img.isPrimary || index === 0,
              sortOrder: img.sortOrder || index,
            })),
          });
        }
      }

      // Fetch the complete package with images
      return await tx.package.findUnique({
        where: { id: updatedPackage.id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { reviews: true, bookings: true } },
        },
      });
    });

    // Invalidate caches
    await invalidatePackageCache((req.params.id as string));

    res.json({ success: true, data: pkg });
  } catch (err) {
    next(err);
  }
}

export async function deletePackage(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.package.findUnique({ where: { id: (req.params.id as string) } });
    if (!existing) throw new NotFoundError('Package not found');

    await prisma.package.delete({ where: { id: (req.params.id as string) } });

    // Invalidate caches
    await invalidatePackageCache((req.params.id as string));

    res.json({ success: true, message: 'Package deleted' });
  } catch (err) {
    next(err);
  }
}
