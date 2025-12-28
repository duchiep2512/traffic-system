# Script kiểm tra MongoDB connection cho MongoDB Compass
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Connection Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra Docker
Write-Host "[1/5] Kiểm tra Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker đã được cài đặt: $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker chưa được cài đặt hoặc không có trong PATH" -ForegroundColor Red
        Write-Host "   → Cần cài đặt Docker Desktop từ: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker chưa được cài đặt" -ForegroundColor Red
    Write-Host "   → Cần cài đặt Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# 2. Kiểm tra Docker daemon đang chạy
Write-Host ""
Write-Host "[2/5] Kiểm tra Docker daemon..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker daemon đang chạy" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker daemon không chạy" -ForegroundColor Red
        Write-Host "   → Cần start Docker Desktop application" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker daemon không chạy" -ForegroundColor Red
    Write-Host "   → Cần start Docker Desktop application" -ForegroundColor Yellow
    exit 1
}

# 3. Kiểm tra MongoDB container
Write-Host ""
Write-Host "[3/5] Kiểm tra MongoDB container..." -ForegroundColor Yellow
$mongoContainer = docker ps -a --filter "name=database" --format "{{.Names}} {{.Status}}" 2>&1
if ($mongoContainer -match "database") {
    if ($mongoContainer -match "Up") {
        Write-Host "✅ MongoDB container đang chạy" -ForegroundColor Green
        Write-Host "   Status: $mongoContainer" -ForegroundColor Gray
    } else {
        Write-Host "⚠️ MongoDB container tồn tại nhưng chưa chạy" -ForegroundColor Yellow
        Write-Host "   Status: $mongoContainer" -ForegroundColor Gray
        Write-Host "   → Chạy lệnh: docker start database" -ForegroundColor Yellow
        Write-Host "   → Hoặc: docker-compose up -d database" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ MongoDB container chưa được tạo" -ForegroundColor Red
    Write-Host "   → Chạy lệnh: docker-compose up -d database" -ForegroundColor Yellow
}

# 4. Kiểm tra port 27017
Write-Host ""
Write-Host "[4/5] Kiểm tra port 27017..." -ForegroundColor Yellow
$portCheck = netstat -an | Select-String "27017"
if ($portCheck) {
    Write-Host "✅ Port 27017 đang được sử dụng" -ForegroundColor Green
    Write-Host "   $portCheck" -ForegroundColor Gray
} else {
    Write-Host "❌ Port 27017 không có process nào đang sử dụng" -ForegroundColor Red
    Write-Host "   → MongoDB container có thể chưa chạy" -ForegroundColor Yellow
}

# 5. Kiểm tra connection string
Write-Host ""
Write-Host "[5/5] Connection String cho MongoDB Compass:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Cyan
Write-Host "mongodb://admin:admin123@localhost:27017/transportation_system?authSource=admin" -ForegroundColor White
Write-Host ""
Write-Host "Hoặc điền thủ công trong Compass:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 27017" -ForegroundColor White
Write-Host "  Authentication: Username/Password" -ForegroundColor White
Write-Host "    Username: admin" -ForegroundColor White
Write-Host "    Password: admin123" -ForegroundColor White
Write-Host "  Authentication Database: admin" -ForegroundColor White
Write-Host ""

# 6. Test connection
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Connection..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
try {
    $testResult = docker exec database mongosh --eval "db.adminCommand('ping')" 2>&1
    if ($testResult -match "ok.*1") {
        Write-Host "✅ MongoDB đang hoạt động bình thường!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Không thể test connection (container có thể chưa sẵn sàng)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Không thể test connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Kết thúc kiểm tra" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

