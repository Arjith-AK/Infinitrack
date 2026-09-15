import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.schemas import DriveCommand
from app.services.robot_simulator import robot_simulator

router = APIRouter()


@router.websocket("/ws/robot")
async def robot_ws(websocket: WebSocket) -> None:
    await websocket.accept()

    async def send_loop() -> None:
        while True:
            robot_simulator.tick()
            await websocket.send_json(robot_simulator.as_message())
            await asyncio.sleep(1)

    sender = asyncio.create_task(send_loop())
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = message.get("type")
            payload = message.get("payload") or {}

            if msg_type == "drive_command":
                robot_simulator.apply_drive_command(DriveCommand(**payload))
            elif msg_type == "heartbeat":
                await websocket.send_json(
                    {
                        "type": "heartbeat_ack",
                        "payload": {"timestamp": datetime.now(timezone.utc).isoformat()},
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                )
            elif msg_type == "emergency_stop":
                robot_simulator.apply_drive_command(DriveCommand(emergencyStop=True))
    except WebSocketDisconnect:
        pass
    finally:
        sender.cancel()
