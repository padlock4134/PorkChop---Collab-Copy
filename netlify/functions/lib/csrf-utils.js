// netlify/functions/lib/csrf-utils.js
// Shared utility functions for handling Cross-Site Request Forgery (CSRF) protection
const crypto = require('crypto');
const { WRISTBAND_CONFIG } = require('./wristband-config.js');
const { createCookieString } = require('./http-utils');

const CSRF_TOKEN_COOKIE_NAME = 'CSRF-TOKEN';
const CSRF_TOKEN_HEADER_NAME = 'x-csrf-token';

function createCsrfToken () {
  return crypto.randomBytes(32).toString('hex');
}

function isCsrfValid (event, csrfToken) {
  const csrfTokenHeader = event.headers[CSRF_TOKEN_HEADER_NAME];
  const isValid = csrfToken && csrfTokenHeader && csrfToken === csrfTokenHeader;
  if (!isValid) {
    console.error('CSRF is invalid.');
  }
  return isValid;
}

function setCsrfCookie(csrfToken) {
  return createCookieString(CSRF_TOKEN_COOKIE_NAME, csrfToken, {
    maxAge: process.env.PORKCHOP_SESSION_COOKIE_MAX_AGE,
    path: '/',
    httpOnly: false,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

// Clear session cookie
function clearCsrfCookie() {
  return createCookieString(CSRF_TOKEN_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
    httpOnly: false,
    secure: !WRISTBAND_CONFIG.dangerouslyDisableSecureCookies,
    sameSite: 'Lax'
  });
}

module.exports = {
  clearCsrfCookie,
  createCsrfToken,
  isCsrfValid,
  setCsrfCookie
};
