import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically inject JWT token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (email: string, full_name: string, password: string, role: 'ADMIN' | 'ANALYST' | 'VIEWER') =>
    api.post('/auth/register', { email, full_name, password, role }),
  me: () => api.get('/auth/me'),
};

// ─── Projects ─────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (name: string, description: string, aoi_wkt?: string) =>
    api.post('/projects', { name, description, aoi_wkt }),
  get: (id: number) => api.get(`/projects/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.patch(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// ─── Images ────────────────────────────────────────────────────────────────
export const imagesApi = {
  upload: (projectId: number, file: File, sensorName?: string, acquisitionDate?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', String(projectId));
    if (sensorName) formData.append('sensor_name', sensorName);
    if (acquisitionDate) formData.append('acquisition_date', acquisitionDate);
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: (id: number) => api.get(`/images/${id}`),
  listByProject: (projectId: number) => api.get(`/images/project/${projectId}`),
  updateModality: (id: number, modality: string) =>
    api.patch(`/images/${id}/modality`, { modality }),
  getFileUrl: (id: number) => `${BASE_URL}/images/${id}/file`,
};

// ─── Pairs ─────────────────────────────────────────────────────────────────
export const pairsApi = {
  create: (projectId: number, image1Id: number, image2Id: number) =>
    api.post('/pairs', { project_id: projectId, image1_id: image1Id, image2_id: image2Id }),
  get: (id: number) => api.get(`/pairs/${id}`),
  listByProject: (projectId: number) => api.get(`/pairs/project/${projectId}`),
};

// ─── Analysis ──────────────────────────────────────────────────────────────
export const analysisApi = {
  submitQuery: (projectId: number, query: string, imageId?: number, pairId?: number) =>
    api.post('/analysis/query', { project_id: projectId, query, image_id: imageId, pair_id: pairId }),
  getJob: (jobId: number) => api.get(`/analysis/jobs/${jobId}`),
  getTrace: (jobId: number) => api.get(`/analysis/jobs/${jobId}/trace`),
  getResult: (jobId: number) => api.get(`/analysis/results/${jobId}`),
  getProjectAnalyses: (projectId: number) => api.get(`/analysis/project/${projectId}`),
};

// ─── Exports ───────────────────────────────────────────────────────────────
export const exportsApi = {
  downloadJson: (jobId: number) =>
    api.get(`/exports/${jobId}/json`, { responseType: 'blob' }),
  downloadCsv: (jobId: number) =>
    api.get(`/exports/${jobId}/csv`, { responseType: 'blob' }),
  downloadGeojson: (jobId: number) =>
    api.get(`/exports/${jobId}/geojson`, { responseType: 'blob' }),
};
