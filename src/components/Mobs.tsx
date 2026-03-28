import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useStore, MobData } from '../store';

export function Mobs() {
  const mobs = useStore(state => state.mobs);
  const setMobs = useStore(state => state.setMobs);

  useEffect(() => {
    // Spawn some initial mobs only if empty
    if (mobs.length === 0) {
      const initialMobs: MobData[] = [
        { id: '1', type: 'zombie', pos: [5, 15, 5], health: 20 },
        { id: '2', type: 'skeleton', pos: [-5, 15, -5], health: 20 },
        { id: '3', type: 'sheep', pos: [10, 15, 0], health: 8 },
        { id: '4', type: 'zombie', pos: [0, 15, 10], health: 20 },
      ];
      setMobs(initialMobs);
    }
  }, []);

  return (
    <>
      {mobs.map((mob) => (
        <Mob key={mob.id} data={mob} />
      ))}
    </>
  );
}

function Mob({ data }: { data: MobData }) {
  const bodyRef = useRef<any>(null);
  const isDead = useStore(state => state.isDead);

  const colors = {
    zombie: '#2e6b3b',
    skeleton: '#e0e0e0',
    sheep: '#ffffff'
  };

  useFrame((state) => {
    if (!bodyRef.current || isDead) return;

    const mobPos = bodyRef.current.translation();
    const playerPos = state.camera.position;
    
    // Fall off world
    if (mobPos.y < -15) {
      useStore.getState().damageMob(data.id, 999);
      return;
    }

    const distance = new THREE.Vector3(mobPos.x, mobPos.y, mobPos.z).distanceTo(playerPos);

    if (data.type === 'zombie' || data.type === 'skeleton') {
      // Hostile mob logic
      if (distance < 15 && distance > 1.5) {
        // Move towards player
        const dir = new THREE.Vector3(playerPos.x - mobPos.x, 0, playerPos.z - mobPos.z).normalize();
        const speed = data.type === 'zombie' ? 2 : 1.5;
        const currentVel = bodyRef.current.linvel();
        bodyRef.current.setLinvel({ x: dir.x * speed, y: currentVel.y, z: dir.z * speed }, true);
      } else if (distance <= 1.5) {
        // Attack player
        if (Math.random() < 0.02) { // Attack cooldown roughly
          const { health, setHealth, armor, offhand, inventory, selectedSlot, setTotemEffect, setOffhand, setIsDead } = useStore.getState();
          const mainHand = inventory[selectedSlot];
          
          // Calculate damage reduction
          let damage = data.type === 'zombie' ? 3 : 2;
          let reduction = 0;
          if (armor.helmet) reduction += 0.1;
          if (armor.chestplate) reduction += 0.3;
          if (armor.leggings) reduction += 0.2;
          if (armor.boots) reduction += 0.1;
          if (offhand === 'shield') reduction += 0.2; // Shield blocks some damage passively here
          
          const finalDamage = Math.max(0.5, damage * (1 - reduction));
          
          const newHealth = health - finalDamage;
          if (newHealth <= 0) {
            if (offhand === 'totem' || mainHand === 'totem') {
              if (offhand === 'totem') setOffhand(null);
              else {
                const newInv = [...inventory];
                newInv[selectedSlot] = null;
                useStore.setState({ inventory: newInv });
              }
              setHealth(5);
              setTotemEffect(true);
              setTimeout(() => setTotemEffect(false), 2000);
            } else {
              setHealth(0);
              setIsDead(true);
            }
          } else {
            setHealth(newHealth);
          }
        }
      }
    } else if (data.type === 'sheep') {
      // Passive mob logic - random wandering
      if (Math.random() < 0.01) {
        const angle = Math.random() * Math.PI * 2;
        bodyRef.current.setLinvel({ x: Math.cos(angle) * 1, y: bodyRef.current.linvel().y, z: Math.sin(angle) * 1 }, true);
      }
    }
  });

  return (
    <RigidBody ref={bodyRef} position={data.pos} colliders={false} mass={1} lockRotations>
      <CuboidCollider args={[0.4, 0.9, 0.4]} />
      <mesh castShadow receiveShadow position={[0, 0, 0]} userData={{ isMob: true, id: data.id }}>
        <boxGeometry args={[0.8, 1.8, 0.8]} />
        <meshStandardMaterial color={colors[data.type]} />
      </mesh>
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 1.3, 0]} userData={{ isMob: true, id: data.id }}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={colors[data.type]} />
      </mesh>
    </RigidBody>
  );
}
