# Structure CSS du Blog - Sans Bootstrap

## 📁 Organisation des fichiers CSS

Tous les fichiers CSS sont situés dans `/public/css/` et organisés comme suit :

### Fichiers CSS

| Fichier | Description |
|---------|-------------|
| **general.css** | Styles généraux et réutilisables (variables, typographie, grille, utilitaires) |
| **header.css** | En-tête et navigation principales |
| **footer.css** | Pied de page |
| **index.css** | Page d'accueil (featured article, grille d'articles) |
| **article-detail.css** | Détail des articles et commentaires |
| **auth.css** | Pages d'authentification (login, register, forgot password) |
| **admin.css** | Toutes les pages administrateur |

### Structure générale

```
general.css (charge en premier)
├── Variables CSS
├── Réinitialisation et styles de base
├── Typographie
├── Conteneurs et grille (12 colonnes)
├── Flexbox utilitaires
├── Espacement (margin/padding)
├── Boutons
├── Cartes
├── Formulaires
├── Alertes
├── Navigations
├── Dropdowns
├── Images et ratios
├── Bordures
├── Positions
├── Et plus...

Autres fichiers (chargés selon la page)
└── Styles spécifiques à chaque section
```

## 🎨 Variables CSS principales

### Couleurs

```css
--color-primary: #F99285       /* Rose principal */
--color-secondary: #E59328     /* Orange secondaire */
--color-accent: #F4A82E        /* Accent */
--color-bg-light: #F3F4EF      /* Fond clair */
--color-bg-mid: #E6EDE8        /* Fond intermédiaire */
--color-text-dark: #333        /* Texte foncé */
--color-text-mid: #666         /* Texte moyen */
```

### Espacement

```css
--spacing-xs: 0.25rem
--spacing-sm: 0.5rem
--spacing-md: 1rem      /* Standard */
--spacing-lg: 1.5rem
--spacing-xl: 2rem
--spacing-2xl: 3rem
--spacing-3xl: 4rem
```
| **1-base.css** | Reset CSS et base universelle |
| **2-layout.css** | Structure générale du layout |
| **3-components.css** | Composants réutilisables (boutons, cartes, alertes, etc.) |
| **4-header.css** | En-tête et navigation principales |
| **5-footer.css** | Pied de page |
| **6-carousel.css** | Carrousel et sliders |
| **7-pages-home.css** | Page d'accueil |
| **8-pages-article.css** | Pages d'article et détail |
| **9-pages-admin.css** | Pages administrateur |
| **10-pages-auth.css** | Pages d'authentification |
| **11-pages-error.css** | Pages d'erreur (404, etc.) |
| **12-pages-other.css** | Autres pages spécifiques |

### Typographie

```css
--font-sans: Système par défaut (Segoe UI, Roboto, etc.)
--font-serif: 'Playfair Display', Georgia
--font-size-base: 1rem
--line-height-base: 1.5
```

## 📐 Système de grille

Grille 12 colonnes responsive avec 3 breakpoints :

### Colonnes

```html
<!-- Mobile (par défaut) -->
<div class="row">
  <div class="col-12">Pleine largeur</div>
</div>

<!-- Tablette (768px+) -->
<div class="row">
### Structure générale

```
1-base.css (reset et base)
2-layout.css (layout général)
3-components.css (composants)
4-header.css (header)
5-footer.css (footer)
6-carousel.css (carrousel)
7-pages-home.css (home)
8-pages-article.css (article)
9-pages-admin.css (admin)
10-pages-auth.css (auth)
11-pages-error.css (erreur)
12-pages-other.css (autres)
```

Chaque fichier est chargé selon la page ou le composant utilisé.
  <div class="col-md-6">Moitié</div>
  <div class="col-md-6">Moitié</div>
</div>

<!-- Desktop (992px+) -->
<div class="row">
  <div class="col-lg-4">1/3</div>
  <div class="col-lg-8">2/3</div>
</div>
```

