"""
Chat Message Model for MongoDB using Beanie
Lưu trữ lịch sử chat của users
"""
from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ChatMessage(Document):
    """
    Model để lưu tin nhắn chat trong MongoDB
    
    Attributes:
        user_id: ID của user (ObjectId hoặc string)
        message: Nội dung tin nhắn
        is_user: True nếu là tin nhắn của user, False nếu là AI
        images: JSON array chứa URLs ảnh (nếu có)
        created_at: Thời gian tạo
        extra_data: JSON field cho thông tin bổ sung (traffic data, context, etc.)
    """
    user_id: str = Field(..., description="ID của user")
    message: str = Field(..., description="Nội dung tin nhắn")
    is_user: bool = Field(default=True, description="True = user, False = AI")
    images: Optional[List[str]] = Field(default=None, description="Array URLs của ảnh đính kèm")
    extra_data: Optional[Dict[str, Any]] = Field(default=None, description="Thông tin bổ sung")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Thời gian tạo")
    
    class Settings:
        name = "chat_messages"  # Collection name trong MongoDB
        indexes = [
            [("user_id", 1)],  # Index cho user_id để query nhanh
            [("created_at", 1)],  # Index cho created_at để sort
        ]
    
    def __repr__(self):
        msg_id = str(self.id) if hasattr(self, 'id') else "None"
        return f"<ChatMessage(id={msg_id}, user_id={self.user_id}, is_user={self.is_user})>"
    
    def to_dict(self):
        """Convert to dict for API response"""
        return {
            "id": str(self.id),
            "text": self.message,
            "user": self.is_user,
            "time": self.created_at.strftime("%H:%M:%S"),
            "image": self.images if self.images else None,
            "created_at": self.created_at.isoformat(),
        }
