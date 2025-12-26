"""
FastAPI app cho local testing - Không cần PostgreSQL
Chạy: uvicorn app.main_local:app --reload
"""
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
import sys
from pathlib import Path
from typing import List
from datetime import datetime

from app.core.local_config import local_settings

# Thêm thư mục tests vào Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir / "tests"))

try:
    from mock_auth import mock_get_current_user, MOCK_TOKEN, MOCK_USER
    from mock_db import mock_get_db
except ImportError as e:
    print(f"❌ Lỗi import mock modules: {e}")
    print(f"📂 Đường dẫn tests: {backend_dir / 'tests'}")
    raise

# Import WebSocket auth và database
from app.utils.jwt_handler import get_current_user, get_current_user_ws
from app.db.base import get_db

# Import v1 để truy cập state (cần cho api_vehicles_frames)
from app.api import v1

# Import API routers
from app.api.v1 import api_vehicles_frames, api_chatbot, api_admin
from app.api.v1.chat_history import router as chat_history_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/Shutdown events - SKIP database initialization"""
    print("🚀 Khởi động LOCAL TEST mode - BỎ QUA Database")
    print("📌 Chế độ: Không cần PostgreSQL")
    print("📌 Auth: Mock user (testuser)")
    print("📌 Database: Disabled")
    
    # Khởi tạo analyzer cho video monitoring
    print("📹 Đang khởi tạo Video Analyzer...")
    try:
        from app.services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
        if v1.state.analyzer is None:
            v1.state.analyzer = AnalyzeOnRoadForMultiprocessing()
            v1.state.analyzer.run_multiprocessing()
            
            # Đợi một chút để processes khởi động và populate names
            import asyncio
            await asyncio.sleep(2)  # Đợi 2 giây để processes khởi động
            
            print(f"✅ Video Analyzer đã khởi tạo thành công")
            if hasattr(v1.state.analyzer, 'names'):
                print(f"   Road names: {v1.state.analyzer.names}")
            else:
                print(f"   ⚠️ Analyzer chưa có thuộc tính 'names'")
        else:
            print("✅ Video Analyzer đã được khởi tạo trước đó")
            if hasattr(v1.state.analyzer, 'names'):
                print(f"   Road names: {v1.state.analyzer.names}")
    except Exception as e:
        print(f"⚠️ Không thể khởi tạo Video Analyzer: {e}")
        import traceback
        traceback.print_exc()
        print("⚠️ Video monitoring sẽ không hoạt động")
        v1.state.analyzer = None
    
    yield
    
    # Cleanup khi shutdown
    print("🧹 Đang dọn dẹp...")
    if v1.state.analyzer:
        try:
            v1.state.analyzer.cleanup_processes()
            print("✅ Đã dọn dẹp Video Analyzer")
        except Exception as e:
            print(f"⚠️ Lỗi khi dọn dẹp: {e}")
    
    print("👋 Tắt LOCAL TEST mode")

# Create FastAPI app
app = FastAPI(
    title="Traffic Monitoring API - Local Test",
    version="1.0.0-local",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=local_settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Override dependencies
app.dependency_overrides[get_current_user] = mock_get_current_user
app.dependency_overrides[get_current_user_ws] = mock_get_current_user
app.dependency_overrides[get_db] = mock_get_db

# Include routers
app.include_router(
    api_vehicles_frames.router,
    prefix="/api/v1",
    tags=["Traffic Monitoring"],
)

# Mock chatbot endpoints (override original ones để tránh lỗi khi agent chưa khởi tạo)
@app.post("/api/v1/chat")
async def mock_chat(request: dict = None, current_user = Depends(mock_get_current_user)):
    """Mock chat endpoint - trả về response đơn giản"""
    from app.schemas.ChatResponse import ChatResponse
    message = request.get("message", "") if request else ""
    
    # Simple mock response
    if "hello" in message.lower() or "xin chào" in message.lower():
        response_text = "Xin chào! Tôi là AI Assistant của Smart Traffic System. Tôi có thể giúp bạn về thông tin giao thông, tình trạng đường, và các câu hỏi khác. Bạn cần hỗ trợ gì?"
    elif "giao thông" in message.lower() or "traffic" in message.lower():
        response_text = "Hiện tại hệ thống đang giám sát các tuyến đường. Bạn có thể xem thông tin chi tiết tại trang chủ hoặc hỏi tôi về tình trạng cụ thể của một tuyến đường."
    else:
        response_text = f"Bạn đã nói: '{message}'. Trong chế độ local test, tôi chỉ có thể trả lời các câu hỏi cơ bản. Để sử dụng đầy đủ tính năng AI, vui lòng cấu hình ChatBotAgent."
    
    return ChatResponse(
        message=response_text,
        image=None
    )

@app.post("/api/v1/chat/chat_no_auth")
async def mock_chat_no_auth(request: dict = None):
    """Mock chat no auth endpoint"""
    return await mock_chat(request, None)

app.include_router(
    api_chatbot.router,
    prefix="/api/v1",
    tags=["AI Chatbot"],
)

# Mock WebSocket chat endpoint (override original để đảm bảo hoạt động trong local mode)
# Phải định nghĩa SAU router để override
@app.websocket("/api/v1/ws/chat")
async def mock_websocket_chat(websocket: WebSocket, current_user = Depends(mock_get_current_user)):
    """Mock WebSocket chat endpoint - trả về response đơn giản"""
    await websocket.accept()
    print("✅ WebSocket chat connected (mock mode)")
    
    try:
        while True:
            data = await websocket.receive_json()
            user_message = data.get("message", "")
            
            if not user_message:
                await websocket.send_json({"message": "Bạn chưa nhập tin nhắn.", "image": None})
                continue
            
            # Simple mock response
            if "hello" in user_message.lower() or "xin chào" in user_message.lower():
                response_text = "Xin chào! Tôi là AI Assistant của Smart Traffic System. Tôi có thể giúp bạn về thông tin giao thông, tình trạng đường, và các câu hỏi khác. Bạn cần hỗ trợ gì?"
            elif "giao thông" in user_message.lower() or "traffic" in user_message.lower():
                response_text = "Hiện tại hệ thống đang giám sát các tuyến đường. Bạn có thể xem thông tin chi tiết tại trang chủ hoặc hỏi tôi về tình trạng cụ thể của một tuyến đường."
            else:
                response_text = f"Bạn đã nói: '{user_message}'. Trong chế độ local test, tôi chỉ có thể trả lời các câu hỏi cơ bản. Để sử dụng đầy đủ tính năng AI, vui lòng cấu hình ChatBotAgent."
            
            await websocket.send_json({
                "message": response_text,
                "image": None
            })
            
    except WebSocketDisconnect:
        print("WebSocket chat disconnected")
    except Exception as e:
        print(f"WebSocket chat error: {e}")
        try:
            await websocket.send_json({
                "message": f"Lỗi: {str(e)}",
                "image": None
            })
        except:
            pass
        await websocket.close()

app.include_router(
    api_admin.router,
    prefix="/api/v1",
    tags=["Admin Tools"],
)

app.include_router(
    chat_history_router,
    prefix="/api/v1/chat",
    tags=["Chat History"],
)

# Mock auth endpoints (override original ones)
@app.post("/api/v1/auth/login")
async def mock_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Mock login - luôn trả về token và user giả (không cần database)"""
    return {
        "access_token": MOCK_TOKEN,
        "token_type": "bearer"
    }

