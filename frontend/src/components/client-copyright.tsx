'use client';

import { useState, useEffect } from 'react';

export function ClientCopyright() {
  const [year, setYear] = useState('');
  
  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);
  
  return <>{year}</>;
} 