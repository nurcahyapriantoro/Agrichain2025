'use client';

import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function BenefitsOfTransparencyArticle() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">Supply Chain</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Benefits of Transparent Supply Chains</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          <span className="mr-4">5 min read</span>
          <span>Published: May 30, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          An exploration of how transparency in agricultural supply chains creates value for all participants,
          from increased consumer trust and premium pricing to improved operational efficiency and regulatory compliance.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2>Introduction: The Value of Transparency</h2>
        
        <p>
          Supply chain transparency—the ability to access accurate information about the origin, journey, and handling of products—has
          emerged as a critical competitive advantage in modern agriculture. Beyond simply addressing consumer demands for information,
          transparency creates tangible benefits for every participant in the supply chain.
        </p>

        <p>
          This article examines how transparent supply chains deliver value across the agricultural ecosystem,
          from farmers and processors to retailers and consumers, creating a more efficient and equitable system for all.
        </p>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-6 my-8">
          <h3 className="text-green-800 text-xl mb-2">Article Coming Soon</h3>
          <p>
            We're currently working on completing this comprehensive article about the benefits of supply chain transparency.
            Check back soon for the full content covering:
          </p>
          <ul className="list-disc pl-6 mb-0 space-y-2">
            <li>Consumer trust and brand loyalty benefits</li>
            <li>Premium pricing opportunities for verified products</li>
            <li>Risk management and rapid response capabilities</li>
            <li>Operational efficiency improvements</li>
            <li>Regulatory compliance advantages</li>
            <li>Environmental and social impact verification</li>
            <li>Technology solutions enabling transparency</li>
          </ul>
        </div>
        
        <p>
          In the meantime, we invite you to explore our other articles about supply chain management and blockchain technology.
        </p>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/supply-chain/supply-chain-challenges" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors duration-300">Previous: Supply Chain Challenges in Agriculture</h4>
            <p className="text-gray-600">Explore common challenges faced in agricultural supply chains</p>
          </Link>
          <Link href="/learn/articles/blockchain/blockchain-fundamentals" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-green-700 transition-colors duration-300">Next: Blockchain Fundamentals</h4>
            <p className="text-gray-600">Learn how blockchain enables transparent supply chains</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 