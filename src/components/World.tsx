import { useStore } from '../store';
import { RigidBody, CuboidCollider, InstancedRigidBodies } from '@react-three/rapier';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { textures } from '../textures';

const BLOCK_TYPES = [
  'dirt', 'grass', 'stone', 'wood', 'leaves', 'sand', 'glass', 'brick', 'obsidian',
  'wooden_planks', 'crafting_table', 'coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'copper_ore'
] as const;
type BlockType = typeof BLOCK_TYPES[number];

export function World() {
  const blocks = useStore((state) => state.blocks);
  const isTouch = useStore((state) => state.isTouch);

  // Group blocks by type for instancing
  const groupedBlocks = useMemo(() => {
    const groups: Record<string, any[]> = {};
    BLOCK_TYPES.forEach(type => groups[type] = []);
    Object.values(blocks).forEach(block => {
      if (groups[block.type]) groups[block.type].push(block);
    });
    return groups;
  }, [blocks]);

  // Filter blocks that need physics (exposed blocks)
  const physicsBlocks = useMemo(() => {
    const exposed = [];
    const blockKeys = Object.keys(blocks);
    for (let i = 0; i < blockKeys.length; i++) {
      const block = blocks[blockKeys[i]];
      const [x, y, z] = block.pos;
      if (
        !blocks[`${x+1},${y},${z}`] || !blocks[`${x-1},${y},${z}`] ||
        !blocks[`${x},${y+1},${z}`] || !blocks[`${x},${y-1},${z}`] ||
        !blocks[`${x},${y},${z+1}`] || !blocks[`${x},${y},${z-1}`]
      ) {
        exposed.push(block);
      }
    }
    return exposed;
  }, [blocks]);

  const physicsPositions = useMemo(() => {
    return physicsBlocks.map(b => new THREE.Vector3(b.pos[0], b.pos[1], b.pos[2]));
  }, [physicsBlocks]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow={!isTouch} // Disable shadows on mobile for performance
        shadow-mapSize={[512, 512]}
      />
      
      {BLOCK_TYPES.map((type) => (
        <InstancedBlocks key={type} type={type} blocks={groupedBlocks[type]} />
      ))}

      {/* Physics Colliders - Instanced for massive performance boost */}
      {physicsPositions.length > 0 && (
        <InstancedRigidBodies
          positions={physicsPositions}
          colliders="cuboid"
          type="fixed"
        >
          <instancedMesh args={[null as any, null as any, physicsPositions.length]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial visible={false} />
          </instancedMesh>
        </InstancedRigidBodies>
      )}
    </>
  );
}

function InstancedBlocks({ type, blocks }: { type: string, blocks: any[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || blocks.length === 0) return;
    
    blocks.forEach((block, i) => {
      tempObject.position.set(...block.pos as [number, number, number]);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = blocks.length;
  }, [blocks, tempObject]);

  if (blocks.length === 0) return null;

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[null as any, null as any, 250000]} 
      frustumCulled={false}
      userData={{ isBlockType: true, blocks }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        map={textures[type]}
        transparent={type === 'glass'} 
        opacity={type === 'glass' ? 0.5 : 1} 
      />
    </instancedMesh>
  );
}
