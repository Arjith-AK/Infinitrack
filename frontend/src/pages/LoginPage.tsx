import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'operator@infintrack.com', password: 'demo123' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login(
      { id: '1', email: data.email, name: 'Operator', role: 'operator' },
      { accessToken: 'demo-token', refreshToken: 'demo-refresh' },
    );
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-600/30">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">InfiniTrack</h1>
          <p className="text-white/50 mt-1">AI Powered Sports Field Marking Robot</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              icon={<HiOutlineMail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              icon={<HiOutlineLockClosed className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>
          <p className="text-xs text-white/30 text-center mt-4">
            Demo: operator@infintrack.com / demo123
          </p>
        </div>
      </motion.div>
    </div>
  );
}
