const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be']);
const vimeoHosts = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
export function prepareVideoUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    if (youtubeHosts.has(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|v)\/([^/]+)$/)?.[1];
      return /^[\w-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (vimeoHosts.has(url.hostname)) {
      const id = url.pathname.match(/^\/(?:video\/)?(\d+)$/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    // Les vidéos directes HTTPS restent possibles, jamais javascript:, data: ni iframe tierce.
    return /\.(?:mp4|webm|ogg)$/i.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
export const convertYouTubeToEmbed = prepareVideoUrl;
export const convertVimeoToEmbed = prepareVideoUrl;
export function getVideoType(value) {
  const url = prepareVideoUrl(value);
  if (!url) return 'direct';
  const host = new URL(url).hostname;
  return host === 'www.youtube-nocookie.com' ? 'youtube' : host === 'player.vimeo.com' ? 'vimeo' : 'direct';
}
