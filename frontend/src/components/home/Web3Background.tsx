import { useEffect, useState } from 'react';

export function Web3Background() {
  const [particles, setParticles] = useState<Array<{
    left: string;
    top: string;
    width: string;
    height: string;
    background: string;
  }>>([]);
  
  // Generate particles only on client-side to avoid hydration mismatch
  useEffect(() => {
    // Use deterministic position for initial render to avoid hydration issues
    const generatedParticles = Array.from({ length: 30 }, (_, i) => ({
      // Generate positions using the index to ensure consistency between server and client
      left: `${(i * 3.33) % 100}%`,
      top: `${(i * 3.33 + 1.5) % 100}%`,
      width: `${4 + (i % 8)}px`,
      height: `${4 + (i % 8)}px`,
      background: 'linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)'
    }));
    
    setParticles(generatedParticles);
    
    // After hydration completes, we can set random positions safely
    const timer = setTimeout(() => {
      const randomParticles = Array.from({ length: 30 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 8 + 4}px`,
        height: `${Math.random() * 8 + 4}px`,
        background: 'linear-gradient(135deg, #a259ff, #00ffcc, #00bfff)'
      }));
      setParticles(randomParticles);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] animate-gradient-move">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((pos, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: pos.left,
              top: pos.top,
              width: pos.width,
              height: pos.height,
              background: pos.background
            }}
          />
        ))}
      </div>
    </div>
  );
} 