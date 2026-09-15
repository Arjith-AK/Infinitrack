export type ThemeMode = 'dark' | 'light' | 'system';

export type SportType =
  | 'football'
  | 'cricket'
  | 'tennis'
  | 'volleyball'
  | 'basketball'
  | 'hockey'
  | 'athletics'
  | 'kabaddi'
  | 'kho_kho'
  | 'badminton'
  | 'custom';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  alt?: number;
}

export interface PolygonMetrics {
  area: number;
  perimeter: number;
  length: number;
  width: number;
  orientation: number;
  coordinates: GeoCoordinate[];
  centroid: GeoCoordinate;
}

export type FieldLineType =
  | 'boundary'
  | 'center_line'
  | 'center_circle'
  | 'penalty_area'
  | 'goal_area'
  | 'penalty_spot'
  | 'corner_arc'
  | 'quarter_line'
  | 'shooting_circle'
  | 'singles_sideline'
  | 'net_line'
  | 'service_line'
  | 'center_service_line'
  | 'center_mark'
  | 'attack_line'
  | 'key'
  | 'free_throw_circle'
  | 'three_point_line'
  | 'lane_line'
  | 'pitch'
  | 'crease'
  | 'start_line'
  | 'hurdle_mark'
  | 'relay_zone'
  | 'custom';

export interface FieldLine {
  id: string;
  type: FieldLineType;
  coordinates: GeoCoordinate[];
  length: number;
}

export interface GeneratedField {
  sport: SportType;
  lines: FieldLine[];
  totalLength: number;
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

export interface MissionWaypoint {
  id: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  dispensePowder: boolean;
  order: number;
}

export interface Mission {
  id: string;
  name: string;
  sport: SportType;
  groundName: string;
  polygon: GeoCoordinate[];
  field: GeneratedField | null;
  waypoints: MissionWaypoint[];
  distance: number;
  estimatedTime: number;
  batteryUsage: number;
  powderUsage: number;
  numberOfTurns: number;
  status: 'draft' | 'ready' | 'uploaded' | 'running' | 'paused' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  name: string;
  groundName: string;
  sport: SportType;
  mission: Mission;
  createdAt: string;
  updatedAt: string;
}

export interface RobotTelemetry {
  connected: boolean;
  robotId: string;
  firmware: string;
  status: 'ready' | 'driving' | 'marking' | 'paused' | 'error' | 'emergency_stop';
  /** The robot's own exact state string (e.g. "GPS_MODE", "MISSION_RUNNING") before
   * being collapsed into the coarser `status` above -- undefined until the first
   * real robot_status message arrives. */
  rawState?: string;
  battery: number;
  batteryCharging: boolean;
  gpsAccuracy: number;
  satellites: number;
  gpsSignal: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
  position: GeoCoordinate;
  heading: number;
  speed: number;
  motorTemp: number;
  powderLevel: number;
  powderFlow: number;
  distanceRemaining: number;
  missionProgress: number;
  lastSync: string;
  wifiConnected: boolean;
  temperature: number;
}

export interface DriveCommand {
  throttle: number;
  steering: number;
  brake: boolean;
  reverse: boolean;
  powder: boolean;
  emergencyStop: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Report {
  id: string;
  groundName: string;
  operator: string;
  date: string;
  area: number;
  distance: number;
  battery: number;
  powder: number;
  time: number;
  accuracy: number;
  sport: SportType;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface FieldTemplate {
  id: string;
  name: string;
  sport: SportType;
  description: string;
  dimensions: Record<string, number>;
}

export interface SavedGround {
  id: string;
  name: string;
  location: string;
  polygon: GeoCoordinate[];
  metrics: PolygonMetrics;
  lastUsed: string;
}

export interface RobotHealth {
  motors: { id: string; status: 'ok' | 'warning' | 'error'; temp: number }[];
  gps: { status: 'ok' | 'warning' | 'error'; accuracy: number };
  imu: { status: 'ok' | 'warning' | 'error'; calibrated: boolean };
  battery: { status: 'ok' | 'warning' | 'error'; health: number };
  powder: { status: 'ok' | 'warning' | 'error'; level: number };
  camera: { status: 'ok' | 'warning' | 'error'; streaming: boolean };
}

export type MapStyle = 'satellite' | 'terrain' | 'street';

export interface AppSettings {
  theme: ThemeMode;
  units: 'metric' | 'imperial';
  lineWidth: number;
  fieldType: string;
  powderFlow: number;
  drivingSpeed: number;
  mapStyle: MapStyle;
  language: string;
}

export interface TeachRecording {
  id: string;
  name: string;
  points: {
    timestamp: number;
    position: GeoCoordinate;
    heading: number;
    speed: number;
    powder: boolean;
  }[];
  createdAt: string;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}
