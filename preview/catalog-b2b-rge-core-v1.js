(function(){
const source=window.__EDIOURO_CATALOG_SOURCE||[];
const coverBase='https://simpleset.ediouro.com.br/imagens/capas/PRD//';
const imprintCode={n:'nova-fronteira',a:'agir',p:'petra',t:'trama',l:'livros-da-alice',x:'pixel'};
const imprintNames={'nova-fronteira':'Nova Fronteira','agir':'Agir','petra':'Petra','trama':'Trama','livros-da-alice':'Livros da Alice','pixel':'Pixel'};
const categoryCode={l:'literatura',f:'fantasia',r:'romance',c:'crime-e-misterio',k:'classicos',i:'infantil-e-juvenil',e:'espiritualidade',b:'comportamento',n:'nao-ficcao'};
const editionCode={b:['Brochura','brochura'],d:['Capa dura','capa-dura'],x:['Box','box'],i:['Edição impressa','impresso']};
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const slug=s=>norm(s).replace(/\s+/g,'-').slice(0,96)||'livro';

// Coquetel permanece como marca institucional, mas não entra no catálogo geral nesta fase.
const coq=new Set(DATA.works.filter(w=>w.imprint==='coquetel').map(w=>w.slug));
DATA.works=DATA.works.filter(w=>w.imprint!=='coquetel');
DATA.editions=DATA.editions.filter(e=>!coq.has(e.workSlug));
coq.forEach(s=>{delete W[s];delete ED[s]});

const editionByIsbn=new Map();
DATA.editions.forEach(e=>{const k=String(e.isbn||e.ean||'').replace(/\D/g,'');if(k)editionByIsbn.set(k,e)});
const workByKey=new Map(DATA.works.map(w=>[w.imprint+'|'+norm(w.title),w]));
function contributor(name,imprint){
 const base=slug(name);let s=base,n=2;
 while(C[s]&&norm(C[s].name)!==norm(name))s=base+'-'+n++;
 if(!C[s]){const c={slug:s,name,shortBio:`Autor(a) com obra publicada pela ${imprintNames[imprint]||'Ediouro'}.`,bio:[],roles:['autor'],imprints:[imprint]};DATA.contributors.push(c);C[s]=c}
 else{C[s].roles=Array.from(new Set([...(C[s].roles||[]),'autor']));C[s].imprints=Array.from(new Set([...(C[s].imprints||[]),imprint]))}
 return s;
}
let createdWorks=0,createdEditions=0,updatedEditions=0,filledCovers=0;
source.forEach(row=>{
 const [isbn,title,imCode,authorText,catCode,price,publicationDate,coverFile,edCode]=row;
 const imprint=imprintCode[imCode],categories=[categoryCode[catCode]].filter(Boolean),authors=String(authorText||'').split('|').map(x=>x.trim()).filter(Boolean),cover=coverFile?(coverFile.startsWith('http')?coverFile:coverBase+coverFile):'';
 if(!isbn||!imprint)return;
 const existing=editionByIsbn.get(isbn);
 if(existing){
  if(price!=null)existing.price=price;
  if(publicationDate)existing.publicationDate=publicationDate;
  if((!existing.cover||existing.source?.coverSystem==='pending-rge-pcp')&&cover){existing.cover=cover;filledCovers++}
  existing.status='em-catalogo';
  existing.source={...(existing.source||{}),system:existing.source?.system||'catalogo-integrado',b2bProductId:existing.source?.productId||null,sku:isbn,active:true,rgeDate:'2026-09-17',rgeCover:cover||null,coverSystem:existing.cover?'rge-ou-curada':'pending-rge-pcp'};
  const ew=W[existing.workSlug];
  if(ew&&(!ew.categories||!ew.categories.length)&&categories.length)ew.categories=[...categories]
  updatedEditions++;return;
 }
 const key=imprint+'|'+norm(title);let w=workByKey.get(key);
 if(!w){
  let ws=slug(title);if(W[ws]&&W[ws].imprint!==imprint)ws=ws+'-'+imprint;if(W[ws]&&norm(W[ws].title)!==norm(title))ws=ws+'-'+isbn.slice(-4);
  const credits=authors.map(a=>({contributor:contributor(a,imprint),role:'autor'}));
  w={id:'catalog-'+isbn,slug:ws,title,shortDescription:'',description:[],credits,imprint,collections:[],categories,subjects:[],featured:[],popularity:50,seoTitle:title+' | Ediouro',seoDescription:''};
  DATA.works.push(w);W[ws]=w;workByKey.set(key,w);createdWorks++;
 }else if((!w.credits||!w.credits.length)&&authors.length){w.credits=authors.map(a=>({contributor:contributor(a,imprint),role:'autor'}))}
 const spec=editionCode[edCode]||editionCode.i;
 const ed={id:'b2b-'+isbn,workSlug:w.slug,label:spec[0],format:spec[1],publicationDate:publicationDate||'',language:'pt-BR',status:'em-catalogo',source:{system:'b2b+rge',sku:isbn,active:true,rgeDate:'2026-09-17',coverSystem:'rge-inf-capa'},binding:spec[0],isbn,ean:isbn,cover,gallery:[],price,currency:'BRL',displayPriority:100,retailerLinks:[]};
 DATA.editions.push(ed);(ED[w.slug]??=[]).push(ed);editionByIsbn.set(isbn,ed);createdEditions++;
});

// A seção de lançamentos da home passa a refletir o catálogo real sem puxar datas futuras.
const homeBeforeCatalogLoad=home;
home=function(){
 let out=homeBeforeCatalogLoad();const today='2026-09-17';
 const latest=DATA.works.map(w=>({w,d:(ED[w.slug]||[]).map(e=>e.publicationDate||'').filter(d=>d&&d<=today).sort().reverse()[0]||''})).filter(x=>x.d&&coverUrl(x.w)).sort((a,b)=>b.d.localeCompare(a.d)||a.w.title.localeCompare(b.w.title,'pt-BR')).slice(0,8).map(x=>x.w);
 if(latest.length)out=out.replace(/(<section><div class="wrap"><div class="sec-head"><h2>Acabaram de chegar<\/h2><\/div><div class="shelf">)[\s\S]*?(<\/div><\/div><\/section>)/,`$1${latest.map(bookCard).join('')}$2`);
 return out;
};
window.EDIOURO_CATALOG_LOAD={source:'B2B 2026-09-15 + RGE 2026-09-17',coquetelInGeneralCatalog:false,sourceRecords:source.length,createdWorks,createdEditions,updatedEditions,filledCovers,totalWorks:DATA.works.length,totalEditions:DATA.editions.length};
delete window.__EDIOURO_CATALOG_SOURCE;
})();
