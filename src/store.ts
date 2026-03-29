import { create } from 'zustand';

export type ItemType = 'dirt' | 'grass' | 'stone' | 'wood' | 'leaves' | 'sand' | 'glass' | 'brick' | 'obsidian' | 
  'wooden_planks' | 'crafting_table' | 'coal_ore' | 'iron_ore' | 'gold_ore' | 'diamond_ore' | 'copper_ore' |
  'coal' | 'iron_ingot' | 'gold_ingot' | 'diamond' | 'copper_ingot' | 'stick' |
  'wooden_sword' | 'wooden_pickaxe' | 'wooden_axe' |
  'stone_sword' | 'stone_pickaxe' | 'stone_axe' |
  'iron_sword' | 'iron_pickaxe' | 'iron_axe' |
  'diamond_sword' | 'diamond_pickaxe' | 'diamond_axe' |
  'sword' | 'pickaxe' | 'axe' | 'apple' | 'helmet' | 'chestplate' | 'leggings' | 'boots' | 'shield' | 'totem';

export type BlockType = Extract<ItemType, 'dirt' | 'grass' | 'stone' | 'wood' | 'leaves' | 'sand' | 'glass' | 'brick' | 'obsidian' | 'wooden_planks' | 'crafting_table' | 'coal_ore' | 'iron_ore' | 'gold_ore' | 'diamond_ore' | 'copper_ore'>;

export interface MobData {
  id: string;
  type: 'zombie' | 'skeleton' | 'sheep';
  pos: [number, number, number];
  health: number;
}

interface Block {
  id: string;
  pos: [number, number, number];
  type: BlockType;
}

interface GameState {
  gameMode: 'creative' | 'survival' | null;
  blocks: Record<string, Block>;
  inventoryOpen: boolean;
  selectedSlot: number;
  inventory: (ItemType | null)[];
  isTouch: boolean;
  action: 'break' | 'place' | 'jump' | null;
  touchMovement: { x: number, y: number };
  touchLookDelta: { x: number, y: number };
  worldLoaded: boolean;
  health: number;
  hunger: number;
  armor: { helmet: ItemType | null; chestplate: ItemType | null; leggings: ItemType | null; boots: ItemType | null };
  offhand: ItemType | null;
  isDead: boolean;
  totemEffect: boolean;
  mobs: MobData[];
  
  addBlock: (pos: [number, number, number], type: BlockType) => void;
  removeBlock: (pos: [number, number, number]) => void;
  setInventoryOpen: (open: boolean) => void;
  setSelectedSlot: (slot: number) => void;
  setBlocks: (blocks: Record<string, Block>) => void;
  setIsTouch: (isTouch: boolean) => void;
  setAction: (action: 'break' | 'place' | 'jump' | null) => void;
  setTouchMovement: (movement: { x: number, y: number }) => void;
  setTouchLookDelta: (delta: { x: number, y: number }) => void;
  setWorldLoaded: (loaded: boolean) => void;
  setHealth: (health: number | ((prev: number) => number)) => void;
  setHunger: (hunger: number | ((prev: number) => number)) => void;
  setArmor: (slot: keyof GameState['armor'], item: ItemType | null) => void;
  setOffhand: (item: ItemType | null) => void;
  setIsDead: (isDead: boolean) => void;
  setTotemEffect: (effect: boolean) => void;
  respawn: () => void;
  setGameMode: (mode: 'creative' | 'survival') => void;
  setMobs: (mobs: MobData[] | ((prev: MobData[]) => MobData[])) => void;
  damageMob: (id: string, amount: number) => void;
}

export const useStore = create<GameState>((set) => ({
  gameMode: null,
  blocks: {},
  inventoryOpen: false,
  selectedSlot: 0,
  inventory: [null, null, null, null, null, null, null, null, null],
  isTouch: false,
  action: null,
  touchMovement: { x: 0, y: 0 },
  touchLookDelta: { x: 0, y: 0 },
  worldLoaded: false,
  health: 20,
  hunger: 20,
  armor: { helmet: null, chestplate: null, leggings: null, boots: null },
  offhand: null,
  isDead: false,
  totemEffect: false,
  mobs: [],
  
  addBlock: (pos, type) =>
    set((state) => {
      const key = `${pos[0]},${pos[1]},${pos[2]}`;
      if (state.blocks[key]) return state;
      return {
        blocks: {
          ...state.blocks,
          [key]: { id: key, pos, type },
        },
      };
    }),
  removeBlock: (pos) =>
    set((state) => {
      const key = `${pos[0]},${pos[1]},${pos[2]}`;
      if (!state.blocks[key]) return state;
      const newBlocks = { ...state.blocks };
      delete newBlocks[key];
      return { blocks: newBlocks };
    }),
  setInventoryOpen: (open) => set({ inventoryOpen: open }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setBlocks: (blocks) => set({ blocks }),
  setIsTouch: (isTouch) => set({ isTouch }),
  setAction: (action) => set({ action }),
  setTouchMovement: (touchMovement) => set({ touchMovement }),
  setTouchLookDelta: (touchLookDelta) => set({ touchLookDelta }),
  setWorldLoaded: (worldLoaded) => set({ worldLoaded }),
  setHealth: (health) => set((state) => ({ health: typeof health === 'function' ? health(state.health) : health })),
  setHunger: (hunger) => set((state) => ({ hunger: typeof hunger === 'function' ? hunger(state.hunger) : hunger })),
  setArmor: (slot, item) => set((state) => ({ armor: { ...state.armor, [slot]: item } })),
  setOffhand: (item) => set({ offhand: item }),
  setIsDead: (isDead) => set({ isDead }),
  setTotemEffect: (effect) => set({ totemEffect: effect }),
  respawn: () => set({ isDead: false, health: 20, hunger: 20 }),
  setGameMode: (mode) => set({ gameMode: mode, health: 20, hunger: 20 }),
  setMobs: (mobs) => set((state) => ({ mobs: typeof mobs === 'function' ? mobs(state.mobs) : mobs })),
  damageMob: (id, amount) => set((state) => ({
    mobs: state.mobs.map(m => m.id === id ? { ...m, health: m.health - amount } : m).filter(m => m.health > 0)
  })),
}));
