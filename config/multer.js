import multer from 'multer';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { processImage, isValidImage, deleteProcessedImages } from '../services/image.js';
import { getTempUploadsDir, getUploadsDir } from '../utils/uploadPaths.js';
import { validCsrf } from '../middleware/requestSecurity.js';
import { safeLog } from '../utils/security.js';

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      fs.mkdir(getTempUploadsDir(), { recursive: true, mode: 0o700 }).then(() => cb(null, getTempUploadsDir()), cb);
    },
    filename(req, file, cb) { cb(null, randomUUID()); }
  }),
  fileFilter(req, file, cb) {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) return cb(new Error('Format refusé'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 2, fields: 20, fieldSize: 60000, parts: 24 }
});
let activeUploads = 0;
function withProcessing(parser, presets) {
  return (req, res, next) => {
    if (activeUploads >= 2) return res.status(503).send('Traitement en cours, veuillez réessayer.');
    activeUploads++;
    let released = false;
    const release = () => { if (!released) { released = true; activeUploads--; } };
    res.once('close', release);
    parser(req, res, async error => {
      const files = req.file ? [req.file] : Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
      const processed = [];
      let done = false;
      let handedOff = false;
      const cleanup = async () => {
        if (done) return; done = true;
        if (!req.uploadCommitted) await Promise.all(processed.map(p => deleteProcessedImages(getUploadsDir(), p.basename)));
      };
      res.once('finish', () => { void cleanup().catch(safeLog); });
      try {
        if (error) throw error;
        if (!validCsrf(req)) return res.status(403).send('Formulaire expiré. Rechargez la page.');
        if (res.destroyed) return;
        req.processedImages = [];
        for (const file of files) {
          if (!await isValidImage(file.path)) throw new Error('Invalid image');
          const record = { basename: file.filename };
          processed.push(record); // Nettoyer aussi les variantes partiellement créées.
          record.processed = await processImage(file.path, getUploadsDir(), file.filename, presets[file.fieldname] || 'article');
          req.processedImages.push(record);
          if (file.fieldname === 'image') req.processedImage = record;
          if (file.fieldname === 'image_inline') req.processedInlineImage = record;
        }
        if (res.destroyed) return;
        handedOff = true;
        next();
      } catch (err) {
        safeLog(err);
        if (!res.headersSent && !res.destroyed) res.status(400).send('Image refusée. Formats JPEG, PNG, GIF ou WebP, 5 Mo maximum et dimensions raisonnables.');
      } finally {
        await Promise.all(files.map(file => fs.unlink(file.path).catch(safeLog)));
        release();
        if (!handedOff) await cleanup();
      }
    });
  };
}
export const uploadWithProcessing = (preset = 'article') => withProcessing(upload.single('image'), { image: preset });
export const uploadMultipleWithProcessing = (fieldName = 'images', maxFiles = 2, preset = 'article') => withProcessing(upload.array(fieldName, Math.min(maxFiles, 2)), { [fieldName]: preset });
export const uploadTwoWithProcessing = (main = 'article', inline = 'article') => withProcessing(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image_inline', maxCount: 1 }]), { image: main, image_inline: inline });
export default upload;
