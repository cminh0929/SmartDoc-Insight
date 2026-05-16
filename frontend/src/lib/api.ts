const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.206:3001';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const documentsApi = {
  getAll: (folderId?: string) => {
    const url = folderId ? `/documents?folderId=${folderId}` : '/documents';
    return apiFetch<any[]>(url);
  },
  getOne: (id: string) => apiFetch<any>(`/documents/${id}`),
  create: (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },
  delete: (id: string) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
  addVersion: (id: string, formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    return fetch(`${API_BASE_URL}/documents/${id}/versions`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    }).then(async res => {
      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      if (!res.ok) throw new Error("Upload version failed");
      return res.json();
    });
  },
  getVersions: (id: string) => apiFetch<any[]>(`/documents/${id}/versions`),
};

export const foldersApi = {
  getAll: () => apiFetch<any[]>('/folders'),
  getTree: () => apiFetch<any[]>('/folders/tree'),
  create: (data: any) => apiFetch('/folders', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/folders/${id}`, { method: 'DELETE' }),
};

export const searchApi = {
  query: (q: string, folderId?: string) => {
    let url = `/search?q=${encodeURIComponent(q)}`;
    if (folderId) url += `&folderId=${folderId}`;
    return apiFetch<any>(url);
  },
};

export const dashboardApi = {
  getStats: () => apiFetch<any>('/dashboard/stats'),
};

export const auditLogsApi = {
  getAll: (limit = 100, offset = 0) => apiFetch<any[]>(`/audit-logs?limit=${limit}&offset=${offset}`),
  exportUrl: () => `${API_BASE_URL}/audit-logs/export`,
};
