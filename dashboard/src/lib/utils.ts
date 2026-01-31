import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return then.toLocaleDateString()
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString()
}

export function getInitials(email: string): string {
  const name = email.split('@')[0]
  if (name.length <= 2) return name.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function decodeQuotedPrintable(encoded: string): string {
  // Handle quoted-printable decoding
  return encoded
    .replace(/=\r?\n/g, '') // Remove soft line breaks (= at end of line)
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => {
      // Convert =XX hex codes to characters
      return String.fromCharCode(parseInt(hex, 16))
    })
}

export function decodeBase64(encoded: string): string {
  try {
    // Handle base64 decoding
    return atob(encoded)
  } catch (error) {
    console.warn('Failed to decode base64 content:', error)
    return encoded // Return original if decoding fails
  }
}

export function decodeContent(content: string, encoding: string): string {
  const normalizedEncoding = encoding.toLowerCase().trim()

  switch (normalizedEncoding) {
    case 'quoted-printable':
      return decodeQuotedPrintable(content)
    case 'base64':
      return decodeBase64(content)
    case '7bit':
    case '8bit':
    case 'binary':
    default:
      return content
  }
}

// Decode HTML entities like &#xa0; &#x200C; etc.
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Remove zero-width and invisible characters for readable plain text
export function stripInvisibleChars(text: string): string {
  return text
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
    // Replace non-breaking spaces with regular spaces
    .replace(/\u00A0/g, ' ')
    // Collapse multiple spaces into one
    .replace(/  +/g, ' ')
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Get clean, readable plain text
export function getReadableText(content: string, encoding: string): string {
  const decoded = decodeContent(content, encoding)
  const withEntitiesDecoded = decodeHtmlEntities(decoded)
  return stripInvisibleChars(withEntitiesDecoded)
}
