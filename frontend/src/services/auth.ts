import api from './api';

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  avatar_url?: string;
  created_at?: string;
}

export const register = async (data: RegisterPayload): Promise<UserResponse> => {
  const res = await api.post<UserResponse>('/auth/register', data);
  return res.data;
};

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', data);
  if (res.data?.access_token) {
    localStorage.setItem('access_token', res.data.access_token);
  }
  return res.data;
};

export const forgotPassword = async (email: string): Promise<MessageResponse> => {
  const res = await api.post<MessageResponse>('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<MessageResponse> => {
  const res = await api.post<MessageResponse>('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return res.data;
};

export const getMe = async (): Promise<UserResponse> => {
  const res = await api.get<UserResponse>('/auth/me');
  return res.data;
};

export const updateMe = async (payload: { full_name: string }): Promise<UserResponse> => {
  const res = await api.patch<UserResponse>('/auth/me', payload);
  return res.data;
};

export const logout = (): void => {
  localStorage.removeItem('access_token');
  window.location.href = '/login';
};

export const isAuthenticated = (): boolean => {
  return Boolean(localStorage.getItem('access_token'));
};

export const authService = {
  login,
  register,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  logout,
  isAuthenticated,
};

export default authService;
