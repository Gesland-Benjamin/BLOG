# 🧹 GUIDE - SUPPRESSION CLASSES BOOTSTRAP DU HTML

## Vue d'ensemble

Maintenant que les 12 fichiers CSS sont en place, nous devons nettoyer le HTML en supprimant toutes les classes Bootstrap inline (row, col-*, d-flex, p-*, m-*, etc.) et les remplacer par des sélecteurs CSS sémantiques.

**Principes**:
- ✅ Utiliser des classes sémantiques dans le HTML (ex: `class="article-card"`)
- ✅ Définir tous les styles (padding, margin, display, flexbox) dans les fichiers CSS
- ✅ Zéro classes Bootstrap inline
- ❌ Pas de `class="row col-lg-8 d-flex gap-3 p-4"`

---

## 📋 Checklist par Fichier EJS

### Pages à Nettoyer (24 fichiers)

#### 🏠 Pages Accueil/Articles (CSS: 7-pages-home.css, 8-pages-article.css)
- [ ] `views/index.ejs` - Accueil
- [ ] `views/article.ejs` - Listing articles
- [ ] `views/article-detail.ejs` - Détail article
- [ ] `views/articles-by-category.ejs` - Articles par catégorie
- [ ] `views/articles-by-month.ejs` - Articles par mois
- [ ] `views/search-articles.ejs` - Résultats recherche

#### 🔐 Pages Authentification (CSS: 10-pages-auth.css)
- [ ] `views/auth.ejs` - Login
- [ ] `views/register.ejs` - Register
- [ ] `views/forgot-password.ejs` - Oubli mot de passe
- [ ] `views/reset-password.ejs` - Reset mot de passe

#### 👨‍💼 Pages Admin (CSS: 9-pages-admin.css)
- [ ] `views/admin-dashboard.ejs` - Dashboard
- [ ] `views/admin-categories.ejs` - Listing catégories
- [ ] `views/admin-category-form.ejs` - Formulaire catégorie
- [ ] `views/admin-article.ejs` - Listing articles admin
- [ ] `views/admin-article-form.ejs` - Formulaire article
- [ ] `views/admin-commentaires.ejs` - Listing commentaires
- [ ] `views/admin-medias.ejs` - Listing médias
- [ ] `views/admin-newsletter.ejs` - Listing newsletter

#### ❌ Pages Erreur (CSS: 11-pages-error.css)
- [ ] `views/403.ejs` - Erreur 403
- [ ] `views/404.ejs` - Erreur 404
- [ ] `views/500.ejs` - Erreur 500

#### 📬 Autres Pages (CSS: 12-pages-other.css)
- [ ] `views/newsletter.ejs` - Newsletter
- [ ] `views/newsletter-confirm.ejs` - Confirmation newsletter
- [ ] `views/newsletter-unsubscribe.ejs` - Désinscription newsletter
- [ ] `views/renseignements.ejs` - Contact/Renseignements
- [ ] `views/mentions-legales.ejs` - Mentions légales

---

## 🎯 Stratégie de Nettoyage

### Phase 1: Identifier les Patterns Bootstrap

Pour chaque fichier EJS, chercher les patterns:

```html
<!-- ❌ À REMPLACER -->
<div class="row g-5">
  <div class="col-lg-8 d-flex flex-column gap-4 p-4">
    Content
  </div>
</div>

<!-- ✅ NOUVEAU STYLE -->
<div class="articles-container">
  <div class="articles-main">
    Content
  </div>
</div>
```

### Phase 2: Mapping Classe Bootstrap → CSS

#### Classe Bootstrap: `row g-5`
- **Suppresion**: `class="row g-5"` → `class="grid-wrapper"` ou `class="sections-wrapper"`
- **CSS**: Défini dans le fichier CSS correspondant (flex, grid, gap)

#### Classe Bootstrap: `col-lg-8`
- **Suppression**: `class="col-lg-8"` → faisait partie de la section
- **CSS**: Grid column width défini dans le CSS

#### Classe Bootstrap: `d-flex flex-column gap-4`
- **Suppression**: `class="d-flex flex-column gap-4"` → `class="article-stack"` ou `class="menu-stack"`
- **CSS**: Défini avec `display: flex; flex-direction: column; gap: 1.5rem;`

