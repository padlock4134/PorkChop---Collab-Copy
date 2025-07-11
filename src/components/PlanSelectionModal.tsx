import React from 'react';
import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';

interface PlanSelectionModalProps {
  open: boolean;
  onSelectPlan: (plan: 'monthly' | 'yearly') => void;
  onClose: () => void;
}

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$10.99/mo',
    description: '$10.99 per month. Cancel anytime.'
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$99/yr',
    description: '$99 per year. Save over 24% vs monthly.'
  }
];

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ open, onSelectPlan, onClose }) => {
  const [selected, setSelected] = React.useState<'monthly' | 'yearly' | null>(null);
  const { modalOpen, setModalOpen, termsContent } = useTermsModal();
  const [tosChecked, setTosChecked] = React.useState(false);

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
        <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Plan</h2>
        <div className="flex flex-col gap-4 mb-6">
          {plans.map(plan => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id as 'monthly' | 'yearly')}
              className={`w-full border rounded-lg p-4 flex flex-col items-start transition-all ${selected === plan.id ? 'border-seafoam bg-seafoam/10 shadow' : 'border-gray-300 bg-white hover:border-seafoam'}`}
            >
              <span className="font-bold text-lg mb-1">{plan.name}</span>
              <span className="text-xl text-maineBlue font-bold mb-1">{plan.price}</span>
              <span className="text-gray-500 text-sm">{plan.description}</span>
            </button>
          ))}
        </div>
        {/* TOS Checkbox and Modal Trigger */}
        <div className="flex flex-col items-center mb-4">
          <div className="flex items-center">
            <input
              id="tos-checkbox"
              type="checkbox"
              checked={tosChecked}
              onChange={e => setTosChecked(e.target.checked)}
              className="mr-2 accent-seafoam w-4 h-4"
            />
            <label htmlFor="tos-checkbox" className="text-xs text-gray-700 select-none">
              I agree to the{' '}
              <button
                type="button"
                className="underline text-maineBlue hover:text-lobsterRed focus:outline-none"
                onClick={() => setModalOpen(true)}
                tabIndex={0}
              >
                Terms of Service
              </button>
            </label>
          </div>
        </div>
        <button
          className="w-full py-3 rounded bg-seafoam text-maineBlue font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-maineBlue hover:text-seafoam transition-colors"
          disabled={!selected || !tosChecked}
          onClick={() => selected && tosChecked && onSelectPlan(selected)}
        >
          Continue to Payment
        </button>
        <p className="mt-6 text-xs text-gray-500 text-center">Payments are securely processed. You'll be redirected to your dashboard after payment.</p>
        <TermsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          termsContent={termsContent}
        />
      </div>
    </div>
  );
};

export default PlanSelectionModal;
