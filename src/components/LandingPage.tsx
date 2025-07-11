import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

import TermsModal from './TermsModal';
import { useTermsModal } from './useTermsModal';
import InstallPWAButton from "./InstallPWAButton";

import FlippableCookbook from "./FlippableCookbook";
// Placeholder SVG for Freddie (replace with your vector when ready)
const FreddieSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" aria-label="Grandpa Freddie" style={{marginBottom: '1rem'}}>
    <circle cx="40" cy="40" r="38" fill="#f9fafb" stroke="#63ace5" strokeWidth="4"/>
    <ellipse cx="40" cy="50" rx="22" ry="18" fill="#e94e3c" opacity="0.13"/>
    <circle cx="40" cy="38" r="20" fill="#f5e9da" stroke="#2a4d69" strokeWidth="2"/>
    <ellipse cx="40" cy="44" rx="12" ry="8" fill="#fff"/>
    <circle cx="32" cy="38" r="2.5" fill="#2a4d69"/>
    <circle cx="48" cy="38" r="2.5" fill="#2a4d69"/>
    <path d="M34 48 Q40 54 46 48" stroke="#2a4d69" strokeWidth="2" fill="none"/>
  </svg>
);

const RecipeCard = ({ title, icon, children }: { title: string, icon?: string, children: React.ReactNode }) => (
  <section className="recipe-card bg-weatheredWhite rounded-2xl shadow-lg border-2 border-seafoam mb-8 p-7 max-w-xl mx-auto">
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-2xl">{icon}</span>}
      <h2 className="text-xl font-retro font-bold text-maineBlue">{title}</h2>
    </div>
    <div className="recipe-content text-navy font-sans">{children}</div>
  </section>
);

// Add deferredPrompt to Window interface
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

const LandingPage: React.FC = () => {
  const { modalOpen, setModalOpen, termsContent } = useTermsModal();
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  
  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return (
    <div className="landing-root bg-sand font-retro min-h-screen flex flex-col">
      <main className="landing-main flex-1 flex flex-col items-center px-4">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.5rem 0',
          width: '900px',
          maxWidth: '100%',
          padding: '0 1rem',
          boxSizing: 'border-box',
          marginLeft: 'auto',
          marginRight: 'auto'
        }} className="landing-buttons">
          <style>{`
            @media (max-width: 900px) {
              .landing-buttons {
                width: 100%;
                padding: 0 0.5rem;
              }
            }
            @media (max-width: 768px) {
              .landing-buttons {
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                flex-wrap: nowrap;
                gap: 0.25rem;
              }
              .landing-buttons a, .landing-buttons button {
                font-size: 0.9rem !important;
                padding: 0.4rem 0.8rem !important;
                min-width: 100px !important;
                margin: 0 !important;
              }
            }
          `}</style>
          <Link
            to="/signin"
            style={{
              fontFamily: 'Bree Serif, serif',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              background: '#e7c89e',
              color: '#2a4d69',
              padding: '0.6rem 1.5rem',
              borderRadius: '1.4rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 12px #2a4d6922',
              border: '2px solid #e94e3c',
              textDecoration: 'none',
              transition: 'all 0.2s',
              outline: 'none',
              flex: '0 0 auto',
              minWidth: '140px',
              textAlign: 'center',
              margin: '0 1rem'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#e94e3c'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#e7c89e'; e.currentTarget.style.color = '#2a4d69'; }}
          >
            Log In
          </Link>
          <Link
            to="/signup"
            style={{
              fontFamily: 'Bree Serif, serif',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              background: '#63ace5',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: '1.4rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 12px #2a4d6922',
              border: '2px solid #2a4d69',
              textDecoration: 'none',
              transition: 'all 0.2s',
              outline: 'none',
              flex: '0 0 auto',
              minWidth: '140px',
              textAlign: 'center',
              margin: '0 1rem'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#2a4d69'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#63ace5'; e.currentTarget.style.color = '#fff'; }}
          >
            Sign Up
          </Link>
          <button
            style={{
              fontFamily: 'Bree Serif, serif',
              fontSize: 'clamp(1rem, 3vw, 1.5rem)',
              background: '#e94e3c',
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: '1.4rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              boxShadow: '0 2px 12px #2a4d6922',
              border: '2px solid #63ace5',
              textDecoration: 'none',
              transition: 'all 0.2s',
              outline: 'none',
              cursor: 'pointer',
              flex: '0 0 auto',
              minWidth: '140px',
              textAlign: 'center',
              margin: '0 1rem'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#63ace5'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#e94e3c'; e.currentTarget.style.color = '#fff'; }}
            onClick={(e) => {
              e.stopPropagation();
              const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
              if (isIOS) {
                window.alert('To install PorkChop on iOS, tap the Share icon in Safari, then choose "Add to Home Screen".');
              } else {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  deferredPrompt.userChoice.then(() => {
                    window.deferredPrompt = null;
                    setDeferredPrompt(null);
                  });
                } else {
                  alert('Installation is only available when accessing this site directly in a compatible browser.');
                }
              }
            }}
          >
            Install App
          </button>
        </div>
        <section className="flex flex-col items-center justify-center w-full" style={{ margin: '5rem 0 1rem' }}>
          <div className="cookbook-wrapper">
            <FlippableCookbook />
          </div>
        </section>
        <div style={{ marginTop: '2rem', textAlign: 'center', paddingBottom: '2rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#2a4d69' }}>
            {new Date().getFullYear()} PorkChop. All rights reserved. |{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setModalOpen(true)}>Terms of Service</span>
          </span>
        </div>
        <TermsModal isOpen={modalOpen} onClose={() => setModalOpen(false)} termsContent={termsContent} />
      </main>
    </div>
  );
};

export default LandingPage;
