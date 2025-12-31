import {api} from '@/lib/api';
import type {User} from './auth';

export interface ImpersonateUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

export interface ImpersonationInfo {
  is_impersonating: boolean;
  impersonator_id: number;
  impersonator_name: string;
}

export interface StartImpersonationResponse {
  user: User;
  token: string;
  impersonation: ImpersonationInfo;
}

export interface ImpersonateUsersResponse {
  data: ImpersonateUser[];
}

export const impersonationService = {
  // Get users that can be impersonated
  getUsers: async (search?: string): Promise<ImpersonateUsersResponse> => {
    const params = search ? {search} : {};
    const response = await api.get<ImpersonateUsersResponse>(
      '/impersonate/users',
      {params}
    );
    return response.data;
  },

  // Start impersonating a user
  start: async (userId: number): Promise<StartImpersonationResponse> => {
    const response = await api.post<StartImpersonationResponse>(
      `/impersonate/${userId}`
    );
    return response.data;
  },

  // Stop impersonating
  stop: async (): Promise<void> => {
    await api.post('/impersonate/stop');
  },
};
