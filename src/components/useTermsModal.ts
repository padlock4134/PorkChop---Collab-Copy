import { useState, useEffect } from 'react';

export function useTermsModal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [termsContent, setTermsContent] = useState('');

  useEffect(() => {
    if (modalOpen && !termsContent) {
      fetch('/TERMS.md').then(res => res.text()).then(setTermsContent);
    }
  }, [modalOpen, termsContent]);

  return { modalOpen, setModalOpen, termsContent };
}
