from app.core.config import SettingServer

class LocalTestSettings(SettingServer):
    """Settings for local testing without database"""
    
    # Bypass database
    SKIP_DB_INIT: bool = True
    DATABASE_URL: str = "sqlite:///:memory:"  # Fallback nếu cần
    
    # Testing mode
    TESTING: bool = True
    DEBUG: bool = True
    
    # CORS cho local frontend
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://10.0.146.188:5173",  # IP của máy local (nếu frontend truy cập qua IP)
        "*"  # Cho phép tất cả origins trong local dev (tạm thời để debug)
    ]

local_settings = LocalTestSettings()