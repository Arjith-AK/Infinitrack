import { useCallback, useEffect } from 'react';
import { MapView } from '@/components/map/MapView';
import {
  MeasurementPanel,
  SportSelector,
  MissionPreviewCard,
  MissionFlowSteps,
  CustomLayoutUpload,
} from '@/components/gps/GpsPanels';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Slider, Select } from '@/components/ui/Input';
import { useMissionStore } from '@/stores';
import { useRobotStore } from '@/stores/robotStore';
import { useUIStore } from '@/stores';
import { calculatePolygonMetrics } from '@/utils/geo/polygonMetrics';
import { robotWebSocket } from '@/services/websocket/robotWebSocket';
import type { GeoCoordinate, SportType } from '@/types';

export default function GpsPage() {
  const {
    selectedSport,
    metrics,
    generatedField,
    currentMission,
    lineWidth,
    fieldType,
    powderFlow,
    drivingSpeed,
    customLayoutImage,
    customLayoutStatus,
    customLayoutError,
    customLayoutPaths,
    setSport,
    setPolygon,
    setCustomLayoutImage,
    clearCustomLayoutImage,
    generateLayout,
    previewMission,
    uploadMission,
    saveJob,
    setFieldSettings,
    setMissionStatus,
  } = useMissionStore();

  const telemetry = useRobotStore((s) => s.telemetry);
  const addNotification = useUIStore((s) => s.addNotification);

  // Surface real robot errors (e.g. GPS_UNAVAILABLE, INVALID_STATE) instead
  // of failing silently -- see the robot project's README section 9.13 for
  // the full error code list.
  useEffect(() => {
    return robotWebSocket.on('error', (message) => {
      addNotification({
        title: 'Robot Error',
        message: message.message ?? message.code ?? 'Unknown robot error',
        type: 'error',
      });
    });
  }, [addNotification]);

  const handlePolygonChange = useCallback(
    (coords: GeoCoordinate[] | null) => {
      if (!coords) {
        setPolygon(null, null);
        return;
      }
      const calculated = calculatePolygonMetrics(coords);
      setPolygon(coords, calculated);
    },
    [setPolygon],
  );

  const handleGenerateLayout = () => {
    if (selectedSport === 'custom' && customLayoutStatus !== 'ready') {
      addNotification({
        title: 'Upload a layout image first',
        message: 'Custom mode needs an uploaded layout image before it can generate lines',
        type: 'error',
      });
      return;
    }
    generateLayout();
    addNotification({ title: 'Layout Generated', message: 'Field lines generated successfully', type: 'success' });
  };

  const handlePreview = () => {
    previewMission();
    addNotification({ title: 'Mission Preview', message: 'Mission preview ready', type: 'info' });
  };

  const handleUpload = () => {
    const mission = uploadMission();
    if (!mission) return;
    // The robot has no separate "stage a mission" step -- START_GPS_MODE
    // (README 9.5) is the closest equivalent: it arms the robot for GPS
    // navigation and is a required precondition for START_MISSION below.
    robotWebSocket.startGpsMode();
    addNotification({ title: 'Mission Uploaded', message: 'Robot switched to GPS mode and is ready to start', type: 'success' });
  };

  const handleStartMission = () => {
    if (!currentMission) return;
    const waypoints = currentMission.waypoints.map((w) => ({ lat: w.lat, lon: w.lng }));
    robotWebSocket.startMission(currentMission.name, waypoints);
    setMissionStatus('running');
    addNotification({ title: 'Mission Started', message: 'Robot is now marking the field', type: 'success' });
  };

  const handleAddToJobs = () => {
    if (!generatedField) {
      addNotification({
        title: 'Generate a layout first',
        message: 'Draw a polygon and click "Generate Layout" before adding the job',
        type: 'error',
      });
      return;
    }
    const job = saveJob(`Field Job ${Date.now()}`, 'Ground Area');
    if (!job) {
      addNotification({ title: 'Job Not Saved', message: 'Could not create a job from the current field', type: 'error' });
      return;
    }
    addNotification({ title: 'Job Saved', message: 'Field area added to jobs', type: 'success' });
  };

  const handleDrawError = (message: string) => {
    addNotification({ title: 'Polygon Incomplete', message, type: 'error' });
  };

  const activeStep = generatedField ? (currentMission ? 2 : 1) : metrics ? 0 : -1;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-3 -m-4 p-4">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10">
          <MapView
            onPolygonChange={handlePolygonChange}
            onDrawError={handleDrawError}
            fieldOverlay={generatedField}
            robotPosition={telemetry.position}
          />
          <div className="absolute top-3 right-3 z-10">
            <MeasurementPanel metrics={metrics} onAddToJobs={handleAddToJobs} addToJobsDisabled={!generatedField} />
          </div>

          <div className="absolute bottom-3 left-3 right-16 z-10 glass-panel flex items-center gap-3 px-4 py-2 backdrop-blur-xl overflow-x-auto">
            <TelemetryItem label="Heading" value={`${telemetry.heading.toFixed(0)}°`} />
            <TelemetryItem label="Speed" value={`${telemetry.speed.toFixed(1)} m/s`} />
            <TelemetryItem label="GPS Accuracy" value={`${telemetry.gpsAccuracy.toFixed(2)}m`} />
            <TelemetryItem label="Satellites" value={String(telemetry.satellites)} />
            <TelemetryItem
              label="Robot Position"
              value={`${telemetry.position.lat.toFixed(4)}°, ${telemetry.position.lng.toFixed(4)}°`}
            />
            <TelemetryItem label="Motor Temp" value={`${telemetry.motorTemp}°C`} />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <MissionFlowSteps
            steps={[
              { label: 'Original Area' },
              { label: 'Generated Layout' },
              { label: 'Mission Preview' },
            ]}
            activeStep={activeStep}
          />
          {currentMission && (
            <MissionPreviewCard
              totalLines={generatedField?.lines.length ?? 0}
              distance={currentMission.distance}
              estimatedTime={currentMission.estimatedTime}
              powderRequired={currentMission.powderUsage}
            />
          )}
        </div>
      </div>

      <div className="w-72 flex flex-col gap-3 shrink-0 overflow-y-auto">
        <Card title="1. Select Sport" padding="md">
          <SportSelector selected={selectedSport} onSelect={(s) => setSport(s as SportType)} />
          {selectedSport === 'custom' && (
            <CustomLayoutUpload
              imageUrl={customLayoutImage}
              status={customLayoutStatus}
              pathCount={customLayoutPaths?.length ?? 0}
              error={customLayoutError}
              onUpload={setCustomLayoutImage}
              onClear={clearCustomLayoutImage}
            />
          )}
        </Card>

        <Card title="2. Field Settings" padding="md">
          <div className="space-y-4">
            <Select
              label="Line Width"
              value={String(lineWidth)}
              onChange={(e) => setFieldSettings({ lineWidth: Number(e.target.value) })}
              options={[
                { value: '10', label: '10 cm' },
                { value: '12', label: '12 cm' },
                { value: '15', label: '15 cm' },
              ]}
            />
            <Select
              label="Field Type"
              value={fieldType}
              onChange={(e) => setFieldSettings({ fieldType: e.target.value })}
              options={[
                { value: 'Full Size', label: 'Full Size' },
                { value: 'Half Size', label: 'Half Size' },
                { value: 'Training', label: 'Training' },
              ]}
            />
            <Slider label="Powder Flow" value={powderFlow} onChange={(v) => setFieldSettings({ powderFlow: v })} />
            <Slider label="Driving Speed" value={drivingSpeed} onChange={(v) => setFieldSettings({ drivingSpeed: v })} />
          </div>
        </Card>

        <Card title="3. Mission Control" padding="md">
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleGenerateLayout}
              disabled={!metrics || (selectedSport === 'custom' && customLayoutStatus !== 'ready')}
            >
              Generate Layout
            </Button>
            <Button className="w-full" variant="secondary" onClick={handlePreview} disabled={!generatedField}>
              Preview Lines
            </Button>
            <Button className="w-full" variant="secondary" onClick={handleUpload} disabled={!currentMission}>
              Upload Mission
            </Button>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="success" size="lg" onClick={handleStartMission}>
                Start Mission
              </Button>
              <Button
                variant="warning"
                size="lg"
                onClick={() => {
                  robotWebSocket.pause();
                  setMissionStatus('paused');
                }}
              >
                Pause
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                robotWebSocket.resume();
                setMissionStatus('running');
              }}
            >
              Resume
            </Button>
            {telemetry.status === 'emergency_stop' ? (
              <Button
                variant="warning"
                className="w-full"
                size="lg"
                onClick={() => robotWebSocket.stop()}
              >
                Clear Emergency Stop
              </Button>
            ) : (
              <Button
                variant="danger"
                className="w-full"
                size="lg"
                onClick={() => {
                  robotWebSocket.emergencyStop();
                  setMissionStatus('failed');
                }}
              >
                ⛔ EMERGENCY STOP
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TelemetryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-medium text-white truncate">{value}</p>
    </div>
  );
}
