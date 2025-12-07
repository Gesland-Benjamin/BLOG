import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuration des présets d'images
 */
export const imagePresets = {
  article: {
    sizes: [
      { width: 1200, height: 630, suffix: 'lg' },  // Image principale
      { width: 600, height: 400, suffix: 'md' },   // Medium
      { width: 300, height: 300, suffix: 'sm' }    // Vignette
    ],
    quality: 80,
    format: 'webp'
  },
  thumbnail: {
    sizes: [
      { width: 300, height: 300, suffix: 'sm' }
    ],
    quality: 75,
    format: 'webp'
  },
  avatar: {
    sizes: [
      { width: 150, height: 150, suffix: 'sm' },
      { width: 50, height: 50, suffix: 'xs' }
    ],
    quality: 85,
    format: 'webp'
  }
};

/**
 * Traite et compresse une image
 * @param {string} inputPath - Chemin du fichier source
 * @param {string} outputDir - Répertoire de sortie
 * @param {string} basename - Nom de base du fichier (sans extension)
 * @param {string} preset - Type de preset (article, thumbnail, avatar)
 * @returns {Promise<Object>} Infos des fichiers créés
 */
export async function processImage(inputPath, outputDir, basename, preset = 'article') {
  try {
    // Créer le répertoire de sortie s'il n'existe pas
    await fs.mkdir(outputDir, { recursive: true });

    const config = imagePresets[preset];
    if (!config) {
      throw new Error(`Preset inconnu: ${preset}`);
    }

    const results = {
      original: {
        path: inputPath,
        name: basename,
        size: 0
      },
      processed: [],
      stats: {
        originalSize: 0,
        totalCompressed: 0,
        compressionRatio: 0
      }
    };

    // Obtenir la taille du fichier original
    const originalStats = await fs.stat(inputPath);
    results.stats.originalSize = originalStats.size;
    results.original.size = originalStats.size;

    // Traiter chaque dimension
    for (const size of config.sizes) {
      const filename = `${basename}_${size.suffix}.${config.format}`;
      const outputPath = path.join(outputDir, filename);

      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true
        })
        .webp({ quality: config.quality })
        .toFile(outputPath);

      // Obtenir la taille du fichier compressé
      const compressedStats = await fs.stat(outputPath);
      const compressionPercent = (
        (1 - compressedStats.size / results.stats.originalSize) * 100
      ).toFixed(1);

      results.processed.push({
        size: `${size.width}x${size.height}`,
        suffix: size.suffix,
        filename: filename,
        path: outputPath,
        bytes: compressedStats.size,
        compression: `${compressionPercent}%`
      });

      results.stats.totalCompressed += compressedStats.size;
    }

    // Calculer le ratio de compression global
    results.stats.compressionRatio = (
      (1 - results.stats.totalCompressed / results.stats.originalSize) * 100
    ).toFixed(1);

    return results;
  } catch (error) {
    console.error('Erreur lors du traitement de l\'image:', error);
    throw new Error(`Impossible de traiter l'image: ${error.message}`);
  }
}

/**
 * Compresse une image avec options personnalisées
 * @param {string} inputPath - Chemin du fichier source
 * @param {string} outputPath - Chemin du fichier de sortie
 * @param {Object} options - Options de compression
 * @returns {Promise<Object>} Infos du fichier traité
 */
export async function compressImage(inputPath, outputPath, options = {}) {
  try {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'webp',
      fit = 'cover'
    } = options;

    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Obtenir la taille originale
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    let pipeline = sharp(inputPath);

    // Redimensionner si nécessaire
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: fit,
        position: 'center',
        withoutEnlargement: true
      });
    }

    // Appliquer la compression webp
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }

    await pipeline.toFile(outputPath);

    // Obtenir la taille compressée
    const compressedStats = await fs.stat(outputPath);
    const compressionPercent = (
      (1 - compressedStats.size / originalSize) * 100
    ).toFixed(1);

    return {
      inputPath,
      outputPath,
      originalSize: originalSize,
      compressedSize: compressedStats.size,
      compression: `${compressionPercent}%`,
      format: format,
      quality: quality
    };
  } catch (error) {
    console.error('Erreur lors de la compression:', error);
    throw new Error(`Impossible de compresser l'image: ${error.message}`);
  }
}

/**
 * Obtient les métadonnées d'une image
 * @param {string} imagePath - Chemin du fichier image
 * @returns {Promise<Object>} Métadonnées
 */
export async function getImageMetadata(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);

    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: stats.size,
      colorspace: metadata.space,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density
    };
  } catch (error) {
    console.error('Erreur lors de la lecture des métadonnées:', error);
    throw new Error(`Impossible de lire les métadonnées: ${error.message}`);
  }
}

/**
 * Supprime tous les fichiers liés à une image
 * @param {string} imageDir - Répertoire contenant les images
 * @param {string} basename - Nom de base du fichier
 * @returns {Promise<Array>} Fichiers supprimés
 */
export async function deleteProcessedImages(imageDir, basename) {
  try {
    const files = await fs.readdir(imageDir);
    const deleted = [];

    for (const file of files) {
      if (file.startsWith(basename)) {
        const filePath = path.join(imageDir, file);
        await fs.unlink(filePath);
        deleted.push(file);
      }
    }

    return deleted;
  } catch (error) {
    console.error('Erreur lors de la suppression des images:', error);
    throw new Error(`Impossible de supprimer les images: ${error.message}`);
  }
}

/**
 * Crée une image de placeholder
 * @param {number} width - Largeur
 * @param {number} height - Hauteur
 * @param {string} color - Couleur en hex
 * @param {string} text - Texte à afficher
 * @returns {Promise<Buffer>} Buffer de l'image
 */
export async function generatePlaceholder(width, height, color = '#ddd', text = '') {
  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${color}"/>
        ${text ? `<text x="50%" y="50%" font-size="24" fill="#999" text-anchor="middle" dominant-baseline="middle">${text}</text>` : ''}
      </svg>
    `;

    return await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Erreur lors de la création du placeholder:', error);
    throw new Error(`Impossible de créer le placeholder: ${error.message}`);
  }
}

/**
 * Valide qu'un fichier est une image valide
 * @param {string} filePath - Chemin du fichier
 * @returns {Promise<boolean>} True si c'est une image valide
 */
export async function isValidImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata && ['jpeg', 'png', 'webp', 'gif', 'svg'].includes(metadata.format);
  } catch (error) {
    return false;
  }
}
