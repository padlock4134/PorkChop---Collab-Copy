import { netlifyApiClient } from "../client/netlify-api-client";
import { SubscriptionVerification } from "../types/session-types";

// Ensures the user has a subscription in Supabase and Stripe.
export async function verifySubscription(userId: string): Promise<SubscriptionVerification> {
  if (!userId) {
    throw new Error('Valid userId not provided');
  }

  try {
    const response = await netlifyApiClient.post('/verify-subscription', { userId });

    // Non-200 response - something went wrong!
    if (response.status !== 200) {
      throw new Error(`Bad response verifying subscription, status=[${response.status}]`);
    }

    // Return the data so onboarding can act accordingly
    return response.data;
  } catch (error) {
    console.error('Subscription verification failed', error);
    throw error;
  }
}

// Get the Stripe checkout URL to send user to.
export async function createStripeCheckoutSession(userId: string, plan: string): Promise<string> {
  if (!userId) {
    throw new Error('Valid userId not provided');
  }
  if (!plan || !['yearly', 'monthly'].includes(plan)) {
    throw new Error('Valid plan not provided');
  }

  try {
    const response = await netlifyApiClient.post('/stripe-checkout-session', { userId, plan });

    // Non-200 response - something went wrong!
    if (response.status !== 200) {
      throw new Error(`Bad response creating checkout session, status=[${response.status}]`);
    }

    // Return the URL
    return response.data.checkoutUrl;
  } catch (error) {
    console.error('Subscription verification failed', error);
    throw error;
  }
}

