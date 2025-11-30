import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names with Tailwind CSS conflict resolution.
 *
 * @param inputs - A list of class values (strings, objects, arrays) to merge.
 * @returns The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
