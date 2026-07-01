'use strict';

/**
 * Token Encryption Service
 *
 * Provides AES-256-GCM encrypt/decrypt for Google Drive refresh tokens.
 * The encryption key is read from the DRIVE_TOKEN_ENCRYPTION_KEY environment
 * variable, which must be a base64-encoded 32-byte (256-bit) key.
 *
 * Generate a suitable key with: openssl rand -base64 32
 *
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const KEY_BYTE_LENGTH = 32; // 256-bit key

class TokenEncryptionService {
  /**
   * @throws {Error} if DRIVE_TOKEN_ENCRYPTION_KEY is missing or decodes to fewer than 32 bytes
   */
  constructor() {
    const raw = process.env.DRIVE_TOKEN_ENCRYPTION_KEY;

    if (!raw) {
      throw new Error(
        'TokenEncryptionService: DRIVE_TOKEN_ENCRYPTION_KEY environment variable is not set. ' +
        'Generate a key with: openssl rand -base64 32'
      );
    }

    let keyBuffer;
    try {
      keyBuffer = Buffer.from(raw, 'base64');
    } catch {
      throw new Error(
        'TokenEncryptionService: DRIVE_TOKEN_ENCRYPTION_KEY is not valid base64.'
      );
    }

    if (keyBuffer.length < KEY_BYTE_LENGTH) {
      throw new Error(
        `TokenEncryptionService: DRIVE_TOKEN_ENCRYPTION_KEY decodes to ${keyBuffer.length} bytes ` +
        `but must be at least ${KEY_BYTE_LENGTH} bytes (256 bits). ` +
        'Generate a new key with: openssl rand -base64 32'
      );
    }

    // Use exactly 32 bytes (truncate if longer, e.g. 33-byte base64 decode)
    this._key = keyBuffer.slice(0, KEY_BYTE_LENGTH);
  }

  /**
   * Encrypts a plaintext token using AES-256-GCM.
   *
   * @param {string} plaintext - The refresh token to encrypt
   * @returns {string} Colon-delimited base64 string: "<iv>:<authTag>:<ciphertext>"
   */
  encrypt(plaintext) {
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new Error('TokenEncryptionService.encrypt: plaintext must be a non-empty string');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this._key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Decrypts an AES-256-GCM encrypted token.
   *
   * @param {string} encrypted - Colon-delimited base64 string: "<iv>:<authTag>:<ciphertext>"
   * @returns {string} The original plaintext token
   * @throws {Error} if the input is malformed or authentication fails
   */
  decrypt(encrypted) {
    if (typeof encrypted !== 'string' || !encrypted.includes(':')) {
      throw new Error('TokenEncryptionService.decrypt: invalid encrypted token format');
    }

    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      throw new Error('TokenEncryptionService.decrypt: encrypted token must have exactly 3 parts (iv:authTag:ciphertext)');
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;

    let iv, authTag, ciphertext;
    try {
      iv = Buffer.from(ivB64, 'base64');
      authTag = Buffer.from(authTagB64, 'base64');
      ciphertext = Buffer.from(ciphertextB64, 'base64');
    } catch {
      throw new Error('TokenEncryptionService.decrypt: failed to decode base64 components');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, this._key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (err) {
      throw new Error('TokenEncryptionService.decrypt: decryption failed — token may be tampered or key may be wrong');
    }
  }
}

module.exports = TokenEncryptionService;
