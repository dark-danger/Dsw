const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://dsw-07gj.onrender.com/api';

export async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  isMultipart: boolean = false
): Promise<T> {
  const token = localStorage.getItem('dsw_token');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && !isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? (isMultipart ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const text = await response.text();
      try {
        const errJson = JSON.parse(text);
        errorDetail = errJson.detail || JSON.stringify(errJson);
      } catch (e) {
        errorDetail = text;
      }
    } catch (e) {
      errorDetail = response.statusText || 'An unexpected error occurred';
    }
    throw new Error(errorDetail);
  }

  // If response is HTML / streaming text (e.g. PDF/HTML reports)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    return (await response.text()) as unknown as T;
  }

  return response.json();
}
