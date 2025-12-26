# backend/app/test_shared_memory_info.py
import time
import signal
import sys
from datetime import datetime
import numpy as np
from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from utils.transport_utils import enrich_info_with_thresholds

def signal_handler(sig, frame):
    """Xử lý Ctrl+C"""
    print("\n\nĐang dừng tất cả processes...")
    if 'analyzer' in globals():
        analyzer.cleanup_processes()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def get_frame_info(frame_data):
    """Lấy thông tin về frame từ shared memory"""
    if frame_data is None:
        return "Không có", None, None
    
    try:
        if isinstance(frame_data, np.ndarray):
            height, width = frame_data.shape[:2]
            return "Có (numpy array)", width, height
        elif isinstance(frame_data, bytes):
            return "Có (bytes)", len(frame_data), "N/A"
        elif isinstance(frame_data, str):
            return "Có (string)", len(frame_data), "N/A"
        else:
            return f"Có ({type(frame_data).__name__})", "N/A", "N/A"
    except Exception as e:
        return f"Lỗi: {e}", None, None

def print_detailed_shared_memory_info(analyzer):
    """In thông tin chi tiết từ shared memory"""
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    print("\n" + "="*80)
    print(f"SHARED MEMORY INFO - {current_time}")
    print("="*80)
    
    if not analyzer.names:
        print("⚠️  Chưa có road nào được khởi tạo")
        return
    
    for road_name in analyzer.names:
        print(f"\n🛣️  ROAD: {road_name}")
        print("-" * 80)
        
        try:
            # Lấy info từ shared memory
            info_dict = analyzer.shared_data[road_name]['info']
            frame_dict = analyzer.shared_data[road_name]['frame']
            
            # Thông tin Info
            print("📊 INFO (cập nhật mỗi 30s):")
            info_data = dict(info_dict)
            print(f"   - Count Car:     {info_data.get('count_car', 0)} xe")
            print(f"   - Speed Car TB:   {info_data.get('speed_car', 0):.2f} km/h")
            print(f"   - Count Motor:   {info_data.get('count_motor', 0)} xe")
            print(f"   - Speed Motor TB: {info_data.get('speed_motor', 0):.2f} km/h")
            
            # Enrich với thresholds
            try:
                enriched = enrich_info_with_thresholds(info_data, road_name)
                if 'density_status' in enriched:
                    print(f"   - Density Status: {enriched.get('density_status', 'N/A')}")
                if 'speed_status' in enriched:
                    print(f"   - Speed Status:   {enriched.get('speed_status', 'N/A')}")
            except:
                pass
            
            # Thông tin Frame
            print("\n🖼️  FRAME (cập nhật mỗi frame):")
            frame_data = frame_dict.get('frame', None)
            frame_status, frame_size1, frame_size2 = get_frame_info(frame_data)
            print(f"   - Status: {frame_status}")
            if frame_size1 is not None:
                if frame_size2 is not None:
                    print(f"   - Size: {frame_size1} x {frame_size2} pixels")
                else:
                    print(f"   - Size: {frame_size1} bytes")
            
            # Thông tin về shared memory structure
            print("\n💾 SHARED MEMORY STRUCTURE:")
            print(f"   - Info dict type: {type(info_dict).__name__}")
            print(f"   - Frame dict type: {type(frame_dict).__name__}")
            print(f"   - Info keys: {list(info_dict.keys())}")
            print(f"   - Frame keys: {list(frame_dict.keys())}")
            
        except Exception as e:
            print(f"   ❌ Lỗi khi đọc shared memory: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "="*80)

if __name__ == '__main__':
    print("="*80)
    print("TEST HIỂN THỊ THÔNG TIN TỪ SHARED MEMORY")
    print("="*80)
    
    # Khởi tạo analyzer
    print("\n[1/3] Đang khởi tạo AnalyzeOnRoadForMultiprocessing...")
    analyzer = AnalyzeOnRoadForMultiprocessing(
        show_log=False,
        show=False,
        is_join_processes=False
    )
    
    # Chạy multiprocessing
    print("[2/3] Đang khởi động các process xử lý video...")
    analyzer.run_multiprocessing()
    
    # Đợi process khởi động
    print("[3/3] Đợi 5 giây để các process khởi động...")
    time.sleep(5)
    
    print("\n" + "="*80)
    print("BẮT ĐẦU HIỂN THỊ THÔNG TIN TỪ SHARED MEMORY")
    print("Nhấn Ctrl+C để dừng")
    print("="*80)
    
    try:
        update_interval = 2  # Cập nhật mỗi 2 giây
        update_count = 0
        
        while True:
            update_count += 1
            print_detailed_shared_memory_info(analyzer)
            print(f"\n⏱️  Update #{update_count} - Next update in {update_interval}s...")
            time.sleep(update_interval)
            
    except KeyboardInterrupt:
        print("\n\nĐang dừng...")
    finally:
        analyzer.cleanup_processes()
        print("Đã dừng tất cả processes.")