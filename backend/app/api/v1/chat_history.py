"""
Chat History API Endpoints
Lưu và lấy lịch sử chat của user với MongoDB
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.utils.jwt_handler import get_current_user
from app.models.user import User
from app.models.chat_message import ChatMessage
from app.schemas.ChatMessage import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageListResponse,
    ChatHistoryQuery,
)

router = APIRouter()


@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=201,
    summary="Lưu tin nhắn chat",
    description="API lưu một tin nhắn chat mới vào database. Hỗ trợ lưu cả tin nhắn từ user và AI response, kèm theo ảnh và metadata. Yêu cầu JWT authentication."
)
async def create_chat_message(
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
):
    """
    Lưu một tin nhắn chat mới
    
    - **message**: Nội dung tin nhắn
    - **is_user**: True nếu là tin của user, False nếu là AI response
    - **images**: Array URLs của ảnh đính kèm (optional)
    - **extra_data**: Thông tin bổ sung như traffic data, intent, etc. (optional)
    """
    import json
    import os
    log_data = {
        "location": "chat_history.py:41",
        "message": "Creating chat message",
        "data": {
            "user_id": str(current_user.id),
            "user_email": current_user.email if hasattr(current_user, 'email') else None,
            "username": current_user.username if hasattr(current_user, 'username') else None,
            "message_preview": message_data.message[:50] if message_data.message else None,
            "is_user": message_data.is_user,
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
    
    new_message = ChatMessage(
        user_id=str(current_user.id),
        message=message_data.message,
        is_user=message_data.is_user,
        images=message_data.images,
        extra_data=message_data.extra_data,
    )
    
    await new_message.insert()
    
    log_data2 = {
        "location": "chat_history.py:49",
        "message": "Chat message saved",
        "data": {
            "message_id": str(new_message.id),
            "user_id": str(current_user.id),
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
    
    return new_message


@router.get(
    "/messages",
    response_model=List[ChatMessageListResponse],
    summary="Lấy lịch sử chat",
    description="API lấy lịch sử chat của user hiện tại với phân trang và filter theo thời gian. Trả về danh sách tin nhắn theo thứ tự cũ → mới. Yêu cầu JWT authentication."
)
async def get_chat_history(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    since: Optional[datetime] = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    """
    Lấy lịch sử chat của user hiện tại
    
    - **limit**: Số lượng tin nhắn tối đa (default: 100, max: 1000)
    - **offset**: Bỏ qua bao nhiêu tin nhắn đầu (pagination)
    - **since**: Chỉ lấy tin nhắn sau thời điểm này (ISO format)
    
    Returns danh sách tin nhắn theo thứ tự thời gian (cũ → mới)
    """
    import json
    log_data = {
        "location": "chat_history.py:75",
        "message": "Fetching chat history",
        "data": {
            "user_id": str(current_user.id),
            "user_email": current_user.email if hasattr(current_user, 'email') else None,
            "username": current_user.username if hasattr(current_user, 'username') else None,
            "limit": limit,
            "offset": offset,
        },
        "timestamp": int(__import__('time').time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "B"
    }
    try:
        with open(r"d:\seminar\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data, ensure_ascii=False) + "\n")
    except:
        pass
    
    # Build query - Beanie syntax
    find_query = ChatMessage.find(ChatMessage.user_id == str(current_user.id))
    
    # Filter by timestamp if provided
    if since:
        find_query = find_query.find(ChatMessage.created_at > since)
    
    # Order by created_at ascending (oldest first), pagination
    messages = await find_query.sort("+created_at").skip(offset).limit(limit).to_list()
    
    import json
    log_data2 = {
        "location": "chat_history.py:83",
        "message": "Chat history fetched",
        "data": {
            "user_id": str(current_user.id),
            "message_count": len(messages),
        },
        "timestamp": int(__import__('time').time() * 1000),
        "sessionId": "debug-session",
        "runId": "run1",
        "hypothesisId": "B"
    }
    try:
        with open(r"d:\seminar\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_data2, ensure_ascii=False) + "\n")
    except:
        pass
    
    # Convert to frontend format
    return [
        ChatMessageListResponse(
            id=str(msg.id),
            text=msg.message,
            user=msg.is_user,
            time=msg.created_at.strftime("%H:%M:%S"),
            image=msg.images,
            created_at=msg.created_at.isoformat(),
        )
        for msg in messages
    ]


@router.delete(
    "/messages",
    status_code=204,
    summary="Xóa toàn bộ lịch sử chat",
    description="API xóa tất cả tin nhắn chat của user hiện tại. Không thể hoàn tác sau khi xóa. Yêu cầu JWT authentication."
)
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
):
    """
    Xóa toàn bộ lịch sử chat của user hiện tại
    """
    await ChatMessage.find(ChatMessage.user_id == str(current_user.id)).delete()
    
    return None


@router.delete(
    "/messages/{message_id}",
    status_code=204,
    summary="Xóa một tin nhắn cụ thể",
    description="API xóa một tin nhắn chat theo ID. User chỉ có thể xóa tin nhắn của chính mình. Yêu cầu JWT authentication."
)
async def delete_chat_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Xóa một tin nhắn cụ thể
    
    User chỉ có thể xóa tin nhắn của chính mình
    """
    # Tìm message theo ID và user_id - Beanie syntax
    from bson import ObjectId
    
    # Sử dụng ObjectId nếu message_id là ObjectId string
    try:
        message_id_obj = ObjectId(message_id)
    except:
        message_id_obj = message_id
    
    # Tìm message theo ID trước
    message = await ChatMessage.find_one(ChatMessage.id == message_id_obj)
    
    # Kiểm tra xem message có thuộc về user này không
    if not message or message.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Message not found")
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    await message.delete()
    
    return None


@router.get(
    "/messages/count",
    summary="Đếm số lượng tin nhắn",
    description="API trả về tổng số tin nhắn chat của user hiện tại. Yêu cầu JWT authentication."
)
async def get_message_count(
    current_user: User = Depends(get_current_user),
):
    """
    Đếm tổng số tin nhắn của user
    """
    count = await ChatMessage.find(ChatMessage.user_id == str(current_user.id)).count()
    
    return {"count": count}
