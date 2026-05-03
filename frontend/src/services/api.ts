import axios from 'axios';
import type { SuspectInput } from '../types';

const api = axios.create({ baseURL: 'http://localhost:5000' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = async (email: string, password: string) =>
  (await api.post('/auth/login', { email, password })).data;

export const register = async (email: string, password: string, firstName: string, lastName: string) =>
  (await api.post('/auth/register', { email, password, firstName, lastName })).data;

export const getReports = async () => (await api.get('/reports')).data;

export const getAllReports = async () => (await api.get('/reports')).data;

export const createReport = async (title: string, description: string, isAnonymous: boolean, suspects: SuspectInput[], frequency: string, schoolClass: string) =>
  (await api.post('/reports', { title, description, isAnonymous, suspects, frequency, schoolClass })).data;

export const updateReport = async (id: string, updates: object) =>
  (await api.patch(`/reports/${id}`, updates)).data;

export const escalateReport = async (id: string) =>
  (await api.patch(`/reports/${id}/escalate`)).data;

export const searchUsers = async (query: string) =>
  (await api.get(`/users/search?q=${query}`)).data;

export const getNotes = async (reportId: string) =>
  (await api.get(`/reports/${reportId}/notes`)).data;

export const addNote = async (reportId: string, content: string, type = 'note', targetRole?: string) =>
  (await api.post(`/reports/${reportId}/notes`, { content, type, targetRole })).data;

export const getNotifications = async () => (await api.get('/notifications')).data;

export const getUnreadCount = async () => (await api.get('/notifications/unread-count')).data;

export const markNotificationRead = async (id: string) =>
  (await api.patch(`/notifications/${id}/read`)).data;

export const getAllUsers = async () => (await api.get('/users')).data;

export const createUser = async (dto: Record<string, string>) => (await api.post('/users', dto)).data;

export const updateUser = async (id: string, dto: Record<string, string>) => (await api.patch(`/users/${id}`, dto)).data;

export const deleteUser = async (id: string) => (await api.delete(`/users/${id}`)).data;

// Récupère les parents liés à un élève
export const getStudentParents = async (userId: string) =>
  (await api.get(`/student-profiles/parents/${userId}`)).data;

export const getStaffProfile = async (userId: string) =>
  (await api.get(`/staff-profiles/by-user/${userId}`)).data;

export default api;