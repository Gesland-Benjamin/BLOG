# Guide d'Intégration - Compression d'Images

## Résumé Rapide

Le système de compression d'images avec Sharp est intégré au projet avec :
- **3 présets** : article, thumbnail, avatar
- **Compression automatique** via le middleware multer
- **3 tailles par défaut** : petit, moyen, grand
- **Format WebP** optimisé (compression 90-95%)

## Utilisation dans les Routes

### 1. Upload d'Article (déjà intégré)

```javascript
// routes/admin-article-router.js
import { uploadWithProcessing } from '../config/multer.js';

router.post('/articles', 
  isAdmin, 
  strictRateLimit, 
  uploadWithProcessing('article'),  // ← Compression automatique
  validateRequest(articleSchema), 
  createArticle
);
```

### 2. Votre Propre Route

Exemple : Upload d'avatar utilisateur

```javascript
// Dans votre routeur
import { uploadWithProcessing } from '../config/multer.js';

router.post('/profil/avatar', 
  isAuthenticated,
  uploadWithProcessing('avatar'),  // Compresse en 150x150 et 50x50
  updateUserAvatar
);

// Dans votre contrôleur
export async function updateUserAvatar(req, res) {
  if (!req.processedImage) {
    return res.status(400).json({ error: 'Image requise' });
  }

  const { processed, basename } = req.processedImage;
  
  // Utiliser la version petite pour le profil
  const avatarSmall = `${basename}_sm.webp`;  // 150x150
  const avatarTiny = `${basename}_xs.webp`;   // 50x50
  
  await User.update(
    { avatar: avatarSmall },
    { where: { id: req.user.id } }
  );

  res.json({ success: true, avatar: avatarSmall });
}
```

## Utilisation dans les Vues

### Afficher une Image Optimisée

```html
<!-- Simple (une seule version) -->
<img src="/uploads/<%= article.image %>" alt="<%= article.titre %>">

<!-- Responsive avec srcset (recommandé) -->
<picture>
  <source 
    srcset="
      /uploads/<%= basename %>_sm.webp 300w,
      /uploads/<%= basename %>_md.webp 600w,
      /uploads/<%= basename %>_lg.webp 1200w
    "
    sizes="(max-width: 768px) 100vw, 50vw"
    type="image/webp">
  <img 
    src="/uploads/<%= basename %>_md.webp"
    alt="<%= title %>"
    loading="lazy">
</picture>

<!-- Avec fallback pour anciens navigateurs -->
<picture>
  <source srcset="/uploads/<%= image %>" type="image/webp">
  <source srcset="/uploads/<%= image.replace('.webp', '.jpg') %>" type="image/jpeg">
  <img src="/uploads/<%= image.replace('.webp', '.jpg') %>" alt="<%= title %>">
</picture>
```

### Exemple complet en EJS

```ejs
<!-- views/article.ejs -->
<article class="article-card">
  <% if (article.image) { %>
    <picture class="article-image">
      <source 
        srcset="
          /uploads/<%= article.image.replace('_md.webp', '_sm.webp') %> 300w,
          /uploads/<%= article.image %> 600w,
          /uploads/<%= article.image.replace('_md.webp', '_lg.webp') %> 1200w
        "
        sizes="(max-width: 768px) 100vw, 50vw"
        type="image/webp">
      <img 
        src="/uploads/<%= article.image %>"
        alt="<%= article.titre %>"
        loading="lazy"
        width="600"
        height="400">
    </picture>
  <% } %>
  
  <h2><%= article.titre %></h2>
  <p><%= article.contenu.substring(0, 100) %>...</p>
</article>
```

## Intégration dans les Contrôleurs

### Créer une Ressource avec Image

```javascript
import { deleteProcessedImages } from '../services/image.js';
import path from 'path';

export async function createGalleryItem(req, res) {
  try {
    // Vérifier l'image
    if (!req.processedImage) {
      return res.status(400).json({ error: 'Image requise' });
    }

    const { processed, basename } = req.processedImage;

    // Créer l'élément
    const galleryItem = await Gallery.create({
      titre: req.body.titre,
      image_small: `${basename}_sm.webp`,
      image_medium: `${basename}_md.webp`,
      image_large: `${basename}_lg.webp`,
      compression_ratio: processed.stats.compressionRatio
    });

    console.log('Galerie créée avec compression:', processed.stats.compressionRatio);

    res.json({ success: true, item: galleryItem });

  } catch (error) {
    console.error(error);
    
    // Nettoyer les images en cas d'erreur
    if (req.processedImage) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        const deleted = await deleteProcessedImages(uploadsDir, req.processedImage.basename);
        console.log('Images supprimées:', deleted);
      } catch (deleteError) {
        console.error('Erreur suppression:', deleteError);
      }
    }

    res.status(500).json({ error: error.message });
  }
}
```

### Mettre à Jour une Ressource avec Image

