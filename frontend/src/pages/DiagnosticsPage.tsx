import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Gauge';
import { useRobotStore } from '@/stores/robotStore';

export default function DiagnosticsPage() {
  const telemetry = useRobotStore((s) => s.telemetry);

  const systems = [
    { name: 'GPS Module', status: telemetry.gpsSignal === 'good' ? 'ok' : 'warning', detail: `${telemetry.satellites} satellites, ${telemetry.gpsAccuracy.toFixed(1)}m accuracy` },
    { name: 'IMU (BNO055)', status: 'ok', detail: 'Calibrated, heading stable' },
    { name: 'Motor Drivers', status: telemetry.motorTemp > 60 ? 'warning' : 'ok', detail: `Temp: ${telemetry.motorTemp}°C` },
    { name: 'Wheel Encoders', status: 'ok', detail: 'All 4 encoders responding' },
    { name: 'Powder Hopper', status: telemetry.powderLevel < 20 ? 'warning' : 'ok', detail: `${telemetry.powderLevel}% remaining` },
    { name: 'Camera', status: 'ok', detail: 'Streaming at 30fps' },
    { name: 'Wi-Fi', status: telemetry.wifiConnected ? 'ok' : 'error', detail: telemetry.wifiConnected ? 'Connected' : 'Disconnected' },
    { name: 'Emergency Stop', status: 'ok', detail: 'Circuit normal' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Diagnostics" subtitle="Robot system health and diagnostics" />

      <div className="grid grid-cols-2 gap-4">
        {systems.map((sys) => (
          <Card key={sys.name} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{sys.name}</h3>
                <p className="text-sm text-white/40 mt-1">{sys.detail}</p>
              </div>
              <Badge
                variant={sys.status === 'ok' ? 'success' : sys.status === 'warning' ? 'warning' : 'error'}
                dot
              >
                {sys.status === 'ok' ? 'Normal' : sys.status === 'warning' ? 'Warning' : 'Error'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card title="System Resources" padding="md">
        <div className="space-y-4">
          <ProgressBar value={telemetry.battery} label="Battery" color="bg-emerald-500" />
          <ProgressBar value={telemetry.powderLevel} label="Powder Level" color="bg-white" />
          <ProgressBar value={(telemetry.motorTemp / 80) * 100} label="Motor Temperature" color="bg-amber-500" />
          <ProgressBar value={85} label="CPU Usage" color="bg-brand-500" />
          <ProgressBar value={62} label="Memory Usage" color="bg-purple-500" />
        </div>
      </Card>
    </div>
  );
}
