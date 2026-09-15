from typing import Literal, Optional

from pydantic import BaseModel

SportType = Literal[
    "football",
    "cricket",
    "tennis",
    "volleyball",
    "basketball",
    "hockey",
    "athletics",
    "kabaddi",
    "kho_kho",
    "badminton",
    "custom",
]


class GeoCoordinate(BaseModel):
    lat: float
    lng: float
    alt: Optional[float] = None


class PolygonMetrics(BaseModel):
    area: float
    perimeter: float
    length: float
    width: float
    orientation: float
    coordinates: list[GeoCoordinate]
    centroid: GeoCoordinate


class FieldLine(BaseModel):
    id: str
    type: Literal[
        "boundary",
        "center_line",
        "center_circle",
        "penalty_area",
        "goal_area",
        "penalty_spot",
        "corner_arc",
        "custom",
    ]
    coordinates: list[GeoCoordinate]
    length: float


class BoundingBox(BaseModel):
    minLat: float
    maxLat: float
    minLng: float
    maxLng: float


class GeneratedField(BaseModel):
    sport: SportType
    lines: list[FieldLine]
    totalLength: float
    boundingBox: BoundingBox


class MissionWaypoint(BaseModel):
    id: str
    lat: float
    lng: float
    heading: float
    speed: float
    dispensePowder: bool
    order: int


class Mission(BaseModel):
    id: str
    name: str
    sport: SportType
    groundName: str
    polygon: list[GeoCoordinate]
    field: Optional[GeneratedField] = None
    waypoints: list[MissionWaypoint]
    distance: float
    estimatedTime: float
    batteryUsage: float
    powderUsage: float
    numberOfTurns: int
    status: Literal["draft", "ready", "uploaded", "running", "paused", "completed", "failed"]
    createdAt: str
    updatedAt: str


class MissionCreate(BaseModel):
    name: Optional[str] = None
    sport: SportType
    groundName: Optional[str] = "Field Area"
    polygon: list[GeoCoordinate]
    field: Optional[GeneratedField] = None
    waypoints: list[MissionWaypoint] = []
    distance: float = 0
    estimatedTime: float = 0
    batteryUsage: float = 0
    powderUsage: float = 0
    numberOfTurns: int = 0


class Job(BaseModel):
    id: str
    name: str
    groundName: str
    sport: SportType
    mission: Mission
    createdAt: str
    updatedAt: str


class JobCreate(BaseModel):
    name: str
    groundName: str
    sport: SportType
    mission: Mission


class JobUpdate(BaseModel):
    name: Optional[str] = None
    groundName: Optional[str] = None


class RobotTelemetry(BaseModel):
    connected: bool
    robotId: str
    firmware: str
    status: Literal["ready", "driving", "marking", "paused", "error", "emergency_stop"]
    battery: float
    batteryCharging: bool
    gpsAccuracy: float
    satellites: int
    gpsSignal: Literal["excellent", "good", "fair", "poor", "none"]
    position: GeoCoordinate
    heading: float
    speed: float
    motorTemp: float
    powderLevel: float
    powderFlow: float
    distanceRemaining: float
    missionProgress: float
    lastSync: str
    wifiConnected: bool
    temperature: float


class DriveCommand(BaseModel):
    throttle: float = 0
    steering: float = 0
    brake: bool = False
    reverse: bool = False
    powder: bool = False
    emergencyStop: bool = False


class User(BaseModel):
    id: str
    email: str
    name: str
    role: Literal["admin", "operator", "viewer"]
    avatar: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    name: str
    role: Literal["admin", "operator", "viewer"] = "operator"
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Literal["admin", "operator", "viewer"]] = None


class AuthTokens(BaseModel):
    accessToken: str
    refreshToken: str


class LoginCredentials(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    user: User
    tokens: AuthTokens


class RefreshRequest(BaseModel):
    refreshToken: str


class Report(BaseModel):
    id: str
    groundName: str
    operator: str
    date: str
    area: float
    distance: float
    battery: float
    powder: float
    time: float
    accuracy: float
    sport: SportType


class ReportGenerateRequest(BaseModel):
    missionId: str