### Offset

```html
<div class="col-md-6 offset-md-3">Centré avec offset</div>
```

## 🧩 Classes utilitaires réutilisables

### Flexbox

```html
<div class="d-flex justify-content-between align-items-center gap-2">
  <!-- Contenu -->
</div>
```

### Espacement

```html
<div class="mt-3 mb-4 px-2">Avec marges et padding</div>
```

### Affichage

```html
<div class="d-none">Caché</div>
<div class="d-none d-md-block">Visible seulement sur mobile</div>
```

## 🎯 Composants

### Boutons

```html
<!-- Variantes -->
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-outline-secondary">Outline</button>

<!-- Tailles -->
<button class="btn btn-sm">Petit</button>
<button class="btn btn-lg">Grand</button>

<!-- État -->
<button class="btn" disabled>Désactivé</button>
```

### Cartes

```html
<div class="card">
  <div class="card-body p-4">
    <h5 class="card-title">Titre</h5>
    <p class="card-text">Contenu</p>
  </div>
</div>
```

### Formulaires

```html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email">
    <small class="form-text text-muted">Aide</small>
  </div>
</form>
```

### Alertes

```html
<div class="alert alert-success">Succès!</div>
<div class="alert alert-danger alert-dismissible">
  Erreur
  <button type="button" class="btn-close" data-dismiss="alert"></button>
</div>
```

### Navigation

```html
<nav class="nav nav-underline">
  <a class="nav-link active" href="#">Accueil</a>
  <a class="nav-link" href="#">Articles</a>
</nav>
```

### Dropdowns

```html
<div class="dropdown">
  <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
    Menu
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Lien 1</a></li>
    <li><a class="dropdown-item" href="#">Lien 2</a></li>
  </ul>
</div>
```

### Accordéons

```html
<div class="accordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse">
        Titre
      </button>
    </h2>
    <div id="collapse" class="accordion-collapse">
      <div class="accordion-body">Contenu</div>
    </div>
  </div>
</div>
```

## 📱 Responsive

Tous les fichiers CSS incluent les media queries appropriées :

```css
@media (max-width: 576px) { }  /* Mobile */
@media (max-width: 768px) { }  /* Tablette */
@media (min-width: 992px) { }  /* Desktop */
```

## 🌙 Dark mode

Le dark mode est supporté via `@media (prefers-color-scheme: dark)` dans `general.css`.

## 🔄 Migration de Bootstrap

Si vous trouvez du code Bootstrap dans les fichiers EJS, voici les équivalences :

| Bootstrap | CSS pur |
|-----------|---------|
| `row` | `.row` |
| `col-md-6` | `.col-md-6` |
| `btn btn-primary` | `.btn .btn-primary` |
| `card` | `.card` |
| `form-control` | `.form-control` |
| `alert alert-success` | `.alert .alert-success` |
| `d-flex` | `.d-flex` |
| `justify-content-center` | `.justify-content-center` |
| `align-items-center` | `.align-items-center` |
| `gap-3` | `.gap-3` |
| `mt-4` | `.mt-4` |
| `mb-3` | `.mb-3` |
| `p-4` | `.p-4` |

## 📝 Notes importantes

1. **Ordre de chargement** : `general.css` doit être chargé en premier
2. **JavaScript** : Un fichier `dropdown.js` personnalisé gère les interactions (dropdowns, accordéons, alertes)
3. **Variables** : Modifier les variables CSS dans `:root` pour changer facilement les couleurs/espacements
4. **Performance** : Tous les fichiers CSS peuvent être minifiés pour la production
5. **Dark mode** : Fonctionne automatiquement selon les préférences système

## 🚀 Prochaines étapes

1. Vérifier tous les fichiers EJS pour les classes Bootstrap restantes
2. Les remplacer par les équivalents CSS pur
3. Tester l'affichage sur différentes résolutions
4. Optimiser et minifier les CSS pour la production

