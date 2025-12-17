# Guide de migration - Bootstrap → CSS pur

## ✅ Tâches complétées

- ✅ Création de 7 fichiers CSS (general.css, header.css, footer.css, index.css, article-detail.css, auth.css, admin.css)
- ✅ Suppression des références à Bootstrap dans head.ejs
- ✅ Suppression du script Bootstrap dans scripts.ejs
- ✅ Création d'un script dropdown.js personnalisé
- ✅ Variables CSS pour tous les styles

## 📋 À faire

### 1. Vérifier et remplacer les classes Bootstrap dans les fichiers EJS

Rechercher les classes Bootstrap restantes dans tous les fichiers `.ejs` :

```bash
grep -r "class=\"[^\"]*\(row\|col-\|btn-\|card\|form-control\|alert\|d-\|mb-\|mt-\|p-\|justify-\|align-\|gap-\).*\"" views/
```

### 2. Classes Bootstrap à remplacer

#### Grille
- `row` → ✅ Déjà supporté
- `col-*` / `col-md-*` / `col-lg-*` → ✅ Déjà supporté
- `offset-*` → ✅ Déjà supporté

#### Boutons
- `btn` → ✅ Déjà supporté
- `btn-primary` → ✅ Déjà supporté
- `btn-secondary` → ✅ Déjà supporté
- `btn-danger` → ✅ Déjà supporté
- `btn-warning` → ✅ Déjà supporté
- `btn-outline-*` → ✅ Déjà supporté
- `btn-sm` / `btn-lg` → ✅ Déjà supporté

#### Flexbox
- `d-flex` → ✅ Déjà supporté
- `d-none` → ✅ Déjà supporté
- `justify-content-*` → ✅ Déjà supporté
- `align-items-*` → ✅ Déjà supporté
- `gap-*` → ✅ Déjà supporté

#### Espacement
- `m-*` / `mt-*` / `mb-*` / `ms-*` / `me-*` / `my-*` → ✅ Déjà supporté
- `p-*` / `pt-*` / `pb-*` / `px-*` / `py-*` → ✅ Déjà supporté

#### Cartes
- `card` → ✅ Déjà supporté
- `card-body` → ✅ Déjà supporté
- `card-title` → ✅ Déjà supporté
- `card-text` → ✅ Déjà supporté
- `card-img-top` → ✅ Déjà supporté

#### Formulaires
- `form-label` → ✅ Déjà supporté
- `form-control` → ✅ Déjà supporté
- `form-text` → ✅ Déjà supporté
- `is-invalid` → ✅ Déjà supporté

#### Alertes
- `alert` → ✅ Déjà supporté
- `alert-success` / `alert-danger` / `alert-warning` / `alert-info` → ✅ Déjà supporté
- `alert-dismissible` → ✅ Déjà supporté
- `btn-close` → ✅ Déjà supporté

#### Navigations
- `nav` → ✅ Déjà supporté
- `nav-link` → ✅ Déjà supporté
- `nav-underline` → ✅ Déjà supporté

#### Dropdowns
- `dropdown` → ✅ Déjà supporté
- `dropdown-toggle` → ✅ Déjà supporté
- `dropdown-menu` → ✅ Déjà supporté
- `dropdown-item` → ✅ Déjà supporté
- `dropdown-divider` → ✅ Déjà supporté

#### Accordéons
- `accordion` → ✅ Déjà supporté
- `accordion-item` → ✅ Déjà supporté
- `accordion-header` → ✅ Déjà supporté
- `accordion-button` → ✅ Déjà supporté
- `accordion-collapse` → ✅ Déjà supporté
- `accordion-body` → ✅ Déjà supporté

#### Autres
- `border` / `border-0` / `border-bottom` → ✅ Déjà supporté
- `shadow-sm` / `shadow-md` → ✅ Déjà supporté
- `rounded` / `rounded-top` → ✅ Déjà supporté
- `text-center` / `text-start` / `text-end` → ✅ Déjà supporté
- `text-muted` → ✅ Déjà supporté
- `w-100` → ✅ Déjà supporté
- `h-250` → ✅ Déjà supporté
- `overflow-hidden` → ✅ Déjà supporté
- `position-fixed` / `bottom-0` / `end-0` → ✅ Déjà supporté

