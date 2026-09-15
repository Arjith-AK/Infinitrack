import apiClient from './client';
import type { AuthTokens, Job, LoginCredentials, Mission, Report, User } from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await apiClient.post<{ user: User; tokens: AuthTokens }>('/auth/login', credentials);
    return data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
  me: async () => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
    return data;
  },
};

export const missionApi = {
  list: async () => {
    const { data } = await apiClient.get<Mission[]>('/missions');
    return data;
  },
  get: async (id: string) => {
    const { data } = await apiClient.get<Mission>(`/missions/${id}`);
    return data;
  },
  create: async (mission: Partial<Mission>) => {
    const { data } = await apiClient.post<Mission>('/missions', mission);
    return data;
  },
  upload: async (id: string) => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/upload`);
    return data;
  },
  start: async (id: string) => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/start`);
    return data;
  },
  pause: async (id: string) => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/pause`);
    return data;
  },
  stop: async (id: string) => {
    const { data } = await apiClient.post<Mission>(`/missions/${id}/stop`);
    return data;
  },
};

export const jobsApi = {
  list: async () => {
    const { data } = await apiClient.get<Job[]>('/jobs');
    return data;
  },
  create: async (job: Partial<Job>) => {
    const { data } = await apiClient.post<Job>('/jobs', job);
    return data;
  },
  update: async (id: string, job: Partial<Job>) => {
    const { data } = await apiClient.put<Job>(`/jobs/${id}`, job);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/jobs/${id}`);
  },
  export: async (id: string) => {
    const { data } = await apiClient.get(`/jobs/${id}/export`, { responseType: 'blob' });
    return data;
  },
};

export const reportsApi = {
  list: async () => {
    const { data } = await apiClient.get<Report[]>('/reports');
    return data;
  },
  generate: async (missionId: string) => {
    const { data } = await apiClient.post<Report>(`/reports/generate`, { missionId });
    return data;
  },
  download: async (id: string) => {
    const { data } = await apiClient.get(`/reports/${id}/pdf`, { responseType: 'blob' });
    return data;
  },
};

export const robotApi = {
  status: async () => {
    const { data } = await apiClient.get('/robot/status');
    return data;
  },
  calibrate: async (type: string) => {
    const { data } = await apiClient.post(`/robot/calibrate/${type}`);
    return data;
  },
  firmware: async () => {
    const { data } = await apiClient.get('/robot/firmware');
    return data;
  },
  updateFirmware: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/robot/firmware/update', formData);
    return data;
  },
};

export const usersApi = {
  list: async () => {
    const { data } = await apiClient.get<User[]>('/users');
    return data;
  },
  create: async (user: Partial<User> & { password: string }) => {
    const { data } = await apiClient.post<User>('/users', user);
    return data;
  },
  update: async (id: string, user: Partial<User>) => {
    const { data } = await apiClient.put<User>(`/users/${id}`, user);
    return data;
  },
  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },
};
