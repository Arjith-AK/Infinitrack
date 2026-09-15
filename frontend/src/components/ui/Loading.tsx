import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-2 border-white/20 border-t-brand-500 rounded-full animate-spin`}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-white/50 text-sm">Loading...</p>
    </div>
  );
}

export function StartupScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-dark"
      onAnimationComplete={() => setTimeout(onComplete, 2000)}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-2xl shadow-brand-600/40">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">InfiniTrack</h1>
          <p className="text-white/50 mt-1">AI Powered Sports Field Marking Robot</p>
        </div>
        <LoadingSpinner />
      </motion.div>
    </motion.div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-4xl mb-4 text-white/30">{icon}</div>}
      <h3 className="text-lg font-semibold text-white/80">{title}</h3>
      {description && <p className="text-sm text-white/40 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
