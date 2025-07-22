// netlify/functions/lib/wristband-utils.js
// Shared utility functions for all Wristband functions
const crypto = require('crypto');
const { defaults, seal, unseal } = require('iron-webcrypto');

// Helper functions
function generateRandomString (length = 32) {
  return crypto.randomBytes(length).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLEncode (str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function parseTenantSubdomain (event, parseTenantFromRootDomain) {
  const host = event.headers.host || event.headers.Host;

  if (!host || !parseTenantFromRootDomain){
    return '';
  }

  return host.substring(host.indexOf('.') + 1) === parseTenantFromRootDomain
    ? host.substring(0, host.indexOf('.'))
    : '';
}

function resolveTenantDomainName (event, parseTenantFromRootDomain) {
  // If using tenant subdomains, parse from host
  if (parseTenantFromRootDomain) {
    return parseTenantSubdomain(event, parseTenantFromRootDomain) || '';
  }

  // Otherwise, get from query parameter
  const query = event.queryStringParameters || {};
  const { tenant_domain: tenantDomainParam } = query;

  if (!!tenantDomainParam && typeof tenantDomainParam !== 'string') {
    throw new TypeError('More than one [tenant_domain] query parameter was encountered');
  }

  return tenantDomainParam || '';
}

function resolveTenantCustomDomainParam (event) {
  const query = event.queryStringParameters || {};
  const { tenant_custom_domain: tenantCustomDomainParam } = query;
  
  if (!!tenantCustomDomainParam && typeof tenantCustomDomainParam !== 'string') {
    throw new TypeError('More than one [tenant_custom_domain] query parameter was encountered');
  }
  return tenantCustomDomainParam || '';
}

async function encryptValue (rawValue, secret) {
  if (!secret) {
    throw new Error('No secret provided to encryptValue function.');
  }
  return await seal(crypto, rawValue, secret, defaults);
}

async function decryptValue (encryptedValue, secret) {
  if (!secret) {
    throw new Error('No secret provided to decryptValue function.');
  }
  return await unseal(crypto, encryptedValue, secret, defaults);
}

function getOAuthAuthorizeUrl (event, config) {
  const query = event.queryStringParameters || {};
  const loginHint = query.login_hint;
  
  const queryParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state: config.state,
    scope: config.scopes.join(' '),
    code_challenge: base64URLEncode(crypto.createHash('sha256').update(config.codeVerifier).digest('base64')),
    code_challenge_method: 'S256',
    nonce: generateRandomString(32),
    ...(loginHint ? { login_hint: loginHint } : {})
  });

  const separator = config.isApplicationCustomDomainActive ? '.' : '-';

  // Domain priority order resolution (matching Express SDK)
  if (config.tenantCustomDomain) {
    return `https://${config.tenantCustomDomain}/api/v1/oauth2/authorize?${queryParams.toString()}`;
  }
  if (config.tenantDomainName) {
    return `https://${config.tenantDomainName}${separator}${config.wristbandApplicationVanityDomain}/api/v1/oauth2/authorize?${queryParams.toString()}`;
  }
  if (config.defaultTenantCustomDomain) {
    return `https://${config.defaultTenantCustomDomain}/api/v1/oauth2/authorize?${queryParams.toString()}`;
  }
  if (config.defaultTenantDomainName) {
    return `https://${config.defaultTenantDomainName}${separator}${config.wristbandApplicationVanityDomain}/api/v1/oauth2/authorize?${queryParams.toString()}`;
  }
  
  throw new Error('Cannot determine authorization URL');
}

module.exports = {
  generateRandomString,
  base64URLEncode,
  parseTenantSubdomain,
  resolveTenantDomainName,
  resolveTenantCustomDomainParam,
  encryptValue,
  decryptValue,
  getOAuthAuthorizeUrl
};
