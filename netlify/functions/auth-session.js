// netlify/functions/auth-session.js
// Session endpoint to get current user session data
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils.js');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils.js');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils.js');

// Main handler function
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    // Get session from cookie
    const session = await getSessionFromCookie(event);
    const { csrfToken, tenantId, userId, supabaseToken, email, role } = session;
    
    // Validate API is protected
    if (!isSessionValid(session)) {
      return createErrorResponse(401);
    }
    if (!isCsrfValid(event, csrfToken)) {
      return createErrorResponse(403);
    }

    // We want to "touch" the session and CSRF cookies to extend their expiration window.
    const touchedSessionCookie = await setSessionCookie(session);
    const touchedCsrfCookie = setCsrfCookie(csrfToken);

    // The initial session load must include data. All subsequent calls can avoid returning
    // data over the wire as an optimization.
    const query = event.queryStringParameters || {};
    const { omit_data: omitData } = query;
    const sessionData = omitData === 'true' ? {} : {
      // Response strucutre matters here!! Any additional fields go in "metadata".
      userId, tenantId, metadata: { supabaseToken, email, role }
    };

    return createOkResponseWithBody(JSON.stringify(sessionData), [touchedSessionCookie, touchedCsrfCookie], true);
  } catch (error) {
    console.error('Session validation error:', error);
    return createErrorResponse(401);
  }
};
