from datetime import datetime, timedelta
from jose import jwt
from app.core.config import SettingServer
from fastapi import Depends, HTTPException, status, Request, WebSocket
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from typing import Optional, Union

# Tạo instance của SettingServer
settings_server = SettingServer()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def extract_token(source: Union[Request, WebSocket]) -> Optional[str]:
    """
    Extract token từ Request hoặc WebSocket.
    Hỗ trợ: Authorization header, Cookie, Query params
    
    Args:
        source: Request hoặc WebSocket object
        
    Returns:
        Token string nếu tìm thấy, None nếu không
    """
    if not source:
        return None
    
    token = None
    
    # 1. Thử lấy từ Authorization header
    auth_header = source.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    
    # 2. Thử lấy từ cookie
    if not token:
        token = source.cookies.get("access_token")
    
    # 3. Thử lấy từ query params
    if not token:
        token = source.query_params.get("token")
    
    return token

def create_access_token(data: dict):
    """ Tạo JWT access token từ dữ liệu đầu vào.

    Args:
        data (dict): Dữ liệu đầu vào để tạo token.

    Returns:
        str: JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings_server.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings_server.JWT_SECRET, algorithm=settings_server.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict|None:
    """Giải mã token JWT.

    Args:
        token (str): token cần giải mã.

    Returns:
        dict|None: thông tin của token nếu hợp lệ, ngược lại trả về None.
    """
    try:
        payload = jwt.decode(token, settings_server.JWT_SECRET, algorithms=[settings_server.JWT_ALGORITHM])
        return payload
    except Exception:
        return None

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    HTTP-only dependency: xác thực qua OAuth2 Bearer token trong Authorization header.
    - Không fallback cookie hoặc query params cho HTTP endpoints.
    - Trả về 401 nếu không có hoặc token không hợp lệ.
    """
    # Yêu cầu bắt buộc Bearer token trong Authorization header
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc không tồn tại.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc user không tồn tại.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_user_ws(
    websocket: WebSocket
) -> User:
    """
    WebSocket-only dependency: lấy token linh hoạt từ header/cookie/query params.
    - Dùng cho browser WebSocket không thể set Authorization header.
    - Chấp nhận các nguồn: Authorization header (Bearer), cookie access_token, query param ?token=...
    - Trả về 401 nếu không có hoặc token không hợp lệ.
    """
    token = extract_token(websocket)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc không tồn tại.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc user không tồn tại.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_user_by_token(token: str) -> Optional[User]:
    """Hàm dùng cho websocket hoặc các trường hợp cần truyền token trực tiếp

    Args:
        token (str): token JWT cần xác thực

    Returns:
        Optional[User]: người dùng tương ứng với token nếu hợp lệ, ngược lại trả về None
    """
    import json
    import os
    log_data = {
        "location": "jwt_handler.py:125",
        "message": "get_user_by_token called",
        "data": {
            "tokenPrefix": token[:20] if token else None,
        },
        "timestamp": int(__import__('time').time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "E"
    }
    try:
        with open(r"d:\seminar\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
    except:
        pass
    
    payload = decode_access_token(token)
    if payload is None:
        return None
    email = payload.get("sub")
    if email is None:
        return None
    # Tìm user trong MongoDB
    user = await User.find_one(User.email == email)
    
    log_data2 = {
        "location": "jwt_handler.py:141",
        "message": "get_user_by_token result",
        "data": {
            "email": email,
            "user_id": str(user.id) if user else None,
            "username": user.username if user else None,
        },
        "timestamp": int(__import__('time').time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "E"
    }
    try:
        with open(r"d:\seminar\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data2, ensure_ascii=False) + "\n")
    except:
        pass
    
    return user
