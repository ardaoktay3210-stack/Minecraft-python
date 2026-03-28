import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStore } from '../store';
import { RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier';

const SPEED = 5;
const JUMP_FORCE = 8;
const PLAYER_HEIGHT = 1.8;

export function Player() {
  const { camera, scene } = useThree();
  const [velocity] = useState(() => new THREE.Vector3());
  const [direction] = useState(() => new THREE.Vector3());
  const [frontVector] = useState(() => new THREE.Vector3());
  const [sideVector] = useState(() => new THREE.Vector3());
  const controlsRef = useRef<any>(null);
  const rigidBodyRef = useRef<any>(null);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const raycaster = useRef(new THREE.Raycaster());
  const center = useRef(new THREE.Vector2(0, 0));

  const inventoryOpen = useStore((state) => state.inventoryOpen);
  const setInventoryOpen = useStore((state) => state.setInventoryOpen);
  const setSelectedSlot = useStore((state) => state.setSelectedSlot);
  const selectedSlot = useStore((state) => state.selectedSlot);
  const isTouch = useStore((state) => state.isTouch);
  const action = useStore((state) => state.action);
  const setAction = useStore((state) => state.setAction);
  const removeBlock = useStore((state) => state.removeBlock);
  const addBlock = useStore((state) => state.addBlock);

  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });

  const lastJumpTime = useRef(0);
  const [isFlying, setIsFlying] = useState(false);

  const handleInteract = (isPlace: boolean) => {
    const state = useStore.getState();
    const selectedType = state.inventory[state.selectedSlot];

    // 1. Handle eating apple
    if (isPlace && selectedType === 'apple') {
      state.setHunger(h => Math.min(20, h + 4));
      state.setHealth(h => Math.min(20, h + 2));
      const newInv = [...state.inventory];
      newInv[state.selectedSlot] = null;
      useStore.setState({ inventory: newInv });
      return;
    }

    // 2. Raycast for Mobs
    raycaster.current.setFromCamera(center.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    if (!isPlace) {
      const mobHit = intersects.find(i => i.object.userData?.isMob);
      if (mobHit && mobHit.distance < 5) {
        const damage = selectedType === 'sword' ? 7 : selectedType === 'axe' ? 6 : selectedType === 'pickaxe' ? 4 : 2;
        state.damageMob(mobHit.object.userData.id, damage);
        return; // Stop here, don't break blocks if we hit a mob
      }
    }

    // 3. Voxel raycasting for 100% reliable block interaction
    const origin = new THREE.Vector3();
    camera.getWorldPosition(origin);
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const maxDistance = 7;
    const step = direction.clone().multiplyScalar(0.1);
    const pos = origin.clone();
    
    let hitPos: [number, number, number] | null = null;
    let hitNormal: THREE.Vector3 | null = null;
    
    for (let i = 0; i < maxDistance * 10; i++) {
      pos.add(step);
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      const z = Math.round(pos.z);
      const key = `${x},${y},${z}`;
      
      if (useStore.getState().blocks[key]) {
        hitPos = [x, y, z];
        const prevPos = pos.clone().sub(step);
        hitNormal = new THREE.Vector3(
          Math.round(prevPos.x) - x,
          Math.round(prevPos.y) - y,
          Math.round(prevPos.z) - z
        );
        break;
      }
    }

    if (hitPos) {
      const selectedType = useStore.getState().inventory[useStore.getState().selectedSlot];
      const isToolOrArmor = selectedType ? ['sword', 'pickaxe', 'axe', 'apple', 'helmet', 'chestplate', 'leggings', 'boots', 'shield', 'totem'].includes(selectedType) : false;

      if (!isPlace) {
        removeBlock(hitPos);
      } else {
        if (!selectedType || isToolOrArmor) return; // Can't place tools, armor, or empty hands

        if (hitNormal) {
          const newPos: [number, number, number] = [
            hitPos[0] + hitNormal.x,
            hitPos[1] + hitNormal.y,
            hitPos[2] + hitNormal.z,
          ];
          addBlock(newPos, selectedType as any);
        }
      }
    }
  };

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement && !inventoryOpen && !useStore.getState().isDead) {
        if (e.button === 0) handleInteract(false);
        if (e.button === 2) handleInteract(true);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [inventoryOpen]);

  useEffect(() => {
    if (useStore.getState().isDead) return;
    if (action === 'break') {
      handleInteract(false);
      setAction(null);
    } else if (action === 'place') {
      handleInteract(true);
      setAction(null);
    }
  }, [action]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useStore.getState().isDead) return;
      
      if (e.key.toLowerCase() === 'e') {
        setInventoryOpen(!inventoryOpen);
        if (controlsRef.current && !isTouch) {
          if (!inventoryOpen) {
            controlsRef.current.unlock();
          } else {
            controlsRef.current.lock();
          }
        }
        return;
      }

      if (e.code === 'Space' && useStore.getState().gameMode === 'creative') {
        const now = Date.now();
        if (now - lastJumpTime.current < 300) {
          setIsFlying(f => !f);
        }
        lastJumpTime.current = now;
      }

      if (inventoryOpen) return;

      if (e.key >= '1' && e.key <= '9') {
        setSelectedSlot(parseInt(e.key) - 1);
      }

      setKeys((keys) => ({ ...keys, [e.key.toLowerCase()]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((keys) => ({ ...keys, [e.key.toLowerCase()]: false }));
    };

    const handleWheel = (e: WheelEvent) => {
      if (inventoryOpen || useStore.getState().isDead) return;
      if (e.deltaY > 0) {
        setSelectedSlot((selectedSlot + 1) % 9);
      } else {
        setSelectedSlot((selectedSlot - 1 + 9) % 9);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('wheel', handleWheel);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('wheel', handleWheel);
    };
  }, [inventoryOpen, selectedSlot, setInventoryOpen, setSelectedSlot, isTouch]);

  useFrame(() => {
    if (!rigidBodyRef.current || inventoryOpen) return;

    const { health, hunger, setHealth, setHunger, isDead, setIsDead, offhand, setOffhand, setTotemEffect, gameMode } = useStore.getState();

    if (isDead) {
      if (controlsRef.current && controlsRef.current.isLocked) {
        controlsRef.current.unlock();
      }
      return;
    }

    // Hunger and Health Mechanics (Survival only)
    if (gameMode === 'survival') {
      if (Math.random() < 0.0005) setHunger(h => Math.max(0, h - 1)); // Slowly get hungry
      if (hunger === 0 && Math.random() < 0.005) setHealth(h => Math.max(0, h - 1)); // Starve
      if (hunger >= 18 && health < 20 && Math.random() < 0.005) setHealth(h => Math.min(20, h + 1)); // Heal
    }

    const position = rigidBodyRef.current.translation();
    
    // Void check or Death check
    if (position.y < -35 || health <= 0) {
      if (gameMode === 'creative' && position.y < -35) {
        rigidBodyRef.current.setTranslation({ x: 0, y: 15, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }

      const mainHand = useStore.getState().inventory[useStore.getState().selectedSlot];
      if (offhand === 'totem' || mainHand === 'totem') {
        // Totem saves you
        if (offhand === 'totem') setOffhand(null);
        else {
          const newInv = [...useStore.getState().inventory];
          newInv[useStore.getState().selectedSlot] = null;
          useStore.setState({ inventory: newInv });
        }
        setHealth(5);
        setTotemEffect(true);
        setTimeout(() => setTotemEffect(false), 2000);
        if (position.y < -35) {
          rigidBodyRef.current.setTranslation({ x: 0, y: 15, z: 0 }, true);
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      } else {
        setIsDead(true);
        rigidBodyRef.current.setTranslation({ x: 0, y: 15, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
      return;
    }

    camera.position.set(position.x, position.y + PLAYER_HEIGHT / 2 - 0.2, position.z);

    if (isTouch) {
      const { touchLookDelta } = useStore.getState();
      if (touchLookDelta.x !== 0 || touchLookDelta.y !== 0) {
        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y -= touchLookDelta.x * 0.007; // Slightly faster look
        euler.current.x -= touchLookDelta.y * 0.007;
        euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x));
        camera.quaternion.setFromEuler(euler.current);
        useStore.getState().setTouchLookDelta({ x: 0, y: 0 });
      }
    }

    const { touchMovement } = useStore.getState();
    let moveZ = Number(keys.s) - Number(keys.w);
    let moveX = Number(keys.a) - Number(keys.d);

    if (isTouch) {
      moveZ = -touchMovement.y;
      moveX = -touchMovement.x;
    }

    frontVector.set(0, 0, moveZ);
    sideVector.set(moveX, 0, 0);
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(SPEED).applyEuler(camera.rotation);

    const currentVelocity = rigidBodyRef.current.linvel();
    const isJumping = keys.space || action === 'jump';

    if (isFlying && gameMode === 'creative') {
      const flySpeed = SPEED * 2;
      let flyY = 0;
      if (isJumping) flyY = flySpeed;
      else if (keys.s && !keys.w) flyY = -flySpeed; // Simple descend if needed, or just let them fall if they toggle off
      
      velocity.set(direction.x * 2, flyY, direction.z * 2);
      rigidBodyRef.current.setGravityScale(0, true);
    } else {
      rigidBodyRef.current.setGravityScale(1, true);
      velocity.set(direction.x, currentVelocity.y, direction.z);

      if (isJumping && Math.abs(currentVelocity.y) < 0.1) {
        velocity.y = JUMP_FORCE;
        if (action === 'jump') setAction(null);
      }
    }

    rigidBodyRef.current.setLinvel(velocity, true);
  });

  return (
    <>
      {!isTouch && <PointerLockControls ref={controlsRef} selector="#game-container" />}
      <RigidBody 
        ref={rigidBodyRef} 
        colliders={false} 
        mass={1} 
        type="dynamic" 
        position={[0, 15, 0]} // Start a bit higher to ensure world loads
        enabledRotations={[false, false, false]}
        friction={0}
      >
        <CapsuleCollider args={[PLAYER_HEIGHT / 2 - 0.5, 0.5]} />
      </RigidBody>
    </>
  );
}
