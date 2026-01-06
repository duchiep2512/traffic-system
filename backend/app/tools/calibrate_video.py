# tools/calibrate_video.py
import cv2
import numpy as np
import math

class VideoCalibrator:
    def __init__(self, video_path):
        self.video_path = video_path
        self.region_points = []
        self.calibration_points = []
        self.real_distance = None
        self.mode = "region"  # "region" or "calibrate"
        self.cap = cv2.VideoCapture(video_path)
        self.window_name = "Video Calibrator"
        
    def mouse_callback(self, event, x, y, flags, param):
        if self.mode == "region":
            if event == cv2.EVENT_LBUTTONDOWN:
                self.region_points.append([x, y])
                print(f"Region point {len(self.region_points)}: ({x}, {y})")
        elif self.mode == "calibrate":
            if event == cv2.EVENT_LBUTTONDOWN and len(self.calibration_points) < 2:
                self.calibration_points.append([x, y])
                print(f"Calibration point {len(self.calibration_points)}: ({x}, {y})")
    
    def calculate_pixel_distance(self, p1, p2):
        return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
    
    def run(self):
        ret, frame = self.cap.read()
        if not ret:
            print("Không thể đọc video!")
            return
        
        frame = cv2.resize(frame, (600, 400))
        
        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
        print("\n" + "="*60)
        print("VIDEO CALIBRATOR")
        print("="*60)
        print("Chế độ REGION (vẽ polygon):")
        print("  - Click chuột để thêm điểm vào polygon")
        print("  - Nhấn 'q' để hoàn thành region")
        print("  - Nhấn 'r' để reset region")
        print("\nChế độ CALIBRATE (tính meter_per_pixel):")
        print("  - Nhấn 'c' để chuyển sang chế độ calibrate")
        print("  - Click 2 điểm trên video")
        print("  - Nhấn 'e' và nhập khoảng cách thực tế (mét)")
        print("  - Nhấn 'ESC' để thoát")
        print("="*60 + "\n")
        
        while True:
            display_frame = frame.copy()
            
            # Vẽ region
            if len(self.region_points) >= 3:
                pts = np.array(self.region_points, np.int32)
                cv2.polylines(display_frame, [pts], True, (0, 255, 255), 2)
                cv2.fillPoly(display_frame, [pts], (0, 255, 255, 50))
            
            for i, pt in enumerate(self.region_points):
                cv2.circle(display_frame, tuple(pt), 5, (0, 255, 0), -1)
                cv2.putText(display_frame, str(i+1), 
                           (pt[0]+10, pt[1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.3, (0, 255, 0), 1)
            
            # Vẽ calibration line
            if len(self.calibration_points) >= 2:
                cv2.line(display_frame, 
                        tuple(self.calibration_points[0]), 
                        tuple(self.calibration_points[1]), 
                        (255, 0, 0), 2)
                for i, pt in enumerate(self.calibration_points):
                    cv2.circle(display_frame, tuple(pt), 5, (255, 0, 0), -1)
                
                pixel_dist = self.calculate_pixel_distance(
                    self.calibration_points[0],
                    self.calibration_points[1]
                )
                cv2.putText(display_frame, 
                           f"Pixel: {pixel_dist:.1f}px", 
                           (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                if self.real_distance:
                    meter_per_pixel = self.real_distance / pixel_dist
                    cv2.putText(display_frame, 
                               f"Meter/pixel: {meter_per_pixel:.6f}", 
                               (10, 60), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Hiển thị mode
            mode_text = f"Mode: {self.mode.upper()}"
            cv2.putText(display_frame, mode_text, 
                       (10, frame.shape[0] - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            cv2.imshow(self.window_name, display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == 27:  # ESC
                break
            elif key == ord('q') and self.mode == "region":
                if len(self.region_points) >= 3:
                    print("\nRegion hoàn thành!")
                    self.mode = "calibrate"
                    print("Chuyển sang chế độ CALIBRATE")
            elif key == ord('r'):
                if self.mode == "region":
                    self.region_points = []
                    print("Đã reset region!")
                else:
                    self.calibration_points = []
                    self.real_distance = None
                    print("Đã reset calibration!")
            elif key == ord('c'):
                self.mode = "calibrate"
                print("Chuyển sang chế độ CALIBRATE")
            elif key == ord('e') and len(self.calibration_points) == 2:
                try:
                    distance = float(input("Nhập khoảng cách thực tế (mét): "))
                    self.real_distance = distance
                    
                    pixel_dist = self.calculate_pixel_distance(
                        self.calibration_points[0],
                        self.calibration_points[1]
                    )
                    meter_per_pixel = distance / pixel_dist
                    
                    print("\n" + "="*60)
                    print("KẾT QUẢ CALIBRATION:")
                    print("="*60)
                    print(f"Khoảng cách pixel: {pixel_dist:.2f} px")
                    print(f"Khoảng cách thực tế: {distance} m")
                    print(f"Meter per pixel: {meter_per_pixel:.6f}")
                    print("="*60)
                except ValueError:
                    print("Giá trị không hợp lệ!")
        
        cv2.destroyAllWindows()
        self.cap.release()
        
        # In kết quả
        print("\n" + "="*60)
        print("KẾT QUẢ CUỐI CÙNG:")
        print("="*60)
        
        if len(self.region_points) >= 3:
            region_array = np.array(self.region_points)
            print("\nREGION (copy vào config.py):")
            print("np.array([")
            for point in region_array:
                print(f"    {point.tolist()},")
            print("])")
        
        if self.real_distance and len(self.calibration_points) == 2:
            pixel_dist = self.calculate_pixel_distance(
                self.calibration_points[0],
                self.calibration_points[1]
            )
            meter_per_pixel = self.real_distance / pixel_dist
            print(f"\nMETER_PER_PIXEL: {meter_per_pixel:.6f}")
        print("="*60)

if __name__ == "__main__":
    video_path = "../video_test/Ngã Tư Sở.mp4"
    
    calibrator = VideoCalibrator(video_path)
    calibrator.run()