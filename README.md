# Traffic System

Xây dựng website hệ thống phân tích giao thông thông minh sử dụng AI để xử lý video và phân tích dữ liệu giao thông. Có tính năng bảo mật cao, lưu trữ thông tin user và chat history. Giúp người dùng có thể xem được tình hình giao thông hiện tại với việc phân tích realtime và trợ lý AI thông minh giúp hỏi đáp các thông tin giao thông hiện tại.

## Demo ứng dụng

### Đăng ký và Đăng nhập

**Đăng ký tài khoản:**

![Sign Up](image/Sign%20up.png)

**Đăng nhập:**

![Sign In](image/Sign%20in.png)

### Dashboard - Giao diện chính

**Tổng quan hệ thống:**

![Dashboard 1](image/dashboard%201.jpg)

![Dashboard 2](image/dashboard%202.jpg)

![Dashboard 3](image/dashboard%203.jpg)

### Tính năng giám sát

**Giám sát giao thông thời gian thực:**

![Real-time Monitoring](image/Real%20time%20monitoring.png)

### Chatbot hỗ trợ

**Giao diện chat với AI:**

![Chat Box](image/Chat%20box.png)

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Sử dụng](#sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Lưu ý](#lưu-ý)

## Tổng quan

Traffic System là một ứng dụng web full-stack cho phép: 
- Upload và phân tích video giao thông
- Xử lý đa luồng để phân tích nhiều video đồng thời
- Giao diện web hiện đại để quản lý và xem kết quả

## Tính năng

- Upload video giao thông để phân tích
- Phân tích video bằng AI/Computer Vision
- Xử lý đa luồng, phân tích nhiều video cùng lúc
- Xây dựng website để tích hợp các tính năng
- Đăng ký tài khoản và lưu trữ thông tin user để có thể truy cập và xem chi tiết website
- Tích hợp chat interface 
- Hiển thị kết quả phân tích trực quan

## Yêu cầu hệ thống

- **Python**:  3.8 trở lên
- **Node.js**: 14.x trở lên
- **npm**: 6.x trở lên
- **CPU hoặc GPU**: Hỗ trợ cả hai (hiện tại sử dụng CPU)

## Cài đặt

### Backend Setup

#### Bước 1: Di chuyển vào thư mục backend

```bash
cd backend
```

#### Bước 2: Cài đặt dependencies Python

Sử dụng CPU (khuyến nghị cho môi trường phát triển):

```bash
pip install -r requirements_cpu. txt
```

*Lưu ý: Nếu cần sử dụng GPU, sử dụng file requirements. txt (nếu có)*

#### Bước 3: Chuẩn bị dữ liệu

Đưa các video cần phân tích vào thư mục: 

```bash
backend/app/video_test/
```

#### Bước 4: Khởi động server backend

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend sẽ chạy tại:  `http://localhost:8000`

### Frontend Setup

#### Bước 1: Cài đặt Node.js

Nếu chưa có Node.js, tải và cài đặt từ [nodejs.org](https://nodejs.org/)

#### Bước 2: Di chuyển vào thư mục frontend

```bash
cd frontend
```

#### Bước 3: Cài đặt dependencies

```bash
npm install
```

#### Bước 4: Khởi động server frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu được chỉ định)

## Sử dụng

1. **Khởi động cả hai server**:  Mở 2 terminal riêng biệt, một cho backend và một cho frontend
2. **Truy cập ứng dụng**: Mở browser và truy cập địa chỉ frontend
3. **Upload video**: Sử dụng giao diện để upload video cần phân tích
4. **Xem kết quả**: Theo dõi quá trình phân tích và xem kết quả

## Cấu trúc dự án

```
traffic-system/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── video_test/          # Thư mục chứa video test
│   │   └── ... 
│   ├── requirements_cpu.txt     # Dependencies cho CPU
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ... 
└── README.md
```

### Kỹ thuật

- Backend sử dụng **FastAPI** với **uvicorn** server
- Xử lý video sử dụng **multi-threading** để phân tích đồng thời
- Các thread phân tích chạy song song với main thread của FastAPI
- Server backend sẽ giữ process chạy liên tục để lắng nghe HTTP requests
