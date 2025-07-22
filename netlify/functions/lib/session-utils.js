// netlify/functions/lib/session-utils.js
// Session management utilities for Wristband authentication
const { encryptValue, decryptValue } = require('./wristband-utils.js');
const { WRISTBAND_CONFIG } = require('./wristband-config.js');
const { createCookieString, parseCookies } = require('./http-utils.js');

async function encryptSession (rawSession) {
  const encryptedSession = await encryptValue(rawSession, process.env.PORKCHOP_SESSION_SECRET);
  if (encryptedSession.length > 4096) {
    throw new Error('Session cookie exceeds 4kB in size.');
  }
  return encryptedSession;
}

async function decryptSession (encryptedSession) {
  try {
    const session = await decryptValue(encryptedSession, process.env.PORKCHOP_SESSION_SECRET);
    return session;
  } catch (error) {
    throw new Error(`Failed to decrypt session cookie: ${error.message}`);
  }
}

// Get and decrypt session from cookie
async function getSessionFromCookie(event) {
  const cookies = parseCookies(event);
  const sessionCookie = cookies.session;
  
  if (!sessionCookie) {
    return {};
  }

  try {
    const sessionData = await decryptSession(sessionCookie);
    
    // Basic validation
    if (!sessionData || typeof sessionData !== 'object') {
      return {};
    }

    return sessionData;
  } catch (error) {
    console.warn('Failed to decrypt session cookie:', error.message);
    return {};
  }
}

// Create or update the session cookie string
async function setSessionCookie(sessionData) {
  const encryptedSession = await encryptSession(sessionData);
  return createCookieString('session', encryptedSession, {
    maxAge: process.env.PORKCHOP_SESSION_COOKIE_MAX_AGE,
    path: '/',
    httpOnly: true,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

// Clear session cookie
function clearSessionCookie() {
  return createCookieString('session', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

function isSessionValid(session = {}) {
  const { isAuthenticated, tenantId, userId, supabaseToken, email, role } = session;
  const isValid = isAuthenticated && tenantId && userId && supabaseToken && email && role && Object.keys(role).length > 0;
  if (!isValid) {
    console.error('User does not have an authenticated session.');
  }
  return isValid;
}

module.exports = {
  getSessionFromCookie,
  setSessionCookie,
  clearSessionCookie,
  isSessionValid
};
