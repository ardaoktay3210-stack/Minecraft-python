import * as THREE from 'three';

// Generate procedural textures using canvas
function createTexture(type: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Base stone drawing helper for ores
  const drawStoneBase = () => {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#737373' : '#8c8c8c';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
    }
  };

  const drawOreSpots = (color1: string, color2: string) => {
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
      ctx.fillRect(Math.random() * 60, Math.random() * 60, 4, 4);
    }
  };

  if (type === 'grass') {
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#1e7a1e' : '#29a329';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
    }
  } else if (type === 'dirt') {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#7a3c10' : '#9c4d15';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
    }
  } else if (type === 'stone') {
    drawStoneBase();
  } else if (type === 'coal_ore') {
    drawStoneBase();
    drawOreSpots('#1a1a1a', '#333333');
  } else if (type === 'iron_ore') {
    drawStoneBase();
    drawOreSpots('#d8af93', '#c09a7e');
  } else if (type === 'gold_ore') {
    drawStoneBase();
    drawOreSpots('#fcee4e', '#e6d639');
  } else if (type === 'diamond_ore') {
    drawStoneBase();
    drawOreSpots('#4eedfc', '#39d6e6');
  } else if (type === 'copper_ore') {
    drawStoneBase();
    drawOreSpots('#e0734f', '#4fae95'); // Orange and oxidized green
  } else if (type === 'wood') {
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#8a4726';
    for (let i = 0; i < 64; i += 4) {
      ctx.fillRect(0, i, 64, 2);
    }
  } else if (type === 'wooden_planks') {
    ctx.fillStyle = '#c49a5e';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#a8824c';
    for (let i = 0; i < 64; i += 16) {
      ctx.fillRect(0, i, 64, 2); // horizontal lines
      ctx.fillRect(i + (i%32===0?8:0), i, 2, 16); // vertical staggered lines
    }
  } else if (type === 'crafting_table') {
    ctx.fillStyle = '#c49a5e';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#8a4726';
    ctx.fillRect(0, 0, 64, 16); // Top border
    ctx.fillStyle = '#5c2d16';
    ctx.fillRect(16, 16, 32, 32); // Center grid
    ctx.fillStyle = '#a8824c';
    ctx.fillRect(32, 16, 2, 32);
    ctx.fillRect(16, 32, 32, 2);
  } else if (type === 'leaves') {
    ctx.fillStyle = '#006400';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#004d00' : '#008000';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 4, 4);
    }
  } else if (type === 'sand') {
    ctx.fillStyle = '#F4A460';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#e69a5a' : '#ffae66';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
    }
  } else if (type === 'brick') {
    ctx.fillStyle = '#B22222';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#cccccc';
    for (let y = 0; y < 64; y += 16) {
      ctx.fillRect(0, y, 64, 2);
      for (let x = (y % 32 === 0 ? 0 : 16); x < 64; x += 32) {
        ctx.fillRect(x, y, 2, 16);
      }
    }
  } else if (type === 'obsidian') {
    ctx.fillStyle = '#1a0033';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#2d004d' : '#0d001a';
      ctx.fillRect(Math.random() * 64, Math.random() * 64, 4, 4);
    }
  } else if (type === 'glass') {
    ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(20, 20);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export const textures: Record<string, THREE.Texture> = {
  grass: createTexture('grass'),
  dirt: createTexture('dirt'),
  stone: createTexture('stone'),
  coal_ore: createTexture('coal_ore'),
  iron_ore: createTexture('iron_ore'),
  gold_ore: createTexture('gold_ore'),
  diamond_ore: createTexture('diamond_ore'),
  copper_ore: createTexture('copper_ore'),
  wood: createTexture('wood'),
  wooden_planks: createTexture('wooden_planks'),
  crafting_table: createTexture('crafting_table'),
  leaves: createTexture('leaves'),
  sand: createTexture('sand'),
  brick: createTexture('brick'),
  obsidian: createTexture('obsidian'),
  glass: createTexture('glass'),
};
