import { cn } from '@/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white/80',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
};

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'error' && 'bg-red-400',
            variant === 'info' && 'bg-brand-400',
            variant === 'default' && 'bg-white/60',
          )}
        />
      )}
      {children}
    </span>
  );
}

export function StatusIndicator({
  status,
  label,
}: {
  status: 'online' | 'warning' | 'error' | 'offline';
  label?: string;
}) {
  const dotClass = {
    online: 'status-dot-online',
    warning: 'status-dot-warning',
    error: 'status-dot-error',
    offline: 'bg-white/30',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('status-dot', dotClass[status])} />
      {label && <span className="text-sm text-white/70">{label}</span>}
    </div>
  );
}
