import { useNavigate } from 'react-router-dom';
import {
  HiOutlineMap,
  HiOutlinePlay,
  HiOutlineBriefcase,
  HiOutlineChip,
} from 'react-icons/hi';
import { PageHeader } from '@/components/layout/AppShell';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Gauge';
import { useRobotStore } from '@/stores/robotStore';
import { useMissionStore } from '@/stores';
import { formatDate, formatDistance } from '@/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const activityData = [
  { day: 'Mon', missions: 2, distance: 1200 },
  { day: 'Tue', missions: 3, distance: 1800 },
  { day: 'Wed', missions: 1, distance: 600 },
  { day: 'Thu', missions: 4, distance: 2400 },
  { day: 'Fri', missions: 2, distance: 1500 },
  { day: 'Sat', missions: 5, distance: 3200 },
  { day: 'Sun', missions: 1, distance: 800 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const telemetry = useRobotStore((s) => s.telemetry);
  const jobs = useMissionStore((s) => s.jobs);

  const quickActions = [
    { label: 'GPS Mode', icon: HiOutlineMap, path: '/gps', color: 'from-brand-600 to-brand-800' },
    { label: 'Drive', icon: HiOutlinePlay, path: '/drive', color: 'from-emerald-600 to-emerald-800' },
    { label: 'Jobs', icon: HiOutlineBriefcase, path: '/jobs', color: 'from-amber-600 to-amber-800' },
    { label: 'Diagnostics', icon: HiOutlineChip, path: '/diagnostics', color: 'from-purple-600 to-purple-800' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back · ${formatDate(new Date())}`}
        action={
          <Badge variant={telemetry.connected ? 'success' : 'error'} dot>
            {telemetry.connected ? 'Robot Connected' : 'Robot Offline'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Battery" value={telemetry.battery} unit="%" trend={telemetry.battery > 50 ? 'up' : 'down'} />
        <StatCard label="GPS Accuracy" value={telemetry.gpsAccuracy.toFixed(1)} unit="m" />
        <StatCard label="Powder Level" value={telemetry.powderLevel} unit="%" />
        <StatCard label="Active Jobs" value={jobs.length} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`glass-card p-6 text-left hover:scale-[1.02] transition-transform bg-gradient-to-br ${action.color}`}
          >
            <action.icon className="w-8 h-8 text-white mb-3" />
            <p className="font-semibold text-white">{action.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Weekly Activity" className="col-span-2" padding="md">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#ffffff40" fontSize={12} />
              <YAxis stroke="#ffffff40" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
              />
              <Area type="monotone" dataKey="distance" stroke="#3b82f6" fill="url(#colorDistance)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Robot Status" padding="md">
          <div className="space-y-4">
            <StatusRow label="Status" value={telemetry.status} variant="success" />
            <StatusRow label="Firmware" value={telemetry.firmware} />
            <StatusRow label="Robot ID" value={telemetry.robotId} />
            <StatusRow label="Motor Temp" value={`${telemetry.motorTemp}°C`} />
            <ProgressBar value={telemetry.missionProgress} label="Mission Progress" />
            <Button className="w-full" onClick={() => navigate('/gps')}>
              Start New Mission
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Recent Jobs" padding="md">
        {jobs.length === 0 ? (
          <p className="text-white/40 text-sm">No jobs yet. Create one in GPS Mode.</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="text-sm font-medium text-white">{job.name}</p>
                  <p className="text-xs text-white/40">{job.groundName} · {job.sport}</p>
                </div>
                <span className="text-xs text-white/50">{formatDistance(job.mission.distance)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusRow({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'success' | 'warning';
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-white/50">{label}</span>
      {variant ? (
        <Badge variant={variant}>{value}</Badge>
      ) : (
        <span className="text-sm font-medium text-white">{value}</span>
      )}
    </div>
  );
}
