'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Search, QrCode, Shield } from 'lucide-react';

export default function ProductTracking() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Layers className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">User Guide</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Product Tracking & Verification</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <span className="mr-4">5 min read</span>
          <span>Last updated: June 18, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          Learn how to track products throughout the agricultural supply chain and verify their authenticity 
          using AgriChain's blockchain technology.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2 className="mb-6 font-bold text-3xl">The Power of Product Tracking</h2>
        
        <p className="mb-4">
          One of the most valuable features of AgriChain is its ability to track products at every stage 
          of the supply chain. This tracking system creates a complete, transparent history for each product, 
          from the farm to the consumer's table. This guide will walk you through how to use AgriChain's 
          tracking and verification tools.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
          <h3 className="text-blue-800 text-xl mb-4 flex items-center font-bold">
            <Shield className="w-5 h-5 mr-2" />
            Why Product Tracking Matters
          </h3>
          <p className="mb-0">
            Product tracking enables stakeholders to verify product origins, ensure compliance with quality standards, 
            identify and address issues quickly, and build consumer trust through transparency. It also helps combat 
            fraud and counterfeit products in the agricultural supply chain.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Understanding Product Identifiers</h2>
        
        <p className="mb-4">
          Each product in AgriChain is assigned unique identifiers that make tracking possible:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Batch ID</strong> - A unique identifier assigned to a group of products that share the same 
            characteristics (e.g., same harvest date, field, and variety)
          </li>
          <li>
            <strong>QR Code</strong> - A machine-readable code that contains the Batch ID and links to the product's 
            complete blockchain record
          </li>
          <li>
            <strong>RFID Tags</strong> (optional) - Physical tags that can be attached to product packaging or containers 
            for automatic scanning and tracking
          </li>
          <li>
            <strong>NFC Tags</strong> (optional) - Near-field communication tags that can be scanned with smartphones 
            to access product information
          </li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Tracking Products as a Supply Chain Participant</h2>
        
        <h3 className="font-bold mb-4">For Farmers:</h3>
        <p className="mb-4">
          As a farmer, you initiate the tracking process by creating the first record for your products:
        </p>
        <ol className="mb-6">
          <li>
            <strong>Create Production Record</strong> - Record your harvest with detailed information (as explained in the Recording Transactions article)
          </li>
          <li>
            <strong>Generate Batch IDs and QR Codes</strong> - The system automatically generates these when you create a production record
          </li>
          <li>
            <strong>Print and Apply Labels</strong> - Print QR codes from your dashboard and apply them to your product packaging
          </li>
          <li>
            <strong>Monitor Product Journey</strong> - Track your products as they move through the supply chain
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Navigate to "Products" in your dashboard</li>
              <li>Select a specific batch to view its current status and journey</li>
              <li>Access transaction history related to the batch</li>
            </ul>
          </li>
        </ol>

        <h3 className="font-bold mb-4">For Collectors, Processors, and Distributors:</h3>
        <p className="mb-4">
          As intermediate supply chain participants, you'll both receive products with existing tracking information 
          and continue the tracking process:
        </p>
        <ol className="mb-6">
          <li>
            <strong>Verify Incoming Products</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Scan QR codes on received products using the AgriChain mobile app</li>
              <li>Verify that product details match what's recorded on the blockchain</li>
              <li>Confirm receipt through the platform</li>
            </ul>
          </li>
          <li>
            <strong>Update Product Status</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Record processing activities, quality checks, or storage conditions</li>
              <li>Link new batch IDs to original product sources when consolidating or processing</li>
            </ul>
          </li>
          <li>
            <strong>Generate New Tracking Information</strong> (when applicable)
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Create new batch IDs for processed products</li>
              <li>Generate and apply new QR codes that link to both the new product and its source materials</li>
            </ul>
          </li>
          <li>
            <strong>Monitor Supply Chain</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Track products both upstream (suppliers) and downstream (customers)</li>
              <li>View the complete chain of custody for products you've handled</li>
            </ul>
          </li>
        </ol>

        <h3 className="font-bold mb-4">For Retailers:</h3>
        <p className="mb-4">
          As the final business participant in the supply chain, retailers play a crucial role in connecting 
          the blockchain record to consumers:
        </p>
        <ol className="mb-6">
          <li>
            <strong>Verify Products on Receipt</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Scan QR codes on received products</li>
              <li>Confirm authenticity and completeness of supply chain information</li>
            </ul>
          </li>
          <li>
            <strong>Make Tracking Information Accessible to Consumers</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Ensure QR codes are visible on product packaging</li>
              <li>Consider displaying simplified supply chain information in-store</li>
              <li>Educate consumers on how to access and interpret product information</li>
            </ul>
          </li>
          <li>
            <strong>Record Final Sale</strong> (optional)
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>For high-value products, consider recording retail sales on the blockchain</li>
              <li>This creates a complete chain from farm to consumer</li>
            </ul>
          </li>
        </ol>

        <h2 className="mb-6 font-bold text-3xl">Verifying Products as a Consumer</h2>
        
        <p className="mb-4">
          Consumers can verify the authenticity and origin of agricultural products using AgriChain:
        </p>
        
        <ol className="mb-6">
          <li>
            <strong>Scan the QR Code</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Use the AgriChain mobile app (recommended)</li>
              <li>Or use any QR code scanner and follow the link</li>
            </ul>
          </li>
          <li>
            <strong>View Product Journey</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>See the complete supply chain journey from farm to retailer</li>
              <li>View key information about each participant in the chain</li>
              <li>Access details about farming practices, processing methods, etc.</li>
            </ul>
          </li>
          <li>
            <strong>Verify Certifications</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>Check for organic, fair trade, or other certifications</li>
              <li>View documentation supporting certification claims</li>
            </ul>
          </li>
          <li>
            <strong>Explore Additional Information</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
              <li>View photos from various stages of production</li>
              <li>Read about farming practices and product characteristics</li>
              <li>Access nutritional information and suggested uses</li>
            </ul>
          </li>
        </ol>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-6 my-8">
          <h3 className="text-green-800 text-xl mb-4 flex items-center font-bold">
            <QrCode className="w-5 h-5 mr-2" />
            Consumer Experience
          </h3>
          <p className="mb-0">
            When consumers scan a product's QR code, they see a user-friendly visualization of the supply chain journey, 
            including a map showing the product's physical journey, key dates, and information about each supply chain participant. 
            This builds trust and allows consumers to make more informed purchasing decisions.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Advanced Tracking Features</h2>
        
        <h3 className="font-bold mb-4">Batch Splitting and Merging</h3>
        <p className="mb-4">
          AgriChain handles complex supply chain scenarios where products are split into multiple batches or 
          merged from different sources:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Batch Splitting</strong> - When a single batch is divided and sent to multiple recipients, 
            each new batch maintains a link to the original
          </li>
          <li>
            <strong>Batch Merging</strong> - When products from multiple sources are combined (e.g., by collectors), 
            the new batch retains links to all source batches
          </li>
        </ul>

        <h3 className="font-bold mb-4">Condition Monitoring</h3>
        <p className="mb-4">
          For sensitive agricultural products, AgriChain can integrate with IoT sensors to monitor and record conditions:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>Temperature and humidity during transport and storage</li>
          <li>Shock and vibration during handling</li>
          <li>Time spent in various conditions</li>
        </ul>
        <p className="mb-4 mt-6">
          This data is linked to the product's blockchain record, providing a complete history of not just ownership 
          but also environmental conditions throughout the supply chain.
        </p>

        <h3 className="font-bold mb-4">Alert System</h3>
        <p className="mb-4">
          AgriChain includes an alert system that notifies relevant parties of potential issues:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>Quality control failures</li>
          <li>Delayed transfers or missing confirmations</li>
          <li>Environmental condition violations</li>
          <li>Expired certifications or documentation</li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Troubleshooting Tracking Issues</h2>
        
        <h3 className="font-bold mb-4">QR Code Won't Scan</h3>
        <p className="mb-4">
          If a QR code can't be scanned:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>Ensure adequate lighting and that the code is not damaged</li>
          <li>Clean the code if it's dirty or smudged</li>
          <li>Try a different scanning app</li>
          <li>Manually enter the Batch ID (printed below the QR code) on the AgriChain website</li>
        </ul>
        
        <h3 className="font-bold mb-4">Missing Information in Product Journey</h3>
        <p className="mb-4">
          If there appears to be missing information in the product journey:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>Check if all supply chain participants have confirmed their transactions</li>
          <li>Verify that the product batch has been properly linked to its sources</li>
          <li>Contact the previous participant in the chain to ensure they've completed their recording</li>
        </ul>
        
        <h3 className="font-bold mb-4">Verification Failure</h3>
        <p className="mb-4">
          If a verification check fails:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>Double-check that you're scanning the correct QR code</li>
          <li>Ensure your internet connection is stable</li>
          <li>Contact the most recent handler of the product for clarification</li>
          <li>Report potential fraud if you suspect the product is counterfeit</li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Best Practices for Product Tracking</h2>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Record Transactions Promptly</strong> - Don't delay recording transactions to maintain real-time traceability
          </li>
          <li>
            <strong>Verify Products Upon Receipt</strong> - Always verify incoming products before accepting them
          </li>
          <li>
            <strong>Protect QR Codes and Labels</strong> - Ensure tracking identifiers remain intact and readable
          </li>
          <li>
            <strong>Maintain Proper Documentation</strong> - Attach relevant certificates and documents to product records
          </li>
          <li>
            <strong>Train All Staff</strong> - Ensure everyone handling products understands the tracking system
          </li>
          <li>
            <strong>Use the Mobile App</strong> - The AgriChain mobile app makes scanning and verification more convenient
          </li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Next Steps</h2>
        
        <p className="mb-4">
          Now that you understand how to track and verify products in AgriChain, you may want to learn more about:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><Link href="/learn/articles/blockchain/blockchain-fundamentals" className="text-blue-600 hover:text-blue-800">Blockchain Fundamentals</Link> - Understand the technology behind product tracking</li>
          <li><Link href="/learn/articles/blockchain/blockchain-in-agriculture" className="text-blue-600 hover:text-blue-800">Blockchain in Agriculture</Link> - Explore broader applications in the agricultural sector</li>
          <li><Link href="/learn/articles/supply-chain/benefits-of-transparency" className="text-blue-600 hover:text-blue-800">Benefits of Transparent Supply Chains</Link> - Discover the advantages of end-to-end visibility</li>
        </ul>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/userguide/recording-transactions" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Previous: Recording Transactions</h4>
            <p className="text-gray-600">Learn how to record different types of transactions in the platform</p>
          </Link>
          <Link href="/learn/articles/blockchain/blockchain-fundamentals" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Next: Blockchain Fundamentals</h4>
            <p className="text-gray-600">Understand the technology that powers AgriChain</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 