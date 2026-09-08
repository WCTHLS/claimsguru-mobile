import { API_BASE_URL, API_ENDPOINTS } from './config';

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

async function requestWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 204 No Content
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

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions): Promise<T> => {
    return requestWithTimeout<T>(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
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
