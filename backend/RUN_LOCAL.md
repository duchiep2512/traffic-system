# Hướng dẫn chạy Backend Local (Không cần PostgreSQL)

## Yêu cầu
- Python 3.11+
- Không cần PostgreSQL hoặc bất kỳ database nào

## Cài đặt

1. Di chuyển vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
pip install -r requirements_cpu.txt
```

**Lưu ý**: Bạn phải ở trong thư mục `backend` khi chạy lệnh pip install!

2. Tạo file `.env` (tùy chọn - không bắt buộc):
```bash
# Không cần DATABASE_URL - để trống hoặc không tạo file này
# JWT_SECRET_KEY=your-secret-key (tùy chọn)
# JWT_ALGORITHM=HS256 (tùy chọn)
# ACCESS_TOKEN_EXPIRE_DAYS=7 (tùy chọn)
```

## Chạy Server

```bash
# Cách 1: Dùng uvicorn trực tiếp
uvicorn app.main_local:app --reload --host 0.0.0.0 --port 8000

# Cách 2: Chạy file Python
python -m app.main_local
```

## Chế độ Local

- ✅ **Không cần PostgreSQL** - Tất cả database operations được mock
- ✅ **Mock Authentication** - User mặc định: `testuser` (id: 9999)
- ✅ **Mock Token**: `mock_jwt_token_local_testing`
- ✅ **Tất cả endpoints hoạt động** - Auth, Chat, Vehicles, Admin đều được mock

## Endpoints chính

- **API Docs**: http://localhost:8000/docs
- **Root**: http://localhost:8000/
- **Login**: POST `/api/v1/auth/login` (bất kỳ credentials nào đều được chấp nhận)
- **Vehicles**: GET `/api/v1/roads_name`
- **Chat**: POST `/api/v1/chat` hoặc `/api/v1/chat/chat_no_auth`

## Lưu ý

- Chat history sẽ không được lưu (trả về empty list)
- User registration/login không thực sự tạo user mới
- Tất cả database operations đều được mock và không lưu dữ liệu

## So sánh với Production

| Tính năng | Local Mode | Production Mode |
|-----------|------------|-----------------|
| Database | Mock (không lưu) | PostgreSQL |
| Authentication | Mock user | Real JWT |
| Chat History | Không lưu | Lưu vào DB |
| User Management | Mock | Real DB |

