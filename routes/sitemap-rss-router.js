import { Router } from 'express';
import { generateSitemap, generateRssFeed, generateAtomFeed } from '../controllers/sitemap-rss-controller.js';

const router = Router();

// Sitemap XML - SEO
router.get('/sitemap.xml', generateSitemap);

// Flux RSS 2.0
router.get('/feed.rss', generateRssFeed);
router.get('/feed.xml', generateRssFeed); // Alias

// Flux Atom 1.0
router.get('/feed.atom', generateAtomFeed);
router.get('/atom.xml', generateAtomFeed); // Alias

export default router;
