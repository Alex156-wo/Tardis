
import React, { useEffect, useRef } from 'react';
import { Particle } from '../types';
import { PARTICLE_GOLD, PARTICLE_BLUE } from '../constants';

interface ParticleVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  isGlitching: boolean; // New prop for instability
}

const PARTICLE_COUNT = 1600; 
const RADIUS = 350; 

const ParticleVisualizer: React.FC<ParticleVisualizerProps> = ({ analyser, isActive, isGlitching }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Distribute more evenly but denser in the center
      const r = Math.sqrt(Math.random()) * RADIUS; 
      
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      const isGold = Math.random() > 0.6; // Slightly more blue than gold

      newParticles.push({
        x: x,
        y: y,
        baseX: x,
        baseY: y,
        size: Math.random() * 1.5 + 0.2, // Slightly larger for petals
        color: isGold ? PARTICLE_GOLD : PARTICLE_BLUE,
        vx: 0,
        vy: 0,
        rotation: Math.random() * Math.PI * 2, // Random rotation for petals
      });
    }
    particlesRef.current = newParticles;
  }, []);

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      const margin = 20;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Use screen blending for "glowing nebula" effect
      ctx.globalCompositeOperation = 'screen';

      // Get audio data
      let audioValue = 0;
      if (analyser && isActive) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        const slice = Math.floor(bufferLength / 2); 
        for (let i = 0; i < slice; i++) {
          sum += dataArray[i];
        }
        audioValue = sum / slice;
      }

      // Physics params
      const expansionForce = audioValue * 0.08; 
      const returnSpeed = 0.03; 
      const petals = 5; // Number of petals for the flower shape

      particlesRef.current.forEach(p => {
        // Glitch Logic: Randomly displace or hide particles
        if (isGlitching && Math.random() > 0.8) {
           p.x += (Math.random() - 0.5) * 50;
           p.y += (Math.random() - 0.5) * 50;
           return; // Skip drawing some frames for flicker
        }

        // Distance from center
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (isActive && audioValue > 5) {
            // FLOWER/PETAL TRAJECTORY MATH
            // Modulate the expansion force using a cosine function of the angle
            // Rose curve equation-ish: r = cos(k * theta)
            // We use absolute to make full petals, + 0.5 so it doesn't shrink to zero
            const petalShape = Math.abs(Math.cos(petals * angle * 0.5)) + 0.2;
            
            // Apply force modulated by petal shape
            const force = expansionForce * petalShape * (1 - dist / (width * 0.8));
            
            p.vx += Math.cos(angle) * force;
            p.vy += Math.sin(angle) * force;
            
            // Rotate individual petals slightly with audio intensity
            p.rotation += 0.05 + (force * 0.01); 
        } else {
            // Idle Vortex Drift
            if (isActive) {
               const rotSpeed = 0.003; 
               const oldX = p.x - centerX;
               const oldY = p.y - centerY;
               p.x = centerX + (oldX * Math.cos(rotSpeed) - oldY * Math.sin(rotSpeed));
               p.y = centerY + (oldX * Math.sin(rotSpeed) + oldY * Math.cos(rotSpeed));
               p.rotation += 0.01;
            } else {
               // Idle breathing
               p.x += Math.sin(Date.now() * 0.0005 + p.baseY) * 0.05;
               p.y += Math.cos(Date.now() * 0.0005 + p.baseX) * 0.05;
            }
        }

        // Elasticity (Return to base)
        const dbx = p.baseX - p.x;
        const dby = p.baseY - p.y;
        
        p.vx += dbx * returnSpeed;
        p.vy += dby * returnSpeed;

        // Friction
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Apply velocity
        p.x += p.vx;
        p.y += p.vy;

        // --- BOUNDARY CHECK ---
        if (p.x < margin) { p.x = margin; p.vx *= -0.5; }
        if (p.x > width - margin) { p.x = width - margin; p.vx *= -0.5; }
        if (p.y < margin) { p.y = margin; p.vy *= -0.5; }
        if (p.y > height - margin) { p.y = height - margin; p.vy *= -0.5; }

        // Draw Petal Shape
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        // Ellipse arguments: x, y, radiusX, radiusY, rotation, startAngle, endAngle
        ctx.ellipse(0, 0, p.size * 3, p.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        
        // Dynamic Opacity
        const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        const alpha = Math.min(0.9, 0.2 + speed * 0.15 + audioValue/500);
        
        ctx.globalAlpha = isGlitching ? Math.random() * alpha : alpha;
        ctx.fill();
        ctx.restore();
      });

      // Draw Time Rotor (Center Column) with Glitch
      if (isActive) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = isGlitching ? Math.random() : 1; // Flicker center
          
          const coreHeight = 150 + audioValue * 0.5; 
          
          // Outer Glow
          const gradient = ctx.createLinearGradient(centerX, centerY - coreHeight/2, centerX, centerY + coreHeight/2);
          gradient.addColorStop(0, "rgba(0, 191, 255, 0)");
          gradient.addColorStop(0.5, `rgba(255, 215, 0, ${Math.min(0.15, audioValue / 300)})`); 
          gradient.addColorStop(1, "rgba(0, 191, 255, 0)");
          
          ctx.fillStyle = gradient;
          ctx.fillRect(centerX - 15, centerY - coreHeight/2, 30, coreHeight);
          
          // Inner bright core
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5, audioValue / 200)})`;
          ctx.fillRect(centerX - 1, centerY - coreHeight/4, 2, coreHeight/2);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive, isGlitching]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1000} 
      height={800} 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 scale-100 md:scale-110"
    />
  );
};

export default ParticleVisualizer;
