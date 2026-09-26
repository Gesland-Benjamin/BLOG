import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';

const locals = {
  csrfToken: 'fixture-csrf', cspNonce: 'fixture', user: { name: 'Émilie', role: 'admin' },
  categories: [], pagePath: '/admin/commentaires', message: null,
  articlePath: a => `/article/${a.slug || a.id}`, pagination: { total: 1 },
  baseUrl: '/admin/commentaires', search: '',
};
const render = (view, data) => ejs.renderFile(new URL(`../views/${view}.ejs`, import.meta.url).pathname, { ...locals, ...data });

test('moderation exposes a CSRF-protected reply and escapes guest content', async () => {
  const html = await render('admin-commentaires', { comments: [{
    id: 7, name: '<script>guest</script>', content: '<img src=x onerror=alert(1)>',
    statut: 'pending', article: { id: 3, title: 'Brouillon', is_published: false }, replies: []
  }] });
  assert.match(html, /&lt;script&gt;guest&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror/);
  assert.match(html, /<summary>Répondre<\/summary>/);
  assert.match(html, /action="\/admin\/commentaires\/7\/reply"/);
  assert.match(html, /name="_csrf" value="fixture-csrf"/);
  assert.match(html, /href="\/admin\/articles\/3\/edit"/);
  assert.match(html, /<textarea[^>]+name="contenu"[^>]+required/);
});

test('moderation does not offer approval again for an approved comment', async () => {
  const html = await render('admin-commentaires', { comments: [{ id: 8, name: 'Lectrice', content: 'Merci', statut: 'approved' }] });
  assert.doesNotMatch(html, /action="\/admin\/commentaires\/8\/approve"/);
  assert.match(html, /action="\/admin\/commentaires\/8\/reject"/);
  assert.match(html, /Publié/);
});

test('dashboard welcomes the admin with the requested message and one H1', async () => {
  const html = await render('admin-dashboard', {
    stats: {}, users: [], recentArticles: [], pendingComments: [], recentSubscribers: [],
    usersPagination: { total: 1 }, commentsPagination: { total: 1 },
    subscribersPagination: { total: 1 }, categoriesPagination: { total: 1 },
  });
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /Bonjour Émilie/);
  assert.match(html, /N’oubliez pas de remercier votre développeur préféré comme il se doit\./);
});
