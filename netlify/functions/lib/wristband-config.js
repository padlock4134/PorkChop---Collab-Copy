// netlify/functions/lib/wristband-config.js
// Shared configuration for all Wristband auth functions

// Wristband configuration
const WRISTBAND_CONFIG = {
  clientId: process.env.WRISTBAND_CLIENT_ID,
  clientSecret: process.env.WRISTBAND_CLIENT_SECRET,
  customApplicationLoginPageUrl: '',
  dangerouslyDisableSecureCookies: process.env.WRISTBAND_DANGEROUSLY_DISABLE_SECURE_COOKIES === 'true',
  isApplicationCustomDomainActive: false,
  loginStateSecret: process.env.WRISTBAND_LOGIN_STATE_SECRET,
  loginUrl: process.env.WRISTBAND_LOGIN_URL,
  parseTenantFromRootDomain: '',
  redirectUri: process.env.WRISTBAND_REDIRECT_URI,
  scopes: (process.env.WRISTBAND_SCOPES || 'openid,offline_access,email').split(','),
  wristbandApplicationVanityDomain: process.env.WRISTBAND_APPLICATION_VANITY_DOMAIN,
};

function validateWristbandConfig () {
  const errors = [];
  const {
    clientId,
    clientSecret,
    loginStateSecret,
    loginUrl,
    redirectUri,
    wristbandApplicationVanityDomain
  } = WRISTBAND_CONFIG;
  
  // NOTE: In the absence of a Netlify SDK, we do very basic config validations for now.
  if (!clientId) {
    errors.push('The [clientId] Wristband config must have a value.');
  }
  if (!clientSecret) {
    errors.push('The [clientSecret] Wristband config must have a value.');
  }
  if (!loginStateSecret || loginStateSecret.length < 32) {
    errors.push('The [loginStateSecret] Wristband config must have a value of 32 characters minimum.');
  }
  if (!loginUrl) {
    errors.push('The [loginUrl] Wristband config must have a value.');
  }
  if (!redirectUri) {
    errors.push('The [redirectUri] Wristband config must have a value.');
  }
  if (!wristbandApplicationVanityDomain) {
    errors.push('The [wristbandApplicationVanityDomain] config must have a value (WRISTBAND_APPLICATION_DOMAIN).');
  }
  
  if (errors.length > 0) {
    throw new Error(`Wristband configuration errors:\n${errors.join('\n')}`);
  }
}

module.exports = {
  WRISTBAND_CONFIG,
  validateWristbandConfig
};
