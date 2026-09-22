import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import ejs from 'ejs';
import * as security from '../utils/security.js';
import { methodOverride, csrfToken, csrfProtection, validCsrf, securityHeaders } from '../middleware/requestSecurity.js';
import { loadSessionUser } from '../middleware/sessionUser.js';
import { rateLimit, loginRateLimit } from '../middleware/rateLimit.js';
import { validateRequest } from '../middleware/validate.js';
import { loginSchema, resetPasswordSchema, contactSchema } from '../validators/schemas.js';
import { totp, verifyAdminMfa } from '../utils/adminMfa.js';
import { prepareVideoUrl, getVideoType } from '../utils/videoHelper.js';
import { getPaginationParams } from '../utils/pagination.js';
import { assertPrivateTempDir } from '../utils/uploadPaths.js';
import { generateOpenGraphImage } from '../services/imageHelper.js';

// Aucun import de l'application, de Sequelize ou d'un modèle réel.
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-only-secret-'.repeat(4);
process.env.APP_URL = 'http://localhost:3000';
function request(overrides = {}) {
  return { method: 'POST', path: '/auth', query: {}, body: {}, headers: {}, session: {}, ip: '192.0.2.1',
    get(name) { return this.headers[name.toLowerCase()]; },
    is(type) { return this.headers['content-type']?.startsWith(type); }, ...overrides };
}
function response() {
  return Object.assign(new EventEmitter(), { locals: {}, headers: {}, statusCode: 200,
    status(n) { this.statusCode = n; return this; }, set(key, value) { if (typeof key === 'object') Object.assign(this.headers, key); else this.headers[key] = value; return this; },
    send(body) { this.body = body; return this; }, json(body) { this.body = body; return this; },
    render(view, locals) { this.view = view; this.data = locals; return this; }, redirect(url) { this.redirected = url; return this; }
  });
}
function run(handler, req) { const res = response(); let passed = false; handler(req, res, () => { passed = true; }); return { res, passed }; }

// Exécuter les contrôleurs avec doubles explicites ; aucun import DB autorisé.
async function mockedModule(file, stubs) {
  const module = new vm.SourceTextModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { identifier: file });
  await module.link(async name => {
    assert.ok(name in stubs, `Import réel interdit dans le test : ${name}`);
    const exports = stubs[name];
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); });
  });
  await module.evaluate();
  return module.namespace;
}

