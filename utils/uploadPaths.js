import path from 'path';

const variantSuffixPattern = /_(sm|md|lg|xs)$/;

export function getUploadsDir() {
  return process.env.STATIC_DIR || path.join(process.cwd(), 'public', 'uploads');
}

export function getTempUploadsDir() {
  return process.env.TEMP_DIR || path.join(process.cwd(), '.private-uploads');
}

export function getImageBaseName(imagePath) {
  if (!imagePath) return '';

  const filename = path.basename(String(imagePath));
  const withoutExt = filename.replace(path.extname(filename), '');
  return withoutExt.replace(variantSuffixPattern, '');
}

export function getImageBaseFromFilename(filename) {
  if (!filename) return '';

  const withoutExt = path.basename(String(filename)).replace(path.extname(filename), '');
  return withoutExt.replace(variantSuffixPattern, '');
}

export function isRelatedImageFile(filename, imagePath) {
  const base = getImageBaseName(imagePath);
  if (!base) return false;

  const candidate = path.basename(String(filename));
  return candidate === `${base}.webp` || candidate.startsWith(`${base}_`);
}

export function assertPrivateTempDir() {
  const temp = path.resolve(getTempUploadsDir());
  for (const root of [path.resolve(process.cwd(), 'public'), path.resolve(getUploadsDir())]) {
    const relative = path.relative(root, temp);
    if (!relative || (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative))) {
      throw new Error('TEMP_DIR doit se trouver hors des répertoires publics.');
    }
  }
}
