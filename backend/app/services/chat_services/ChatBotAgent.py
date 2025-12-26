# backend/app/services/chat_services/ChatBotAgent.py
import dotenv
import sys
import os
import json
import time
import re

# Thêm path vào sys.path nếu chạy trực tiếp từ file này
if __name__ == "__main__" or __file__.endswith("ChatBotAgent.py"):
    # Lấy thư mục backend/app (lên 2 cấp từ file hiện tại)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.dirname(os.path.dirname(current_dir))
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)

from app.services.chat_services.tool_func import get_frame_road, get_info_road
from langchain.agents import create_agent
from langgraph.prebuilt import create_react_agent
from app.core.config import setting_chatbot
from langgraph.checkpoint.memory import InMemorySaver
from app.schemas.ChatResponse import ChatResponse
from app.utils.chatbot_utils import pre_model_hook

LOG_PATH = r"d:\Smart-Traffic-Monitoring-System\seminar\.cursor\debug.log"

def _agent_log(payload: dict):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload) + "\n")
    except Exception:
        pass

# ... phần prompt và class giữ nguyên ...

prompt = """Bạn là một trợ lý AI chuyên tư vấn giao thông bằng TIẾNG VIỆT.

MỤC TIÊU CHÍNH:
- Hiểu rõ ý định người dùng, trả lời ngắn gọn, chính xác và có cấu trúc.
- Khi người dùng yêu cầu thông tin về một hoặc nhiều tuyến đường, BẮT BUỘC phải cung cấp: số lượng và vận tốc trung bình của ô tô (ô tô) và xe máy (xe máy) cho từng tuyến.
- Nếu người dùng yêu cầu ảnh hoặc khi cần minh hoạ, gọi tool `get_frame_road(road_name)` để lấy ảnh hiện tại.
- Khi cần dữ liệu thời gian thực (số lượng/tốc độ), gọi tool `get_info_road(road_name)` và sử dụng kết quả trả về.

ĐỊNH DẠNG TRẢ LỜI (LUÔN BẰNG TIẾNG VIỆT):
1) Tóm tắt ngắn (1 câu)
2) Với mỗi tuyến đường được hỏi: tiêu đề tuyến ->
    - Số lượng ô tô: X
    - Vận tốc ô tô (trung bình): Y km/h
    - Số lượng xe máy: A
    - Vận tốc xe máy (trung bình): B km/h
    - Nhận xét tổng quát: (Ví dụ: Thông thoáng / Đông đúc / Tắc nghẽn)
    - Ghi chú về nguồn dữ liệu: (ví dụ: Lấy từ `get_info_road` tại thời điểm T)
3) Hành động khuyến nghị (2-3 gợi ý cụ thể, ví dụ chọn lộ trình, thời gian đi, cảnh báo)
4) Nếu người dùng yêu cầu ảnh: kèm `image` (URL hoặc binary) lấy từ `get_frame_road(road_name)` và ghi chú tên file/đường dẫn.

HƯỚNG DẪN HÀNH VI:
- Nếu người dùng không nói rõ tuyến đường, HỎI lại: "Bạn muốn thông tin tuyến đường nào?"
- Nếu có nhiều tuyến, trả lời theo mục rõ ràng cho từng tuyến.
- Tránh phán đoán không có dữ liệu; nếu thiếu dữ liệu, nói rõ: "Không có dữ liệu thời gian thực cho tuyến X" và gợi ý cách lấy (ví dụ: yêu cầu quyền, thử lại sau).
- Giữ giọng chuyên nghiệp, thân thiện và nhấn mạnh dữ liệu khi đưa khuyến nghị.

LƯU Ý KỸ THUẬT:
- Trả kết quả có thể parse được bởi chương trình (đặc biệt phần số liệu phải dễ trích xuất).
- Luôn trả bằng tiếng Việt.
"""

dotenv.load_dotenv()

