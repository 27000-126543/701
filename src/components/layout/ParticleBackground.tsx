import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 15}s`;
      particle.style.animationDuration = `${15 + Math.random() * 10}s`;
      particle.style.opacity = `${0.3 + Math.random() * 0.5}`;
      particle.style.width = `${2 + Math.random() * 4}px`;
      particle.style.height = particle.style.width;
      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = '';
    };
  }, []);

  return (
    <div ref={containerRef} className="particle-bg bg-grid" />
  );
}
