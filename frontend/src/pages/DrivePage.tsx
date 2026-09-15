import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { BatteryIndicator, PowderIndicator } from '@/components/ui/Gauge';
import {
  SteeringWheel,
  Speedometer,
  PedalControl,
  JoystickControl,
  CompassDisplay,
  EmergencyStopButton,
  ClearEmergencyStopButton,
  PowderButton,
  CruiseControl,
} from '@/components/drive/DriveControls';
import { useRobotStore } from '@/stores/robotStore';
import { robotWebSocket } from '@/services/websocket/robotWebSocket';
import { formatHeading, formatCoordinate } from '@/utils';

export default function DrivePage() {
  const telemetry = useRobotStore((s) => s.telemetry);
  const driveCommand = useRobotStore((s) => s.driveCommand);
  const setDriveCommand = useRobotStore((s) => s.setDriveCommand);
  const emergencyStop = useRobotStore((s) => s.emergencyStop);
  const [cruiseSpeed, setCruiseSpeed] = useState(60);

  const sendCommand = (updates: Partial<typeof driveCommand>) => {
    setDriveCommand(updates);
    robotWebSocket.sendDriveCommand({ ...driveCommand, ...updates });
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-8rem)]">
      <div className="col-span-3 flex flex-col gap-4">
        <Card title="Live GPS" padding="md">
          <div className="space-y-2 text-sm">
            <InfoRow label="Position" value={formatCoordinate(telemetry.position.lat, telemetry.position.lng)} />
            <InfoRow label="Accuracy" value={`${telemetry.gpsAccuracy.toFixed(2)}m`} />
            <InfoRow label="Satellites" value={String(telemetry.satellites)} />
            <InfoRow label="Heading" value={formatHeading(telemetry.heading)} />
          </div>
        </Card>

        <Card title="System Status" padding="md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Battery</span>
              <BatteryIndicator level={telemetry.battery} charging={telemetry.batteryCharging} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">Powder</span>
              <PowderIndicator level={telemetry.powderLevel} />
            </div>
            <InfoRow label="Motor Temp" value={`${telemetry.motorTemp}°C`} />
            <Badge variant={telemetry.status === 'ready' ? 'success' : 'warning'} dot>
              {telemetry.status}
            </Badge>
          </div>
        </Card>

        <CompassDisplay heading={telemetry.heading} />
        <CruiseControl speed={cruiseSpeed} onChange={setCruiseSpeed} />
      </div>

      <div className="col-span-6 flex flex-col items-center justify-center gap-6">
        <Speedometer speed={telemetry.speed} />

        <div className="flex items-end gap-8">
          <PedalControl
            label="Brake"
            variant="brake"
            active={driveCommand.brake}
            onPress={() => sendCommand({ brake: true, throttle: 0 })}
            onRelease={() => sendCommand({ brake: false })}
          />
          <SteeringWheel />
          <PedalControl
            label="Gas"
            variant="accelerator"
            active={driveCommand.throttle > 0}
            onPress={() => sendCommand({ throttle: cruiseSpeed / 100, brake: false, reverse: false })}
            onRelease={() => sendCommand({ throttle: 0 })}
          />
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => sendCommand({ reverse: false, throttle: 0.3 })}
            className="px-6 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold"
          >
            ▲ Forward
          </button>
          <PowderButton
            active={driveCommand.powder}
            onToggle={() => sendCommand({ powder: !driveCommand.powder })}
          />
          <button
            onClick={() => sendCommand({ reverse: true, throttle: 0.2 })}
            className="px-6 py-3 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 font-semibold"
          >
            ▼ Reverse
          </button>
        </div>

        <div className="w-full max-w-md">
          {telemetry.status === 'emergency_stop' ? (
            <ClearEmergencyStopButton onClear={() => { setDriveCommand({ emergencyStop: false }); robotWebSocket.stop(); }} />
          ) : (
            <EmergencyStopButton onStop={() => { emergencyStop(); robotWebSocket.emergencyStop(); }} />
          )}
        </div>
      </div>

      <div className="col-span-3 flex flex-col gap-4">
        <Card title="Camera Feed" padding="none" className="overflow-hidden">
          <CameraFeed />
        </Card>

        <Card title="Joystick" padding="md">
          <div className="flex justify-center">
            <JoystickControl />
          </div>
        </Card>

        <Card title="Drive Mode" padding="md">
          <div className="grid grid-cols-2 gap-2">
            <ModeButton label="Manual" active />
            <ModeButton label="Autonomous" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium text-xs">{value}</span>
    </div>
  );
}

function ModeButton({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={`py-2 rounded-lg text-sm font-medium border transition-all
        ${active ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'bg-white/5 border-white/10 text-white/50'}`}
    >
      {label}
    </button>
  );
}
