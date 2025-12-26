/**
 * Configuration file - tập trung tất cả các URL và cấu hình của Frontend
 */

// ============================================
// Local Development Configuration
// ============================================
export const LOCAL_CONFIG = {
  API_BASE_URL: 'http://localhost:8000',
  WS_BASE_URL: 'ws://localhost:8000',
  MOCK_AUTH: true,      // Dùng mock authentication
  AUTO_LOGIN: true,     // Tự động đăng nhập với user giả
  MOCK_TOKEN: 'mock_jwt_token_local_testing'
};

export const isDevelopment = import.meta.env.DEV;

// ============================================
// API Configuration
// ============================================
class ApiConfig {
  BASE_URL_HTTP = isDevelopment ? LOCAL_CONFIG.API_BASE_URL : (import.meta.env.VITE_API_HTTP_BASE || "http://localhost:8000");
  BASE_URL_WS = isDevelopment ? LOCAL_CONFIG.WS_BASE_URL : (import.meta.env.VITE_API_WS_BASE || "ws://localhost:8000");
  API_V1_PREFIX = "/api/v1";
  
  get API_HTTP_BASE() {
    return `${this.BASE_URL_HTTP}${this.API_V1_PREFIX}`;
  }
  
  get API_WS_BASE() {
    return `${this.BASE_URL_WS}${this.API_V1_PREFIX}`;
  }
}

// ============================================
// Auth Configuration
// ============================================
class AuthConfig {
  TOKEN_KEY = "access_token";
  REFRESH_TOKEN_KEY = "refresh_token";
  USER_INFO_KEY = "user_info";
  
  get LOGIN_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/login`;
  }
  
  get REGISTER_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/register`;
  }
  
  get ME_URL() {
    return `${apiConfig.API_HTTP_BASE}/auth/me`;
  }
}

// ============================================
// User Configuration
// ============================================
class UserConfig {
  get PROFILE_URL() {
    return `${apiConfig.API_HTTP_BASE}/users/profile`;
  }
  
  get PASSWORD_URL() {
    return `${apiConfig.API_HTTP_BASE}/users/password`;
  }
}

// ============================================
// WebSocket Configuration
// ============================================
class WebSocketConfig {
  CHAT_PATH = "/ws/chat";
  FRAMES_PATH = "/ws/frames";
  INFO_PATH = "/ws/info";
  
  get CHAT_WS() {
    return `${apiConfig.API_WS_BASE}${this.CHAT_PATH}`;
  }
  
  framesWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.FRAMES_PATH}/${encodeURIComponent(roadName)}`;
  }
  
  infoWs(roadName: string) {
    return `${apiConfig.API_WS_BASE}${this.INFO_PATH}/${encodeURIComponent(roadName)}`;
  }
}

// ============================================
// Export instances
// ============================================
export const apiConfig = new ApiConfig();
export const authConfig = new AuthConfig();
export const userConfig = new UserConfig();
export const wsConfig = new WebSocketConfig();

// ============================================
// Backward compatibility
// ============================================
export const API_URL = apiConfig.BASE_URL_HTTP;
export const WS_URL = apiConfig.BASE_URL_WS;
export const API_HTTP_BASE = apiConfig.API_HTTP_BASE;
export const API_WS_BASE = apiConfig.API_WS_BASE;

export const endpoints = {
  roadNames: `${apiConfig.API_HTTP_BASE}/roads_name`,
  framesWs: (roadName: string) => wsConfig.framesWs(roadName),
  infoWs: (roadName: string) => wsConfig.infoWs(roadName),
  chatWs: wsConfig.CHAT_WS,
};