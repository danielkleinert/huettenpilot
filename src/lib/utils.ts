import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeHutName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['`]/g, '')
    .replace(/[-\s.]/g, '')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
}

export function fuzzyHutNameMatch(hutName: string, searchTerm: string): boolean {
  const normalizedHutName = normalizeHutName(hutName)
  const normalizedSearchTerm = normalizeHutName(searchTerm)
  
  return normalizedHutName.includes(normalizedSearchTerm)
}

export function calculateDistance(coord1: [number, number], coord2: [number, number]): number {
  const [lat1, lon1] = coord1
  const [lat2, lon2] = coord2
  
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}