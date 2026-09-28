export interface Book {
  id: number;
  title: string;
  author: string;
  year: number | null;
  cover_url: string | null;
}

export type Role = 'user' | 'vip' | 'admin';

export interface User {
  username: string;
  role: Role;
  bgColor?: string;
}

export interface AuthResponse {
  message?: string;
  accessToken?: string;
  bgColor?: string;
  error?: string;
}
