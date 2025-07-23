import React from 'react';
import { createStripeCheckoutSession } from '../api/userSubscription';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: 'monthly' | 'yearly';
  userId: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, plan, userId }) => {
  const handleStripeCheckout = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Redirect to the checkout link based on the selected plan
    const checkoutUrl = await createStripeCheckoutSession(userId, plan);
    window.location.href = checkoutUrl;
  };

  // Cancel Subscription handler (placeholder)
  const handleCancelSubscription = async () => {
    // TODO: Replace with actual cancellation logic (Stripe portal, API call, etc.)
    alert('Cancel subscription functionality coming soon!');
  };

  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute text-3xl top-2 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">Complete Your Subscription</h2>
        
        {/* Pricing display */}
        <div className="mb-6 text-center">
          <p className="text-xl font-bold text-maineBlue">
            {plan === 'yearly' ? '$99.00' : '$10.99'}
            <span className="text-base font-normal text-gray-600">/{plan === 'yearly' ? 'year' : 'month'} USD</span>
          </p>
          {plan === 'yearly' && (
            <p className="text-sm text-green-600 mt-1">Save over 24% with annual billing</p>
          )}
        </div>
        
        {/* Single Subscribe button */}
        <button
          onClick={handleStripeCheckout}
          className="w-full py-3 rounded bg-seafoam text-maineBlue font-bold text-lg hover:bg-maineBlue hover:text-seafoam transition-colors"
        >
          Subscribe
        </button>
        {/* Cancel Subscription button */}
        <button
          onClick={handleCancelSubscription}
          className="w-full py-3 mt-3 rounded bg-lobsterRed text-weatheredWhite font-bold text-lg hover:bg-red-700 transition-colors"
        >
          Cancel Subscription
        </button>
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Payments are securely processed by Stripe. You'll be redirected to your dashboard after payment.
        </p>
      </div>
    </div>
  );
};

export default PaymentModal;
