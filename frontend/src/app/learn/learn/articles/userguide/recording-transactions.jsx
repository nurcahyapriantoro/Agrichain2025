'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, BarChart2, AlertTriangle, FileCheck } from 'lucide-react';

export default function RecordingTransactions() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">User Guide</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Recording Transactions</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <span className="mr-4">7 min read</span>
          <span>Last updated: June 15, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          A step-by-step guide on how to record different types of transactions in the AgriChain platform, 
          ensuring accurate and secure blockchain documentation throughout the supply chain.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2 className="mb-6 font-bold text-3xl">Understanding Transactions in AgriChain</h2>
        
        <p className="mb-4">
          Transactions are the core of AgriChain's blockchain system. Each transaction represents the transfer 
          of products from one supply chain participant to another, along with important contextual information. 
          This guide will walk you through the process of recording different types of transactions based on your role.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 my-8">
          <h3 className="text-blue-800 text-xl mb-4 flex items-center font-bold">
            <BarChart2 className="w-5 h-5 mr-2" />
            Why Transactions Matter
          </h3>
          <p className="mb-0">
            Each transaction you record is permanently stored on the blockchain, creating an immutable record of your 
            product's journey. This ensures transparency, traceability, and trust throughout the supply chain.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Transaction Types in AgriChain</h2>
        
        <p className="mb-4">
          AgriChain supports several types of transactions that reflect different interactions between supply chain participants:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2">
            <strong>Production Transactions</strong> - Record the initial creation of agricultural products (by farmers)
          </li>
          <li className="mb-2">
            <strong>Transfer Transactions</strong> - Document the transfer of products between supply chain participants
          </li>
          <li className="mb-2">
            <strong>Processing Transactions</strong> - Record the transformation of raw materials into processed products
          </li>
          <li className="mb-2">
            <strong>Quality Check Transactions</strong> - Document quality inspections and certifications
          </li>
          <li className="mb-2">
            <strong>Storage Transactions</strong> - Record storage conditions and inventory management
          </li>
          <li className="mb-2">
            <strong>Retail Transactions</strong> - Document the final sale to consumers
          </li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Recording Production Transactions (Farmers)</h2>
        
        <p className="mb-4">
          As a farmer, you'll initiate the first transaction in the supply chain, recording the production 
          of your agricultural products.
        </p>
        
        <h3 className="font-bold mb-4">Step-by-Step Guide:</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Navigate to Transactions</strong> - From your dashboard, click on "Transactions" and then select "New Production Transaction"
          </li>
          <li className="mb-3">
            <strong>2. Select Product Type</strong> - Choose from your registered products or create a new product
          </li>
          <li className="mb-3">
            <strong>3. Enter Production Details</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Harvest date</li>
              <li className="mb-2">Quantity and units (e.g., kg, bushels)</li>
              <li className="mb-2">Batch or lot number (automatically generated or custom)</li>
              <li className="mb-2">Production area/field</li>
              <li className="mb-2">Farming methods used</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>4. Add Quality Information</strong> - Record any quality metrics specific to your product (optional)
          </li>
          <li className="mb-3">
            <strong>5. Attach Certification Documents</strong> - Upload any relevant certifications (organic, fair trade, etc.)
          </li>
          <li className="mb-3">
            <strong>6. Add Photos</strong> - Include photos of the harvest or product (recommended)
          </li>
          <li className="mb-3">
            <strong>7. Review and Submit</strong> - Verify all information and submit the transaction
          </li>
        </ol>
        
        <div className="bg-green-50 border border-green-100 rounded-lg p-6 my-8">
          <h3 className="text-green-800 text-xl mb-4 flex items-center font-bold">
            <FileCheck className="w-5 h-5 mr-2" />
            Production Transaction Success
          </h3>
          <p className="mb-0">
            After submitting a production transaction, you'll receive a confirmation with a unique transaction ID 
            and QR code. This QR code can be used to track the product batch throughout the supply chain.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Recording Transfer Transactions (All Roles)</h2>
        
        <p className="mb-4">
          Transfer transactions document the movement of products between supply chain participants, 
          such as from farmer to collector, collector to processor, etc.
        </p>
        
        <h3 className="font-bold mb-4">For the Seller (Initiator):</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Navigate to Transactions</strong> - From your dashboard, click on "Transactions" and select "New Transfer Transaction"
          </li>
          <li className="mb-3">
            <strong>2. Select Product Batch</strong> - Choose the product batch you're transferring from your inventory
          </li>
          <li className="mb-3">
            <strong>3. Select Recipient</strong> - Choose the supply chain partner receiving the products
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">You can search for registered users or invite new partners</li>
              <li className="mb-2">Verify the recipient's information before proceeding</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>4. Enter Transaction Details</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Transaction date</li>
              <li className="mb-2">Quantity being transferred (can be all or part of a batch)</li>
              <li className="mb-2">Price information (optional)</li>
              <li className="mb-2">Shipping/logistics information</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>5. Attach Documents</strong> - Upload any relevant documents (invoices, shipping forms, etc.)
          </li>
          <li className="mb-3">
            <strong>6. Add Notes</strong> - Include any additional information about the transaction
          </li>
          <li className="mb-3">
            <strong>7. Review and Submit</strong> - Verify all information and submit the transaction
          </li>
        </ol>
        
        <h3 className="font-bold mb-4">For the Buyer (Recipient):</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Receive Notification</strong> - You'll receive a notification of a pending transfer transaction
          </li>
          <li className="mb-3">
            <strong>2. Review Transaction Details</strong> - Verify all the information provided by the seller
          </li>
          <li className="mb-3">
            <strong>3. Scan QR Code</strong> - If physically receiving the products, scan the QR code to verify authenticity
          </li>
          <li className="mb-3">
            <strong>4. Confirm Receipt</strong> - Once you've verified the products, confirm receipt in the platform
          </li>
          <li className="mb-3">
            <strong>5. Add Additional Information</strong> - Record any observations about product condition upon receipt
          </li>
        </ol>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 my-8">
          <h3 className="text-yellow-800 text-xl mb-4 flex items-center font-bold">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Important Note
          </h3>
          <p className="mb-0">
            Both parties must complete their respective actions for the transaction to be fully recorded on the blockchain. 
            The seller initiates, and the buyer confirms the transaction, creating a dual-verification system.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Recording Processing Transactions (Processors)</h2>
        
        <p className="mb-4">
          Processing transactions document the transformation of raw materials into processed products, 
          establishing links between input and output products.
        </p>
        
        <h3 className="font-bold mb-4">Step-by-Step Guide:</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Navigate to Transactions</strong> - From your dashboard, click on "Transactions" and select "New Processing Transaction"
          </li>
          <li className="mb-3">
            <strong>2. Select Input Materials</strong> - Choose the batches of raw materials used in processing
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">You can select multiple batches from your inventory</li>
              <li className="mb-2">Specify the quantity of each batch used</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>3. Define Output Product</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Select or create the processed product type</li>
              <li className="mb-2">Enter quantity produced</li>
              <li className="mb-2">Generate a new batch identifier</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>4. Document Processing Details</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Processing date and duration</li>
              <li className="mb-2">Processing methods and techniques</li>
              <li className="mb-2">Equipment and facilities used</li>
              <li className="mb-2">Quality parameters and test results</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>5. Attach Certifications</strong> - Upload any quality or safety certifications
          </li>
          <li className="mb-3">
            <strong>6. Add Photos</strong> - Include photos of the processing or final product
          </li>
          <li className="mb-3">
            <strong>7. Review and Submit</strong> - Verify all information and submit the transaction
          </li>
        </ol>

        <h2 className="mb-6 font-bold text-3xl">Recording Quality Check Transactions (All Roles)</h2>
        
        <p className="mb-4">
          Quality check transactions document inspections, testing, or certifications that verify 
          product quality or compliance with standards.
        </p>
        
        <h3 className="font-bold mb-4">Step-by-Step Guide:</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Navigate to Transactions</strong> - From your dashboard, click on "Transactions" and select "New Quality Check"
          </li>
          <li className="mb-3">
            <strong>2. Select Product Batch</strong> - Choose the batch being inspected or tested
          </li>
          <li className="mb-3">
            <strong>3. Enter Quality Check Details</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Inspection date</li>
              <li className="mb-2">Inspector name and organization</li>
              <li className="mb-2">Type of inspection or test</li>
              <li className="mb-2">Standards or regulations being verified</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>4. Record Test Results</strong> - Document all test parameters and results
          </li>
          <li className="mb-3">
            <strong>5. Attach Documentation</strong> - Upload test reports, certificates, or inspection forms
          </li>
          <li className="mb-3">
            <strong>6. Add Decision/Outcome</strong> - Record whether the product passed, failed, or requires further action
          </li>
          <li className="mb-3">
            <strong>7. Review and Submit</strong> - Verify all information and submit the transaction
          </li>
        </ol>

        <h2 className="mb-6 font-bold text-3xl">Recording Retail Transactions (Retailers)</h2>
        
        <p className="mb-4">
          Retail transactions document the final sale of products to consumers, completing the supply chain journey.
        </p>
        
        <h3 className="font-bold mb-4">Step-by-Step Guide:</h3>
        <ol className="mb-6">
          <li className="mb-3">
            <strong>1. Navigate to Transactions</strong> - From your dashboard, click on "Transactions" and select "New Retail Transaction"
          </li>
          <li className="mb-3">
            <strong>2. Select Product Batch</strong> - Choose the batch being sold to consumers
          </li>
          <li className="mb-3">
            <strong>3. Enter Transaction Details</strong>
            <ul className="list-disc list-outside pl-5 space-y-2 mb-6 mt-2">
              <li className="mb-2">Sale date</li>
              <li className="mb-2">Quantity sold</li>
              <li className="mb-2">Sale location</li>
            </ul>
          </li>
          <li className="mb-3">
            <strong>4. Generate Consumer Information</strong> - Create consumer-facing QR codes or product information
          </li>
          <li className="mb-3">
            <strong>5. Review and Submit</strong> - Verify all information and submit the transaction
          </li>
        </ol>

        <h2 className="mb-6 font-bold text-3xl">Tips for Recording Accurate Transactions</h2>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2">
            <strong>Record Transactions Promptly</strong> - Don't delay recording transactions to ensure accuracy and real-time traceability
          </li>
          <li className="mb-2">
            <strong>Be Precise with Quantities</strong> - Accurately measure and record all quantities to maintain inventory integrity
          </li>
          <li className="mb-2">
            <strong>Provide Clear Documentation</strong> - Include relevant documents and photos to enhance transparency
          </li>
          <li className="mb-2">
            <strong>Verify Partner Information</strong> - Double-check recipient information before initiating transfers
          </li>
          <li className="mb-2">
            <strong>Use Mobile Features</strong> - The AgriChain mobile app allows for on-the-spot transaction recording, including photo capture
          </li>
          <li className="mb-2">
            <strong>Review Before Submitting</strong> - Always double-check all information before finalizing transactions
          </li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Troubleshooting Common Issues</h2>
        
        <h3 className="font-bold mb-4">Transaction Not Appearing</h3>
        <p className="mb-4">
          If a transaction is not appearing in your history:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2">Check your internet connection</li>
          <li className="mb-2">Refresh the page or application</li>
          <li className="mb-2">Verify that all required fields were completed</li>
          <li className="mb-2">Ensure that both parties have completed their actions (for transfer transactions)</li>
        </ul>
        
        <h3 className="font-bold mb-4">Unable to Select a Product Batch</h3>
        <p className="mb-4">
          If you cannot select a specific product batch:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2">Verify that the batch exists in your inventory</li>
          <li className="mb-2">Check if the batch has already been fully transferred or processed</li>
          <li className="mb-2">Ensure you have the appropriate permissions for that product type</li>
        </ul>
        
        <h3 className="font-bold mb-4">Partner Not Found</h3>
        <p className="mb-4">
          If you cannot find a supply chain partner:
        </p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2">Verify they have registered on the platform</li>
          <li className="mb-2">Check the spelling of their name or organization</li>
          <li className="mb-2">Try searching by their email address or ID number</li>
          <li className="mb-2">Consider inviting them to the platform</li>
        </ul>

        <h2 className="mb-6 font-bold text-3xl">Next Steps</h2>
        
        <p className="mb-4">
          Now that you understand how to record transactions in AgriChain, learn more about:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li className="mb-2"><Link href="/learn/articles/userguide/product-tracking" className="text-blue-600 hover:text-blue-800">Product Tracking & Verification</Link> - How to track products and verify their authenticity</li>
          <li className="mb-2"><Link href="/learn/articles/blockchain/blockchain-fundamentals" className="text-blue-600 hover:text-blue-800">Blockchain Fundamentals</Link> - Understand the technology that powers these transactions</li>
          <li className="mb-2"><Link href="/learn/articles/blockchain/smart-contracts" className="text-blue-600 hover:text-blue-800">Smart Contracts for Supply Chain</Link> - Learn about automated agreements in the supply chain</li>
        </ul>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/userguide/user-roles" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Previous: User Roles & Permissions</h4>
            <p className="text-gray-600">Learn about different user roles in the AgriChain ecosystem</p>
          </Link>
          <Link href="/learn/articles/userguide/product-tracking" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Next: Product Tracking & Verification</h4>
            <p className="text-gray-600">Learn how to track and verify product authenticity</p>
          </Link>
        </div>
      </div>
    </article>
  );
} 