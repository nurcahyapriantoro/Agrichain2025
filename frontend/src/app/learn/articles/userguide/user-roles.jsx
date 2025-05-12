'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Shield, Lock, Key } from 'lucide-react';

export default function UserRoles() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">User Guide</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">User Roles & Permissions</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <span className="mr-4">6 min read</span>
          <span>Last updated: June 12, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          Learn about the different user roles in the AgriChain ecosystem: Farmers, Collectors, Processors, 
          Distributors, Retailers, and Consumers, along with their specific permissions and responsibilities.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2>Understanding User Roles in AgriChain</h2>
        
        <p>
          AgriChain's blockchain-based platform is designed to accommodate all participants in the agricultural 
          supply chain. Each participant has a specific role with tailored permissions that reflect their 
          position and responsibilities within the supply chain ecosystem. This article explains each role 
          in detail, including their permissions, responsibilities, and unique capabilities.
        </p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6 my-8">
          <h3 className="text-indigo-800 text-xl mb-2 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Why Roles Matter
          </h3>
          <p className="mb-0">
            Role-based access control ensures that users can only perform actions appropriate to their position in the supply chain.
            This maintains data integrity and ensures that the blockchain record accurately reflects real-world events and transactions.
          </p>
        </div>

        <h2>Farmer Role</h2>
        
        <p>
          Farmers are the primary producers in the agricultural supply chain. They register crops, livestock, and other 
          agricultural products at the source.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Register farms, fields, and production areas</li>
          <li>Document crop varieties, farming practices, and certifications</li>
          <li>Record harvest details, including date, quantity, and quality</li>
          <li>Generate initial product batches with unique identifiers</li>
          <li>Initiate the first transaction in the supply chain</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage farm profiles</li>
          <li>Add and update product information</li>
          <li>Record harvest data and create product batches</li>
          <li>Initiate sales transactions to collectors or processors</li>
          <li>View transaction history for their products</li>
          <li>Add certifications and supporting documentation</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Farmers may need to provide proof of land ownership or lease agreements, farming licenses, 
          and other relevant documentation to verify their status as agricultural producers.
        </p>

        <h2>Collector/Aggregator Role</h2>
        
        <p>
          Collectors gather products from multiple farmers, often consolidating smaller batches into 
          larger ones. They serve as intermediaries between farmers and processors or distributors.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Record purchases from farmers</li>
          <li>Manage product batches and inventory</li>
          <li>Document storage conditions and handling procedures</li>
          <li>Maintain product identity and traceability</li>
          <li>Sell consolidated batches to processors or distributors</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage collection center profiles</li>
          <li>Record purchase transactions from farmers</li>
          <li>Create new batch identifiers for consolidated products</li>
          <li>Link new batches to original farmer batches</li>
          <li>Initiate sales transactions to processors or distributors</li>
          <li>View transaction history for products they've handled</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Collectors need to provide business registration documents, licenses for handling agricultural 
          products, and proof of storage facilities.
        </p>

        <h2>Processor Role</h2>
        
        <p>
          Processors transform raw agricultural products into processed goods. This includes milling, 
          packaging, preserving, or otherwise adding value to the products.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Record purchases of raw materials</li>
          <li>Document processing methods and conditions</li>
          <li>Track processing batches and link to input batches</li>
          <li>Manage inventory of processed products</li>
          <li>Record sales of processed products to distributors or retailers</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage processing facility profiles</li>
          <li>Record purchase transactions of raw materials</li>
          <li>Create new product identifiers for processed goods</li>
          <li>Link processed products to original input materials</li>
          <li>Record processing details and methods</li>
          <li>Initiate sales transactions to distributors or retailers</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Processors must provide food processing licenses, quality certifications, and business registration documents.
        </p>

        <h2>Distributor/Trader Role</h2>
        
        <p>
          Distributors move products through the supply chain, often handling logistics, transportation, 
          and wholesale distribution to retailers.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Record purchases from processors or collectors</li>
          <li>Document transportation and storage conditions</li>
          <li>Manage inventory and distribution logistics</li>
          <li>Maintain product traceability throughout distribution</li>
          <li>Record sales to retailers or other distributors</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage distribution company profiles</li>
          <li>Record purchase transactions</li>
          <li>Document transportation details and conditions</li>
          <li>Manage inventory across multiple locations</li>
          <li>Initiate sales transactions to retailers</li>
          <li>View complete transaction history for products they've handled</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Distributors need to provide transportation licenses, storage facility documentation, 
          and business registration certificates.
        </p>

        <h2>Retailer Role</h2>
        
        <p>
          Retailers are the final business entities in the supply chain, selling products directly to consumers.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Record purchases from distributors or processors</li>
          <li>Verify product authenticity and origin</li>
          <li>Manage inventory of products for consumer sale</li>
          <li>Provide product information to consumers</li>
          <li>Complete the supply chain record</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage retail outlet profiles</li>
          <li>Record purchase transactions from distributors</li>
          <li>Verify product authenticity through the platform</li>
          <li>Generate consumer-facing QR codes or information displays</li>
          <li>View complete transaction history for products they sell</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Retailers must provide retail business licenses, point-of-sale documentation, 
          and business registration certificates.
        </p>

        <h2>Consumer Role</h2>
        
        <p>
          Consumers are the end users of agricultural products. While they don't add information to the 
          blockchain, they can access product information for verification purposes.
        </p>
        
        <h3>Key Capabilities:</h3>
        <ul>
          <li>Verify product origins and authenticity</li>
          <li>View complete supply chain journey</li>
          <li>Access information about farming methods, processing, and handling</li>
          <li>Verify certifications and product claims</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Create and manage consumer profiles</li>
          <li>Scan product QR codes to access product information</li>
          <li>View product journey through the supply chain</li>
          <li>Save favorite products and preferences</li>
        </ul>
        
        <h3>Verification Requirements:</h3>
        <p>
          Consumers typically only need to verify their email address to create an account.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
          <h3 className="text-blue-800 text-xl mb-2 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Changing Roles
          </h3>
          <p className="mb-0">
            In some cases, entities may operate in multiple roles within the supply chain. AgriChain allows 
            users to register for multiple roles with separate verification for each. For example, a farmer 
            cooperative might function both as a farmer (producer) and as a collector (aggregator).
          </p>
        </div>

        <h2>Admin Role (Platform Administrators)</h2>
        
        <p>
          Though not directly part of the supply chain, platform administrators maintain the AgriChain platform, 
          verify users, and ensure system integrity.
        </p>
        
        <h3>Key Responsibilities:</h3>
        <ul>
          <li>Verify new user registrations</li>
          <li>Manage platform settings and configurations</li>
          <li>Monitor system performance and security</li>
          <li>Provide support for platform users</li>
          <li>Develop and implement platform improvements</li>
        </ul>
        
        <h3>Permissions:</h3>
        <ul>
          <li>Approve or reject user verification requests</li>
          <li>Access system-wide data and analytics</li>
          <li>Modify platform settings and configurations</li>
          <li>Resolve disputes or issues between users</li>
        </ul>

        <h2>Next Steps</h2>
        
        <p>
          Now that you understand the different roles and permissions in AgriChain, learn more about how 
          to interact with the platform:
        </p>
        
        <ul>
          <li><Link href="/learn/articles/userguide/recording-transactions" className="text-blue-600 hover:text-blue-800">Recording Transactions</Link> - How to record different types of transactions in the platform</li>
          <li><Link href="/learn/articles/userguide/product-tracking" className="text-blue-600 hover:text-blue-800">Product Tracking & Verification</Link> - How to track products and verify authenticity</li>
          <li><Link href="/learn/articles/blockchain/blockchain-fundamentals" className="text-blue-600 hover:text-blue-800">Blockchain Fundamentals</Link> - Understand the technology behind AgriChain</li>
        </ul>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/userguide/getting-started" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Previous: Getting Started with AgriChain</h4>
            <p className="text-gray-600">Learn how to create an account and start using the platform</p>
          </Link>
          <Link href="/learn/articles/userguide/recording-transactions" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Next: Recording Transactions</h4>
            <p className="text-gray-600">Learn how to record different types of transactions in the platform</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 