"""
User Model for MongoDB using Beanie
"""
from beanie import Document
from typing import Optional, List
from pydantic import Field


class User(Document):
    """
    User document model cho MongoDB
    
    Attributes:
        username: Tên đăng nhập (unique)
        password: Mật khẩu đã hash
        role_id: Vai trò (0=admin, 1=user)
        email: Email (unique)
        phone_number: Số điện thoại (unique)
    """
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)
    role_id: int = Field(default=1)  # 0=admin, 1=user
    email: str = Field(..., min_length=1)
    phone_number: str = Field(..., min_length=1, max_length=20)
    
    class Settings:
        name = "users"  # Collection name trong MongoDB
        # Unique indexes sẽ được tạo tự động khi insert
        # Cần tạo unique indexes thủ công trong MongoDB hoặc qua migration
    
    def __repr__(self):
        user_id = str(self.id) if hasattr(self, 'id') else "None"
        return f"<User(id={user_id}, username={self.username}, email={self.email})>"
