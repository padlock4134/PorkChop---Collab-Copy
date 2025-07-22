// netlify/functions/auth-login.js
// Login endpoint to start the Wristband OAuth flow
const { WRISTBAND_CONFIG, validateWristbandConfig } = require('./lib/wristband-config.js');
const {
  resolveTenantDomainName,
  resolveTenantCustomDomainParam,
  getOAuthAuthorizeUrl,
} = require('./lib/wristband-utils.js');
const { createErrorResponse, createRedirectResponse } = require('./lib/http-utils.js');
const {
  createLoginState,
  getOldLoginStateCookiesToClear,
  setLoginStateCookie
} = require('./lib/login-state-utils.js');

// Placeholder values for now since we don't have a Netlify SDK to pass in default values yet.
const customState = undefined;
const defaultTenantCustomDomain = '';
const defaultTenantDomainName = process.env.WRISTBAND_GLOBAL_TENANT_DOMAIN_NAME;

// Main handler function
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    validateWristbandConfig();

    // Determine which domain-related values are present
    const tenantCustomDomain = resolveTenantCustomDomainParam(event);
    const tenantDomainName = resolveTenantDomainName(event, WRISTBAND_CONFIG.parseTenantFromRootDomain);

    // In the event we cannot determine either a tenant custom domain or subdomain, send to app-level login
    if (!tenantCustomDomain && !tenantDomainName && !defaultTenantCustomDomain && !defaultTenantDomainName) {
      const appLoginUrl =
        WRISTBAND_CONFIG.customApplicationLoginPageUrl ||
        `https://${WRISTBAND_CONFIG.wristbandApplicationVanityDomain}/login`;
      return createRedirectResponse(`${appLoginUrl}?client_id=${WRISTBAND_CONFIG.clientId}`);
    }

    // Create the login state which will be cached in a cookie so that it can be accessed in the callback.
    const loginState = createLoginState(event, { customState });
    
    // Build Wristband authorization URL with tenant vanity domain
    const authorizeUrl = getOAuthAuthorizeUrl(event, {
      wristbandApplicationVanityDomain: WRISTBAND_CONFIG.wristbandApplicationVanityDomain,
      isApplicationCustomDomainActive: WRISTBAND_CONFIG.isApplicationCustomDomainActive,
      clientId: WRISTBAND_CONFIG.clientId,
      redirectUri: WRISTBAND_CONFIG.redirectUri,
      state: loginState.state,
      codeVerifier: loginState.codeVerifier,
      scopes: WRISTBAND_CONFIG.scopes,
      tenantCustomDomain,
      tenantDomainName,
      defaultTenantDomainName,
      defaultTenantCustomDomain
    });
    
    // Clear old login state cookies if needed (3 max allowed)
    const loginStateCookiesToClear = getOldLoginStateCookiesToClear(event);
    
    // Add new login state cookie
    const newLoginStateCookie = await setLoginStateCookie(loginState);

    // Redirect to Wristband's Authorize Endpoint using the tenant vanity domain.
    return createRedirectResponse(authorizeUrl, [newLoginStateCookie, ...loginStateCookiesToClear]);
  } catch (error) {
    console.error('Wristband login error:', error);
    return createErrorResponse(500, 'Internal Server Error', error.message);
  }
};
