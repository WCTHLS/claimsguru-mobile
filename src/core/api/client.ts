import { API_BASE_URL, API_ENDPOINTS, setApiBaseUrl } from './config';
import { getBackendCandidateUrls } from '../config/authConfig';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

async function executeSingleFetch<T>(url: string, options: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMsg =
        (typeof responseData === 'object' && responseData?.detail) ||
        (typeof responseData === 'string' && responseData) ||
        `Request failed with status ${response.status}`;
      throw new ApiError(errorMsg, response.status, responseData);
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError(`Request to ${url} timed out after ${timeoutMs}ms`, 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Network request failed', 0, error);
  }
}

async function requestWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  try {
    return await executeSingleFetch<T>(url, options, timeoutMs);
  } catch (err: any) {
    // If it's an HTTP response error (status >= 400), don't retry across bases
    if (err instanceof ApiError && err.status >= 400 && err.status !== 408) {
      throw err;
    }

    // If network connection failed or timed out, attempt candidate URLs
    const candidates = getBackendCandidateUrls();
    for (const candidate of candidates) {
      const cleanCandidate = candidate.replace(/\/+$/, '');
      if (url.startsWith(cleanCandidate)) continue;

      // Swap base
      let altUrl = url;
      if (url.startsWith(API_BASE_URL)) {
        altUrl = url.replace(API_BASE_URL, cleanCandidate);
      } else {
        const urlObj = new URL(url, 'http://localhost');
        altUrl = `${cleanCandidate}${urlObj.pathname}${urlObj.search}`;
      }

      try {
        const result = await executeSingleFetch<T>(altUrl, options, Math.min(timeoutMs, 5000));
        setApiBaseUrl(cleanCandidate);
        return result;
      } catch {
        // try next candidate
      }
    }

    throw err;
  }
}

import { useAuthStore } from '../../state/useAuthStore';

function getAuthHeaders(): Record<string, string> {
  try {
    const auth = useAuthStore.getState();
    const headers: Record<string, string> = {};
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }
    if (auth.userId) {
      headers['X-User-Id'] = auth.userId;
      headers['X-Patient-Id'] = auth.userId;
    } else if (auth.userEmail) {
      headers['X-Patient-Id'] = auth.userEmail;
    }
    return headers;
  } catch {
    return {};
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions): Promise<T> => {
    return requestWithTimeout<T>(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
      },
      options?.timeoutMs
    );
  },

  post: <T>(url: string, body?: any, options?: RequestOptions): Promise<T> => {
    return requestWithTimeout<T>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      },
      options?.timeoutMs
    );
  },

  delete: <T>(url: string, options?: RequestOptions): Promise<T> => {
    return requestWithTimeout<T>(
      url,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
      },
      options?.timeoutMs
    );
  },

  upload: <T>(url: string, formData: FormData, options?: RequestOptions): Promise<T> => {
    return requestWithTimeout<T>(
      url,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
          ...options?.headers,
        },
        body: formData,
      },
      options?.timeoutMs || 45000
    );
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(API_ENDPOINTS.health(), { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },
};
