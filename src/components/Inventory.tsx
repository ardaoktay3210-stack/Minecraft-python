import { useStore, ItemType } from '../store';
import { useState } from 'react';

const ICONS: Record<ItemType, string> = {
  dirt: '🟫', grass: '🟩', stone: '🪨', wood: '🪵', leaves: '🍃', sand: '🟨', glass: '🧊', brick: '🧱', obsidian: '⬛',
  wooden_planks: '🟫', crafting_table: '🧰', coal_ore: '⚫', iron_ore: '🪨', gold_ore: '🟡', diamond_ore: '💎', copper_ore: '🟠',
  coal: '⚫', iron_ingot: '🤍', gold_ingot: '🟡', diamond: '💎', copper_ingot: '🟠', stick: '🦯',
  wooden_sword: '🗡️', wooden_pickaxe: '⛏️', wooden_axe: '🪓',
  stone_sword: '🗡️', stone_pickaxe: '⛏️', stone_axe: '🪓',
  iron_sword: '🗡️', iron_pickaxe: '⛏️', iron_axe: '🪓',
  diamond_sword: '🗡️', diamond_pickaxe: '⛏️', diamond_axe: '🪓',
  sword: '🗡️', pickaxe: '⛏️', axe: '🪓', apple: '🍎', helmet: '🪖', chestplate: '👕', leggings: '👖', boots: '🥾', shield: '🛡️', totem: '🗿'
};

const RECIPES = [
  { in: ['wood', null, null, null], out: 'wooden_planks' },
  { in: [null, 'wood', null, null], out: 'wooden_planks' },
  { in: [null, null, 'wood', null], out: 'wooden_planks' },
  { in: [null, null, null, 'wood'], out: 'wooden_planks' },
  { in: ['wooden_planks', 'wooden_planks', 'wooden_planks', 'wooden_planks'], out: 'crafting_table' },
  { in: ['wooden_planks', null, 'wooden_planks', null], out: 'stick' },
  { in: [null, 'wooden_planks', null, 'wooden_planks'], out: 'stick' },
];

