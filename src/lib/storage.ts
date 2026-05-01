import { TripPlan } from "@/types/trip";
import { TravelPackage } from "./packages";
import api from "./api";

// ─── Trips ──────────────────────────────────

/**
 * Get saved trips — requires authentication.
 * Clerk token automatically attached via API interceptor.
 */
export async function getSavedTrips(): Promise<TripPlan[]> {
  const { data } = await api.get("/trips", {
    params: { limit: 50, sortBy: "createdAt", sortOrder: "desc" },
  });
  
  return transformTripsFromAPI(data.data || []);
}

/**
 * Get a single trip by ID.
 */
export async function getTrip(id: string): Promise<TripPlan> {
  const { data } = await api.get(`/trips/${id}`);
  return transformTripFromAPI(data.data);
}

/**
 * Save a trip — requires authentication.
 */
export async function saveTrip(trip: TripPlan): Promise<TripPlan> {
  const payload = {
    destination: trip.destination,
    days: trip.days,
    budget: trip.budget,
    interests: trip.interests,
    isPublic: false,
    itinerary: trip.itinerary?.map((day, idx) => ({
      dayNumber: idx + 1,
      title: day.title || `Day ${idx + 1}`,
      activities: day.activities?.map((act) => ({
        time: act.time || "09:00",
        title: act.title,
        description: act.description || "",
        locationName: act.location?.name || act.title,
        lat: act.location?.lat || 0,
        lng: act.location?.lng || 0,
        category: mapActivityCategory(act.category),
        cost: act.cost || 0,
      })) || [],
    })) || [],
    budgetBreakdown: trip.budgetBreakdown || {
      accommodation: 0,
      food: 0,
      transport: 0,
      activities: 0,
      total: trip.budget,
    },
    hotels: trip.hotels?.map((h) => ({
      name: h.name,
      rating: h.rating || 0,
      pricePerNight: h.pricePerNight || 0,
      lat: h.lat || 0,
      lng: h.lng || 0,
    })) || [],
  };

  const { data } = await api.post("/trips", payload);
  return transformTripFromAPI(data.data);
}

/**
 * Delete a trip — requires authentication.
 */
export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}

/**
 * Generate a share URL for a trip.
 */
export async function shareTripUrl(tripId: string): Promise<string> {
  // Update trip to be public and get share token
  const { data } = await api.patch(`/trips/${tripId}`, { isPublic: true });
  const shareToken = data.data.shareToken;
  
  return `${window.location.origin}/trips/shared/${shareToken}`;
}

/**
 * Get a shared trip by token (public, no auth required).
 */
export async function getSharedTrip(token: string): Promise<TripPlan> {
  const { data } = await api.get(`/trips/shared/${token}`);
  return transformTripFromAPI(data.data);
}

// ─── Packages ───────────────────────────────

/**
 * Get packages — public endpoint, no auth required.
 */
export async function getPackages(filters?: {
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}): Promise<TravelPackage[]> {
  const { data } = await api.get("/packages", {
    params: {
      limit: 50,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...filters,
    },
  });
  
  return data.data || [];
}

/**
 * Get a single package by ID — public endpoint.
 */
export async function getPackage(id: string): Promise<TravelPackage> {
  const { data } = await api.get(`/packages/${id}`);
  return data.data;
}

/**
 * Save a package — requires STAFF+ role.
 */
export async function savePackage(pkg: TravelPackage): Promise<TravelPackage> {
  if (pkg.id) {
    const { data } = await api.put(`/packages/${pkg.id}`, pkg);
    return data.data;
  } else {
    const { data } = await api.post("/packages", pkg);
    return data.data;
  }
}

/**
 * Delete a package — requires ADMIN+ role.
 */
export async function deletePackage(id: string): Promise<void> {
  await api.delete(`/packages/${id}`);
}

// ─── Helpers ────────────────────────────────

/**
 * Transform trip data from API format to frontend format.
 */
function transformTripFromAPI(apiTrip: any): TripPlan {
  return {
    id: apiTrip.id,
    destination: apiTrip.destination,
    days: apiTrip.days,
    budget: Number(apiTrip.budget),
    interests: apiTrip.interests || [],
    budgetBreakdown: apiTrip.budgetBreakdown || {
      accommodation: 0,
      food: 0,
      transport: 0,
      activities: 0,
      total: Number(apiTrip.budget),
    },
    itinerary: apiTrip.itinerary?.map((day: any) => ({
      day: day.dayNumber,
      title: day.title,
      activities: day.activities?.map((act: any) => ({
        time: act.time,
        title: act.title,
        description: act.description,
        location: {
          name: act.locationName,
          lat: Number(act.lat),
          lng: Number(act.lng),
        },
        category: act.category?.toLowerCase(),
        cost: Number(act.cost),
      })) || [],
    })) || [],
    hotels: apiTrip.hotels?.map((h: any) => ({
      name: h.name,
      rating: Number(h.rating),
      pricePerNight: Number(h.pricePerNight),
      lat: Number(h.lat),
      lng: Number(h.lng),
    })) || [],
    shareToken: apiTrip.shareToken,
    isPublic: apiTrip.isPublic,
    createdAt: apiTrip.createdAt,
  };
}

/**
 * Transform multiple trips from API format.
 */
function transformTripsFromAPI(apiTrips: any[]): TripPlan[] {
  return apiTrips.map(transformTripFromAPI);
}

/**
 * Map frontend activity category to backend enum.
 */
function mapActivityCategory(cat?: string): string {
  const map: Record<string, string> = {
    food: "FOOD",
    adventure: "ADVENTURE",
    temple: "TEMPLES",
    temples: "TEMPLES",
    culture: "CULTURE",
    nightlife: "NIGHTLIFE",
    nature: "NATURE",
    shopping: "SHOPPING",
    transport: "TRANSPORT",
    relaxation: "RELAXATION",
  };
  return map[cat?.toLowerCase() || ""] || "CULTURE";
}

// ─── Bookings ───────────────────────────────

/**
 * Get user's bookings — requires authentication.
 */
export async function getBookings(): Promise<any[]> {
  const { data } = await api.get("/bookings");
  return data.data || [];
}

/**
 * Get a single booking by ID.
 */
export async function getBooking(id: string): Promise<any> {
  const { data } = await api.get(`/bookings/${id}`);
  return data.data;
}

/**
 * Create a booking — requires authentication.
 */
export async function createBooking(booking: {
  packageId: string;
  travelers: number;
  travelDate: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    specialRequests?: string;
  };
}): Promise<any> {
  const { data } = await api.post("/bookings", booking);
  return data.data;
}

/**
 * Update booking status.
 */
export async function updateBookingStatus(
  id: string,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED"
): Promise<any> {
  const { data } = await api.patch(`/bookings/${id}/status`, { status });
  return data.data;
}

/**
 * Cancel a booking (user can only cancel their own).
 */
export async function cancelBooking(id: string): Promise<any> {
  return updateBookingStatus(id, "CANCELLED");
}
