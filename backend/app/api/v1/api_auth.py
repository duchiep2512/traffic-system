from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm  
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.core.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, get_current_user
from app.core.config import SettingServer
from pymongo.errors import DuplicateKeyError

# Tạo instance của SettingServer
settings_server = SettingServer()

router = APIRouter(prefix="/auth")

@router.post(
    path= "/register",
    summary="Đăng ký tài khoản mới",
    description="API đăng ký user mới với thông tin username, password, email và phone_number. Username, email và số điện thoại phải là duy nhất trong hệ thống.",
    status_code=201
)
async def register(user: UserCreate):
    """Đăng ký user mới với MongoDB"""
    # Kiểm tra xem username, email hoặc phone_number đã tồn tại chưa
    existing_user = await User.find_one({
        "$or": [
            {"username": user.username},
            {"email": user.email},
            {"phone_number": user.phone_number}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=400, 
            detail="Username, email hoặc số điện thoại đã tồn tại!"
        )
    
    # Tạo user mới
    new_user = User(
        username=user.username,
        password=hash_password(user.password),
        email=user.email,
        phone_number=user.phone_number
    )
    
    try:
        await new_user.insert()
        return {"msg": "Đăng ký thành công"}
    except DuplicateKeyError:
        raise HTTPException(
            status_code=400, 
            detail="Username, email hoặc số điện thoại đã tồn tại!"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi đăng ký: {str(e)}"
        )

@router.post(
    path= "/login",
    summary="Đăng nhập vào hệ thống",
    description="API đăng nhập OAuth2 compatible. Sử dụng email cùng với password để lấy access token. Token này dùng để xác thực các request tiếp theo."
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    response: Response = None,
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    Có thể login bằng:
    - username field: nhập email
    - password field: nhập password
    """
    # Tìm user theo email
    user_db = await User.find_one(User.email == form_data.username)
    
    if not user_db or not verify_password(form_data.password, user_db.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sai thông tin đăng nhập",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Build full user claims for the JWT (avoid sensitive fields like password)
    token_payload = {
        "sub": user_db.email,  # keep for backward compatibility
        "uid": str(user_db.id),  # MongoDB ObjectId -> string
        "username": user_db.username,
        "email": user_db.email,
        "phone_number": user_db.phone_number,
        "role_id": user_db.role_id,
    }
    token = create_access_token(token_payload)

    try:
        if response is not None:
            # Expiry in seconds
            max_age = 60 * 60 * 24 * settings_server.ACCESS_TOKEN_EXPIRE_DAYS
            # Note: For local HTTP development, secure=False. In production (HTTPS), set secure=True and SameSite=None
            response.set_cookie(
                key="access_token",
                value=token,
                httponly=True,
                max_age=max_age,
                expires=max_age,
                samesite="lax",
                secure=False,
                path="/",
            )
    except Exception:
        pass

    return {"access_token": token, "token_type": "bearer"}

@router.get(
    path= "/me",
    response_model=UserOut,
    summary="Lấy thông tin user hiện tại",
    description="API trả về thông tin chi tiết của user đang đăng nhập. Yêu cầu JWT authentication."
)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Lấy thông tin user hiện tại"""
    # Convert User model to UserOut schema
    # Beanie Document.id is ObjectId, convert to string for JSON serialization
    return UserOut(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        phone_number=current_user.phone_number,
        role_id=current_user.role_id
    )
