import Article from "../models/Article.model.js";
import Categorie from "../models/Categorie.model.js";

/**
 * Génère un sitemap.xml conforme aux standards SEO
 */
export async function generateSitemap(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || "http://localhost:3000";

    const articles = await Article.findAll({
      attributes: ["id", "title", "createdAt"],
      order: [["createdAt", "DESC"]]
    });

    const categories = await Categorie.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]]
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
    xml += '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    // Home
    xml += "  <url>\n";
    xml += `    <loc>${baseUrl}</loc>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>1.0</priority>\n";
    xml += "  </url>\n";

    // Articles list
    xml += "  <url>\n";
    xml += `    <loc>${baseUrl}/article</loc>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.9</priority>\n";
    xml += "  </url>\n";

    // Categories
    for (const cat of categories) {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/article/categorie/${encodeURIComponent(cat.name)}</loc>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    }

    // Articles
    for (const article of articles) {
      const date = article.createdAt
        ? new Date(article.createdAt)
        : new Date();

      const lastmod = date.toISOString().split("T")[0];

      const daysOld = Math.floor(
        (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
      );

      const priority =
        daysOld < 7 ? 0.9 : daysOld < 30 ? 0.8 : 0.7;

      const changefreq = daysOld < 7 ? "daily" : "weekly";

      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/article/${article.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <priority>${priority}</priority>\n`;
      xml += `    <changefreq>${changefreq}</changefreq>\n`;
      xml += "  </url>\n";
    }

    xml += "</urlset>";

    res.type("application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.status(500).send("Erreur sitemap");
  }
}

/**
 * RSS Feed
 */
export async function generateRssFeed(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || "http://localhost:3000";
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

    const articles = await Article.findAll({
      attributes: ["id", "title", "content", "createdAt", "image"],
      order: [["createdAt", "DESC"]],
      limit
    });

    const lastBuild =
      articles.length > 0
        ? new Date(articles[0].createdAt).toUTCString()
        : new Date().toUTCString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0">\n';
    xml += "  <channel>\n";
    xml += "    <title>Blog - Derniers articles</title>\n";
    xml += `    <link>${baseUrl}</link>\n`;
    xml += "    <description>Derniers articles du blog</description>\n";
    xml += `    <lastBuildDate>${lastBuild}</lastBuildDate>\n`;

    for (const article of articles) {
      const date = new Date(article.createdAt);

      const desc = (article.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 500);

      xml += "    <item>\n";
      xml += `      <title>${escapeXml(article.title)}</title>\n`;
      xml += `      <link>${baseUrl}/article/${article.id}</link>\n`;
      xml += `      <guid>${baseUrl}/article/${article.id}</guid>\n`;
      xml += `      <pubDate>${date.toUTCString()}</pubDate>\n`;
      xml += `      <description>${escapeXml(desc)}</description>\n`;
      xml += "    </item>\n";
    }

    xml += "  </channel>\n";
    xml += "</rss>";

    res.type("application/rss+xml");
    res.send(xml);
  } catch (error) {
    console.error("RSS error:", error);
    res.status(500).send("Erreur RSS");
  }
}

/**
 * Atom Feed
 */
export async function generateAtomFeed(req, res) {
  try {
    const baseUrl = process.env.SITE_URL || "http://localhost:3000";
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

    const articles = await Article.findAll({
      attributes: ["id", "title", "content", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit
    });

    const lastUpdate =
      articles.length > 0
        ? new Date(articles[0].createdAt).toISOString()
        : new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    xml += `  <title>Blog</title>\n`;
    xml += `  <link href="${baseUrl}" />\n`;
    xml += `  <updated>${lastUpdate}</updated>\n`;
    xml += `  <id>${baseUrl}</id>\n`;

    for (const article of articles) {
      const date = new Date(article.createdAt);

      const desc = (article.content || "")
        .replace(/<[^>]*>/g, "")
        .substring(0, 500);

      xml += "  <entry>\n";
      xml += `    <title>${escapeXml(article.title)}</title>\n`;
      xml += `    <link href="${baseUrl}/article/${article.id}" />\n`;
      xml += `    <id>${baseUrl}/article/${article.id}</id>\n`;
      xml += `    <updated>${date.toISOString()}</updated>\n`;
      xml += `    <summary>${escapeXml(desc)}</summary>\n`;
      xml += "  </entry>\n";
    }

    xml += "</feed>";

    res.type("application/atom+xml");
    res.send(xml);
  } catch (error) {
    console.error("Atom error:", error);
    res.status(500).send("Erreur Atom");
  }
}

/**
 * Escape XML safe
 */
function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}