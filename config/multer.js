import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { processImage, isValidImage } from "../services/image.js";
import { getTempUploadsDir, getUploadsDir } from "../utils/uploadPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getTempUploadsDir());
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier aléatoire
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix);
  }
});

// Filtre pour valider les fichiers
const fileFilter = (req, file, cb) => {
  // Types MIME autorisés (images uniquement)
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images (JPEG, PNG, GIF, WebP) sont autorisées"), false);
  }
};

// Configuration de multer avec traitement d'image automatique
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

/**
 * Middleware pour traiter l'image uploadée
 * Compresse et redimensionne l'image selon un preset
 * @param {string} preset - Type de preset (article, thumbnail, avatar)
 * @returns {Function} Middleware multer avec traitement
 */
export function uploadWithProcessing(preset = 'article') {
  return async (req, res, next) => {
    // Utiliser le middleware multer
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        // Pas d'erreur, juste pas de fichier
        return next();
      }

      try {
        // Valider que c'est une image
        const isValid = await isValidImage(req.file.path);
        if (!isValid) {
          throw new Error('Le fichier uploadé n\'est pas une image valide');
        }

        // Traiter l'image
        const basename = path.parse(req.file.filename).name;
        const outputDir = getUploadsDir();
        
        const imageResult = await processImage(
          req.file.path,
          outputDir,
          basename,
          preset
        );

        // Stocker les infos dans la requête
        req.processedImage = {
          original: req.file,
          processed: imageResult,
          basename: basename
        };

        next();
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        res.status(500).json({ error: error.message });
      }
    });
  };
}

/**
 * Middleware pour traiter plusieurs images
 * @param {string} fieldName - Nom du champ form
 * @param {number} maxFiles - Nombre max de fichiers
 * @param {string} preset - Type de preset
 * @returns {Function} Middleware
 */
export function uploadMultipleWithProcessing(fieldName = 'images', maxFiles = 5, preset = 'article') {
  return async (req, res, next) => {
    upload.array(fieldName, maxFiles)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        req.processedImages = [];

        for (const file of req.files) {
          // Valider que c'est une image
          const isValid = await isValidImage(file.path);
          if (!isValid) {
            throw new Error(`Le fichier ${file.filename} n\'est pas une image valide`);
          }

          // Traiter l'image
          const basename = path.parse(file.filename).name;
          const outputDir = getUploadsDir();
          
          const imageResult = await processImage(
            file.path,
            outputDir,
            basename,
            preset
          );

          req.processedImages.push({
            original: file,
            processed: imageResult,
            basename: basename
          });
        }

        next();
      } catch (error) {
        console.error('Erreur lors du traitement des images:', error);
        res.status(500).json({ error: error.message });
      }
    });
  };
}

export default upload;
