import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    if (feet >= 5280) return `${(feet / 5280).toFixed(2)} mi`;
    return `${feet.toFixed(1)} ft`;
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(1)} m`;
}

export function formatArea(sqMeters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const sqFeet = sqMeters * 10.7639;
    if (sqFeet >= 43560) return `${(sqFeet / 43560).toFixed(2)} ac`;
    return `${sqFeet.toFixed(0)} ft²`;
  }
  if (sqMeters >= 10000) return `${(sqMeters / 10000).toFixed(2)} ha`;
  return `${sqMeters.toFixed(2)} m²`;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function formatSpeed(mps: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') return `${(mps * 2.237).toFixed(2)} mph`;
  return `${mps.toFixed(2)} m/s`;
}

export function formatHeading(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return `${normalized.toFixed(0)}° ${directions[index]}`;
}

export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function getSportLabel(sport: string): string {
  const labels: Record<string, string> = {
    football: 'Football',
    cricket: 'Cricket',
    tennis: 'Tennis',
    volleyball: 'Volleyball',
    basketball: 'Basketball',
    hockey: 'Hockey',
    athletics: 'Athletics',
    kabaddi: 'Kabaddi',
    kho_kho: 'Kho Kho',
    badminton: 'Badminton',
    custom: 'Custom',
  };
  return labels[sport] ?? sport;
}

export function getSportIcon(sport: string): string {
  const icons: Record<string, string> = {
    football: '⚽',
    cricket: '🏏',
    tennis: '🎾',
    volleyball: '🏐',
    basketball: '🏀',
    hockey: '🏑',
    athletics: '🏃',
    kabaddi: '🤼',
    kho_kho: '🏃',
    badminton: '🏸',
    custom: '📐',
  };
  return icons[sport] ?? '📐';
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
