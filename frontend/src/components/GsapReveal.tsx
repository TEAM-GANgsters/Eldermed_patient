
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface GsapRevealProps {
  children: React.ReactNode;
  animation?: "fade" | "slide" | "scale";
  delay?: number;
  duration?: number;
  className?: string;
}

const GsapReveal = ({ 
  children, 
  animation = "fade", 
  delay = 0, 
  duration = 0.5, 
  className 
}: GsapRevealProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Set initial state
    gsap.set(element, { 
      autoAlpha: 0,
      y: animation === "slide" ? 20 : 0,
      scale: animation === "scale" ? 0.95 : 1
    });
    
    // Animate in
    gsap.to(element, {
      duration,
      delay,
      autoAlpha: 1,
      y: 0,
      scale: 1,
      ease: "power2.out",
      clearProps: "all"
    });
    
    return () => {
      gsap.killTweensOf(element);
    };
  }, [animation, delay, duration]);
  
  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default GsapReveal;
