# Compression et Redimensionnement des Images

## Vue d'ensemble

Le système de compression et redimensionnement des images utilise **Sharp** pour optimiser les images uploadées. Il crée plusieurs versions d'une image (petit, moyen, grand) en format WebP avec compression intelligente.

## Architecture

### Composants

1. **Service Image** (`services/image.js`)
   - Traitement automatique des images
   - Compression avec Sharp
   - Redimensionnement et cropping
   - Métadonnées des images

2. **Middleware Multer** (`config/multer.js`)
   - Upload de fichiers
   - Validation des types MIME
   - Intégration du traitement d'image

3. **Présets d'Images**
   - **article** : Images d'articles (1200x630, 600x400, 300x300)
   - **thumbnail** : Vignettes (300x300)
   - **avatar** : Photos de profil (150x150, 50x50)

## Installation et Configuration

Sharp est déjà installé dans les dépendances du projet.

```bash
npm install sharp
```

## Utilisation

### 1. Middleware d'Upload Simple

Pour un seul fichier image avec traitement automatique :

```javascript
import { uploadWithProcessing } from '../config/multer.js';

// Dans la route
router.post('/upload', uploadWithProcessing('article'), (req, res) => {
  if (!req.processedImage) {
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  const { processed, basename } = req.processedImage;
  
  // Les images traitées sont dans public/uploads/
  // Noms: basename_sm.webp, basename_md.webp, basename_lg.webp
  
  res.json({
    success: true,
    images: processed.processed.map(img => ({
      size: img.size,
      filename: img.filename,
      bytes: img.bytes,
      compression: img.compression
    }))
  });
});
```

### 2. Middleware d'Upload Multiple

Pour plusieurs fichiers :

```javascript
import { uploadMultipleWithProcessing } from '../config/multer.js';

router.post('/upload-gallery', uploadMultipleWithProcessing('images', 5, 'article'), (req, res) => {
  if (!req.processedImages || req.processedImages.length === 0) {
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  const results = req.processedImages.map(img => ({
    basename: img.basename,
    stats: img.processed.stats,
    files: img.processed.processed
  }));

  res.json({ success: true, uploads: results });
});
```

### 3. Utilisation Directe du Service

Pour traiter une image existante :

```javascript
import { processImage, compressImage, getImageMetadata } from '../services/image.js';
import path from 'path';

// Traiter une image avec preset
const result = await processImage(
  '/chemin/vers/image.png',
  '/dossier/destination',
  'mon-image',
  'article'
);

// Résultat:
// {
//   original: { path, name, size },
//   processed: [
//     { size: '1200x630', suffix: 'lg', filename, path, bytes, compression }
//   ],
//   stats: { originalSize, totalCompressed, compressionRatio }
// }
```

## Fonctions du Service

### processImage()
Traite une image selon un preset et crée plusieurs versions redimensionnées.

```javascript
await processImage(inputPath, outputDir, basename, preset)
```

**Paramètres:**
- `inputPath` : Chemin du fichier source
- `outputDir` : Répertoire de sortie
- `basename` : Nom de base (sans extension)
- `preset` : Type de preset (article, thumbnail, avatar)

**Retour:**
```javascript
{
  original: { path, name, size },
  processed: [
    { size, suffix, filename, path, bytes, compression },
    ...
  ],
  stats: { originalSize, totalCompressed, compressionRatio }
}
```

### compressImage()
Compresse une image avec options personnalisées.

```javascript
await compressImage(inputPath, outputPath, options)
```

**Options:**
```javascript
{
  width: 800,           // Largeur (optionnel)
  height: 600,          // Hauteur (optionnel)
  quality: 80,          // Qualité (0-100, défaut: 80)
  format: 'webp',       // Format: webp, jpeg, png
  fit: 'cover'          // Cover, contain, fill, inside, outside
}
```

### getImageMetadata()
Récupère les métadonnées d'une image.

```javascript
const metadata = await getImageMetadata(imagePath);
// Retour: { format, width, height, size, colorspace, hasAlpha, density }
```

### isValidImage()
Valide qu'un fichier est une image.

```javascript
const isValid = await isValidImage(filePath);
// Retour: boolean
```

### deleteProcessedImages()
Supprime tous les fichiers liés à une image (basename_*.webp).

```javascript
const deleted = await deleteProcessedImages(imageDir, basename);
// Retour: ['basename_sm.webp', 'basename_md.webp', ...]
```

### generatePlaceholder()
Génère une image de placeholder SVG.

```javascript
const buffer = await generatePlaceholder(300, 300, '#ddd', 'Placeholder text');
```

## Présets Disponibles

### Preset "article"
Pour les images d'articles de blog.

```javascript
{
  sizes: [
    { width: 1200, height: 630, suffix: 'lg' },  // Grande (bannière)
    { width: 600, height: 400, suffix: 'md' },   // Moyenne
    { width: 300, height: 300, suffix: 'sm' }    // Petite (vignette)
  ],
  quality: 80,
  format: 'webp'
}
```

### Preset "thumbnail"
Pour les vignettes.

```javascript
{
  sizes: [
    { width: 300, height: 300, suffix: 'sm' }
  ],
  quality: 75,
  format: 'webp'
}
```

### Preset "avatar"
Pour les photos de profil.

```javascript
{
  sizes: [
    { width: 150, height: 150, suffix: 'sm' },
    { width: 50, height: 50, suffix: 'xs' }
  ],
  quality: 85,
  format: 'webp'
}
```

