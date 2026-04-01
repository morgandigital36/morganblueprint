'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface Dot {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  delay: number;
  glowId: string;
}

export function RiskProximityMap({ className }: { className?: string }) {
  // Config
  const center = { x: 400, y: 400 };
  const numRings = 12;
  const radiusStep = 32;
  const maxDotsPerRing = 18; // varying depending on radius

  // Generate background rings
  const rings = Array.from({ length: numRings }).map((_, i) => {
    return {
      r: (i + 1) * radiusStep + 40,
      opacity: 0.1 + (i / numRings) * 0.1, // faint to darker or just uniform
    };
  });

  // Generate random dots positioned on the rings
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    const generatedDots: Dot[] = [];
    const colors = [
      '#a855f7', // purple
      '#e879f9', // pink/magenta
      '#60a5fa', // blue
      '#2dd4bf', // teal/cyan
      '#ffffff', // white
    ];

    for (let i = 0; i < numRings; i++) {
        const ringRadius = (i + 1) * radiusStep + 40;
        // more dots on outer rings
        const numDots = Math.floor(Math.random() * (maxDotsPerRing - 3) + 3 + i * 1.5);
        
        for (let j = 0; j < numDots; j++) {
            // angle between 0 and 2PI
            const angle = (j * (Math.PI * 2) / numDots) + (Math.random() * 0.5 - 0.25);
            // small offset so they aren't perfectly aligned
            const cx = center.x + ringRadius * Math.cos(angle);
            const cy = center.y + ringRadius * Math.sin(angle);
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            generatedDots.push({
                id: `dot-${i}-${j}`,
                cx,
                cy,
                r: Math.random() > 0.8 ? 6 : 4, // Occasional large dot
                color,
                delay: (i * 0.1) + Math.random() * 0.2, // Outer rings delay more
                glowId: `glow-${color.replace('#', '')}`,
            });
        }
    }
    setDots(generatedDots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative w-full h-full min-h-[600px] flex items-center justify-center overflow-hidden", className)}>
        {/* Glow behind the chart */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
        
        <svg 
            width="800" 
            height="800" 
            viewBox="0 0 800 800" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xl"
        >
            <defs>
                {/* Glow Filters for dots */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                    <feMerge>
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Render Dashed Rings */}
            <g className="rings" style={{ transformOrigin: '400px 400px' }}>
                <motion.circle 
                    cx={center.x} cy={center.y} r={40} 
                    fill="#050510" stroke="rgba(255,255,255,0.05)" strokeWidth={1} 
                />
                
                {rings.map((ring, i) => (
                    <motion.circle
                        key={`ring-${i}`}
                        cx={center.x}
                        cy={center.y}
                        r={ring.r}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={1}
                        strokeDasharray="4 6"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, delay: i * 0.1, ease: 'easeOut' }}
                    />
                ))}
            </g>

            {/* Radial Lines (subtle) */}
            <g>
                {Array.from({length: 12}).map((_, i) => {
                    const angle = (i * Math.PI * 2) / 12;
                    const x2 = center.x + 380 * Math.cos(angle);
                    const y2 = center.y + 380 * Math.sin(angle);
                    return (
                        <motion.line 
                            key={`line-${i}`}
                            x1={center.x} y1={center.y} x2={x2} y2={y2}
                            stroke="rgba(255,255,255,0.02)"
                            strokeWidth={1}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 2, delay: 1 }}
                        />
                    )
                })}
            </g>

            {/* Render Dots */}
            <g className="dots">
                {dots.map(dot => (
                    <motion.circle
                        key={dot.id}
                        cx={dot.cx}
                        cy={dot.cy}
                        r={dot.r}
                        fill={dot.color}
                        filter="url(#glow)"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
                        transition={{ 
                            duration: 0.8, 
                            delay: dot.delay + 0.5,
                            scale: { type: "spring", damping: 10, stiffness: 100 }
                        }}
                        whileHover={{ scale: 2, opacity: 1, cursor: 'pointer' }}
                    />
                ))}
            </g>

            {/* Center Content Group inside SVG to keep text crisp and centered */}
            <g>
                 {/* Dark Circle overlay to hide lines dropping directly to center */}
                 <circle cx={center.x} cy={center.y} r={80} fill="#050510" className="drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" />
                 
                 <text x={center.x} y={center.y - 10} textAnchor="middle" fill="#ffffff" className="font-sans font-light tracking-tight text-6xl" dominantBaseline="middle">
                     157
                 </text>
                 <text x={center.x} y={center.y + 40} textAnchor="middle" fill="#94a3b8" className="font-sans font-medium tracking-widest text-sm uppercase" dominantBaseline="middle">
                     Critical Assets
                 </text>
            </g>
        </svg>
    </div>
  );
}
