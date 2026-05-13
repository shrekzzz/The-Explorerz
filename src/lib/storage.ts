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
export async function saveTrip(trip: TripPlan, guestInfo?: { name: string; email: string; phone: string }): Promise<void> {
  // Always save locally as fallback
  saveLocalTrip(trip);

  // Try to save to API (works for both authenticated and guest users)
  try {
    await api.post("/trips", {
      destination: trip.destination,
      days: trip.days,
      budget: trip.budget,
      interests: trip.interests,
      isPublic: false,
      guestName: guestInfo?.name,
      guestEmail: guestInfo?.email,
      guestPhone: guestInfo?.phone,
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
  } catch (error) {
    // If API fails, trip is still saved locally
    console.error('Failed to save trip to API:', error);
    throw error; // Re-throw so caller knows it failed
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
 * Returns RAW API data without transformation.
 */
export async function getPackages(): Promise<any[]> {
  try {
    const { data } = await api.get("/packages", {
      params: { limit: 50, sortBy: "createdAt", sortOrder: "desc" },
    });
    
    // Return raw API data - transformation happens in packages.ts
    return data.data || [];
  } catch (error) {
    console.error('❌ API call failed:', error);
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
  if (getAccessToken()) {
    try {
      // Filter and ensure at least one item for required arrays
      const locations = pkg.locations.filter(l => l.trim());
      const highlights = pkg.highlights.filter(h => h.trim());
      const included = pkg.included.filter(i => i.trim());
      const highlightImages = (pkg.highlightImages || []).filter(img => img.trim());

      // Transform frontend format to backend format
      const apiPackage: any = {
        category: pkg.category.toUpperCase(),
        status: pkg.status === "available" ? "AVAILABLE" : pkg.status === "coming-soon" ? "COMING_SOON" : "ARCHIVED",
      };

      // Only include fields that have valid values
      if (pkg.title?.trim()) apiPackage.title = pkg.title.trim();
      if (pkg.subtitle?.trim()) apiPackage.subtitle = pkg.subtitle.trim();
      if (pkg.duration?.trim()) apiPackage.duration = pkg.duration.trim();
      if (pkg.price > 0) apiPackage.price = pkg.price;
      if (locations.length > 0) apiPackage.locations = locations;
      if (highlights.length > 0) apiPackage.highlights = highlights;
      if (highlightImages.length > 0) apiPackage.highlightImages = highlightImages;
      if (pkg.distance) apiPackage.distance = pkg.distance;
      if (pkg.bestTime?.trim()) apiPackage.bestTime = pkg.bestTime.trim();
      if (pkg.difficulty) apiPackage.difficulty = pkg.difficulty.toUpperCase();
      if (included.length > 0) apiPackage.included = included;
      if (pkg.pptUrl?.trim()) apiPackage.pptUrl = pkg.pptUrl.trim();
      if (pkg.pptFilename?.trim()) apiPackage.pptFilename = pkg.pptFilename.trim();
      
      // Handle routes
      if (pkg.routes && pkg.routes.length > 0) {
        apiPackage.routes = pkg.routes;
      }

      // Handle images - convert main image and highlight images to images array
      const images: any[] = [];
      if (pkg.image?.trim()) {
        images.push({
          url: pkg.image,
          isPrimary: true,
          sortOrder: 0,
        });
      }
      highlightImages.forEach((url, index) => {
        images.push({
          url,
          isPrimary: false,
          sortOrder: index + 1,
        });
      });
      if (images.length > 0) {
        apiPackage.images = images;
      }

      // Check if this is a valid UUID (database package) or custom ID (localStorage only)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pkg.id);

      if (pkg.id && isValidUUID) {
        // Update existing database package
        const response = await api.put(`/packages/${pkg.id}`, apiPackage);
        
        // Update localStorage with the response data
        if (response.data?.data) {
          const updatedPkg = transformApiPackageToFrontend(response.data.data);
          saveLocalPackage(updatedPkg);
        }
      } else {
        // Create new package (localStorage packages with custom IDs need to be created)
        // For create, ensure required fields have defaults
        if (!apiPackage.title) apiPackage.title = 'Untitled Package';
        if (!apiPackage.subtitle) apiPackage.subtitle = 'Description coming soon';
        if (!apiPackage.duration) apiPackage.duration = '1 Day';
        if (!apiPackage.price) apiPackage.price = 1000;
        if (!apiPackage.locations || apiPackage.locations.length === 0) apiPackage.locations = ['Location TBD'];
        if (!apiPackage.highlights || apiPackage.highlights.length === 0) apiPackage.highlights = ['Details coming soon'];
        if (!apiPackage.bestTime) apiPackage.bestTime = 'Year round';
        
        const response = await api.post("/packages", apiPackage);
        
        // Replace the local package with the new one from the database
        if (response.data?.data?.id) {
          // Remove the old localStorage entry
          deleteLocalPackage(pkg.id);
          
          // Save the new package from API
          const newPkg = transformApiPackageToFrontend(response.data.data);
          saveLocalPackage(newPkg);
        }
      }
    } catch (error: any) {
      console.error('Failed to save package to API:', error);
      console.error('Error response:', error.response?.data);
      // Save locally as fallback
      saveLocalPackage(pkg);
      // Re-throw to let the caller handle it
      throw error;
    }
  } else {
    // Not authenticated, save locally only
    saveLocalPackage(pkg);
  }
}

/**
 * Transform API package format to frontend format
 */
function transformApiPackageToFrontend(apiPkg: any): TravelPackage {
  // Extract main image (primary or first image from images table, or fallback to highlightImages)
  let mainImage = '';
  let highlightImages: string[] = [];
  
  if (apiPkg.images && Array.isArray(apiPkg.images) && apiPkg.images.length > 0) {
    // New format: images from package_images table
    const primaryImg = apiPkg.images.find((img: any) => img.isPrimary === true);
    mainImage = primaryImg?.url || apiPkg.images[0]?.url || '';
    
    // Get non-primary images as highlights
    highlightImages = apiPkg.images
      .filter((img: any) => img.isPrimary !== true)
      .map((img: any) => img.url);
  } else if (apiPkg.highlightImages && apiPkg.highlightImages.length > 0) {
    // Fallback: highlightImages array field
    highlightImages = apiPkg.highlightImages;
  }

  return {
    id: apiPkg.id,
    title: apiPkg.title,
    subtitle: apiPkg.subtitle,
    category: apiPkg.category.toLowerCase(),
    duration: apiPkg.duration,
    price: parseFloat(apiPkg.price),
    rating: parseFloat(apiPkg.rating || 0),
    reviews: apiPkg.reviewCount || apiPkg._count?.reviews || 0,
    image: mainImage,
    locations: apiPkg.locations || [],
    highlights: apiPkg.highlights || [],
    highlightImages: highlightImages,
    distance: apiPkg.distance,
    bestTime: apiPkg.bestTime,
    difficulty: apiPkg.difficulty ? (apiPkg.difficulty.charAt(0) + apiPkg.difficulty.slice(1).toLowerCase()) as any : undefined,
    included: apiPkg.included || [],
    status: apiPkg.status === 'AVAILABLE' ? 'available' : 'coming-soon',
    routes: apiPkg.routes || [],
    pptUrl: apiPkg.pptUrl,
    pptFilename: apiPkg.pptFilename,
  };
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

export async function savePackageOrder(packages: TravelPackage[]): Promise<void> {
  // Save to localStorage first
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
  
  // If authenticated, save the order to the backend
  if (getAccessToken()) {
    try {
      // Send the new order to the backend
      const packageIds = packages.map(p => p.id);
      await api.post("/packages/reorder", { packageIds });
    } catch (error) {
      console.error('Failed to save package order to API:', error);
      // Order is still saved locally, so continue
    }
  }
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
