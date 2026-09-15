import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { mainNavItems } from '@/config/navigation';
import { useUIStore } from '@/stores';
import { useRobotStore } from '@/stores/robotStore';
import { cn } from '@/utils';
import { Badge } from '@/components/ui/Badge';

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const telemetry = useRobotStore((s) => s.telemetry);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col glass border-r border-white/10"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="font-bold text-white text-lg leading-tight">InfiniTrack</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Field Robot</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-white/10">
          <div className="glass-panel p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-white/60">
                  <rect x="8" y="14" width="24" height="16" rx="2" fill="currentColor" opacity="0.3" />
                  <circle cx="12" cy="32" r="3" fill="currentColor" />
                  <circle cx="28" cy="32" r="3" fill="currentColor" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">InfiniTrack V1</p>
                <Badge variant="success" dot>{telemetry.status === 'ready' ? 'Ready' : telemetry.status}</Badge>
              </div>
            </div>
            <div className="text-[10px] text-white/40 space-y-0.5">
              <p>ID: {telemetry.robotId}</p>
              <p>FW: {telemetry.firmware}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={toggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-brand-600 border border-brand-500 flex items-center justify-center text-white shadow-lg z-50"
      >
        {collapsed ? <HiOutlineChevronRight className="w-3 h-3" /> : <HiOutlineChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
