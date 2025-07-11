import React from 'react';
import logo from '../images/logo.png';
import { Link } from 'react-router-dom';

const ConfirmEmail = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sand">
      <div className="w-full max-w-md">
        <div className="bg-maineBlue rounded-t-lg flex flex-col items-center justify-center py-6">
          <img src={logo} alt="PorkChop Logo" className="h-16 w-16 object-contain mb-2" />
        </div>
        <div className="bg-white p-8 rounded-b-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-maineBlue">Check Your Email</h2>
          <div className="mb-6">
            <p className="mb-4">
              Thanks for your payment! We've sent a confirmation link to your email.
            </p>
            <p className="mb-4">
              Please check your inbox and click the link to confirm your email address and activate your subscription.
            </p>
            <p className="text-sm text-gray-600">
              If you don't see the email, check your spam folder.
            </p>
          </div>
          <Link 
            to="/signin" 
            className="inline-block bg-maineBlue text-seafoam py-2 px-6 rounded font-semibold hover:bg-seafoam hover:text-maineBlue transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