```javascript
export async function updateGalleryItem(req, res) {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    // Si nouvelle image
    if (req.processedImage) {
      // Supprimer l'ancienne
      if (item.image_small) {
        try {
          const oldBasename = item.image_small.replace(/_sm\.webp$/, '');
          const uploadsDir = path.join(process.cwd(), 'public/uploads');
          await deleteProcessedImages(uploadsDir, oldBasename);
        } catch (error) {
          console.error('Erreur suppression ancienne:', error);
        }
      }

      // Ajouter la nouvelle
      const { basename } = req.processedImage;
      item.image_small = `${basename}_sm.webp`;
      item.image_medium = `${basename}_md.webp`;
      item.image_large = `${basename}_lg.webp`;
    }

    await item.update({ titre: req.body.titre });

    res.json({ success: true, item });

  } catch (error) {
    console.error(error);
    
    // Nettoyer la nouvelle image en cas d'erreur
    if (req.processedImage) {
      const uploadsDir = path.join(process.cwd(), 'public/uploads');
      await deleteProcessedImages(uploadsDir, req.processedImage.basename).catch(console.error);
    }

    res.status(500).json({ error: error.message });
  }
}
```

### Supprimer une Ressource avec Images

```javascript
export async function deleteGalleryItem(req, res) {
  try {
    const item = await Gallery.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Élément non trouvé' });
    }

    // Supprimer les images
    if (item.image_small) {
      try {
        const basename = item.image_small.replace(/_sm\.webp$/, '');
        const uploadsDir = path.join(process.cwd(), 'public/uploads');
        await deleteProcessedImages(uploadsDir, basename);
        console.log('Images supprimées pour', item.id);
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }

    await item.destroy();

    res.json({ success: true, message: 'Supprimé' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
```

## Utilisation Avancée

### Preset Personnalisé

Ajouter un nouveau preset dans `services/image.js` :

```javascript
export const imagePresets = {
  // Existants...
  
  // Nouveau preset
  portfolio: {
    sizes: [
      { width: 1920, height: 1080, suffix: 'xl' },  // HD
      { width: 1024, height: 576, suffix: 'lg' },   // Large
      { width: 512, height: 288, suffix: 'md' }     // Mobile
    ],
    quality: 85,
    format: 'webp'
  }
};
```

Puis l'utiliser :

```javascript
router.post('/portfolio', 
  isAdmin,
  uploadWithProcessing('portfolio'),  // ← Nouveau preset
  createPortfolioItem
);
```

### Compression Personnalisée

```javascript
import { compressImage } from '../services/image.js';

export async function processCustomImage(req, res) {
  try {
    const inputPath = '/chemin/source.jpg';
    const outputPath = '/chemin/output.webp';

    const result = await compressImage(inputPath, outputPath, {
      width: 1024,
      height: 768,
      quality: 75,
      format: 'webp'
    });

    console.log('Compression:', result.compression);
    // Affiche: "Compression: 85.3%"

    res.json({ success: true, result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Tests

### Lancer le Script de Test

```bash
npm run test:image-compression
```

### Tester une Route

```bash
# Upload avec curl
curl -X POST http://localhost:3000/admin/articles \
  -F "titre=Mon Article" \
  -F "contenu=Contenu..." \
  -F "categorie_id=1" \
  -F "image=@/chemin/image.jpg"
```

## Statistiques de Performance

### Compression Typique

| Format | Original | Compressé | Réduction |
|--------|----------|-----------|-----------|
| JPEG 2MB | 2000 KB | 150 KB | 92.5% |
| PNG 1.5MB | 1500 KB | 100 KB | 93.3% |
| BMP 5MB | 5000 KB | 200 KB | 96% |

### Temps de Traitement

| Taille | Temps |
|--------|-------|
| 500x500 | 50-100ms |
| 1200x800 | 150-300ms |
| 4000x3000 | 500-1000ms |

## Dépannage

### Erreur: "Module not found: sharp"

```bash
npm install sharp
```

### Images non compressées

Vérifier que le middleware est appliqué :

```javascript
// ✅ Correct
router.post('/upload', uploadWithProcessing('article'), handler);

// ❌ Incorrect
router.post('/upload', upload.single('image'), handler);
```

### Ancienne image pas supprimée

Vérifier la syntaxe de suppression :

```javascript
const basename = image.split('/').pop().replace(/_[a-z]{2}\.webp$/, '');
// "uploads_image_abc_md.webp" → "image_abc"
```

## Checklist d'Intégration

- [ ] Sharp installé (`npm install sharp`)
- [ ] `uploadWithProcessing` importé dans routeur
- [ ] Contrôleur utilise `req.processedImage`
- [ ] Suppression des anciennes images en cas d'erreur
- [ ] Nettoyage des images lors de suppression
- [ ] Vue affiche les bonnes versions (_md, _sm, _lg)
- [ ] Tests passent : `npm run test:image-compression`

## Ressources

- Documentation complète : `/docs/images-compression.md`
- Service d'images : `/services/image.js`
- Configuration multer : `/config/multer.js`
- Test complet : `/scripts/test-image-compression.js`
