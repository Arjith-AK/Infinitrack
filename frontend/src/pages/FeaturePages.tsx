import { FeaturePage, FeatureGrid } from '@/components/common/FeaturePage';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { AiChat } from '@/components/assistant/AiChat';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Gauge';
import { useRobotStore } from '@/stores/robotStore';
import { useUIStore, useMissionStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { allRoutes } from '@/config/navigation';
import type { IconType } from 'react-icons';

function createSimplePage(title: string, subtitle?: string, Icon?: IconType) {
  return function SimplePage() {
    return <FeaturePage title={title} subtitle={subtitle} icon={Icon} />;
  };
}

export const RobotCalibrationPage = () => (
  <FeaturePage title="Robot Calibration" subtitle="Calibrate robot sensors and actuators">
    <FeatureGrid items={[
      { label: 'GPS', value: 'Ready', status: 'Calibrated' },
      { label: 'IMU', value: 'Ready', status: 'Calibrated' },
      { label: 'Encoders', value: 'Ready', status: 'Calibrated' },
      { label: 'Motors', value: 'Ready', status: 'Calibrated' },
    ]} />
    <Card className="mt-4" padding="md">
      <Button>Start Full Calibration</Button>
    </Card>
  </FeaturePage>
);

export const CameraPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Camera" subtitle={`Live camera feed · Robot ${telemetry.robotId}`}>
      <Card padding="none" className="overflow-hidden">
        <CameraFeed showControls />
      </Card>
    </FeaturePage>
  );
};

export const GpsCalibrationPage = () => (
  <FeaturePage title="GPS Calibration" subtitle="Calibrate u-blox MAX-M10S GPS module">
    <FeatureGrid items={[
      { label: 'Satellites', value: '21', status: 'Good' },
      { label: 'Accuracy', value: '0.82m', status: 'Excellent' },
      { label: 'Fix Type', value: '3D Fix' },
      { label: 'Update Rate', value: '10 Hz' },
    ]} />
    <Card className="mt-4" padding="md">
      <Button>Run GPS Calibration</Button>
    </Card>
  </FeaturePage>
);

export const PowderCalibrationPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Powder Calibration" subtitle="Calibrate powder hopper and servo valve">
      <FeatureGrid items={[
        { label: 'Powder Level', value: `${telemetry.powderLevel}%` },
        { label: 'Flow Rate', value: `${telemetry.powderFlow}%` },
        { label: 'Servo Valve', value: 'OK', status: 'Normal' },
        { label: 'Vibration Motor', value: 'OK', status: 'Normal' },
      ]} />
      <Card className="mt-4" padding="md">
        <div className="flex gap-3">
          <Button>Dispense Test</Button>
          <Button variant="secondary">Calibrate Flow</Button>
        </div>
      </Card>
    </FeaturePage>
  );
};

export const MotorCalibrationPage = () => (
  <FeaturePage title="Motor Calibration" subtitle="Calibrate BTS7960 motor drivers and encoders">
    <FeatureGrid items={[
      { label: 'Front Left', value: 'OK' },
      { label: 'Front Right', value: 'OK' },
      { label: 'Rear Left', value: 'OK' },
      { label: 'Rear Right', value: 'OK' },
    ]} />
    <Card className="mt-4" padding="md">
      <Button>Run Motor Test Sequence</Button>
    </Card>
  </FeaturePage>
);

export const MissionPlannerPage = () => (
  <FeaturePage title="Mission Planner" subtitle="Plan and schedule field marking missions">
    <Card padding="md">
      <p className="text-white/50 text-sm mb-4">Use GPS Mode to draw field boundaries and generate missions.</p>
      <Button onClick={() => window.location.href = '/gps'}>Open GPS Mode</Button>
    </Card>
  </FeaturePage>
);

export const MissionPreviewPage = () => {
  const mission = useMissionStore((s) => s.currentMission);
  const field = useMissionStore((s) => s.generatedField);
  return (
    <FeaturePage title="Mission Preview" subtitle="Preview generated field lines and waypoints">
      {mission ? (
        <FeatureGrid items={[
          { label: 'Total Lines', value: String(field?.lines.length ?? 0) },
          { label: 'Distance', value: `${mission.distance.toFixed(1)}m` },
          { label: 'Est. Time', value: `${Math.round(mission.estimatedTime / 60)} min` },
          { label: 'Powder', value: `${mission.powderUsage.toFixed(1)} kg` },
          { label: 'Battery', value: `${mission.batteryUsage.toFixed(0)}%` },
          { label: 'Turns', value: String(mission.numberOfTurns) },
        ]} />
      ) : (
        <Card padding="md"><p className="text-white/40">No mission to preview. Generate a layout in GPS Mode first.</p></Card>
      )}
    </FeaturePage>
  );
};

