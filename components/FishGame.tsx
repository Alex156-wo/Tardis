
import React, { useEffect, useRef, useState } from 'react';

interface FishGameProps {
  onGameEvent: (event: string) => void;
  onClose: () => void;
}

interface Fish {
  id: number;
  x: number;
  y: number;
  level: number;
  size: number;
  speed: number;
  direction: 1 | -1; // 1 = right, -1 = left
  color: string;
}

const LEVELS = [
  { size: 10, color: '#4ade80', name: 'Plankton' },    // Lvl 1: Green
  { size: 18, color: '#60a5fa', name: 'Minnow' },      // Lvl 2: Blue
  { size: 28, color: '#c084fc', name: 'Trout' },       // Lvl 3: Purple
  { size: 40, color: '#facc15', name: 'Bass' },        // Lvl 4: Yellow
  { size: 55, color: '#fb923c', name: 'Shark' },       // Lvl 5: Orange
  { size: 75, color: '#f87171', name: 'Whale' },       // Lvl 6: Red
  { size: 100, color: '#e2e8f0', name: 'Leviathan' },  // Lvl 7: White
];

export const FishGame: React.FC<FishGameProps> = ({ onGameEvent, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game State Refs (mutable for loop)
  const playerRef = useRef({ x: 0, y: 0, level: 0, exp: 0 });
  const enemiesRef = useRef<Fish[]>([]);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initial Position
    playerRef.current = { 
        x: canvas.width / 2, 
        y: canvas.height / 2, 
        level: 0, 
        exp: 0 
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnEnemy = () => {
      const level = Math.floor(Math.random() * 7); // Random level 0-6
      // Bias towards player level or +1 to keep it fair but challenging
      // Simple logic: pure random is fine for chaos
      
      const isLeft = Math.random() > 0.5;
      const y = Math.random() * canvas.height;
      const enemy: Fish = {
        id: Date.now() + Math.random(),
        x: isLeft ? -100 : canvas.width + 100,
        y: y,
        level: level,
        size: LEVELS[level].size,
        speed: (Math.random() * 2 + 1) * (isLeft ? 1 : -1),
        direction: isLeft ? 1 : -1,
        color: LEVELS[level].color
      };
      enemiesRef.current.push(enemy);
    };

    const update = (time: number) => {
      if (!gameStarted || gameOver) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Spawn Logic
      if (time - lastSpawnRef.current > 1000) { // Spawn every 1s roughly
         if (Math.random() > 0.3) spawnEnemy();
         lastSpawnRef.current = time;
      }

      // Draw Player
      const p = playerRef.current;
      const pConfig = LEVELS[p.level];
      ctx.fillStyle = pConfig.color;
      ctx.beginPath();
      // Simple fish shape
      ctx.ellipse(p.x, p.y, pConfig.size, pConfig.size / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(p.x + (10), p.y - 5, pConfig.size / 5, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(`LVL ${p.level + 1}`, p.x - 10, p.y - pConfig.size / 2 - 5);


      // Update & Draw Enemies
      enemiesRef.current.forEach((e, index) => {
        e.x += e.speed;
        
        // Draw
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.size, e.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye (direction based)
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(e.x + (e.direction * e.size * 0.4), e.y - e.size * 0.2, e.size / 5, 0, Math.PI * 2);
        ctx.fill();

        // Collision
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < pConfig.size + e.size * 0.5) {
            // HIT
            if (p.level >= e.level) {
                // EAT
                enemiesRef.current.splice(index, 1);
                p.exp += (e.level + 1) * 10;
                setScore(s => s + (e.level + 1) * 100);
                onGameEvent(`I just ate a ${LEVELS[e.level].name}! Tasty.`);
                
                // Level Up Check
                if (p.exp > (p.level + 1) * 50 && p.level < 6) {
                    p.level++;
                    p.exp = 0;
                    setPlayerLevel(p.level);
                    onGameEvent(`I leveled up! I am now a Level ${p.level + 1} ${LEVELS[p.level].name}!`);
                }
            } else {
                // DIE
                setGameOver(true);
                onGameEvent(`I just got eaten by a ${LEVELS[e.level].name}! Game Over.`);
            }
        }
      });

      // Cleanup off-screen
      enemiesRef.current = enemiesRef.current.filter(e => e.x > -200 && e.x < canvas.width + 200);

      frameRef.current = requestAnimationFrame(update);
    };

    const loop = (time: number) => update(time);
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, [gameStarted, gameOver]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current || gameOver) return;
    const rect = canvasRef.current.getBoundingClientRect();
    playerRef.current.x = e.clientX - rect.left;
    playerRef.current.y = e.clientY - rect.top;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in">
        <div className="relative border-4 border-cyan-500 rounded-lg overflow-hidden bg-gray-900 cursor-none">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseMove={handleMouseMove}
                className="block"
            />
            
            {/* HUD */}
            <div className="absolute top-4 left-4 text-white font-mono text-xl drop-shadow-md">
                SCORE: {score} | LEVEL: {playerLevel + 1} ({LEVELS[playerLevel].name})
            </div>

            {/* START SCREEN */}
            {!gameStarted && !gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                    <h2 className="text-4xl font-['Audiowide'] text-cyan-400 mb-4">BIG FISH EAT SMALL</h2>
                    <p className="text-cyan-200 mb-8 max-w-md text-center">Move your mouse to swim. Eat smaller fish (Green/Blue). Avoid bigger fish.</p>
                    <button 
                        onClick={() => { setGameStarted(true); onGameEvent("I am starting the game now! Wish me luck."); }}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                    >
                        START SWIMMING
                    </button>
                    <button onClick={onClose} className="mt-4 text-gray-400 hover:text-white underline">Exit</button>
                </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80">
                    <h2 className="text-5xl font-['Audiowide'] text-white mb-4">GAME OVER</h2>
                    <p className="text-xl text-white mb-6">Final Score: {score}</p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => { 
                                setGameOver(false); 
                                setScore(0); 
                                setPlayerLevel(0); 
                                playerRef.current = { x: 400, y: 300, level: 0, exp: 0 }; 
                                enemiesRef.current = []; 
                                onGameEvent("I am retrying the game! One more time!");
                            }}
                            className="px-6 py-2 bg-white text-red-900 font-bold rounded hover:scale-105 transition-all"
                        >
                            TRY AGAIN
                        </button>
                        <button onClick={onClose} className="px-6 py-2 border border-white text-white font-bold rounded hover:bg-white/10">
                            EXIT
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
