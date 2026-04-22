import axios from 'axios';
import type { ResearchMode, LLMProvider, APIKeyConfig } from '../types';
import { useAuthStore } from '../store/authStore';

const api = axios.create({ baseURL: '/api' });

// Add auth token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by logging out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export async function register(email: string, password: string, fullName?: string) {
  const res = await api.post('/auth/register', { email, password, full_name: fullName });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get('/auth/me');
  return res.data;
}

// API Key Management (server-stored, encrypted)
export async function storeAPIKey(provider: string, apiKey: string, label?: string) {
  const res = await api.post('/auth/keys', { provider, api_key: apiKey, label });
  return res.data;
}

export async function listAPIKeys() {
  const res = await api.get('/auth/keys');
  return res.data;
}

export async function deleteAPIKey(keyId: string) {
  await api.delete(`/auth/keys/${keyId}`);
}

// Research
export async function startResearch(
  query: string,
  mode: ResearchMode,
  llm_provider: LLMProvider,
  apiKeys?: APIKeyConfig,
  maxTokens?: number,
  maxCostUsd?: number,
): Promise<string> {
  const res = await api.post('/research', {
    query,
    mode,
    llm_provider,
    api_keys: apiKeys || null,
    max_tokens: maxTokens || null,
    max_cost_usd: maxCostUsd || null,
  });
  return res.data.run_id;
}

export async function validateKeys(provider: LLMProvider, apiKeys: APIKeyConfig) {
  const res = await api.post('/research/validate-keys', { provider, api_keys: apiKeys });
  return res.data;
}

export async function approvePlan(runId: string, editedPlan?: Record<string, unknown>) {
  await api.post(`/research/${runId}/approve`, { approved: true, edited_plan: editedPlan || null });
}

export async function getRuns() {
  const res = await api.get('/runs');
  return res.data;
}

export async function getRun(runId: string) {
  const res = await api.get(`/runs/${runId}`);
  return res.data;
}

export async function getRunMetrics(runId: string) {
  const res = await api.get(`/runs/${runId}/metrics`);
  return res.data;
}

export async function getReport(runId: string) {
  const res = await api.get(`/runs/${runId}/report`);
  return res.data;
}

export function getReportPdfUrl(runId: string): string {
  return `/api/runs/${runId}/report/pdf`;
}
