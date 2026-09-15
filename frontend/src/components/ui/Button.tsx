import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25',
  secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25',
  ghost: 'bg-transparent hover:bg-white/10 text-white/80 hover:text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25',
  warning: 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-2xl font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
