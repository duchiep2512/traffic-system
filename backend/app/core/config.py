import os
from dotenv import load_dotenv
import numpy as np

load_dotenv()

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(APP_DIR)
LOG_PATH = os.path.join(BACKEND_DIR, "logs", "debug.log")

class SettingServer:
    PROJECT_NAME = "FastAPI CRUD with JWT"
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/transportation_system")
    DATABASE_URL = os.getenv("DATABASE_URL")
    JWT_SECRET = os.getenv("JWT_SECRET_KEY")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "7"))

class SettingMetricTransport:
    REGIONS = [
        np.array([[50, 400], [50, 265], [370, 130], [540, 130], [490, 400]]),
        np.array([[230, 400], [90, 260], [350, 200], [600, 320], [600, 400]]),
        np.array([[50, 400], [50, 340], [400, 125], [530, 185], [470, 400]]),
        np.array([[140, 400], [400, 200], [550, 200], [530, 400]]),
        np.array([[50, 400], [50, 320], [390, 130], [550, 220], [480, 400]]),
    ]

    PATH_VIDEOS = [
       os.path.join(APP_DIR, 'video_test', 'Văn Phú.mp4'),
       os.path.join(APP_DIR, 'video_test', 'Văn Quán.mp4'),
       os.path.join(APP_DIR, 'video_test', 'Nguyễn Trãi.mp4'),
       os.path.join(APP_DIR, 'video_test', 'Ngã Tư Sở.mp4'),
       os.path.join(APP_DIR, 'video_test', 'Đường Láng.mp4'),
    ]

    METER_PER_PIXELS = [
                        0.1,
                        0.15,
                        0.42,
                        0.15,
                        0.05
                        ]
    MODELS_PATH = os.path.join(APP_DIR, 'ai_models', 'model N', 'openvino models', 'best_int8_openvino_model')

    DEVICE = 'cpu'

class SettingChatBot:
    from langchain_google_genai import ChatGoogleGenerativeAI

    # Chọn model có generateContent trong list_models (free/key-dependent).
    # Kết quả từ list_models hiện tại: dùng ổn "gemini-1.5-flash" (có tool calling).
    # Lưu ý quota free: ~5 req/phút => nên delay 12-15s giữa các request khi test.
    
    _google_api_key = os.getenv("GOOGLE_API_KEY")
    if not _google_api_key:
        print("WARNING: GOOGLE_API_KEY không được tìm thấy trong environment variables!")
        print("Vui lòng tạo file .env trong thư mục backend và thêm: GOOGLE_API_KEY=your_api_key_here")
        print("Hoặc export GOOGLE_API_KEY trong terminal trước khi chạy server")
    else:
        print(f"GOOGLE_API_KEY đã được tìm thấy (length: {len(_google_api_key)} chars)")
    
    LLM = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.6,
        max_output_tokens=1024,
    )

class SettingNetwork:
    BASE_URL_API = "http://localhost:8000"
    URL_FRONTEND = "http://localhost:5173"

settings_server = SettingServer()
settings_metric_transport = SettingMetricTransport()
settings_chat_bot = SettingChatBot()
settings_network = SettingNetwork()
setting_chatbot = SettingChatBot()


from typing import Dict, TypedDict


class RoadThreshold(TypedDict):
    v: int
    c1: int
    c2: int


TRAFFIC_THRESHOLDS: Dict[str, RoadThreshold] = {
    "Đường Láng": {"v": 13, "c1": 17, "c2": 26},
    "Ngã Tư Sở": {"v": 17, "c1": 45, "c2": 57},
    "Nguyễn Trãi": {"v": 30, "c1": 25, "c2": 35},
    "Văn Quán": {"v": 10, "c1": 10, "c2": 17},
    "Văn Phú": {"v": 15, "c1": 18, "c2": 26},
}

DEFAULT_THRESHOLD: RoadThreshold = {"v": 15, "c1": 15, "c2": 25}


def get_threshold_for_road(road_name: str) -> RoadThreshold:
    return TRAFFIC_THRESHOLDS.get(road_name, DEFAULT_THRESHOLD)
