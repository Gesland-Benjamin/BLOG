// Read-only public HTTP audit. Does not import the app, load .env or connect to a database.
// Usage: node scripts/audit-public-seo.js https://emi-pulse.fr
const origin = new URL(process.argv[2] || '').origin;
if (!origin.startsWith('https://')) throw new Error('An explicit HTTPS origin is required.');
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1]));
async function read(url, method = 'GET') {
  let current = new URL(url, origin);
  for (let count = 0; count < 5; count++) {
    if (current.origin !== origin) throw new Error(`Cross-origin URL refused: ${current.origin}`);
    const response = await fetch(current, { method, redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'EmiPulse-Public-SEO-Audit/1.0' } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect without Location');
      current = new URL(location, current); continue;
    }
    return { status: response.status, url: current.href, text: method === 'HEAD' ? '' : await response.text() };
  }
  throw new Error('Too many redirects');
}
const robots = await read('/robots.txt');
const root = await read('/sitemap.xml');
if (root.status !== 200) throw new Error(`Sitemap: HTTP ${root.status}`);
let urls = locs(root.text);
if (root.text.includes('<sitemapindex')) {
  const chunks = [];
  for (const url of urls.slice(0, 10)) chunks.push(...locs((await read(url)).text));
  urls = chunks;
}
const report = { origin, checkedAt: new Date().toISOString(), sitemapDeclaresItself: robots.text.includes(`${origin}/sitemap.xml`), sitemapUrlCount: urls.length, truncated: urls.length > 200, pages: [], brokenLinks: [], brokenImages: [] };
const links = new Set(), images = new Set();
for (const url of urls.slice(0, 200)) {
  const page = await read(url);
  const canonical = /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(page.text)?.[1];
  const title = /<title>([^<]*)<\/title>/i.exec(page.text)?.[1];
  const description = /<meta\b[^>]*name="description"[^>]*content="([^"]*)"/i.exec(page.text)?.[1];
  const h1Count = (page.text.match(/<h1\b/gi) || []).length;
  const schemas = [...page.text.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => { try { return JSON.parse(m[1])['@type']; } catch { return 'INVALID'; } });
  report.pages.push({ url, finalUrl: page.url, status: page.status, title, description, canonical, h1Count, schemas });
  for (const match of page.text.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
    const target = new URL(decode(match[1]), page.url); target.hash = '';
    if (target.origin === origin && /^\/(?:article(?:\/|$)|archive\/)/.test(target.pathname)) links.add(target.href);
  }
  for (const match of page.text.matchAll(/<img\b[^>]*src="([^"]+)"/gi)) {
    const target = new URL(decode(match[1]), page.url);
    if (target.origin === origin) images.add(target.href);
  }
}
const checked = new Set(report.pages.map(page => page.url));
for (const url of [...links].filter(url => !checked.has(url)).slice(0, 150)) {
  const result = await read(url); if (result.status >= 400) report.brokenLinks.push({ url, status: result.status });
}
for (const url of [...images].slice(0, 150)) {
  const result = await read(url, 'HEAD'); if (result.status >= 400) report.brokenImages.push({ url, status: result.status });
}
report.linkChecksTruncated = [...links].filter(url => !checked.has(url)).length > 150;
report.imageChecksTruncated = images.size > 150;
report.checkedImageCount = Math.min(images.size, 150);
console.log(JSON.stringify(report, null, 2));
