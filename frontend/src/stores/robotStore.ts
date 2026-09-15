import { create } from 'zustand';
import type { RobotTelemetry, DriveCommand } from '@/types';

// Zeroed/honest placeholders -- NOT fake plausible-looking values. Nothing
// here should be trusted until `connected` is true and a real robot_status
// message has arrived. Note the real robot doesn't report battery %, motor
// temperature, or powder tank level at all (no sensor for any of those in
// the current hardware) -- those fields simply stay at their last known
// value (0 until the first mission) rather than ever being fabricated.
const defaultTelemetry: RobotTelemetry = {
  connected: false,
  robotId: '',
  firmware: '',
  status: 'ready',
  battery: 0,
  batteryCharging: false,
  gpsAccuracy: 0,
  satellites: 0,
  gpsSignal: 'none',
  position: { lat: 0, lng: 0, alt: 0 },
  heading: 0,
  speed: 0,
  motorTemp: 0,
  powderLevel: 0,
  powderFlow: 0,
  distanceRemaining: 0,
  missionProgress: 0,
  lastSync: new Date().toISOString(),
  wifiConnected: false,
  temperature: 0,
};

interface RobotState {
  telemetry: RobotTelemetry;
  driveCommand: DriveCommand;
  wsConnected: boolean;
  setTelemetry: (telemetry: Partial<RobotTelemetry>) => void;
  setDriveCommand: (command: Partial<DriveCommand>) => void;
  resetDriveCommand: () => void;
  setWsConnected: (connected: boolean) => void;
  emergencyStop: () => void;
}

const defaultDriveCommand: DriveCommand = {
  throttle: 0,
  steering: 0,
  brake: false,
  reverse: false,
  powder: false,
  emergencyStop: false,
};

export const useRobotStore = create<RobotState>((set) => ({
  telemetry: defaultTelemetry,
  driveCommand: defaultDriveCommand,
  wsConnected: false,
  setTelemetry: (updates) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...updates },
    })),
  setDriveCommand: (command) =>
    set((state) => ({
      driveCommand: { ...state.driveCommand, ...command },
    })),
  resetDriveCommand: () => set({ driveCommand: defaultDriveCommand }),
  setWsConnected: (connected) =>
    set((state) => ({
      wsConnected: connected,
      telemetry: { ...state.telemetry, connected },
    })),
  emergencyStop: () =>
    set((state) => ({
      driveCommand: { ...defaultDriveCommand, emergencyStop: true },
      telemetry: { ...state.telemetry, status: 'emergency_stop' },
    })),
}));
