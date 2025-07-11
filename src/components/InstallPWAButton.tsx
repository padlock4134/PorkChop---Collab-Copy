import React, { useEffect, useState } from "react";

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  // On iOS, show instructions instead (no prompt)
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  const handleClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent opening the book
    e.stopPropagation();
    
    if (isIOS) {
      window.alert('To install PorkChop on iOS, tap the Share icon in Safari, then choose "Add to Home Screen".');
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  return (
    <button
      className="landing-cta-btn transition-colors shadow-lg px-6 py-3 rounded text-lg font-bold"
      style={{ backgroundColor: '#e94e3c', color: '#f9fafb' }}
      onMouseOver={e => { e.currentTarget.style.backgroundColor = '#63ace5'; e.currentTarget.style.color = '#2a4d69'; }}
      onFocus={e => { e.currentTarget.style.backgroundColor = '#63ace5'; e.currentTarget.style.color = '#2a4d69'; }}
      onMouseOut={e => { e.currentTarget.style.backgroundColor = '#e94e3c'; e.currentTarget.style.color = '#f9fafb'; }}
      onBlur={e => { e.currentTarget.style.backgroundColor = '#e94e3c'; e.currentTarget.style.color = '#f9fafb'; }}
      onClick={handleClick}
      type="button"
    >
      Install PorkChop App
    </button>
  );
};

export default InstallPWAButton;
