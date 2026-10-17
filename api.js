import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finguard_token');
      localStorage.removeItem('finguard_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

function extractErrorMessage(error) {
  return (
    error.response?.data?.error ||
    error.message ||
    'Something went wrong. Please try again.'
  );
}

// ---------- Auth ----------
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (payload) => api.post('/auth/register', payload),
  me: () => api.get('/auth/me'),
};

// ---------- Transactions ----------
export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (payload) => api.post('/transactions', payload),
  update: (id, payload) => api.put(`/transactions/${id}`, payload),
  remove: (id) => api.delete(`/transactions/${id}`),
  analyze: (id) => api.post(`/transactions/${id}/analyze`),
  updateStatus: (id, status) => api.put(`/transactions/${id}/status`, { status }),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  riskDistribution: () => api.get('/dashboard/risk-distribution'),
};

// ---------- Audit Logs ----------
export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

// ---------- Users ----------
export const usersApi = {
  list: () => api.get('/users'),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
};

export { extractErrorMessage };
export default api;
