import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { Player } from './components/Player';
import { World } from './components/World';
import { Inventory } from './components/Inventory';
import { TouchControls } from './components/TouchControls';
import { TerrainGenerator } from './components/TerrainGenerator';
import { Mobs } from './components/Mobs';
import { useEffect } from 'react';
import { useStore } from './store';

export default function App() {
  const setIsTouch = useStore((state) => state.setIsTouch);
  const isTouch = useStore((state) => state.isTouch);
  const gameMode = useStore((state) => state.gameMode);
  const setGameMode = useStore((state) => state.setGameMode);
  const worldLoaded = useStore((state) => state.worldLoaded);

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouch(true);
    }
  }, [setIsTouch]);

  if (!gameMode) {
    return (
      <div className="w-full h-screen bg-sky-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'64\' height=\'64\' viewBox=\'0 0 64 64\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.813-14.363c3.184-3.184 8.346-3.184 11.53 0 3.184 3.184 3.184 8.346 0 11.53l-19.092 19.092c-3.184 3.184-8.346 3.184-11.53 0-3.184-3.184-3.184-8.346 0-11.53l19.092-19.092zm-9.408 9.408c-1.592-1.592-4.173-1.592-5.765 0-1.592 1.592-1.592 4.173 0 5.765l19.092 19.092c1.592 1.592 4.173 1.592 5.765 0 1.592-1.592 1.592-4.173 0-5.765l-19.092-19.092zm-20.5 20.5c-1.592-1.592-4.173-1.592-5.765 0-1.592 1.592-1.592 4.173 0 5.765l19.092 19.092c1.592 1.592 4.173 1.592 5.765 0 1.592-1.592 1.592-4.173 0-5.765l-19.092-19.092z\' fill=\'%23ffffff\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }} />
        
        <h1 className="text-white text-5xl md:text-7xl font-bold mb-12 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-10 text-center px-4">
          MINECRAFT CLONE
        </h1>
        
        <div className="flex flex-col md:flex-row gap-6 z-10">
          <button 
            onClick={() => setGameMode('survival')} 
            className="bg-green-600 hover:bg-green-500 text-white text-2xl font-bold py-4 px-12 border-b-8 border-green-800 hover:border-green-700 rounded-sm transition-all active:border-b-0 active:translate-y-2"
          >
            Survival
          </button>
          <button 
            onClick={() => setGameMode('creative')} 
            className="bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-4 px-12 border-b-8 border-blue-800 hover:border-blue-700 rounded-sm transition-all active:border-b-0 active:translate-y-2"
          >
            Creative
          </button>
        </div>
        <p className="text-gray-300 mt-12 z-10 text-center max-w-md px-4">
          <strong>Survival:</strong> Health, hunger, hostile mobs, and limited resources.<br/><br/>
          <strong>Creative:</strong> Infinite items, flying (double jump), no damage, instant break.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-screen relative bg-sky-300 overflow-hidden" 
      id="game-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      <TerrainGenerator />
      <Canvas 
        camera={{ fov: 75 }} 
        shadows={!isTouch} 
        dpr={isTouch ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        gl={{ antialias: !isTouch, powerPreference: 'high-performance' }}
      >
        <Sky sunPosition={[100, 20, 100]} />
        {worldLoaded && (
          <Physics gravity={[0, -30, 0]} paused={false}>
            <Player />
            <World />
            <Mobs />
          </Physics>
        )}
      </Canvas>
      <Inventory />
      <TouchControls />
    </div>
  );
}
