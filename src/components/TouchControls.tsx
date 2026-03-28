import { useStore } from '../store';
import { useRef, useEffect } from 'react';

export function TouchControls() {
  const isTouch = useStore((state) => state.isTouch);
  const setAction = useStore((state) => state.setAction);
  const setTouchMovement = useStore((state) => state.setTouchMovement);
  const setTouchLookDelta = useStore((state) => state.setTouchLookDelta);
  const setInventoryOpen = useStore((state) => state.setInventoryOpen);
  const inventoryOpen = useStore((state) => state.inventoryOpen);

  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTouch) return;
    const preventDefault = (e: TouchEvent) => {
      if (e.target instanceof Element && e.target.closest('.touch-allow-scroll')) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.removeEventListener('touchmove', preventDefault);
  }, [isTouch]);

  if (!isTouch) return null;

  const handleJoystick = (e: React.PointerEvent) => {
    if (!joystickRef.current || !joystickKnobRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;

    const maxDist = rect.width / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    joystickKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    setTouchMovement({ x: dx / maxDist, y: -dy / maxDist });
  };

  const resetJoystick = () => {
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
    }
    setTouchMovement({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Look Area (Right half of screen) */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-auto"
        onPointerDown={(e) => {
          lastTouch.current = { x: e.clientX, y: e.clientY };
          e.target.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!lastTouch.current) return;
          const deltaX = e.clientX - lastTouch.current.x;
          const deltaY = e.clientY - lastTouch.current.y;
          setTouchLookDelta({ x: deltaX, y: deltaY });
          lastTouch.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          lastTouch.current = null;
          e.target.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          lastTouch.current = null;
          e.target.releasePointerCapture(e.pointerId);
        }}
      />

      {/* Joystick Area (Left bottom) */}
      <div
        ref={joystickRef}
        className="absolute bottom-16 left-12 w-48 h-48 bg-white/10 rounded-full pointer-events-auto flex items-center justify-center border-4 border-white/20 shadow-xl touch-none"
        onPointerDown={(e) => {
          e.target.setPointerCapture(e.pointerId);
          handleJoystick(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0) handleJoystick(e);
        }}
        onPointerUp={(e) => {
          e.target.releasePointerCapture(e.pointerId);
          resetJoystick();
        }}
        onPointerCancel={(e) => {
          e.target.releasePointerCapture(e.pointerId);
          resetJoystick();
        }}
      >
        <div
          ref={joystickKnobRef}
          className="w-20 h-20 bg-white/50 rounded-full shadow-2xl backdrop-blur-sm border-2 border-white/30"
        />
      </div>

      {/* Action Buttons (Right bottom) */}
      <div className="absolute bottom-16 right-12 flex flex-col gap-6 pointer-events-auto items-end">
        <button
          className="w-24 h-24 bg-white/20 rounded-full font-bold text-white border-4 border-white/40 active:bg-white/40 shadow-xl flex items-center justify-center text-3xl touch-none"
          onPointerDown={() => setAction('jump')}
        >
          ▲
        </button>
        <div className="flex gap-6">
          <button
            className="w-24 h-24 bg-white/20 rounded-full font-bold text-white border-4 border-white/40 active:bg-white/40 shadow-xl flex items-center justify-center text-xl touch-none"
            onPointerDown={() => setAction('break')}
          >
            Break
          </button>
          <button
            className="w-24 h-24 bg-white/20 rounded-full font-bold text-white border-4 border-white/40 active:bg-white/40 shadow-xl flex items-center justify-center text-xl touch-none"
            onPointerDown={() => setAction('place')}
          >
            Place
          </button>
        </div>
      </div>

      {/* Inventory Toggle */}
      <button
        className="absolute top-6 right-6 w-16 h-16 bg-white/20 rounded-xl pointer-events-auto font-bold text-white border-4 border-white/40 active:bg-white/40 shadow-xl flex items-center justify-center text-lg"
        onClick={() => setInventoryOpen(!inventoryOpen)}
      >
        INV
      </button>
    </div>
  );
}
