(function(){
let bootPromise=null;
const meaningful=v=>{
  if(v===null||v===undefined)return false;
  if(typeof v==='string')return v.trim()!=='';
  if(Array.isArray(v))return v.length>0;
  if(typeof v==='object')return Object.keys(v).length>0;
  return true;
};
const mergeReal=(base,next)=>{
  const out={...(base||{})};
  for(const [k,v] of Object.entries(next||{}))if(meaningful(v))out[k]=v;
  return out;
};
const digits=v=>String(v||'').replace(/\D/g,'');
const paras=v=>{
  if(Array.isArray(v))return v.filter(Boolean);
  return String(v||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
};
const mapSlug=(slug,map)=>map.get(slug)||slug;

function rebuildMaps(){
  if(typeof W!=='undefined'){
    Object.keys(W).forEach(k=>delete W[k]);
    (DATA.works||[]).forEach(w=>W[w.slug]=w);
  }
  if(typeof ED!=='undefined'){
    Object.keys(ED).forEach(k=>delete ED[k]);
    (DATA.editions||[]).forEach(e=>(ED[e.workSlug]??=[]).push(e));
    Object.values(ED).forEach(a=>a.sort((x,y)=>(y.displayPriority||0)-(x.displayPriority||0)));
  }
  if(typeof C!=='undefined'){
    Object.keys(C).forEach(k=>delete C[k]);
    (DATA.contributors||[]).forEach(c=>C[c.slug]=c);
  }
  if(typeof S!=='undefined'){
    Object.keys(S).forEach(k=>delete S[k]);
    (DATA.series||[]).forEach(s=>S[s.slug]=s);
  }
  if(typeof P!=='undefined'&&typeof POSTS!=='undefined'){
    Object.keys(P).forEach(k=>delete P[k]);
    POSTS.forEach(p=>P[p.slug]=p);
  }
  if(typeof I!=='undefined'&&typeof IMPRINTS!=='undefined'){
    Object.keys(I).forEach(k=>delete I[k]);
    IMPRINTS.forEach(im=>I[im.slug]=im);
  }
}

function workFromBook(b,targetSlug,slugMap){
  const education=b.education?.enabled?{
    section:b.education.stage||'',
    label:(typeof EDUCATION_SECTIONS!=='undefined'?(EDUCATION_SECTIONS.find(x=>x.key===b.education.stage)?.label||''):''),
    age:b.education.age||'',genre:b.education.genre||'',themes:b.education.themes||'',
    transversal:b.education.transversal||'',note:b.education.note||'',source:'wordpress-cms'
  }:null;
  return {
    id:b.id,slug:targetSlug,title:b.title,subtitle:b.subtitle,
    shortDescription:b.shortDescription,
    description:paras(b.description),
    credits:(b.authors||[]).map((slug,i)=>({contributor:slug,role:'autor',order:i+1})),
    imprint:b.imprint,
    collections:(b.collections||[]),
    categories:(b.categories||[]),
    series:b.series||null,
    seriesOrder:b.seriesOrder==null?null:Number(b.seriesOrder),
    relatedBooks:(b.relatedBooks||[]).map(x=>mapSlug(x,slugMap)),
    relatedArticles:b.relatedArticles||[],
    education,
    seoTitle:b.seo?.title,seoDescription:b.seo?.description,
    ogImage:b.ogImage||'',
    source:{system:'wordpress-cms'}
  };
}
function editionFromFormat(b,f,index,targetSlug){
  const isbn=digits(f.isbn||f.ean);
  const type=f.type||'brochura';
  return {
    id:'wp-'+b.id+'-'+(isbn||index),workSlug:targetSlug,
    label:f.label||({'brochura':'Brochura','capa-dura':'Capa dura','livro-digital':'Livro digital','audiolivro':'Audiolivro'}[type]||type),
    format:type,publicationDate:f.publication_date||'',language:'pt-BR',
    status:f.status||'em-catalogo',source:{system:'wordpress-cms'},
    binding:f.binding||'',isbn:f.isbn||'',ean:f.ean||f.isbn||'',
    pageCount:f.page_count?Number(f.page_count):null,dimensions:f.dimensions||'',
    cover:f.cover||b.cover||'',gallery:[],
    price:(f.price===null||f.price===undefined||f.price==='')?null:Number(f.price),
    currency:'BRL',credits:[],displayPriority:1000-index,
    retailerLinks:(f.retailers||[]).filter(r=>r&&r.url).map(r=>({name:r.name||r.key||'Loja',url:r.url,key:r.key||''})),
    availabilityNote:f.availability_note||'',digitalFormat:f.digital_format||'',
    duration:f.duration||'',narrator:f.narrator||'',cmsManaged:true
  };
}
function authorFromCms(a){
  return {
    slug:a.slug,name:a.name,roles:(a.roles||[]).length?a.roles:['autor'],
    shortBio:a.shortBio||'',bio:paras(a.bio),photo:a.photo||'',
    photoAlt:a.photoAlt||'',photoCredit:a.photoCredit||'',photoSource:a.photoSource||'',
    nationality:a.nationality||'',website:a.website||'',instagram:a.instagram||'',
    featured:!!a.featured,seo:a.seo||{},source:{system:'wordpress-cms'}
  };
}
function seriesFromCms(x,slugMap){
  return {
    slug:x.slug,name:x.name,description:x.description||'',imprint:x.imprint||'',
    mainContributor:x.mainAuthor||null,
    workSlugs:(x.workSlugs||[]).map(s=>mapSlug(s,slugMap)),
    relatedArticles:x.relatedArticles||[],banner:x.banner||'',seo:x.seo||{},
    source:{system:'wordpress-cms'}
  };
}
function articleFromCms(p,slugMap){
  return {
    slug:p.slug,title:p.title,kind:p.kind||'Guia',standfirst:p.standfirst||'',
    image:p.image||'',body:paras(p.body),
    relatedWorks:(p.relatedBooks||[]).map(s=>mapSlug(s,slugMap)),
    relatedImprint:p.relatedImprint||null,relatedAuthors:p.relatedAuthors||[],
    relatedSeries:p.relatedSeries||[],publishedAt:p.publishedAt||'',
    readingTime:Number(p.readingTime||0),featured:!!p.featured,seo:p.seo||{},
    source:{system:'wordpress-cms'}
  };
}


function installCmsCommerceRenderer(){
  if(typeof bookPage!=='function'||window.__EDIOURO_CMS_COMMERCE_PATCHED)return;
  window.ediouroSelectCmsEdition=function(slug,id){
    const next='#/livros/'+slug+'?edicao='+encodeURIComponent(id);
    if(location.hash===next)window.dispatchEvent(new Event('hashchange'));
    else location.hash=next;
  };
  window.__EDIOURO_CMS_COMMERCE_PATCHED=true;
  const before=bookPage;
  const label=t=>({'brochura':'Brochura','capa-dura':'Capa dura','livro-digital':'Livro digital','audiolivro':'Audiolivro'}[t]||t||'Edição');
  const status=s=>({'em-catalogo':'Em catálogo','pre-venda':'Pré-venda','lancamento-futuro':'Lançamento futuro','indisponivel':'Indisponível'}[s]||s||'—');
  bookPage=function(slug,params){
    let html=before(slug,params);
    const w=typeof W!=='undefined'?W[slug]:null;
    if(!w)return html;
    const eds=(typeof ED!=='undefined'&&ED[slug])||[];
    if(!eds.some(e=>e.cmsManaged))return html;

    const requested=params?.get?.('edicao')||'';
    const ebookMode=params?.get?.('formato')==='ebook';

    // Mostra todas as edições válidas. Não colapsamos duas brochuras diferentes.
    // Quando um formato digital aponta para um print_isbn, esse impresso é o canônico.
    const canonicalPrintIsbn=eds.map(e=>digits(e?.source?.print_isbn||'')).find(Boolean)||'';
    const visibleEds=[...eds].sort((a,b)=>{
      const ai=digits(a.isbn||a.ean),bi=digits(b.isbn||b.ean);
      const ac=canonicalPrintIsbn&&ai===canonicalPrintIsbn?1:0,bc=canonicalPrintIsbn&&bi===canonicalPrintIsbn?1:0;
      if(ac!==bc)return bc-ac;
      const ad=a.format==='livro-digital'||a.format==='audiolivro'?1:0,bd=b.format==='livro-digital'||b.format==='audiolivro'?1:0;
      if(ad!==bd)return ad-bd;
      return (b.displayPriority||0)-(a.displayPriority||0)||String(b.publicationDate||'').localeCompare(String(a.publicationDate||''));
    });
    let ed=eds.find(e=>e.id===requested);
    if(!ed&&ebookMode)ed=visibleEds.find(e=>e.format==='livro-digital');
    if(!ed&&canonicalPrintIsbn)ed=visibleEds.find(e=>digits(e.isbn||e.ean)===canonicalPrintIsbn);
    if(!ed)ed=(typeof principal==='function'?principal(w):null)||visibleEds[0]||eds[0]||null;
    if(!ed)return html;

    const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');
    if(!main)return html;

    // Formatos visíveis = formatos atuais do WordPress, sem duplicar histórico.
    const tabs=main.querySelector('.editions');
    if(tabs){
      const jsq=v=>String(v||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      tabs.innerHTML=visibleEds.map(e=>
        '<button class="ed '+(e.id===ed.id?'active':'')+'" onclick="window.ediouroSelectCmsEdition(\''+jsq(slug)+'\',\''+jsq(e.id)+'\')">'+
        esc(e.label||label(e.format))+'<small>'+(typeof money==='function'&&e.price!=null?money(e.price):'')+'</small></button>'
      ).join('');
    }
    const editionLabel=main.querySelector('.edition-label');
    if(editionLabel)editionLabel.textContent='ESCOLHA O FORMATO';

    // Onde comprar = somente links cadastrados no CMS. Nada de URL inventada.
    const links=Array.isArray(ed.retailerLinks)?ed.retailerLinks.filter(x=>x&&x.url):[];
    const retailTitle=main.querySelector('.retail-title');
    const retailGrid=main.querySelector('.retail-grid');
    if(retailTitle&&retailGrid){
      if(links.length){
        retailTitle.textContent=ed.format==='livro-digital'?'ONDE COMPRAR O E-BOOK':'ONDE COMPRAR';
        retailTitle.style.display='';
        retailGrid.style.display='';
        retailGrid.innerHTML=links.map(x=>
          '<a class="retail" href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:inherit">'+esc(x.name||x.key||'Loja')+' <span>↗</span></a>'
        ).join('');
      }else{
        retailTitle.style.display='none';
        retailGrid.innerHTML='';
        retailGrid.style.display='none';
      }
    }
    main.querySelectorAll('.ebook-note,.ebook-status').forEach(x=>x.remove());

    // Ficha técnica também vem do formato CMS selecionado.
    const meta=main.querySelector('.meta-grid');
    if(meta){
      const left=[['Formato',ed.label||label(ed.format)]];
      if(ed.format==='livro-digital'){
        if(ed.digitalFormat)left.push(['Arquivo',ed.digitalFormat]);
      }else if(ed.format==='audiolivro'){
        if(ed.duration)left.push(['Duração',ed.duration]);
        if(ed.narrator)left.push(['Narração',ed.narrator]);
      }else{
        if(ed.pageCount)left.push(['Páginas',ed.pageCount]);
      }
      if(ed.isbn)left.push(['ISBN',ed.isbn]);
      const right=[];
      if(!['livro-digital','audiolivro'].includes(ed.format)){
        if(ed.binding)right.push(['Acabamento',ed.binding]);
        if(ed.dimensions)right.push(['Dimensões',ed.dimensions]);
      }
      right.push(['Status',status(ed.status)]);
      if(ed.ean&&ed.ean!==ed.isbn)right.push(['EAN',ed.ean]);
      const col=rows=>'<div>'+rows.map(([k,v])=>'<div class="meta-row"><span>'+esc(k)+'</span><strong>'+esc(String(v||'—'))+'</strong></div>').join('')+'</div>';
      meta.innerHTML=col(left)+col(right);
    }
    const price=main.querySelector('.price');
    if(price){
      price.innerHTML='<span style="display:block;font:700 9px/1.2 \'Archivo\',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7c736b;margin-bottom:5px">Preço sugerido</span>'+
        ((typeof money==='function'&&ed.price!=null)?money(ed.price):'—');
    }
    return main.outerHTML;
  };
}

async function sync(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  let r;
  try{r=await fetch('/api/cms?_ediouro_ts='+Date.now(),{cache:'no-store',signal:controller.signal,headers:{'cache-control':'no-cache'}});}
  finally{clearTimeout(timer);}
  if(!r.ok)throw new Error('CMS bridge '+r.status);
  const data=await r.json();
  if(!data?.ok||!Array.isArray(data.books))throw new Error('payload CMS inválido');

  // ISBN é a âncora segura: mantém as URLs que o preview já usa.
  const staticWorksSnapshot=(DATA.works||[]).map(w=>({slug:w.slug,title:w.title}));
  const staticByIsbn=new Map();
  for(const e of DATA.editions||[]){
    const k=digits(e.isbn||e.ean);
    if(k.length===13&&!staticByIsbn.has(k))staticByIsbn.set(k,e);
  }
  const slugMap=new Map();
  for(const b of data.books){
    for(const f of b.formats||[]){
      const old=staticByIsbn.get(digits(f.isbn||f.ean));
      if(old?.workSlug){slugMap.set(b.slug,old.workSlug);break;}
    }
  }

  // Livros: WordPress é autoritativo para o cadastro editorial.
  // Campos vazios no CMS também são verdade: não herdamos título, descrição,
  // autores, categorias, série ou relações da camada estática.
  // Educação fica preservada nesta fase e será migrada separadamente.
  const worksBySlug=new Map((DATA.works||[]).map(w=>[w.slug,w]));
  for(const b of data.books){
    const target=mapSlug(b.slug,slugMap),next=workFromBook(b,target,slugMap),old=worksBySlug.get(target);
    if(old){
      const legacyEducation=old.education;
      Object.assign(old,next);
      if(!next.education&&legacyEducation)old.education=legacyEducation;
    }else{
      DATA.works.push(next);worksBySlug.set(target,next);
    }
  }

  // Formatos em transição segura: o CMS sobrescreve a mesma edição por ISBN,
  // mas uma edição legada válida não desaparece só porque ainda não chegou ao CMS.
  const cmsTargets=new Set(data.books.map(b=>mapSlug(b.slug,slugMap)));
  const orphanStatic=staticWorksSnapshot.filter(w=>!cmsTargets.has(w.slug));
  window.EDIOURO_CMS_CATALOG_AUDIT={
    staticWorks:staticWorksSnapshot.length,cmsBooks:data.books.length,
    mappedCmsBooks:cmsTargets.size,orphanCount:orphanStatic.length,orphans:orphanStatic
  };
  try{
    fetch('/api/audit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(window.EDIOURO_CMS_CATALOG_AUDIT),keepalive:true}).catch(()=>{});
  }catch(_){}
  const editionIndex=new Map();
  for(const e of DATA.editions||[]){
    const k=digits(e.isbn||e.ean);if(k)editionIndex.set(k,e);
  }
  for(const b of data.books){
    const target=mapSlug(b.slug,slugMap);
    for(const [i,f] of (b.formats||[]).entries()){
      const next=editionFromFormat(b,f,i,target),k=digits(next.isbn||next.ean),old=k?editionIndex.get(k):null;
      if(old){
        const legacySource={...(old.source||{})};
        Object.assign(old,next);
        old.source={...legacySource,...(next.source||{})};
      }else{
        DATA.editions.push(next);if(k)editionIndex.set(k,next);
      }
    }
  }

  // Autores: WordPress é autoritativo para campos editoriais.
  const contributorsBySlug=new Map((DATA.contributors||[]).map(c=>[c.slug,c]));
  for(const a of data.authors||[]){
    const next=authorFromCms(a),old=contributorsBySlug.get(next.slug);
    if(old)Object.assign(old,next);
    else{DATA.contributors.push(next);contributorsBySlug.set(next.slug,next);}
  }

  // Selos: WordPress é autoritativo, preservando apenas a identidade do objeto em memória.
  if(typeof IMPRINTS!=='undefined'){
    const imprintsBySlug=new Map(IMPRINTS.map(x=>[x.slug,x]));
    for(const im of data.imprints||[]){
      const next={slug:im.slug,name:im.name,tagline:im.tagline||'',description:im.description||'',logo:im.logo||'',color:im.color||'',ink:im.ink||'',focus:im.focus||[],founded:im.founded||'',heroBooks:(im.heroBooks||[]).map(s=>mapSlug(s,slugMap)),featuredBooks:(im.featuredBooks||[]).map(s=>mapSlug(s,slugMap)),featuredSeries:im.featuredSeries||[],featuredAuthors:im.featuredAuthors||[],featuredArticles:im.featuredArticles||[],seo:im.seo||{},source:{system:'wordpress-cms'}};
      const old=imprintsBySlug.get(next.slug);
      if(old)Object.assign(old,next);
      else{IMPRINTS.push(next);imprintsBySlug.set(next.slug,next);}
    }
  }

  // Séries verdadeiras: WordPress é autoritativo. Coleções usam a estrutura nativa alimentada pelo CMS.
  const cmsSeries=(data.series||[]).filter(x=>(x.entityType||'serie')!=='colecao');
  const seriesBySlug=new Map((DATA.series||[]).map(x=>[x.slug,x]));
  for(const row of cmsSeries){
    const next=seriesFromCms(row,slugMap),old=seriesBySlug.get(next.slug);
    if(old)Object.assign(old,next);
    else{DATA.series.push(next);seriesBySlug.set(next.slug,next);}
  }
  const cmsCollections=(data.series||[]).filter(x=>x.entityType==='colecao');
  window.EDIOURO_CMS_COLLECTIONS=cmsCollections.map(x=>seriesFromCms(x,slugMap));

  // Coleções: alimenta as MESMAS estruturas nativas já usadas pelo preview.
  if(typeof COLLECTIONS!=='undefined'&&Array.isArray(COLLECTIONS)&&typeof collectionMap!=='undefined'){
    COLLECTIONS.splice(0,COLLECTIONS.length);
    collectionMap.clear();
    if(typeof editionCollectionsV!=='undefined'){
      for(const key of Object.keys(editionCollectionsV))delete editionCollectionsV[key];
    }
    for(const w of DATA.works||[])w.collections=[];
    const pickEdition=w=>{
      const eds=(ED[w.slug]||[]);
      return eds.find(e=>(e.status==='em-catalogo'||e.status==='pre-venda')&&!['livro-digital','audiolivro'].includes(e.format))
        ||eds.find(e=>!['livro-digital','audiolivro'].includes(e.format))
        ||(typeof principal==='function'?principal(w):eds[0])
        ||eds[0]||null;
    };
    for(const row of cmsCollections){
      const entries=[];
      for(const rawSlug of row.workSlugs||[]){
        const slug=mapSlug(rawSlug,slugMap),w=W[slug];
        if(!w)continue;
        const edition=pickEdition(w);
        if(!edition)continue;
        entries.push({work:w,edition});
      }
      const col={
        slug:row.slug,baseName:row.name,name:row.name,imprint:row.imprint||entries[0]?.work?.imprint||'',
        hardcover:false,kind:row.mainAuthor?'author':'cms',entries
      };
      if(!entries.length)continue;
      COLLECTIONS.push(col);collectionMap.set(col.slug,col);
      for(const entry of entries){
        if(typeof editionCollectionsV!=='undefined'){
          (editionCollectionsV[entry.edition.id]??=[]).push(col.slug);
        }
        if(!entry.work.collections.includes(col.slug))entry.work.collections.push(col.slug);
      }
    }
    const homeCols=data.routes?.home?.relations?.collections||[];
    if(homeCols.length){
      const rank=new Map(homeCols.map((slug,i)=>[slug,i]));
      COLLECTIONS.sort((a,b)=>{
        const ar=rank.has(a.slug)?rank.get(a.slug):9999,br=rank.has(b.slug)?rank.get(b.slug):9999;
        if(ar!==br)return ar-br;
        const ad=a.entries[0]?.edition?.publicationDate||'',bd=b.entries[0]?.edition?.publicationDate||'';
        return bd.localeCompare(ad)||a.name.localeCompare(b.name,'pt-BR');
      });
    }
    if(typeof editionCollectionsV!=='undefined')window.EDIOURO_EDITION_COLLECTIONS=editionCollectionsV;
    window.EDIOURO_COLLECTIONS=COLLECTIONS;
  }

  // Descubra: WordPress é autoritativo nos artigos e a curadoria do índice define a ordem quando existe.
  if(typeof POSTS!=='undefined'){
    const postsBySlug=new Map(POSTS.map(p=>[p.slug,p]));
    for(const row of data.articles||[]){
      const next=articleFromCms(row,slugMap),old=postsBySlug.get(next.slug);
      if(old)Object.assign(old,next);
      else{POSTS.push(next);postsBySlug.set(next.slug,next);}
    }
    const dr=data.routes?.['discover-index']?.relations||{};
    const order=[dr.featured,...(dr.selected||[])].filter(Boolean);
    if(order.length){
      const rank=new Map(order.map((slug,i)=>[slug,i]));
      POSTS.sort((a,b)=>(rank.has(a.slug)?rank.get(a.slug):9999)-(rank.has(b.slug)?rank.get(b.slug):9999)||String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));
    }
  }

  // Home: troca apenas seleções que estejam efetivamente preenchidas no CMS.
  const hr=data.routes?.home?.relations||{};
  if(typeof CUR!=='undefined'){
    if(hr.heroBooks?.length)CUR.hero=hr.heroBooks.map(s=>mapSlug(s,slugMap));
    if(hr.arrivals?.length)CUR.arrivals=hr.arrivals.map(s=>mapSlug(s,slugMap));
    if(hr.reading?.length)CUR.reading=hr.reading.map(s=>mapSlug(s,slugMap));
    if(hr.authors?.length)CUR.authors=[...hr.authors];
    if(hr.placement1Books?.length)CUR.cosmere=hr.placement1Books.map(s=>mapSlug(s,slugMap));
  }

  // Etapas pedagógicas: só atualiza rótulos/idades, sem mudar a estrutura da página.
  if(typeof EDUCATION_SECTIONS!=='undefined'&&Array.isArray(EDUCATION_SECTIONS)){
    const byKey=new Map(EDUCATION_SECTIONS.map(x=>[x.key,x]));
    for(const st of data.educationStages||[]){
      const old=byKey.get(st.slug);
      if(old){if(st.name)old.label=st.name;if(st.age)old.age=st.age;}
    }
  }
  if(typeof EDU_ARCHIVE_SECTIONS!=='undefined'&&Array.isArray(EDU_ARCHIVE_SECTIONS)){
    const byKey=new Map(EDU_ARCHIVE_SECTIONS.map(x=>[x.key,x]));
    for(const st of data.educationStages||[]){
      const old=byKey.get(st.slug);
      if(old){if(st.name)old.label=st.name;if(st.age)old.age=st.age;}
    }
  }

  rebuildMaps();
  installCmsCommerceRenderer();
  window.EDIOURO_CMS_PAYLOAD=data;
  window.EDIOURO_CMS_SYNC={
    status:'ready',mode:'data-layer',source:data.source||'wordpress-cms',version:data.version,
    books:(data.books||[]).length,authors:(data.authors||[]).length,
    imprints:(data.imprints||[]).length,series:cmsSeries.length,
    collections:window.EDIOURO_CMS_COLLECTIONS.length,articles:(data.articles||[]).length,
    syncedAt:new Date().toISOString()
  };

  // Reexecuta o MESMO sistema de rotas do preview. Nenhum HTML é remontado aqui.
  const refresh=()=>{try{window.dispatchEvent(new Event('hashchange'));}catch(e){console.warn('[Ediouro CMS] refresh',e);}};
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});
  else setTimeout(refresh,0);
}

window.ediouroCmsBootstrap=function(){
  if(bootPromise)return bootPromise;
  bootPromise=sync().catch(err=>{
    console.warn('[Ediouro CMS] fallback integral para preview estático:',err);
    window.EDIOURO_CMS_SYNC={status:'fallback',mode:'data-layer',error:String(err),syncedAt:new Date().toISOString()};
  });
  return bootPromise;
};

// O site estático renderiza normalmente. A sincronização acontece em paralelo.
window.ediouroCmsBootstrap();
})();