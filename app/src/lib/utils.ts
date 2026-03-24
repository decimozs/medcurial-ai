import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripExtension(name: string | undefined): string {
  if (!name) return ""
  return name.replace(/\.(jpg|jpeg|png|jfif|pdf|webp)$/i, "")
}
