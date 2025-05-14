import { useEffect, useRef, useState } from "react";

interface ScrollRevealSectionProps {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "bottom";
}

export function ScrollRevealSection({ 
  children, 
  className, 
  direction = "bottom" 
}: ScrollRevealSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        rootMargin: "0px",
        threshold: 0.1,
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);
  
  // Calculate transform based on direction
  const getTransformStyle = () => {
    if (!isVisible) {
      switch (direction) {
        case "left": return "translateX(-100px)";
        case "right": return "translateX(100px)";
        case "bottom": return "translateY(100px)";
        default: return "translateY(100px)";
      }
    }
    return "translate(0)";
  };
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransformStyle(),
      }}
    >
      {children}
    </div>
  );
} 