import React, { useState } from 'react';
import logo from '../images/logo.png';
import { Link } from 'react-router-dom';

const SignUp = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [card, setCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Placeholder for actual sign-up and Stripe logic
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // TODO: Integrate Supabase Auth and Stripe trial logic
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/dashboard';
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-sand">
      <div className="w-full max-w-sm">
        <div className="bg-maineBlue rounded-t-lg flex flex-col items-center justify-center py-6">
          <img src={logo} alt="PorkChop Logo" className="h-16 w-16 object-contain mb-2" />
        </div>
        <form onSubmit={handleSignUp} className="bg-white p-8 rounded-b-lg shadow max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-6 text-maineBlue">Sign Up</h2>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-lobsterRed text-weatheredWhite py-2 rounded font-semibold hover:bg-seafoam hover:text-maineBlue transition-colors" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up (7-day free trial)'}
          </button>
          <div className="mt-2 text-center text-xs text-gray-500">
            By signing up, you agree to our <Link to="/terms" className="underline text-maineBlue hover:text-lobsterRed">Terms of Service</Link>.
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account? <Link to="/signin" className="text-maineBlue underline">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
