// Stripe webhook handler for Netlify Functions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async function(event) {
  // Verify method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = event.headers['stripe-signature'];
  
  let stripeEvent;
  
  // Verify the webhook signature
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      stripeWebhookSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return { 
      statusCode: 400, 
      body: `Webhook Error: ${err.message}`
    };
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    // Extract the customer email from the session
    const customerEmail = session.customer_email;
    
    if (!customerEmail) {
      console.error('No customer email found in the session');
      return { 
        statusCode: 400, 
        body: 'No customer email found in session'
      };
    }

    try {
      // Get the Supabase user ID for this email
      const { data: authUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (userError || !authUser) {
        console.error(`Failed to find user with email ${customerEmail}`, userError);
        return { 
          statusCode: 404, 
          body: `User not found for email: ${customerEmail}`
        };
      }

      const userId = authUser.id;

      // Check if subscription already exists
      const { data: existingSub } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Determine subscription details from session
      const subscriptionId = session.subscription;
      const isPaid = true;
      const status = 'active';
      const currentPeriodEnd = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // Default to 1 year from now

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            subscription_id: subscriptionId,
            status,
            current_period_end: currentPeriodEnd
          })
          .eq('id', existingSub.id);

        if (updateError) {
          console.error('Failed to update subscription:', updateError);
          return { 
            statusCode: 500, 
            body: 'Failed to update subscription'
          };
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabase
          .from('user_subscriptions')
          .insert([{ 
            user_id: userId, 
            subscription_id: subscriptionId,
            status,
            current_period_end: currentPeriodEnd
          }]);

        if (insertError) {
          console.error('Failed to create subscription:', insertError);
          return { 
            statusCode: 500, 
            body: 'Failed to create subscription'
          };
        }
      }

      console.log(`Successfully updated subscription status for user ${userId}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };
    } catch (err) {
      console.error('Error processing webhook:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }
  
  // Return a 200 response for any other event types
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
