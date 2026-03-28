import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getDaysLeft(launchDate?: string): number {
  if (!launchDate) return 0
  const end = new Date(launchDate)
  const today = new Date()
  const diff = end.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
