import { motion } from 'framer-motion';
import { cn } from '@/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  title,
  subtitle,
  action,
  padding = 'md',
  hover = false,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn('glass-card', paddingMap[padding], className)}
    >
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.div>
  );
}

export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('glass-panel p-4', className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-white/50',
  };

  return (
    <Card className={cn('flex flex-col gap-1', className)} padding="sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-white/40">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className={cn('text-sm', trend ? trendColors[trend] : 'text-white/50')}>{unit}</span>}
      </div>
    </Card>
  );
}
