import fs from 'fs/promises';
import path from 'path';
import Article from '../models/Article.model.js';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// =========================
// LIST MEDIA
// =========================
export const listMedia = async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);

    // 🔥 IMPORTANT: récupérer aussi id + title (sinon bug plus bas)
    const usedArticles = await Article.findAll({
      attributes: ['id', 'title', 'image']
    });

    const usedFilesSet = new Set(
      usedArticles
        .filter(a => a.image)
        .map(a => path.basename(a.image))
    );

    const mediaList = await Promise.all(
      files.map(async (filename) => {
        try {
          const filePath = path.join(UPLOADS_DIR, filename);
          const stats = await fs.stat(filePath);

          const isUsed = usedFilesSet.has(filename);

          const article = isUsed
            ? usedArticles.find(a => path.basename(a.image) === filename)
            : null;

          return {
            filename,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            createdAt: stats.birthtime,
            createdAtFormatted: stats.birthtime.toLocaleDateString('fr-FR'),
            isUsed,
            articleId: article ? article.id : null,
            articleTitle: article ? article.title : null
          };

        } catch (error) {
          console.error(`Erreur lecture fichier ${filename}:`, error);
          return null;
        }
      })
    );

    const validMedia = mediaList.filter(Boolean);
    const usedMedia = validMedia.filter(m => m.isUsed);
    const orphanMedia = validMedia.filter(m => !m.isUsed);

    res.render('admin-medias', {
      usedMedia,
      orphanMedia,
      totalSize: validMedia.reduce((sum, m) => sum + m.size, 0),
      orphanSize: orphanMedia.reduce((sum, m) => sum + m.size, 0)
    });

  } catch (error) {
    console.error('Erreur récupération médias:', error);
    res.status(500).render('500');
  }
};

// =========================
// DELETE MEDIA
// =========================
export const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;

    // 🔒 Sécurité anti path traversal
    if (filename.includes('..') || filename.includes('/')) {
      req.session.message = { type: 'error', text: 'Nom de fichier invalide' };
      return res.redirect('/admin/medias');
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    const normalizedFilePath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(UPLOADS_DIR);

    if (!normalizedFilePath.startsWith(normalizedUploadsDir)) {
      req.session.message = { type: 'error', text: 'Fichier invalide' };
      return res.redirect('/admin/medias');
    }

    // 🔥 Vérifier si utilisé en BDD
    const article = await Article.findOne({
      where: {
        image: {
          [Op.like]: `%${filename}%`
        }
      }
    });

    if (article) {
      req.session.message = {
        type: 'error',
        text: `Impossible de supprimer. Utilisé par "${article.title}"`
      };
      return res.redirect('/admin/medias');
    }

    await fs.unlink(filePath);

    req.session.message = {
      type: 'success',
      text: 'Fichier supprimé'
    };

    res.redirect('/admin/medias');

  } catch (error) {
    console.error('Erreur suppression fichier:', error);

    req.session.message = {
      type: 'error',
      text: error.code === 'ENOENT'
        ? 'Fichier inexistant'
        : 'Erreur lors de la suppression'
    };

    res.redirect('/admin/medias');
  }
};

// =========================
// DELETE ORPHAN FILES
// =========================
export const deleteOrphanFiles = async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);

    const usedArticles = await Article.findAll({
      attributes: ['image']
    });

    const usedFilesSet = new Set(
      usedArticles
        .filter(a => a.image)
        .map(a => path.basename(a.image))
    );

    let deletedCount = 0;
    let totalSizeFreed = 0;

    for (const filename of files) {
      if (!usedFilesSet.has(filename)) {
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = await fs.stat(filePath);

        await fs.unlink(filePath);

        totalSizeFreed += stats.size;
        deletedCount++;
      }
    }

    req.session.message = {
      type: 'success',
      text: `${deletedCount} fichier(s) supprimé(s) (${formatFileSize(totalSizeFreed)} libérés)`
    };

    res.redirect('/admin/medias');

  } catch (error) {
    console.error('Erreur nettoyage fichiers orphelins:', error);

    req.session.message = {
      type: 'error',
      text: 'Erreur lors du nettoyage'
    };

    res.redirect('/admin/medias');
  }
};

// =========================
// FORMAT FILE SIZE
// =========================
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}