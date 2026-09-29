/**
 * Centralized API Base Configuration for FeedbackMind
 *
 * In Production (Vercel deployment):
 *   Uses same-origin relative paths ('') so all requests hit
 *   https://feedback-mind-delta.vercel.app/api/... directly on Vercel.
 *
 * In Local Development:
 *   If VITE_API_BASE is set, uses VITE_API_BASE.
 *   If running on localhost/127.0.0.1, defaults to http://127.0.0.1:8000.
 */

export const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim() !== '') {
    const customBase = import.meta.env.VITE_API_BASE.trim();
    return customBase.endsWith('/') ? customBase.slice(0, -1) : customBase;
  }

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.') && !host.startsWith('10.')) {
      return '';
    }
  }

  return 'http://127.0.0.1:8000';
};

export const safeFetch = async (path, options = {}) => {
  const base = getApiBase();
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  const url = (path.startsWith('http://') || path.startsWith('https://'))
    ? path
    : base + normalizedPath;

  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Non-JSON response
    }
  }

  if (!response.ok) {
    const detail = data && (data.detail || data.message)
      ? (data.detail || data.message)
      : (text || ('HTTP ' + response.status + ': ' + response.statusText));
    throw new Error(detail);
  }

  return data || {};
};
