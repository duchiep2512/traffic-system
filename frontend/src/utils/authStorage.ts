/**
 * Authentication storage utilities
 * Uses sessionStorage instead of localStorage so tokens are cleared when browser/tab closes
 */

const TOKEN_KEY = "access_token";
const USER_DATA_KEY = "user_data";

/**
 * Get authentication token from sessionStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Set authentication token in sessionStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token from sessionStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_DATA_KEY);
}

/**
 * Check if user has a valid token
 */
export function hasToken(): boolean {
  const token = getToken();
  return token !== null && token.length >= 10;
}

/**
 * User data interface
 */
export interface UserData {
  username: string;
  email: string;
  phone_number?: string;
  role_id: number;
  id: string;
}

/**
 * Get user data from sessionStorage
 */
export function getUserData(): UserData | null {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(USER_DATA_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Set user data in sessionStorage
 */
export function setUserData(userData: UserData): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

/**
 * Get username from sessionStorage (quick access)
 */
export function getUsername(): string | null {
  const userData = getUserData();
  return userData?.username || null;
}

