import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn, clamp } from '@/utils';
import { useRobotStore } from '@/stores/robotStore';
import { robotWebSocket } from '@/services/websocket/robotWebSocket';

export function SteeringWheel() {
  const steering = useRobotStore((s) => s.driveCommand.steering);
  const setDriveCommand = useRobotStore((s) => s.setDriveCommand);
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const delta = (clientX - centerX) / (rect.width / 2);
      setDriveCommand({ steering: clamp(delta, -1, 1) });
      robotWebSocket.sendDriveCommand(useRobotStore.getState().driveCommand);
    },
    [setDriveCommand],
  );

  const rotation = steering * 90;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={wheelRef}
        className="relative w-48 h-48 rounded-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => { setIsDragging(false); setDriveCommand({ steering: 0 }); }}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); setDriveCommand({ steering: 0 }); } }}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => { setIsDragging(false); setDriveCommand({ steering: 0 }); }}
        onTouchMove={(e) => isDragging && handleMove(e.touches[0].clientX)}
      >
        <motion.div
          animate={{ rotate: rotation }}
          className="w-full h-full rounded-full border-4 border-white/20 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl"
          style={{ transformOrigin: 'center' }}
        >
          <div className="absolute inset-4 rounded-full border-2 border-white/10" />
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-6 bg-brand-500 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20" />
          </div>
        </motion.div>
      </div>
      <span className="text-xs text-white/50 uppercase tracking-wider">Steering</span>
    </div>
  );
}

export function Speedometer({ speed, maxSpeed = 3 }: { speed: number; maxSpeed?: number }) {
  const percentage = (speed / maxSpeed) * 100;
  const angle = -135 + (percentage / 100) * 270;

  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 160 160" className="w-full h-full">
        <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeDasharray="330 440" strokeLinecap="round" transform="rotate(135 80 80)" />
        <circle
          cx="80" cy="80" r="70" fill="none" stroke="#3b82f6" strokeWidth="8"
          strokeDasharray={`${(percentage / 100) * 330} 440`}
          strokeLinecap="round" transform="rotate(135 80 80)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{speed.toFixed(2)}</span>
        <span className="text-xs text-white/50">m/s</span>
      </div>
      <div
        className="absolute w-1 h-12 bg-brand-500 rounded-full origin-bottom"
        style={{
          left: '50%',
          bottom: '50%',
          transform: `translateX(-50%) rotate(${angle}deg)`,
          transformOrigin: 'bottom center',
        }}
      />
    </div>
  );
}

export function PedalControl({
  label,
  variant,
  active,
  onPress,
  onRelease,
}: {
  label: string;
  variant: 'accelerator' | 'brake';
  active: boolean;
  onPress: () => void;
  onRelease: () => void;
}) {
  const colors = {
    accelerator: active ? 'bg-emerald-600 border-emerald-400 shadow-emerald-600/40' : 'bg-white/5 border-white/10',
    brake: active ? 'bg-red-600 border-red-400 shadow-red-600/40' : 'bg-white/5 border-white/10',
  };

  return (
    <button
      className={cn(
        'w-20 h-32 rounded-2xl border-2 flex flex-col items-center justify-end pb-4 transition-all duration-150 shadow-lg',
        colors[variant],
        active && 'scale-95',
      )}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={onRelease}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
    >
      <span className="text-xs font-semibold text-white/80 uppercase">{label}</span>
    </button>
  );
}

export function JoystickControl() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const setDriveCommand = useRobotStore((s) => s.setDriveCommand);
  const padRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!padRef.current) return;
      const rect = padRef.current.getBoundingClientRect();
      const x = clamp((clientX - rect.left - rect.width / 2) / (rect.width / 2), -1, 1);
      const y = clamp(-(clientY - rect.top - rect.height / 2) / (rect.height / 2), -1, 1);
      setPosition({ x: x * 40, y: y * 40 });
      setDriveCommand({ steering: x, throttle: Math.max(0, y), reverse: y < -0.1 });
      // NOTE: this was previously missing entirely -- the joystick updated
      // local UI state but never actually sent anything to the robot.
      robotWebSocket.sendDriveCommand(useRobotStore.getState().driveCommand);
    },
    [setDriveCommand],
  );

  const reset = () => {
    setPosition({ x: 0, y: 0 });
    setDriveCommand({ steering: 0, throttle: 0, reverse: false });
    robotWebSocket.sendDriveCommand(useRobotStore.getState().driveCommand);
  };

  return (
    <div
      ref={padRef}
      className="relative w-32 h-32 rounded-full bg-white/5 border-2 border-white/10"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX, e.clientY)}
      onMouseUp={reset}
      onMouseLeave={reset}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={reset}
    >
      <div
        className="absolute w-10 h-10 rounded-full bg-brand-500 shadow-lg shadow-brand-500/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
      />
    </div>
  );
}

export function CompassDisplay({ heading }: { heading: number }) {
  return (
    <div className="relative w-24 h-24">
      <motion.div
        animate={{ rotate: -heading }}
        className="w-full h-full rounded-full border-2 border-white/20 bg-white/5"
      >
        {['N', 'E', 'S', 'W'].map((dir, i) => (
          <span
            key={dir}
            className={cn(
              'absolute text-xs font-bold',
              dir === 'N' ? 'text-red-400' : 'text-white/50',
            )}
            style={{
              top: i === 0 ? '4px' : i === 2 ? 'auto' : '50%',
              bottom: i === 2 ? '4px' : 'auto',
              left: i === 3 ? '4px' : i === 1 ? 'auto' : '50%',
              right: i === 1 ? '4px' : 'auto',
              transform: i % 2 === 0 ? 'translateX(-50%)' : 'translateY(-50%)',
            }}
          >
            {dir}
          </span>
        ))}
      </motion.div>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-brand-500" />
    </div>
  );
}

export function EmergencyStopButton({ onStop }: { onStop: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onStop}
      className="w-full py-6 rounded-2xl bg-red-600 hover:bg-red-500 border-4 border-red-400
        text-white font-bold text-xl uppercase tracking-widest shadow-2xl shadow-red-600/40
        flex items-center justify-center gap-3"
    >
      <span className="text-2xl">⛔</span>
      Emergency Stop
    </motion.button>
  );
}

// The robot latches EMERGENCY_STOP until it explicitly receives a STOP
// command (README section 9.3) -- pressing Emergency Stop again does
// nothing once latched. This is the only control that clears it.
export function ClearEmergencyStopButton({ onClear }: { onClear: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClear}
      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 border-4 border-amber-300
        text-black font-bold text-lg uppercase tracking-widest shadow-2xl shadow-amber-500/40
        flex items-center justify-center gap-3"
    >
      Clear Emergency Stop
    </motion.button>
  );
}

export function PowderButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all',
        active
          ? 'bg-white/80 border-white text-black shadow-lg shadow-white/30'
          : 'bg-white/10 border-white/20 text-white/60',
      )}
    >
      💨
    </button>
  );
}

export function CruiseControl({ speed, onChange }: { speed: number; onChange: (speed: number) => void }) {
  return (
    <div className="glass-panel p-3 space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">Cruise Speed</span>
        <span className="text-brand-400 font-medium">{speed}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={speed}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500"
      />
    </div>
  );
}
