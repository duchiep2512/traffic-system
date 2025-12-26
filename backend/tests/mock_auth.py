import json
import os
import time
from app.schemas.user import UserOut
from fastapi import Depends
from typing import Optional

LOG_PATH = r"d:\Smart-Traffic-Monitoring-System\seminar\.cursor\debug.log"
def _agent_log(payload: dict):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload) + "\n")
    except Exception:
        pass

# Mock user cho test
MOCK_USER = UserOut(
    id=9999,
    username="testuser",
    email="test@local.dev",
    phone_number="0123456789",
    role_id=1
)

MOCK_TOKEN = "mock_jwt_token_local_testing"

async def mock_get_current_user() -> UserOut:
    """Mock function thay thế get_current_user"""
    _agent_log({
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "H3",
        "location": "mock_auth.py:mock_get_current_user",
        "message": "mock_get_current_user called",
        "data": {},
        "timestamp": int(time.time() * 1000)
    })
    return MOCK_USER

def mock_create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    """Mock JWT token generation"""
    return MOCK_TOKEN

async def mock_get_current_active_user(
    current_user: UserOut = Depends(mock_get_current_user)
) -> UserOut:
    """Mock active user check"""
    return current_user