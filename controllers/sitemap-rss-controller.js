import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";

/**
 * Génère un sitemap.xml conforme aux standards
 * Inclut les pages statiques et tous les articles
 */
export async function generateSitemap(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    
    // Récupérer tous les articles
    const articles = await Article.findAll({
      attributes: ['id', 'titre', 'date_publication'],
      order: [['date_publication', 'DESC']]
    });

    // Récupérer toutes les catégories
    const categories = await Categorie.findAll({
      attributes: ['id', 'nom'],
      order: [['nom', 'ASC']]
    });

    // Construire le XML du sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    // Page d'accueil
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';

    // Page des articles
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/article</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';

    // Pages de catégories
    for (const categorie of categories) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/article/categorie/${encodeURIComponent(categorie.nom)}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Pages des articles avec image et date
    for (const article of articles) {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/article/${article.id}</loc>\n`;
      
      // Ajouter la date de modification
      const lastmod = article.date_publication.toISOString().split('T')[0];
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      
      // Les articles récents ont une priorité plus élevée
      const daysOld = Math.floor((Date.now() - article.date_publication.getTime()) / (1000 * 60 * 60 * 24));
      const priority = daysOld < 7 ? 0.9 : daysOld < 30 ? 0.8 : 0.7;
      xml += `    <priority>${priority}</priority>\n`;
      
      // Les articles récents changent plus souvent
      const changefreq = daysOld < 7 ? 'daily' : 'weekly';
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    // Retourner le XML avec le bon content-type
    res.type('application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Erreur lors de la génération du sitemap:', error);
    res.status(500).send('Erreur lors de la génération du sitemap');
  }
}

/**
 * Génère un flux RSS 2.0 des articles récents
 */
export async function generateRssFeed(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    const limit = parseInt(req.query.limit || '20', 10);
    
    // Récupérer les articles récents
    const articles = await Article.findAll({
      attributes: ['id', 'titre', 'contenu', 'date_publication', 'image'],
      order: [['date_publication', 'DESC']],
      limit: Math.min(limit, 100) // Max 100 articles
    });

    // Déterminer la date de mise à jour la plus récente
    const lastBuild = articles.length > 0 
      ? articles[0].date_publication.toUTCString()
      : new Date().toUTCString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n';
    xml += '  <channel>\n';
    xml += '    <title>Blog - Derniers articles</title>\n';
    xml += `    <link>${baseUrl}</link>\n`;
    xml += '    <description>Découvrez nos articles sur la beauté, la nutrition et le développement personnel</description>\n';
    xml += `    <language>fr</language>\n`;
    xml += `    <lastBuildDate>${lastBuild}</lastBuildDate>\n`;
    xml += `    <ttl>60</ttl>\n`;

    // Ajouter les articles
    for (const article of articles) {
      xml += '    <item>\n';
      xml += `      <title>${escapeXml(article.titre)}</title>\n`;
      xml += `      <link>${baseUrl}/article/${article.id}</link>\n`;
      xml += `      <guid isPermaLink="true">${baseUrl}/article/${article.id}</guid>\n`;
      xml += `      <pubDate>${article.date_publication.toUTCString()}</pubDate>\n`;
      
      // Contenu avec HTML
      const description = article.contenu
        .substring(0, 500)
        .replace(/<[^>]*>/g, '') // Enlever les tags HTML
        .trim();
      
      xml += `      <description>${escapeXml(description)}...</description>\n`;
      
      // Contenu complet en CDATA
      xml += `      <content:encoded><![CDATA[\n`;
      
      if (article.image) {
        xml += `        <p><img src="${article.image}" alt="${escapeXml(article.titre)}" /></p>\n`;
      }
      
      xml += `        ${article.contenu}\n`;
      xml += `      ]]></content:encoded>\n`;
      
      xml += '    </item>\n';
    }

    xml += '  </channel>\n';
    xml += '</rss>';

    res.type('application/rss+xml; charset=utf-8');
    res.send(xml);

  } catch (error) {
    console.error('Erreur lors de la génération du RSS:', error);
    res.status(500).send('Erreur lors de la génération du flux RSS');
  }
}

/**
 * Génère un flux Atom des articles récents
 */
export async function generateAtomFeed(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    const limit = parseInt(req.query.limit || '20', 10);
    
    // Récupérer les articles récents
    const articles = await Article.findAll({
      attributes: ['id', 'titre', 'contenu', 'date_publication', 'image'],
      order: [['date_publication', 'DESC']],
      limit: Math.min(limit, 100)
    });

    const lastBuild = articles.length > 0 
      ? articles[0].date_publication.toISOString()
      : new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    xml += `  <title>Blog - Derniers articles</title>\n`;
    xml += `  <link href="${baseUrl}" rel="alternate"/>\n`;
    xml += `  <link href="${baseUrl}/feed.atom" rel="self"/>\n`;
    xml += `  <id>${baseUrl}</id>\n`;
    xml += `  <updated>${lastBuild}</updated>\n`;
    xml += `  <author>\n`;
    xml += `    <name>Blog</name>\n`;
    xml += `  </author>\n`;

    // Ajouter les articles
    for (const article of articles) {
      xml += '  <entry>\n';
      xml += `    <title>${escapeXml(article.titre)}</title>\n`;
      xml += `    <link href="${baseUrl}/article/${article.id}" rel="alternate"/>\n`;
      xml += `    <id>${baseUrl}/article/${article.id}</id>\n`;
      xml += `    <updated>${article.date_publication.toISOString()}</updated>\n`;
      xml += `    <published>${article.date_publication.toISOString()}</published>\n`;
      
      const description = article.contenu
        .substring(0, 500)
        .replace(/<[^>]*>/g, '')
        .trim();
      
      xml += `    <summary>${escapeXml(description)}...</summary>\n`;
      
      xml += `    <content type="html"><![CDATA[\n`;
      
      if (article.image) {
        xml += `      <p><img src="${article.image}" alt="${escapeXml(article.titre)}" /></p>\n`;
      }
      
      xml += `      ${article.contenu}\n`;
      xml += `    ]]></content>\n`;
      
      xml += '  </entry>\n';
    }

    xml += '</feed>';

    res.type('application/atom+xml; charset=utf-8');
    res.send(xml);

  } catch (error) {
    console.error('Erreur lors de la génération du flux Atom:', error);
    res.status(500).send('Erreur lors de la génération du flux Atom');
  }
}

/**
 * Échappe les caractères spéciaux XML
 */
function escapeXml(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
