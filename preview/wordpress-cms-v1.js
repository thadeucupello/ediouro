(function(){
const mode=new URL(location.href).searchParams.get('cms')==='1'?'cms':'shadow';
let bootPromise=null;
let cmsData=null;
let cmsBooks=new Map();
let cmsCollections=[];

const meaningful=v=>{
  if(v===null||v===undefined)return false;
  if(typeof v==='string')return v.trim()!=='';
  if(Array.isArray(v))return v.length>0;
  if(typeof v==='object')return Object.keys(v).length>0;
  return true;
};
const mergeMeaningful=(base,next)=>{
  const out={...(base||{})};
  for(const [k,v] of Object.entries(next||{}))if(meaningful(v))out[k]=v;
  return out;
};
const digits=v=>String(v||'').replace(/\D/g,'');
const moneyText=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
const formatLabel=t=>({'brochura':'Brochura','capa-dura':'Capa dura','livro-digital':'Livro digital','audiolivro':'Audiolivro'}[t]||t||'Edição');
const statusLabel=s=>({'em-catalogo':'Em catálogo','pre-venda':'Pré-venda','lancamento-futuro':'Lançamento futuro','indisponivel':'Indisponível'}[s]||s||'—');

function workFromBook(b,old){
  const credits=(b.authors||[]).map((slug,i)=>({contributor:slug,role:'author',order:i+1}));
  return mergeMeaningful(old,{
    id:b.id,slug:b.slug,title:b.title,subtitle:b.subtitle,
    shortDescription:b.shortDescription,description:b.description,
    credits,imprint:b.imprint,collections:b.collections||[],categories:b.categories||[],
    series:b.series||null,seriesOrder:b.seriesOrder==null?null:Number(b.seriesOrder),
    relatedBooks:b.relatedBooks||[],relatedArticles:b.relatedArticles||[],education:b.education||null,
    seoTitle:b.seo?.title,seoDescription:b.seo?.description,ogImage:b.ogImage,
    cmsSource:'wordpress'
  });
}
function editionFromFormat(b,f,index){
  const isbn=digits(f.isbn||f.ean);const id='wp-'+b.id+'-'+(isbn||index);
  return {
    id,workSlug:b.slug,label:f.label||formatLabel(f.type),format:f.type||'brochura',
    publicationDate:f.publication_date||'',language:'pt-BR',status:f.status||'em-catalogo',
    binding:f.binding||formatLabel(f.type),isbn:f.isbn||'',ean:f.ean||f.isbn||'',
    pageCount:f.page_count?Number(f.page_count):null,dimensions:f.dimensions||'',
    cover:f.cover||b.cover||'',gallery:[],price:moneyText(f.price),currency:'BRL',credits:[],
    displayPriority:1000-index,retailerLinks:(f.retailers||[]).filter(r=>r&&r.url).map(r=>({name:r.name||r.key||'Loja',url:r.url,key:r.key||''})),
    availabilityNote:f.availability_note||'',digitalFormat:f.digital_format||'',duration:f.duration||'',narrator:f.narrator||'',
    cmsSource:'wordpress'
  };
}
function contributorFromAuthor(a,old){
  return mergeMeaningful(old,{
    slug:a.slug,name:a.name,roles:a.roles||[],shortBio:a.shortBio,bio:a.bio||[],photo:a.photo||'',
    nationality:a.nationality||'',website:a.website||'',instagram:a.instagram||'',
    photoAlt:a.photoAlt||'',photoCredit:a.photoCredit||'',photoSource:a.photoSource||'',featured:a.featured,seo:a.seo||{},cmsSource:'wordpress'
  });
}
function seriesFromCms(s,old){
  return mergeMeaningful(old,{
    slug:s.slug,name:s.name,description:s.description,imprint:s.imprint,
    mainContributor:s.mainAuthor||s.mainContributor||null,workSlugs:s.workSlugs||[],banner:s.banner||'',seo:s.seo||{},cmsSource:'wordpress'
  });
}
function rebuildMaps(){
  if(typeof W!=='undefined'){Object.keys(W).forEach(k=>delete W[k]);(DATA.works||[]).forEach(w=>W[w.slug]=w);}
  if(typeof ED!=='undefined'){Object.keys(ED).forEach(k=>delete ED[k]);(DATA.editions||[]).forEach(e=>(ED[e.workSlug]??=[]).push(e));Object.values(ED).forEach(arr=>arr.sort((a,b)=>(b.displayPriority||0)-(a.displayPriority||0)));}
  if(typeof C!=='undefined'){Object.keys(C).forEach(k=>delete C[k]);(DATA.contributors||[]).forEach(c=>C[c.slug]=c);}
  if(typeof S!=='undefined'){Object.keys(S).forEach(k=>delete S[k]);(DATA.series||[]).forEach(s=>S[s.slug]=s);}
}
function applyCms(data){
  cmsData=data;window.EDIOURO_CMS_PAYLOAD=data;
  cmsBooks=new Map((data.books||[]).map(b=>[b.slug,b]));
  const worksBySlug=new Map((DATA.works||[]).map(w=>[w.slug,w]));
  for(const b of data.books||[]){
    const old=worksBySlug.get(b.slug),next=workFromBook(b,old);
    if(old)Object.assign(old,next);else{DATA.works.push(next);worksBySlug.set(b.slug,next);}
  }
  const cmsBookSlugs=new Set((data.books||[]).filter(b=>Array.isArray(b.formats)&&b.formats.length).map(b=>b.slug));
  DATA.editions=(DATA.editions||[]).filter(e=>!cmsBookSlugs.has(e.workSlug));
  for(const b of data.books||[])(b.formats||[]).forEach((f,i)=>DATA.editions.push(editionFromFormat(b,f,i)));
  const contributorsBySlug=new Map((DATA.contributors||[]).map(c=>[c.slug,c]));
  for(const a of data.authors||[]){
    const old=contributorsBySlug.get(a.slug),next=contributorFromAuthor(a,old);
    if(old)Object.assign(old,next);else{DATA.contributors.push(next);contributorsBySlug.set(a.slug,next);}
  }
  const realSeries=(data.series||[]).filter(s=>s.entityType!=='colecao');
  const seriesBySlug=new Map((DATA.series||[]).map(s=>[s.slug,s]));
  for(const s of realSeries){
    const old=seriesBySlug.get(s.slug),next=seriesFromCms(s,old);
    if(old)Object.assign(old,next);else{DATA.series.push(next);seriesBySlug.set(s.slug,next);}
  }
  cmsCollections=(data.series||[]).filter(s=>s.entityType==='colecao').map(s=>seriesFromCms(s,null));
  window.EDIOURO_CMS_COLLECTIONS=cmsCollections;
  if(typeof I!=='undefined')for(const im of data.imprints||[]){
    const old=I[im.slug]||{slug:im.slug};
    I[im.slug]=mergeMeaningful(old,{slug:im.slug,name:im.name,tagline:im.tagline,description:im.description,color:im.color,ink:im.ink,focus:im.focus,logo:im.logo,founded:im.founded,seo:im.seo});
  }
  if(typeof POSTS!=='undefined'&&Array.isArray(POSTS)&&Array.isArray(data.articles)){
    const posts=data.articles.map(p=>({slug:p.slug,title:p.title,kind:p.kind,standfirst:p.standfirst,image:p.image,body:p.body||[],relatedWorks:p.relatedBooks||[],relatedImprint:p.relatedImprint||null,relatedAuthors:p.relatedAuthors||[],relatedSeries:p.relatedSeries||[],publishedAt:p.publishedAt,readingTime:p.readingTime,seo:p.seo||{}}));
    POSTS.splice(0,POSTS.length,...posts);
  }
  rebuildMaps();
}

function selectedEdition(slug,params){
  const eds=(typeof ED!=='undefined'&&ED[slug])||[];
  let id=params?.get?.('edicao')||'',e=eds.find(x=>x.id===id);
  if(!e&&params?.get?.('formato')==='ebook')e=eds.find(x=>x.format==='livro-digital');
  if(!e)e=eds.find(x=>x.status==='em-catalogo'&&x.format!=='livro-digital')||eds[0];
  return e||{};
}
function retailerHtml(e){
  return (e.retailerLinks||[]).filter(x=>x&&x.url).map(x=>'<div class="retail" onclick="window.open('+JSON.stringify(x.url)+',\'_blank\')">'+esc(x.name||'Loja')+' <span>↗</span></div>').join('');
}
function patchBookPage(){
  if(typeof bookPage!=='function')return;
  const before=bookPage;
  bookPage=function(slug,params){
    const html=before(slug,params);if(mode!=='cms'||!cmsBooks.has(slug))return html;
    const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
    const eds=(typeof ED!=='undefined'&&ED[slug])||[],selected=selectedEdition(slug,params);
    const label=main.querySelector('.edition-label');if(label)label.textContent='ESCOLHA O FORMATO';
    const tabs=main.querySelector('.editions');if(tabs)tabs.innerHTML=eds.map(e=>'<button class="ed '+(e.id===selected.id?'active':'')+'" onclick="selectEdition('+JSON.stringify(slug)+','+JSON.stringify(e.id)+')">'+esc(e.label||formatLabel(e.format))+'<small>'+(money(e.price)||'')+'</small></button>').join('');
    const price=main.querySelector('.price');if(price)price.innerHTML='<span style="display:block;font:700 9px/1.2 \'Archivo\',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7c736b;margin-bottom:5px">Preço sugerido</span>'+(money(selected.price)||'—');
    const retailTitle=main.querySelector('.retail-title');if(retailTitle)retailTitle.textContent='ONDE COMPRAR';
    const retail=main.querySelector('.retail-grid');if(retail)retail.innerHTML=retailerHtml(selected);
    const meta=main.querySelector('.meta-grid');
    if(meta){
      const physical=selected.format!=='livro-digital'&&selected.format!=='audiolivro';
      const left=[['Formato',selected.label||formatLabel(selected.format)],['ISBN',selected.isbn||'—']];
      if(physical)left.splice(1,0,['Páginas',selected.pageCount||'—']);
      else if(selected.format==='livro-digital')left.splice(1,0,['Arquivo',selected.digitalFormat||'Digital']);
      else if(selected.format==='audiolivro'&&selected.duration)left.splice(1,0,['Duração',selected.duration]);
      const right=[];
      if(physical){right.push(['Acabamento',selected.binding||selected.label||'—'],['Dimensões',selected.dimensions||'—']);}
      if(selected.format==='audiolivro'&&selected.narrator)right.push(['Narração',selected.narrator]);
      right.push(['Status',statusLabel(selected.status)]);
      if(selected.ean&&selected.ean!==selected.isbn)right.push(['EAN',selected.ean]);
      const col=rows=>'<div>'+rows.map(([k,v])=>'<div class="meta-row"><span>'+esc(k)+'</span><strong>'+esc(String(v||'—'))+'</strong></div>').join('')+'</div>';
      meta.innerHTML=col(left)+col(right);
    }
    return main.outerHTML;
  };
}
function collectionCover(slug){const w=W[slug];return w&&typeof cover==='function'?cover(w):'';}
function cmsCollectionsList(){
  return '<main class="collections-v1"><div class="page-hero"><div class="wrap"><div class="eyebrow">Coleções Ediouro</div><h1>Livros que pertencem juntos.</h1><p>Coleções editoriais que reúnem livros por projeto, autor e acabamento.</p></div></div><section><div class="wrap"><div class="collections-grid">'+cmsCollections.map(c=>{const im=I[c.imprint]||I.trama;return '<article class="collection-tile" style="--collection-color:'+im.color+'" onclick="go(\'/colecoes/'+c.slug+'\')"><div class="eyebrow">'+esc(im.name||'Ediouro')+'</div><h2>'+esc(c.name)+'</h2><p>'+c.workSlugs.length+' '+(c.workSlugs.length===1?'livro':'livros')+'</p><div class="collection-covers">'+c.workSlugs.slice(0,3).map(collectionCover).join('')+'</div><span>Ver coleção →</span></article>';}).join('')+'</div></div></section></main>';
}
function cmsCollectionPage(slug){
  const c=cmsCollections.find(x=>x.slug===slug);if(!c)return typeof notFound==='function'?notFound():'';
  const im=I[c.imprint]||I.trama,works=c.workSlugs.map(s=>W[s]).filter(Boolean);
  return '<main class="collections-v1"><div class="collection-hero" style="background:'+im.color+';color:'+im.ink+'"><div class="wrap"><div class="eyebrow" style="color:inherit;opacity:.72">'+esc(im.name||'Ediouro')+'</div><h1>'+esc(c.name)+'</h1><p>'+works.length+' '+(works.length===1?'livro':'livros')+'</p></div></div><section><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Coleção</div><h2>Livros da coleção</h2></div><div class="result-summary">'+works.length+' títulos</div></div><div class="catalog-grid">'+works.map(bookCard).join('')+'</div></div></section></main>';
}
function patchRouter(){
  if(typeof router!=='function')return;
  const before=router;
  router=function(){
    if(mode==='cms'&&cmsCollections.length){
      const raw=location.hash.slice(1)||'/',path=raw.split('?')[0];
      if(path==='/colecoes'||path.startsWith('/colecoes/')){
        const body=path==='/colecoes'?cmsCollectionsList():cmsCollectionPage(decodeURIComponent(path.split('/')[2]||''));
        document.getElementById('app').innerHTML=header()+body+footer();scrollTo(0,0);return;
      }
    }
    return before();
  };
}

async function boot(){
  try{
    if(mode==='shadow'){
      const r=await fetch('/api/cms?summary=1',{cache:'no-cache'});if(!r.ok)throw new Error('CMS bridge '+r.status);
      const audit=await r.json();window.EDIOURO_CMS_SYNC={status:'shadow-ready',mode,...audit,checkedAt:new Date().toISOString()};return;
    }
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);let r;try{r=await fetch('/api/cms',{cache:'no-cache',signal:controller.signal});}finally{clearTimeout(timer)}if(!r.ok)throw new Error('CMS bridge '+r.status);
    const data=await r.json();if(!data?.ok)throw new Error('CMS payload inválido');
    applyCms(data);patchBookPage();patchRouter();
    window.EDIOURO_CMS_SYNC={status:'cms-ready',mode,version:data.version,source:data.source,books:(data.books||[]).length,collections:cmsCollections.length,series:(data.series||[]).filter(x=>x.entityType!=='colecao').length,checkedAt:new Date().toISOString()};
  }catch(err){
    console.warn('[Ediouro CMS] fallback para o site estático:',err);
    window.EDIOURO_CMS_SYNC={status:'fallback',mode,error:String(err),checkedAt:new Date().toISOString()};
  }
}
window.ediouroCmsBootstrap=function(){if(!bootPromise)bootPromise=boot();return bootPromise;};
if(mode==='cms'){
  const startCms=()=>{
    window.ediouroCmsBootstrap().finally(()=>{
      if(window.EDIOURO_CMS_SYNC?.status==='cms-ready'&&typeof router==='function'){
        try{router();}catch(e){console.warn('[Ediouro CMS] rerender falhou',e)}
      }
    });
  };
  Promise.resolve().then(startCms);
}
})();