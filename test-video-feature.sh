#!/bin/bash

# Test de la fonctionnalité vidéo

echo "🎬 Test de la fonctionnalité vidéo"
echo "===================================="

# 1. Tester si la colonne video existe dans la base de données
echo ""
echo "1️⃣  Vérification de la colonne 'video' dans la table article..."
psql -U ben -d blog -c "\d article" | grep -i video && echo "✅ Colonne vidéo existe" || echo "❌ Colonne vidéo manquante"

# 2. Tester si le formulaire new-article.ejs contient le champ vidéo
echo ""
echo "2️⃣  Vérification du champ vidéo dans new-article.ejs..."
grep -q 'id="video"' /Users/ben/Desktop/Ben/PROJET/BLOG/views/new-article.ejs && echo "✅ Champ vidéo trouvé dans le formulaire" || echo "❌ Champ vidéo manquant"

# 3. Vérifier si le template article-detail.ejs affiche la vidéo
echo ""
echo "3️⃣  Vérification de l'affichage vidéo dans article-detail.ejs..."
grep -q 'if (article.video)' /Users/ben/Desktop/Ben/PROJET/BLOG/views/article-detail.ejs && echo "✅ Gestion vidéo trouvée dans article-detail.ejs" || echo "❌ Gestion vidéo manquante"

# 4. Vérifier si le schéma de validation Joi contient le champ vidéo
echo ""
echo "4️⃣  Vérification de la validation Joi pour vidéo..."
grep -q 'video.*Joi.string()' /Users/ben/Desktop/Ben/PROJET/BLOG/validators/schemas.js && echo "✅ Validation vidéo trouvée dans schemas.js" || echo "❌ Validation vidéo manquante"

# 5. Vérifier si le model Article contient le champ vidéo
echo ""
echo "5️⃣  Vérification du champ vidéo dans Article.model.js..."
grep -q 'video:' /Users/ben/Desktop/Ben/PROJET/BLOG/models/Article.model.js && echo "✅ Champ vidéo trouvé dans le model" || echo "❌ Champ vidéo manquant du model"

# 6. Tester si le controller createArticle traite le champ vidéo
echo ""
echo "6️⃣  Vérification de la gestion vidéo dans createArticle..."
grep -q 'video: videoUrl' /Users/ben/Desktop/Ben/PROJET/BLOG/controllers/admin-article-controller.js && echo "✅ Vidéo traitée dans createArticle" || echo "❌ Vidéo non traitée"

# 7. Vérifier le controller article-controller.js
echo ""
echo "7️⃣  Vérification de la vidéo dans article-controller.js..."
grep -q 'video: article.video' /Users/ben/Desktop/Ben/PROJET/BLOG/controllers/article-controller.js && echo "✅ Vidéo passée au template" || echo "❌ Vidéo non passée au template"

echo ""
echo "===================================="
echo "✅ Tests terminés"
