import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Define the shape of contextual data Freddie can use
export type FreddieContextType = {
  route: string;
  context: Record<string, any>;
  setContext: (data: Record<string, any>) => void;
  updateContext: (data: Record<string, any>) => void;
};

const FreddieContext = createContext<FreddieContextType | undefined>(undefined);

export const FreddieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [context, setContextState] = useState<Record<string, any>>({});

  // Replace context
  const setContext = useCallback((data: Record<string, any>) => {
    setContextState(data);
  }, []);

  // Merge context
  const updateContext = useCallback((data: Record<string, any>) => {
    setContextState(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <FreddieContext.Provider value={{ route: location.pathname, context, setContext, updateContext }}>
      {children}
    </FreddieContext.Provider>
  );
};

export const useFreddieContext = () => {
  const ctx = useContext(FreddieContext);
  if (!ctx) throw new Error('useFreddieContext must be used within a FreddieProvider');
  return ctx;
};
