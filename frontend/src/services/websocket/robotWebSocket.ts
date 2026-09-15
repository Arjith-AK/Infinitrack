import type { DriveCommand, RobotTelemetry } from '@/types';
import { useRobotStore } from '@/stores/robotStore';

// ---------------------------------------------------------------------------
// This connects DIRECTLY to the real InfiniTrack robot's WebSocket server
// (robot.py / server.py on the Raspberry Pi), not the fake simulator this
// project's own local backend used to provide. See that project's README,
// section 9 ("WebSocket API specification"), for the full command/response
// spec this file implements.
// ---------------------------------------------------------------------------

type MessageHandler = (message: Record<string, any>) => void;

type RobotCommand =
  | 'FORWARD' | 'REVERSE' | 'LEFT' | 'RIGHT'
  | 'FORWARD_LEFT' | 'FORWARD_RIGHT' | 'REVERSE_LEFT' | 'REVERSE_RIGHT'
  | 'STOP' | 'SET_SPEED' | 'EMERGENCY_STOP' | 'GET_STATUS'
  | 'START_GPS_MODE' | 'START_MISSION' | 'PAUSE' | 'RESUME' | 'RETURN_HOME'
  | 'START_TEACH' | 'STOP_TEACH' | 'GET_TEACH_PATH' | 'REPLAY_PATH'
  | 'DISPENSER_ON' | 'DISPENSER_OFF' | 'SET_DISPENSER'
  | 'COMPRESSOR_ON' | 'COMPRESSOR_OFF';

/**
 * Maps the robot's own state machine (README section 8) onto the frontend's
 * narrower status enum. Some detail is unavoidably lost (e.g. GPS_MODE and
 * MANUAL both become 'driving') -- the exact robot state string is preserved
 * separately in telemetry.rawState for anything that needs the full picture.
 */
function mapRobotState(state: string | undefined): RobotTelemetry['status'] {
  switch (state) {
    case 'READY': return 'ready';
    case 'MANUAL': return 'driving';
    case 'GPS_MODE': return 'driving';
    case 'TEACH_MODE': return 'driving';
    case 'MISSION_RUNNING': return 'marking';
    case 'PAUSED': return 'paused';
    case 'EMERGENCY_STOP': return 'emergency_stop';
    case 'ERROR': return 'error';
    // BOOTING / INITIALIZING / unrecognized -- nothing bad is happening yet,
    // just not truly "ready" either.
    default: return 'ready';
  }
}

function mapGpsSignal(gpsFix: boolean | undefined, hdop: number | undefined): RobotTelemetry['gpsSignal'] {
  if (!gpsFix) return 'none';
  if (hdop === undefined) return 'fair';
  if (hdop <= 1.5) return 'excellent';
  if (hdop <= 3) return 'good';
  if (hdop <= 6) return 'fair';
  return 'poor';
}

/**
 * Converts a robot_status broadcast (README section 9.4) into the frontend's
 * telemetry shape.
 *
 * IMPORTANT: the real robot does NOT report battery %, motor temperature, or
 * powder tank level -- there is no sensor for any of those in the current
 * hardware/firmware (see the robot project's config.py / README). Those
 * fields are deliberately left out of this mapping rather than invented, so
 * the UI keeps whatever it last had instead of showing fabricated numbers.
 * The same applies to "GPS Accuracy": the robot reports HDOP (a dilution-of-
 * precision number, not meters) since it has no other accuracy figure --
 * mapped here as the closest available proxy, not a true meters value.
 */
function robotStatusToTelemetry(status: Record<string, any>): Partial<RobotTelemetry> {
  return {
    connected: true,
    status: mapRobotState(status.state),
    rawState: status.state,
    position: {
      lat: status.latitude ?? 0,
      lng: status.longitude ?? 0,
      alt: status.altitude_m ?? 0,
    },
    heading: status.heading_deg ?? 0,
    speed: status.speed_mps ?? 0,
    satellites: status.satellites ?? 0,
    gpsAccuracy: status.hdop ?? 0,
    gpsSignal: mapGpsSignal(status.gps_fix, status.hdop),
    powderFlow: status.dispenser_intensity ?? 0,
    distanceRemaining: status.distance_to_waypoint_m ?? 0,
    missionProgress:
      status.waypoint_total > 0
        ? Math.round((status.waypoint_index / status.waypoint_total) * 100)
        : 0,
    lastSync: new Date().toISOString(),
    wifiConnected: true,
  };
}

class RobotWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private intentionalClose = false;
  // Tracks the dispenser's last commanded on/off state so continuous drive
  // updates (e.g. dragging the steering wheel) don't re-toggle the powder
  // relay on every single tick.
  private lastPowderState: boolean | null = null;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://192.168.4.1:8765/ws';
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      // Constructing a `ws://` (insecure) socket from an `https://` page
      // throws synchronously instead of failing async like a normal
      // connection error -- e.g. this app loaded over the public internet
      // instead of joined to the robot's own local Wi-Fi hotspot. Treat it
      // like any other unreachable-robot case (stay disconnected, keep
      // retrying) instead of letting it escape the effect that calls
      // connect() and crash the whole app.
      console.error('Failed to open robot WebSocket', err);
      useRobotStore.getState().setWsConnected(false);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      useRobotStore.getState().setWsConnected(true);
      // The robot already auto-broadcasts robot_status at ~5Hz, but ask
      // immediately so the UI doesn't sit on stale/default data for up to
      // 200ms after connecting.
      this.getStatus();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch {
        console.error('Failed to parse robot message', event.data);
      }
    };

    this.ws.onclose = () => {
      useRobotStore.getState().setWsConnected(false);
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      useRobotStore.getState().setWsConnected(false);
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.ws?.close();
    this.ws = null;
  }

  /** Send a raw command in the robot's own format: { command, ...extra }. */
  sendCommand(command: RobotCommand, extra: Record<string, unknown> = {}): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn(`Not connected to the robot -- dropped command ${command}`);
      return;
    }
    this.ws.send(JSON.stringify({ command, ...extra }));
  }

  getStatus(): void {
    this.sendCommand('GET_STATUS');
  }

  stop(): void {
    this.sendCommand('STOP');
  }

  emergencyStop(): void {
    this.sendCommand('EMERGENCY_STOP');
  }

  startGpsMode(): void {
    this.sendCommand('START_GPS_MODE');
  }

  startMission(
    missionName: string,
    waypoints: { lat: number; lon: number; radius_m?: number }[],
  ): void {
    this.sendCommand('START_MISSION', { mission_name: missionName, waypoints });
  }

  pause(): void {
    this.sendCommand('PAUSE');
  }

  resume(): void {
    this.sendCommand('RESUME');
  }

  dispenserOn(intensity?: number): void {
    this.sendCommand('DISPENSER_ON', intensity !== undefined ? { intensity } : {});
  }

  dispenserOff(): void {
    this.sendCommand('DISPENSER_OFF');
  }

  /**
   * Translates the frontend's continuous throttle/steering drive model into
   * the real robot's discrete direction + speed commands (README section
   * 9.1). The robot has no continuous steering -- only FORWARD/REVERSE
   * crossed with LEFT/RIGHT, plus a 0-100 speed -- so this picks the closest
   * discrete command on every update.
   */
  sendDriveCommand(command: DriveCommand): void {
    if (command.emergencyStop) {
      this.emergencyStop();
      return;
    }

    if (command.powder !== this.lastPowderState) {
      this.lastPowderState = command.powder;
      if (command.powder) this.dispenserOn();
      else this.dispenserOff();
    }

    if (command.brake || (command.throttle === 0 && !command.reverse)) {
      this.stop();
      return;
    }

    const speed = Math.round(Math.min(1, Math.abs(command.throttle || 0.3)) * 100);
    const turningLeft = command.steering < -0.3;
    const turningRight = command.steering > 0.3;

    let direction: RobotCommand;
    if (command.reverse) {
      direction = turningLeft ? 'REVERSE_LEFT' : turningRight ? 'REVERSE_RIGHT' : 'REVERSE';
    } else {
      direction = turningLeft ? 'FORWARD_LEFT' : turningRight ? 'FORWARD_RIGHT' : 'FORWARD';
    }

    this.sendCommand(direction, { speed });
  }

  /** Subscribe to a message type ('robot_status', 'ack', 'error', 'teach_path', ...). */
  on(type: string, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
    return () => {
      const updated = (this.handlers.get(type) ?? []).filter((h) => h !== handler);
      this.handlers.set(type, updated);
    };
  }

  private handleMessage(message: Record<string, any>): void {
    if (message.type === 'robot_status') {
      useRobotStore.getState().setTelemetry(robotStatusToTelemetry(message));
    }

    const handlers = this.handlers.get(message.type) ?? [];
    handlers.forEach((handler) => handler(message));
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }
}

export const robotWebSocket = new RobotWebSocket();
