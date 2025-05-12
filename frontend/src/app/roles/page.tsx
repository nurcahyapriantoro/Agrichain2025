'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';
import { Users, Leaf, Package, Truck, Store, User, ArrowLeft, ArrowRight } from 'lucide-react';

// Custom animation delay classes
const getDelayClass = (index: number) => {
  switch (index) {
    case 0: return 'animation-delay-200';
    case 1: return 'animation-delay-400';
    case 2: return 'animation-delay-600';
    case 3: return 'animation-delay-800';
    case 4: return 'animation-delay-1000';
    default: return 'animation-delay-200';
  }
};

const getGlowDelayClass = (index: number) => {
  switch (index) {
    case 0: return 'animation-delay-0';
    case 1: return 'animation-delay-500';
    case 2: return 'animation-delay-1000';
    case 3: return 'animation-delay-1500';
    case 4: return 'animation-delay-2000';
    default: return 'animation-delay-0';
  }
};

// Function to get animation fill mode class
const getAnimationFillModeClass = () => {
  return 'animation-fill-forwards';
};

// Enhanced icon components with gradient effects
const FarmerIcon = () => (
  <div className="relative group">
    <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
    <div className="relative bg-[#18122B] rounded-full p-3">
      <Leaf className="w-10 h-10 text-green-400 group-hover:text-green-300 transition-all duration-300" />
    </div>
  </div>
);

const CollectorIcon = () => (
  <div className="relative group">
    <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
    <div className="relative bg-[#18122B] rounded-full p-3">
      <Package className="w-10 h-10 text-blue-400 group-hover:text-blue-300 transition-all duration-300" />
    </div>
  </div>
);

const TraderIcon = () => (
  <div className="relative group">
    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
    <div className="relative bg-[#18122B] rounded-full p-3">
      <Truck className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-all duration-300" />
    </div>
  </div>
);

const RetailerIcon = () => (
  <div className="relative group">
    <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
    <div className="relative bg-[#18122B] rounded-full p-3">
      <Store className="w-10 h-10 text-orange-400 group-hover:text-orange-300 transition-all duration-300" />
    </div>
  </div>
);

const ConsumerIcon = () => (
  <div className="relative group">
    <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-75 group-hover:opacity-100 blur-lg transition-all duration-500"></div>
    <div className="relative bg-[#18122B] rounded-full p-3">
      <User className="w-10 h-10 text-amber-400 group-hover:text-amber-300 transition-all duration-300" />
    </div>
  </div>
);

// Flow diagram components
const FlowArrow = ({ color }: { color: string }) => (
  <div className="relative flex-1 mx-2 h-2 md:mx-0">
    <div className={`absolute inset-0 ${color} opacity-75`}></div>
    <div className="absolute inset-0 flow-across">
      <div className={`h-2 w-12 ${color} rounded-full`}></div>
    </div>
  </div>
);

const RoleNode = ({ 
  icon, 
  name, 
  color, 
  delay 
}: { 
  icon: React.ReactNode; 
  name: string; 
  color: string;
  delay: string;
}) => (
  <div className={`animate-fadeInSlide node-glow opacity-0 ${delay} ${getAnimationFillModeClass()}`}>
    <div className="flex flex-col items-center">
      <div className="mb-2">{icon}</div>
      <span className={`text-sm font-medium ${color}`}>{name}</span>
    </div>
  </div>
);

