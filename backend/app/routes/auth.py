"""
Authentication routes.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import exc
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse, UserRead
from app.services.security import hash_password, verify_password, create_access_token
from app.crud.users import create_user, get_user_by_email, get_user_by_id, claim_invites_for_user
from app.api.deps import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new user."""
    # Check if user exists
    existing = get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )
    
    try:
        # Create user
        user = create_user(
            db,
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name,
        )
        
        # Claim any pending invites for this email
        claim_invites_for_user(db, user)
        
        # Create access token (sub must be string for JWT verification)
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return AuthResponse(
            user=UserRead(id=user.id, email=user.email, display_name=user.display_name),
            access_token=access_token,
        )
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error registering user",
        )


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    """Login with email and password."""
    user = get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    try:
        # Claim any pending invites
        claim_invites_for_user(db, user)
        
        # Create access token (sub must be string for JWT verification)
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return AuthResponse(
            user=UserRead(id=user.id, email=user.email, display_name=user.display_name),
            access_token=access_token,
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error logging in",
        )


@router.get("/me", response_model=UserRead)
def get_me(current_user = Depends(get_current_user)):
    """Get current user information."""
    return UserRead(
        id=current_user.id,
        email=current_user.email,
        display_name=current_user.display_name,
    )
