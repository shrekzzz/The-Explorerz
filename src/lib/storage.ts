import { TripPlan } from "@/types/trip";
import { TravelPackage } from "./packages";

const STORAGE_KEY = "aeroplan_saved_trips";
const PACKAGES_STORAGE_KEY = "aeroplan_packages";

export function getSavedTrips(): TripPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrip(trip: TripPlan): void {
  const trips = getSavedTrips();
  const exists = trips.findIndex((t) => t.id === trip.id);
  if (exists >= 0) {
    trips[exists] = trip;
  } else {
    trips.unshift(trip);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function deleteTrip(id: string): void {
  const trips = getSavedTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function shareTripUrl(trip: TripPlan): string {
  const params = new URLSearchParams({
    dest: trip.destination,
    days: String(trip.days),
    budget: String(trip.budget),
    interests: trip.interests.join(","),
  });
  return `${window.location.origin}/plan?${params.toString()}`;
}

export function getPackages(): TravelPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePackage(pkg: TravelPackage): void {
  const packages = getPackages();
  const exists = packages.findIndex((p) => p.id === pkg.id);
  if (exists >= 0) {
    packages[exists] = pkg;
  } else {
    packages.push(pkg);
  }
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}

export function deletePackage(id: string): void {
  const packages = getPackages().filter((p) => p.id !== id);
  localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
}
