// ============================================================
// AccessRoute AI — Sanitization & Validation Unit Tests
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  isValidNodeId,
  sanitizeExternalContent,
  isValidHttpUrl,
} from '../src/utils/sanitize';

describe('sanitizeString', () => {
  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should return null for empty strings', () => {
    expect(sanitizeString('')).toBeNull();
    expect(sanitizeString('   ')).toBeNull();
  });

  it('should return null for non-strings', () => {
    expect(sanitizeString(123)).toBeNull();
    expect(sanitizeString(null)).toBeNull();
    expect(sanitizeString(undefined)).toBeNull();
    expect(sanitizeString({})).toBeNull();
  });

  it('should return null for strings exceeding max length', () => {
    const longString = 'a'.repeat(201);
    expect(sanitizeString(longString, 200)).toBeNull();
  });

  it('should remove control characters', () => {
    expect(sanitizeString('hello\x00world')).toBe('helloworld');
    expect(sanitizeString('test\x01\x02\x03')).toBe('test');
  });

  it('should preserve normal characters', () => {
    expect(sanitizeString('Hello, World! 123')).toBe('Hello, World! 123');
  });
});

describe('isValidNodeId', () => {
  it('should accept valid node IDs', () => {
    expect(isValidNodeId('main-gate')).toBe(true);
    expect(isValidNodeId('hostel-block-a')).toBe(true);
    expect(isValidNodeId('r-and-d-block')).toBe(true);
    expect(isValidNodeId('mess-1')).toBe(true);
    expect(isValidNodeId('junction_central')).toBe(true);
  });

  it('should reject invalid node IDs', () => {
    expect(isValidNodeId('')).toBe(false);
    expect(isValidNodeId('Main-Gate')).toBe(false); // uppercase
    expect(isValidNodeId('-start-with-dash')).toBe(false);
    expect(isValidNodeId('has spaces')).toBe(false);
    expect(isValidNodeId('has.dots')).toBe(false);
    expect(isValidNodeId('has/slashes')).toBe(false);
    expect(isValidNodeId('../traversal')).toBe(false);
    expect(isValidNodeId('<script>')).toBe(false);
  });

  it('should reject non-strings', () => {
    expect(isValidNodeId(123)).toBe(false);
    expect(isValidNodeId(null)).toBe(false);
    expect(isValidNodeId(undefined)).toBe(false);
  });

  it('should reject excessively long IDs', () => {
    expect(isValidNodeId('a'.repeat(65))).toBe(false);
  });
});

describe('sanitizeExternalContent', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeExternalContent('<b>bold</b> text')).toBe('bold text');
    expect(sanitizeExternalContent('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('should remove javascript: patterns', () => {
    const input = 'click javascript: alert(1)';
    expect(sanitizeExternalContent(input)).not.toContain('javascript:');
  });

  it('should remove event handler patterns', () => {
    const input = 'div onload= onerror= onfocus=';
    const result = sanitizeExternalContent(input);
    expect(result).not.toMatch(/on\w+=/i);
  });

  it('should normalize whitespace', () => {
    expect(sanitizeExternalContent('hello   \n\t  world')).toBe('hello world');
  });

  it('should truncate long content', () => {
    const longContent = 'a'.repeat(6000);
    const result = sanitizeExternalContent(longContent, 5000);
    expect(result.length).toBeLessThanOrEqual(5001); // +1 for ellipsis char
  });

  it('should handle empty strings', () => {
    expect(sanitizeExternalContent('')).toBe('');
  });
});

describe('isValidHttpUrl', () => {
  it('should accept valid HTTP URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
    expect(isValidHttpUrl('https://example.com/path?q=1')).toBe(true);
    expect(isValidHttpUrl('https://sub.domain.com:8080/page')).toBe(true);
  });

  it('should reject non-HTTP URLs', () => {
    expect(isValidHttpUrl('ftp://files.example.com')).toBe(false);
    expect(isValidHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isValidHttpUrl('data:text/html,<h1>hi</h1>')).toBe(false);
    expect(isValidHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('should reject non-URLs', () => {
    expect(isValidHttpUrl('')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
    expect(isValidHttpUrl('example.com')).toBe(false); // no protocol
  });
});
