const { Resend } = require('resend');

let resendClient = null;

/**
 * Get or initialize Resend client with API key from environment
 * Uses lazy initialization to avoid breaking tests
 * @returns {Resend|null} Initialized Resend client instance or null if API key not configured
 */
function getResendClient() {
  if (resendClient) {
    return resendClient;
  }
  
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY environment variable is not configured. Email functionality will not work.');
    return null;
  }
  
  resendClient = new Resend(apiKey);
  return resendClient;
}

// Export getter function
module.exports = getResendClient();
