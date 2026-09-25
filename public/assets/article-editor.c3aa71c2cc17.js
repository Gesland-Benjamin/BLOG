function u(n=""){return String(n).replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l]).split(/(\n\s*\n)/).map(l=>l.replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g,"<strong>$1</strong>").replace(/(?<![\p{L}\p{N}_])_(\S(?:[^_]*?\S)?)_(?![\p{L}\p{N}_])/gu,"<em>$1</em>")).join("")}function L(n=""){return u(n).replace(/<\/?(?:strong|em)>/g,"").replace(/&(?:amp|lt|gt|quot|#39);/g,l=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'"})[l])}function x(n){return u(n).replace(/\[([^\]\n]+)\]\((\/article\/[a-zA-Z0-9-]+)\)/g,'<a href="$2">$1</a>')}function S(n=""){let l=[],t=new Map;return{html:String(n).replace(/\[\[IMAGE_INLINE\]\]/g,`

[[IMAGE_INLINE]]

`).split(/\n\s*\n/).map(p=>{let a=[],c=[],r=null,m=[],g=()=>{r&&a.push(`<${r}>${m.map(o=>`<li>${x(o)}</li>`).join("")}</${r}>`),r=null,m=[]},f=()=>{c.length&&a.push(`<p>${x(c.splice(0).join(`
`)).replace(/\n/g,"<br>")}</p>`)};for(let o of p.trim().split(`
`)){let z=/^(?:[-*]\s+|\d+\.\s+)(.+)$/.exec(o);if(z){f();let y=/^\d/.test(o)?"ol":"ul";r!==y&&g(),r=y,m.push(z[1]);continue}g();let d=/^(#{2,3})\s+(.+)$/.exec(o);if(!d){o&&c.push(o);continue}f();let I=L(d[2]),v="section-"+(I.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"titre"),h=(t.get(v)||0)+1;t.set(v,h);let w=v+(h>1?`-${h}`:""),b=d[1].length;b===2&&l.push({id:w,label:I}),a.push(`<h${b} id="${w}">${x(d[2])}</h${b}>`)}return f(),g(),a.join("")}).join(""),toc:l.length>=2?l:[]}}var e=document.getElementById("content"),E=document.querySelector(".article-format-toolbar"),$=document.getElementById("article-content-preview");if(e&&E&&$){let l=function(t){let s=e.selectionStart,i=e.selectionEnd,p=e.value.slice(s,i);if(s>=t.length&&e.value.slice(s-t.length,s)===t&&e.value.slice(i,i+t.length)===t)e.setRangeText(p,s-t.length,i+t.length,"select");else{let c=p||"votre texte";e.setRangeText(t+c+t,s,i,"select"),s+=t.length,e.setSelectionRange(s,s+c.length)}e.focus(),e.dispatchEvent(new Event("input",{bubbles:!0}))},n=()=>{$.innerHTML=/^(?:#{2,3} |[-*] |\d+\. )|\]\(\/article\//m.test(e.value)?S(e.value).html:u(e.value);let t=document.getElementById("article-writing-feedback");if(t?.setAttribute){let s=e.value.trim().split(/\s+/).filter(Boolean).length,i=[];/^#\s/m.test(e.value)&&i.push("Utilisez ## pour les sections : le titre principal est d\xE9j\xE0 affich\xE9."),/^###\s/m.test(e.value)&&!/^##\s/m.test(e.value)&&i.push("Ajoutez une section H2 avant vos sous-sections H3."),/\]\(\/article\//.test(e.value)||i.push("Pensez \xE0 un lien vers un article qui compl\xE8te votre propos."),/\[(?:Votre|Une|Présentez|Répondez|Racontez|Invitez|Ajoutez)/.test(e.value)&&i.push("Il reste des indications de la trame \xE0 personnaliser."),t.textContent=`${s} mots. ${i.join(" ")}`}};E.addEventListener("click",t=>{let s=t.target.closest("[data-format]");s&&l(s.dataset.format)}),e.addEventListener("keydown",t=>{(t.ctrlKey||t.metaKey)&&!t.altKey&&["b","i"].includes(t.key.toLowerCase())&&(t.preventDefault(),l(t.key.toLowerCase()==="b"?"**":"_"))}),e.addEventListener("input",n),E.hidden=!1,$.parentElement.hidden=!1,n()}var q=document.getElementById("insert-article-link");q?.addEventListener?.("click",()=>{let n=document.getElementById("internal-article");if(!n?.value||!e)return;let l=n.options[n.selectedIndex].textContent.replace(/[\[\]\r\n]/g,"");e.setRangeText(`[${l}](${n.value})`,e.selectionStart,e.selectionEnd,"end"),e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus()});document.getElementById("insert-article-template")?.addEventListener?.("click",()=>{if(!e)return;e.setRangeText(`

[Pr\xE9sentez en quelques phrases la question et ce que vous allez partager.]

## [Votre premi\xE8re grande id\xE9e]

[R\xE9pondez \xE0 la question avec votre exp\xE9rience et un exemple concret.]

### [Une pr\xE9cision utile]

[Ajoutez une nuance ou un conseil.]

## [Votre deuxi\xE8me grande id\xE9e]

- [Une premi\xE8re piste concr\xE8te]
- [Une deuxi\xE8me piste concr\xE8te]

## Ce que j\u2019en retiens

[Racontez ce qui vous semble essentiel, avec vos mots.]

[Invitez vos lecteurs \xE0 partager leur exp\xE9rience ou \xE0 poursuivre la lecture. Ins\xE9rez un lien avec le s\xE9lecteur d\u2019articles.]
`,e.selectionStart,e.selectionStart,"end"),e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus()});
