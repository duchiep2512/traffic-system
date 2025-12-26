# tools/draw_region.py
import cv2
import numpy as np

class RegionDrawer:
    def __init__(self, video_path):
        self.video_path = video_path
        self.points = []
        self.cap = cv2.VideoCapture(video_path)
        self.window_name = "Draw Region - Click to add points, 'q' to finish, 'r' to reset"
        
    def mouse_callback(self, event, x, y, flags, param):
        """Callback khi click chuột"""
        if event == cv2.EVENT_LBUTTONDOWN:
            self.points.append([x, y])
            print(f"Point {len(self.points)}: ({x}, {y})")
    
    def draw_region(self):
        """Vẽ region polygon trên video"""
        ret, frame = self.cap.read()
        if not ret:
            print("Không thể đọc video!")
            return None
        
        # Resize frame để dễ nhìn
        frame = cv2.resize(frame, (600, 400))
        
        cv2.namedWindow(self.window_name)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
        while True:
            display_frame = frame.copy()
            
            # Vẽ các điểm đã click
            for i, point in enumerate(self.points):
                cv2.circle(display_frame, tuple(point), 5, (0, 255, 0), -1)
                cv2.putText(display_frame, str(i+1), 
                           (point[0]+10, point[1]), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Vẽ polygon nếu có ít nhất 3 điểm
            if len(self.points) >= 3:
                pts = np.array(self.points, np.int32)
                cv2.polylines(display_frame, [pts], True, (0, 255, 255), 2)
                cv2.fillPoly(display_frame, [pts], (0, 255, 255, 50))
            
            cv2.imshow(self.window_name, display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                self.points = []
                print("Đã reset points!")
        
        cv2.destroyAllWindows()
        self.cap.release()
        
        if len(self.points) >= 3:
            return np.array(self.points)
        return None

if __name__ == "__main__":
    # Sử dụng
    video_path = "./video_test/Ngã Tư Sở.mp4"
    
    drawer = RegionDrawer(video_path)
    region = drawer.draw_region()
    
    if region is not None:
        print("\n" + "="*50)
        print("Region polygon (copy vào config.py):")
        print("="*50)
        print(f"np.array({region.tolist()})")
        print("\nHoặc format đẹp hơn:")
        print("np.array([")
        for point in region:
            print(f"    {point.tolist()},")
        print("])")
    else:
        print("Không có region nào được vẽ!")