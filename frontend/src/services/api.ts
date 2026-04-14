import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  const response = await api.post('/auth/register', { email, password, firstName, lastName });
  return response.data;
};

export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const getAllReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const createReport = async (
  title: string,
  description: string,
  isAnonymous: boolean,
  suspects: any[],
  frequency: string,
  schoolClass: string
) => {
  const response = await api.post('/reports', {
    title, description, isAnonymous, suspects, frequency, schoolClass
  });
  return response.data;
};
export const updateReport = async (id: string, updates: object) => {
  const response = await api.patch(`/reports/${id}`, updates);
  return response.data;
};

export const escalateReport = async (id: string) => {
  const response = await api.patch(`/reports/${id}/escalate`);
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await api.get(`/users/search?q=${query}`);
  return response.data;
};

export const getNotes = async (reportId: string) => {
  const response = await api.get(`/reports/${reportId}/notes`);
  return response.data;
};

export const addNote = async (reportId: string, content: string, type: string = 'note', targetRole?: string) => {
  const response = await api.post(`/reports/${reportId}/notes`, { content, type, targetRole });
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationRead = async (id: string) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (dto: any) => {
  const response = await api.post('/users', dto);
  return response.data;
};

export const updateUser = async (id: string, dto: any) => {
  const response = await api.patch(`/users/${id}`, dto);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export default api;