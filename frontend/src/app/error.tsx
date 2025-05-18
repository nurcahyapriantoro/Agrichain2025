'use client';

import React from 'react';
import { formatError } from '@/lib/errorHandling';

export default function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const formattedError = formatError(error);
  
  React.useEffect(() => {
    // Log the error to the console
    console.error('Application error:', formattedError);
  }, [formattedError]);
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-gray-800/80 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-purple-500/20">
        <div className="text-red-400 text-6xl mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Something went wrong
        </h1>
        
        <div className="bg-gray-900/50 p-4 rounded-md mb-6 overflow-auto max-h-48">
          <pre className="text-red-300 text-sm whitespace-pre-wrap">
            {formattedError}
          </pre>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md transition-colors"
          >
            Go to Homepage
          </button>
          
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
