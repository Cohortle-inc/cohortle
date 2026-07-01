'use strict';

/**
 * Drive Routes
 *
 * POST /connect        — exchange OAuth code, store encrypted refresh token
 * POST /disconnect     — revoke token, clear from DB
 * GET  /picker-token   — return short-lived access token for Google Picker
 * POST /ensure-shared  — verify/set "anyone with link can view" on a Drive file
 *
 * All endpoints require a valid convener JWT.
 *
 * Requirements: 3.1–3.7, 5.1–5.6, 10.1–10.3, 11.1–11.5
 */

const UrlMiddleware = require('../middleware/UrlMiddleware');
const TokenMiddleware = require('../middleware/TokenMiddleware');
const driveService = require('../services/DriveService');
const {
  DriveNotConnectedError,
  DriveTokenRevokedError,
  DrivePermissionError,
} = require('../services/DriveService');

/**
 * Middleware that returns 503 if DriveService is not configured.
 */
function requireDriveConfigured(req, res, next) {
  if (!driveService.isConfigured()) {
    return res.status(503).json({
      error: true,
      message: 'Drive service not configured. Contact your administrator.',
    });
  }
  next();
}

/**
 * Translates a DriveService error into an HTTP response.
 */
function handleDriveError(err, res) {
  if (err instanceof DriveNotConnectedError) {
    return res.status(403).json({ error: true, message: err.message });
  }
  if (err instanceof DriveTokenRevokedError) {
    return res.status(401).json({ error: true, message: err.message });
  }
  if (err instanceof DrivePermissionError) {
    return res.status(403).json({ error: true, message: err.message });
  }
  if (err.statusCode === 429) {
    return res.status(429).json({ error: true, message: err.message });
  }
  if (err.statusCode === 503) {
    return res.status(503).json({ error: true, message: err.message });
  }
  return null; // caller should handle as 500
}

const convenerAuth = [
  UrlMiddleware,
  TokenMiddleware({ role: 'convener' }),
  requireDriveConfigured,
];

module.exports = function (app) {
  /**
   * @swagger
   * /v1/api/drive/connect:
   *   post:
   *     summary: Connect Google Drive by exchanging an OAuth authorization code
   *     tags: [Drive]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *     responses:
   *       200:
   *         description: Drive connected successfully
   *       400:
   *         description: Missing authorization code
   *       403:
   *         description: Forbidden (not a convener)
   *       500:
   *         description: Failed to connect Drive
   */
  app.post('/v1/api/drive/connect', convenerAuth, async (req, res) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: true,
        message: 'Authorization code is required.',
      });
    }

    try {
      const result = await driveService.connectDrive(req.user_id, code);
      return res.status(200).json({
        error: false,
        connected: true,
        email: result.email,
      });
    } catch (err) {
      console.error('[Drive /connect] error', { userId: req.user_id, error: err.message });
      const handled = handleDriveError(err, res);
      if (handled) return handled;
      return res.status(500).json({ error: true, message: 'Failed to connect Google Drive.' });
    }
  });

  /**
   * @swagger
   * /v1/api/drive/disconnect:
   *   post:
   *     summary: Disconnect Google Drive and revoke the stored refresh token
   *     tags: [Drive]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Drive disconnected successfully
   *       403:
   *         description: Forbidden (not a convener)
   */
  app.post('/v1/api/drive/disconnect', convenerAuth, async (req, res) => {
    try {
      await driveService.disconnectDrive(req.user_id);
      return res.status(200).json({ error: false, disconnected: true });
    } catch (err) {
      console.error('[Drive /disconnect] error', { userId: req.user_id, error: err.message });
      const handled = handleDriveError(err, res);
      if (handled) return handled;
      return res.status(500).json({ error: true, message: 'Failed to disconnect Google Drive.' });
    }
  });

  /**
   * @swagger
   * /v1/api/drive/picker-token:
   *   get:
   *     summary: Get a short-lived access token for the Google Picker API
   *     tags: [Drive]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Access token returned
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 appId:
   *                   type: string
   *       401:
   *         description: Drive token revoked — reconnect required
   *       403:
   *         description: Drive not connected or not a convener
   *       503:
   *         description: Drive service not configured or unavailable
   */
  app.get('/v1/api/drive/picker-token', convenerAuth, async (req, res) => {
    try {
      const result = await driveService.getPickerToken(req.user_id);
      return res.status(200).json({
        error: false,
        accessToken: result.accessToken,
        appId: result.appId,
      });
    } catch (err) {
      console.error('[Drive /picker-token] error', { userId: req.user_id, error: err.message });
      const handled = handleDriveError(err, res);
      if (handled) return handled;
      return res.status(500).json({ error: true, message: 'Failed to generate picker token.' });
    }
  });

  /**
   * @swagger
   * /v1/api/drive/ensure-shared:
   *   post:
   *     summary: Ensure a Drive file has "anyone with the link can view" sharing
   *     tags: [Drive]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - fileId
   *             properties:
   *               fileId:
   *                 type: string
   *     responses:
   *       200:
   *         description: File is shared (or was already shared)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 shared:
   *                   type: boolean
   *                 alreadyShared:
   *                   type: boolean
   *       400:
   *         description: Missing fileId
   *       401:
   *         description: Drive token revoked
   *       403:
   *         description: Cannot modify sharing permissions
   *       503:
   *         description: Drive service unavailable
   */
  app.post('/v1/api/drive/ensure-shared', convenerAuth, async (req, res) => {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: true, message: 'fileId is required.' });
    }

    try {
      const result = await driveService.ensureFileShared(req.user_id, fileId);
      return res.status(200).json({
        error: false,
        shared: result.shared,
        alreadyShared: result.alreadyShared,
      });
    } catch (err) {
      console.error('[Drive /ensure-shared] error', {
        userId: req.user_id,
        fileId,
        error: err.message,
      });
      const handled = handleDriveError(err, res);
      if (handled) return handled;
      return res.status(500).json({ error: true, message: 'Failed to set file sharing.' });
    }
  });

  /**
   * @swagger
   * /v1/api/drive/status:
   *   get:
   *     summary: Get the current Drive connection status for the authenticated convener
   *     tags: [Drive]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Connection status returned
   */
  app.get(
    '/v1/api/drive/status',
    [UrlMiddleware, TokenMiddleware({ role: 'convener' })],
    async (req, res) => {
      try {
        const user = await require('../models').users.findOne({
          where: { id: req.user_id },
          attributes: ['drive_refresh_token', 'drive_connected_email'],
        });

        const isConnected = !!(user && user.drive_refresh_token);
        return res.status(200).json({
          error: false,
          isConnected,
          email: isConnected ? user.drive_connected_email : null,
        });
      } catch (err) {
        console.error('[Drive /status] error', { userId: req.user_id, error: err.message });
        return res.status(500).json({ error: true, message: 'Failed to fetch Drive status.' });
      }
    }
  );
};
