# ✅ CHECKLIST - NETTOYAGE HTML BOOTSTRAP

## Vue d'ensemble
24 fichiers EJS à nettoyer, suppression de 88 classes Bootstrap inline

---

## 📋 PAGES À NETTOYER

### 🏠 Accueil & Articles (6 fichiers)
- [ ] **views/index.ejs** (15+ classes) - CSS: 7-pages-home.css
- [ ] **views/article.ejs** (10+ classes) - CSS: 8-pages-article.css
- [ ] **views/article-detail.ejs** (18+ classes) - CSS: 8-pages-article.css
- [ ] **views/articles-by-category.ejs** (8+ classes) - CSS: 8-pages-article.css
- [ ] **views/articles-by-month.ejs** (8+ classes) - CSS: 8-pages-article.css
- [ ] **views/search-articles.ejs** (7+ classes) - CSS: 12-pages-other.css

### 🔐 Authentification (4 fichiers)
- [ ] **views/auth.ejs** (5+ classes) - CSS: 10-pages-auth.css
- [ ] **views/register.ejs** (5+ classes) - CSS: 10-pages-auth.css
- [ ] **views/forgot-password.ejs** (3+ classes) - CSS: 10-pages-auth.css
- [ ] **views/reset-password.ejs** (3+ classes) - CSS: 10-pages-auth.css

