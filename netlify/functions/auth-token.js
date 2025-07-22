// netlify/functions/auth-token.js
/**
 * Token endpoint that retrieves access token and expiration for Wristband React SDK
 * 
 * IMPORTANT: This function is currently NOT used in Porkchop. If Porkchop ever needs to rely
 * on passing around Wristband-issued JWTs for authentication purposes instead of just the session
 * cookie, then the React app would need to call this endpoint via the Wristband React SDK.
 */
const { validateWristbandConfig } = require('./lib/wristband-config.js');
const { refreshTokenIfExpired } = require('./lib/wristband-api.js');
const { getSessionFromCookie, setSessionCookie } = require('./lib/session-utils.js');
const { createErrorResponse } = require('./lib/http-utils');

// Main handler function
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    validateWristbandConfig();

    // Get session from cookie
    const session = await getSessionFromCookie(event);
    const { csrfToken, expiresAt, refreshToken } = session;
    
    // Validate API is protected
    if (!isSessionValid(session) || !expiresAt || !refreshToken) {
      return createErrorResponse(401);
    }
    if (!isCsrfValid(event, csrfToken)) {
      return createErrorResponse(403);
    }

    // Check if we should refresh the token
    let currentSessionData = session;

    const tokenData = await refreshTokenIfExpired(refreshToken, expiresAt);
    if (tokenData) {
      console.log('Token refreshed successfully.');
      currentSessionData = {
        ...currentSessionData,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        idToken: tokenData.idToken,
        // Convert the "expiresIn" seconds into milliseconds from the epoch.
        expiresAt: Date.now() + (tokenData.expiresIn * 1000),
      };
    }

    // We always update the session to extend it's exp window, regardless of new tokens or not.
    const updatedSessionCookie = await setSessionCookie(currentSessionData);
    const touchedCsrfCookie = setCsrfCookie(csrfToken);

    // Return access token and expiration
    const responseBody = JSON.stringify({
      accessToken: currentSessionData.accessToken,
      expiresAt: currentSessionData.expiresAt
    });
    return createOkResponseWithBody(responseBody, [updatedSessionCookie, touchedCsrfCookie], true);
  } catch (error) {
    console.error('Token endpoint error:', error);
    return createErrorResponse(401);
  }
};
