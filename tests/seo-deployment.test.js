import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSeoDeployment } from '../services/seoDeployment.js';

function database({ ready = false, indexed = true, missing = 0 } = {}) {
  const state = { ready, indexed, missing, queries: [] };
  const db = { getQueryInterface: () => ({
    describeTable: async () => state.ready ? Object.fromEntries(['slug', 'seo_title', 'meta_description', 'image_alt', 'is_published', 'published_at', 'related_article_ids'].map(name => [name, {}])) : { id: {} },
    showIndex: async () => state.indexed ? [{ unique: true, fields: [{ attribute: 'slug' }] }] : []
  }), query: async sql => { assert.match(sql, /^SELECT /); state.queries.push(sql); return [[{ missing: state.missing }]]; } };
  return { state, db };
}
test('démarrage sans activation : schéma incomplet refusé sans écriture', async () => {
  const { db } = database(); let writes = 0;
  await assert.rejects(prepareSeoDeployment(db, { enabled: false, migrate: async () => writes++, log() {} }), { code: 'SEO_SCHEMA_NOT_READY' });
  assert.equal(writes, 0);
});
test('activation explicite : migration puis contrôle avant disponibilité', async () => {
  const { db, state } = database(); let writes = 0;
  await prepareSeoDeployment(db, { enabled: true, migrate: async () => { writes++; state.ready = true; }, log() {} });
  assert.equal(writes, 1); assert.equal(state.queries.length, 1);
  await prepareSeoDeployment(db, { enabled: true, migrate: async () => writes++, log() {} });
  assert.equal(writes, 1);
});
test('schéma déjà prêt : démarrage autorisé sans variable et sans migration', async () => {
  const { db } = database({ ready: true });
  await prepareSeoDeployment(db, { enabled: false, migrate: async () => assert.fail('Migration inutile'), log() {} });
});
test('index absent ou backfill inachevé : refuse de démarrer', async () => {
  for (const options of [{ ready: true, indexed: false }, { ready: true, missing: 1 }]) {
    const { db } = database(options);
    await assert.rejects(prepareSeoDeployment(db, { enabled: false, log() {} }), { code: 'SEO_SCHEMA_NOT_READY' });
    await assert.rejects(prepareSeoDeployment(db, { enabled: true, migrate: async () => {}, log() {} }), { code: 'SEO_MIGRATION_INCOMPLETE' });
  }
});
test('échec de migration propagé ; aucun rollback ni démarrage de secours', async () => {
  const { db } = database(); const error = new Error('Schéma à examiner');
  await assert.rejects(prepareSeoDeployment(db, { enabled: true, migrate: async () => { throw error; }, log() {} }), error);
});
