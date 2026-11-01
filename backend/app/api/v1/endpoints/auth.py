from fastapi import APIRouter, HTTPException, Header, status, Depends
from typing import Optional, List
from app.services.auth_service import auth_service
from app.models.schemas import (
    UserCreate,
    UserLogin,
    TokenResponse,
    UserResponse,
    AdminOverviewResponse
)

router = APIRouter()

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token."
        )
    token = authorization.split(" ")[1]
    user = auth_service.verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
    return user

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. Administrator privileges required."
        )
    return user

@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserCreate):
    """
    Public registration for standard users.
    Always server-enforced as role='user' regardless of client input.
    """
    try:
        return auth_service.register_user(data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """
    User and Administrator login with password verification.
    If required_role='admin', validates administrator privileges on the server.
    """
    try:
        return auth_service.login_user(data)
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Retrieve profile of the currently authenticated user."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        created_at=current_user["created_at"],
        last_login=current_user.get("last_login")
    )

@router.get("/admin/overview", response_model=AdminOverviewResponse)
async def get_admin_overview(_admin: dict = Depends(require_admin)):
    """Protected administrator endpoint: platform metrics and status."""
    return auth_service.get_admin_overview()

@router.get("/admin/users", response_model=List[UserResponse])
async def list_users(_admin: dict = Depends(require_admin)):
    """Protected administrator endpoint: view all registered platform accounts."""
    return auth_service.list_all_users()
