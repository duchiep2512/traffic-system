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
from app.core.config import setting_chatbot, LOG_PATH
from langgraph.checkpoint.memory import InMemorySaver
from app.schemas.ChatResponse import ChatResponse
from app.utils.chatbot_utils import pre_model_hook

def _agent_log(payload: dict):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as _f:
            _f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception as e:
        # Log exception để debug, không che giấu lỗi
        print(f"[ChatBotAgent] Error writing log: {e}")
        import traceback
        traceback.print_exc()

# ... phần prompt và class giữ nguyên ...

prompt = """Bạn là một trợ lý AI chuyên tư vấn giao thông bằng TIẾNG VIỆT.

MỤC TIÊU CHÍNH:
- Hiểu rõ ý định người dùng, trả lời ngắn gọn, chính xác và có cấu trúc.
- Khi người dùng yêu cầu thông tin về một hoặc nhiều tuyến đường, BẮT BUỘC phải cung cấp: số lượng và vận tốc trung bình của ô tô (ô tô) và xe máy (xe máy) cho từng tuyến.
- Nếu người dùng yêu cầu ảnh hoặc khi cần minh hoạ, gọi tool `get_frame_road(road_name)` để lấy ảnh hiện tại.
- Khi cần dữ liệu thời gian thực (số lượng/tốc độ), gọi tool `get_info_road(road_name)` và sử dụng kết quả trả về.

ĐỊNH DẠNG TRẢ LỜI (BẮT BUỘC THEO ĐÚNG FORMAT NÀY, KHÔNG ĐƯỢC THAY ĐỔI):
Tình hình giao thông tại đường [TÊN ĐƯỜNG]:
- Số lượng ô tô: [X]
- Vận tốc ô tô (trung bình): [Y] km/h
- Số lượng xe máy: [A]
- Vận tốc xe máy (trung bình): [B] km/h
- Nhận xét tổng quát: [Đánh giá: Thông thoáng / Đông đúc / Tắc nghẽn]
- Ghi chú về nguồn dữ liệu: Lấy từ `get_info_road` tại thời điểm [THỜI GIAN]

Đây là ảnh chụp nhanh của tuyến đường [TÊN ĐƯỜNG]: [URL từ get_frame_road]

Bạn nên [2-3 khuyến nghị cụ thể về hành động].

VÍ DỤ CỤ THỂ:
Tình hình giao thông tại đường Ngã Tư Sở:
- Số lượng ô tô: 14
- Vận tốc ô tô (trung bình): 44 km/h
- Số lượng xe máy: 27
- Vận tốc xe máy (trung bình): 63 km/h
- Nhận xét tổng quát: Giao thông tương đối thoáng đãng.
- Ghi chú về nguồn dữ liệu: Lấy từ `get_info_road` tại thời điểm 2024-05-15 10:10:10

Đây là ảnh chụp nhanh của tuyến đường Ngã Tư Sở: http://localhost:8000/api/v1/frames_no_auth/Ngã%20Tư%20Sở

Bạn nên duy trì tốc độ di chuyển ổn định và chú ý quan sát các phương tiện khác.

HƯỚNG DẪN HÀNH VI:
- LUÔN sử dụng format trên, KHÔNG được viết theo kiểu tự do hoặc tóm tắt ngắn gọn.
- Nếu người dùng không nói rõ tuyến đường, HỎI lại: "Bạn muốn thông tin tuyến đường nào?"
- Nếu có nhiều tuyến, trả lời theo mục rõ ràng cho từng tuyến với format trên.
- Tránh phán đoán không có dữ liệu; nếu thiếu dữ liệu, nói rõ: "Không có dữ liệu thời gian thực cho tuyến X" và gợi ý cách lấy.
- LUÔN gọi `get_frame_road(road_name)` khi người dùng yêu cầu ảnh hoặc khi cung cấp thông tin về tuyến đường, và đưa URL vào field `image` của response.

LƯU Ý KỸ THUẬT:
- Trả kết quả có thể parse được bởi chương trình (đặc biệt phần số liệu phải dễ trích xuất).
- Luôn trả bằng tiếng Việt.
- URL ảnh PHẢI được đưa vào field `image` của structured response, KHÔNG chỉ trong text.
"""

dotenv.load_dotenv()

