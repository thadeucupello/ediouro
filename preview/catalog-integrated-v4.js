(function(){
const source=window.__EDIOURO_CATALOG_SOURCE||[];
const coverBase='https://simpleset.ediouro.com.br/imagens/capas/PRD//';
const imprintCode={n:'nova-fronteira',a:'agir',p:'petra',t:'trama',l:'livros-da-alice',x:'pixel'};
const imprintNames={'nova-fronteira':'Nova Fronteira','agir':'Agir','petra':'Petra','trama':'Trama','livros-da-alice':'Livros da Alice','pixel':'Pixel'};
const categoryCode={l:'literatura',f:'fantasia',r:'romance',c:'crime-e-misterio',k:'classicos',i:'infantil-e-juvenil',e:'espiritualidade',b:'comportamento',n:'nao-ficcao'};
const editionCode={b:['Brochura','brochura'],d:['Capa dura','capa-dura'],x:['Box','box'],i:['Edição impressa','impresso']};
const digits=s=>String(s||'').replace(/\D/g,'');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cleanTitle=s=>norm(s).replace(/\b(capa comum|capa dura|brochura|edicao especial)\b/g,'').replace(/\s+/g,' ').trim();
const slugify=s=>norm(s).replace(/\s+/g,'-').slice(0,90)||'livro';
function humanName(s){
 const particles=new Set(['de','da','do','dos','das','e']);
 return String(s||'').trim().split(/\s+/).map((w,i)=>{
  if(!w)return w;
  const lw=w.toLocaleLowerCase('pt-BR');
  if(i>0&&particles.has(lw))return lw;
  if(/^[a-z]\.$/i.test(w))return w.toUpperCase();
  return lw.charAt(0).toLocaleUpperCase('pt-BR')+lw.slice(1);
 }).join(' ');
}
function rebuild(){
 Object.keys(W).forEach(k=>delete W[k]);DATA.works.forEach(w=>W[w.slug]=w);
 Object.keys(ED).forEach(k=>delete ED[k]);DATA.editions.forEach(e=>(ED[e.workSlug]??=[]).push(e));
 Object.keys(C).forEach(k=>delete C[k]);DATA.contributors.forEach(c=>C[c.slug]=c);
 Object.keys(S).forEach(k=>delete S[k]);DATA.series.forEach(s=>S[s.slug]=s);
}
function ensureContributor(raw,imprint){
 const name=humanName(raw);if(!name)return null;
 let s=slugify(name),n=2;
 while(C[s]&&norm(C[s].name)!==norm(name))s=slugify(name)+'-'+n++;
 if(!C[s]){
  const c={slug:s,name,shortBio:'Autor(a) publicado(a) pela '+(imprintNames[imprint]||'Ediouro')+'.',bio:[],roles:['autor'],imprints:[imprint]};
  DATA.contributors.push(c);C[s]=c;
 }else{
  C[s].roles=Array.from(new Set([...(C[s].roles||[]),'autor']));
  C[s].imprints=Array.from(new Set([...(C[s].imprints||[]),imprint].filter(Boolean)));
 }
 return s;
}

// Coquetel continua institucionalmente no site, mas fica fora do catálogo geral.
const coquetelSlugs=new Set(DATA.works.filter(w=>w.imprint==='coquetel').map(w=>w.slug));
DATA.works=DATA.works.filter(w=>w.imprint!=='coquetel');
DATA.editions=DATA.editions.filter(e=>!coquetelSlugs.has(e.workSlug));
rebuild();

const workCandidates=new Map();
for(const w of DATA.works){
 const key=(w.imprint||'')+'|'+cleanTitle(w.title);
 if(!workCandidates.has(key))workCandidates.set(key,[]);
 workCandidates.get(key).push(w);
}
function workAuthorNames(w){
 return (w.credits||[]).filter(x=>x.role==='autor').map(x=>norm(C[x.contributor]?.name||x.contributor)).filter(Boolean);
}
function chooseCandidate(imprint,title,rawAuthors){
 const candidates=workCandidates.get(imprint+'|'+cleanTitle(title))||[];
 if(!candidates.length)return null;
 const wanted=rawAuthors.map(norm).filter(Boolean);
 if(!wanted.length)return candidates.length===1?candidates[0]:null;
 const scored=candidates.map(w=>{
  const have=workAuthorNames(w);
  const score=wanted.filter(a=>have.includes(a)).length;
  return {w,score,have};
 }).sort((a,b)=>b.score-a.score);
 if(scored[0]?.score>0)return scored[0].w;
 return candidates.length===1&&scored[0].have.length===0?scored[0].w:null;
}
const editionByIsbn=new Map();
for(const e of DATA.editions){const k=digits(e.isbn||e.ean);if(k)editionByIsbn.set(k,e)}

let createdWorks=0,createdEditions=0,updatedEditions=0,linkedAuthors=0;
for(const row of source){
 const [isbn,title,imCode,authorText,catCode,price,publicationDate,coverFile,edCode]=row;
 const code=digits(isbn),imprint=imprintCode[imCode];
 if(!code||!imprint)continue;
 const authors=String(authorText||'').split('|').map(x=>x.trim()).filter(Boolean);
 const categories=[categoryCode[catCode]].filter(Boolean);
 const cover=coverFile?(String(coverFile).startsWith('http')?coverFile:coverBase+coverFile):'';
 let ed=editionByIsbn.get(code);
 let w=ed?W[ed.workSlug]:null;

 if(!w){
  w=chooseCandidate(imprint,title,authors);
 }
 if(!w){
  let ws=slugify(title),i=2;
  while(W[ws])ws=slugify(title)+'-'+i++;
  w={id:'catalog-'+code,slug:ws,title,shortDescription:'',description:[],credits:[],imprint,collections:[],categories:[...categories],subjects:[],featured:[],popularity:50,seoTitle:title+' | Ediouro',seoDescription:''};
  DATA.works.push(w);W[ws]=w;
  const wk=imprint+'|'+cleanTitle(title);if(!workCandidates.has(wk))workCandidates.set(wk,[]);workCandidates.get(wk).push(w);
  createdWorks++;
 }else{
  if(!w.imprint)w.imprint=imprint;
  if((!w.categories||!w.categories.length)&&categories.length)w.categories=[...categories];
 }

 w.credits=w.credits||[];
 for(const raw of authors){
  const cs=ensureContributor(raw,imprint);
  if(cs&&!w.credits.some(x=>x.role==='autor'&&x.contributor===cs)){w.credits.push({contributor:cs,role:'autor'});linkedAuthors++}
 }

 if(ed){
  ed.workSlug=w.slug;
  if(price!=null)ed.price=price;
  if(publicationDate)ed.publicationDate=publicationDate;
  if(cover&&!ed.cover)ed.cover=cover;
  ed.status='em-catalogo';
  ed.isbn=ed.isbn||code;ed.ean=ed.ean||code;
  ed.source={...(ed.source||{}),system:'b2b+rge',sku:code,active:true,rgeDate:'2026-09-17',coverSystem:cover?'rge-inf-capa':(ed.source?.coverSystem||'pendente')};
  updatedEditions++;
 }else{
  const spec=editionCode[edCode]||editionCode.i;
  ed={id:'b2b-'+code,workSlug:w.slug,label:spec[0],format:spec[1],publicationDate:publicationDate||'',language:'pt-BR',status:'em-catalogo',source:{system:'b2b+rge',sku:code,active:true,rgeDate:'2026-09-17',coverSystem:cover?'rge-inf-capa':'pendente'},binding:spec[0],isbn:code,ean:code,cover,gallery:[],price,currency:'BRL',displayPriority:100,retailerLinks:[]};
  DATA.editions.push(ed);editionByIsbn.set(code,ed);createdEditions++;
 }
}

// Segunda passagem de garantia: nenhum ISBN da carga pode ficar sem edição.
rebuild();
const actual=new Set(DATA.editions.map(e=>digits(e.isbn||e.ean)).filter(Boolean));
const forced=[];
for(const row of source){
 const code=digits(row[0]);if(!code||actual.has(code))continue;
 const [isbn,title,imCode,authorText,catCode,price,publicationDate,coverFile,edCode]=row;
 const imprint=imprintCode[imCode];if(!imprint)continue;
 let ws=slugify(title)+'-'+code.slice(-4),i=2;while(W[ws])ws=slugify(title)+'-'+code.slice(-4)+'-'+i++;
 const authors=String(authorText||'').split('|').map(x=>x.trim()).filter(Boolean);
 const credits=authors.map(a=>ensureContributor(a,imprint)).filter(Boolean).map(s=>({contributor:s,role:'autor'}));
 const w={id:'forced-'+code,slug:ws,title,shortDescription:'',description:[],credits,imprint,collections:[],categories:[categoryCode[catCode]].filter(Boolean),subjects:[],featured:[],popularity:50,seoTitle:title+' | Ediouro',seoDescription:''};
 const spec=editionCode[edCode]||editionCode.i,cover=coverFile?(String(coverFile).startsWith('http')?coverFile:coverBase+coverFile):'';
 const ed={id:'forced-ed-'+code,workSlug:ws,label:spec[0],format:spec[1],publicationDate:publicationDate||'',language:'pt-BR',status:'em-catalogo',source:{system:'b2b+rge-forced',sku:code,active:true,rgeDate:'2026-09-17'},binding:spec[0],isbn:code,ean:code,cover,gallery:[],price,currency:'BRL',displayPriority:100,retailerLinks:[]};
 DATA.works.push(w);DATA.editions.push(ed);actual.add(code);forced.push(code);
}
rebuild();

// Reconcilia série nos dois sentidos: a lista editorial informa a obra,
// e obras que já trazem series/seriesOrder voltam para a lista da série.
for(const s of DATA.series){
 const listed=(s.workSlugs||[]).filter(sl=>W[sl]);
 for(const sl of listed){if(W[sl])W[sl].series=s.slug}
 const seen=new Set(listed);
 const extras=DATA.works.filter(w=>w.series===s.slug&&!seen.has(w.slug)).sort((a,b)=>{
  const ao=Number.isFinite(a.seriesOrder)?a.seriesOrder:999;
  const bo=Number.isFinite(b.seriesOrder)?b.seriesOrder:999;
  if(ao!==bo)return ao-bo;
  const ad=(ED[a.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort()[0]||'9999';
  const bd=(ED[b.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort()[0]||'9999';
  return ad.localeCompare(bd)||a.title.localeCompare(b.title,'pt-BR');
 });
 s.workSlugs=[...listed,...extras.map(w=>w.slug)];
}

const expected=new Set(source.map(r=>digits(r[0])).filter(Boolean));
const present=new Set(DATA.editions.map(e=>digits(e.isbn||e.ean)).filter(Boolean));
const missing=[...expected].filter(x=>!present.has(x));
window.EDIOURO_CATALOG_AUDIT={
 expectedRows:source.length,
 expectedUniqueIsbns:expected.size,
 presentExpectedIsbns:[...expected].filter(x=>present.has(x)).length,
 missingExpectedIsbns:missing,
 forced,
 createdWorks,createdEditions,updatedEditions,linkedAuthors,
 totalWorks:DATA.works.length,totalEditions:DATA.editions.length,
 duplicateEditionGroups:Object.values(DATA.editions.reduce((m,e)=>{const k=e.workSlug;(m[k]??=[]).push(e);return m},{})).filter(a=>a.length>1).length,
 authorCollisionTitles:[...new Set(source.map(r=>imprintCode[r[2]]+'|'+cleanTitle(r[1])))]
   .filter(k=>{const rs=source.filter(r=>imprintCode[r[2]]+'|'+cleanTitle(r[1])===k);return new Set(rs.map(r=>norm(r[3]))).size>1})
};

const oldHome=home;
home=function(){
 let out=oldHome(),today='2026-09-17';
 const latest=DATA.works.map(w=>({w,d:(ED[w.slug]||[]).map(e=>e.publicationDate||'').filter(d=>d&&d<=today).sort().reverse()[0]||''})).filter(x=>x.d&&coverUrl(x.w)).sort((a,b)=>b.d.localeCompare(a.d)||a.w.title.localeCompare(b.w.title,'pt-BR')).slice(0,8).map(x=>x.w);
 if(latest.length)out=out.replace(/(<section><div class="wrap"><div class="sec-head"><h2>Acabaram de chegar<\/h2><\/div><div class="shelf">)[\s\S]*?(<\/div><\/div><\/section>)/,`$1${latest.map(bookCard).join('')}$2`);
 return out;
};
})();