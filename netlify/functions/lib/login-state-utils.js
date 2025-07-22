// netlify/functions/lib/session-utils.js
// Login state management utilities for Wristband authentication
const { encryptValue, decryptValue, generateRandomString } = require('./wristband-utils.js');
const { WRISTBAND_CONFIG } = require('./wristband-config.js');
const { createCookieString, parseCookies } = require('./http-utils.js');

const LOGIN_STATE_COOKIE_SEPARATOR = '#';
const LOGIN_STATE_COOKIE_PREFIX = `login${LOGIN_STATE_COOKIE_SEPARATOR}`;

async function encryptLoginState (rawLoginState) {
  const encryptedLoginState = await encryptValue(rawLoginState, WRISTBAND_CONFIG.loginStateSecret);
  if (encryptedLoginState.length > 4096) {
    throw new Error('Login state cookie exceeds 4kB in size.');
  }
  return encryptedLoginState;
}

async function decryptLoginState (encryptedLoginState) {
  try {
    return await decryptValue(encryptedLoginState, WRISTBAND_CONFIG.loginStateSecret);
  } catch (error) {
    throw new Error(`Failed to decrypt login state cookie: ${error.message}`);
  }
}

// Find and decrypt login state cookie by state parameter
async function getLoginStateCookieData (event, state = '') {
  if (!state) {
    return null;
  }
  
  const existingCookies = parseCookies(event);

  // Find the cookie that matches this state
  const matchingCookieName = Object.keys(existingCookies).find(cookieName => {
    return cookieName.startsWith(`${LOGIN_STATE_COOKIE_PREFIX}${state}${LOGIN_STATE_COOKIE_SEPARATOR}`)
  });

  if (!matchingCookieName) {
    return null;
  }

  try {
    const loginStateData = await decryptLoginState(existingCookies[matchingCookieName]);

    // Basic validation
    if (!loginStateData || typeof loginStateData !== 'object') {
      return null;
    }

    return { cookieName: matchingCookieName, cookieValue: loginStateData };
  } catch (error) {
    console.warn('Failed to decrypt session cookie:', error.message);
    return null;
  }
}

// Create or update the session cookie string
async function setLoginStateCookie(loginState) {
  const encryptedLoginState = await encryptLoginState(loginState);
  const loginStateCookieName = `${LOGIN_STATE_COOKIE_PREFIX}${loginState.state}${LOGIN_STATE_COOKIE_SEPARATOR}${Date.now()}`;
  return createCookieString(loginStateCookieName, encryptedLoginState, {
    maxAge: 3600, // 1 hour
    path: '/',
    httpOnly: true,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

// Clear login state cookie
function clearLoginStateCookie(loginStateCookieName) {
  return createCookieString(loginStateCookieName, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

function getOldLoginStateCookiesToClear (event) {
  const existingCookies = parseCookies(event);

  // The max amount of concurrent login state cookies we allow is 3.  If there are already 3 cookies,
  // then we clear the one with the oldest creation timestamp to make room for the new one.
  const allLoginCookieNames = Object.keys(existingCookies).filter(cookieName => {
    return cookieName.startsWith(LOGIN_STATE_COOKIE_PREFIX);
  });

  const cookiesToClear = [];
  
  // Retain only the 2 cookies with the most recent timestamps
  if (allLoginCookieNames.length >= 3) {
    const mostRecentTimestamps = allLoginCookieNames
      .map(cookieName => {
        return cookieName.split(LOGIN_STATE_COOKIE_SEPARATOR)[2];
      })
      .sort()
      .reverse()
      .slice(0, 2);

    allLoginCookieNames.forEach(cookieName => {
      const timestamp = cookieName.split(LOGIN_STATE_COOKIE_SEPARATOR)[2];
      if (!mostRecentTimestamps.includes(timestamp)) {
        cookiesToClear.push(createCookieString(cookieName, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
          sameSite: 'Lax'
        }));
      }
    });
  }

  return cookiesToClear;
}

function createLoginState (event, config = {}) {
  const query = event.queryStringParameters || {};
  const { return_url: returnUrl } = query;

  if (!!returnUrl && typeof returnUrl !== 'string') {
    throw new TypeError('More than one [return_url] query parameter was encountered');
  }
  
  return {
    state: generateRandomString(32),
    codeVerifier: generateRandomString(32),
    redirectUri: WRISTBAND_CONFIG.redirectUri,
    ...(returnUrl ? { returnUrl } : {}),
    ...(!!config.customState && !!Object.keys(config.customState).length ? { customState: config.customState } : {}),
  };
}

module.exports = {
  getLoginStateCookieData,
  setLoginStateCookie,
  clearLoginStateCookie,
  createLoginState,
  getOldLoginStateCookiesToClear
};
