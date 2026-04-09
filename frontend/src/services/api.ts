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
  isAnonymous: boolean
) => {
  const response = await api.post('/reports', { title, description, isAnonymous });
  return response.data;
};

export const updateReport = async (id: number, updates: object) => {
  const response = await api.patch(`/reports/${id}`, updates);
  return response.data;
};

export const escalateReport = async (id: number) => {
  const response = await api.patch(`/reports/${id}/escalate`);
  return response.data;
};

export default api;