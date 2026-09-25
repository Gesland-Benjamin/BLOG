// Static assets only: no application, environment or database imports.
import { transform, build } from 'esbuild';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const output = 'public/assets';
await mkdir(output, { recursive: true });
const manifest = {};
let before = 0, after = 0;
const css = (await readdir('public/css')).filter(name => /^\d.*\.css$/.test(name)).sort();
const entries = [...css.map(name => `css/${name}`), 'js/color-modes.js', 'js/security-actions.js', 'js/dropdown.js', 'js/article-editor.js'];
for (const entry of entries) {
  const source = await readFile(`public/${entry}`, 'utf8');
  let code;
  if (entry === 'js/article-editor.js') {
    const result = await build({ entryPoints: [`public/${entry}`], bundle: true, minify: true, format: 'esm', target: 'es2020', write: false });
    code = result.outputFiles[0].text;
    before += (await readFile('public/js/article-content.js')).length + (await readFile('public/js/article-format.js')).length;
  } else {
    code = (await transform(source, { loader: entry.endsWith('.css') ? 'css' : 'js', minify: true, target: 'es2020' })).code;
  }
  const hash = createHash('sha256').update(code).digest('hex').slice(0, 12);
  const ext = path.extname(entry);
  const filename = `${path.basename(entry, ext)}.${hash}${ext}`;
  await writeFile(`${output}/${filename}`, code);
  manifest[`/${entry}`] = `/assets/${filename}`;
  before += Buffer.byteLength(source); after += Buffer.byteLength(code);
}
// Existing generated files are retained so already-open pages keep working.
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Assets: ${before} → ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller). No database accessed.`);
