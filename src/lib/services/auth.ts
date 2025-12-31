import {api} from '@/lib/api';

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  email_verified_at?: string;
  role_names?: string[];
  permission_names?: string[];
  roles?: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
  permissions?: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
  notification_preferences?: {
    vehicle_bookings: {
      booked: boolean;
      received: boolean;
      offloading: boolean;
      offloaded: boolean;
      exited: boolean;
      rejected: boolean;
      approved: boolean;
    };
    capacity: {
      alerts: boolean;
    };
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', credentials);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await api.post('/logout');
  },

  // Get current authenticated user
  me: async (): Promise<User> => {
    const response = await api.get<User>('/user');
    return response.data;
  },
};