### 👨‍💼 Administration (8 fichiers)
- [ ] **views/admin-dashboard.ejs** (20+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-categories.ejs** (8+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-category-form.ejs** (5+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-article.ejs** (8+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-article-form.ejs** (5+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-commentaires.ejs** (7+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-medias.ejs** (6+ classes) - CSS: 9-pages-admin.css
- [ ] **views/admin-newsletter.ejs** (6+ classes) - CSS: 9-pages-admin.css

### ❌ Erreurs (3 fichiers)
- [ ] **views/403.ejs** (3+ classes) - CSS: 11-pages-error.css
- [ ] **views/404.ejs** (3+ classes) - CSS: 11-pages-error.css
- [ ] **views/500.ejs** (3+ classes) - CSS: 11-pages-error.css

### 📬 Autres (5 fichiers)
- [ ] **views/newsletter.ejs** (7+ classes) - CSS: 12-pages-other.css
- [ ] **views/newsletter-confirm.ejs** (2+ classes) - CSS: 12-pages-other.css
- [ ] **views/newsletter-unsubscribe.ejs** (2+ classes) - CSS: 12-pages-other.css
- [ ] **views/renseignements.ejs** (10+ classes) - CSS: 12-pages-other.css
- [ ] **views/mentions-legales.ejs** (4+ classes) - CSS: 12-pages-other.css

### 🎨 Partials (2 fichiers)
- [ ] **views/partials/carousel.ejs** (8+ classes) - CSS: 6-carousel.css
- [ ] **views/partials/header.ejs** (Déjà nettoyé?) - CSS: 4-header.css

---

## 🔍 CLASSES BOOTSTRAP À SUPPRIMER

### Layout
```
row, g-0, g-1, g-2, g-3, g-4, g-5
col-*, col-sm-*, col-md-*, col-lg-*, col-xl-*
container, container-fluid
```

### Display
```
d-flex, d-none, d-inline, d-block, d-inline-block
```

### Flexbox
```
flex-column, flex-row, flex-wrap
justify-content-start, justify-content-end, justify-content-center
justify-content-between, justify-content-around
align-items-start, align-items-end, align-items-center, align-items-stretch
gap-1, gap-2, gap-3, gap-4, gap-5
```

### Spacing (Padding)
```
p-0, p-1, p-2, p-3, p-4, p-5
pt-*, pb-*, pl-*, pr-*, ps-*, pe-*, px-*, py-*
```

### Spacing (Margin)
```
m-0, m-1, m-2, m-3, m-4, m-5
mt-*, mb-*, ml-*, mr-*, ms-*, me-*, mx-*, my-*
```

### Background/Border
```
bg-*, bg-body-secondary, bg-light, bg-dark
border, border-0, rounded, rounded-*
```

### Text
```
text-*, text-center, text-start, text-end
fw-*, fst-italic, fst-normal
```

### Sizing
```
w-25, w-50, w-75, w-100
h-25, h-50, h-75, h-100
ratio, ratio-*
```

---

## 🔄 PATTERNS DE REMPLACEMENT

### Pattern 1: Row + Colonnes
```html
<!-- ❌ Avant -->
<div class="row g-5">
  <div class="col-lg-8">Content</div>
  <div class="col-lg-4">Sidebar</div>
</div>

<!-- ✅ Après -->
<div class="content-wrapper">
  <div class="main-content">Content</div>
  <div class="sidebar">Sidebar</div>
</div>

/* CSS */
.content-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}
@media (max-width: 992px) {
  .content-wrapper { grid-template-columns: 1fr; }
}
```

### Pattern 2: Flexbox Centering
```html
<!-- ❌ Avant -->
<div class="d-flex justify-content-center align-items-center">
  Content
</div>

<!-- ✅ Après -->
<div class="flex-center">
  Content
</div>

/* CSS */
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### Pattern 3: Spacing
```html
<!-- ❌ Avant -->
<div class="p-4 mb-3">Content</div>

<!-- ✅ Après -->
<div class="card-content">Content</div>

/* CSS */
.card-content {
  padding: 1.5rem;
  margin-bottom: 1rem;
}
```

---

## ✅ VALIDATION PAR FICHIER

### Après chaque fichier nettoyé:

#### 1. Vérification Code
- [ ] Aucune classe Bootstrap restante
- [ ] Seulement classes sémantiques
- [ ] CSS défini dans fichier approprié

#### 2. Test Navigateur Desktop
- [ ] Layout correct
- [ ] Spacing cohérent
- [ ] Couleurs visibles
- [ ] Animations fonctionnent

#### 3. Test Responsive
- [ ] Mobile (< 576px) ✓
- [ ] Tablet (768px) ✓
- [ ] Desktop (> 992px) ✓

#### 4. Console Navigateur
- [ ] Pas d'erreurs CSS
- [ ] Pas de warnings

---

## 🎯 ORDRE RECOMMANDÉ

### Phase 1: Pages Simples (1-2h)
1. [ ] 403.ejs
2. [ ] 404.ejs
3. [ ] 500.ejs
4. [ ] newsletter-confirm.ejs
5. [ ] newsletter-unsubscribe.ejs
6. [ ] mentions-legales.ejs

### Phase 2: Pages Moyennes (1-2h)
7. [ ] auth.ejs
8. [ ] register.ejs
9. [ ] forgot-password.ejs
10. [ ] reset-password.ejs
11. [ ] newsletter.ejs
12. [ ] search-articles.ejs
13. [ ] articles-by-category.ejs
14. [ ] articles-by-month.ejs

### Phase 3: Pages Complexes (2h)
15. [ ] renseignements.ejs
16. [ ] article.ejs
17. [ ] admin-categories.ejs
18. [ ] admin-category-form.ejs
19. [ ] admin-article-form.ejs
20. [ ] admin-commentaires.ejs
21. [ ] admin-medias.ejs
22. [ ] admin-newsletter.ejs
23. [ ] article-detail.ejs
24. [ ] admin-dashboard.ejs
25. [ ] index.ejs

### Phase 4: Partials
26. [ ] carousel.ejs

---

## 📊 PROGRESSION

### Status Global
- [ ] 0/24 fichiers nettoyés (0%)
- [ ] Tests responsive complets
- [ ] Validation W3C
- [ ] Documentation mise à jour

### Temps Estimé
- Phase 1: 1-2h (pages simples)
- Phase 2: 1-2h (pages moyennes)
- Phase 3: 2h (pages complexes)
- **Total: 4-6 heures**

---

## 🔧 OUTILS UTILES

### Rechercher classes Bootstrap
```bash
# Dans un fichier spécifique
grep -o 'class="[^"]*"' views/index.ejs

# Compter les classes
grep -o 'row\|col-\|d-flex\|p-[0-9]\|m-[0-9]' views/index.ejs | wc -l
```

### Vérifier fichier CSS correspond
```bash
# Ex: pour index.ejs
cat public/css/7-pages-home.css
```

### Tester le site
```bash
npm start
# Puis ouvrir http://localhost:3000
```

---

## 📚 RÉFÉRENCES

- **Guide détaillé**: `CLEANUP-BOOTSTRAP-HTML.md`
- **Rapport complet**: `MIGRATION-COMPLETE.md`
- **Exemples CSS**: Fichiers `public/css/7-pages-*.css`

---

## 🎉 UNE FOIS COMPLÉTÉ

- [ ] 24 fichiers EJS nettoyés
- [ ] Zéro classe Bootstrap
- [ ] Tous les tests passants
- [ ] Site 100% responsive
- [ ] Documentation à jour

**🎊 Blog entièrement sans Bootstrap inline!**

---

**Dernière mise à jour**: 28 décembre 2024
