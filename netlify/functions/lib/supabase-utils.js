const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SIGNING_OPTIONS = { algorithm: 'HS256' };

// Initialize Supabase client
function getSupabase(supabaseJwt) {
  return createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    accessToken: async () => supabaseJwt,
  });
}

// Creates the Supabase token needed for React to make authenticated calls
// to Supabase from the browser.
function createSupabaseJwt (userId, tenantId) {
  if (!userId) {
    throw new Error('UserId missing from session data.')
  }
  if (!tenantId) {
    throw new Error('TenantId missing from session data.')
  }

  // Leave off the "exp" claim since we don't want it to expire.
  const payload = {
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    iss: 'supabase',
    sub: userId,
    role: 'authenticated',
    user_metadata: { provider: 'wristband', tenant_id: tenantId }
  };

  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, SIGNING_OPTIONS);
};

module.exports = {
  createSupabaseJwt,
  getSupabase
};
