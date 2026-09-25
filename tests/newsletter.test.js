import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ejs from 'ejs';
import * as security from '../utils/security.js';
import * as schemas from '../validators/schemas.js';
import { newsletterEmail } from '../services/newsletterTemplate.js';
process.env.APP_URL = 'https://blog.example';
process.env.SESSION_SECRET = 'newsletter-test-secret-'.repeat(4);
async function load(file, imports) {
  const module = new vm.SourceTextModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
  await module.link(name => {
    assert.ok(name in imports, `Import interdit : ${name}`);
    const exports = imports[name];
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); });
  });
  await module.evaluate(); return module.namespace;
}
function response() { return { statusCode:200, status(code) { this.statusCode=code; return this; }, render(view,data) { this.view=view; this.data=data; return this; } }; }
async function fixture() {
  let subscriber, confirmation, welcome, unsubscribe, fail=false, mailCount=0;
  const model = {
    findOrCreate: async ({where,defaults}) => {
      subscriber ||= { id:1,email:where.email,date_inscription:new Date('2026-01-01'),...defaults,
        update:async values=>Object.assign(subscriber,values), destroy:async()=>{subscriber=null;} };
      return [subscriber];
    },
    findByPk:async id=>subscriber?.id===id ? subscriber : null,
    findOne:async()=>subscriber,
    update:async(values,{where})=>{
      if (!subscriber || subscriber.confirmed || subscriber.confirmation_token!==where.confirmation_token) return [0];
      Object.assign(subscriber,values); return [1];
    }
  };
  const controller = await load('../controllers/newsletter-controller.js', {
    'node:crypto':crypto, '../models/NewsletterSubscriber.model.js':{default:model}, '../utils/security.js':security, '../validators/schemas.js':schemas,
    '../services/email.js':{
      sendNewsletterConfirmationEmail:async(_email,token)=>{ if(fail)throw new Error('SMTP indisponible'); confirmation=token; mailCount++; },
      sendNewsletterWelcomeEmail:async(_email,url)=>{welcome=url;},
      sendUnsubscribeEmail:async(_email,url)=>{if(fail)throw new Error('SMTP indisponible');unsubscribe=url;}
    }
  });
  return {controller, get subscriber(){return subscriber;},get confirmation(){return confirmation;},get welcome(){return welcome;},get unsubscribe(){return unsubscribe;},get mailCount(){return mailCount;}, failMail(){fail=true;}};
}
const next=error=>{throw error;};
test('inscription → confirmation unique → bienvenue → désinscription signée',async()=>{
  const f=await fixture(), res=response();
  await f.controller.subscribeNewsletter({body:{email:' Lectrice@Example.com '}},res,next);
  assert.equal(f.subscriber.email,'lectrice@example.com'); assert.equal(f.subscriber.confirmed,false);
  assert.ok(f.confirmation); assert.notEqual(f.subscriber.confirmation_token,f.confirmation);
  const expiry=security.tokenPayload(f.confirmation).exp-Math.floor(Date.now()/1000);
  assert.ok(expiry>47*3600 && expiry<=48*3600);
  const confirm=response(); await f.controller.confirmSubscription({params:{token:f.confirmation}},confirm,next);
  assert.equal(confirm.data.success,true); assert.equal(f.subscriber.confirmed,true); assert.ok(f.welcome);
  const repeated=response(); await f.controller.confirmSubscription({params:{token:f.confirmation}},repeated,next);
  assert.equal(repeated.statusCode,400);
  await f.controller.subscribeNewsletter({body:{email:f.subscriber.email}},response(),next); assert.equal(f.mailCount,1);
  const token=new URL(f.welcome).searchParams.get('token');
  const landing=response(); f.controller.showUnsubscribeForm({query:{token}},landing); assert.ok(f.subscriber);
  const removed=response(); await f.controller.unsubscribe({body:{token}},removed,next); assert.equal(removed.data.success,true); assert.equal(f.subscriber,null);
});
test('liens falsifiés ou expirés refusés et aucun abonné activé',async()=>{
  const f=await fixture(); await f.controller.subscribeNewsletter({body:{email:'test@example.com'}},response(),next);
  const binding=`${f.subscriber.email}\0${new Date(f.subscriber.date_inscription).toISOString()}`;
  for(const token of [f.confirmation+'x',security.signToken('newsletter-confirm',{id:1},binding,-1)]) {
    const res=response(); await f.controller.confirmSubscription({params:{token}},res,next); assert.equal(res.statusCode,400); assert.equal(f.subscriber.confirmed,false);
  }
});
test('échec SMTP : réponse 503 honnête, saisie conservée, abonnement non confirmé',async()=>{
  const f=await fixture(); f.failMail(); const res=response();
  await f.controller.subscribeNewsletter({body:{email:'test@example.com'}},res,next);
  assert.equal(res.statusCode,503); assert.equal(res.data.message,null); assert.equal(res.data.formData.email,'test@example.com'); assert.equal(f.subscriber.confirmed,false);
  const remove=response(); await f.controller.unsubscribe({body:{email:'test@example.com'}},remove,next); assert.equal(remove.statusCode,503); assert.ok(f.subscriber);
});
test('trois emails newsletter : style partagé, texte, 48 h et liens absolus ; transport simulé',async()=>{
  const sent=[];
  const mail=await load('../services/email.js', {
    './newsletterTemplate.js':{newsletterEmail}, '../utils/security.js':security,
    nodemailer:{default:{createTransport:()=>({sendMail:async options=>{sent.push(options);return {};}})}}, dotenv:{default:{config(){}}}
  });
  await mail.sendNewsletterConfirmationEmail('test@example.com','signed.token');
  await mail.sendNewsletterWelcomeEmail('test@example.com','https://blog.example/newsletter/unsubscribe?token=signed.token');
  await mail.sendUnsubscribeEmail('test@example.com','https://blog.example/newsletter/unsubscribe?token=signed.token');
  assert.equal(sent.length,3);
  for(const message of sent){assert.match(message.html,/role="presentation"/);assert.match(message.html,/#f9ddb5/);assert.ok(message.text);assert.ok(!message.html.includes('<script'));assert.match(message.html,/https:\/\/blog.example/);}
  assert.match(sent[0].html,/48 heures/);assert.match(sent[0].text,/48 heures/);
  assert.ok(!sent[1].headers['List-Unsubscribe-Post']);assert.ok(sent[1].headers['List-Unsubscribe']);
  const html=newsletterEmail({title:'<img onerror=x>',preview:'<script>',paragraphs:['<b>Texte</b>'],actionLabel:'Lire',actionUrl:'https://blog.example/?a=1&b=2',note:'Note'});
  assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));assert.match(html,/&lt;b&gt;/);
});
test('vues newsletter : formulaire, succès et erreurs avec CSRF et titres uniques',async()=>{
  const base={csrfToken:'csrf-test',cspNonce:'nonce-test',user:null,categories:[],errors:[],formData:{},message:null,success:false,token:'',email:''};
  for(const view of ['newsletter','newsletter-confirm','newsletter-unsubscribe'])for(const success of [false,true]){
    const html=await ejs.renderFile(`views/${view}.ejs`,{...base,success,message:success?'Message de confirmation':null});
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    for(const form of html.matchAll(/<form\b[\s\S]*?<\/form>/g))if(/method="POST"/i.test(form[0]))assert.ok(form[0].includes('name="_csrf"'));
    assert.match(html,/for="footer-newsletter-email"/);
  }
});
