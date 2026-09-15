from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.security import get_password_hash, settings

security = HTTPBearer()

_DEMO_PASSWORD_HASH = get_password_hash("demo123")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"id": user_id, "email": payload.get("email", ""), "role": payload.get("role", "operator")}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_demo_user(email: str) -> Optional[dict]:
    users = {
        "operator@infintrack.com": {
            "id": "1",
            "email": "operator@infintrack.com",
            "name": "Operator",
            "role": "operator",
            "password_hash": _DEMO_PASSWORD_HASH,
        },
        "admin@infintrack.com": {
            "id": "2",
            "email": "admin@infintrack.com",
            "name": "Admin",
            "role": "admin",
            "password_hash": _DEMO_PASSWORD_HASH,
        },
    }
    return users.get(email)
