'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';

export default function GettingStarted() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">User Guide</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Getting Started with AgriChain</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <span className="mr-4">8 min read</span>
          <span>Last updated: June 10, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          A comprehensive guide for new users explaining how to create an account, select your role, and start using the AgriChain platform.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2>Welcome to AgriChain</h2>
        
        <p>
          AgriChain is a blockchain-based platform designed to revolutionize agricultural supply chains by providing transparency, 
          traceability, and trust among all participants. This guide will walk you through the essential steps to get started with 
          the platform and help you understand its core features.
        </p>

        <h2>Creating Your Account</h2>
        
        <p>
          To begin using AgriChain, you'll need to create an account. Follow these simple steps:
        </p>
        
        <ol>
          <li>
            <strong>Visit the registration page</strong> - Navigate to the "Sign Up" button on the homepage or go directly 
            to the registration page.
          </li>
          <li>
            <strong>Provide your information</strong> - Enter your name, email address, and create a secure password. Make 
            sure to use a strong password that includes a mix of letters, numbers, and special characters.
          </li>
          <li>
            <strong>Verify your email</strong> - You'll receive a verification email at the address you provided. Click the 
            verification link to confirm your account.
          </li>
          <li>
            <strong>Complete your profile</strong> - Once verified, you'll be prompted to complete your profile with additional 
            details such as your location, contact information, and a profile picture (optional).
          </li>
        </ol>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
          <h3 className="text-blue-800 text-xl mb-2">Security Tip</h3>
          <p className="mb-0">
            Keep your login credentials secure and never share them with others. AgriChain implements blockchain technology
            that ensures your transactions are immutable, but your account security starts with your password protection.
          </p>
        </div>

        <h2>Selecting Your Role</h2>
        
        <p>
          After creating your account, you'll need to select your role in the agricultural supply chain. 
          AgriChain caters to various stakeholders:
        </p>
        
        <ul>
          <li>
            <strong>Farmer</strong> - Primary producers who grow crops or raise livestock. As a farmer, you'll be able to 
            register your products, record harvest details, and initiate product journeys in the supply chain.
          </li>
          <li>
            <strong>Collector/Aggregator</strong> - Entities that collect products from multiple farmers. You'll record 
            transactions with farmers and manage product batches.
          </li>
          <li>
            <strong>Processor</strong> - Organizations that transform raw agricultural products. You'll track incoming 
            materials and outgoing processed products.
          </li>
          <li>
            <strong>Distributor/Trader</strong> - Businesses that distribute products to retailers. You'll manage logistics 
            and product movements.
          </li>
          <li>
            <strong>Retailer</strong> - Businesses selling directly to consumers. You'll verify product authenticity and 
            complete the supply chain record.
          </li>
          <li>
            <strong>Consumer</strong> - End users of agricultural products. You'll have access to verify product origins 
            and view the complete supply chain journey.
          </li>
        </ul>
        
        <p>
          To select your role:
        </p>
        
        <ol>
          <li>Navigate to the "Select Role" page after logging in</li>
          <li>Choose the role that best represents your position in the supply chain</li>
          <li>Provide any role-specific information requested</li>
          <li>Submit your role selection</li>
        </ol>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 my-8">
          <h3 className="text-yellow-800 text-xl mb-2">Note</h3>
          <p className="mb-0">
            Your role determines what actions you can perform on the platform. Some roles may require additional verification 
            steps before full access is granted.
          </p>
        </div>

        <h2>Navigating the Dashboard</h2>
        
        <p>
          After selecting your role, you'll be directed to your personalized dashboard. The dashboard provides an overview of your 
          activity and quick access to key features:
        </p>
        
        <ul>
          <li>
            <strong>Activity Feed</strong> - View recent transactions and activities related to your products or partners
          </li>
          <li>
            <strong>Products</strong> - Manage your products or view products in your supply chain
          </li>
          <li>
            <strong>Transactions</strong> - Record new transactions or view your transaction history
          </li>
          <li>
            <strong>Partners</strong> - View and manage your supply chain partners
          </li>
          <li>
            <strong>Reports</strong> - Access analytics and reports about your supply chain activities
          </li>
          <li>
            <strong>Learning Hub</strong> - Access educational resources to better understand the platform and blockchain technology
          </li>
        </ul>

        <h2>Your First Steps</h2>
        
        <p>
          Depending on your role, here are some recommended first steps to take on the platform:
        </p>
        
        <h3>For Farmers:</h3>
        <ul>
          <li>Register your farm and production areas</li>
          <li>Add your products with detailed descriptions</li>
          <li>Record your first harvest with batch information</li>
        </ul>
        
        <h3>For Collectors/Processors/Distributors:</h3>
        <ul>
          <li>Connect with your supply chain partners</li>
          <li>Set up your inventory management system</li>
          <li>Record your first transaction with a partner</li>
        </ul>
        
        <h3>For Retailers:</h3>
        <ul>
          <li>Connect with your suppliers</li>
          <li>Set up product verification methods</li>
          <li>Learn how to verify product authenticity</li>
        </ul>
        
        <h3>For Consumers:</h3>
        <ul>
          <li>Learn how to scan product QR codes</li>
          <li>Understand how to interpret supply chain information</li>
          <li>Explore verified products in the marketplace</li>
        </ul>

        <h2>Getting Help</h2>
        
        <p>
          If you encounter any difficulties while using AgriChain, there are several resources available to help you:
        </p>
        
        <ul>
          <li>
            <strong>Help Center</strong> - Access comprehensive guides and FAQs
          </li>
          <li>
            <strong>Video Tutorials</strong> - Watch step-by-step demonstrations of key features
          </li>
          <li>
            <strong>Support Team</strong> - Contact our support team via chat or email
          </li>
          <li>
            <strong>Community Forum</strong> - Connect with other users to share experiences and advice
          </li>
        </ul>

        <h2>Next Steps</h2>
        
        <p>
          Now that you've set up your account and understand the basics, explore these related guides to deepen your knowledge:
        </p>
        
        <ul>
          <li><Link href="/learn/articles/userguide/user-roles" className="text-blue-600 hover:text-blue-800">User Roles & Permissions</Link> - Detailed information about each role in the system</li>
          <li><Link href="/learn/articles/userguide/recording-transactions" className="text-blue-600 hover:text-blue-800">Recording Transactions</Link> - Learn how to record different types of transactions</li>
          <li><Link href="/learn/articles/userguide/product-tracking" className="text-blue-600 hover:text-blue-800">Product Tracking & Verification</Link> - Understand how to track products through the supply chain</li>
        </ul>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/supply-chain/benefits-of-transparency" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Previous: Benefits of Transparent Supply Chains</h4>
            <p className="text-gray-600">Discover how transparency benefits all participants in the supply chain</p>
          </Link>
          <Link href="/learn/articles/userguide/user-roles" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Next: User Roles & Permissions</h4>
            <p className="text-gray-600">Learn about the different user roles in the AgriChain ecosystem</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 