# Move to .trash/
#!/bin/bash

echo "=== Test des routes publiques ==="
echo ""

echo "1. Page d'accueil (/):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/

echo "2. Page articles (/article):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/article

echo "3. Page newsletter (/newsletter):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/newsletter

echo "4. Page de recherche (/search):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/search

echo "5. Page d'authentification (/auth):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/auth

echo "6. Page register (/register):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/register

echo "7. Article 36 (/article/36):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/article/36

echo "8. Catégorie Beauté (/article/categorie/Beauté):"
curl -s -o /dev/null -w "Status: %{http_code}\n" "http://localhost:3000/article/categorie/Beauté"

echo "9. Sitemap (/sitemap.xml):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/sitemap.xml

echo "10. RSS Feed (/rss.xml):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/rss.xml

echo ""
echo "=== Test des routes admin (sans auth - devrait rediriger 302) ==="
echo ""

echo "11. Admin Dashboard (/admin/dashboard):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/admin/dashboard

echo "12. Admin Articles (/admin/articles/new):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/admin/articles/new

echo "13. Admin Categories (/admin/categories):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/admin/categories

echo "14. Admin Medias (/admin/medias): route supprimée"

echo "15. Admin Commentaires (/admin/commentaires):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/admin/commentaires

echo "16. Admin Newsletter (/admin/newsletter):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/admin/newsletter

echo ""
echo "✅ Tests terminés"