#### Classe Bootstrap: `p-4`
- **Suppression**: `class="p-4"` → inclus dans le sélecteur parent
- **CSS**: `padding: 1.5rem;` dans le CSS

#### Classe Bootstrap: `m-4`
- **Suppression**: `class="m-4"` → inclus dans le sélecteur parent
- **CSS**: `margin: 1.5rem;` dans le CSS

---

## 🔧 Processus Étape par Étape

### Étape 1: Analyser le fichier HTML
```bash
# Voir toutes les classes du fichier
grep -o 'class="[^"]*"' views/index.ejs

# Compter les occurrences
grep -o 'class="[^"]*"' views/index.ejs | wc -l
```

### Étape 2: Identifier les sélecteurs CSS
Pour chaque groupe de classes Bootstrap, créer un sélecteur CSS sémantique:

```html
<!-- Avant -->
<section class="d-flex flex-column gap-4 left-sections">
  <!-- Contenu -->
</section>

<!-- Après -->
<section class="left-sections">
  <!-- Contenu -->
</section>

<!-- CSS (7-pages-home.css) -->
.left-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
```

### Étape 3: Mettre à jour le CSS
S'assurer que le sélecteur CSS a **TOUS** les styles (display, spacing, sizing, etc.)

### Étape 4: Tester Responsive
Vérifier que le layout fonctionne sur:
- Mobile (< 576px)
- Tablet (576px - 992px)
- Desktop (> 992px)

---

## 📐 Exemples de Remplacements

### Exemple 1: Grille deux colonnes avec gap

**AVANT** (index.ejs):
```html
<div class="row g-5 mt-2" style="width: 100%; max-width: 95%;">
  <div class="col-lg-8">
    <!-- Colonne gauche (articles) -->
  </div>
  <div class="col-lg-4">
    <!-- Sidebar droite -->
  </div>
</div>
```

**APRÈS**:
```html
<div class="sections-wrapper">
  <div class="articles-container">
    <div class="articles-main">
      <!-- Colonne gauche (articles) -->
    </div>
    <div class="articles-sidebar">
      <!-- Sidebar droite -->
    </div>
  </div>
</div>
```

**CSS** (7-pages-home.css):
```css
.sections-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 95%;
  margin: 2rem auto 0;
  padding: 0 var(--spacing-md);
}

.articles-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  width: 100%;
}

@media (max-width: 992px) {
  .articles-container {
    grid-template-columns: 1fr;
  }
}
```

### Exemple 2: Flexbox centered

**AVANT** (admin-dashboard.ejs):
```html
<div class="d-flex justify-content-between align-items-center mb-4">
  <h1>Tableau de bord</h1>
  <button class="btn btn-primary">Ajouter</button>
</div>
```

**APRÈS**:
```html
<div class="admin-content-header">
  <h1 class="admin-content-title">Tableau de bord</h1>
  <button class="btn btn-primary">Ajouter</button>
</div>
```

**CSS** (9-pages-admin.css):
```css
.admin-content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
  flex-wrap: wrap;
  gap: 1rem;
}

.admin-content-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-dark);
  margin: 0;
}
```

### Exemple 3: Padding et Margin

**AVANT** (article-detail.ejs):
```html
<div class="card-smeg p-4 mb-4">
  <!-- Contenu -->
</div>
```

**APRÈS**:
```html
<div class="related-articles-card">
  <!-- Contenu -->
</div>
```

**CSS** (8-pages-article.css):
```css
.related-articles-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  /* Autres styles */
}
```

---

## 🔍 Patterns Courants à Remplacer

### 1. **Row + Col Pattern**
```html
<!-- Avant -->
<div class="row g-3">
  <div class="col-md-6">Item 1</div>
  <div class="col-md-6">Item 2</div>
</div>

<!-- Après -->
<div class="items-grid">
  <div class="item">Item 1</div>
  <div class="item">Item 2</div>
</div>

<!-- CSS -->
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
```

