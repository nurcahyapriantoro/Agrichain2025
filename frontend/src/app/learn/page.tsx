'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronRight, BookOpen, Layers, BarChart2, Users, Zap, CheckCircle, Clock } from 'lucide-react';

// Komponen untuk animasi background
const Web3Background = () => {
  const [particles, setParticles] = useState([]);

  // Generate particles only on client-side to avoid hydration mismatch
  useEffect(() => {
    const clientSideParticles = Array.from({ length: 20 }).map((_, i) => ({
      width: `${Math.random() * 10 + 5}rem`,
      height: `${Math.random() * 10 + 5}rem`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      background: i % 2 === 0 
        ? 'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)' 
        : 'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)',
      animationDuration: `${Math.random() * 8 + 4}s`,
    }));
    
    setParticles(clientSideParticles);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#18122B] to-[#0f1722]" />
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={particle}
          />
        ))}
      </div>
    </div>
  );
};

// Komponen untuk tombol kategori
const CategoryButton = ({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium flex items-center ${
      active 
        ? 'bg-gradient-to-r from-[#00ffcc]/20 to-[#a259ff]/20 text-white border border-[#a259ff]/30' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {children}
  </button>
);

// Define article type
interface Article {
  title: string;
  description: string;
  icon: React.ElementType;
  time: string;
  href: string;
  category: string;
}

// Komponen untuk artikel
const ArticleCard = ({ title, description, icon: Icon, time, href }: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  time: string;
  href: string;
}) => (
  <Link href={href}>
    <div className="p-6 rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-700/50 hover:border-[#a259ff]/50 transition-all duration-300 group">
      <div className="flex items-start">
        <div className="mr-4 mt-1 bg-[#a259ff]/20 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-[#a259ff]" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#00ffcc] transition-colors duration-300">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{time}</span>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

export default function LearnPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [isScrolled, setIsScrolled] = useState(false);

  // Define all articles with their categories
  const allArticles = {
    supplyChainArticles: [
      {
        title: "What is a Supply Chain?",
        description: "Learn about the stages, participants, and processes involved in a typical agricultural supply chain and why efficient management is crucial.",
        icon: Layers,
        time: "5 min read",
        href: "/learn/articles/supply-chain/what-is-supply-chain",
        category: "supplychain"
      },
      {
        title: "Traditional vs. Blockchain Supply Chains",
        description: "Compare traditional and blockchain-based supply chains, understanding the key differences and advantages of blockchain implementation.",
        icon: BarChart2,
        time: "7 min read",
        href: "/learn/articles/supply-chain/traditional-vs-blockchain",
        category: "supplychain"
      },
      {
        title: "Supply Chain Challenges in Agriculture",
        description: "Explore common challenges faced in agricultural supply chains including traceability, authenticity verification, and fair trade practices.",
        icon: Zap,
        time: "6 min read",
        href: "/learn/articles/supply-chain/supply-chain-challenges",
        category: "supplychain"
      },
      {
        title: "Benefits of Transparent Supply Chains",
        description: "Discover how transparency benefits all participants in the supply chain from increased consumer trust to regulatory compliance.",
        icon: CheckCircle,
        time: "5 min read",
        href: "/learn/articles/supply-chain/benefits-of-transparency",
        category: "supplychain"
      }
    ],
    userGuideArticles: [
      {
        title: "Getting Started with AgriChain",
        description: "A comprehensive guide for new users explaining how to create an account, select your role, and start using the platform.",
        icon: BookOpen,
        time: "8 min read",
        href: "/learn/articles/userguide/getting-started",
        category: "users"
      },
      {
        title: "User Roles & Permissions",
        description: "Learn about the different user roles in the AgriChain ecosystem: Farmers, Collectors, Traders, Retailers, and Consumers.",
        icon: Users,
        time: "6 min read",
        href: "/learn/articles/userguide/user-roles",
        category: "users"
      },
      {
        title: "Recording Transactions",
        description: "Step-by-step guide on how to record different types of transactions in the AgriChain platform and verify product authenticity.",
        icon: CheckCircle,
        time: "7 min read",
        href: "/learn/articles/userguide/recording-transactions",
        category: "users"
      },
      {
        title: "Product Tracking & Verification",
        description: "How to track products throughout the supply chain and verify their authenticity using blockchain technology.",
        icon: Layers,
        time: "5 min read",
        href: "/learn/articles/userguide/product-tracking",
        category: "users"
      }
    ],
    blockchainArticles: [
      {
        title: "Blockchain Fundamentals",
        description: "Understand the basic concepts of blockchain technology including distributed ledgers, consensus mechanisms, and smart contracts.",
        icon: BarChart2,
        time: "8 min read",
        href: "/learn/articles/blockchain/blockchain-fundamentals",
        category: "blockchain"
      },
      {
        title: "Blockchain in Agriculture",
        description: "Explore how blockchain technology is specifically being applied to solve challenges in the agricultural industry.",
        icon: Layers,
        time: "7 min read",
        href: "/learn/articles/blockchain/blockchain-in-agriculture",
        category: "blockchain"
      },
      {
        title: "Smart Contracts for Supply Chain",
        description: "Learn how smart contracts automate agreements between parties in the supply chain, ensuring compliance and trust.",
        icon: CheckCircle,
        time: "6 min read",
        href: "/learn/articles/blockchain/smart-contracts",
        category: "blockchain"
      },
      {
        title: "The Future of Blockchain in Agriculture",
        description: "Discover emerging trends and future applications of blockchain technology in agricultural supply chains and food systems.",
        icon: Zap,
        time: "5 min read",
        href: "/learn/articles/blockchain/future-of-blockchain",
        category: "blockchain"
      }
    ]
  };

  // Flatten all articles into a single array
  const flattenedArticles = [
    ...allArticles.supplyChainArticles,
    ...allArticles.userGuideArticles,
    ...allArticles.blockchainArticles
  ];

  // Filter articles based on active category
  const filteredArticles = (category: string) => {
    if (category === 'all') {
      return flattenedArticles;
    }
    return flattenedArticles.filter(article => article.category === category);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get articles based on the active category
  const currentArticles = filteredArticles(activeCategory);

  return (
    <div className="min-h-screen pb-20">
      <Web3Background />
      
      {/* Header sticky */}
      <header className={`sticky top-0 z-30 transition-all duration-300 ${
        isScrolled ? 'bg-[#18122B]/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center group">
            <ArrowLeft className="w-5 h-5 mr-2 text-[#00ffcc] group-hover:text-[#a259ff] transition-all duration-300" />
            <span className="text-white group-hover:text-[#a259ff] transition-all duration-300">Back to Home</span>
          </Link>
          
          <div className="flex items-center">
            <span className="text-[#00ffcc] mr-2"><BookOpen className="w-5 h-5" /></span>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">
              Learning Hub
            </h1>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">
              AgriChain Learning Center
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Discover how blockchain technology revolutionizes agricultural supply chains, ensures 
            transparency, and creates trust between all stakeholders.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500">Topics:</span>
            <span className="text-white bg-[#a259ff]/20 px-3 py-1 rounded-full">Supply Chain</span>
            <span className="text-white bg-[#00ffcc]/20 px-3 py-1 rounded-full">Blockchain</span>
            <span className="text-white bg-purple-600/20 px-3 py-1 rounded-full">Agriculture</span>
            <span className="text-white bg-indigo-600/20 px-3 py-1 rounded-full">Web3</span>
          </div>
        </div>
      </section>
      
      {/* Categories filter */}
      <section className="mb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center md:justify-start flex-wrap gap-2">
            <CategoryButton 
              active={activeCategory === 'all'} 
              onClick={() => setActiveCategory('all')}
            >
              All Topics
            </CategoryButton>
            <CategoryButton 
              active={activeCategory === 'supplychain'} 
              onClick={() => setActiveCategory('supplychain')}
            >
              <Layers className="w-4 h-4 mr-2" />
              Supply Chain
            </CategoryButton>
            <CategoryButton 
              active={activeCategory === 'blockchain'} 
              onClick={() => setActiveCategory('blockchain')}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Blockchain
            </CategoryButton>
            <CategoryButton 
              active={activeCategory === 'users'} 
              onClick={() => setActiveCategory('users')}
            >
              <Users className="w-4 h-4 mr-2" />
              User Guides
            </CategoryButton>
          </div>
        </div>
      </section>
      
      {/* Main content */}
      <section className="mb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Featured Article - Only show on All Topics */}
          {activeCategory === 'all' && (
            <div className="mb-16 relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#18122B] to-transparent z-10"></div>
              <div className="relative z-20 p-8 md:p-12 max-w-2xl">
                <h2 className="text-3xl font-bold text-white mb-4">Understanding Agricultural Supply Chains</h2>
                <p className="text-gray-300 mb-6">
                  A comprehensive overview of how agricultural products move from farms to consumers, 
                  the challenges in traditional systems, and how blockchain is transforming the industry.
                </p>
                <div className="flex items-center mb-8">
                  <div className="bg-[#a259ff]/20 p-2 rounded-full">
                    <Clock className="w-5 h-5 text-[#a259ff]" />
                  </div>
                  <span className="ml-2 text-gray-400">10 min read</span>
                </div>
                <Link href="/learn/articles/supply-chain/what-is-supply-chain" className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-[#00ffcc] to-[#a259ff] text-black font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,204,0.5)]">
                  Read Article <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
              
              <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-[#a259ff]/10 to-transparent z-0 hidden md:block">
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-80 h-80 border-4 border-[#a259ff]/30 rounded-full animate-spin-slow"></div>
                  <div className="absolute w-60 h-60 border-4 border-[#00ffcc]/30 rounded-full animate-spin-slow-reverse"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Show filtered articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {currentArticles.map((article, index) => (
              <ArticleCard 
                key={index}
                title={article.title}
                description={article.description}
                icon={article.icon}
                time={article.time}
                href={article.href}
              />
            ))}
          </div>
          
          {/* Category info sections - only show when respective category is active */}
          {activeCategory === 'all' || activeCategory === 'supplychain' ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 mb-12">
              <h3 className="text-xl font-semibold text-white mb-4">Agricultural Supply Chain: From Farm to Table</h3>
              <p className="text-gray-300 mb-4">
                An agricultural supply chain encompasses all stages involved in bringing agricultural products from farms to end consumers. 
                It includes processes like production, harvesting, processing, packaging, distribution, and retail.
              </p>
              <p className="text-gray-300 mb-4">
                In traditional supply chains, tracking products throughout these stages has been challenging, leading to issues with 
                food safety, authenticity verification, and fair compensation for farmers. Data is often siloed within each participant's 
                systems, making end-to-end visibility nearly impossible.
              </p>
              <p className="text-gray-300 mb-4">
                Blockchain technology offers a revolutionary solution by creating a shared, immutable ledger that records every 
                transaction and movement of products. This provides:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
                <li><span className="text-[#00ffcc] font-medium">Traceability:</span> Complete history of products from origin to consumer</li>
                <li><span className="text-[#00ffcc] font-medium">Transparency:</span> Visibility into all transactions and movements</li>
                <li><span className="text-[#00ffcc] font-medium">Trust:</span> Immutable records that cannot be altered</li>
                <li><span className="text-[#00ffcc] font-medium">Efficiency:</span> Streamlined processes and reduced paperwork</li>
                <li><span className="text-[#00ffcc] font-medium">Fair Trade:</span> Verifiable practices and appropriate compensation</li>
              </ul>
              <p className="text-gray-300">
                By implementing blockchain in agricultural supply chains, we can address long-standing challenges and create 
                a more sustainable, efficient, and equitable system for all participants.
              </p>
            </div>
          ) : null}
          
          {activeCategory === 'all' || activeCategory === 'users' ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 mb-12">
              <h3 className="text-xl font-semibold text-white mb-4">AgriChain Platform: Connecting Agricultural Stakeholders</h3>
              <p className="text-gray-300 mb-4">
                AgriChain is a blockchain-powered platform designed to connect all participants in the agricultural supply chain. 
                Our platform provides tools for tracking agricultural products, verifying authenticity, and ensuring fair trade practices.
              </p>
              <p className="text-gray-300 mb-4">
                The platform supports different user roles, each with specific capabilities:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
                <li><span className="text-[#a259ff] font-medium">Farmers:</span> Record harvests, certify growing practices, and connect with buyers</li>
                <li><span className="text-[#a259ff] font-medium">Collectors:</span> Document collection from farmers and initial processing</li>
                <li><span className="text-[#a259ff] font-medium">Traders:</span> Track bulk purchases, processing, and distribution</li>
                <li><span className="text-[#a259ff] font-medium">Retailers:</span> Verify product authenticity and manage consumer sales</li>
                <li><span className="text-[#a259ff] font-medium">Consumers:</span> Access complete product history and verify authenticity</li>
              </ul>
              <p className="text-gray-300 mb-4">
                Every transaction in AgriChain is recorded on the blockchain, creating an immutable record that ensures transparency 
                and trust. Users can easily verify the authenticity and origin of products, understand the journey of agricultural 
                goods from farm to table, and ensure fair compensation for all participants.
              </p>
              <p className="text-gray-300">
                Our platform combines the security and transparency of blockchain technology with an intuitive user interface that 
                makes it accessible to users regardless of their technical expertise.
              </p>
            </div>
          ) : null}
          
          {activeCategory === 'all' || activeCategory === 'blockchain' ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">Blockchain Technology: Transforming Agricultural Supply Chains</h3>
              <p className="text-gray-300 mb-4">
                Blockchain is a distributed ledger technology that creates a transparent and immutable record of transactions. 
                Unlike traditional databases, blockchain data is stored across multiple nodes, making it highly secure and resistant to tampering.
              </p>
              <p className="text-gray-300 mb-4">
                In agricultural supply chains, blockchain provides several key benefits:
              </p>
              <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-2">
                <li><span className="text-[#00ffcc] font-medium">Immutability:</span> Once data is recorded, it cannot be altered or deleted</li>
                <li><span className="text-[#00ffcc] font-medium">Transparency:</span> All authorized participants can view the same information</li>
                <li><span className="text-[#00ffcc] font-medium">Traceability:</span> Products can be tracked from origin to consumer</li>
                <li><span className="text-[#00ffcc] font-medium">Security:</span> Cryptographic mechanisms protect data integrity</li>
                <li><span className="text-[#00ffcc] font-medium">Automation:</span> Smart contracts execute automatically when conditions are met</li>
              </ul>
              <p className="text-gray-300 mb-4">
                Through blockchain, we can address critical challenges in agricultural supply chains, including food safety concerns, 
                counterfeiting, inefficient processes, and lack of transparency. Farmers can prove the authenticity of their products 
                and practices, while consumers can verify the origin and journey of their food.
              </p>
              <p className="text-gray-300">
                AgriChain leverages blockchain technology to create trust between all participants in the agricultural supply chain, 
                ensuring a more sustainable, efficient, and equitable system for everyone involved.
              </p>
            </div>
          ) : null}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#18122B] to-[#0f1722] py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Agricultural Supply Chain?</h2>
          <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
            Join farmers, collectors, traders, retailers, and consumers on our transparent blockchain platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="px-8 py-3 bg-gradient-to-r from-[#00ffcc] to-[#a259ff] text-black rounded-lg font-medium hover:shadow-[0_0_20px_rgba(0,255,204,0.5)] transition-all duration-300">
              Create an Account
            </Link>
            <Link href="/" className="px-8 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-lg font-medium border border-gray-700 transition-all duration-300">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 