### 3. Éléments spécifiques à vérifier

#### data-bs-theme
- Supprimer `data-bs-theme="auto"` du `<html>` (ou le garder, Bootstrap l'utilisait juste pour le JS)

#### data-bs-toggle
- Garder `data-bs-toggle="dropdown"` → Géré par `dropdown.js`
- Garder `data-bs-toggle="collapse"` → Géré par `dropdown.js`

#### ratio ratio-16x9
- ✅ Déjà supporté dans general.css

#### object-fit-cover
- ✅ Déjà supporté dans general.css

### 4. Classes Bootstrap spécifiques à remplacer

```html
<!-- À REMPLACER -->
<div class="bd-placeholder-img">              → <img class="object-fit-cover">
<div class="bd-mode-toggle">                   → ✅ Déjà un composant
<div class="b-example-divider">                → À remplacer par <hr>
<div class="nav-scroller">                     → ✅ Configuré dans header.css

<!-- À IGNORER/GARDER -->
<svg class="bi">                               → ✅ Géré (bootstrap icons)
data-bs-theme                                 → Peut rester
```

### 5. Fichiers spécifiques à vérifier

```
views/
├── index.ejs                  → Verify featured article styling
├── article-detail.ejs         → Verify comments section
├── article.ejs                → Verify articles list
├── articles-by-category.ejs   → Verify category cards
├── auth.ejs                   → ✅ Should work (auth.css)
├── register.ejs               → ✅ Should work (auth.css)
├── forgot-password.ejs        → ✅ Should work (auth.css)
├── reset-password.ejs         → ✅ Should work (auth.css)
├── admin-dashboard.ejs        → ✅ Should work (admin.css)
├── admin-article.ejs          → ✅ Should work (admin.css)
├── admin-categories.ejs       → ✅ Should work (admin.css)
├── admin-commentaires.ejs     → ✅ Should work (admin.css)
├── admin-medias.ejs           → ✅ Should work (admin.css)
├── admin-newsletter.ejs       → ✅ Should work (admin.css)
├── newsletter.ejs             → À vérifier
├── search-articles.ejs        → À vérifier
└── partials/
    ├── head.ejs               → ✅ Mis à jour
    ├── header.ejs             → À vérifier (header.css)
    ├── navbar.ejs             → À vérifier (header.css)
    ├── footer.ejs             → À vérifier (footer.css)
    └── scripts.ejs            → ✅ Mis à jour
```

### 6. Tester les éléments critiques

- [ ] Navigation (navbar avec dropdowns)
- [ ] Page d'accueil (grille d'articles)
- [ ] Détail article avec commentaires
- [ ] Formulaires (login, register, commentaires)
- [ ] Pages admin (tableaux, formulaires)
- [ ] Responsivité sur mobile
- [ ] Dark mode
- [ ] Modales/Accordéons

### 7. Supprimer les fichiers Bootstrap (optionnel)

Une fois tout testé, vous pouvez supprimer :
```bash
rm public/css/bootstrap.min.css
rm public/css/bootstrap.min.css.map
rm public/jss/bootstrap.bundle.min.js
rm public/jss/bootstrap.bundle.min.js.map
```

## 🎯 Prochaines étapes rapides

1. Lancez votre serveur : `npm start`
2. Visitez http://localhost:3000
3. Ouvrez la console (F12) pour vérifier les erreurs
4. Vérifiez que tout s'affiche correctement
5. Si vous voyez des problèmes d'affichage, consultez le fichier EJS concerné et ajustez les classes CSS
6. Une fois satisfait, faites un commit git

## 💡 Conseils pour la migration

- Les classes CSS pur utilisent le même système d'homonymes que Bootstrap
- Si un style ne fonctionne pas, vérifiez d'abord que la classe est utilisée
- Les fichiers CSS sont organisés de façon logique et faciles à modifier
- Vous pouvez ajouter du CSS spécifique directement dans les fichiers selon la page
- Pour changer les couleurs globales, modifiez simplement les variables dans `general.css`

