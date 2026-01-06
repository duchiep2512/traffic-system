# Script kiểm tra MongoDB connection cho MongoDB Compass
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Connection Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra MongoDB service đang chạy
Write-Host "[1/3] Kiểm tra MongoDB service..." -ForegroundColor Yellow
try {
    $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoService -and $mongoService.Status -eq "Running") {
        Write-Host "MongoDB service đang chạy" -ForegroundColor Green
    } else {
        Write-Host "MongoDB service không tìm thấy hoặc chưa chạy" -ForegroundColor Yellow
        Write-Host "Kiểm tra xem MongoDB đã được cài đặt và đang chạy chưa" -ForegroundColor Yellow
        Write-Host "Hoặc MongoDB có thể đang chạy như một process thông thường" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Không thể kiểm tra MongoDB service (có thể đang chạy như process)" -ForegroundColor Yellow
}

# 2. Kiểm tra port 27017
Write-Host ""
Write-Host "[2/3] Kiểm tra port 27017..." -ForegroundColor Yellow
$portCheck = netstat -an | Select-String "27017"
if ($portCheck) {
    Write-Host "Port 27017 đang được sử dụng" -ForegroundColor Green
    Write-Host "$portCheck" -ForegroundColor Gray
} else {
    Write-Host "Port 27017 không có process nào đang sử dụng" -ForegroundColor Red
    Write-Host "MongoDB có thể chưa được khởi động" -ForegroundColor Yellow
    Write-Host "Kiểm tra xem MongoDB đã được cài đặt và đang chạy chưa" -ForegroundColor Yellow
}

# 3. Connection String cho MongoDB Compass
Write-Host ""
Write-Host "[3/3] Connection String cho MongoDB Compass:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Connection String (mặc định - không có auth):" -ForegroundColor Cyan
Write-Host "mongodb://localhost:27017/transportation_system" -ForegroundColor White
Write-Host ""
Write-Host "Hoặc điền thủ công trong Compass:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 27017" -ForegroundColor White
Write-Host "  Authentication: None (hoặc điền nếu đã cấu hình)" -ForegroundColor White
Write-Host ""
Write-Host "Lưu ý: Nếu MongoDB có authentication, cập nhật connection string với:" -ForegroundColor Yellow
Write-Host "  mongodb://username:password@localhost:27017/transportation_system?authSource=admin" -ForegroundColor White
Write-Host ""

# 4. Test connection (nếu có mongosh)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Connection..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $mongoshPath = Get-Command mongosh -ErrorAction SilentlyContinue
    if ($mongoshPath) {
        $testResult = mongosh --eval "db.adminCommand('ping')" --quiet 2>&1
        if ($testResult -match "ok.*1" -or $LASTEXITCODE -eq 0) {
            Write-Host "MongoDB đang hoạt động bình thường!" -ForegroundColor Green
        } else {
            Write-Host "Không thể kết nối đến MongoDB" -ForegroundColor Yellow
            Write-Host "Kiểm tra xem MongoDB đã được khởi động chưa" -ForegroundColor Yellow
        }
    } else {
        Write-Host "mongosh không tìm thấy trong PATH" -ForegroundColor Gray
        Write-Host "Có thể test connection trực tiếp trong MongoDB Compass" -ForegroundColor Gray
    }
} catch {
    Write-Host "Không thể test connection (mongosh có thể chưa được cài đặt)" -ForegroundColor Yellow
    Write-Host "Có thể test connection trực tiếp trong MongoDB Compass" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kết thúc kiểm tra" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
