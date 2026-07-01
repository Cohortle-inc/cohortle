'use strict';

/**
 * DriveService
 *
 * Handles all Google Drive API interactions:
 *   - connectDrive()     — exchange auth code, store encrypted refresh token
 *   - disconnectDrive()  — revoke token, clear from DB
 *   - getPickerToken()   — generate fresh access token for Google Picker
 *   - ensureFileShared() — verify/set "anyone with link can view" sharing
 *
 * Requirements: 3.1–3.7, 5.1–5.6, 10.1–10.3, 11.1–11.5
 */

const { google } = require('googleapis');
const db = require('../models');
const TokenEncryptionService = require('./TokenEncryptionService');

// Custom error types for structured error handling
class DriveNotConnectedError extends Error {
  constructor() {
    super('Google Drive is not connected.');
    this.name = 'DriveNotConnectedError';
    this.statusCode = 403;
  }
}

class DriveTokenRevokedError extends Error {
  constructor() {
    super('Drive token revoked. Please reconnect.');
    this.name = 'DriveTokenRevokedError';
    this.statusCode = 401;
  }
}

class DrivePermissionError extends Error {
  constructor(message) {
    super(message || 'Cannot modify sharing: file is in a shared drive you do not own.');
    this.name = 'DrivePermissionError';
    this.statusCode = 403;
  }
}

class DriveService {
  constructor() {
    // Validate required environment variables at construction time
    const missing = [];
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push('GOOGLE_CLIENT_SECRET');
    if (!process.env.DRIVE_OAUTH_REDIRECT_URI) missing.push('DRIVE_OAUTH_REDIRECT_URI');

    if (missing.length > 0) {
      console.error(
        `[DriveService] Missing required environment variables: ${missing.join(', ')}. ` +
        'Drive endpoints will return 503.'
      );
      this._configured = false;
    } else {
      this._configured = true;
    }

    // Lazily initialise TokenEncryptionService — it throws if key is missing
    this._encryption = null;
  }

  /**
   * Returns true if the service is fully configured (env vars present).
   */
  isConfigured() {
    return this._configured;
  }

  /**
   * Returns the TokenEncryptionService instance, initialising it on first use.
   * @throws {Error} if DRIVE_TOKEN_ENCRYPTION_KEY is not set
   */
  _getEncryption() {
    if (!this._encryption) {
      this._encryption = new TokenEncryptionService();
    }
    return this._encryption;
  }

