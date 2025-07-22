// netlify/functions/lib/wristband-api.js
// API service for making calls to Wristband endpoints
const { WRISTBAND_CONFIG } = require('./wristband-config.js');

// Custom error class for invalid grant errors
class InvalidGrantError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidGrantError';
    this.code = 'INVALID_GRANT';
  }
}

const basicAuthHeader = Buffer
  .from(`${WRISTBAND_CONFIG.clientId}:${WRISTBAND_CONFIG.clientSecret}`)
  .toString('base64');

// Helper function to make authenticated requests to Wristband
async function makeWristbandRequest(endpoint, options = {}) {
  const url = `https://${WRISTBAND_CONFIG.wristbandApplicationVanityDomain}/api/v1${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(`Wristband API error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.response = { status: response.status, statusText: response.statusText, data: responseData };
    throw error;
  }

  return responseData;
}

// Helper function to check if an error has an invalid_grant error
function hasInvalidGrantError(error) {
  return (
    !!error.response?.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data &&
    error.response.data.error === 'invalid_grant'
  );
}

// Helper function to get error description from an error
function getErrorDescription(error) {
  if (error.response?.data && typeof error.response.data === 'object' && 'error_description' in error.response.data) {
    return error.response.data.error_description;
  }
  return undefined;
}

// Helper function to validate token response
function validateTokenResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid token response');
  }

  if (!('access_token' in data) || typeof data.access_token !== 'string') {
    throw new Error('Invalid token response: missing access_token');
  }

  if (!('expires_in' in data) || typeof data.expires_in !== 'number') {
    throw new Error('Invalid token response: missing expires_in');
  }
}

// Exchange authorization code for tokens using PKCE
async function exchangeAuthCodeForTokens(code, redirectUri, codeVerifier) {
  if (!code || !code.trim()) {
    throw new Error('Authorization code is required');
  }

  if (!redirectUri || !redirectUri.trim()) {
    throw new Error('Redirect URI is required');
  }

  if (!codeVerifier || !codeVerifier.trim()) {
    throw new Error('Code verifier is required');
  }

  try {
    const tokenResponse = await makeWristbandRequest('/oauth2/token', {
      method: 'POST',
      body: [
        `grant_type=authorization_code`,
        `code=${code}`,
        `redirect_uri=${redirectUri}`,
        `code_verifier=${codeVerifier}`
      ].join('&'),
      headers: { 'Authorization': `Basic ${basicAuthHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Validate response data is a valid TokenResponse
    validateTokenResponse(tokenResponse);

    return tokenResponse;
  } catch (error) {
    if (hasInvalidGrantError(error)) {
      throw new InvalidGrantError(getErrorDescription(error) || 'Invalid grant');
    }
    throw error;
  }
}

// Get user information using access token
async function getUserinfo(accessToken) {
  if (!accessToken || !accessToken.trim()) {
    throw new Error('Access token is required');
  }

  const userinfo = await makeWristbandRequest('/oauth2/userinfo', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json;charset=UTF-8',
    }
  });

  // Validate response data is a valid Userinfo object
  if (typeof userinfo !== 'object' || userinfo === null) {
    throw new Error('Invalid userinfo response');
  }

  return userinfo;
}

// Refresh access token using refresh token
async function performTokenRefresh(refreshToken) {
  if (!refreshToken || !refreshToken.trim()) {
    throw new Error('Refresh token is required');
  }

  try {
    const tokenResponse = await makeWristbandRequest('/oauth2/token', {
      method: 'POST',
      body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      headers: { 'Authorization': `Basic ${basicAuthHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    // Validate response data is a valid TokenResponse
    validateTokenResponse(tokenResponse);

    return tokenResponse;
  } catch (error) {
    if (hasInvalidGrantError(error)) {
      throw new InvalidGrantError(getErrorDescription(error) || 'Invalid refresh token');
    }
    throw error;
  }
}

// Revoke refresh token
async function revokeRefreshToken(refreshToken) {
  if (!refreshToken || !refreshToken.trim()) {
    throw new Error('Refresh token is required');
  }

  try {
    await makeWristbandRequest('/oauth2/revoke', {
      method: 'POST',
      body: `token=${refreshToken}`,
      headers: { 'Authorization': `Basic ${basicAuthHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  } catch (error) {
    // Don't throw errors for revoke failures
    console.warn(`Failed to revoke refresh token: ${error.message}`);
  }
}

// Refresh token if expired (with retry logic)
async function refreshTokenIfExpired(refreshToken, expiresAt) {
  // Safety checks
  if (!refreshToken) {
    throw new Error('Refresh token must be a valid string');
  }
  if (!expiresAt || expiresAt < 0) {
    throw new Error('The expiresAt field must be an integer greater than 0');
  }

  // Nothing to do if the access token is still valid
  if (Date.now() < expiresAt) {
    return null;
  }

  // Try up to maxRetries times to perform a token refresh
  let attempt = 0;
  while (attempt < 3) {
    try {
      return await performTokenRefresh(refreshToken);
    } catch (error) {
      attempt++;

      // Specifically handle invalid_grant errors
      if (error instanceof InvalidGrantError) {
        throw error;
      }

      // Don't retry 4xx errors
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Error out after 3 failed attempts
      if (attempt >= 3) {
        throw error;
      }
      
      // Wait 100ms before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }

  throw new Error('Token refresh failed after maximum retries');
}

module.exports = {
  InvalidGrantError,
  exchangeAuthCodeForTokens,
  getUserinfo,
  revokeRefreshToken,
  refreshTokenIfExpired
};
