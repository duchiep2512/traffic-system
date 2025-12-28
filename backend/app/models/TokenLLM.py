"""
TokenLLM Model for MongoDB using Beanie
Quản lý token quota cho LLM của từng user
"""
from beanie import Document
from pydantic import Field
from typing import Optional


class TokenLLM(Document):
    """
    TokenLLM document model cho MongoDB
    
    Attributes:
        user_id: ID của user (primary key, unique)
        token: Số lượng token còn lại (default: 5000)
    """
    user_id: str = Field(..., description="ID của user (unique)")
    token: int = Field(default=5000, description="Số lượng token còn lại")
    
    class Settings:
        name = "token_llm"  # Collection name trong MongoDB
        indexes = [
            [("user_id", 1)],  # Unique index cho user_id (1-1 relationship)
        ]
    
    def __repr__(self):
        return f"<TokenLLM(user_id={self.user_id}, token={self.token})>"
