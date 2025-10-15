from fastapi import HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
import httpx
from typing import Optional

# Emergent Auth API endpoint
EMERGENT_AUTH_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


async def get_session_data(session_id: str) -> dict:
    """Get user data from Emergent Auth using session_id"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid session: {str(e)}")


async def save_user_session(db: AsyncIOMotorDatabase, user_data: dict):
    """Save or update user session in database"""
    session_token = user_data['session_token']
    email = user_data['email']
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    
    if not existing_user:
        # Create new user
        user_doc = {
            "email": email,
            "name": user_data.get('name'),
            "picture": user_data.get('picture'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Save session with expiry (7 days)
    expiry = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_token": session_token,
        "email": email,
        "user_id": user_data.get('id'),
        "expires_at": expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert session
    await db.sessions.update_one(
        {"session_token": session_token},
        {"$set": session_doc},
        upsert=True
    )
    
    return session_token


def set_session_cookie(response: Response, session_token: str):
    """Set session cookie (httpOnly, secure)"""
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60  # 7 days
    )


async def get_current_user(request: Request, db: AsyncIOMotorDatabase) -> Optional[dict]:
    """Get current authenticated user from cookie or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session in database
    session = await db.sessions.find_one({"session_token": session_token})
    
    if not session:
        return None
    
    # Check if expired
    expires_at = datetime.fromisoformat(session['expires_at']).replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        # Delete expired session
        await db.sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user data
    user = await db.users.find_one({"email": session['email']}, {"_id": 0})
    return user


async def require_auth(request: Request, db: AsyncIOMotorDatabase) -> dict:
    """Require authentication (raise 401 if not authenticated)"""
    user = await get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def logout_user(request: Request, db: AsyncIOMotorDatabase):
    """Logout user by deleting session"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
