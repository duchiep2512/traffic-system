"""
Script test kết nối MongoDB và tạo database/collections
Chạy script này để kiểm tra xem backend có kết nối được MongoDB không
"""
import asyncio
import sys
import os

# Thêm path backend vào sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

async def test_mongodb_connection():
    """Test kết nối MongoDB"""
    print("=" * 60)
    print("Testing MongoDB Connection...")
    print("=" * 60)
    print()
    
    try:
        # Import từ backend
        from app.db.base import init_database, client, database_name
        from app.core.config import settings_server
        
        print(f"[1/4] Connection String: {settings_server.MONGODB_URL}")
        print()
        
        print("[2/4] Đang kết nối MongoDB...")
        await init_database()
        print("✅ Kết nối thành công!")
        print()
        
        print(f"[3/4] Kiểm tra database '{database_name}'...")
        if client:
            db = client[database_name]
            # List collections
            collections = await db.list_collection_names()
            print(f"✅ Database '{database_name}' đã sẵn sàng")
            print(f"   Collections hiện có: {collections if collections else 'Chưa có (sẽ được tạo khi có dữ liệu)'}")
            print()
            
            # Test tạo một document test
            print("[4/4] Test tạo document...")
            test_collection = db["test_connection"]
            await test_collection.insert_one({"test": True, "message": "Connection test successful"})
            print("✅ Test document đã được tạo")
            
            # Xóa test document
            await test_collection.delete_one({"test": True})
            print("✅ Test document đã được xóa")
            print()
            
            print("=" * 60)
            print("✅ TẤT CẢ TEST ĐỀU THÀNH CÔNG!")
            print("=" * 60)
            print()
            print("Bạn có thể chạy backend bây giờ:")
            print("  cd backend")
            print("  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
            print()
            
        else:
            print("❌ Client không được khởi tạo")
            
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ LỖI KẾT NỐI MONGODB")
        print("=" * 60)
        print(f"Error: {e}")
        print()
        print("Kiểm tra:")
        print("1. MongoDB đã chạy chưa? (Get-Service -Name MongoDB)")
        print("2. Connection string trong .env có đúng không?")
        print("3. Port 27017 có bị chặn không?")
        print()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mongodb_connection())