// Role data with descriptions and capabilities
const rolesData = [
  {
    id: 'farmer',
    name: 'Farmer',
    icon: <FarmerIcon />,
    description: 'Farmers are the primary producers in the agricultural supply chain who grow crops and raise livestock.',
    capabilities: [
      'Register and manage agricultural products',
      'Create and trace product transactions',
      'View blockchain records for your products',
      'Maintain digital reputation through verified transactions'
    ],
    color: 'from-green-400 to-green-600',
    textColor: 'text-green-400'
  },
  {
    id: 'collector',
    name: 'Collector',
    icon: <CollectorIcon />,
    description: 'Collectors gather and aggregate agricultural products from farmers, ensuring quality assessment and proper handling.',
    capabilities: [
      'Collect and aggregate products from multiple farmers',
      'Perform initial quality assessment',
      'Create collection transaction records',
      'Manage product batches with blockchain verification'
    ],
    color: 'from-blue-400 to-blue-600',
    textColor: 'text-blue-400'
  },
  {
    id: 'trader',
    name: 'Trader',
    icon: <TraderIcon />,
    description: 'Traders buy and sell agricultural products in bulk, connecting collectors with retailers and ensuring market distribution.',
    capabilities: [
      'Manage trading and bulk distribution operations',
      'Create and verify trading transaction records',
      'Track product journey across the supply chain',
      'Access supply chain analytics and market data'
    ],
    color: 'from-purple-400 to-purple-600',
    textColor: 'text-purple-400'
  },
  {
    id: 'retailer',
    name: 'Retailer',
    icon: <RetailerIcon />,
    description: 'Retailers sell agricultural products directly to consumers and provide the final link in the supply chain.',
    capabilities: [
      'Verify product authenticity before selling',
      'Access complete supply chain history',
      'Provide customers with transparent product information',
      'Build customer trust through verified sourcing'
    ],
    color: 'from-orange-400 to-orange-600',
    textColor: 'text-orange-400'
  },
  {
    id: 'consumer',
    name: 'Consumer',
    icon: <ConsumerIcon />,
    description: 'Consumers are the end users who purchase and consume agricultural products, making informed decisions based on transparent information.',
    capabilities: [
      'Verify product authenticity through QR codes',
      'View complete supply chain journey',
      'Make informed purchasing decisions',
      'Provide feedback and ratings for products'
    ],
    color: 'from-amber-400 to-amber-600',
    textColor: 'text-amber-400'
  }
];