  /**
   * Builds an OAuth2 client using environment credentials.
   */
  _buildOAuthClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.DRIVE_OAUTH_REDIRECT_URI
    );
  }

  /**
   * Exchanges an authorization code for tokens and stores the encrypted refresh token.
   *
   * @param {number} userId
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<{ email: string }>}
   */
  async connectDrive(userId, code) {
    const oauth2Client = this._buildOAuthClient();

    let tokens;
    let email;

    try {
      const { tokens: exchanged } = await oauth2Client.getToken(code);
      tokens = exchanged;
    } catch (err) {
      console.error('[DriveService] connectDrive: token exchange failed', {
        userId,
        error: err.message,
      });
      throw new Error('Failed to connect Google Drive.');
    }

    // Retrieve the connected Google account email
    try {
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      email = data.email;
    } catch (err) {
      console.error('[DriveService] connectDrive: failed to fetch user email', {
        userId,
        error: err.message,
      });
      // Non-fatal — store token without email
      email = null;
    }

    if (!tokens.refresh_token) {
      throw new Error(
        'Failed to connect Google Drive: no refresh token returned. ' +
        'Ensure the OAuth flow requests offline access and prompt=consent.'
      );
    }

    // Encrypt and store the refresh token
    const encryption = this._getEncryption();
    const encryptedToken = encryption.encrypt(tokens.refresh_token);

    await db.users.update(
      {
        drive_refresh_token: encryptedToken,
        drive_connected_email: email,
      },
      { where: { id: userId } }
    );

    return { email };
  }

  /**
   * Revokes the stored refresh token and clears it from the database.
   *
   * @param {number} userId
   */
  async disconnectDrive(userId) {
    const user = await db.users.findOne({
      where: { id: userId },
      attributes: ['id', 'drive_refresh_token'],
    });

    if (!user || !user.drive_refresh_token) {
      // Already disconnected — idempotent
      await db.users.update(
        { drive_refresh_token: null, drive_connected_email: null },
        { where: { id: userId } }
      );
      return;
    }

    // Attempt to revoke the token with Google
    try {
      const encryption = this._getEncryption();
      const refreshToken = encryption.decrypt(user.drive_refresh_token);
      const oauth2Client = this._buildOAuthClient();
      await oauth2Client.revokeToken(refreshToken);
    } catch (err) {
      // Log but don't fail — we still clear the token from our DB
      console.error('[DriveService] disconnectDrive: token revocation failed', {
        userId,
        error: err.message,
      });
    }

    await db.users.update(
      { drive_refresh_token: null, drive_connected_email: null },
      { where: { id: userId } }
    );
  }

  /**
   * Generates a fresh access token for the Picker API.
   *
   * @param {number} userId
   * @returns {Promise<{ accessToken: string, appId: string }>}
   * @throws {DriveNotConnectedError} if no refresh token is stored
   * @throws {DriveTokenRevokedError} if the refresh token is invalid/revoked
   */
  async getPickerToken(userId) {
    const user = await db.users.findOne({
      where: { id: userId },
      attributes: ['id', 'drive_refresh_token'],
    });

    if (!user || !user.drive_refresh_token) {
      throw new DriveNotConnectedError();
    }

    let refreshToken;
    try {
      const encryption = this._getEncryption();
      refreshToken = encryption.decrypt(user.drive_refresh_token);
    } catch (err) {
      console.error('[DriveService] getPickerToken: decryption failed', {
        userId,
        error: err.message,
      });
      throw new DriveTokenRevokedError();
    }

    const oauth2Client = this._buildOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    let accessToken;
    try {
      const { token } = await oauth2Client.getAccessToken();
      accessToken = token;
    } catch (err) {
      console.error('[DriveService] getPickerToken: access token exchange failed', {
        userId,
        error: err.message,
      });

      // If the token is invalid/revoked, clear it from the DB
      if (
        err.message &&
        (err.message.includes('invalid_grant') || err.message.includes('Token has been expired'))
      ) {
        await db.users.update(
          { drive_refresh_token: null, drive_connected_email: null },
          { where: { id: userId } }
        );
        throw new DriveTokenRevokedError();
      }

      // Google API unreachable or rate limit
      if (err.code === 429 || (err.response && err.response.status === 429)) {
        const rateLimitErr = new Error('Google Drive rate limit reached. Please try again shortly.');
        rateLimitErr.statusCode = 429;
        throw rateLimitErr;
      }

      const unavailableErr = new Error('Google Drive is currently unavailable.');
      unavailableErr.statusCode = 503;
      throw unavailableErr;
    }

    return {
      accessToken,
      appId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    };
  }

  /**
   * Verifies and sets "anyone with the link can view" sharing on a file.
   *
   * @param {number} userId
   * @param {string} fileId
   * @returns {Promise<{ shared: boolean, alreadyShared: boolean }>}
   * @throws {DriveNotConnectedError}
   * @throws {DriveTokenRevokedError}
   * @throws {DrivePermissionError}
   */
  async ensureFileShared(userId, fileId) {
    const user = await db.users.findOne({
      where: { id: userId },
      attributes: ['id', 'drive_refresh_token'],
    });

    if (!user || !user.drive_refresh_token) {
      throw new DriveNotConnectedError();
    }

    let refreshToken;
    try {
      const encryption = this._getEncryption();
      refreshToken = encryption.decrypt(user.drive_refresh_token);
    } catch (err) {
      console.error('[DriveService] ensureFileShared: decryption failed', {
        userId,
        fileId,
        error: err.message,
      });
      throw new DriveTokenRevokedError();
    }

    const oauth2Client = this._buildOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Fetch file metadata (name + current permissions)
    let fileName = fileId;
    let alreadyShared = false;

    try {
      const fileRes = await drive.files.get({
        fileId,
        fields: 'id,name,permissions',
        supportsAllDrives: true,
      });

      fileName = fileRes.data.name || fileId;

      // Check if "anyone" with "reader" permission already exists
      const permissions = fileRes.data.permissions || [];
      alreadyShared = permissions.some(
        (p) => p.type === 'anyone' && (p.role === 'reader' || p.role === 'writer')
      );
    } catch (err) {
      console.error('[DriveService] ensureFileShared: failed to fetch file metadata', {
        userId,
        fileId,
        error: err.message,
      });
      this._handleDriveApiError(err, userId, fileId);
    }

    if (alreadyShared) {
      // Audit log — file was already shared
      console.log(
        JSON.stringify({
          event: 'drive_file_shared',
          userId,
          fileId,
          fileName,
          timestamp: new Date().toISOString(),
          alreadyShared: true,
        })
      );
      return { shared: true, alreadyShared: true };
    }

    // Set sharing to "anyone with the link can view"
    try {
      await drive.permissions.create({
        fileId,
        supportsAllDrives: true,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
      });
    } catch (err) {
      console.error('[DriveService] ensureFileShared: failed to set sharing permission', {
        userId,
        fileId,
        error: err.message,
      });
      this._handleDriveApiError(err, userId, fileId);
    }

    // Audit log — permission change made
    console.log(
      JSON.stringify({
        event: 'drive_file_shared',
        userId,
        fileId,
        fileName,
        timestamp: new Date().toISOString(),
        alreadyShared: false,
      })
    );

    return { shared: true, alreadyShared: false };
  }

  /**
   * Translates Google Drive API errors into appropriate service errors.
   * @private
   */
  _handleDriveApiError(err, userId, fileId) {
    const status = err.code || (err.response && err.response.status);
    const message = err.message || '';

    if (status === 401 || message.includes('invalid_grant')) {
      db.users.update(
        { drive_refresh_token: null, drive_connected_email: null },
        { where: { id: userId } }
      ).catch(() => {});
      throw new DriveTokenRevokedError();
    }

    if (status === 403) {
      if (
        message.includes('shared drive') ||
        message.includes('cannotShareTeamDriveTopFolderWithAnyonePermission') ||
        message.includes('insufficientFilePermissions')
      ) {
        throw new DrivePermissionError(
          'Cannot modify sharing: file is in a shared drive you do not own. ' +
          'Please share the file manually and paste the link.'
        );
      }
      throw new DrivePermissionError();
    }

    if (status === 429) {
      const rateLimitErr = new Error('Google Drive rate limit reached. Please try again shortly.');
      rateLimitErr.statusCode = 429;
      throw rateLimitErr;
    }

    // Network / service unavailable
    const unavailableErr = new Error('Google Drive is currently unavailable.');
    unavailableErr.statusCode = 503;
    throw unavailableErr;
  }
}

// Export a singleton instance and the error classes
const driveService = new DriveService();

module.exports = driveService;
module.exports.DriveService = DriveService;
module.exports.DriveNotConnectedError = DriveNotConnectedError;
module.exports.DriveTokenRevokedError = DriveTokenRevokedError;
module.exports.DrivePermissionError = DrivePermissionError;
