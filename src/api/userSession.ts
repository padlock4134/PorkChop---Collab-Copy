import { netlifyApiClient } from "../client/netlify-api-client";

// Checks the get-session endpoint in Netlify to ensure the user's session cookie still exists
export async function isSessionValid(): Promise<boolean> {
  try {
    const response = await netlifyApiClient.get('/auth-session');

    if (response.status !== 200) {
      // Non-200 response - session invalid
      return false;
    }

    // Session is valid, throw away the response
    return true;
  } catch (error) {
    console.error('Session check failed:', error);
    return false;
  }
}
