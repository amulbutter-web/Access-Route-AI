// ============================================================
// AccessRoute AI — Input Sanitization Utilities
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

/**
 * Sanitizes a string input by trimming whitespace and removing
 * potentially dangerous characters for use in queries/IDs.
 */
export function sanitizeString(input: unknown, maxLength: number = 200): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return null;
  // Remove null bytes and control characters
  return trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validates a campus node ID format.
 * Only allows lowercase alphanumeric characters, hyphens, and underscores.
 */
export function isValidNodeId(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return /^[a-z0-9][a-z0-9_-]{0,63}$/.test(id);
}

/**
 * Sanitizes external content from TinyFish to prevent injection.
 * Strips HTML tags and limits length.
 */
export function sanitizeExternalContent(content: string, maxLength: number = 5000): string {
  // Strip HTML tags
  let cleaned = content.replace(/<[^>]*>/g, '');
  // Remove script/style content patterns
  cleaned = cleaned.replace(/javascript\s*:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Truncate
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '…';
  }
  return cleaned;
}

/**
 * Validates and sanitizes a URL for use with TinyFish.
 */
export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
