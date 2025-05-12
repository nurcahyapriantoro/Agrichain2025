import { useEffect, useState } from 'react';

export function SupplyChainAnimation() {
  const [animationReady, setAnimationReady] = useState(false);

  // Wait for hydration to complete before showing random animations
  useEffect(() => {
    setAnimationReady(true);
  }, []);

  return (
    <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
      {/* Network nodes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div 
          key={`node-${i}`}
          className="absolute rounded-full bg-[#00ffcc] shadow-[0_0_10px_rgba(0,255,204,0.8)]"
          style={{
            width: i % 3 === 0 ? '12px' : '8px',
            height: i % 3 === 0 ? '12px' : '8px',
            left: `${15 + (i * 10)}%`,
            top: `${35 + ((i % 4) * 15)}%`,
            opacity: 0.7,
          }}
        />
      ))}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={`path-${i}`}
            d={`M ${130 + (i * 80)} ${350 + ((i % 4) * 50)} Q ${180 + (i * 90)} ${300 + (i * 20)} ${280 + (i * 70)} ${380 + ((i % 3) * 60)}`}
            stroke={i % 2 === 0 ? '#00ffcc' : '#a259ff'}
            strokeWidth="1"
            fill="none"
            strokeDasharray="5,5"
            opacity="0.3"
            className="animate-dash"
            style={{ animationDelay: animationReady ? `${i * 0.5}s` : '0s' }}
          />
        ))}
      </svg>
      
      {/* Product boxes floating through the chain */}
      {animationReady && Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`product-${i}`}
          className="absolute w-5 h-5 shadow-md"
          style={{
            background: i % 2 === 0 ? '#00ffcc' : '#a259ff',
            borderColor: i % 2 === 0 ? '#00ffcc' : '#a259ff',
            left: `${100 + (i * 150) % 800}px`,
            top: `${300 + (i * 100) % 400}px`,
            animation: `flowAlongPath${(i % 4) + 1} ${20 + i * 2}s linear infinite`,
            animationDelay: `${i * 3}s`,
            opacity: 0.5,
          }}
        ></div>
      ))}
    </div>
  );
} 