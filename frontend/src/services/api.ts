import axios from 'axios';
import type { SuspectInput, VictimInput } from '../types';
import { API_BASE } from '@/config';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const login = async (email: string, password: string) =>
  (await api.post('/auth/login', { email, password })).data;

export const register = async (email: string, password: string, firstName: string, lastName: string) =>
  (await api.post('/auth/register', { email, password, firstName, lastName })).data;

export const getAllReports = async () => (await api.get('/reports')).data;

export const createReport = async (
  type: string,
  reporter: string,
  description: string,
  isAnonymous: boolean,
  suspects: SuspectInput[],
  victims: VictimInput[],
  frequency: string,
) => (await api.post('/reports', { type, reporter, description, isAnonymous, suspects, victims, frequency })).data;

export const updateReport = async (id: string, updates: object) =>
  (await api.patch(`/reports/${id}`, updates)).data;

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

export const getUserById = async (id: string) => (await api.get(`/users/${id}`)).data;

export const getAllUsers = async (page = 1, limit = 5) => (await api.get(`/users?page=${page}&limit=${limit}`)).data;

export const createUser = async (dto: Record<string, string>) =>
  (await api.post('/users', dto)).data;

export const updateUser = async (id: string, dto: Record<string, string>) =>
  (await api.patch(`/users/${id}`, dto)).data;

export const deleteUser = async (id: string) => {
  try {
    return (await api.delete(`/users/${id}`)).data;
  } catch (err: any) {
    const message = err.response?.data?.message || 'DELETE_FAILED';
    throw new Error(message);
  }
};

export const checkCanDeleteUser = async (id: string) =>
  (await api.get(`/users/${id}/can-delete`)).data;

export const getStudentParents = async (userId: string) =>
  (await api.get(`/student-profiles/parents/${userId}`)).data;

export const getStaffProfile = async (userId: string) =>
  (await api.get(`/staff-profiles/by-user/${userId}`)).data;

export const getClasses = async () =>
  (await api.get('/classes')).data;

export const createClass = async (level: string, section: string) =>
  (await api.post('/classes', { level, section })).data;

export const updateClass = async (id: string, level: string, section: string) =>
  (await api.patch(`/classes/${id}`, { level, section })).data;

export const deleteClass = async (id: string) =>
  (await api.delete(`/classes/${id}`)).data;

export const assignStudentToClass = async (userId: string, classId: string) =>
  (await api.patch(`/users/${userId}`, { classId })).data;

export const resolveSuspect = async (suspectId: string, resolvedUserId: string | null) =>
  (await api.patch(`/reports/suspects/${suspectId}/resolve`, { resolvedUserId })).data;

export const resolveVictim = async (victimId: string, resolvedUserId: string | null) =>
  (await api.patch(`/reports/victims/${victimId}/resolve`, { resolvedUserId })).data;

export const createParent = async (dto: { firstName: string; lastName: string; email: string; phone?: string; address?: string; studentProfileId: string }) =>
  (await api.post('/parents', dto)).data;
export const updateParent = async (id: string, dto: { firstName?: string; lastName?: string; email?: string; phone?: string; address?: string }) =>
  (await api.patch(`/parents/${id}`, dto)).data;
export const deleteParent = async (id: string) =>
  (await api.delete(`/parents/${id}`)).data;

export const createStaffProfile = async (dto: Record<string, any>) =>
  (await api.post('/staff-profiles', dto)).data;

export const updateStaffProfile = async (id: string, dto: Record<string, any>) =>
  (await api.patch(`/staff-profiles/${id}`, dto)).data;

export default api;
