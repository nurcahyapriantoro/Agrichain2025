/**
 * Global error handler for the application.
 * This file contains utilities for handling errors globally.
 */

/**
 * Format error objects into readable strings
 */
export const formatError = (error: unknown): string => {
  if (error === null) return 'Error: null';
  if (error === undefined) return 'Error: undefined';
  
  if (typeof error === 'object') {
    // If it's an Error instance
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    }
    
    // If it has a message property
    if ('message' in error && typeof (error as any).message === 'string') {
      return `Error: ${(error as any).message}`;
    }
    
    // If it has a stack property
    if ('stack' in error && typeof (error as any).stack === 'string') {
      return (error as any).stack;
    }
    
    // Otherwise, stringify the object
    try {
      return `Error object: ${JSON.stringify(error)}`;
    } catch (e) {
      return `Error object: [Could not stringify]`;
    }
  }
  
  // For primitive values
  return `Error: ${String(error)}`;
};

/**
 * Set up global error handlers
 */
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window === 'undefined') return;
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = formatError(event.reason);
    console.error('Unhandled Promise Rejection:', errorMessage);
    
    // Prevent the default browser handling
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught Error:', event.message);
    console.error('Error Location:', event.filename, `line ${event.lineno}:${event.colno}`);
    
    // Prevent the default browser handling
    event.preventDefault();
  });
};
