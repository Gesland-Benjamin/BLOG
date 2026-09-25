import { escapeHtml, appUrl } from '../utils/security.js';

// Table layout and inline styles keep the message readable without external CSS/images.
export function newsletterEmail({ title, preview, paragraphs, actionLabel, actionUrl, note, unsubscribeUrl }) {
  const e = escapeHtml;
  const link = value => {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URL email invalide');
    return e(url.href);
  };
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title></head>
<body style="margin:0;padding:0;background:#f5eee4;color:#4a2600;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${e(preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5eee4;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffaf2;border:1px solid #dfbd91;border-radius:24px;">
<tr><td style="padding:28px 28px 24px;background:#f9ddb5;border-radius:24px 24px 0 0;border-bottom:1px solid #dfbd91;">
<a href="${link(appUrl())}" style="color:#4a2600;text-decoration:none;font-size:28px;font-weight:bold;">Emi’Pulse</a>
<p style="margin:10px 0 0;color:#75451e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">La newsletter</p></td></tr>
<tr><td style="padding:32px 28px;">
<h1 style="margin:0 0 24px;color:#4a2600;font-size:26px;line-height:1.3;">${e(title)}</h1>
${paragraphs.map(text => `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#634329;">${e(text)}</p>`).join('')}
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0;"><tr><td bgcolor="#6b3500" style="border-radius:12px;text-align:center;mso-padding-alt:16px 24px;"><a href="${link(actionUrl)}" style="display:inline-block;padding:16px 24px;border:1px solid #6b3500;border-radius:12px;color:#fff8eb;font-size:15px;font-weight:bold;text-decoration:none;">${e(actionLabel)}</a></td></tr></table>
<p style="padding:16px;margin:0 0 24px;border-left:3px solid #cc8c49;background:#fff1d9;font-size:14px;line-height:1.6;color:#634329;">${e(note)}</p>
<p style="font-size:12px;line-height:1.6;color:#755437;margin:0;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
<p style="margin:8px 0 0;font-size:12px;line-height:1.6;word-break:break-all;overflow-wrap:anywhere;"><a href="${link(actionUrl)}" style="color:#6b3500;">${e(actionUrl)}</a></p>
</td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #ead5b9;font-size:12px;line-height:1.7;color:#755437;">
<p style="margin:0;">À bientôt sur Emi’Pulse.</p>
${unsubscribeUrl ? `<p style="margin:10px 0 0;">Vous recevez ce message après votre inscription. <a href="${link(unsubscribeUrl)}" style="color:#6b3500;">Me désabonner</a></p>` : ''}
<p style="margin:10px 0 0;">© ${new Date().getFullYear()} Emi’Pulse</p>
</td></tr></table></td></tr></table></body></html>`;
}
