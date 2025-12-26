from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import SettingServer
from typing import Optional

# Tạo instance của SettingServer
settings_server = SettingServer()

# Chỉ tạo engine nếu có DATABASE_URL
engine: Optional[object] = None
AsyncSessionLocal: Optional[sessionmaker] = None

if settings_server.DATABASE_URL:
    engine = create_async_engine(settings_server.DATABASE_URL, future=True, echo=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def create_tables():
    """Tạo tất cả bảng trong database"""
    if not engine:
        print("⚠️ DATABASE_URL không được cấu hình, bỏ qua tạo bảng database")
        return
    
    # Import models để đảm bảo chúng được đăng ký với Base
    from models.user import User
    from models.TokenLLM import TokenLLM
    from models.chat_message import ChatMessage
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    """Dependency để lấy database session"""
    if not AsyncSessionLocal:
        # Trả về None nếu không có database (cho local mode)
        yield None
        return
    
    async with AsyncSessionLocal() as session:
        yield session
