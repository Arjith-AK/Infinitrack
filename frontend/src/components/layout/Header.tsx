import { HiOutlineBell, HiOutlineWifi, HiOutlineSun } from 'react-icons/hi';
import { useRobotStore } from '@/stores/robotStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores';
import { Badge } from '@/components/ui/Badge';
import { BatteryIndicator } from '@/components/ui/Gauge';
import { formatHeading } from '@/utils';

export function Header() {
  const telemetry = useRobotStore((s) => s.telemetry);
  const user = useAuthStore((s) => s.user);
  const notifications = useUIStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-14 glass border-b border-white/10 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-6">
        <StatusPill
          label="GPS"
          value={telemetry.connected ? 'Connected' : 'Disconnected'}
          detail={`${telemetry.gpsAccuracy.toFixed(1)}m accuracy`}
          variant={telemetry.gpsSignal === 'good' || telemetry.gpsSignal === 'excellent' ? 'success' : 'warning'}
        />
        <StatusPill
          label="Satellites"
          value={`${telemetry.satellites}`}
          detail={telemetry.gpsSignal === 'good' ? 'Good Signal' : 'Fair Signal'}
          variant="info"
        />
        <StatusPill
          label="Battery"
          value={`${telemetry.battery}%`}
          detail={telemetry.batteryCharging ? 'Charging' : 'Discharging'}
          variant={telemetry.battery > 30 ? 'success' : 'warning'}
        />
        <StatusPill
          label="Robot"
          value={telemetry.status === 'ready' ? 'Ready' : telemetry.status}
          detail="All Systems Normal"
          variant="success"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <HiOutlineSun className="w-4 h-4" />
          <span>{telemetry.temperature}°C</span>
        </div>
        <HiOutlineWifi className={`w-5 h-5 ${telemetry.wifiConnected ? 'text-emerald-400' : 'text-white/30'}`} />
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
          <HiOutlineBell className="w-5 h-5 text-white/60" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) ?? 'O'}
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  label,
  value,
  detail,
  variant,
}: {
  label: string;
  value: string;
  detail: string;
  variant: 'success' | 'warning' | 'info' | 'error';
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant} dot>{label}</Badge>
      <div>
        <p className="text-sm font-semibold text-white leading-none">{value}</p>
        <p className="text-[10px] text-white/40">{detail}</p>
      </div>
    </div>
  );
}

export function TelemetryBar() {
  const telemetry = useRobotStore((s) => s.telemetry);

  return (
    <div className="glass border-t border-white/10 px-6 py-3 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-6">
        <MiniStat label="Heading" value={formatHeading(telemetry.heading)} />
        <MiniStat label="Speed" value={`${telemetry.speed.toFixed(2)} m/s`} />
        <MiniStat label="GPS Accuracy" value={`${telemetry.gpsAccuracy.toFixed(2)}m`} />
        <MiniStat label="Satellites" value={`${telemetry.satellites}`} />
        <MiniStat
          label="Position"
          value={`${telemetry.position.lat.toFixed(4)}°, ${telemetry.position.lng.toFixed(4)}°`}
        />
        <MiniStat label="Distance Remaining" value={`${telemetry.distanceRemaining.toFixed(1)}m`} />
        <MiniStat label="Motor Temp" value={`${telemetry.motorTemp}°C`} />
      </div>
      <div className="flex items-center gap-4">
        <BatteryIndicator level={telemetry.battery} charging={telemetry.batteryCharging} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}

export function MissionProgressBar() {
  const telemetry = useRobotStore((s) => s.telemetry);

  if (telemetry.missionProgress <= 0) return null;

  return (
    <div className="px-6 py-2 bg-brand-600/10 border-t border-brand-500/20 shrink-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Marking Progress</span>
        <span className="text-xs text-brand-400">{Math.round(telemetry.missionProgress)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${telemetry.missionProgress}%` }}
        />
      </div>
    </div>
  );
}
