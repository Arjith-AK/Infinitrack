from datetime import datetime, timezone

from app.models.schemas import Job, Mission, Report, User

users: dict[str, User] = {
    "1": User(id="1", email="operator@infintrack.com", name="Operator", role="operator"),
    "2": User(id="2", email="admin@infintrack.com", name="Admin", role="admin"),
}

missions: dict[str, Mission] = {}
jobs: dict[str, Job] = {}
reports: dict[str, Report] = {}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
