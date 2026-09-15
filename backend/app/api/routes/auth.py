from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt

from app.core.deps import get_current_user, get_demo_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    settings,
    verify_password,
)
from app.data.store import users
from app.models.schemas import (
    AuthTokens,
    LoginCredentials,
    LoginResponse,
    RefreshRequest,
    User,
)

router = APIRouter()


def _issue_tokens(user_id: str, email: str, role: str) -> AuthTokens:
    claims = {"sub": user_id, "email": email, "role": role}
    return AuthTokens(
        accessToken=create_access_token(claims),
        refreshToken=create_refresh_token(claims),
    )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginCredentials) -> LoginResponse:
    demo_user = get_demo_user(credentials.email)
    if not demo_user or not verify_password(credentials.password, demo_user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user = User(id=demo_user["id"], email=demo_user["email"], name=demo_user["name"], role=demo_user["role"])
    tokens = _issue_tokens(user.id, user.email, user.role)
    return LoginResponse(user=user, tokens=tokens)


@router.post("/logout")
async def logout() -> dict:
    return {"message": "Logged out"}


@router.get("/me", response_model=User)
async def me(current_user: dict = Depends(get_current_user)) -> User:
    user = users.get(current_user["id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/refresh", response_model=AuthTokens)
async def refresh(body: RefreshRequest) -> AuthTokens:
    try:
        payload = jwt.decode(body.refreshToken, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    return _issue_tokens(user_id, payload.get("email", ""), payload.get("role", "operator"))
