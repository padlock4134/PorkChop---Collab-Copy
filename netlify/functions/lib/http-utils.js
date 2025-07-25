function parseCookies (event) {
  const cookieHeader = event.headers.cookie;
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  });
  
  return cookies;
}

function createCookieString (name, value, options = {}) {
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (options.maxAge !== undefined) {
    cookieString += `; Max-Age=${options.maxAge}`;
  }
  if (options.path) {
    cookieString += `; Path=${options.path}`;
  }
  if (options.httpOnly) {
    cookieString += `; HttpOnly`;
  }
  if (options.secure) {
    cookieString += `; Secure`;
  }
  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }
  
  return cookieString;
}

function createErrorResponse (statusCode, message, devMessage = null) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: message,
      ...(process.env.NODE_ENV === 'development' && devMessage && { message: devMessage })
    })
  };
}

function createRedirectResponse (location, cookies = []) {
  const response = {
    statusCode: 302,
    headers: {
      'Location': location,
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
    body: ''
  };

  if (cookies.length > 0) {
    response.multiValueHeaders = {
      'Set-Cookie': cookies
    };
  }
  // if (cookies.length > 0) {
  //   response.headers['Set-Cookie'] = cookies.join('; ');
  // }

  return response;
}

function createOkResponseWithBody (body, cookies = [], noCache = false) {
  if (!body) {
    throw new Error('Response body missing for 200 response');
  }

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      ...(noCache && { 'Cache-Control': 'no-store' }),
      ...(noCache && { 'Pragma': 'no-cache' }),
    },
    body
  };

  if (cookies.length > 0) {
    response.multiValueHeaders = {
      'Set-Cookie': cookies
    };
  }
  // if (cookies.length > 0) {
  //   response.headers['Set-Cookie'] = cookies.join('; ');
  // }

  return response;
}

module.exports = {
  createErrorResponse,
  createRedirectResponse,
  createOkResponseWithBody,
  createCookieString,
  parseCookies
};
