# backend/app/test_chatbot.py
import asyncio
import sys
import os

# Thêm path để import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.chat_services.ChatBotAgent import ChatBotAgent
from app.api.v1 import state
from app.services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing

async def test_chatbot():
    print("="*60)
    print("TEST CHATBOT")
    print("="*60)
    
    # 1. Khởi tạo analyzer (bắt buộc vì chatbot cần lấy data từ analyzer)
    print("\n[1/3] Khởi tạo analyzer...")
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
        
        # Đợi 35 giây để analyzer tích lũy dữ liệu (time_step=30s, nên 35s là đủ)
        print("\n    ⏳ Đợi 35 giây để analyzer tích lũy dữ liệu traffic (time_step=30s)...")
        for i in range(60, 0, -5):
            print(f"    → Còn {i} giây...", end='\r')
            await asyncio.sleep(5)
        print("\n    → ✅ Đã đợi đủ 35 giây, bắt đầu test chatbot!")
    else:
        print("    → Analyzer đã được khởi tạo")
    
    # In danh sách roads
    if state.analyzer:
        print(f"\n📋 Danh sách roads: {state.analyzer.names}")
        
        # Kiểm tra process có đang chạy không
        print("\n🔍 Kiểm tra trạng thái processes:")
        if hasattr(state.analyzer, 'processes'):
            for i, (name, process) in enumerate(zip(state.analyzer.names, state.analyzer.processes), 1):
                is_alive = process.is_alive() if process else False
                status = "✅ Đang chạy" if is_alive else "❌ Đã dừng"
                print(f"   Process {i} ({name}): {status}")
        else:
            print("   ⚠️  Không tìm thấy processes")
        
        # Kiểm tra dữ liệu có sẵn không
        print("\n📊 Kiểm tra dữ liệu trong shared memory:")
        for road_name in state.analyzer.names:
            try:
                info = state.analyzer.get_info_road(road_name)
                print(f"   {road_name}: {info}")
                
                # Cảnh báo nếu tất cả đều 0
                if (info.get('count_car', 0) == 0 and 
                    info.get('count_motor', 0) == 0 and
                    info.get('speed_car', 0) == 0 and
                    info.get('speed_motor', 0) == 0):
                    print(f"      ⚠️  Cảnh báo: Tất cả dữ liệu đều = 0")
                    print(f"      → Có thể:")
                    print(f"         - Video không có xe đi qua")
                    print(f"         - Model không phát hiện được xe (conf threshold, region)")
                    print(f"         - Cần đợi thêm thời gian (time_step=30s)")
                    print(f"         - Process chưa xử lý đủ frame")
            except Exception as e:
                print(f"   {road_name}: Chưa có dữ liệu ({e})")
        
        # Kiểm tra frame có được cập nhật không (ít nhất frame phải có)
        print("\n🖼️  Kiểm tra frame có được cập nhật không:")
        for road_name in state.analyzer.names:
            try:
                frame = state.analyzer.get_frame_road(road_name)
                if frame and len(frame) > 0:
                    print(f"   {road_name}: ✅ Có frame ({len(frame)} bytes)")
                else:
                    print(f"   {road_name}: ❌ Không có frame")
            except Exception as e:
                print(f"   {road_name}: ❌ Lỗi khi lấy frame ({e})")
    
    # Debug: Kiểm tra state.analyzer trước khi khởi tạo chatbot
    print(f"\n🔍 DEBUG: Kiểm tra state.analyzer trước khi khởi tạo chatbot:")
    print(f"   state.analyzer is None: {state.analyzer is None}")
    if state.analyzer is not None:
        print(f"   state.analyzer type: {type(state.analyzer)}")
        print(f"   state.analyzer id: {id(state.analyzer)}")
        print(f"   state.analyzer.names: {state.analyzer.names}")
    
    # 2. Khởi tạo chatbot
    print("\n[2/3] Khởi tạo ChatBotAgent...")
    try:
        # Kiểm tra lại analyzer trong tool_func (dùng chung v1.state)
        from app.services.chat_services import tool_func
        print(f"   🔍 DEBUG: tool_func.v1.state.analyzer is None: {tool_func.v1.state.analyzer is None}")
        if tool_func.v1.state.analyzer is not None:
            print(f"   🔍 DEBUG: tool_func.v1.state.analyzer id: {id(tool_func.v1.state.analyzer)}")
            print(f"   🔍 DEBUG: state.analyzer id: {id(state.analyzer)}")
            print(f"   🔍 DEBUG: Same object? {tool_func.v1.state.analyzer is state.analyzer}")
        
        agent = ChatBotAgent()
        print("    → ChatBotAgent đã sẵn sàng!")
    except Exception as e:
        print(f"    → ❌ Lỗi: {e}")
        print("\n⚠️  Kiểm tra:")
        print("    - File .env có GOOGLE_API_KEY chưa?")
        print("    - Đã cài đặt langchain-google-genai chưa?")
        import traceback
        traceback.print_exc()
        return
    
    # 3. Test các câu hỏi
    print("\n[3/3] Test chatbot...")
    test_questions = [
        "Tình trạng giao thông ở Ngã Tư Sở?",
        "Cho tôi xem ảnh Ngã Tư Sở",
        "Thông tin về tất cả các tuyến đường",
    ]
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n{'─'*60}")
        print(f"Test {i}/{len(test_questions)}")
        print(f"❓ Question: {question}")
        print(f"{'─'*60}")
        
        # Thêm delay giữa các requests để tránh vượt quota
        # gemini-2.5-flash có giới hạn 5 requests/phút = 1 request mỗi 12 giây
        # Delay 15-20 giây để đảm bảo an toàn
        if i > 1:  # Không delay cho request đầu tiên
            delay_seconds = 15  # Đợi 15 giây giữa mỗi request (an toàn cho 5 req/min)
            print(f"⏳ Đợi {delay_seconds}s trước khi gửi request (tránh vượt quota - 5 req/min)...")
            await asyncio.sleep(delay_seconds)
        
        max_retries = 3
        retry_count = 0
        success = False
        
        while retry_count < max_retries and not success:
            try:
                response = await agent.get_response(question, id=1)
                print(f"\n✅ Response:")
                print(f"   Message:\n{response['message']}")
                if response.get('image'):
                    print(f"   Image: {response['image']}")
                else:
                    print(f"   Image: Không có")
                success = True
            except Exception as e:
                error_str = str(e)
                
                # Kiểm tra xem có phải lỗi quota không
                if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                    # Parse retry delay từ error message
                    import re
                    retry_match = re.search(r'retry in ([\d.]+)s', error_str, re.IGNORECASE)
                    if retry_match:
                        retry_delay = float(retry_match.group(1))
                        retry_delay = min(retry_delay + 2, 60)  # Thêm 2 giây buffer, max 60s
                    else:
                        retry_delay = 35  # Default 35 giây
                    
                    retry_count += 1
                    if retry_count < max_retries:
                        print(f"   ⚠️  Lỗi quota (429). Đợi {retry_delay:.1f}s rồi thử lại (lần {retry_count}/{max_retries})...")
                        await asyncio.sleep(retry_delay)
                    else:
                        print(f"   ❌ Lỗi quota sau {max_retries} lần thử. Bỏ qua test này.")
                        print(f"   💡 Gợi ý: Đợi 1 phút rồi chạy lại test này.")
                else:
                    # Lỗi khác, không retry
                    print(f"   ❌ Lỗi: {e}")
                    import traceback
                    traceback.print_exc()
                    break
    
    print(f"\n{'='*60}")
    print("TEST HOÀN TẤT!")
    print(f"{'='*60}")

if __name__ == "__main__":
    asyncio.run(test_chatbot())