class ChatBotAgent:
    def __init__(self):
        self.prompt = prompt
        self.llm = setting_chatbot.LLM
        self.checkpointer = InMemorySaver()
        # region agent log
        _agent_log({
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H4",
            "location": "ChatBotAgent.__init__",
            "message": "init chatbot agent",
            "data": {"model_name": getattr(self.llm, "model", None)},
            "timestamp": int(time.time() * 1000),
        })
        # endregion agent log
        self.agent = create_react_agent(model= self.llm, 
                                tools= [get_frame_road, get_info_road], 
                                prompt= prompt,
                                response_format= ChatResponse,
                                pre_model_hook= pre_model_hook,
                                checkpointer= self.checkpointer)

    
    async def get_response(self, user_input: str, id: int) -> dict:
        """Lấy phản hồi từ Agent dựa trên đầu vào của người dùng.

        Args:
            user_input (str): Nội dung tin nhắn của người dùng.

        Returns:
            dict: Phản hồi từ Agent, bao gồm hình ảnh và văn bản.
        """
        
        
        config = {"configurable": {"thread_id": f"{id}"}}
        # region agent log
        _agent_log({
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H4",
            "location": "ChatBotAgent.get_response",
            "message": "invoke agent",
            "data": {"thread_id": id, "user_input": user_input, "model_name": getattr(self.llm, "model", None)},
            "timestamp": int(time.time() * 1000),
        })
        # endregion agent log
        try:
            response = await self.agent.ainvoke(
                {"messages": [{"role": "user", "content": user_input}]},
                config = config
            )
            data = response['structured_response'].model_dump()

            # Extract image URLs from message text if model didn't populate image[]
            if isinstance(data, dict):
                text = data.get("message", "") or ""
                images = data.get("image") or []
                if isinstance(images, list):
                    url_pattern = r"(https?://[^\s]+?\.(?:jpg|jpeg|png|webp|gif|bmp))"
                    found = re.findall(url_pattern, text, flags=re.IGNORECASE)
                    for url in found:
                        if url not in images:
                            images.append(url)
                    data["image"] = images
            return data
        except Exception as e:
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H4",
                "location": "ChatBotAgent.get_response",
                "message": "agent error",
                "data": {"error": str(e)},
                "timestamp": int(time.time() * 1000),
            })
            # Tránh trả về None gây lỗi parse phía client
            return {"message": f"AI gặp lỗi: {e}", "image": []}


# backend/app/services/chat_services/ChatBotAgent.py
# ... phần code hiện tại giữ nguyên ...

# ************ TESTING ************
if __name__ == "__main__":
    import asyncio
    import sys
    import os
    
    # Thêm path để import
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    # Import state và analyzer (cần khởi tạo analyzer trước)
    from api.v1 import state
    from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
    
    async def test():
        print("="*60)
        print("TEST CHATBOT - Chạy trực tiếp từ ChatBotAgent.py")
        print("="*60)
        
        # 1. Khởi tạo analyzer
        print("\n[1/2] Khởi tạo analyzer...")
        if state.analyzer is None:
            state.analyzer = AnalyzeOnRoadForMultiprocessing(
                show_log=False,
                show=False,
                is_join_processes=False
            )
            state.analyzer.run_multiprocessing()
            print("    → Đợi 5 giây để process khởi động...")
            await asyncio.sleep(5)
            print("    → Analyzer đã sẵn sàng!")
            
            # THÊM: Đợi thêm 30 giây để có dữ liệu
            print("\n    ⏳ Đợi 30 giây để có dữ liệu traffic (time_step)...")
            for i in range(40, 0, -5):
                print(f"    → Còn {i} giây...")
                await asyncio.sleep(5)
            print("    → Đã có dữ liệu traffic!")
        else:
            print("    → Analyzer đã được khởi tạo")
        
        print(f"📋 Danh sách roads: {state.analyzer.names}")
        
        # Kiểm tra dữ liệu trước khi test
        print("\n📊 Kiểm tra dữ liệu trong shared memory:")
        for road_name in state.analyzer.names:
            info = state.analyzer.get_info_road(road_name)
            print(f"   {road_name}: {info}")
        
        # 2. Khởi tạo chatbot
        print("\n[2/2] Khởi tạo ChatBotAgent...")
        try:
            chat = ChatBotAgent()
            print("    → ChatBotAgent đã sẵn sàng!")
        except Exception as e:
            print(f"    → ❌ Lỗi: {e}")
            import traceback
            traceback.print_exc()
            return
        
        # 3. Test
        print("\n" + "="*60)
        print("TEST CHATBOT")
        print("="*60)
        
        test_question = "Tình trạng giao thông ở Ngã Tư Sở?"
        print(f"\n❓ Question: {test_question}")
        
        try:
            res = await chat.get_response(test_question, id=1)
            print(f"\n✅ Response:")
            print(f"Message:\n{res['message']}")
            if res.get('image'):
                print(f"\nImage: {res['image']}")
            else:
                print("\nImage: Không có")
        except Exception as e:
            print(f"\n❌ Lỗi: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*60)
        print("TEST HOÀN TẤT!")
        print("="*60)
    
    # THÊM dòng này để chạy async function
    asyncio.run(test())
    
    