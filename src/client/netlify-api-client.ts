// import axios, { AxiosResponse } from 'axios';
// import { redirectToLogin } from '@wristband/react-client-auth';
import axios from 'axios';

/**
 * This API client is used for most API calls to Netlify functions. It passes along the CSRF token
 * in the request.
 */
const netlifyApiClient = axios.create({
  baseURL: '/.netlify/functions',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  xsrfCookieName: 'CSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-TOKEN',
  withCredentials: true,
  withXSRFToken: true,
});

// vvv OPTIONAL vvv
// You can make HTTP 401s/403s trigger the user to go log in again.  This happens when their
// session cookie has expired and/or the CSRF cookie/header are missing in the request.
// netlifyApiClient.interceptors.response.use(undefined, async (error: AxiosResponse) => {
//   if (error.status && [401, 403].includes(error.status)) {
//     redirectToLogin('/.netlify/functions/auth-login');
//   }
//   return Promise.reject(error);
// });

export { netlifyApiClient };
