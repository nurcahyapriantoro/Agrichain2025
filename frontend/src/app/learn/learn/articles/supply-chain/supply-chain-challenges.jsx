'use client';

import { Zap, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SupplyChainChallengesArticle() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">Supply Chain</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Supply Chain Challenges in Agriculture</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          <span className="mr-4">6 min read</span>
          <span>Published: May 22, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          An exploration of the key challenges facing agricultural supply chains, from traceability issues and food fraud
          to inefficient processes and climate change impacts, and how modern solutions are addressing these problems.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2 className="mb-6 font-bold text-3xl">Introduction: The Complex World of Agricultural Supply Chains</h2>
        
        <p className="mb-4">
          Agricultural supply chains face a unique set of challenges unlike any other industry. From the fundamental unpredictability
          of weather and growing conditions to the perishable nature of products, these supply chains must navigate complex obstacles
          while providing essential food and materials to global populations.
        </p>

        <p className="mb-4">
          This article examines the most significant challenges facing agricultural supply chains today and explores
          how new approaches and technologies are working to address these persistent issues.
        </p>
        
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-6 my-8">
          <h3 className="text-orange-800 text-xl mb-4 font-bold">Article Coming Soon</h3>
          <p className="mb-4">
            We're currently working on completing this comprehensive article about agricultural supply chain challenges.
            Check back soon for the full content covering:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
            <li>Traceability and transparency limitations</li>
            <li>Food safety and contamination risks</li>
            <li>Verification of sustainable and ethical practices</li>
            <li>Climate change impacts on agricultural production</li>
            <li>Food loss and waste management</li>
            <li>Small farmer inclusion and fair compensation</li>
            <li>Technological solutions and future directions</li>
          </ul>
        </div>
        
        <p className="mb-4">
          In the meantime, we invite you to explore our other articles about supply chain management and blockchain technology.
        </p>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/supply-chain/traditional-vs-blockchain" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-700 transition-colors duration-300">Previous: Traditional vs. Blockchain Supply Chains</h4>
            <p className="text-gray-600">Compare traditional and blockchain-based supply chain models</p>
          </Link>
          <Link href="/learn/articles/supply-chain/benefits-of-transparency" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-700 transition-colors duration-300">Next: Benefits of Transparent Supply Chains</h4>
            <p className="text-gray-600">Discover how transparency benefits all participants</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 