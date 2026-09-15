import math
import random
from datetime import datetime, timezone

from app.models.schemas import DriveCommand, GeoCoordinate, RobotTelemetry


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class RobotSimulator:
    def __init__(self) -> None:
        self.telemetry = RobotTelemetry(
            connected=True,
            robotId="IT-00123",
            firmware="v1.2.4",
            status="ready",
            battery=86,
            batteryCharging=True,
            gpsAccuracy=0.82,
            satellites=21,
            gpsSignal="good",
            position=GeoCoordinate(lat=28.6139, lng=77.209, alt=216),
            heading=132,
            speed=0,
            motorTemp=42,
            powderLevel=78,
            powderFlow=70,
            distanceRemaining=0,
            missionProgress=0,
            lastSync=_utc_now(),
            wifiConnected=True,
            temperature=28,
        )
        self.drive_command = DriveCommand()

    def apply_drive_command(self, command: DriveCommand) -> None:
        self.drive_command = command

        if command.emergencyStop:
            self.telemetry.status = "emergency_stop"
            self.telemetry.speed = 0
            return

        if self.telemetry.status == "emergency_stop":
            self.telemetry.status = "ready"

        self.telemetry.heading = (self.telemetry.heading + command.steering * 5) % 360

        if command.brake:
            self.telemetry.speed = 0
            self.telemetry.status = "ready"
        else:
            direction = -1 if command.reverse else 1
            self.telemetry.speed = round(abs(command.throttle) * 3, 2) * direction
            self.telemetry.status = "driving" if command.throttle != 0 else "ready"

        if command.powder:
            self.telemetry.powderLevel = max(0, round(self.telemetry.powderLevel - 0.05, 2))

    def tick(self) -> None:
        if self.telemetry.status == "emergency_stop":
            self.telemetry.lastSync = _utc_now()
            return

        if self.telemetry.speed != 0:
            delta = self.telemetry.speed * 0.0000009
            rad = math.radians(self.telemetry.heading)
            self.telemetry.position.lat += delta * math.cos(rad)
            self.telemetry.position.lng += delta * math.sin(rad)
            self.telemetry.battery = max(0, round(self.telemetry.battery - 0.01, 2))
            self.telemetry.motorTemp = min(80, round(self.telemetry.motorTemp + 0.1, 1))
        else:
            self.telemetry.motorTemp = max(25, round(self.telemetry.motorTemp - 0.05, 1))

        self.telemetry.gpsAccuracy = round(max(0.4, 0.82 + random.uniform(-0.05, 0.05)), 2)
        self.telemetry.lastSync = _utc_now()

    def as_message(self) -> dict:
        return {
            "type": "telemetry",
            "payload": self.telemetry.model_dump(),
            "timestamp": _utc_now(),
        }


robot_simulator = RobotSimulator()
