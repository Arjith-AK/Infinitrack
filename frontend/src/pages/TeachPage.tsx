import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useRobotStore } from '@/stores/robotStore';
import { useUIStore } from '@/stores';
import { robotWebSocket } from '@/services/websocket/robotWebSocket';
import { generateId } from '@/utils';
import type { TeachRecording } from '@/types';

export default function TeachPage() {
  const telemetry = useRobotStore((s) => s.telemetry);
  const addNotification = useUIStore((s) => s.addNotification);
  const [recording, setRecording] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [missionName, setMissionName] = useState('');
  const [recordings, setRecordings] = useState<TeachRecording[]>([]);

  // The robot itself records points during TEACH_MODE (README section 9.9) --
  // this just mirrors its own reported recording state/count and captures the
  // finished path, rather than sampling telemetry locally like a fake recorder.
  useEffect(() => {
    const offStatus = robotWebSocket.on('robot_status', (message) => {
      setRecording(Boolean(message.teach_recording));
      setPointCount(Number(message.teach_point_count) || 0);
    });

    const offPath = robotWebSocket.on('teach_path', (message) => {
      const points = Array.isArray(message.points) ? message.points : [];
      const rec: TeachRecording = {
        id: generateId(),
        name: message.mission_name ?? 'recording',
        points: points.map((p: Record<string, number>) => ({
          timestamp: (p.timestamp ?? 0) * 1000,
          position: { lat: p.lat ?? 0, lng: p.lon ?? 0 },
          heading: p.heading_deg ?? 0,
          speed: p.speed_mps ?? 0,
          powder: false,
        })),
        createdAt: new Date().toISOString(),
      };
      setRecordings((prev) => [rec, ...prev]);
      addNotification({
        title: 'Recording Saved',
        message: `Recorded ${rec.points.length} waypoints`,
        type: 'success',
      });
    });

    const offError = robotWebSocket.on('error', (message) => {
      addNotification({
        title: 'Robot Error',
        message: message.message ?? message.code ?? 'Unknown robot error',
        type: 'error',
      });
    });

    return () => {
      offStatus();
      offPath();
      offError();
    };
  }, [addNotification]);

  const startRecording = useCallback(() => {
    const name = missionName.trim() || `recording-${Date.now()}`;
    setMissionName(name);
    robotWebSocket.sendCommand('START_TEACH', { mission_name: name });
    addNotification({ title: 'Recording Started', message: 'Drive the robot to record a path', type: 'info' });
  }, [missionName, addNotification]);

  const stopRecording = useCallback(() => {
    robotWebSocket.sendCommand('STOP_TEACH');
    robotWebSocket.sendCommand('GET_TEACH_PATH', { mission_name: missionName });
  }, [missionName]);

  const replayRecording = useCallback(
    (name: string) => {
      robotWebSocket.sendCommand('REPLAY_PATH', { mission_name: name });
      addNotification({ title: 'Replay Started', message: `Robot is replaying "${name}"`, type: 'info' });
    },
    [addNotification],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teach Mode"
        subtitle="Drive the robot to record a GPS path it can replay later"
        action={
          <Badge variant={recording ? 'error' : 'default'} dot>
            {recording ? 'Recording' : 'Ready'}
          </Badge>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card title="Controls" padding="md">
          <div className="space-y-3">
            {!recording && (
              <Input
                placeholder="Recording name (optional)"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
              />
            )}
            {!recording ? (
              <Button className="w-full" variant="success" onClick={startRecording}>
                Start Recording
              </Button>
            ) : (
              <Button className="w-full" variant="danger" onClick={stopRecording}>
                Stop Recording
              </Button>
            )}
            <div className="text-sm space-y-1">
              <InfoRow label="Points" value={String(pointCount)} />
            </div>
          </div>
        </Card>

        <Card title="Live Telemetry" padding="md" className="col-span-2">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <InfoRow label="Lat" value={telemetry.position.lat.toFixed(6)} />
            <InfoRow label="Lng" value={telemetry.position.lng.toFixed(6)} />
            <InfoRow label="Heading" value={`${telemetry.heading.toFixed(0)}°`} />
            <InfoRow label="Speed" value={`${telemetry.speed.toFixed(2)} m/s`} />
            <InfoRow label="GPS Accuracy" value={`${telemetry.gpsAccuracy.toFixed(2)}m`} />
            <InfoRow label="Satellites" value={String(telemetry.satellites)} />
          </div>
        </Card>
      </div>

      <Card title="Saved Recordings" padding="md">
        {recordings.length === 0 ? (
          <p className="text-white/40 text-sm">No recordings yet. Start recording to teach the robot a path.</p>
        ) : (
          <div className="space-y-2">
            {recordings.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                <div>
                  <p className="font-medium text-white">{rec.name}</p>
                  <p className="text-xs text-white/40">{rec.points.length} waypoints</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => replayRecording(rec.name)}>
                  Replay on Robot
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