class ChatBotAgent:
    def __init__(self):
        # Kiểm tra API key trước khi khởi tạo
        google_api_key = os.getenv("GOOGLE_API_KEY")
        if not google_api_key:
            error_msg = "GOOGLE_API_KEY không được tìm thấy trong environment variables"
            print(f"{error_msg}")
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H_API_KEY",
                "location": "ChatBotAgent.__init__",
                "message": "API key missing",
                "data": {"error": error_msg},
                "timestamp": int(time.time() * 1000),
            })
            raise ValueError(error_msg)
        
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
            "data": {
                "model_name": getattr(self.llm, "model", None),
                "has_api_key": bool(google_api_key),
                "api_key_length": len(google_api_key) if google_api_key else 0,
            },
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
            # region agent log
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H6",
                "location": "ChatBotAgent.get_response",
                "message": "before_invoke",
                "data": {"user_input": user_input, "thread_id": id},
                "timestamp": int(time.time() * 1000),
            })
            # endregion agent log
            
            response = await self.agent.ainvoke(
                {"messages": [{"role": "user", "content": user_input}]},
                config = config
            )
            
            # region agent log
            # Log toàn bộ response để debug
            response_str = str(response)[:500] if response else None
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H7",
                "location": "ChatBotAgent.get_response",
                "message": "after_invoke",
                "data": {
                    "response_keys": list(response.keys()) if isinstance(response, dict) else None,
                    "has_structured_response": 'structured_response' in response if isinstance(response, dict) else False,
                    "has_messages": 'messages' in response if isinstance(response, dict) else False,
                    "messages_count": len(response.get('messages', [])) if isinstance(response, dict) else 0,
                    "response_preview": response_str,
                },
                "timestamp": int(time.time() * 1000),
            })
            # endregion agent log
            
            # Log chi tiết messages để xem tool calls
            if isinstance(response, dict) and 'messages' in response:
                messages = response.get('messages', [])
                for i, msg in enumerate(messages):
                    # region agent log
                    msg_str = str(msg)[:300] if msg else None
                    msg_type = type(msg).__name__ if msg else None
                    _agent_log({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "H_TOOL_CALL",
                        "location": "ChatBotAgent.get_response",
                        "message": f"message_{i}",
                        "data": {
                            "message_index": i,
                            "message_type": msg_type,
                            "message_preview": msg_str,
                            "has_content": hasattr(msg, 'content') if msg else False,
                            "has_tool_calls": hasattr(msg, 'tool_calls') if msg else False,
                        },
                        "timestamp": int(time.time() * 1000),
                    })
                    # endregion agent log
            
            # Try to get structured_response, fall back to messages if not available
            if 'structured_response' in response and response['structured_response']:
                data = response['structured_response'].model_dump()
                # region agent log
                _agent_log({
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "H_STRUCTURED",
                    "location": "ChatBotAgent.get_response",
                    "message": "using_structured_response",
                    "data": {
                        "data_keys": list(data.keys()) if isinstance(data, dict) else None,
                        "has_message": 'message' in data if isinstance(data, dict) else False,
                        "has_image": 'image' in data if isinstance(data, dict) else False,
                        "image_count": len(data.get('image', [])) if isinstance(data, dict) and isinstance(data.get('image'), list) else 0,
                    },
                    "timestamp": int(time.time() * 1000),
                })
                # endregion agent log
            else:
                # Fallback: extract from messages
                messages = response.get('messages', [])
                if messages:
                    last_message = messages[-1]
                    content = last_message.content if hasattr(last_message, 'content') else str(last_message)
                    data = {"message": content, "image": []}
                    # region agent log
                    _agent_log({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "H_MESSAGES",
                        "location": "ChatBotAgent.get_response",
                        "message": "using_messages_fallback",
                        "data": {
                            "content_preview": content[:200] if content else None,
                            "content_length": len(content) if content else 0,
                        },
                        "timestamp": int(time.time() * 1000),
                    })
                    # endregion agent log
                else:
                    data = {"message": "Không nhận được phản hồi từ AI", "image": []}
                    # region agent log
                    _agent_log({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "H_NO_RESPONSE",
                        "location": "ChatBotAgent.get_response",
                        "message": "no_response",
                        "data": {},
                        "timestamp": int(time.time() * 1000),
                    })
                    # endregion agent log
            
            # region agent log
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H8",
                "location": "ChatBotAgent.get_response",
                "message": "final_data_before_image_extract",
                "data": {
                    "data_keys": list(data.keys()) if isinstance(data, dict) else None,
                    "message_preview": data.get("message", "")[:200] if isinstance(data, dict) else None,
                    "image_before_extract": data.get("image", []) if isinstance(data, dict) else None,
                },
                "timestamp": int(time.time() * 1000),
            })
            # endregion agent log

            # Extract image URLs from message text if model didn't populate image[]
            if isinstance(data, dict):
                text = data.get("message", "") or ""
                images = data.get("image") or []
                if isinstance(images, list):
                    # Pattern 1: URLs with image extensions
                    url_pattern_ext = r"(https?://[^\s]+?\.(?:jpg|jpeg|png|webp|gif|bmp))"
                    # Pattern 2: API endpoints for frames (frames_no_auth or frames)
                    url_pattern_api = r"(https?://[^\s]+?/(?:api/v1/)?frames(?:_no_auth)?/[^\s\)]+)"
                    found_ext = re.findall(url_pattern_ext, text, flags=re.IGNORECASE)
                    found_api = re.findall(url_pattern_api, text, flags=re.IGNORECASE)
                    found = found_ext + found_api
                    # region agent log
                    _agent_log({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "H_IMAGE_EXTRACT",
                        "location": "ChatBotAgent.get_response",
                        "message": "extracting_images",
                        "data": {
                            "images_before": images,
                            "urls_found_ext": found_ext,
                            "urls_found_api": found_api,
                            "urls_found_total": found,
                            "text_contains_url": bool(found),
                            "text_preview": text[:200],
                        },
                        "timestamp": int(time.time() * 1000),
                    })
                    # endregion agent log
                    for url in found:
                        # Clean URL: remove trailing punctuation that might be part of sentence
                        clean_url = url.rstrip('.,;:!?)')
                        if clean_url not in images:
                            images.append(clean_url)
                    data["image"] = images
                    # region agent log
                    _agent_log({
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "H_IMAGE_FINAL",
                        "location": "ChatBotAgent.get_response",
                        "message": "final_images",
                        "data": {
                            "images_after": images,
                            "image_count": len(images),
                        },
                        "timestamp": int(time.time() * 1000),
                    })
                    # endregion agent log
            return data
        except Exception as e:
            error_str = str(e)
            _agent_log({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "H4",
                "location": "ChatBotAgent.get_response",
                "message": "agent error",
                "data": {"error": error_str, "error_type": type(e).__name__},
                "timestamp": int(time.time() * 1000),
            })
            
            # Xử lý các lỗi cụ thể
            user_message = "AI gặp lỗi khi xử lý yêu cầu của bạn."
            
            if "PERMISSION_DENIED" in error_str or "leaked" in error_str.lower():
                user_message = (
                    "API key đã bị báo cáo là bị rò rỉ hoặc không hợp lệ.\n"
                    "Vui lòng:\n"
                    "1. Tạo API key mới tại https://aistudio.google.com/apikey\n"
                    "2. Cập nhật GOOGLE_API_KEY trong file .env\n"
                    "3. Khởi động lại server"
                )
            elif "RATE_LIMIT" in error_str or "quota" in error_str.lower():
                user_message = (
                    "Đã vượt quá giới hạn rate limit của API.\n"
                    "Vui lòng đợi một chút và thử lại sau.\n"
                    "(Free tier: ~5 requests/phút)"
                )
            elif "API key" in error_str or "authentication" in error_str.lower():
                user_message = (
                    "Lỗi xác thực API key.\n"
                    "Vui lòng kiểm tra GOOGLE_API_KEY trong file .env"
                )
            else:
                user_message = f"AI gặp lỗi: {error_str}"
            
            # Tránh trả về None gây lỗi parse phía client
            return {"message": user_message, "image": []}


