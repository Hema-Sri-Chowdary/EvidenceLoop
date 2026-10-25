/**
 * Native Fetch-based API Client
 * Zero external HTTP library dependencies (replaces Axios with standard Fetch API).
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const { params, body, timeout = 15000, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Append query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customConfig.headers || {}),
  };

  try {
    const token = localStorage.getItem('evidenceloop_token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}

  const config = {
    method: 'GET',
    headers,
    signal: controller.signal,
    ...customConfig,
  };

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401) {
        try {
          localStorage.removeItem('evidenceloop_token');
          localStorage.removeItem('evidenceloop_user');
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        } catch {}
      }
      const error = new Error(
        (data && (data.message || data.error)) || `Request failed with status ${response.status}`
      );
      error.status = response.status;
      error.response = { status: response.status, data };
      error.userMessage = (data && (data.message || data.error)) || error.message;
      throw error;
    }

    return { data, status: response.status, ok: response.ok };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please try again.');
      timeoutErr.userMessage = 'Request timed out. Please verify backend availability.';
      timeoutErr.request = true;
      throw timeoutErr;
    }
    if (!err.response) {
      // Network or connection error
      err.request = true;
      err.userMessage =
        'Unable to connect to the backend server. Running in offline/demo workspace mode.';
    }
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
