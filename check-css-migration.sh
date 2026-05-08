#!/bin/bash

# 📋 Script de vérification de la migration Bootstrap → CSS pur
# Ce script vérifie que tous les fichiers CSS sont correctement intégrés

echo "🔍 Vérification de la migration Bootstrap → CSS pur"
echo "=================================================="
echo ""

# Coleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier un fichier
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 (MANQUANT)"
    return 1
  fi
}

# Fonction pour vérifier une ligne dans un fichier
check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contient '$2'"
    return 0
  else
    echo -e "${RED}✗${NC} $1 ne contient pas '$2'"
    return 1
  fi
}

echo "📁 Vérification des fichiers CSS..."
echo ""

FILES=(
  "public/css/general.css"
  "public/css/animations.css"
  "public/css/header.css"
  "public/css/footer.css"
  "public/css/index.css"
  "public/css/article-detail.css"
  "public/css/auth.css"
  "public/css/admin.css"
  "public/css/pages.css"
  "public/css/README.md"
)

for file in "${FILES[@]}"; do
  check_file "$file"
done

echo ""
echo "📄 Vérification des fichiers JavaScript..."
echo ""

FILES=(
  "public/js/dropdown.js"
)

for file in "${FILES[@]}"; do
  check_file "$file"
done

echo ""
echo "🔗 Vérification des références dans head.ejs..."
echo ""

HEAD_FILE="views/partials/head.ejs"

check_content "$HEAD_FILE" "general.css"
check_content "$HEAD_FILE" "animations.css"
check_content "$HEAD_FILE" "header.css"
check_content "$HEAD_FILE" "footer.css"
check_content "$HEAD_FILE" "index.css"
check_content "$HEAD_FILE" "article-detail.css"
check_content "$HEAD_FILE" "auth.css"
check_content "$HEAD_FILE" "admin.css"
check_content "$HEAD_FILE" "pages.css"

echo ""
echo "🔗 Vérification de l'absence de Bootstrap..."
echo ""

if ! grep -q "bootstrap" "$HEAD_FILE"; then
  echo -e "${GREEN}✓${NC} Bootstrap supprimé de head.ejs"
else
  echo -e "${YELLOW}⚠${NC} Bootstrap encore présent dans head.ejs"
fi

echo ""
echo "📝 Vérification des fichiers de documentation..."
echo ""

check_file "MIGRATION-BOOTSTRAP-CSS.md"
check_file "CSS-MIGRATION-SUMMARY.md"

echo ""
echo "=================================================="
echo "✨ Vérification terminée!"
echo ""
echo "📊 Statistiques CSS:"
echo ""

CSS_FILES=(
  "public/css/general.css"
  "public/css/animations.css"
  "public/css/header.css"
  "public/css/footer.css"
  "public/css/index.css"
  "public/css/article-detail.css"
  "public/css/auth.css"
  "public/css/admin.css"
  "public/css/pages.css"
)

TOTAL_LINES=0
for file in "${CSS_FILES[@]}"; do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    TOTAL_LINES=$((TOTAL_LINES + LINES))
    printf "  %-30s %5d lignes\n" "$(basename $file)" "$LINES"
  fi
done

echo ""
echo -e "  ${GREEN}TOTAL${NC}                    ${GREEN}$TOTAL_LINES lignes${NC}"
echo ""

echo "🚀 Prochaines étapes:"
echo ""
echo "1. Démarrer le serveur: npm start"
echo "2. Visiter: http://localhost:3000"
echo "3. Vérifier l'affichage des pages"
echo "4. Tester la responsivité sur mobile"
echo "5. Vérifier les dropdowns et accordéons"
echo "6. Consulter MIGRATION-BOOTSTRAP-CSS.md pour plus de détails"
echo ""
