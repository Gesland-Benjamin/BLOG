import { readFileSync, existsSync } from 'node:fs';
const publicRoot = new URL('../public/', import.meta.url);
let manifest = {};
try { manifest = JSON.parse(readFileSync(new URL('assets/manifest.json', publicRoot), 'utf8')); }
catch { /* Source assets remain available before the first build. */ }
export function assetUrl(source) {
  const key = source.split('?')[0];
  const generated = manifest[key];
  return typeof generated === 'string' && /^\/assets\/[\w.-]+$/.test(generated) && existsSync(new URL(generated.slice(1), publicRoot)) ? generated : source;
}
