"""
MongoDB Database Configuration using Beanie ODM
"""
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import SettingServer
from typing import Optional

# Tạo instance của SettingServer
settings_server = SettingServer()

# MongoDB client
client: Optional[AsyncIOMotorClient] = None
database_name = "transportation_system"

async def init_database():
    """Khởi tạo kết nối MongoDB và Beanie"""
    global client
    
    if not settings_server.MONGODB_URL:
        print("⚠️ MONGODB_URL không được cấu hình, bỏ qua khởi tạo database")
        return
    
    try:
        # Tạo MongoDB client
        client = AsyncIOMotorClient(settings_server.MONGODB_URL)
        
        # Kiểm tra kết nối
        await client.admin.command('ping')
        print("✅ Kết nối MongoDB thành công")
        
        # Import models để đăng ký với Beanie
        from app.models.user import User
        from app.models.TokenLLM import TokenLLM
        from app.models.chat_message import ChatMessage
        
        # Khởi tạo Beanie với database và models
        await init_beanie(
            database=client[database_name],
            document_models=[User, ChatMessage, TokenLLM]
        )
        print("✅ Khởi tạo Beanie models thành công")
        
        # Tạo unique indexes cho User
        db = client[database_name]
        users_collection = db["users"]
        try:
            await users_collection.create_index("username", unique=True)
            await users_collection.create_index("email", unique=True)
            await users_collection.create_index("phone_number", unique=True)
            print("✅ Đã tạo unique indexes cho User")
        except Exception as idx_error:
            # Indexes có thể đã tồn tại, không phải lỗi nghiêm trọng
            print(f"⚠️ Lỗi tạo indexes (có thể đã tồn tại): {idx_error}")
        
        # Tạo unique index cho TokenLLM
        tokenllm_collection = db["token_llm"]
        try:
            await tokenllm_collection.create_index("user_id", unique=True)
            print("✅ Đã tạo unique index cho TokenLLM")
        except Exception as idx_error:
            print(f"⚠️ Lỗi tạo index TokenLLM (có thể đã tồn tại): {idx_error}")
        
    except Exception as e:
        print(f"❌ Lỗi khởi tạo MongoDB: {e}")
        raise e

async def close_database():
    """Đóng kết nối MongoDB"""
    global client
    if client:
        client.close()
        print("✅ Đã đóng kết nối MongoDB")

# Deprecated: Giữ lại để tương thích với code cũ (sẽ trả về None)
async def get_db():
    """Dependency để tương thích với code cũ - trả về None vì Beanie không cần session"""
    yield None

# Deprecated: Giữ lại để tương thích
async def create_tables():
    """Deprecated: MongoDB không cần tạo bảng, collections được tạo tự động"""
    print("⚠️ create_tables() không cần thiết với MongoDB - collections được tạo tự động")
    await init_database()
