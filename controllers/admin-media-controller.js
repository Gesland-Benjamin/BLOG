import fs from 'fs/promises';
import path from 'path';
import Article from '../models/Article.model.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '../public/uploads');

// Liste tous les fichiers médias
export const listMedia = async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    
    const mediaList = await Promise.all(
      files.map(async (filename) => {
        try {
          const filePath = path.join(UPLOADS_DIR, filename);
          const stats = await fs.stat(filePath);
          
          // Vérifier si le fichier est utilisé dans une article
          const article = await Article.findOne({
            where: { image: filename }
          });
          
          const isUsed = !!article;
          
          return {
            filename,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            createdAt: stats.birthtime,
            createdAtFormatted: stats.birthtime.toLocaleDateString('fr-FR'),
            isUsed,
            articleId: article ? article.id : null
          };
        } catch (error) {
          console.error(`Erreur lors de la lecture du fichier ${filename}:`, error);
          return null;
        }
      })
    );
    
    // Filtrer les fichiers valides
    const validMedia = mediaList.filter(m => m !== null);
    
    // Séparer les fichiers utilisés et orphelins
    const usedMedia = validMedia.filter(m => m.isUsed);
    const orphanMedia = validMedia.filter(m => !m.isUsed);
    
    res.render('admin-medias', {
      usedMedia,
      orphanMedia,
      totalSize: validMedia.reduce((sum, m) => sum + m.size, 0),
      orphanSize: orphanMedia.reduce((sum, m) => sum + m.size, 0)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des médias:', error);
    res.status(500).render('500');
  }
};

// Supprime un fichier média spécifique
export const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validation du nom de fichier (éviter traversée de répertoire)
    if (filename.includes('..') || filename.includes('/')) {
      req.session.message = { type: 'error', text: 'Nom de fichier invalide' };
      return res.redirect('/admin/medias');
    }
    
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Vérifier que le fichier existe et est dans le répertoire uploads
    const normalizedFilePath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(UPLOADS_DIR);
    
    if (!normalizedFilePath.startsWith(normalizedUploadsDir)) {
      req.session.message = { type: 'error', text: 'Fichier invalide' };
      return res.redirect('/admin/medias');
    }
    
    // Vérifier si le fichier est utilisé
    const article = await Article.findOne({
      where: { image: filename }
    });
    
    if (article) {
      req.session.message = {
        type: 'error',
        text: `Impossible de supprimer. Le fichier est utilisé par l'article "${article.titre}"`
      };
      return res.redirect('/admin/medias');
    }
    
    // Supprimer le fichier
    await fs.unlink(filePath);
    
    req.session.message = { type: 'success', text: 'Fichier supprimé avec succès' };
    res.redirect('/admin/medias');
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    if (error.code === 'ENOENT') {
      req.session.message = { type: 'error', text: 'Le fichier n\'existe pas' };
    } else {
      req.session.message = { type: 'error', text: 'Erreur lors de la suppression' };
    }
    res.redirect('/admin/medias');
  }
};

// Supprime tous les fichiers orphelins
export const deleteOrphanFiles = async (req, res) => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    
    let deletedCount = 0;
    let totalSizeFreed = 0;
    
    for (const filename of files) {
      const article = await Article.findOne({
        where: { image: filename }
      });
      
      if (!article) {
        // Fichier orphelin, le supprimer
        const filePath = path.join(UPLOADS_DIR, filename);
        const stats = await fs.stat(filePath);
        totalSizeFreed += stats.size;
        
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    req.session.message = {
      type: 'success',
      text: `${deletedCount} fichier(s) orphelin(s) supprimé(s). Espace libéré: ${formatFileSize(totalSizeFreed)}`
    };
    res.redirect('/admin/medias');
  } catch (error) {
    console.error('Erreur lors de la suppression des fichiers orphelins:', error);
    req.session.message = { type: 'error', text: 'Erreur lors du nettoyage' };
    res.redirect('/admin/medias');
  }
};

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
