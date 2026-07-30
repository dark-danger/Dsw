/**
 * API base URL resolution:
 *  - Production (Vercel):   VITE_API_BASE_URL is NOT set → defaults to '/api'
 *                           All requests go to the same origin, routed by vercel.json
 *  - Local development:     VITE_API_BASE_URL is NOT set → proxy in vite.config.ts
 *                           forwards /api/* to http://localhost:8000
 *
 * If you need to point at a remote backend (e.g. Render), set VITE_API_BASE_URL
 * in Vercel's Environment Variables dashboard.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  isMultipart: boolean = false,
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
      } catch {
        errorDetail = text;
      }
    } catch {
      errorDetail = response.statusText || 'An unexpected error occurred';
    }
    throw new Error(errorDetail);
  }

  // If the response is HTML / streaming text (e.g. PDF/HTML reports)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    return (await response.text()) as unknown as T;
  }

  return response.json();
}