## Structure des Fichiers

Les images uploadées et traitées sont stockées dans :

```
public/uploads/
├── tmp/                    # Fichiers temporaires (multer)
│   └── *.tmp
├── image_abc123_lg.webp   # Version grande
├── image_abc123_md.webp   # Version moyenne
├── image_abc123_sm.webp   # Version petite
└── [autres images]
```

## Exemple Complet : Intégration dans un Contrôleur

```javascript
import { uploadWithProcessing } from '../config/multer.js';
import { deleteProcessedImages } from '../services/image.js';
import path from 'path';

export async function createArticle(req, res) {
  try {
    // Image fournie et traitée par le middleware
    let imageBasename = null;
    
    if (req.processedImage) {
      imageBasename = req.processedImage.basename;
      
      // Utiliser la version moyenne pour le preview
      const previewImage = `${imageBasename}_md.webp`;
      
      // Sauvegarder dans la BD
      const article = await Article.create({
        titre: req.body.titre,
        contenu: req.body.contenu,
        image: previewImage, // Nom du fichier
        ...
      });
      
      return res.json({ success: true, article });
    }
    
    res.status(400).json({ error: 'Image requise' });
  } catch (error) {
    // En cas d'erreur, supprimer les images traitées
    if (req.processedImage) {
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      await deleteProcessedImages(uploadsDir, req.processedImage.basename);
    }
    
    res.status(500).json({ error: error.message });
  }
}

// Dans le routeur:
import { uploadWithProcessing } from '../config/multer.js';

router.post('/articles', uploadWithProcessing('article'), createArticle);
```

## Optimisation des Images

### Formats Supportés
- **WebP** (recommandé) : Meilleure compression, 25-35% plus petit que JPEG
- **JPEG** : Compatible universel, bon pour photos
- **PNG** : Pour images avec transparence

### Qualité
- **85-90** : Haute qualité, peu de compression
- **80** : Bon équilibre qualité/taille (défaut)
- **70-75** : Compression moyenne, acceptable
- **50-60** : Compression agressive

### Dimensions Recommandées
- **Bannière d'article** : 1200x630px
- **Image principale** : 600-800px
- **Vignette** : 300x300px
- **Avatar** : 150x150px

## Gestion des Erreurs

```javascript
import { processImage } from '../services/image.js';

try {
  const result = await processImage(inputPath, outputDir, basename, preset);
} catch (error) {
  // "Preset inconnu: xyz"
  // "Impossible de traiter l'image: ..."
  // "Impossible de supprimer les images: ..."
  console.error(error.message);
}
```

## Tests

Lancer le script de test complet :

```bash
npm run test:image-compression
```

Le script teste :
1. Affichage des présets
2. Création d'une image de test
3. Lecture des métadonnées
4. Validation de l'image
5. Traitement avec preset
6. Compression personnalisée
7. Suppression des fichiers
8. Nettoyage

## Performance

### Compression Typique
- **JPEG 1920x1080** : 2.5 MB → 150-200 KB (92% compression)
- **PNG 1200x630** : 1.8 MB → 80-120 KB (93% compression)
- **WebP optimisé** : 30% plus petit que JPEG équivalent

### Temps de Traitement
- Image petite (500x500) : ~50-100ms
- Image moyenne (1200x800) : ~150-300ms
- Image grande (4000x3000) : ~500-1000ms

## Bonnes Pratiques

1. **Toujours valider l'image**
   ```javascript
   const isValid = await isValidImage(filePath);
   if (!isValid) throw new Error('Image invalide');
   ```

2. **Utiliser les bons présets**
   - Article → 'article'
   - Profil → 'avatar'
   - Galerie → 'thumbnail'

3. **Nettoyer en cas d'erreur**
   ```javascript
   if (error && req.processedImage) {
     await deleteProcessedImages(dir, req.processedImage.basename);
   }
   ```

4. **Servir la bonne version**
   - Mobile → version 'sm' (300x300)
   - Desktop → version 'md' ou 'lg'
   - Responsive → utiliser srcset

5. **Limiter la taille des uploads**
   - Maximum 5 MB par fichier (configurable)
   - Vérifier la résolution maximale

## Intégration HTML

Afficher les images optimisées :

```html
<!-- Avec srcset pour responsive -->
<img 
  src="/uploads/image_abc_md.webp" 
  srcset="
    /uploads/image_abc_sm.webp 300w,
    /uploads/image_abc_md.webp 600w,
    /uploads/image_abc_lg.webp 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 100vw"
  alt="Description"
>

<!-- Fallback pour anciens navigateurs -->
<picture>
  <source srcset="/uploads/image_abc.webp" type="image/webp">
  <source srcset="/uploads/image_abc.jpg" type="image/jpeg">
  <img src="/uploads/image_abc.jpg" alt="Description">
</picture>
```

## Ressources

- [Documentation Sharp](https://sharp.pixelplumbing.com/)
- [WebP Format](https://developers.google.com/speed/webp)
- [Image Optimization Guide](https://web.dev/image-optimization/)

## Conclusion

Ce système offre :
- ✅ Compression automatique des images
- ✅ Multiples résolutions pour responsive
- ✅ Format WebP optimisé
- ✅ Métadonnées et validation
- ✅ Gestion des erreurs robuste
- ✅ Performance optimisée
