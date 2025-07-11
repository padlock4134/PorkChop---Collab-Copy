import React from 'react';
import ReactMarkdown from 'react-markdown';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  termsContent: string;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, termsContent }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[80vh] relative">
        <button className="absolute top-2 right-2 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Terms of Service & Privacy Policy</h2>
        <div className="terms-content">
  <ReactMarkdown>{termsContent}</ReactMarkdown>
</div>
      </div>
    </div>
  );
};

export default TermsModal;
