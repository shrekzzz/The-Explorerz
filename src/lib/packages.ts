export interface Route {
  id: string;
  name: string;
  locations: string[];
  highlights: string[];
  bestTime: string;
  distance?: number;
}

export interface TravelPackage {
  id: string;
  title: string;
  subtitle: string;
  category: "pilgrimage" | "trek" | "heritage" | "nature" | "adventure";
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  locations: string[];
  highlights: string[];
  highlightImages?: string[];
  distance?: number;
  bestTime: string;
  difficulty?: "Easy" | "Moderate" | "Difficult" | "Extreme";
  included: string[];
  status: "available" | "coming-soon";
  routes?: Route[];
  pptUrl?: string;
  pptFilename?: string;
}

export const packageCategories = [
  { value: "all", label: "All Packages" },
  { value: "pilgrimage", label: "Pilgrimage" },
  { value: "trek", label: "Treks" },
  { value: "heritage", label: "Heritage" },
  { value: "nature", label: "Nature" },
  { value: "adventure", label: "Adventure" },
];

// Hardcoded packages removed - all packages now come from API/database
// Use getTravelPackagesAsync() or getTravelPackages() to fetch packages

import { getPackagesSync as getStoredPackages, savePackage, getPackages as getPackagesFromAPI } from "./storage";

export async function getTravelPackagesAsync(): Promise<TravelPackage[]> {
  try {
    // Try to get packages from API first
    const apiPackages = await getPackagesFromAPI();
    
    if (apiPackages.length > 0) {
      // Transform API packages to frontend format
      const transformed = apiPackages.map(transformApiPackage);
      
      // Save transformed packages to localStorage for offline access
      transformed.forEach(pkg => savePackage(pkg).catch(() => {}));
      
      return transformed;
    }
  } catch (error) {
    console.error('❌ Failed to load packages from API:', error);
  }

  // Fallback to localStorage if API fails
  const stored = getStoredPackages();
  return stored;
}

export function getTravelPackages(): TravelPackage[] {
  const stored = getStoredPackages();
  const isVercelDeployment = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  
  // Clean up packages with broken image paths on Vercel
  if (isVercelDeployment && stored.length > 0) {
    const cleaned = stored.filter(pkg => {
      // Remove packages with uploaded image paths that won't exist on Vercel
      return !pkg.image.startsWith('/uploads/');
    });
    
    return cleaned;
  }
  
  return stored;
}

// Transform API package format to frontend format
function transformApiPackage(apiPkg: any): TravelPackage {
  // Extract main image (primary or first image from images table, or fallback to old image field)
  let mainImage = '/placeholder.svg';
  let highlightImages: string[] = [];
  
  if (apiPkg.images && Array.isArray(apiPkg.images) && apiPkg.images.length > 0) {
    // New format: images from package_images table
    const primaryImg = apiPkg.images.find((img: any) => img.isPrimary === true);
    
    mainImage = primaryImg?.url || apiPkg.images[0]?.url || '/placeholder.svg';
    
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
    category: apiPkg.category.toLowerCase() as any,
    duration: apiPkg.duration,
    price: Number(apiPkg.price),
    rating: Number(apiPkg.rating || 0),
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
