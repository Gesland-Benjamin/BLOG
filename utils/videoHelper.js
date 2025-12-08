/**
 * Convertit une URL YouTube en URL embed
 * @param {string} url - L'URL YouTube à convertir
 * @returns {string} - L'URL embed
 */
export function convertYouTubeToEmbed(url) {
  if (!url) return url;
  
  // Si c'est déjà une URL embed, la retourner telle quelle
  if (url.includes('/embed/')) {
    return url;
  }
  
  let videoId = null;
  
  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v');
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
  }
  // Format: https://www.youtube.com/v/VIDEO_ID
  else if (url.includes('youtube.com/v/')) {
    videoId = url.split('/v/')[1].split('?')[0].split('&')[0];
  }
  
  // Si on a trouvé un ID vidéo, créer l'URL embed
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }
  
  // Sinon retourner l'URL originale
  return url;
}

/**
 * Convertit une URL Vimeo en URL embed
 * @param {string} url - L'URL Vimeo à convertir
 * @returns {string} - L'URL embed
 */
export function convertVimeoToEmbed(url) {
  if (!url) return url;
  
  // Si c'est déjà une URL embed, la retourner telle quelle
  if (url.includes('/video/')) {
    return url;
  }
  
  // Format: https://vimeo.com/VIDEO_ID
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  
  return url;
}

/**
 * Prépare l'URL vidéo pour l'affichage (convertit en embed si nécessaire)
 * @param {string} url - L'URL vidéo à préparer
 * @returns {string} - L'URL prête pour l'affichage
 */
export function prepareVideoUrl(url) {
  if (!url) return url;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return convertYouTubeToEmbed(url);
  }
  
  if (url.includes('vimeo.com')) {
    return convertVimeoToEmbed(url);
  }
  
  return url;
}

/**
 * Détermine le type de vidéo à partir de l'URL
 * @param {string} url - L'URL vidéo
 * @returns {string} - Le type de vidéo ('youtube', 'vimeo', 'direct')
 */
export function getVideoType(url) {
  if (!url) return 'direct';
  
  if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) {
    return 'youtube';
  }
  
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  return 'direct';
}
