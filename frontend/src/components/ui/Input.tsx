import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">{icon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'input-field',
              icon && 'pl-10',
              error && 'border-red-500/50 focus:ring-red-500/50',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-white/70">{label}</label>
      )}
      <select className={cn('input-field appearance-none cursor-pointer', className)} {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface-dark">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = '%' }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="text-brand-400 font-medium">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-brand-500/50"
      />
    </div>
  );
}
