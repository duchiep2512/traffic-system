# tools/calculate_meter_per_pixel.py
import cv2
import numpy as np
import math

class MeterPerPixelCalculator:
    def __init__(self, video_path):
        self.video_path = video_path
        self.points = []
        self.real_distance_meters = None
        self.cap = cv2.VideoCapture(video_path)
        self.window_name = "Calculate Meter Per Pixel - Click 2 points, then enter real distance"
        
    def mouse_callback(self, event, x, y, flags, param):
        """Callback khi click chuột"""
        if event == cv2.EVENT_LBUTTONDOWN:
            if len(self.points) < 2:
                self.points.append([x, y])
                print(f"Point {len(self.points)}: ({x}, {y})")
                if len(self.points) == 2:
                    print("\nNhập khoảng cách thực tế giữa 2 điểm (mét):")
    
    def calculate_distance_pixels(self, p1, p2):
        """Tính khoảng cách giữa 2 điểm (pixel)"""
        return math.sqrt((p2[0] - p1[0])**2 + (p2[1] - p1[1])**2)
    
    def calculate(self):
        """Tính meter_per_pixel"""
        ret, frame = self.cap.read()
        if not ret:
            print("Không thể đọc video!")
            return None
        
        # Resize frame
        frame = cv2.resize(frame, (600, 400))
        
        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
        while True:
            display_frame = frame.copy()
            
            # Vẽ điểm 1
            if len(self.points) >= 1:
                cv2.circle(display_frame, tuple(self.points[0]), 5, (0, 255, 0), -1)
                cv2.putText(display_frame, "Point 1", 
                           (self.points[0][0]+10, self.points[0][1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Vẽ điểm 2 và đường thẳng
            if len(self.points) >= 2:
                cv2.circle(display_frame, tuple(self.points[1]), 5, (0, 255, 0), -1)
                cv2.putText(display_frame, "Point 2", 
                           (self.points[1][0]+10, self.points[1][1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                
                # Vẽ đường thẳng
                cv2.line(display_frame, 
                        tuple(self.points[0]), 
                        tuple(self.points[1]), 
                        (255, 0, 0), 2)
                
                # Tính khoảng cách pixel
                pixel_distance = self.calculate_distance_pixels(
                    self.points[0], 
                    self.points[1]
                )
                
                cv2.putText(display_frame, 
                           f"Pixel distance: {pixel_distance:.1f} px", 
                           (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 
                           0.7, (255, 255, 255), 2)
                
                # Nếu đã nhập khoảng cách thực tế
                if self.real_distance_meters is not None:
                    meter_per_pixel = self.real_distance_meters / pixel_distance
                    cv2.putText(display_frame, 
                               f"Meter per pixel: {meter_per_pixel:.4f}", 
                               (10, 60), 
                               cv2.FONT_HERSHEY_SIMPLEX, 
                               0.7, (0, 255, 255), 2)
            
            cv2.imshow(self.window_name, display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                self.points = []
                self.real_distance_meters = None
                print("Đã reset!")
            elif key == ord('e') and len(self.points) == 2:
                # Nhập khoảng cách thực tế
                try:
                    distance = float(input("Nhập khoảng cách thực tế (mét): "))
                    self.real_distance_meters = distance
                    
                    pixel_distance = self.calculate_distance_pixels(
                        self.points[0], 
                        self.points[1]
                    )
                    meter_per_pixel = distance / pixel_distance
                    
                    print("\n" + "="*50)
                    print("KẾT QUẢ:")
                    print("="*50)
                    print(f"Khoảng cách pixel: {pixel_distance:.2f} px")
                    print(f"Khoảng cách thực tế: {distance} m")
                    print(f"Meter per pixel: {meter_per_pixel:.6f}")
                    print("\nCopy giá trị này vào config.py:")
                    print(f"METER_PER_PIXELS = [{meter_per_pixel:.6f}]")
                    print("="*50)
                except ValueError:
                    print("Giá trị không hợp lệ!")
        
        cv2.destroyAllWindows()
        self.cap.release()
        
        if len(self.points) == 2 and self.real_distance_meters is not None:
            pixel_distance = self.calculate_distance_pixels(
                self.points[0], 
                self.points[1]
            )
            return self.real_distance_meters / pixel_distance
        return None

if __name__ == "__main__":
    video_path = "./video_test/Ngã Tư Sở.mp4"
    
    calculator = MeterPerPixelCalculator(video_path)
    result = calculator.calculate()
    
    if result:
        print(f"\nMeter per pixel: {result:.6f}")