// Supply Chain Flow Diagram Component
const SupplyChainFlow = () => {
  return (
    <div className="py-10 mb-16 mt-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Flow Diagram Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">
          Agricultural Supply Chain Flow
        </h2>
        <p className="text-gray-400 mt-2">
          Follow the journey of agricultural products from farm to table
        </p>
      </div>
      
      {/* Visual Flow Diagram */}
      <div className="relative max-w-6xl mx-auto mb-10 overflow-hidden px-12">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`bg-particle-${i}`} 
              className={`absolute rounded-full mix-blend-screen animate-float opacity-20`}
              style={{
                background: i % 2 === 0 ? 
                  'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)' : 
                  'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)',
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                // Use CSS variables for animation properties
                '--float-delay': `${Math.random() * 5}s`,
                '--float-duration': `${Math.random() * 10 + 10}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Moving Objects Animation - Improved to reach Consumer */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(12)].map((_, i) => {
            const size = Math.random() * 3 + 2;
            const speed = Math.random() * 3 + 8; // Random speed between 8-11s
            return (
              <div 
                key={`flow-particle-${i}`} 
                className="absolute h-3 w-3 rounded-full opacity-50"
                style={{ 
                  top: '50%',
                  left: '-20px', // Start before the flow line
                  width: `${size}px`,
                  height: `${size}px`,
                  background: i % 5 === 0 ? '#00ffcc' : 
                             i % 5 === 1 ? '#a259ff' : 
                             i % 5 === 2 ? '#3b82f6' : 
                             i % 5 === 3 ? '#8b5cf6' : 
                             '#f59e0b',
                  boxShadow: `0 0 10px ${i % 5 === 0 ? '#00ffcc' : 
                             i % 5 === 1 ? '#a259ff' : 
                             i % 5 === 2 ? '#3b82f6' : 
                             i % 5 === 3 ? '#8b5cf6' : 
                             '#f59e0b'}`,
                  transform: 'translateY(-50%)',
                  animation: `flowAcross ${speed}s linear infinite`,
                  animationDelay: `${i * 0.7}s`,
                }}
              />
            );
          })}
        </div>
        
        {/* Connection Line with glowing effect */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 opacity-70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 opacity-40 blur-sm"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 animate-pulse-slow"></div>
        </div>
        
        {/* Simplified Desktop Flow */}
        <div className="hidden md:flex justify-between items-center py-12 relative z-10">
          {rolesData.map((role, index) => (
            <div 
              key={role.id} 
              className={`flex flex-col items-center animate-fadeInSlide opacity-0 ${getDelayClass(index)}`}
            >
              {/* Glowing background circle */}
              <div 
                className={`absolute rounded-full blur-md w-20 h-20 opacity-70 animate-pulse-slow ${getGlowDelayClass(index)}`}
                style={{
                  background: `radial-gradient(circle, ${role.id === 'farmer' ? '#10b981' :
                                                     role.id === 'collector' ? '#3b82f6' : 
                                                     role.id === 'trader' ? '#8b5cf6' : 
                                                     role.id === 'retailer' ? '#f59e0b' : 
                                                     '#f59e0b'} 0%, rgba(0,0,0,0) 70%)`
                }}
              >
              </div>
              
              <div className="relative z-10">{role.icon}</div>
              <p className={`mt-2 font-medium ${role.textColor}`}>{role.name}</p>
              
              {index < rolesData.length - 1 && (
                <div className="absolute left-[calc(100%_-_15px)] top-1/2 transform -translate-y-1/2 flex items-center">
                  <div className="w-4 h-0.5 bg-gray-700"></div>
                  <ArrowRight className={`w-4 h-4 ${rolesData[index + 1].textColor} animate-pulse-slow ml-1`} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Simplified Mobile Flow - Horizontal Scroll - Improved */}
        <div className="md:hidden relative py-8">
          <div className="flex justify-between items-center">
            {rolesData.map((role, index) => (
              <div 
                key={role.id} 
                className={`flex flex-col items-center animate-fadeInSlide mx-2 opacity-0 ${getDelayClass(index)}`}
              >
                {/* Glowing background circle */}
                <div 
                  className={`absolute rounded-full blur-md w-16 h-16 opacity-70 animate-pulse-slow ${getGlowDelayClass(index)}`}
                  style={{
                    background: `radial-gradient(circle, ${role.id === 'farmer' ? '#10b981' :
                                                      role.id === 'collector' ? '#3b82f6' : 
                                                      role.id === 'trader' ? '#8b5cf6' : 
                                                      role.id === 'retailer' ? '#f59e0b' : 
                                                      '#f59e0b'} 0%, rgba(0,0,0,0) 70%)`
                  }}
                >
                </div>
                
                <div className="relative z-10 scale-75 md:scale-100">{role.icon}</div>
                <p className={`mt-1 text-sm font-medium ${role.textColor}`}>{role.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Process Explanation */}
      <div className={`text-center mt-10 max-w-3xl mx-auto px-4 animate-fadeInSlide opacity-0 animation-delay-1200 ${getAnimationFillModeClass()}`}>
        <div className="bg-[#18122B]/60 border border-[#a259ff]/20 p-4 rounded-lg">
          <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff] mb-2">
            Blockchain-Verified Agricultural Journey
          </h3>
          <p className="text-gray-300 text-sm">
            AgriChain enables seamless tracking and verification at each stage of the supply chain.
            Every transaction between roles is recorded on the blockchain, creating an immutable
            record that ensures transparency, authenticity, and accountability throughout the entire process.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f29] via-[#18122B] to-[#000000] opacity-90"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Moving particles */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={`bg-star-${i}`}
            className="absolute rounded-full animate-float opacity-20 mix-blend-screen"
            style={{
              background: i % 3 === 0 ? 
                'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)' : 
                i % 3 === 1 ?
                'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)' :
                'radial-gradient(circle, #3b82f6 0%, rgba(59,130,246,0) 70%)',
              width: `${Math.random() * 15 + 3}px`,
              height: `${Math.random() * 15 + 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--float-delay': `${Math.random() * 10}s`,
              '--float-duration': `${Math.random() * 20 + 15}s`
            } as React.CSSProperties}
          />
        ))}
        
        {/* Larger ambient lights */}
        {[...Array(5)].map((_, i) => (
          <div 
            key={`ambient-light-${i}`}
            className="absolute rounded-full blur-3xl animate-pulse-slow opacity-10"
            style={{
              background: i % 3 === 0 ? 
                'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)' : 
                i % 3 === 1 ?
                'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)' :
                'radial-gradient(circle, #3b82f6 0%, rgba(59,130,246,0) 70%)',
              width: `${Math.random() * 300 + 200}px`,
              height: `${Math.random() * 300 + 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 20}s`
            }}
          />
        ))}
        
        {/* Moving light beam */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-transparent via-[#00ffcc]/10 to-transparent skew-y-3 animate-beam"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Link href="/" className="flex items-center group w-fit">
            <ArrowLeft className="w-5 h-5 mr-2 text-[#00ffcc] group-hover:text-[#a259ff] transition-all duration-300" />
            <span className="text-white group-hover:text-[#a259ff] transition-all duration-300">Back to Home</span>
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[#00ffcc] mr-2" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">
              Agricultural Supply Chain Roles
            </h1>
          </div>
          <p className="text-gray-300 max-w-3xl mx-auto">
            AgriChain connects different stakeholders across the agricultural supply chain, creating a transparent and efficient ecosystem.
          </p>
        </div>
        
        {/* Supply Chain Flow Diagram in a card */}
        <div className="mb-16 bg-[#18122B]/80 border border-[#a259ff]/20 rounded-xl p-6 shadow-[0_5px_30px_rgba(162,89,255,0.1)] backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff] mb-8">
            Supply Chain Flow
          </h2>
          
          {/* Visual Flow Diagram */}
          <div className="relative max-w-6xl mx-auto mb-10 overflow-hidden px-12">
            {/* Background Animation */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={`bg-particle-${i}`} 
                  className={`absolute rounded-full mix-blend-screen animate-float opacity-20`}
                  style={{
                    background: i % 2 === 0 ? 
                      'radial-gradient(circle, #00ffcc 0%, rgba(0,255,204,0) 70%)' : 
                      'radial-gradient(circle, #a259ff 0%, rgba(162,89,255,0) 70%)',
                    width: `${Math.random() * 10 + 5}px`,
                    height: `${Math.random() * 10 + 5}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    // Use CSS variables for animation properties
                    '--float-delay': `${Math.random() * 5}s`,
                    '--float-duration': `${Math.random() * 10 + 10}s`
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Moving Objects Animation - Improved to reach Consumer */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => {
                const size = Math.random() * 3 + 2;
                const speed = Math.random() * 3 + 8; // Random speed between 8-11s
                return (
                  <div 
                    key={`flow-particle-${i}`} 
                    className="absolute h-3 w-3 rounded-full opacity-50"
                    style={{ 
                      top: '50%',
                      left: '-20px', // Start before the flow line
                      width: `${size}px`,
                      height: `${size}px`,
                      background: i % 5 === 0 ? '#00ffcc' : 
                                 i % 5 === 1 ? '#a259ff' : 
                                 i % 5 === 2 ? '#3b82f6' : 
                                 i % 5 === 3 ? '#8b5cf6' : 
                                 '#f59e0b',
                      boxShadow: `0 0 10px ${i % 5 === 0 ? '#00ffcc' : 
                                 i % 5 === 1 ? '#a259ff' : 
                                 i % 5 === 2 ? '#3b82f6' : 
                                 i % 5 === 3 ? '#8b5cf6' : 
                                 '#f59e0b'}`,
                      transform: 'translateY(-50%)',
                      animation: `flowAcross ${speed}s linear infinite`,
                      animationDelay: `${i * 0.7}s`,
                    }}
                  />
                );
              })}
            </div>
            
            {/* Connection Line with glowing effect */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 opacity-40 blur-sm"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-purple-500 to-amber-400 animate-pulse-slow"></div>
            </div>
            
            {/* Simplified Desktop Flow */}
            <div className="hidden md:flex justify-between items-center py-12 relative z-10">
              {rolesData.map((role, index) => (
                <div 
                  key={role.id} 
                  className={`flex flex-col items-center animate-fadeInSlide opacity-0 ${getDelayClass(index)}`}
                >
                  {/* Glowing background circle */}
                  <div 
                    className={`absolute rounded-full blur-md w-20 h-20 opacity-70 animate-pulse-slow ${getGlowDelayClass(index)}`}
                    style={{
                      background: `radial-gradient(circle, ${role.id === 'farmer' ? '#10b981' :
                                                         role.id === 'collector' ? '#3b82f6' : 
                                                         role.id === 'trader' ? '#8b5cf6' : 
                                                         role.id === 'retailer' ? '#f59e0b' : 
                                                         '#f59e0b'} 0%, rgba(0,0,0,0) 70%)`
                    }}
                  >
                  </div>
                  
                  <div className="relative z-10">{role.icon}</div>
                  <p className={`mt-2 font-medium ${role.textColor}`}>{role.name}</p>
                  
                  {index < rolesData.length - 1 && (
                    <div className="absolute left-[calc(100%_-_15px)] top-1/2 transform -translate-y-1/2 flex items-center">
                      <div className="w-4 h-0.5 bg-gray-700"></div>
                      <ArrowRight className={`w-4 h-4 ${rolesData[index + 1].textColor} animate-pulse-slow ml-1`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Simplified Mobile Flow - Horizontal Scroll - Improved */}
            <div className="md:hidden relative py-8">
              <div className="flex justify-between items-center">
                {rolesData.map((role, index) => (
                  <div 
                    key={role.id} 
                    className={`flex flex-col items-center animate-fadeInSlide mx-2 opacity-0 ${getDelayClass(index)}`}
                  >
                    {/* Glowing background circle */}
                    <div 
                      className={`absolute rounded-full blur-md w-16 h-16 opacity-70 animate-pulse-slow ${getGlowDelayClass(index)}`}
                      style={{
                        background: `radial-gradient(circle, ${role.id === 'farmer' ? '#10b981' :
                                                          role.id === 'collector' ? '#3b82f6' : 
                                                          role.id === 'trader' ? '#8b5cf6' : 
                                                          role.id === 'retailer' ? '#f59e0b' : 
                                                          '#f59e0b'} 0%, rgba(0,0,0,0) 70%)`
                      }}
                    >
                    </div>
                    
                    <div className="relative z-10 scale-75 md:scale-100">{role.icon}</div>
                    <p className={`mt-1 text-sm font-medium ${role.textColor}`}>{role.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Process Explanation */}
          <div className={`max-w-3xl mx-auto px-4 animate-fadeInSlide opacity-0 animation-delay-1200 ${getAnimationFillModeClass()}`}>
            <div className="bg-[#18122B] border border-[#a259ff]/20 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff] mb-3">
                Blockchain-Verified Agricultural Journey
              </h3>
              <p className="text-gray-300 text-sm text-center">
                Every transaction between roles is recorded on the blockchain, creating an immutable
                record that ensures transparency, authenticity, and accountability throughout the entire process.
              </p>
            </div>
          </div>
        </div>
        
        {/* Role Detail Section Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#a259ff]">
            Explore Each Role
          </h2>
          <p className="text-gray-400 mt-2">
            Click on any role card below to learn more about their responsibilities
          </p>
        </div>
        
        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {rolesData.map((role) => (
            <div 
              key={role.id}
              className={`bg-[#18122B]/80 border border-[#a259ff]/20 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_5px_30px_rgba(162,89,255,0.15)] backdrop-blur-sm ${selectedRole === role.id ? 'ring-2 ring-[#00ffcc]' : ''}`}
              onClick={() => setSelectedRole(role.id === selectedRole ? null : role.id)}
            >
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{role.name}</h3>
              </div>
              <p className="text-gray-300 mb-4 text-sm">{role.description}</p>
              
              {selectedRole === role.id && (
                <div className="mt-4 animate-fadeIn">
                  <h4 className="text-md font-medium text-[#00ffcc] mb-2">Key Capabilities:</h4>
                  <ul className="pl-5 space-y-1">
                    {role.capabilities.map((capability, index) => (
                      <li key={index} className="text-gray-300 text-sm list-disc">
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Role Process Steps */}
              <div className="mt-4 pt-4 border-t border-[#a259ff]/10">
                <h4 className={`text-sm font-medium ${role.textColor} mb-2`}>Main Activities:</h4>
                <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                  {role.id === 'farmer' && (
                    <>
                      <li>Plants crops or raises livestock</li>
                      <li>Harvests products</li>
                      <li>Logs harvest data to blockchain</li>
                    </>
                  )}
                  {role.id === 'collector' && (
                    <>
                      <li>Collects from multiple sources</li>
                      <li>Performs quality assessment</li>
                      <li>Creates collection records</li>
                    </>
                  )}
                  {role.id === 'trader' && (
                    <>
                      <li>Facilitates market distribution</li>
                      <li>Arranges transportation</li>
                      <li>Records trade transactions</li>
                    </>
                  )}
                  {role.id === 'retailer' && (
                    <>
                      <li>Verifies product authenticity</li>
                      <li>Displays supply chain data</li>
                      <li>Markets verified products</li>
                    </>
                  )}
                  {role.id === 'consumer' && (
                    <>
                      <li>Scans product QR codes</li>
                      <li>Views complete product journey</li>
                      <li>Provides feedback & ratings</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-gray-400 mb-6">Ready to join the AgriChain ecosystem?</p>
          <a 
            href="/register" 
            className="inline-block px-6 py-3 rounded-lg text-black font-medium bg-gradient-to-r from-[#00ffcc] to-[#a259ff] hover:shadow-[0_0_20px_rgba(0,255,204,0.5)] transition-all duration-300"
          >
            Register Now
          </a>
        </div>
      </div>
    </div>
  );
}

{/* Add custom keyframes and animation delay classes */}
<style jsx>{`
  @keyframes flowAcross {
    0% { 
      transform: translate(0, -50%);
      opacity: 0; 
    }
    5% {
      opacity: 0.7;
    }
    90% {
      opacity: 0.7;
    }
    100% { 
      transform: translate(calc(100vw - 40px), -50%);
      opacity: 0; 
    }
  }
  
  .animation-delay-0 {
    animation-delay: 0s;
  }
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  .animation-delay-400 {
    animation-delay: 0.4s;
  }
  .animation-delay-500 {
    animation-delay: 0.5s;
  }
  .animation-delay-600 {
    animation-delay: 0.6s;
  }
  .animation-delay-800 {
    animation-delay: 0.8s;
  }
  .animation-delay-1000 {
    animation-delay: 1s;
  }
  .animation-delay-1200 {
    animation-delay: 1.2s;
  }
  .animation-delay-1500 {
    animation-delay: 1.5s;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  /* Fix for the animate-float delay and duration */
  .animate-float {
    animation: float var(--float-duration, 15s) ease-in-out infinite;
    animation-delay: var(--float-delay, 0s);
  }
  
  /* Moving light beam animation */
  @keyframes beam {
    0% { transform: translateX(-100%) skew-y-3; }
    100% { transform: translateX(100%) skew-y-3; }
  }
  
  .animate-beam {
    animation: beam 15s ease-in-out infinite;
  }

  .animation-fill-forwards {
    animation-fill-mode: forwards;
  }
`}</style> 