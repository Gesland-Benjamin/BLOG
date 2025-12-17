# 🎯 Guide de référence rapide - Classes CSS

## 🎨 Variables CSS

```css
/* Dans general.css - :root */

--color-primary: #F99285           /* Rose principal */
--color-secondary: #E59328         /* Orange */
--color-accent: #F4A82E            /* Accent */
--color-bg-light: #F3F4EF          /* Fond clair */
--color-text-dark: #333            /* Texte foncé */
--color-text-mid: #666             /* Texte gris */

--spacing-sm: 0.5rem               /* 8px */
--spacing-md: 1rem                 /* 16px */
--spacing-lg: 1.5rem               /* 24px */
--spacing-xl: 2rem                 /* 32px */
--spacing-2xl: 3rem                /* 48px */
```

## 🏗️ Grille

```html
<!-- Grille 12 colonnes -->
<div class="row">
  <div class="col-12">Pleine largeur (mobile)</div>
  <div class="col-md-6">Moitié (tablette)</div>
  <div class="col-lg-4">1/3 (desktop)</div>
</div>

<!-- Offset (décalage) -->
<div class="col-md-6 offset-md-3">Centré avec offset</div>
```

## 🔘 Boutons

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

<!-- Pleine largeur -->
<button class="btn btn-primary w-100">100% width</button>
```

## 📦 Cartes

```html
<div class="card">
  <img src="image.jpg" class="card-img-top" alt="">
  <div class="card-body p-4">
    <h5 class="card-title">Titre</h5>
    <p class="card-text">Description</p>
    <a href="#" class="btn btn-primary">Lien</a>
  </div>
</div>
```

## 📋 Formulaires

```html
<form>
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email">
    <small class="form-text text-muted">Aide</small>
  </div>
  
  <div class="mb-3">
    <textarea class="form-control" rows="4"></textarea>
  </div>
  
  <button type="submit" class="btn btn-primary">Envoyer</button>
</form>
```

## ⚠️ Alertes

```html
<!-- Succès -->
<div class="alert alert-success">Opération réussie!</div>

<!-- Erreur -->
<div class="alert alert-danger">Une erreur s'est produite</div>

<!-- Dismissible -->
<div class="alert alert-warning alert-dismissible">
  Attention!
  <button type="button" class="btn-close" data-dismiss="alert"></button>
</div>
```

## 🧭 Navigations

```html
<!-- Navigation basique -->
<nav class="nav">
  <a class="nav-link active" href="#">Accueil</a>
  <a class="nav-link" href="#">Articles</a>
</nav>

<!-- Avec underline -->
<nav class="nav nav-underline">
  <a class="nav-link active" href="#">Accueil</a>
  <a class="nav-link" href="#">Articles</a>
</nav>
```

## 📩 Dropdowns

```html
<div class="dropdown">
  <button class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
    Menu
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Lien 1</a></li>
    <li><a class="dropdown-item" href="#">Lien 2</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#">Lien 3</a></li>
  </ul>
</div>
```

## 🎁 Accordéons

```html
<div class="accordion">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" 
              data-bs-toggle="collapse" data-bs-target="#collapse1">
        Titre 1
      </button>
    </h2>
    <div id="collapse1" class="accordion-collapse collapse">
      <div class="accordion-body">Contenu 1</div>
    </div>
  </div>
</div>
```

## 🎨 Flexbox

```html
<!-- Flex container -->
<div class="d-flex justify-content-center align-items-center gap-3">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Classes disponibles -->
d-flex                      /* display: flex */
justify-content-start       /* flex-start */
justify-content-center      /* center */
justify-content-end         /* flex-end */
justify-content-between     /* space-between */

align-items-start           /* flex-start */
align-items-center          /* center */
align-items-end             /* flex-end */

gap-1, gap-2, gap-3, gap-4  /* gaps */
```

## 📏 Espacement

```html
<!-- Margins -->
m-1, m-2, m-3, m-4          /* margin */
mt-1, mb-2, ms-3, me-4      /* margin top/bottom/start/end */
mx-auto                     /* center horizontally */