export function Inventory() {
  const inventoryOpen = useStore((state) => state.inventoryOpen);
  const inventory = useStore((state) => state.inventory);
  const selectedSlot = useStore((state) => state.selectedSlot);
  const setSelectedSlot = useStore((state) => state.setSelectedSlot);
  const health = useStore((state) => state.health);
  const hunger = useStore((state) => state.hunger);
  const armor = useStore((state) => state.armor);
  const offhand = useStore((state) => state.offhand);
  const isDead = useStore((state) => state.isDead);
  const totemEffect = useStore((state) => state.totemEffect);
  const gameMode = useStore((state) => state.gameMode);

  const [craftingGrid, setCraftingGrid] = useState<(ItemType | null)[]>([null, null, null, null]);

  const getCraftingResult = (): ItemType | null => {
    for (const recipe of RECIPES) {
      if (recipe.in.every((item, i) => item === craftingGrid[i])) {
        return recipe.out as ItemType;
      }
    }
    return null;
  };

  const craftingResult = getCraftingResult();

  const handleCraft = () => {
    if (craftingResult) {
      // Find empty slot
      const emptySlot = inventory.findIndex(item => item === null);
      if (emptySlot !== -1) {
        const newInv = [...inventory];
        newInv[emptySlot] = craftingResult;
        useStore.setState({ inventory: newInv });
        setCraftingGrid([null, null, null, null]);
      }
    }
  };

  const handleGridClick = (index: number) => {
    const selectedItem = inventory[selectedSlot];
    if (selectedItem && !craftingGrid[index]) {
      const newGrid = [...craftingGrid];
      newGrid[index] = selectedItem;
      setCraftingGrid(newGrid);
      
      if (gameMode !== 'creative') {
        const newInv = [...inventory];
        newInv[selectedSlot] = null;
        useStore.setState({ inventory: newInv });
      }
    } else if (craftingGrid[index]) {
      // Return to inventory
      const emptySlot = inventory.findIndex(item => item === null);
      if (emptySlot !== -1) {
        const newInv = [...inventory];
        newInv[emptySlot] = craftingGrid[index];
        useStore.setState({ inventory: newInv });
        const newGrid = [...craftingGrid];
        newGrid[index] = null;
        setCraftingGrid(newGrid);
      }
    }
  };

  const renderItem = (item: ItemType | null) => {
    if (!item) return null;
    return <span className="text-3xl drop-shadow-md">{ICONS[item]}</span>;
  };

  if (isDead) {
    return (
      <div className="fixed inset-0 bg-red-900/80 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
        <h1 className="text-red-500 text-6xl font-bold mb-8 drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">You Died!</h1>
        <button 
          onClick={() => useStore.getState().respawn()}
          className="bg-gray-800 hover:bg-gray-700 text-white text-2xl font-bold py-4 px-8 border-4 border-gray-600 rounded-xl transition-all hover:scale-105"
        >
          Respawn
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Totem Effect */}
      {totemEffect && (
        <div className="fixed inset-0 bg-yellow-400/50 mix-blend-overlay z-40 pointer-events-none animate-pulse" />
      )}

      {/* HUD: Health and Hunger */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex justify-between w-[340px] px-2 pointer-events-none z-10">
        {/* Health */}
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const val = i * 2;
            return (
              <span key={i} className="text-red-500 text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {health > val + 1 ? '❤️' : health > val ? '💔' : '🖤'}
              </span>
            );
          })}
        </div>
        {/* Hunger */}
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => {
            const val = i * 2;
            return (
              <span key={i} className="text-orange-500 text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                {hunger > val + 1 ? '🍖' : hunger > val ? '🦴' : '💀'}
              </span>
            );
          })}
        </div>
      </div>

      {/* Hotbar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 p-1 rounded-lg border-2 border-gray-800 z-10">
        {inventory.slice(0, 9).map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedSlot(index)}
            className={`w-12 h-12 flex items-center justify-center border-2 cursor-pointer transition-all bg-gray-700/50 ${
              selectedSlot === index ? 'border-white scale-110 z-10 bg-gray-600/80' : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            {renderItem(item)}
            <span className="absolute top-0.5 left-1 text-xs text-white font-bold drop-shadow-md">{index + 1}</span>
          </div>
        ))}
      </div>

      {/* Full Inventory */}
      {inventoryOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-xl border-4 border-gray-600 shadow-2xl touch-allow-scroll max-w-[90vw] max-h-[90vh] overflow-auto relative">
            <button 
              className="absolute top-2 right-4 text-white font-bold text-2xl hover:text-red-500"
              onClick={() => useStore.getState().setInventoryOpen(false)}
            >
              X
            </button>
            <h2 className="text-white text-2xl font-bold mb-4 text-center">Inventory</h2>
            
            <div className="flex flex-col md:flex-row gap-8 mb-6">
              {/* Crafting Grid */}
          <div className="flex flex-col items-center">
            <h3 className="text-white mb-2 font-bold">Crafting</h3>
            <div className="flex items-center gap-4">
              <div className="grid grid-cols-2 gap-1 bg-black/50 p-2 rounded">
                {craftingGrid.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleGridClick(i)}
                    className="w-12 h-12 bg-white/20 border-2 border-white/30 rounded flex items-center justify-center text-2xl cursor-pointer hover:bg-white/30"
                  >
                    {item ? ICONS[item] : ''}
                  </div>
                ))}
              </div>
              <div className="text-white text-2xl">➔</div>
              <div 
                onClick={handleCraft}
                className={`w-16 h-16 bg-white/20 border-2 border-white/30 rounded flex items-center justify-center text-3xl ${craftingResult ? 'cursor-pointer hover:bg-white/30' : 'opacity-50'}`}
              >
                {craftingResult ? ICONS[craftingResult] : ''}
              </div>
            </div>
          </div>

          {/* Character Preview & Armor */}
              <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-lg border-2 border-gray-700">
                <div className="flex flex-col gap-2">
                  {(['helmet', 'chestplate', 'leggings', 'boots'] as const).map((slot) => (
                    <div 
                      key={slot}
                      className="w-12 h-12 border-2 border-gray-500 bg-gray-800 flex items-center justify-center relative"
                      title={slot}
                      onClick={() => {
                        // Unequip
                        if (armor[slot]) {
                          const newInv = [...inventory];
                          newInv[selectedSlot] = armor[slot] as any;
                          useStore.setState({ inventory: newInv });
                          useStore.getState().setArmor(slot, null);
                        }
                      }}
                    >
                      {renderItem(armor[slot])}
                      {!armor[slot] && <span className="text-gray-600 text-xs absolute">{slot.slice(0,4)}</span>}
                    </div>
                  ))}
                </div>
                
                {/* Character Model Placeholder */}
                <div className="w-32 h-48 bg-gray-700 border-2 border-gray-500 flex flex-col items-center justify-center relative">
                  <div className="text-4xl">🧍</div>
                  {/* Offhand Slot */}
                  <div 
                    className="absolute bottom-2 right-2 w-12 h-12 border-2 border-gray-500 bg-gray-800 flex items-center justify-center"
                    title="Offhand (Shield/Totem)"
                    onClick={() => {
                      if (offhand) {
                        const newInv = [...inventory];
                        newInv[selectedSlot] = offhand as any;
                        useStore.setState({ inventory: newInv });
                        useStore.getState().setOffhand(null);
                      }
                    }}
                  >
                    {renderItem(offhand)}
                    {!offhand && <span className="text-gray-600 text-xs absolute">off</span>}
                  </div>
                </div>
              </div>

              {/* All Available Items (Creative Menu Style) */}
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 content-start max-h-64 overflow-y-auto">
                {(Object.keys(ICONS) as ItemType[]).map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      // Equip logic
                      if (['helmet', 'chestplate', 'leggings', 'boots'].includes(item)) {
                        useStore.getState().setArmor(item as any, item as any);
                      } else if (['shield', 'totem'].includes(item)) {
                        useStore.getState().setOffhand(item as any);
                      } else {
                        // Replace selected slot with clicked item
                        const newInv = [...inventory];
                        newInv[selectedSlot] = item as any;
                        useStore.setState({ inventory: newInv });
                      }
                    }}
                    className="w-12 h-12 flex items-center justify-center border-2 border-gray-600 cursor-pointer hover:border-white bg-gray-700/50"
                    title={item}
                  >
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-gray-400 text-center mt-4 text-sm">Click items to equip to armor/offhand, or to hotbar</p>
          </div>
        </div>
      )}

      {/* Crosshair */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none mix-blend-difference z-10">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
        <div className="absolute top-0 left-1/2 w-[2px] h-full bg-white -translate-x-1/2" />
      </div>
    </>
  );
}
