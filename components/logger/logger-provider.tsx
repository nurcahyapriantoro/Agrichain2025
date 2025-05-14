'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { initLogger, getLogger } from '@/lib/initLogger';

// Create a logger context
export const LoggerContext = createContext({
  logger: getLogger()
});

// Hook to use the logger throughout the application
export const useLogger = () => useContext(LoggerContext);

// Provider component that initializes the logger
export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize the logger on the client side only
    const { logger } = initLogger();
    console.log('Logger system initialized');
  }, []);

  return (
    <LoggerContext.Provider value={{ logger: getLogger() }}>
      {children}
    </LoggerContext.Provider>
  );
} 