<!-- Paddings -->
p-1, p-2, p-3, p-4          /* padding */
pt-1, pb-2, px-3, py-4      /* padding top/bottom/x/y */
```

## 🎯 Utilitaires

```html
<!-- Display -->
d-none                      /* display: none */
d-block                     /* display: block */
d-flex                      /* display: flex */
d-inline-block              /* display: inline-block */

<!-- Width & Height -->
w-100                       /* width: 100% */
h-100                       /* height: 100% */
w-50, w-75                  /* 50%, 75% */

<!-- Text -->
text-center                 /* text-align: center */
text-start, text-end        /* text-align: start/end */
text-uppercase              /* text-transform: uppercase */
text-capitalize             /* text-transform: capitalize */
text-truncate               /* truncate text */

<!-- Colors -->
text-primary                /* color: primary */
text-muted                  /* color: gray */
text-danger, text-success   /* colored text */

<!-- Visibility -->
visually-hidden             /* screen reader only */

<!-- Overflow -->
overflow-hidden             /* overflow: hidden */

<!-- Border -->
border                      /* border: 1px solid */
border-0                    /* no border */
border-top, border-bottom   /* specific border */
rounded                     /* border-radius: 4px */
rounded-top                 /* border-radius top only */

<!-- Shadow -->
shadow-sm                   /* box-shadow: small */
shadow-md                   /* box-shadow: medium */

<!-- Position -->
position-fixed              /* position: fixed */
top-0, bottom-0             /* positioning */
start-0, end-0              /* left/right */
```

## 📱 Responsive

```html
<!-- Responsive images -->
<img src="image.jpg" class="w-100" alt="">

<!-- Responsive text -->
<h1 class="display-4">Desktop title</h1>

<!-- Show/hide by breakpoint -->
<div class="d-none d-md-block">Visible on tablet and up</div>
<div class="d-md-none">Visible only on mobile</div>

<!-- Responsive spacing -->
<div class="mt-3 mt-md-5">Margin top responsive</div>

<!-- Breakpoints -->
Mobile:    < 576px
Tablet:    >= 768px  (col-md-*)
Desktop:   >= 992px  (col-lg-*)
```

## 🌈 Ratios

```html
<!-- Image ratio -->
<div class="ratio ratio-16x9">
  <iframe src="..."></iframe>
</div>

<!-- Ratios disponibles -->
ratio-16x9      /* 16:9 */
ratio-4x3       /* 4:3 */
ratio-1x1       /* 1:1 square */
```

## 🔍 Recherche et remplacement rapide

Si vous cherchez une classe Bootstrap, elle est probablement disponible :

```
✅ .row → Grille
✅ .col-* → Colonnes
✅ .btn-* → Boutons
✅ .card* → Cartes
✅ .form-* → Formulaires
✅ .alert-* → Alertes
✅ .d-flex → Flexbox
✅ .m-*, .p-* → Espacement
✅ .text-* → Texte
✅ .bg-* → Fonds
✅ .border-* → Bordures
✅ .shadow-* → Ombres
✅ .rounded-* → Coins arrondis
✅ .position-* → Positionnement
```

## 💡 Conseils

1. **Responsive first** : Commencez par le design mobile
2. **Variables CSS** : Utilisez-les pour la cohérence
3. **Flexbox** : Préférez flexbox à float
4. **Classes utilitaires** : Combinez-les plutôt que d'écrire du CSS custom
5. **Dark mode** : Testé et supporté automatiquement

## 📚 Fichiers à consulter

- `public/css/README.md` - Documentation complète
- `public/css/general.css` - Variables et styles de base
- `MIGRATION-BOOTSTRAP-CSS.md` - Guide de migration
- `CSS-MIGRATION-FINAL-REPORT.md` - Rapport détaillé

---

**Status**: ✅ Prêt à utiliser
**Dernière mise à jour**: 8 décembre 2025
