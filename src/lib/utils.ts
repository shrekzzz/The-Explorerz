import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves an image URL — returns the path as-is (URL, relative path, or
 * server-uploaded path). Legacy localStorage image keys are no longer used;
 * images are uploaded to the server via /api/upload.
 */
export function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  return imagePath;
}
