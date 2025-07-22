// netlify/functions/auth-logout.js
const { getSessionFromCookie, clearSessionCookie } = require('./lib/session-utils');
const { WRISTBAND_CONFIG, validateWristbandConfig } = require('./lib/wristband-config.js');
const { clearCsrfCookie } = require('./lib/csrf-utils.js');
const { createErrorResponse, createRedirectResponse } = require('./lib/http-utils.js');
const { revokeRefreshToken } = require('./lib/wristband-api.js');

// Placeholder values for now since we don't have a Netlify SDK to pass in default values yet.
const logoutRedirectUrl = process.env.WRISBAND_POST_LOGOUT_LANDING_URL;
const logoutConfigTenantCustomDomain = '';
const logoutConfigTenantDomainName = process.env.WRISTBAND_GLOBAL_TENANT_DOMAIN_NAME;

function validateQueryParams (query = {}) {
  const { tenant_custom_domain: tenantCustomDomain, tenant_domain: tenantDomain } = query;
  if (tenantCustomDomain && Array.isArray(tenantCustomDomain)) {
    throw new Error('More than one tenant_custom_domain parameter was encountered');
  }
  if (tenantDomain && Array.isArray(tenantDomain)) {
    throw new Error('More than one tenant_domain parameter was encountered');
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  try {
    validateWristbandConfig();

    // Get session from cookie
    const sessionData = await getSessionFromCookie(event);
    const { refreshToken } = sessionData;

    const sessionCookieToClear = clearSessionCookie();
    const csrfCookieToClear = clearCsrfCookie();
    const cookiesToSet = [sessionCookieToClear, csrfCookieToClear];

    // Extract and validate query params from request
    const query = event.queryStringParameters || {};
    validateQueryParams(query);
    const { tenant_custom_domain: tenantCustomDomainParam, tenant_domain: tenantDomainParam } = query;

    const {
      clientId,
      customApplicationLoginPageUrl,
      isApplicationCustomDomainActive,
      parseTenantFromRootDomain,
      wristbandApplicationVanityDomain
    } = WRISTBAND_CONFIG;

    // Revoke refresh token only if it's present
    if (refreshToken) {
      try {
        await revokeRefreshToken(refreshToken);
      } catch (error) {
        console.warn('Revoking refresh token failed during logout:', error.message);
      }
    }

    // Build logout URL
    const redirectUrl = logoutRedirectUrl ? `&redirect_url=${encodeURIComponent(logoutRedirectUrl)}` : '';
    const wristbandQuery = `client_id=${clientId}${redirectUrl}`;
    const separator = isApplicationCustomDomainActive ? '.' : '-';
    const host = event.headers.host || event.headers.Host;

    // Domain priority order resolution:
    // 1) If the LogoutConfig has a tenant custom domain explicitly defined, use that.
    // 2) If the LogoutConfig has a tenant domain defined, then use that.
    // 3) If the tenant_custom_domain query param exists, then use that.
    // 4a) If tenant subdomains are enabled, get the tenant domain from the host.
    // 4b) Otherwise, if tenant subdomains are not enabled, then look for it in the tenant_domain query param.
    // 5) Fallback to application login page (tenant discovery)
    let tenantDomainToUse = '';
    
    if (logoutConfigTenantCustomDomain) {
      // #1
      tenantDomainToUse = logoutConfigTenantCustomDomain;
    } else if (logoutConfigTenantDomainName) {
      // #2
      tenantDomainToUse = `${logoutConfigTenantDomainName}${separator}${wristbandApplicationVanityDomain}`;
    } else if (tenantCustomDomainParam) {
      // #3
      tenantDomainToUse = tenantCustomDomainParam;
    } else if (parseTenantFromRootDomain && host && host.substring(host.indexOf('.') + 1) === parseTenantFromRootDomain) {
      // #4a
      const tenantDomainNameFromHost = host.substring(0, host.indexOf('.'));
      tenantDomainToUse = `${tenantDomainNameFromHost}${separator}${wristbandApplicationVanityDomain}`;
    } else if (tenantDomainParam) {
      // #4b
      tenantDomainToUse = `${tenantDomainParam}${separator}${this.wristbandApplicationVanityDomain}`;
    } else {
      // #5
      const appLoginUrl = customApplicationLoginPageUrl || `https://${wristbandApplicationVanityDomain}/login`;
      const fallbackUrl = logoutRedirectUrl || `${appLoginUrl}?client_id=${clientId}`;
      
      return createRedirectResponse(fallbackUrl, cookiesToSet);
    }

    // Redirect to Wristband logout with session cookie cleared
    const wristbandLogoutUrl = `https://${tenantDomainToUse}/api/v1/logout?${wristbandQuery}`;
    return createRedirectResponse(wristbandLogoutUrl, cookiesToSet);
  } catch (error) {
    console.error('Wristband logout error:', error);
    return createErrorResponse(500, 'Internal Server Error', error.message);
  }
};