if __name__ == "__main__":
    import asyncio
    import sys
    import os
    
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    
    from api.v1 import state
    from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
    
    async def test():
        print("="*60)
        print("TEST CHATBOT - Chạy trực tiếp từ ChatBotAgent.py")
        print("="*60)
        
        print("\n[1/2] Khởi tạo analyzer...")
        if state.analyzer is None:
            state.analyzer = AnalyzeOnRoadForMultiprocessing(
                show_log=False,
                show=False,
                is_join_processes=False
            )
            state.analyzer.run_multiprocessing()
            print("Đợi 5 giây để process khởi động...")
            await asyncio.sleep(5)
            print("Analyzer đã sẵn sàng!")
            
            print("\nĐợi 30 giây để có dữ liệu traffic (time_step)...")
            for i in range(40, 0, -5):
                print(f"Còn {i} giây...")
                await asyncio.sleep(5)
            print("Đã có dữ liệu traffic!")
        else:
            print("Analyzer đã được khởi tạo")
        
        print(f"Danh sách roads: {state.analyzer.names}")
        
        print("\nKiểm tra dữ liệu trong shared memory:")
        for road_name in state.analyzer.names:
            info = state.analyzer.get_info_road(road_name)
            print(f"   {road_name}: {info}")
        
        print("\n[2/2] Khởi tạo ChatBotAgent...")
        try:
            chat = ChatBotAgent()
            print("ChatBotAgent đã sẵn sàng!")
        except Exception as e:
            print(f"Lỗi: {e}")
            import traceback
            traceback.print_exc()
            return
        
        print("\n" + "="*60)
        print("TEST CHATBOT")
        print("="*60)
        
        test_question = "Tình trạng giao thông ở Ngã Tư Sở?"
        print(f"\nQuestion: {test_question}")
        
        try:
            res = await chat.get_response(test_question, id=1)
            print(f"\nResponse:")
            print(f"Message:\n{res['message']}")
            if res.get('image'):
                print(f"\nImage: {res['image']}")
            else:
                print("\nImage: Không có")
        except Exception as e:
            print(f"\nLỗi: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "="*60)
        print("TEST HOÀN TẤT!")
        print("="*60)
    
    asyncio.run(test())
    
    