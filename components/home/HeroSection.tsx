import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { API_URLS, getCurrentPort } from '@/lib/config';

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const [currentPort, setCurrentPort] = useState<number | null>(null);
  const [endpoints, setEndpoints] = useState<{primary: string, secondary: string}>({
    primary: '', 
    secondary: ''
  });
  
  useEffect(() => {
    setCurrentPort(getCurrentPort());
    setEndpoints({
      primary: API_URLS.primary,
      secondary: API_URLS.secondary
    });
  }, []);

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center text-center px-4 py-20">
      {/* Hero Text */}
      <h1 className="text-5xl md:text-6xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-6 tracking-tight">
        Agrichain Platform
        <span className="block text-2xl md:text-3xl mt-3 font-medium text-gray-200">
          Blockchain-powered Supply Chain for Agriculture
        </span>
      </h1>
      
      <p className="max-w-2xl text-gray-300 text-lg mb-8">
        Securely track agricultural products from farm to table with transparent, 
        immutable blockchain records. Ensure quality, authenticity, and fair trade.
      </p>
      
      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        {isAuthenticated ? (
          <Link href="/dashboard" passHref>
            <Button className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg">
              Go to Dashboard <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        ) : (
          <>
            <Link href="/auth/login" passHref>
              <Button className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg">
                Get Started <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/learn" passHref>
              <Button variant="outline" className="px-8 py-6 border-gray-600 hover:bg-gray-800 text-lg">
                Learn More
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
} 