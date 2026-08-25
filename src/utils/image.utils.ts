import { BASE_URL } from '../service/api.service';

export const DEFAULT_BOOK_PLACEHOLDER = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

/**
 * Robust image URL formatter for MyEdudocs
 * Handles relative backend paths, Windows backslashes, uploads/ segments, external URLs, and URI encoding
 */
export const getImageUrl = (path?: string | null): string => {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return DEFAULT_BOOK_PLACEHOLDER;
  }

  const normalizedPath = String(path).replace(/\\/g, '/').trim();

  // If it's already an absolute URL, return it
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath;
  }

  const root = BASE_URL.replace('/api/v1', '');
  let cleanPath = normalizedPath;
  const uploadsIdx = normalizedPath.lastIndexOf('uploads/');
  if (uploadsIdx >= 0) {
    cleanPath = normalizedPath.substring(uploadsIdx);
  } else if (!normalizedPath.startsWith('uploads/')
          && !normalizedPath.startsWith('/uploads/')
          && !normalizedPath.startsWith('assets/')
          && !normalizedPath.startsWith('/assets/')) {
    cleanPath = `uploads/${normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath}`;
  }

  const finalPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return encodeURI(`${root}${finalPath}`);
};
