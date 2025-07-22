// netlify/functions/auth-callback.js
// Callback endpoint to complete Wristband OAuth flow
const { WRISTBAND_CONFIG, validateWristbandConfig } = require('./lib/wristband-config.js');
const { resolveTenantDomainName } = require('./lib/wristband-utils.js');
const { createErrorResponse, createRedirectResponse } = require('./lib/http-utils.js');
const { setSessionCookie } = require('./lib/session-utils.js');
const { createCsrfToken, setCsrfCookie } = require('./lib/csrf-utils.js');
const { clearLoginStateCookie, getLoginStateCookieData } = require('./lib/login-state-utils.js');
const { exchangeAuthCodeForTokens, getUserinfo, InvalidGrantError } = require('./lib/wristband-api.js');
const { createSupabaseJwt } = require('./lib/supabase-utils.js');

const LOGIN_REQUIRED_ERROR = 'login_required';

function validateQueryParams (query = {}) {
  const { code, state, error, error_description: errorDescription, tenant_custom_domain: tenantCustomDomain } = query;

  // Safety checks - Wristband backend should never send bad query params
  if (!state || typeof state !== 'string') {
    throw new Error('Invalid query parameter [state] passed from Wristband during callback');
  }
  if (!!code && typeof code !== 'string') {
    throw new Error('Invalid query parameter [code] passed from Wristband during callback');
  }
  if (!!error && typeof error !== 'string') {
    throw new Error('Invalid query parameter [error] passed from Wristband during callback');
  }
  if (!!errorDescription && typeof errorDescription !== 'string') {
    throw new Error('Invalid query parameter [error_description] passed from Wristband during callback');
  }
  if (!!tenantCustomDomain && typeof tenantCustomDomain !== 'string') {
    throw new Error('Invalid query parameter [tenant_custom_domain] passed from Wristband during callback');
  }
}

// Main handler function
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    validateWristbandConfig();

    // Extract and validate query params from request
    const query = event.queryStringParameters || {};
    validateQueryParams(query);
    
    const {
      code,
      state: paramState,
      error,
      error_description: errorDescription,
      tenant_custom_domain: tenantCustomDomainParam,
    } = query;

    // Resolve and validate the tenant domain name
    const resolvedTenantDomainName = resolveTenantDomainName(event, WRISTBAND_CONFIG.parseTenantFromRootDomain);
    if (!resolvedTenantDomainName) {
      throw new Error(
        WRISTBAND_CONFIG.parseTenantFromRootDomain 
          ? 'Callback request URL is missing a tenant subdomain'
          : 'Callback request is missing the [tenant_domain] query parameter from Wristband'
      );
    }

    // Construct the tenant login URL in the event we have to redirect to the login endpoint
    let tenantLoginUrl = WRISTBAND_CONFIG.parseTenantFromRootDomain
      ? WRISTBAND_CONFIG.loginUrl.replace('{tenant_domain}', resolvedTenantDomainName)
      : `${WRISTBAND_CONFIG.loginUrl}?tenant_domain=${resolvedTenantDomainName}`;
    
    if (tenantCustomDomainParam) {
      tenantLoginUrl = `${tenantLoginUrl}${WRISTBAND_CONFIG.parseTenantFromRootDomain ? '?' : '&'}tenant_custom_domain=${tenantCustomDomainParam}`;
    }

    // Make sure the login state cookie exists, extract it, and prepare to clear it
    const loginStateCookieData = await getLoginStateCookieData(event, paramState);
    if (!loginStateCookieData) {
      return createRedirectResponse(tenantLoginUrl);
    }
    const { cookieValue: loginState, cookieName: loginStateCookieName } = loginStateCookieData;
    const { codeVerifier, customState, redirectUri, returnUrl, state: cookieState } = loginState;

    // Clear the login state cookie
    const loginStateCookieToClear = clearLoginStateCookie(loginStateCookieName);

    // Check for any potential error conditions
    if (paramState !== cookieState) {
      return createRedirectResponse(tenantLoginUrl, [loginStateCookieToClear]);
    }
    if (error) {
      if (error.toLowerCase() === LOGIN_REQUIRED_ERROR) {
        return createRedirectResponse(tenantLoginUrl, [loginStateCookieToClear]);
      }
      throw new Error(`${error}: ${errorDescription || 'Authentication error occurred'}`);
    }

    // Exchange the authorization code for tokens
    if (!code) {
      throw new Error('Invalid query parameter [code] passed from Wristband during callback');
    }
    let tokenResponse;
    try {
      tokenResponse = await exchangeAuthCodeForTokens(code, redirectUri, codeVerifier);
    } catch (ex) {
      if (ex instanceof InvalidGrantError) {
        // Redirect to login for invalid grant
        return createRedirectResponse(tenantLoginUrl, [loginStateCookieToClear]);
      }
      throw ex;
    }

    // Fetch the Wristband userinfo for the user who is logging in.
    const userinfo = await getUserinfo(tokenResponse.access_token);

    // Create application session cookie with user data as well as CSRF cookie
    const csrfToken = createCsrfToken();
    const sessionData = {
      isAuthenticated: true,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      // Convert the "expiresIn" seconds into milliseconds from the epoch.
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
      userId: userinfo.sub,
      tenantId: userinfo.tnt_id,
      email: userinfo.email,
      tenantDomainName: resolvedTenantDomainName,
      ...(tenantCustomDomainParam && { tenantCustomDomain: tenantCustomDomainParam }),
      ...(customState && { customState }),
      csrfToken,
      role: userinfo.roles ? userinfo.roles[0] : {},
      // This token will be used in React when the browser needs to make requests to Supabase.
      supabaseToken: createSupabaseJwt(userinfo.sub, userinfo.tnt_id)
    };
    const sessionCookie = await setSessionCookie(sessionData);
    const csrfCookie = setCsrfCookie(csrfToken);

    // Return successful response with session and CSRF cookies
    const cookiesToSet = [loginStateCookieToClear, sessionCookie, csrfCookie];
    return createRedirectResponse(returnUrl || process.env.WRISBAND_POST_CALLBACK_LANDING_URL, cookiesToSet);
  } catch (error) {
    console.error('Wristband callback error:', error);
    return createErrorResponse(500, 'Internal Server Error', error.message);
  }
};
