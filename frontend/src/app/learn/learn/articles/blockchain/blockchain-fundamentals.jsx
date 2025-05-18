'use client';

import { BarChart2, Clock, Database, Lock, FileCode, Zap, Scale, Network } from 'lucide-react';
import Link from 'next/link';

export default function BlockchainFundamentalsArticle() {
  return (
    <article>
      {/* Article header */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <BarChart2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm text-gray-500">Blockchain</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Blockchain Fundamentals</h1>
          </div>
        </div>
        
        <div className="flex items-center mb-6 text-gray-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          <span className="mr-4">10 min read</span>
          <span>Last updated: July 15, 2023</span>
        </div>
        
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"></div>
        
        <div className="text-gray-600 text-lg leading-relaxed italic">
          A comprehensive introduction to blockchain technology, explaining distributed ledgers, consensus mechanisms, 
          cryptographic security, and smart contracts in an accessible way for agricultural supply chain stakeholders.
        </div>
      </div>
      
      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        <h2 className="mb-6 font-bold text-3xl">What is Blockchain Technology?</h2>
        
        <p className="mb-4">
          At its core, blockchain is a distributed digital ledger technology that allows data to be stored globally across thousands 
          of servers. Unlike traditional databases managed by central authorities, blockchain uses a peer-to-peer network where 
          transactions are recorded in "blocks" and linked together in a "chain" using cryptographic principles.
        </p>

        <p className="mb-4">
          First introduced in 2008 by an individual or group using the pseudonym Satoshi Nakamoto as the technology underlying 
          Bitcoin, blockchain has evolved far beyond cryptocurrencies and is now being applied across various industries, 
          including agriculture and food supply chains.
        </p>
        
        <div className="flex flex-col md:flex-row gap-6 my-8">
          <div className="flex-1 bg-blue-50 rounded-lg p-6 flex flex-col items-center text-center">
            <Database className="h-10 w-10 text-blue-500 mb-3" />
            <h3 className="text-blue-800 text-xl mb-2">Distributed Ledger</h3>
            <p className="text-sm mb-0">Records stored across multiple locations rather than a single central database</p>
          </div>
          
          <div className="flex-1 bg-purple-50 rounded-lg p-6 flex flex-col items-center text-center">
            <Lock className="h-10 w-10 text-purple-500 mb-3" />
            <h3 className="text-purple-800 text-xl mb-2">Immutability</h3>
            <p className="text-sm mb-0">Once data is recorded, it cannot be altered without consensus from the network</p>
          </div>
          
          <div className="flex-1 bg-green-50 rounded-lg p-6 flex flex-col items-center text-center">
            <Network className="h-10 w-10 text-green-500 mb-3" />
            <h3 className="text-green-800 text-xl mb-2">Decentralization</h3>
            <p className="text-sm mb-0">No single entity controls the entire network, increasing security and trust</p>
          </div>
        </div>

        <h2 className="mb-6 font-bold text-3xl">How Blockchain Works: The Fundamental Architecture</h2>
        
        <p className="mb-4">
          To understand blockchain, it's helpful to break down its key components and how they interact:
        </p>
        
        <h3 className="font-bold mb-4">1. Blocks and Chains</h3>
        
        <p className="mb-4">
          A blockchain consists of a series of "blocks" linked together in chronological order. Each block contains:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Transaction data</strong> - In AgriChain, this includes product transfers, quality checks, processing activities, etc.
          </li>
          <li>
            <strong>Timestamp</strong> - When the block was created
          </li>
          <li>
            <strong>Cryptographic hash</strong> - A unique identifier for the block
          </li>
          <li>
            <strong>Previous block's hash</strong> - Creating the "chain" by linking to the previous block
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          This structure creates what cryptographers call a "hash chain," where each block refers to the one before it. 
          As Zheng et al. (2018) explain, "This mechanism guarantees that any modification to the previous block will be reflected 
          in the current block's hash, thus making the blockchain tamper-evident."
        </p>
        
        <h3 className="font-bold mb-4">2. Distributed Ledger Technology (DLT)</h3>
        
        <p className="mb-4">
          Unlike traditional databases that store information in a central location, blockchain distributes identical 
          copies of the ledger across multiple computers (nodes) in a network. This distribution has several critical advantages:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>No single point of failure</li>
          <li>Resistance to attacks or corruption</li>
          <li>Transparency for all network participants</li>
          <li>Greater data availability and resilience</li>
        </ul>
        
        <p className="mb-4 mt-6">
          According to Treiblmaier (2018), "The distributed nature of blockchain makes it especially suitable for supply chains 
          that involve multiple stakeholders with potentially conflicting interests."
        </p>
        
        <h3 className="font-bold mb-4">3. Consensus Mechanisms</h3>
        
        <p className="mb-4">
          For a blockchain network to function effectively, all participants must agree on the state of the ledger. 
          This agreement is achieved through consensus mechanisms, which are protocols that determine how new blocks are added 
          to the chain and how conflicts are resolved.
        </p>
        
        <p className="mb-4">
          Several consensus mechanisms exist, each with distinct characteristics:
        </p>
        
        <div className="overflow-x-auto my-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consensus Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  How It Works
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Advantages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Common Uses
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Proof of Work (PoW)
                </td>
                <td className="px-6 py-4">
                  Nodes solve complex mathematical puzzles to validate transactions and create new blocks
                </td>
                <td className="px-6 py-4">
                  Highly secure and battle-tested
                </td>
                <td className="px-6 py-4">
                  Bitcoin, Ethereum (pre-2022)
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Proof of Stake (PoS)
                </td>
                <td className="px-6 py-4">
                  Validators are selected to create blocks based on the amount of cryptocurrency they hold and are willing to "stake"
                </td>
                <td className="px-6 py-4">
                  Energy efficient, faster transactions
                </td>
                <td className="px-6 py-4">
                  Ethereum 2.0, Cardano, Polkadot
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Practical Byzantine Fault Tolerance (PBFT)
                </td>
                <td className="px-6 py-4">
                  Nodes vote on the validity of transactions; requires 2/3 majority
                </td>
                <td className="px-6 py-4">
                  High throughput, immediate finality
                </td>
                <td className="px-6 py-4">
                  Hyperledger Fabric, enterprise blockchains
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Proof of Authority (PoA)
                </td>
                <td className="px-6 py-4">
                  Pre-approved validators with known identities create blocks
                </td>
                <td className="px-6 py-4">
                  Highly efficient, suitable for private networks
                </td>
                <td className="px-6 py-4">
                  Supply chain blockchains, private networks
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p>
          For agricultural supply chains, Proof of Authority (PoA) or PBFT often provides the best balance between 
          efficiency and security, as noted by Kamilaris et al. (2019) in their review of blockchain applications in agriculture.
        </p>

        <h3 className="font-bold mb-4">4. Cryptographic Security</h3>
        
        <p className="mb-4">
          Blockchain relies on cryptographic techniques to secure data and transactions:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Hash Functions</strong> - Mathematical algorithms that convert input data of any size into a fixed-size output (hash). 
            The most common is SHA-256, which produces a 256-bit hash value. Hash functions are one-way, meaning you cannot derive the original 
            input from the hash output.
          </li>
          <li>
            <strong>Public-Key Cryptography</strong> - Uses pairs of keys: public keys (shared openly) and private keys (kept secret). 
            What's encrypted with a public key can only be decrypted with the corresponding private key and vice versa.
          </li>
          <li>
            <strong>Digital Signatures</strong> - Created using private keys to verify the authenticity and integrity of messages and transactions.
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          As highlighted by Menezes et al. (2018) in their handbook on cryptography, "The security of blockchain systems fundamentally 
          relies on the mathematical properties of cryptographic hash functions and public-key cryptography."
        </p>

        <h2 className="mb-6 font-bold text-3xl">Types of Blockchain Networks</h2>
        
        <p className="mb-4">
          Blockchain networks can be categorized based on who can participate and access the data:
        </p>
        
        <h3 className="font-bold mb-4">1. Public Blockchains</h3>
        
        <p className="mb-4">
          Open to anyone to participate as a node, read the ledger, and submit transactions. 
          Examples include Bitcoin and Ethereum.
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Advantages</strong>: Maximum transparency, censorship resistance, high security</li>
          <li><strong>Disadvantages</strong>: Limited privacy, slower transaction speeds, higher energy consumption (for PoW)</li>
          <li><strong>Use in Agriculture</strong>: Best for public verification of product claims (e.g., organic certification)</li>
        </ul>
        
        <h3 className="font-bold mb-4">2. Private Blockchains</h3>
        
        <p className="mb-4">
          Restricted to a specific group of participants, typically within a single organization. 
          A central authority controls access permissions.
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Advantages</strong>: High performance, controlled access, better privacy</li>
          <li><strong>Disadvantages</strong>: More centralized, potential for manipulation by administrators</li>
          <li><strong>Use in Agriculture</strong>: Internal tracking within a single large agricultural enterprise</li>
        </ul>
        
        <h3 className="font-bold mb-4">3. Consortium/Federated Blockchains</h3>
        
        <p className="mb-4">
          Operated by a group of organizations rather than a single entity. Access may be restricted, 
          but governance is distributed among the consortium members.
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li><strong>Advantages</strong>: Balances privacy and transparency, efficient, scalable</li>
          <li><strong>Disadvantages</strong>: More complex governance, potentially slower decision-making</li>
          <li><strong>Use in Agriculture</strong>: Ideal for supply chain tracking across multiple companies</li>
        </ul>
        
        <p className="mb-4 mt-6">
          For agricultural supply chains, Wang et al. (2019) suggest that "consortium blockchains offer the best 
          balance between transparency for consumers and privacy for business operations."
        </p>

        <h2 className="mb-6 font-bold text-3xl">Smart Contracts: Automating Trust</h2>
        
        <p className="mb-4">
          Smart contracts are self-executing computer programs stored on a blockchain that automatically execute, 
          control, or document legally relevant events and actions according to the terms of a contract or agreement.
        </p>
        
        <h3 className="font-bold mb-4">Key Features of Smart Contracts:</h3>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Autonomous</strong> - Execute automatically when predefined conditions are met
          </li>
          <li>
            <strong>Transparent</strong> - Visible to all participants in the blockchain
          </li>
          <li>
            <strong>Immutable</strong> - Cannot be changed once deployed
          </li>
          <li>
            <strong>Deterministic</strong> - Same input always produces the same output
          </li>
        </ul>
        
        <h3 className="font-bold mb-4">Applications in Agricultural Supply Chains:</h3>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Automatic Payment Triggers</strong> - Release payment when product quality is verified
          </li>
          <li>
            <strong>Quality Compliance</strong> - Automatically verify that products meet required standards
          </li>
          <li>
            <strong>Conditional Actions</strong> - Initiate insurance payouts if conditions fall outside acceptable ranges
          </li>
          <li>
            <strong>Supply Chain Automation</strong> - Trigger logistics processes when products change hands
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          According to Antonucci et al. (2019), "Smart contracts in agricultural supply chains can significantly reduce 
          the need for intermediaries, minimize transaction costs, and enforce quality and compliance standards automatically."
        </p>
        
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 my-8">
          <h3 className="text-amber-800 text-xl mb-4 flex items-center font-bold">
            <FileCode className="w-5 h-5 mr-2" />
            Smart Contract Example
          </h3>
          <p className="mb-4">
            A simple smart contract for agricultural product quality verification might work as follows:
          </p>
          <pre className="bg-gray-800 text-white p-4 rounded text-sm overflow-x-auto">
{`// Simplified Solidity smart contract example
contract AgriProductQuality {
    address public buyer;
    address public seller;
    address public qualityInspector;
    uint public productPrice;
    bool public qualityVerified = false;
    bool public paymentReleased = false;
    
    constructor(address _seller, address _qualityInspector, uint _price) {
        buyer = msg.sender;
        seller = _seller;
        qualityInspector = _qualityInspector;
        productPrice = _price;
    }
    
    function depositPayment() public payable {
        require(msg.sender == buyer, "Only buyer can deposit");
        require(msg.value == productPrice, "Incorrect payment amount");
    }
    
    function verifyQuality(bool _passed) public {
        require(msg.sender == qualityInspector, "Only inspector can verify");
        qualityVerified = _passed;
    }
    
    function releasePayment() public {
        require(qualityVerified, "Quality not yet verified");
        require(!paymentReleased, "Payment already released");
        paymentReleased = true;
        payable(seller).transfer(productPrice);
    }
}`}
          </pre>
          <p className="mt-4 text-sm">
            This simplified example shows how a smart contract can hold payment in escrow until 
            a trusted quality inspector verifies that the agricultural product meets the agreed standards.
          </p>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Blockchain vs. Traditional Databases</h2>
        
        <p className="mb-4">
          To better understand blockchain's value proposition, it's helpful to compare it with traditional database systems:
        </p>
        
        <div className="overflow-x-auto my-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Traditional Database
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blockchain
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Architecture
                </td>
                <td className="px-6 py-4">
                  Centralized or distributed
                </td>
                <td className="px-6 py-4">
                  Decentralized
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Control
                </td>
                <td className="px-6 py-4">
                  Single administrator or organization
                </td>
                <td className="px-6 py-4">
                  Consensus among network participants
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Data Modification
                </td>
                <td className="px-6 py-4">
                  Create, Read, Update, Delete (CRUD)
                </td>
                <td className="px-6 py-4">
                  Primarily Create and Read (immutable)
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Transaction History
                </td>
                <td className="px-6 py-4">
                  May or may not be preserved
                </td>
                <td className="px-6 py-4">
                  Complete history preserved
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Trust Model
                </td>
                <td className="px-6 py-4">
                  Trust in administrator(s)
                </td>
                <td className="px-6 py-4">
                  Trustless (cryptographic verification)
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Performance
                </td>
                <td className="px-6 py-4">
                  Generally faster, higher throughput
                </td>
                <td className="px-6 py-4">
                  Typically slower, lower throughput
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  Security Model
                </td>
                <td className="px-6 py-4">
                  Access controls, firewalls
                </td>
                <td className="px-6 py-4">
                  Cryptographic verification, consensus
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <p className="mb-4 mt-6">
          While traditional databases excel in performance and are suitable for many applications, blockchain provides 
          unique advantages in situations requiring shared trust, transparency, and immutable record-keeping—key requirements 
          in complex supply chains with multiple stakeholders (Karame & Androulaki, 2016).
        </p>

        <h2 className="mb-6 font-bold text-3xl">Common Blockchain Misconceptions</h2>
        
        <p className="mb-4">
          As with any emerging technology, blockchain is subject to several misconceptions:
        </p>
        
        <div className="space-y-6 my-8">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-800 text-xl mb-2">Misconception: Blockchain = Bitcoin</h3>
            <p className="mb-0">
              <strong>Reality:</strong> Bitcoin is just one application of blockchain technology. Blockchain has many 
              non-cryptocurrency applications, including supply chain management, digital identity, and record-keeping.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-800 text-xl mb-2">Misconception: Blockchain Is 100% Secure</h3>
            <p className="mb-0">
              <strong>Reality:</strong> While blockchain provides strong security through cryptography and decentralization, 
              no system is completely immune to attacks. Vulnerabilities can exist in smart contracts, access points, 
              and implementation details. According to Li et al. (2020), security requires proper implementation and ongoing vigilance.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-800 text-xl mb-2">Misconception: Blockchain Is Always the Best Solution</h3>
            <p className="mb-0">
              <strong>Reality:</strong> Blockchain is powerful but not suitable for every problem. It excels when multiple 
              parties need to share data, trust is an issue, and a permanent record is valuable. For many applications, 
              traditional databases remain more efficient and appropriate.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-gray-800 text-xl mb-2">Misconception: Blockchain Data Is Always Accurate</h3>
            <p className="mb-0">
              <strong>Reality:</strong> Blockchain ensures that data, once entered, cannot be changed. However, it doesn't 
              guarantee that the initially entered data is accurate. The "garbage in, garbage out" principle still applies. 
              This highlights the importance of proper data validation at the point of entry.
            </p>
          </div>
        </div>

        <h2 className="mb-6 font-bold text-3xl">Blockchain in the Agricultural Supply Chain Context</h2>
        
        <p className="mb-4">
          In agricultural supply chains, blockchain offers several specific benefits:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Traceability</strong> - Track products from farm to consumer with complete, tamper-proof records
          </li>
          <li>
            <strong>Transparency</strong> - Share trusted information across all supply chain participants
          </li>
          <li>
            <strong>Food Safety</strong> - Quickly identify the source of contaminated products
          </li>
          <li>
            <strong>Authenticity Verification</strong> - Combat fraud and counterfeit agricultural products
          </li>
          <li>
            <strong>Fair Trade Verification</strong> - Ensure farmers receive fair compensation
          </li>
          <li>
            <strong>Reduced Paperwork</strong> - Digitize and automate documentation processes
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          A systematic review by Kamilaris et al. (2019) found that "blockchain adoption in agri-food supply chains has 
          shown promising results in improving traceability, ensuring quality and safety of food products, and enhancing 
          trust among stakeholders."
        </p>

        <h2 className="mb-6 font-bold text-3xl">Challenges and Limitations</h2>
        
        <p className="mb-4">
          Despite its potential, blockchain technology faces several challenges in agricultural applications:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Scalability</strong> - Some blockchain platforms struggle with high transaction volumes
          </li>
          <li>
            <strong>Energy Consumption</strong> - Particularly for Proof of Work consensus mechanisms
          </li>
          <li>
            <strong>Implementation Costs</strong> - Initial setup and integration can be expensive
          </li>
          <li>
            <strong>Technical Complexity</strong> - Requires specialized knowledge and expertise
          </li>
          <li>
            <strong>Interoperability</strong> - Different blockchain systems may not communicate effectively
          </li>
          <li>
            <strong>Data Privacy</strong> - Balancing transparency with confidential business information
          </li>
          <li>
            <strong>Digital Divide</strong> - Access challenges for small-scale farmers in developing regions
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          As Tripoli and Schmidhuber (2018) note in their FAO report, "While blockchain has the potential to revolutionize 
          agricultural supply chains, significant work remains to address technological, regulatory, and adoption challenges, 
          particularly for small-scale farmers in developing countries."
        </p>

        <h2 className="mb-6 font-bold text-3xl">The Future of Blockchain in Agriculture</h2>
        
        <p className="mb-4">
          As blockchain technology matures, several trends are emerging that will shape its application in agricultural supply chains:
        </p>
        
        <ul className="list-disc list-outside pl-5 space-y-2 mb-6">
          <li>
            <strong>Integration with IoT and AI</strong> - Combining blockchain with sensors and artificial intelligence 
            for automated data collection and analysis
          </li>
          <li>
            <strong>Increased Standardization</strong> - Development of industry-wide standards for blockchain implementation
          </li>
          <li>
            <strong>More Efficient Consensus Mechanisms</strong> - Evolution of consensus protocols that reduce energy consumption
          </li>
          <li>
            <strong>Enhanced Privacy Solutions</strong> - Technologies that balance transparency with confidentiality needs
          </li>
          <li>
            <strong>Mobile-First Approaches</strong> - Solutions designed for farmers with limited technical resources
          </li>
        </ul>
        
        <p className="mb-4 mt-6">
          Research by Feng et al. (2020) suggests that "the next generation of blockchain solutions for agriculture will 
          emphasize accessibility, interoperability, and sustainable practices, making the technology more viable for 
          global adoption across diverse agricultural contexts."
        </p>

        <h2 className="mb-6 font-bold text-3xl">Conclusion</h2>
        
        <p className="mb-4">
          Blockchain technology offers a powerful solution to many of the challenges facing agricultural supply chains. 
          By providing a secure, transparent, and immutable record of transactions and product movements, blockchain 
          can help build trust among stakeholders, enhance food safety, reduce fraud, and improve efficiency.
        </p>
        
        <p className="mb-4">
          While challenges remain in implementation and adoption, the ongoing evolution of blockchain technology 
          promises to make it increasingly accessible and valuable for agricultural applications. As the technology 
          matures and becomes more integrated with other digital innovations, its transformative potential for 
          the agricultural sector continues to grow.
        </p>

        <h2 className="mb-6 font-bold text-3xl">References</h2>
        
        <div className="text-sm space-y-3">
          <p className="mb-4">Antonucci, F., Figorilli, S., Costa, C., Pallottino, F., Raso, L., & Menesatti, P. (2019). A review on blockchain applications in the agri‐food sector. Journal of the Science of Food and Agriculture, 99(14), 6129-6138.</p>
          
          <p className="mb-4">Feng, H., Wang, X., Duan, Y., Zhang, J., & Zhang, X. (2020). Applying blockchain technology to improve agri-food traceability: A review of development methods, benefits and challenges. Journal of Cleaner Production, 260, 121031.</p>
          
          <p className="mb-4">Kamilaris, A., Fonts, A., & Prenafeta-Boldύ, F. X. (2019). The rise of blockchain technology in agriculture and food supply chains. Trends in Food Science & Technology, 91, 640-652.</p>
          
          <p className="mb-4">Karame, G., & Androulaki, E. (2016). Bitcoin and blockchain security. Artech House.</p>
          
          <p className="mb-4">Li, X., Jiang, P., Chen, T., Luo, X., & Wen, Q. (2020). A survey on the security of blockchain systems. Future Generation Computer Systems, 107, 841-853.</p>
          
          <p className="mb-4">Menezes, A. J., Oorschot, P. C., & Vanstone, S. A. (2018). Handbook of applied cryptography. CRC press.</p>
          
          <p className="mb-4">Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. Decentralized Business Review.</p>
          
          <p className="mb-4">Treiblmaier, H. (2018). The impact of the blockchain on the supply chain: a theory-based research framework and a call for action. Supply Chain Management: An International Journal, 23(6), 545-559.</p>
          
          <p className="mb-4">Tripoli, M., & Schmidhuber, J. (2018). Emerging opportunities for the application of blockchain in the agri-food industry. FAO and ICTSD: Rome and Geneva.</p>
          
          <p className="mb-4">Wang, Y., Han, J. H., & Beynon-Davies, P. (2019). Understanding blockchain technology for future supply chains: a systematic literature review and research agenda. Supply Chain Management: An International Journal, 24(1), 62-84.</p>
          
          <p className="mb-4">Zheng, Z., Xie, S., Dai, H. N., Chen, X., & Wang, H. (2018). Blockchain challenges and opportunities: A survey. International Journal of Web and Grid Services, 14(4), 352-375.</p>
        </div>
      </div>
      
      {/* Next articles navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-gray-900 text-xl font-semibold mb-6">Continue Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/learn/articles/userguide/product-tracking" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Previous: Product Tracking & Verification</h4>
            <p className="text-gray-600">Learn how to track products and verify their authenticity</p>
          </Link>
          <Link href="/learn/articles/blockchain/blockchain-in-agriculture" className="p-6 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">Next: Blockchain in Agriculture</h4>
            <p className="text-gray-600">Explore how blockchain technology is applied in agriculture</p>
          </Link>
        </div>
      </div>
    </article>
  );
}