import { useState, useEffect } from 'react';

interface AnimatedIconProps {
  children: React.ReactNode;
  colorClass: string;
}

export function AnimatedIcon({ children, colorClass }: AnimatedIconProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      className={`rounded-full p-4 transition-all duration-300 transform ${
        isHovering ? `${colorClass} scale-110` : 'bg-gray-800 scale-100'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
    </div>
  );
} 