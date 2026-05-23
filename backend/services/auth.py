"""
Supabase JWT authentication dependency for FastAPI.

Validates the Bearer token from the Authorization header using:
1. Offline JWT verification using the Supabase JWT secret (if provided).
2. Online validation using the Supabase Auth API (as a fallback).
"""

import os
import logging
import httpx

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

security = HTTPBearer()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
JWT_ALGORITHM = "HS256"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    FastAPI dependency that decodes a Supabase JWT and returns the user ID (sub claim).

    Raises 401 if:
      - Token is missing or malformed
      - Token signature is invalid
      - Token has expired
      - Authentication fails online with Supabase Auth API
    """
    token = credentials.credentials

    # 1. Try offline validation if JWT secret is configured
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=[JWT_ALGORITHM],
                options={"verify_aud": False},
            )
            user_id = payload.get("sub")
            if user_id:
                return user_id
            logger.warning("Token payload is missing user identity (sub) claim.")
        except JWTError as e:
            logger.warning(f"Offline JWT verification failed: {e}")
            # Fall back to online validation if client is configured

    # 2. Try online validation with Supabase Auth API
    if SUPABASE_URL and SUPABASE_ANON_KEY:
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/user"
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "apikey": SUPABASE_ANON_KEY,
                    },
                )
            if response.status_code == 200:
                user_data = response.json()
                user_id = user_data.get("id")
                if user_id:
                    return user_id
            logger.warning(
                f"Online validation failed with status {response.status_code}: {response.text}"
            )
        except Exception as e:
            logger.error(f"Error calling Supabase Auth API for verification: {e}")

    # If both verification methods fail or are not fully configured
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid, expired, or unverified authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