### 2. **Flex Centering**
```html
<!-- Avant -->
<div class="d-flex justify-content-center align-items-center">
  Content
</div>

<!-- Après -->
<div class="centered-flex">
  Content
</div>

<!-- CSS -->
.centered-flex {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### 3. **Spacing Utilities**
```html
<!-- Avant -->
<div class="p-4 m-2 mb-3">Content</div>

<!-- Après -->
<div class="card-content">Content</div>

<!-- CSS -->
.card-content {
  padding: 1.5rem;
  margin: 0.5rem;
  margin-bottom: 1rem;
}
```

### 4. **Responsive Display**
```html
<!-- Avant -->
<div class="d-flex flex-column flex-md-row gap-3">
  Items
</div>

<!-- Après -->
<div class="flex-responsive">
  Items
</div>

<!-- CSS -->
.flex-responsive {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .flex-responsive {
    flex-direction: row;
  }
}
```

---

## ✅ Validation Post-Nettoyage

Après chaque fichier nettoyé:

1. **Vérifier dans le navigateur**
   - [ ] Layout correct sur desktop
   - [ ] Layout correct sur tablet
   - [ ] Layout correct sur mobile
   - [ ] Pas d'éléments qui se chevauchent
   - [ ] Espacement correct

2. **Vérifier le code**
   - [ ] Aucune classe Bootstrap (row, col-, d-flex, p-*, m-*, etc.)
   - [ ] Seulement classes sémantiques (article-card, admin-form, etc.)
   - [ ] CSS est dans les fichiers 7-12, pas en inline

3. **Console navigateur**
   - [ ] Pas d'erreurs CSS
   - [ ] Pas d'avertissements de classe non trouvée

---

## 🔄 Ordre Recommandé de Nettoyage

1. **Pages simples** (moins de classes Bootstrap)
   - mentions-legales.ejs
   - 403.ejs, 404.ejs, 500.ejs
   - newsletter-confirm.ejs, newsletter-unsubscribe.ejs

2. **Pages moyennes** (moyenne complexité)
   - search-articles.ejs
   - newsletter.ejs
   - renseignements.ejs
   - articles-by-category.ejs
   - articles-by-month.ejs

3. **Pages complexes** (beaucoup de classes Bootstrap)
   - register.ejs, forgot-password.ejs, reset-password.ejs
   - admin-commentaires.ejs, admin-medias.ejs, admin-newsletter.ejs
   - admin-categories.ejs, admin-category-form.ejs
   - admin-dashboard.ejs
   - article.ejs
   - article-detail.ejs
   - auth.ejs
   - index.ejs

---

## 🧪 Testing Checklist par Page

### Header + Footer
- [ ] Logo visible
- [ ] Navigation responsive
- [ ] Dropdown menus working
- [ ] Footer liens fonctionnels

### Accueil (index.ejs)
- [ ] Carousel fonctionne
- [ ] Articles récents affichés
- [ ] Archives liste correctement
- [ ] Responsive mobile/tablet/desktop

### Articles
- [ ] Liste articles en grid
- [ ] Détail article lisible
- [ ] Commentaires affichés
- [ ] Sidebar avec contenu connexe

### Admin
- [ ] Dashboard stats visibles
- [ ] Tableaux affichés correctement
- [ ] Formulaires fonctionnels
- [ ] Pagination fonctionne

### Auth
- [ ] Formulaire login centered
- [ ] Formulaire register aligned
- [ ] Formulaire password reset lisible

### Erreur
- [ ] Code d'erreur visible
- [ ] Message clair
- [ ] Boutons d'action présents

---

## 📞 Support & Questions

Si une classe Bootstrap ne peut pas être supprimée:
1. Vérifier qu'elle est définie dans le CSS correspondant
2. Utiliser `.container` ou `.container-fluid` au lieu de classes de colonne
3. Créer une nouvelle classe sémantique dans le CSS si nécessaire

---

## ✨ Une Fois Complété

- [ ] 24 fichiers EJS nettoyés
- [ ] Zéro classe Bootstrap restante
- [ ] Tous les tests passants
- [ ] Documentation mise à jour
- [ ] Anciens fichiers CSS archivés

🎉 **Blog entièrement sans Bootstrap inline!**
