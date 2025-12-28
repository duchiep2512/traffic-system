
// import { Navigate, Outlet } from "react-router-dom";

// // You may want to add authentication logic here
// const authed = Boolean(localStorage.getItem("access_token"));

// export default function ProtectedRoute() {
//   return authed ? <Outlet /> : <Navigate to="/login" replace />;
// }

import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { LOCAL_CONFIG, isDevelopment, authConfig } from '@/config';
import { getToken, setToken } from '@/utils/authStorage';

export function ProtectedRoute() {
  const location = useLocation();
  
  // 🔓 MOCK AUTH cho local development
  if (isDevelopment && LOCAL_CONFIG.MOCK_AUTH) {
    // Tự động tạo mock user trong localStorage
    const mockUser = {
      id: 9999,
      email: 'test@local.dev',
      full_name: 'Local Test User',
      is_active: true,
      role_id: 1
    };
    
    // Lưu token và user vào sessionStorage (giả lập đăng nhập)
    // Dùng authConfig.TOKEN_KEY để nhất quán với App.tsx
    if (!getToken()) {
      setToken(LOCAL_CONFIG.MOCK_TOKEN);
      localStorage.setItem('user', JSON.stringify(mockUser));
      console.log('✅ Mock user created:', mockUser);
    }
    
    // Cho phép truy cập tất cả routes
    return <Outlet />;
  }
  
  // 🔐 Logic authentication thật (dùng cho production)
  const token = getToken();
  
  if (!token) {
    // Chưa đăng nhập -> redirect về trang login
    console.log('❌ No token found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Đã đăng nhập -> cho phép truy cập
  return <Outlet />;
}

// Export default để tương thích với code import cũ
const ProtectedRouteDefault = ProtectedRoute;
export default ProtectedRouteDefault;