test('GET/HEAD ne peuvent pas devenir une mutation, types _method invalides refusés', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS', 'DELETE']) assert.equal(run(methodOverride, request({ method, query: { _method: 'DELETE' } })).res.statusCode, 400);
  for (const value of [[], {}, 'TRACE', 'POST']) assert.equal(run(methodOverride, request({ query: { _method: value } })).res.statusCode, 400);
  const req = request({ query: { _method: 'PUT' } }); assert.ok(run(methodOverride, req).passed); assert.equal(req.method, 'PUT');
});
test('CSRF : session, corps, header, origine et routes multipart', () => {
  const req = request(), res = response(); csrfToken(req, res, () => {});
  assert.equal(req.session.csrfToken.length, 64);
  assert.equal(run(csrfProtection, req).res.statusCode, 403);
  req.body._csrf = req.session.csrfToken; assert.ok(run(csrfProtection, req).passed);
  req.headers.origin = 'https://attacker.invalid'; assert.equal(run(csrfProtection, req).res.statusCode, 403);
  delete req.headers.origin; req.headers['sec-fetch-site'] = 'cross-site'; assert.equal(run(csrfProtection, req).res.statusCode, 403);
  delete req.headers['sec-fetch-site']; req.headers['x-csrf-token'] = 'invalid'; assert.equal(validCsrf(req), false);
  delete req.headers['x-csrf-token']; req.headers['content-type'] = 'multipart/form-data; boundary=test';
  assert.equal(run(csrfProtection, req).res.statusCode, 415);
  req.path = '/admin/articles/12'; req.method = 'PUT'; assert.ok(run(csrfProtection, req).passed);
  req.session.csrfToken = 'another-session'; assert.equal(validCsrf(req), false);
});
test('En-têtes : CSP sans handlers inline, nonce unique et no-store dynamique', () => {
  const first=response(), second=response(); securityHeaders(request(),first,()=>{}); securityHeaders(request(),second,()=>{});
  assert.notEqual(first.locals.cspNonce, second.locals.cspNonce);
  assert.match(first.headers['Content-Security-Policy'], /script-src-attr 'none'/);
  assert.match(first.headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(first.headers['X-Content-Type-Options'], 'nosniff');
  csrfToken(request(), first, () => {}); assert.equal(first.headers['Cache-Control'],'private, no-store');
});
test('Secrets production et origine canonique obligatoires', () => {
  const before = { ...process.env };
  try {
    process.env.NODE_ENV='production'; delete process.env.SESSION_SECRET;
    assert.throws(security.sessionSecret);
    process.env.SESSION_SECRET='very_long_random_secret_key_2024'; assert.throws(security.sessionSecret);
    process.env.APP_URL='https://example.test'; assert.equal(security.appUrl(),'https://example.test');
    for (const value of ['http://example.test','https://user:pass@example.test','https://example.test/path']) { process.env.APP_URL=value; assert.throws(security.appUrl); }
  } finally { process.env.NODE_ENV=before.NODE_ENV; process.env.SESSION_SECRET=before.SESSION_SECRET; process.env.APP_URL=before.APP_URL; }
});
test('Tokens : falsification, expiration, finalité et mot de passe', () => {
  const token=security.signToken('reset',{id:12},'hash1',60);
  assert.equal(security.verifyToken(token,'reset','hash1').id,12);
  assert.equal(security.verifyToken(token,'unsubscribe','hash1'),null);
  assert.equal(security.verifyToken(token,'reset','hash2'),null);
  assert.equal(security.verifyToken(token+'x','reset','hash1'),null);
  assert.equal(security.verifyToken(security.signToken('reset',{id:12},'hash1',-1),'reset','hash1'),null);
  assert.equal(security.tokenPayload('x'.repeat(3000)),null);
});
test('Sessions : changement de mot de passe, rôle, suppression et inactivité révoquent', async () => {
  const original={id:1, name:'Test',email:'test@example.test',role:'admin',password:'oldhash'};
  for (const [user, old] of [[original,false],[{...original,password:'newhash'},false],[{...original,role:'visiteur'},false],[null,false],[original,true]]) {
    const req=request({session:{user:{id:1},authVersion:security.fingerprint('oldhash\0admin'),lastActive:Date.now()-(old?3600000:0),regenerate(cb){this.user=null;this.revoked=true;cb();}}});
    const res=response(); let passed=false;
    await loadSessionUser({scope:()=>({findByPk:async()=>user})})(req,res,error=>{assert.ifError(error);passed=true;});
    assert.ok(passed);
    if(user===original&&!old) assert.equal(req.user.role,'admin'); else assert.equal(req.user,null);
  }
});
test('Rate limiter : casse/normalisation email, plafond IP, compteurs indépendants', () => {
  function login(email) {
    const req=request({body:{email}}),res=response();let passed=false;
    loginRateLimit[0](req,res,()=>loginRateLimit[1](req,res,()=>{passed=true;}));return passed;
  }
  for(let i=0;i<10;i++) assert.ok(login('TeSt@example.test'));
  assert.equal(login(' test@EXAMPLE.test '),false);
  for(let i=0;i<20;i++) login(`other${i}@example.test`);
  assert.equal(login('fresh@example.test'),false);
  const a=rateLimit({max:1}), b=rateLimit({max:1});assert.ok(run(a,request()).passed);assert.equal(run(a,request()).res.statusCode,429);assert.ok(run(b,request()).passed);
});
test('IPv6 /56 regroupé et stockage de compteur borné', () => {
  const limiter=rateLimit({max:1,maxKeys:2});
  assert.ok(run(limiter,request({ip:'2001:db8:abcd:1200::1'})).passed);
  assert.equal(run(limiter,request({ip:'2001:db8:abcd:12ff::9'})).res.statusCode,429);
  assert.ok(run(limiter,request({ip:'192.0.2.3'})).passed);
  assert.equal(run(limiter,request({ip:'192.0.2.4'})).res.statusCode,429);
});
test('TOTP RFC 6238 et refus de réutilisation du code', () => {
  const secret='GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(totp(secret,1,8),'94287082');
  assert.equal(totp(secret,Math.floor(1111111109000/30000),8),'07081804');
  process.env.ADMIN_TOTP_SECRETS=JSON.stringify({'admin@example.test':secret});
  const user={id:99,email:'admin@example.test',role:'admin'}, now=59000;
  assert.ok(verifyAdminMfa(user,totp(secret,1),now));
  assert.equal(verifyAdminMfa(user,totp(secret,1),now),false);
  delete process.env.ADMIN_TOTP_SECRETS;
});
test('Validation : aucun mot de passe renvoyé dans erreurs et formData', () => {
  const req=request({body:{password:'sentinel-secret',password_confirm:'different'}});
  const {res}=run(validateRequest(resetPasswordSchema,{view:'reset-password'}),{...req,params:{token:'test'}});
  assert.equal(res.statusCode,400);assert.ok(!JSON.stringify(res.data).includes('sentinel-secret'));assert.equal(res.view,'reset-password');
  const normalized = loginSchema.validate({email:' Test@example.com ',password:'p'});
  assert.ifError(normalized.error);
  assert.equal(normalized.value.email,'test@example.com');
  assert.ok(contactSchema.validate({nom:{},email:'x',message:[],sujet:'x'}).error);
});
test('Encodage HTML/CSV et domaines vidéo exacts', () => {
  assert.equal(security.escapeHtml('"<script>'), '&quot;&lt;script&gt;');
  assert.ok(!generateOpenGraphImage({imageUrl:'" data-attack="x',imageAlt:'"><script>'}).includes('<script>'));
  assert.equal(security.csvCell('=1+1'), '"\'=1+1"'); assert.equal(security.csvCell('a"b'), '"a""b"');
  assert.equal(prepareVideoUrl('https://youtube.com.evil.test/embed/abcdefghijk'),null);
  assert.equal(prepareVideoUrl('javascript:alert(1)'),null);
  assert.equal(prepareVideoUrl('https://youtu.be/abcdefghijk'),'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(getVideoType('https://player.vimeo.com/video/1234'),'vimeo');
});
test('Temporaires privés et pagination bornée', () => {
  const old=process.env.TEMP_DIR;
  try { process.env.TEMP_DIR=process.cwd()+'/public/uploads/tmp';assert.throws(assertPrivateTempDir);process.env.TEMP_DIR=process.cwd()+'/.private-uploads';assert.doesNotThrow(assertPrivateTempDir); }
  finally { if(old===undefined)delete process.env.TEMP_DIR;else process.env.TEMP_DIR=old; }
  const p=getPaginationParams('9999999999999999999999',100000);assert.equal(p.page,10000);assert.equal(p.limit,100);
});
test('Toutes les vues compilent ; formulaires principaux rendus avec CSRF et CSP', async () => {
  for(const dir of ['views','views/partials']) for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.ejs'))) ejs.compile(fs.readFileSync(`${dir}/${file}`,'utf8'));
  const locals={csrfToken:'csrf-test',cspNonce:'nonce-test',user:null,errors:[],formData:{},message:null,error:null,devToken:null,categories:[],article:{},ogImageTags:'',isEditing:false,isValid:true,token:'signed.token',email:'',success:false,title:'Test'};
  for(const view of ['auth','register','forgot-password','reset-password','newsletter','newsletter-unsubscribe','new-article','renseignements']) {
    const html=await ejs.renderFile(`views/${view}.ejs`,locals);
    assert.ok(!/\son(?:click|submit)=/.test(html));
    for(const form of html.matchAll(/<form\b[\s\S]*?<\/form>/g)) if(/method="POST"/i.test(form[0])) assert.ok(form[0].includes('name="_csrf"'),view);
    for(const script of html.matchAll(/<script([^>]*)>/g)) if(!/\bsrc=/.test(script[1])) assert.ok(script[1].includes('nonce="nonce-test"'),view);
  }
});

test('Suppression utilisateur : validation avant transaction et contenus préservés', async () => {
  let transactions=0,deleted=0;const updates=[];
  const user={id:2,role:'visiteur',destroy:async()=>deleted++};
  const sequelize={transaction:async fn=>{transactions++;return fn({LOCK:{UPDATE:'UPDATE'}});}};
  const User={findAll:async()=>[{id:1}],findByPk:async()=>user};
  const Article={count:async()=>1};
  const updateModel={update:async value=>updates.push(value)};
  const mod=await mockedModule('../controllers/admin-user-controller.js',{
    '../models/User.model.js':{default:User},'../models/Article.model.js':{default:Article},
    '../models/Commentaire.model.js':{default:updateModel},'../models/ArticleLike.model.js':{default:updateModel},
    '../models/NewsletterSubscriber.model.js':{default:updateModel},'../config/database.js':{default:sequelize}
  });
  const next=error=>{throw error;};
  await mod.deleteUser({params:{id:'invalid'},user:{id:1}},response(),next);assert.equal(transactions,0);
  const req={params:{id:'2'},user:{id:1},session:{}};
  await mod.deleteUser(req,response(),next);assert.equal(deleted,0);assert.equal(updates.length,0);
  Article.count=async()=>0;
  await mod.deleteUser(req,response(),next);assert.equal(deleted,1);assert.equal(updates.length,3);
});
test('Reset : double consommation concurrente refusée et aucune colonne reset requise', async () => {
  let password='old-hash';
  const User={scope:()=>({findByPk:async()=>({id:1,name:'Test',email:'test@example.test',password})}),update:async(values,{where})=>{
    if(where.password!==password)return [0];password=values.password;return [1];
  }};
  const mod=await mockedModule('../controllers/password-reset-controller.js',{
    argon2:{default:{hash:async()=> 'new-hash'}},'../models/User.model.js':{default:User},
    '../services/email.js':{sendResetEmail:async()=>{},sendConfirmationEmail:async()=>{}},'../utils/security.js':security
  });
  const token=security.signToken('password-reset',{id:1},password);
  const makeReq=()=>({params:{token},body:{password:'A-secure-password-1'},session:{regenerate(cb){cb();},save(cb){cb();}}});
  const a=response(),b=response();await Promise.all([mod.resetPassword(makeReq(),a,error=>{throw error;}),mod.resetPassword(makeReq(),b,error=>{throw error;})]);
  assert.equal([a,b].filter(r=>r.redirected==='/auth').length,1);assert.equal([a,b].filter(r=>r.statusCode===400).length,1);
});

test('Newsletter : email seul ne supprime rien, jeton lié au bon abonnement requis', async () => {
  let deleted = 0, mailed = '';
  const subscriber = { id: 7, email: 'owner@example.com', date_inscription: new Date('2026-01-01'), destroy: async () => deleted++ };
  const mod = await mockedModule('../controllers/newsletter-controller.js', {
    'node:crypto': await import('node:crypto'),
    '../models/NewsletterSubscriber.model.js': { default: { findOne: async () => subscriber, findByPk: async id => id === 7 ? subscriber : null } },
    '../services/email.js': { sendNewsletterConfirmationEmail: async () => {}, sendNewsletterWelcomeEmail: async () => {}, sendUnsubscribeEmail: async (email, url) => { mailed = url; } },
    '../utils/security.js': security,
    '../validators/schemas.js': await import('../validators/schemas.js')
  });
  const next = error => { throw error; };
  await mod.unsubscribe({ body: { email: subscriber.email } }, response(), next);
  assert.equal(deleted, 0);
  const token = new URL(mailed).searchParams.get('token');
  const invalid = response();
  await mod.unsubscribe({ body: { token: token + 'x' } }, invalid, next);
  assert.equal(invalid.statusCode, 400); assert.equal(deleted, 0);
  await mod.unsubscribe({ body: { token } }, response(), next);
  assert.equal(deleted, 1);
});

test('Uploads : CSRF avant décodage, originaux nettoyés, variantes conservées seulement après écriture réussie', async () => {
  let decoded = 0; const originals = [], derivatives = [];
  const parser = (req, res, cb) => cb();
  const multer = Object.assign(() => ({ single: () => parser, array: () => parser, fields: () => parser }), { diskStorage: x => x });
  const mod = await mockedModule('../config/multer.js', {
    multer: { default: multer }, 'node:crypto': await import('node:crypto'),
    'node:fs/promises': { default: { unlink: async path => originals.push(path), mkdir: async () => {} } },
    '../services/image.js': { isValidImage: async () => { decoded++; return true; }, processImage: async () => ({}), deleteProcessedImages: async (dir, basename) => derivatives.push(basename) },
    '../utils/uploadPaths.js': { getTempUploadsDir: () => '/private', getUploadsDir: () => '/generated' },
    '../middleware/requestSecurity.js': { validCsrf }, '../utils/security.js': security
  });
  const handler = mod.uploadTwoWithProcessing();
  const makeReq = token => request({ session: { csrfToken: 'valid' }, body: { _csrf: token }, files: { image: [{ fieldname: 'image', filename: 'random', path: '/private/random' }] } });
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const rejected = response(); handler(makeReq('bad'), rejected, () => assert.fail('CSRF bypass')); await settle();
  assert.equal(rejected.statusCode, 403); assert.equal(decoded, 0); assert.equal(originals.length, 1);
  const failure = response(); handler(makeReq('valid'), failure, () => failure.emit('finish')); await settle();
  assert.equal(decoded, 1); assert.deepEqual(derivatives, ['random']);
  const success = response(), req = makeReq('valid');
  handler(req, success, () => { req.uploadCommitted = true; success.emit('finish'); }); await settle();
  assert.equal(originals.length, 3); assert.deepEqual(derivatives, ['random']);
});