@app.post("/api/v1/auth/register")
async def mock_register(user_data: dict = None):
    """Mock register - luôn thành công (không lưu vào database)"""
    return {"msg": "Đăng ký thành công (mock mode)"}

@app.get("/api/v1/auth/me")
async def mock_get_me(current_user = Depends(mock_get_current_user)):
    """Mock get current user"""
    return current_user

# Mock user endpoints
@app.put("/api/v1/users/password")
async def mock_update_password(request: dict = None, current_user = Depends(mock_get_current_user)):
    """Mock update password"""
    return {"message": "Cập nhật mật khẩu thành công! (mock mode)"}

@app.put("/api/v1/users/profile")
async def mock_update_profile(request: dict = None, current_user = Depends(mock_get_current_user)):
    """Mock update profile"""
    return {"message": "Cập nhật thông tin thành công! (mock mode)"}

# Mock chat history endpoints (override original ones)
@app.post("/api/v1/chat/messages")
async def mock_create_chat_message(message_data = None, current_user = Depends(mock_get_current_user)):
    """Mock create chat message - không lưu vào database"""
    from app.schemas.ChatMessage import ChatMessageResponse, ChatMessageCreate
    if message_data is None:
        # Nếu không có data, tạo default
        message_data = ChatMessageCreate(message="", is_user=True)
    elif isinstance(message_data, dict):
        # Nếu là dict, convert sang ChatMessageCreate
        message_data = ChatMessageCreate(**message_data)
    
    return ChatMessageResponse(
        id=1,
        user_id=current_user.id,
        message=message_data.message,
        is_user=message_data.is_user,
        images=message_data.images,
        extra_data=message_data.extra_data,
        created_at=datetime.now()
    )

@app.get("/api/v1/chat/messages")
async def mock_get_chat_history(
    limit: int = 100,
    offset: int = 0,
    since: datetime = None,
    current_user = Depends(mock_get_current_user)
):
    """Mock get chat history - trả về empty list"""
    return []

@app.delete("/api/v1/chat/messages")
async def mock_clear_chat_history(current_user = Depends(mock_get_current_user)):
    """Mock clear chat history"""
    return None

@app.delete("/api/v1/chat/messages/{message_id}")
async def mock_delete_chat_message(message_id: int, current_user = Depends(mock_get_current_user)):
    """Mock delete chat message"""
    return None

@app.get("/api/v1/chat/messages/count")
async def mock_get_message_count(current_user = Depends(mock_get_current_user)):
    """Mock get message count"""
    return {"count": 0}

@app.get("/")
async def root():
    return {
        "message": "Traffic Monitoring API - Local Test Mode",
        "database": "DISABLED (không dùng PostgreSQL)",
        "auth": "MOCKED (user giả: testuser)",
        "mode": "LOCAL_TEST",
        "endpoints": {
            "public": [
                "/api/v1/vehicles/roads_name",
                "/api/v1/vehicles/info/{road_name}",
                "/api/v1/vehicles/frames_no_auth/{road_name}",
                "/api/v1/chat/chat_no_auth"
            ],
            "authenticated": [
                "/api/v1/vehicles/ws/info/{road_name}",
                "/api/v1/vehicles/ws/frames/{road_name}",
                "/api/v1/chat",
                "/api/v1/chat/ws/chat",
                "/api/v1/admin/resources"
            ],
            "auth": [
                "/api/v1/auth/login",
                "/api/v1/auth/register",
                "/api/v1/auth/me"
            ]
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_local:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )