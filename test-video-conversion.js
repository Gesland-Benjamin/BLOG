import { prepareVideoUrl, getVideoType, convertYouTubeToEmbed } from './utils/videoHelper.js';

console.log('🎬 Test de conversion des URLs vidéo\n');

const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://vimeo.com/123456789',
  'https://example.com/video.mp4'
];

testUrls.forEach(url => {
  console.log(`\n📎 URL originale: ${url}`);
  console.log(`   Type: ${getVideoType(url)}`);
  console.log(`   URL convertie: ${prepareVideoUrl(url)}`);
});

console.log('\n\n🧪 Test spécifique YouTube:');
const youtubeTests = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/v/dQw4w9WgXcQ'
];

youtubeTests.forEach(url => {
  const converted = convertYouTubeToEmbed(url);
  console.log(`\n${url}`);
  console.log(`→ ${converted}`);
});
