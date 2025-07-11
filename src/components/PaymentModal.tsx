import React from 'react';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onDevBypass?: () => void;
  plan?: 'monthly' | 'yearly';
  email?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, onDevBypass, plan, email }) => {
  const handleStripeCheckout = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Redirect to the appropriate payment link based on the selected plan
    if (plan === 'yearly') {
      window.location.href = 'https://buy.stripe.com/dRmeVddkU19lcT2fohfUQ03'; // Yearly plan - $99/year
    } else {
      window.location.href = 'https://buy.stripe.com/aFa9AT3Kk9FR4mw4JDfUQ02'; // Monthly plan - $10.99/month
    }
  };
  
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
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
        
        <p className="mt-4 text-xs text-gray-500 text-center">
          Payments are securely processed by Stripe. You'll be redirected to your dashboard after payment.
        </p>
        
        {/* Development bypass button - only shown in development */}
        {process.env.NODE_ENV === 'development' && onDevBypass && (
          <button 
            onClick={onDevBypass}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
          >
            [DEV] Skip Payment
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