export const LiveRobotPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Live Robot" subtitle="Real-time robot monitoring">
      <FeatureGrid items={[
        { label: 'Status', value: telemetry.status },
        { label: 'Speed', value: `${telemetry.speed.toFixed(2)} m/s` },
        { label: 'Heading', value: `${telemetry.heading.toFixed(0)}°` },
        { label: 'Progress', value: `${telemetry.missionProgress.toFixed(0)}%` },
      ]} />
      <Card className="mt-4" padding="md">
        <ProgressBar value={telemetry.missionProgress} label="Mission Progress" />
      </Card>
    </FeaturePage>
  );
};

export const FirmwareUpdatePage = () => (
  <FeaturePage title="Firmware Update" subtitle="Update robot firmware over-the-air">
    <FeatureGrid items={[
      { label: 'Current Version', value: 'v1.2.4' },
      { label: 'Latest Version', value: 'v1.2.4' },
      { label: 'Status', value: 'Up to date', status: 'Current' },
    ]} />
    <Card className="mt-4" padding="md">
      <input type="file" accept=".bin,.hex" className="input-field mb-3" />
      <Button>Upload Firmware</Button>
    </Card>
  </FeaturePage>
);

export const UserManagementPage = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <FeaturePage title="User Management" subtitle="Manage operators and permissions">
      <Card padding="md">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <div>
            <p className="font-medium text-white">{user?.name ?? 'Operator'}</p>
            <p className="text-sm text-white/40">{user?.email} · {user?.role}</p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
      </Card>
      <Button className="mt-4">Add User</Button>
    </FeaturePage>
  );
};

export const NotificationsPage = () => {
  const notifications = useUIStore((s) => s.notifications);
  const markRead = useUIStore((s) => s.markNotificationRead);
  return (
    <FeaturePage title="Notifications" subtitle="System alerts and notifications">
      {notifications.length === 0 ? (
        <Card padding="md"><p className="text-white/40">No notifications</p></Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} padding="sm" className={n.read ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{n.title}</p>
                  <p className="text-sm text-white/40">{n.message}</p>
                </div>
                {!n.read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark Read</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </FeaturePage>
  );
};

export const HistoryPage = createSimplePage('History', 'Mission and activity history');
export const AnalyticsPage = createSimplePage('Analytics', 'Performance analytics and insights');
export const AiAssistantPage = () => (
  <FeaturePage title="AI Assistant" subtitle="AI-powered field marking assistance">
    <Card padding="md">
      <AiChat />
    </Card>
  </FeaturePage>
);

export const MaintenancePage = createSimplePage('Robot Maintenance', 'Maintenance schedules and logs');
export const HelpPage = createSimplePage('Help', 'Documentation and support');
export const AboutPage = () => (
  <FeaturePage title="About InfiniTrack" subtitle="AI Powered Sports Field Marking Robot">
    <Card padding="md">
      <div className="space-y-2 text-sm">
        <p><span className="text-white/50">Version:</span> 1.0.0</p>
        <p><span className="text-white/50">Robot:</span> InfiniTrack V1 (Raspberry Pi 3 B+)</p>
        <p><span className="text-white/50">GPS:</span> u-blox MAX-M10S</p>
        <p><span className="text-white/50">IMU:</span> BNO055</p>
        <p className="text-white/40 pt-2">© 2025 InfiniTrack. All rights reserved.</p>
      </div>
    </Card>
  </FeaturePage>
);

export const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  return (
    <FeaturePage title="Profile" subtitle="Your account settings">
      <Card padding="md">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0) ?? 'O'}
          </div>
          <div>
            <p className="font-semibold text-white text-lg">{user?.name}</p>
            <p className="text-white/50">{user?.email}</p>
            <Badge variant="info">{user?.role}</Badge>
          </div>
        </div>
        <Button variant="secondary">Edit Profile</Button>
      </Card>
    </FeaturePage>
  );
};

