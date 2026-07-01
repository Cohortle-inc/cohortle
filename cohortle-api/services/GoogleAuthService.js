const { OAuth2Client } = require('google-auth-library');

/**
 * GoogleAuthService
 *
 * Service for validating Google ID tokens using the google-auth-library.
 * Extracts user identity from verified token payloads.
 *
 * Requirements: 2.3, 2.6, 8.1, 8.3
 */
class GoogleAuthService {
  /**
   * Validates a Google ID token and returns the user identity payload.
   *
   * @param {string} idToken - The Google ID token received from the frontend
   * @returns {Promise<{email: string, sub: string, given_name: string, family_name: string, email_verified: boolean}>}
   * @throws {Error} if GOOGLE_CLIENT_ID is not configured or the token is invalid/expired
   *
   * Requirements: 2.3, 2.6, 8.1, 8.3
   */
  async verifyIdToken(idToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error(
        'Google authentication is not configured: GOOGLE_CLIENT_ID environment variable is missing'
      );
    }

    const client = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch (err) {
      throw new Error(`Invalid or expired Google token: ${err.message}`);
    }

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid Google token: no payload returned');
    }

    return {
      email: payload.email,
      sub: payload.sub,
      given_name: payload.given_name,
      family_name: payload.family_name,
      email_verified: payload.email_verified,
    };
  }
}

module.exports = new GoogleAuthService();
