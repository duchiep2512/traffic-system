## Tất cả đều chạy trên terminal, sẽ chạy cùng lúc 2 terminal (1 cái của backend, 1 cái của frontend)
Hiện tại sẽ chưa có lưu thông tin id đăng nhập, user, history chat
Đưa các video vào folder backend/app/video_test

### Backend Setup

1. From project root, navigate to the app directory:

```bash
cd Backend
```
2. Install Python dependencies:

- For CPU-only installation

```bash
pip install -r requirements_cpu.txt
```
3. Run backend
```bash
python -m uvicorn app.main_local:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Cài đặt node.js trước bằng cách lên mạng dowload node.js về rồi mới vào terminal chạy các lệnh dưới

```bash
cd frontend
```

```bash
npm install
```

2. Bắt đầu chạy sever
```bash
npm run dev
```


