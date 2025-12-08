#!/bin/bash

# Test de création d'article avec vidéo via requête HTTP

echo "🎬 Test de création d'article avec vidéo"
echo "=========================================="

# 1. Créer un utilisateur admin si nécessaire
echo ""
echo "1️⃣  Tentative de connexion admin..."

SESSION_COOKIE=$(curl -s -i -X POST http://localhost:3000/connexion \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@miamor.com&password=Admin123!" 2>&1 | grep -i "set-cookie" | head -1 | cut -d' ' -f2 | cut -d';' -f1)

if [ -z "$SESSION_COOKIE" ]; then
  echo "❌ Erreur de connexion admin"
  exit 1
fi

echo "✅ Connexion admin réussie"
echo "Session: $SESSION_COOKIE"

# 2. Récupérer le formulaire pour obtenir la page et les données
echo ""
echo "2️⃣  Récupération de la page de création d'article..."

FORM_PAGE=$(curl -s -X GET http://localhost:3000/admin/articles/new \
  -H "Cookie: $SESSION_COOKIE")

if echo "$FORM_PAGE" | grep -q "Nouvel article"; then
  echo "✅ Page de création d'article accessible"
else
  echo "❌ Erreur d'accès à la page de création"
  exit 1
fi

# 3. Tester avec une vidéo YouTube
echo ""
echo "3️⃣  Création d'article avec vidéo YouTube..."

RESPONSE=$(curl -s -i -X POST http://localhost:3000/admin/articles \
  -H "Cookie: $SESSION_COOKIE" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "titre=Test Article Vidéo&contenu=Ceci est un article de test avec une vidéo YouTube.&categorie_id=1&image_alt=Test vidéo&video=https://www.youtube.com/embed/dQw4w9WgXcQ" \
  2>&1)

if echo "$RESPONSE" | grep -q "302\|301"; then
  echo "✅ Article créé avec succès (redirection HTTP 302)"
else
  echo "⚠️  Vérifier la réponse du serveur"
  echo "$RESPONSE" | head -20
fi

echo ""
echo "=========================================="
echo "✅ Test de création terminé"
echo ""
echo "Vous pouvez maintenant vérifier:"
echo "1. La base de données pour voir l'article avec la vidéo"
echo "2. Accéder à http://localhost:3000/article pour voir l'article"
