// Generate lossless WebP copies; source PNGs and user uploads are never modified.
import sharp from 'sharp';
import fs from 'node:fs/promises';
const root = new URL('../public/', import.meta.url);
const sources = ['logo 3.png', 'Design sans titre.png', 'Boutton_coeur-Photoroom.png',
  'images/ChatGPT-Image-18-dec-2025-15_29_48.png', 'articles.png', 'menu.png',
  'connexion.png', 'contacts.png', 'boutique.png', 'deconnexion.png', 'ratio10.png'];
const report = [];
for (const source of sources) {
  const target = source.replace(/\.png$/, '.webp');
  const input = new URL(source, root), output = new URL(target, root);
  const before = await fs.stat(input);
  const encoded = await sharp(await fs.readFile(input)).webp({ lossless: true, effort: 6 }).toBuffer();
  if (encoded.length >= before.size) continue;
  const [originalPixels, newPixels] = await Promise.all([
    sharp(await fs.readFile(input)).ensureAlpha().raw().toBuffer(), sharp(encoded).ensureAlpha().raw().toBuffer()
  ]);
  // Transparent pixels can have different invisible RGB; compare only visible color.
  for (let i = 0; i < originalPixels.length; i += 4) {
    if (originalPixels[i + 3] !== newPixels[i + 3] || (originalPixels[i + 3] && !originalPixels.subarray(i, i + 3).equals(newPixels.subarray(i, i + 3)))) throw new Error(`Pixel mismatch: ${source}`);
  }
  await fs.writeFile(output, encoded);
  const { width, height } = await sharp(encoded).metadata();
  report.push({ source, target, before: before.size, after: encoded.length, width, height });
}
console.log(JSON.stringify(report, null, 2));
