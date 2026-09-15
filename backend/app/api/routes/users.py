from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.security import get_password_hash
from app.data.store import users
from app.models.schemas import User, UserCreate, UserUpdate
from app.utils.ids import new_id

router = APIRouter()


@router.get("", response_model=list[User])
async def list_users(_: dict = Depends(get_current_user)) -> list[User]:
    return list(users.values())


@router.post("", response_model=User)
async def create_user(body: UserCreate, _: dict = Depends(get_current_user)) -> User:
    get_password_hash(body.password)
    user = User(id=new_id(), email=body.email, name=body.name, role=body.role)
    users[user.id] = user
    return user


@router.put("/{user_id}", response_model=User)
async def update_user(user_id: str, body: UserUpdate, _: dict = Depends(get_current_user)) -> User:
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updated = user.model_copy(update=updates)
    users[user_id] = updated
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, _: dict = Depends(get_current_user)) -> None:
    users.pop(user_id, None)
