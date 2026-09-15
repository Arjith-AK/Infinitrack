import { cn } from '@/utils';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Gauge({ value, max = 100, label, unit, size = 'md', color = '#3b82f6' }: GaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const sizes = { sm: 80, md: 100, lg: 120 };
  const dim = sizes[size];
  const strokeWidth = size === 'sm' ? 6 : 8;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold text-white', size === 'sm' ? 'text-lg' : 'text-xl')}>
            {typeof value === 'number' ? value.toFixed(size === 'sm' ? 0 : 1) : value}
          </span>
          {unit && <span className="text-[10px] text-white/50">{unit}</span>}
        </div>
      </div>
      <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  color = 'bg-brand-500',
  showPercent = true,
}: {
  value: number;
  label?: string;
  color?: string;
  showPercent?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-white/60 uppercase tracking-wider">{label}</span>}
          {showPercent && <span className="text-brand-400 font-medium">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function BatteryIndicator({ level, charging }: { level: number; charging?: boolean }) {
  const color = level > 50 ? 'bg-emerald-500' : level > 20 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-5 border-2 border-white/30 rounded-sm">
        <div className={cn('absolute inset-0.5 rounded-sm transition-all', color)} style={{ width: `${level}%` }} />
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-white/30 rounded-r" />
      </div>
      <span className="text-sm font-medium">{level}%</span>
      {charging && <span className="text-xs text-emerald-400">⚡</span>}
    </div>
  );
}

export function PowderIndicator({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center">
        <div
          className="w-5 h-5 rounded-full bg-white/80 transition-all"
          style={{ opacity: level / 100, transform: `scale(${0.5 + (level / 100) * 0.5})` }}
        />
      </div>
      <span className="text-sm font-medium">{level}%</span>
    </div>
  );
}
