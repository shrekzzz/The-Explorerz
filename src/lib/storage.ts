import { TripPlan } from "@/types/trip";
import { TravelPackage } from "./packages";
import api, { getAccessToken } from "./api";

// ─── Local Storage Keys (Offline Fallback) ──
const STORAGE_KEY = "aeroplan_saved_trips";
const PACKAGES_STORAGE_KEY = "aeroplan_packages";

// ─── Trips ──────────────────────────────────

/**
 * Get saved trips — from API if authenticated, localStorage fallback.
 */
export async function getSavedTrips(): Promise<TripPlan[]> {
  if (getAccessToken()) {
    try {
      const { data } = await api.get("/trips", {
        params: { limit: 50, sortBy: "createdAt", sortOrder: "desc" },
      });
      return data.data || [];
    } catch {
      // Fall back to localStorage on network error
      return getLocalTrips();
    }
  }
  return getLocalTrips();
}

/**
 * Synchronous version for components that can't await.
 */
export function getSavedTripsSync(): TripPlan[] {
  return getLocalTrips();
}

/**
 * Save a trip — to API if authenticated, always to localStorage.
 */
export async function saveTrip(trip: TripPlan): Promise<void> {
  // Always save locally as fallback
  saveLocalTrip(trip);

  if (getAccessToken()) {
    try {
      await api.post("/trips", {
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
      });
    } catch {
      // Saved locally already, will sync later
    }
  }
}

/**
 * Delete a trip — from API if authenticated, always from localStorage.
 */
export async function deleteTrip(id: string): Promise<void> {
  deleteLocalTrip(id);

  if (getAccessToken()) {
    try {
      await api.delete(`/trips/${id}`);
    } catch {
      // Already deleted locally
    }
  }
}

/**
 * Generate a share URL for a trip.
 */
export function shareTripUrl(trip: TripPlan): string {
  // If trip has a shareToken from the API, use it
  if ((trip as any).shareToken) {
    return `${window.location.origin}/trips/shared/${(trip as any).shareToken}`;
  }
  // Fallback: encode as query params
  const params = new URLSearchParams({
    dest: trip.destination,
    days: String(trip.days),
    budget: String(trip.budget),
    interests: trip.interests.join(","),
  });
  return `${window.location.origin}/plan?${params.toString()}`;
}

// ─── Packages ───────────────────────────────

/**
 * Get packages — from API (public), localStorage fallback.
 */
export async function getPackages(): Promise<TravelPackage[]> {
  try {
    const { data } = await api.get("/packages", {
      params: { limit: 50, sortBy: "createdAt", sortOrder: "desc" },
    });
    return data.data || [];
  } catch {
    return getLocalPackages();
  }
}

/**
 * Synchronous version for components that can't await.
 */
export function getPackagesSync(): TravelPackage[] {
  return getLocalPackages();
}

/**
 * Save a package — API for admin, localStorage fallback.
 */
export async function savePackage(pkg: TravelPackage): Promise<void> {
  saveLocalPackage(pkg);

  if (getAccessToken()) {
    try {
      if (pkg.id) {
        await api.put(`/packages/${pkg.id}`, pkg);
      } else {
        await api.post("/packages", pkg);
      }
    } catch {
      // Saved locally
    }
  }
}

/**
 * Delete a package — API for admin, localStorage fallback.
 */
export async function deletePackage(id: string): Promise<void> {
  deleteLocalPackage(id);

  if (getAccessToken()) {
    try {
      await api.delete(`/packages/${id}`);
    } catch {
      // Deleted locally
    }
  }
}

// ─── Private: localStorage helpers ──────────

function getLocalTrips(): TripPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTrip(trip: TripPlan): void {
  const trips = getLocalTrips();
  const exists = trips.findIndex((t) => t.id === trip.id);
  if (exists >= 0) {
    trips[exists] = trip;
  } else {
    trips.unshift(trip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function deleteLocalTrip(id: string): void {
  const trips = getLocalTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function getLocalPackages(): TravelPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPackage(pkg: TravelPackage): void {
  const packages = getLocalPackages();
  const exists = packages.findIndex((p) => p.id === pkg.id);
  if (exists >= 0) {
    packages[exists] = pkg;
  } else {
    packages.push(pkg);
  }
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}

function deleteLocalPackage(id: string): void {
  const packages = getLocalPackages().filter((p) => p.id !== id);
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}

// ─── Helpers ────────────────────────────────

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
