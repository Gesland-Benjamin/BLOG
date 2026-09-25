import sharp from 'sharp';
import path from 'node:path';
import { getUploadsDir } from '../utils/uploadPaths.js';
const cache = new Map();
// Read dimensions only for known local uploads; never fetch remote URLs.
export async function articleImageDimensions(url) {
  if (!/^\/uploads\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/i.test(url || '')) return null;
  if (cache.has(url)) return cache.get(url);
  try {
    const { width, height } = await sharp(path.join(getUploadsDir(), path.basename(url)), { limitInputPixels: 20000000 }).metadata();
    const result = width && height ? { width, height } : null;
    if (cache.size >= 128) cache.delete(cache.keys().next().value);
    cache.set(url, result);
    return result;
  } catch { return null; } // Missing legacy files must not break article rendering.
}

export async function articleImageSrcset(url, dimensions) {
  if (!dimensions || !/_md\.webp$/.test(url || '')) return '';
  const largeUrl = url.replace(/_md\.webp$/, '_lg.webp');
  const large = await articleImageDimensions(largeUrl);
  return large && large.width > dimensions.width ? `${url} ${dimensions.width}w, ${largeUrl} ${large.width}w` : '';
}
