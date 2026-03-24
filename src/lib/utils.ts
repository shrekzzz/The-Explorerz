import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves an image URL, handling both regular URLs and uploaded images
 */
export function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return "";

  // If it's an uploaded image key from localStorage (legacy), retrieve from localStorage
  if (imagePath.startsWith('uploaded-image-')) {
    const storedImage = localStorage.getItem(imagePath);
    return storedImage || "";
  }

  // Return the path as-is (could be a URL, relative path, or server-uploaded path)
  return imagePath;
}
