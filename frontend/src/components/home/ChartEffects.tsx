import { useEffect, useState } from 'react';

export function ChartEffects() {
  const [data, setData] = useState<Array<{ name: string; value: number }>>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
    
    // Generate random data
    const randomData = Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 100)
    }));
    
    setData(randomData);
    
    // Change data every 5 seconds
    const interval = setInterval(() => {
      setData(prev => 
        prev.map(item => ({
          ...item,
          value: Math.floor(Math.random() * 100)
        }))
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isHydrated) return null;
  
  return (
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      {/* Chart-like decorative elements */}
      <div className="absolute left-10 top-1/3 h-32 w-64">
        {data.map((item, i) => (
          <div 
            key={i}
            className="absolute bottom-0 bg-gradient-to-t from-emerald-400 to-cyan-500 rounded-t"
            style={{
              left: `${i * 9}px`,
              height: `${item.value * 0.3}px`,
              width: '5px',
              transition: 'height 1s ease'
            }}
          />
        ))}
      </div>
      
      {/* Line graph decoration on right side */}
      <div className="absolute right-10 top-1/2 w-64 h-32">
        <svg width="100%" height="100%" viewBox="0 0 100 40">
          <path
            d={`M 0,${40 - data[0]?.value * 0.4 || 20} ${data.map((item, i) => `L ${i * 16},${40 - item.value * 0.4}`).join(' ')}`}
            fill="none"
            stroke="#00ffcc"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeDasharray="1,1"
          />
          <path
            d={`M 0,${40 - (data[0]?.value * 0.4 + 10) || 30} ${data.map((item, i) => `L ${i * 16},${40 - (item.value * 0.4 + 10)}`).join(' ')}`}
            fill="none"
            stroke="#a259ff"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeDasharray="1,1"
          />
        </svg>
      </div>
      
      {/* Dots in lower right */}
      <div className="absolute right-20 bottom-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 5)}px`,
              height: `${2 + (i % 5)}px`,
              left: `${(i % 10) * 15}px`,
              top: `${Math.floor(i / 10) * 15}px`,
              background: i % 3 === 0 ? '#00ffcc' : (i % 3 === 1 ? '#a259ff' : '#2d8fff'),
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
} 