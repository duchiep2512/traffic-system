from fastapi import APIRouter, Depends, HTTPException
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.utils.jwt_handler import get_current_user
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class PasswordUpdateRequest(BaseModel):
    old_password: str
    new_password: str

@router.put(
    "/password",
    summary="Thay đổi mật khẩu",
    description="API cập nhật mật khẩu của user. Yêu cầu xác thực mật khẩu cũ và JWT authentication."
)
async def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update user password. Requires:
    - Old password verification
    - JWT authentication
    """
    # Verify old password
    if not verify_password(request.old_password, current_user.password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu hiện tại không đúng!"
        )
    
    # Hash new password
    hashed_password = hash_password(request.new_password)
    
    # Update password in MongoDB
    try:
        current_user.password = hashed_password
        await current_user.save()
        return {"message": "Cập nhật mật khẩu thành công!"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Đã xảy ra lỗi khi cập nhật mật khẩu. Vui lòng thử lại sau."
        )

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None

@router.put(
    "/profile",
    summary="Cập nhật thông tin cá nhân",
    description="API cập nhật profile của user (username, email, phone_number). Username, email và số điện thoại phải là duy nhất. Yêu cầu JWT authentication."
)
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Update user profile information. Requires JWT authentication.
    """
    try:
        # Check for unique constraints
        if request.username and request.username != current_user.username:
            existing = await User.find_one(User.username == request.username)
            if existing:
                raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại!")
            current_user.username = request.username
            
        if request.email and request.email != current_user.email:
            existing = await User.find_one(User.email == request.email)
            if existing:
                raise HTTPException(status_code=400, detail="Email đã được sử dụng!")
            current_user.email = request.email
            
        if request.phone_number and request.phone_number != current_user.phone_number:
            existing = await User.find_one(User.phone_number == request.phone_number)
            if existing:
                raise HTTPException(status_code=400, detail="Số điện thoại đã được sử dụng!")
            current_user.phone_number = request.phone_number

        await current_user.save()
        return {"message": "Cập nhật thông tin thành công!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Đã xảy ra lỗi khi cập nhật thông tin. Vui lòng thử lại sau."
        )
