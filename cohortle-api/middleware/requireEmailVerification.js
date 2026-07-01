/**
 * Email Verification Middleware
 * 
 * Middleware to require email verification for specific routes.
 * Returns 403 Forbidden if user is not verified.
 * 
 * Requirements: 3.1, 3.2
 * 
 * MVP MODE: Email verification can be disabled via REQUIRE_EMAIL_VERIFICATION env var
 * Set REQUIRE_EMAIL_VERIFICATION=false to disable for MVP (default: true)
 */

/**
 * Middleware to require email verification
 * Checks req.email_verified from JWT payload
 * Returns 403 with clear message if not verified
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireEmailVerification(req, res, next) {
  // MVP MODE: Check if email verification is disabled
  const requireVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
  
  if (!requireVerification) {
    // Email verification disabled for MVP - allow all authenticated users
    if (!req.user_id) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }
    return next();
  }

  // Check if user is authenticated
  if (!req.user_id) {
    return res.status(401).json({
      error: true,
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    });
  }

  // Check if email is verified
  if (!req.email_verified) {
    return res.status(403).json({
      error: true,
      message: 'Please verify your email address to perform this action. Check your inbox for the verification email or request a new one.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
      details: {
        action: 'verify_email',
        email: req.email
      }
    });
  }

  // Email is verified, proceed
  next();
}

module.exports = requireEmailVerification;
