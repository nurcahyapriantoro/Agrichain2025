import React from 'react';
import Image from 'next/image';
import { ScrollRevealSection } from './ui/ScrollRevealSection';
import { AnimatedIcon } from './ui/AnimatedIcon';

export function FeatureSection() {
  return (
    <div className="py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
        Blockchain-Powered Features
      </h2>
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Feature 1 */}
        <ScrollRevealSection direction="left" className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="mb-4">
                <AnimatedIcon colorClass="text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </AnimatedIcon>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Product Verification</h3>
              <p className="text-gray-300 mb-6">
                Verify the authenticity and origin of agricultural products with blockchain-secured records. 
                Each product has a unique digital identity that can be traced from farm to consumer.
              </p>
              <ul className="space-y-3">
                {['QR code scanning', 'Certificate verification', 'Producer information', 'Complete history'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <span className="mr-2 text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-gray-900/50 p-4 rounded-xl">
              <div className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">🌾</div>
                    <div className="text-xl font-semibold text-white">Product Verification Demo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollRevealSection>
        
        {/* Feature 2 */}
        <ScrollRevealSection direction="right" className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="bg-gray-900/50 p-4 rounded-xl">
              <div className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-yellow-500/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-xl font-semibold text-white">Transaction Transparency</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <AnimatedIcon colorClass="text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </AnimatedIcon>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Transaction Transparency</h3>
              <p className="text-gray-300 mb-6">
                All transactions along the supply chain are recorded on blockchain, bringing 
                full transparency to pricing, handling, and ownership transfers.
              </p>
              <ul className="space-y-3">
                {['Immutable transaction records', 'Fair pricing visibility', 'Transfer history', 'Digital certificates'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <span className="mr-2 text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ScrollRevealSection>
        
        {/* Feature 3 */}
        <ScrollRevealSection direction="left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="mb-4">
                <AnimatedIcon colorClass="text-purple-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </AnimatedIcon>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Multi-Stakeholder Platform</h3>
              <p className="text-gray-300 mb-6">
                Connect all participants in the agricultural supply chain - from farmers and collectors 
                to traders, retailers, and consumers - in a single, integrated platform.
              </p>
              <ul className="space-y-3">
                {['Role-based access', 'Direct communication', 'Supply chain collaboration', 'Consumer engagement'].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-300">
                    <span className="mr-2 text-green-400">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 bg-gray-900/50 p-4 rounded-xl">
              <div className="relative h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-6 text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <div className="text-xl font-semibold text-white">Stakeholder Connectivity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollRevealSection>
      </div>
    </div>
  );
}

export default FeatureSection; 