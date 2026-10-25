// ============================================================
// AccessRoute AI — Request ID Generator
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { randomBytes } from 'crypto';

/**
 * Generates a unique request ID for tracing.
 * Format: "req_<timestamp_hex>_<random_hex>"
 */
export function generateRequestId(): string {
  const timestampHex = Date.now().toString(16);
  const randomHex = randomBytes(4).toString('hex');
  return `req_${timestampHex}_${randomHex}`;
}
