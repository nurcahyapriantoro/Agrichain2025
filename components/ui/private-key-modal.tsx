"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { ShieldCheck, Copy, Eye, EyeOff, Lock, AlertTriangle, Sparkles, ShieldAlert, Fingerprint, KeyRound, Wallet, Shield } from 'lucide-react';

interface PrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  privateKey: string;
}

export function PrivateKeyModal({ isOpen, onClose, privateKey }: PrivateKeyModalProps) {
  console.log('PrivateKeyModal rendered with:', { isOpen, privateKey });
  const [isCopied, setIsCopied] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [keyParts, setKeyParts] = useState<string[]>([]);
  const [particles, setParticles] = useState<{x: number, y: number, size: number, speed: number, color: string}[]>([]);
  const [hexagons, setHexagons] = useState<{x: number, y: number, size: number, rotation: number, opacity: number}[]>([]);
  const [hoverEffect, setHoverEffect] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate random particles for background effect
  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 40 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        color: Math.random() > 0.6 
          ? '#10B981' // Green
          : Math.random() > 0.5 
            ? '#8B5CF6' // Purple
            : '#6EE7B7' // Light green
      }));
      setParticles(newParticles);

      // Generate hexagons for cyber effect
      const newHexagons = Array.from({ length: 15 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 60 + 30,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.2 + 0.05
      }));
      setHexagons(newHexagons);
    }
  }, [isOpen]);

  // Auto-close the modal after 60 seconds for security
  useEffect(() => {
    console.log('PrivateKeyModal useEffect triggered:', { isOpen, privateKey });
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    // Segment the key for animated reveal
    if (privateKey) {
      console.log('Segmenting private key:', privateKey);
      const parts = privateKey.match(/.{1,16}/g) || [];
      console.log('Key parts:', parts);
      setKeyParts(parts);
    }
    
    return () => {
      clearInterval(timer);
      setTimeRemaining(60);
      setIsKeyVisible(false);
    };
  }, [isOpen, privateKey]);

  // Separate effect to handle when timer reaches zero
  useEffect(() => {
    if (timeRemaining === 0 && isOpen) {
      onClose();
    }
  }, [timeRemaining, onClose, isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(privateKey);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleKeyVisibility = () => {
    setIsKeyVisible(!isKeyVisible);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 backdrop-blur-lg" ref={containerRef}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-90">
            {/* Background grid pattern */}
            <div className="absolute inset-0 opacity-20 bg-grid-pattern"></div>
            
            {/* Animated futuristic hexagons */}
            {hexagons.map((hexagon, index) => (
              <div 
                key={`hex-${index}`}
                className="absolute opacity-10 animate-spin-slow"
                style={{
                  left: `${hexagon.x}%`,
                  top: `${hexagon.y}%`,
                  width: `${hexagon.size}px`,
                  height: `${hexagon.size}px`,
                  transform: `rotate(${hexagon.rotation}deg)`,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill='%238B5CF6' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  opacity: hexagon.opacity,
                  animationDuration: `${60 + Math.random() * 60}s`,
                  animationDirection: index % 2 === 0 ? 'normal' : 'reverse'
                }}
              ></div>
            ))}
            
            {/* Animated particles */}
            {particles.map((particle, index) => (
              <div 
                key={`particle-${index}`}
                className="absolute rounded-full animate-float"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  opacity: 0.6,
                  filter: 'blur(1px)',
                  animationDuration: `${particle.speed * 10}s`,
                  animationDelay: `${index * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-gray-900 rounded-xl text-left overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.3)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-2 border-purple-500 animate-fadeIn relative">
          {/* Moving cyber border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-purple-500 to-green-400 animate-gradient-move"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-purple-500 to-green-500 animate-gradient-move"></div>
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-green-500 via-purple-500 to-green-400 animate-gradient-move"></div>
            <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-green-400 via-purple-500 to-green-500 animate-gradient-move"></div>
          </div>
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-between relative overflow-hidden border-b border-purple-900/30">
            {/* Animated bg pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, #8B5CF6 0, #8B5CF6 1px, transparent 0, transparent 50%)',
                backgroundSize: '10px 10px',
                animation: 'slideBackground 15s linear infinite'
              }}></div>
            </div>
            
            <div className="flex items-center z-10">
              <div 
                className="relative mr-3 bg-gradient-to-br from-purple-600 to-green-500 p-2 rounded-lg shadow-lg animate-pulse-slow"
                style={{animationDuration: '3s'}}
              >
                <ShieldAlert className="h-6 w-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-purple-500 rounded-lg filter blur-md opacity-50"></div>
              </div>
              <h3 className="text-xl font-bold leading-6 text-white animate-text-shadow">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-green-400 animate-gradient-move">
                  Secure Private Key Access
                </span>
              </h3>
            </div>
            <div className="flex items-center text-sm text-red-400">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2 shadow-[0_0_10px_rgba(239,68,68,0.7)]"></div>
              <span className="text-white">Session expires in <span className="font-mono font-bold text-red-400">{timeRemaining}s</span></span>
            </div>
          </div>
          
          <div className="px-6 py-5 bg-gradient-to-b from-gray-900 to-gray-800">
            {/* Security Banner with glow effect */}
            <div 
              className="bg-gradient-to-r from-purple-900/40 to-green-900/40 border border-purple-500/50 rounded-xl p-5 mb-6 flex items-start relative shadow-[0_0_20px_rgba(139,92,246,0.2)] overflow-hidden"
              onMouseEnter={() => setHoverEffect(true)}
              onMouseLeave={() => setHoverEffect(false)}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-purple-600/10 to-green-600/10"></div>
              
              {/* Animated cyber circles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute h-40 w-40 rounded-full border border-purple-500/20 transition-all duration-700 ${hoverEffect ? 'opacity-100' : 'opacity-0'}`} style={{left: '10%', top: '50%', transform: 'scale(0.8) translate(-50%, -50%)'}}></div>
                <div className={`absolute h-60 w-60 rounded-full border border-green-500/20 transition-all duration-700 ${hoverEffect ? 'opacity-100' : 'opacity-0'}`} style={{left: '10%', top: '50%', transform: 'scale(1.2) translate(-50%, -50%)', transitionDelay: '100ms'}}></div>
                <div className={`absolute h-80 w-80 rounded-full border border-purple-500/20 transition-all duration-700 ${hoverEffect ? 'opacity-100' : 'opacity-0'}`} style={{left: '10%', top: '50%', transform: 'scale(1.6) translate(-50%, -50%)', transitionDelay: '200ms'}}></div>
              </div>
              
              <div 
                className="bg-gradient-to-br from-purple-900 to-green-900 rounded-full p-3 mr-4 mt-1 shadow-[0_0_15px_rgba(139,92,246,0.4)] relative flex-shrink-0"
              >
                <Lock className="h-5 w-5 text-white relative z-10" />
                <div className="absolute inset-0 rounded-full animate-ping bg-purple-500 opacity-20"></div>
              </div>
              <div className="relative z-10 flex-1">
                <p className="text-sm text-white font-medium flex items-center mb-1">
                  <Sparkles className="h-4 w-4 mr-1.5 text-purple-400" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-400">
                    Secure Environment Active
                  </span>
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  This key is being displayed in a secure environment. Always ensure you're in a private location when viewing sensitive information.
                </p>
              </div>
              <div className="w-16 h-16 relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-green-600/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-white opacity-80" />
                </div>
              </div>
            </div>
            
            {/* Key Display with cyber pattern */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl relative border border-purple-900/50 mb-6 shadow-inner overflow-hidden">
              {/* Cyber background pattern */}
              <div className="absolute inset-0 opacity-10" style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill='%238B5CF6' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '50px 50px',
                backgroundPosition: 'center'
              }}></div>
              
              {/* Interactive progress bar */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gray-700 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 via-purple-500 to-green-400 transition-all duration-1000 ease-linear animate-gradient-move" 
                  style={{ width: `${(timeRemaining / 60) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]"></div>
                  <p className="text-xs font-mono uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-green-400 animate-text-shadow font-bold">BLOCKCHAIN PRIVATE KEY</p>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleKeyVisibility}
                  className="text-xs flex items-center text-gray-300 hover:text-white hover:bg-purple-700/30 transition-all relative z-20 py-1.5 px-3 bg-black rounded-md border border-purple-700/50 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {isKeyVisible ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1 text-purple-400" /> Hide Key
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1 text-purple-400" /> Reveal Key
                    </>
                  )}
                </Button>
              </div>
              
              <div className="font-mono text-sm break-all overflow-x-auto space-y-2 relative">
                {isKeyVisible ? (
                  <div className="relative z-10">
                    {keyParts.map((part, index) => (
                      <div 
                        key={index}
                        className="transition-all duration-500 bg-gradient-to-r from-purple-900/20 to-green-900/20 border border-purple-900/30 p-2 rounded animate-fadeInSlide mb-1 text-green-300" 
                        style={{ 
                          animationDelay: `${index * 150}ms`,
                          opacity: 1,
                          transform: 'translateY(0)',
                          textShadow: '0 0 5px rgba(139, 92, 246, 0.3)'
                        }}
                      >
                        {part}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="w-full py-2 text-purple-600/60">
                        {'• '.repeat(32)}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Scanner effect */}
                <div 
                  className={`absolute left-0 right-0 h-12 pointer-events-none ${isKeyVisible ? 'animate-scanline' : 'opacity-0'}`} 
                  style={{
                    background: 'linear-gradient(to bottom, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(139, 92, 246, 0) 100%)',
                    top: '0%'
                  }}
                ></div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className={`text-xs flex items-center border-purple-800 text-purple-400 hover:bg-purple-800/30 relative overflow-hidden group ${isCopied ? 'bg-purple-900/30' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {isCopied ? (
                    <span className="animate-fadeIn relative z-10">Copied to clipboard!</span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5 text-green-400" /> 
                      <span className="relative z-10">Copy to clipboard</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Warning Box with red glow */}
            <div className="bg-gradient-to-r from-red-900/20 to-black/40 p-5 border border-red-800 rounded-xl mb-6 shadow-[0_0_15px_rgba(239,68,68,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-red-800 to-transparent"></div>
              <div className="flex items-start relative z-10">
                <div className="relative mr-4 flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
                  <div className="absolute inset-0 bg-red-500 filter blur-md opacity-40 animate-pulse rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-500 mb-2 flex items-center">
                    <span className="animate-text-shadow">Critical Security Warning:</span>
                  </p>
                  <ul className="space-y-2 text-xs text-red-400">
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 mt-1.5"></div>
                      <span>This key grants complete control of your blockchain assets</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 mt-1.5"></div>
                      <span>Never share this key with anyone under any circumstances</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 mt-1.5"></div>
                      <span>Store securely in an encrypted password manager</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 mt-1.5"></div>
                      <span>If compromised, transfer assets to a new wallet immediately</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 mt-1.5"></div>
                      <span>Check your surroundings before proceeding</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500 flex items-center">
                <Fingerprint className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
                <span className="opacity-80">Key accessed at {new Date().toLocaleTimeString()}</span>
              </p>
              <Button
                type="button"
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] relative overflow-hidden group py-1.5 rounded-lg border border-purple-500/50"
              >
                <span className="relative z-10 font-medium px-2">Close Securely</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 