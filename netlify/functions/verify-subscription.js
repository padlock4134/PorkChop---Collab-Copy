// Function that verifies if the current user
const { stripe } = require('./lib/stripe-utils');
const { getSupabase } = require('./lib/supabase-utils');
const { isCsrfValid, setCsrfCookie } = require('./lib/csrf-utils');
const { createErrorResponse, createOkResponseWithBody } = require('./lib/http-utils');
const { getSessionFromCookie, isSessionValid, setSessionCookie } = require('./lib/session-utils');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method Not Allowed');
  }

  // Get session from cookie
  const session = await getSessionFromCookie(event);
  const { csrfToken } = session;

  // Validate API is protected
  if (!isSessionValid(session)) {
    return createErrorResponse(401, 'Unauthorized');
  }
  if (!isCsrfValid(event, csrfToken)) {
    return createErrorResponse(403);
  }

  const touchedSessionCookie = await setSessionCookie(session);
  const touchedCsrfCookie = setCsrfCookie(csrfToken);
  const cookiesToSet = [touchedSessionCookie, touchedCsrfCookie];

  const requestBody = JSON.parse(event.body || '{}');

  // Extract and validate the Supabase userId from the response
  const { userId } = requestBody;
  if (!userId) {
    console.error('No userId found in the request body');
    return createErrorResponse(400, 'No userId found in the request body.');
  }

  const supabase = getSupabase(session.supabaseToken);

  try {
    // First check if subscription already exists in Supabase
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // If it exists, simply return it.
    if (existingSub) {
      return createOkResponseWithBody(JSON.stringify({ isPaid: true, subscription: existingSub }), cookiesToSet, true);
    }

    // If subscription is not in Supabase, then check if both customer and subscription are in Stripe.
    const customers = await stripe.customers.search({ query: `metadata['user_id']:'${userId}'` });

    // If customer is not in Stripe, then they gotta give dat money!!
    if (customers.data.length === 0) {
      // We create the customer now so that we can set metadata since the Checkout Page can't do it.
      await stripe.customers.create({
        email: session.email,
        metadata: {
          user_id: userId,
          external_user_id: session.userId,
          external_tenant_id: session.tenantId
        }
      });

      // Once created, proceed to show the user the Payment Modal so the subscription can be created.
      console.warn(`Stripe customer created for user: [${userId}], but subscription still required.`);
      return createOkResponseWithBody(JSON.stringify({ isPaid: false, subscription: null }), cookiesToSet, true);
    }

    const customer = customers.data[0];

    // If Stripe customer exists, lookup their subscriptions.
    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: 'all' });

    // If subscription is not in Stripe, then they gotta give dat money!!
    if (subscriptions.data.length === 0) {
      console.warn(`No Stripe subscription found for user: [${userId}]`);
      return createOkResponseWithBody(JSON.stringify({ isPaid: false, subscription: null }), cookiesToSet, true);
    }

    const subscription = subscriptions.data[0];

    // Otherwise, provision a new subscription record in Supabase for the user.
    const { data: createdSubscription, error: createSubError } = await supabase
      .from('user_subscriptions')
      .insert([{ 
        user_id: userId,
        stripe_customer_id: customer.id,
        subscription_id: subscription.id,
        plan: subscription.plan || 'monthly',
        status: subscription.status,
        current_period_end: subscription.current_period_end
      }]);

    if (createSubError) {
      console.error('Failed to create subscription: ', createSubError);
      return createErrorResponse(500, `Unexpected error: ${createSubError.message}`);
    }

    // Return the newly created subscription
    const responseBody = JSON.stringify({
      isPaid: createdSubscription.status === 'active',
      subscription: createdSubscription
    });
    return createOkResponseWithBody(responseBody, cookiesToSet, true);
  } catch (err) {
    console.error('Error verifying subscription:', err);
    return createErrorResponse(500, `Unexpected error: ${err.message}`);
  }
};
