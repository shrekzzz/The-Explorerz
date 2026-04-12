import { Router } from 'express';
import { listTrips, getTrip, getSharedTrip, createTrip, deleteTrip } from '../controllers/trip.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createTripSchema, tripQuerySchema } from '../validators/trip.schema.js';

const router = Router();

// Public route for shared trips
router.get('/shared/:token', getSharedTrip);

// Protected routes
router.get('/', authenticate, validateQuery(tripQuerySchema), listTrips);
router.get('/:id', optionalAuth, getTrip);
router.post('/', authenticate, validateBody(createTripSchema), createTrip);
router.delete('/:id', authenticate, deleteTrip);

export default router;