export const NetworkPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Network" subtitle="Wi-Fi and connectivity settings">
      <FeatureGrid items={[
        { label: 'Wi-Fi', value: telemetry.wifiConnected ? 'Connected' : 'Disconnected' },
        { label: 'WebSocket', value: telemetry.connected ? 'Connected' : 'Disconnected' },
        { label: 'Signal', value: 'Strong' },
        { label: 'IP Address', value: '192.168.1.100' },
      ]} />
    </FeaturePage>
  );
};

export const LogsPage = createSimplePage('Logs', 'System and robot logs');
export const FieldTemplatesPage = createSimplePage('Field Templates', 'Pre-configured field templates');
export const SavedGroundsPage = createSimplePage('Saved Grounds', 'Saved ground locations');
export const CustomSportsPage = createSimplePage('Custom Sports', 'Define custom sport field layouts');

export const RobotHealthPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Robot Health" subtitle="Overall robot health status">
      <FeatureGrid items={[
        { label: 'Overall', value: 'Good', status: '98% Health' },
        { label: 'Battery Health', value: '95%' },
        { label: 'Motor Health', value: telemetry.motorTemp < 50 ? 'Good' : 'Warning' },
        { label: 'GPS Health', value: 'Excellent' },
      ]} />
    </FeaturePage>
  );
};

export const ManualControlPage = () => (
  <FeaturePage title="Manual Control" subtitle="Direct manual robot control">
    <Card padding="md">
      <Button onClick={() => window.location.href = '/drive'}>Open Drive Interface</Button>
    </Card>
  </FeaturePage>
);

export const AutonomousControlPage = createSimplePage('Autonomous Control', 'Autonomous navigation control');
export const RemoteCameraPage = () => <CameraPage />;
export const CompassPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Compass" subtitle="Digital compass heading">
      <Card padding="md" className="flex justify-center">
        <div className="text-center">
          <p className="text-6xl font-bold text-white">{telemetry.heading.toFixed(0)}°</p>
          <p className="text-white/50 mt-2">Current Heading</p>
        </div>
      </Card>
    </FeaturePage>
  );
};

export const BatteryPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Battery" subtitle="Battery status and management">
      <FeatureGrid items={[
        { label: 'Level', value: `${telemetry.battery}%` },
        { label: 'Status', value: telemetry.batteryCharging ? 'Charging' : 'Discharging' },
        { label: 'Health', value: '95%' },
        { label: 'Voltage', value: '12.4V' },
      ]} />
      <Card className="mt-4" padding="md">
        <ProgressBar value={telemetry.battery} label="Battery Level" color="bg-emerald-500" />
      </Card>
    </FeaturePage>
  );
};

export const WeatherPage = () => {
  const telemetry = useRobotStore((s) => s.telemetry);
  return (
    <FeaturePage title="Weather" subtitle="Local weather conditions">
      <FeatureGrid items={[
        { label: 'Temperature', value: `${telemetry.temperature}°C` },
        { label: 'Conditions', value: 'Clear' },
        { label: 'Wind', value: '5 km/h NE' },
        { label: 'Humidity', value: '45%' },
      ]} />
    </FeaturePage>
  );
};

export const MapExportPage = createSimplePage('Map Export', 'Export map data and overlays');
export const GeoJsonImportPage = createSimplePage('GeoJSON Import', 'Import GeoJSON field data');
export const PolygonEditorPage = () => (
  <FeaturePage title="Polygon Editor" subtitle="Advanced polygon editing">
    <Card padding="md">
      <Button onClick={() => window.location.href = '/gps'}>Open in GPS Mode</Button>
    </Card>
  </FeaturePage>
);
export const RouteOptimizerPage = createSimplePage('Route Optimizer', 'Optimize robot driving routes');
export const WaypointEditorPage = createSimplePage('Waypoint Editor', 'Edit mission waypoints');
export const MissionQueuePage = createSimplePage('Mission Queue', 'Queued missions for execution');
export const FleetReadyPage = createSimplePage('Fleet Ready', 'Multi-robot fleet management');

export const pageComponents: Record<string, React.ComponentType> = {};
allRoutes.forEach((route) => {
  if (!pageComponents[route.path]) {
    pageComponents[route.path] = createSimplePage(route.label, `${route.label} module`);
  }
});
