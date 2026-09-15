import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header, TelemetryBar, MissionProgressBar } from './Header';
import { useUIStore } from '@/stores';
import { cn } from '@/utils';

interface AppShellProps {
  showTelemetry?: boolean;
  showMissionProgress?: boolean;
  fullWidth?: boolean;
}

export function AppShell({
  showTelemetry = false,
  showMissionProgress = false,
  fullWidth = false,
}: AppShellProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          collapsed ? 'ml-[72px]' : 'ml-[240px]',
        )}
      >
        <Header />
        <main className={cn('flex-1 overflow-auto', !fullWidth && 'p-4')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        {showMissionProgress && <MissionProgressBar />}
        {showTelemetry && <TelemetryBar />}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
