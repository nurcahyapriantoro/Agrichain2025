import { useState, useEffect } from 'react';

export function ScrollFollowingAnimation() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mouseBalls, setMouseBalls] = useState<Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    delay: number;
  }>>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    // Mark as hydrated to trigger client-side only animations
    setIsHydrated(true);
    
    // Set initial window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Generate initial balls with random properties
    const initialBalls = Array.from({ length: 15 }, (_, i) => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      size: Math.random() * 12 + 8,
      color: i % 3 === 0 ? '#00ffcc' : (i % 3 === 1 ? '#a259ff' : '#2d8fff'),
      opacity: Math.random() * 0.5 + 0.3,
      delay: i * 50
    }));
    
    setMouseBalls(initialBalls);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Update mouse balls position with delay
  useEffect(() => {
    if (!isHydrated) return;
    
    const interval = setInterval(() => {
      setMouseBalls(prev => prev.map((ball, i) => {
        // Calculate a delayed position based on the mouse position
        const delayFactor = ball.delay / 500;
        const diffX = mousePos.x - ball.x;
        const diffY = mousePos.y - ball.y;
        
        return {
          ...ball,
          x: ball.x + (diffX * (0.1 + (i % 3) * 0.05)),
          y: ball.y + (diffY * (0.1 + (i % 3) * 0.05))
        };
      }));
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [mousePos, isHydrated]);

  if (!isHydrated) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      {/* Mouse following balls */}
      {mouseBalls.map((ball, i) => (
        <div
          key={`ball-${i}`}
          className="absolute rounded-full blur-sm transition-opacity duration-500"
          style={{
            width: `${ball.size}px`,
            height: `${ball.size}px`,
            left: `${ball.x}px`,
            top: `${ball.y}px`,
            background: ball.color,
            opacity: ball.opacity,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
}
 