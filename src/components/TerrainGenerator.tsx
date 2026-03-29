import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { createNoise2D } from 'simplex-noise';

export function TerrainGenerator() {
  const setBlocks = useStore((state) => state.setBlocks);
  const gameMode = useStore((state) => state.gameMode);
  const setWorldLoaded = useStore((state) => state.setWorldLoaded);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameMode) return;

    const generateTerrain = () => {
      const noise2D = createNoise2D();
      const caveNoise = createNoise2D();
      const blocks: Record<string, any> = {};
      
      // Safari (özellikle iOS) çok katı RAM sınırlarına sahiptir (sekme başına ~1GB).
      // Çökmeleri (crash) tamamen önlemek için dünya boyutu 64x64 olarak optimize edildi.
      const width = 64;
      const depth = 64;

      for (let x = -width / 2; x < width / 2; x++) {
        for (let z = -depth / 2; z < depth / 2; z++) {
          const surfaceY = Math.floor(noise2D(x * 0.03, z * 0.03) * 6);
          
          // Ravines (Maden çukurları)
          const isRavine = Math.abs(caveNoise(x * 0.02, z * 0.02)) < 0.08;
          const bottomY = isRavine ? surfaceY - 10 : surfaceY - 4;

          for (let y = bottomY; y <= surfaceY; y++) {
            // 3D Cave noise simulation
            const isCave = caveNoise(x * 0.1, y * 0.1 + z * 0.1) > 0.4;
            if (isCave && y < surfaceY - 1) continue;

            let type = 'stone';
            if (y === surfaceY && !isRavine) type = 'grass';
            else if (y >= surfaceY - 3 && !isRavine) type = 'dirt';
            else {
              const r = Math.random();
              if (r < 0.005) type = 'diamond_ore';
              else if (r < 0.015) type = 'gold_ore';
              else if (r < 0.04) type = 'iron_ore';
              else if (r < 0.06) type = 'copper_ore';
              else if (r < 0.09) type = 'coal_ore';
            }

            blocks[`${x},${y},${z}`] = { id: `${x},${y},${z}`, pos: [x, y, z], type };
          }

          // Trees (only on grass, not in ravines)
          if (!isRavine && Math.random() < 0.02 && x > -width/2 + 2 && x < width/2 - 2 && z > -depth/2 + 2 && z < depth/2 - 2) {
            const treeHeight = 4 + Math.floor(Math.random() * 3);
            for (let i = 1; i <= treeHeight; i++) {
              blocks[`${x},${surfaceY + i},${z}`] = { id: `${x},${surfaceY + i},${z}`, pos: [x, surfaceY + i, z], type: 'wood' };
            }
            // Leaves
            for (let lx = -2; lx <= 2; lx++) {
              for (let lz = -2; lz <= 2; lz++) {
                for (let ly = 0; ly <= 2; ly++) {
                  if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 2) continue;
                  const leafY = surfaceY + treeHeight + ly - 1;
                  const leafKey = `${x + lx},${leafY},${z + lz}`;
                  if (!blocks[leafKey]) {
                    blocks[leafKey] = { id: leafKey, pos: [x + lx, leafY, z + lz], type: 'leaves' };
                  }
                }
              }
            }
          }
        }
      }
      
      setBlocks(blocks);
      setWorldLoaded(true);
      setLoading(false);
    };

    // Small timeout to let React render the loading screen first
    setTimeout(generateTerrain, 50);
  }, [setBlocks, gameMode, setWorldLoaded]);

  if (!gameMode) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-sky-900 flex flex-col items-center justify-center z-[100]">
        <h1 className="text-white text-4xl font-bold mb-4 animate-pulse">Dünya Oluşturuluyor...</h1>
        <p className="text-sky-200 text-xl mb-8">Madenler, çukurlar ve ağaçlar yerleştiriliyor</p>
        <div className="w-64 h-2 bg-sky-950 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 animate-pulse w-full"></div>
        </div>
      </div>
    );
  }

  return null;
}
