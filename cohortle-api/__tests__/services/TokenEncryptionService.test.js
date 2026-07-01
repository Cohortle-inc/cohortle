'use strict';

/**
 * Unit tests for TokenEncryptionService
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

// A valid 32-byte base64-encoded key for testing
const VALID_KEY = Buffer.alloc(32, 'k').toString('base64'); // 32 bytes of 'k'

describe('TokenEncryptionService', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.DRIVE_TOKEN_ENCRYPTION_KEY;
    // Reset module registry so the constructor re-reads the env var each test
    jest.resetModules();
  });

  afterEach(() => {
    process.env.DRIVE_TOKEN_ENCRYPTION_KEY = originalEnv;
  });

  // ── Construction ──────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws if DRIVE_TOKEN_ENCRYPTION_KEY is not set', () => {
      delete process.env.DRIVE_TOKEN_ENCRYPTION_KEY;
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      expect(() => new TokenEncryptionService()).toThrow(
        /DRIVE_TOKEN_ENCRYPTION_KEY environment variable is not set/
      );
    });

    it('throws if the key decodes to fewer than 32 bytes', () => {
      // 16 bytes base64-encoded
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(16, 'x').toString('base64');
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      expect(() => new TokenEncryptionService()).toThrow(/must be at least 32 bytes/);
    });

    it('constructs successfully with a valid 32-byte key', () => {
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      expect(() => new TokenEncryptionService()).not.toThrow();
    });

    it('constructs successfully with a key longer than 32 bytes (truncates)', () => {
      // 48 bytes — longer than required
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(48, 'y').toString('base64');
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      expect(() => new TokenEncryptionService()).not.toThrow();
    });
  });

  // ── Encrypt / Decrypt ─────────────────────────────────────────────────────

  describe('encrypt / decrypt round-trip', () => {
    let service;

    beforeEach(() => {
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      jest.resetModules();
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      service = new TokenEncryptionService();
    });

    it('decrypts back to the original plaintext', () => {
      const token = 'ya29.a0AfH6SMBxyz_refresh_token_example';
      expect(service.decrypt(service.encrypt(token))).toBe(token);
    });

    it('produces different ciphertext on each call (random IV)', () => {
      const token = 'same-token';
      const enc1 = service.encrypt(token);
      const enc2 = service.encrypt(token);
      expect(enc1).not.toBe(enc2);
    });

    it('encrypted output does not contain the plaintext as a substring', () => {
      const token = 'super-secret-refresh-token';
      const encrypted = service.encrypt(token);
      expect(encrypted).not.toContain(token);
    });

    it('encrypted output has the iv:authTag:ciphertext format (3 colon-separated parts)', () => {
      const encrypted = service.encrypt('any-token');
      expect(encrypted.split(':').length).toBe(3);
    });

    it('throws on decrypt with a tampered ciphertext', () => {
      const encrypted = service.encrypt('original');
      const parts = encrypted.split(':');
      // Flip a byte in the ciphertext
      const badCiphertext = Buffer.from(parts[2], 'base64');
      badCiphertext[0] ^= 0xff;
      parts[2] = badCiphertext.toString('base64');
      expect(() => service.decrypt(parts.join(':'))).toThrow(/decryption failed/);
    });

    it('throws on decrypt with malformed input (no colons)', () => {
      expect(() => service.decrypt('notvalidatall')).toThrow(/invalid encrypted token format/);
    });

    it('throws on decrypt with wrong number of parts', () => {
      expect(() => service.decrypt('a:b')).toThrow(/must have exactly 3 parts/);
    });

    it('throws on encrypt with empty string', () => {
      expect(() => service.encrypt('')).toThrow(/non-empty string/);
    });

    it('handles tokens with special characters', () => {
      const token = '1//0g-special_chars+/=and&more?query=true';
      expect(service.decrypt(service.encrypt(token))).toBe(token);
    });

    it('handles long tokens', () => {
      const token = 'x'.repeat(2048);
      expect(service.decrypt(service.encrypt(token))).toBe(token);
    });
  });

  // ── Wrong key ─────────────────────────────────────────────────────────────

  describe('wrong key', () => {
    it('throws when decrypting with a different key', () => {
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = VALID_KEY;
      jest.resetModules();
      const TokenEncryptionService = require('../../services/TokenEncryptionService');
      const service1 = new TokenEncryptionService();
      const encrypted = service1.encrypt('secret-token');

      // Use a different key
      process.env.DRIVE_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 'z').toString('base64');
      jest.resetModules();
      const TokenEncryptionService2 = require('../../services/TokenEncryptionService');
      const service2 = new TokenEncryptionService2();

      expect(() => service2.decrypt(encrypted)).toThrow(/decryption failed/);
    });
  });
});
