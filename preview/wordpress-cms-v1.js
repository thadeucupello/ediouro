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
  if(typeof P!=='undefined'&&typeof POSTS!=='undefined'){Object.keys(P).forEach(k=>delete P[k]);(POSTS||[]).forEach(p=>P[p.slug]=p);}
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
    Object.assign(old,mergeMeaningful(old,{slug:im.slug,name:im.name,tagline:im.tagline,description:im.description,color:im.color,ink:im.ink,focus:im.focus,logo:im.logo,founded:im.founded,seo:im.seo}));
    I[im.slug]=old;
    if(typeof IMPRINTS!=='undefined'&&Array.isArray(IMPRINTS)&&!IMPRINTS.some(x=>x.slug===im.slug))IMPRINTS.push(old);
  }
  if(typeof POSTS!=='undefined'&&Array.isArray(POSTS)&&Array.isArray(data.articles)){
    let posts=data.articles.map(p=>({slug:p.slug,title:p.title,kind:p.kind,standfirst:p.standfirst,image:p.image,body:p.body||[],relatedWorks:p.relatedBooks||[],relatedImprint:p.relatedImprint||null,relatedAuthors:p.relatedAuthors||[],relatedSeries:p.relatedSeries||[],publishedAt:p.publishedAt,readingTime:p.readingTime,featured:p.featured,seo:p.seo||{}}));
    const dr=data.routes?.['discover-index']?.relations||{},order=[dr.featured,...(dr.selected||[])].filter(Boolean);
    if(order.length){const rank=new Map(order.map((slug,i)=>[slug,i]));posts.sort((a,b)=>(rank.has(a.slug)?rank.get(a.slug):9999)-(rank.has(b.slug)?rank.get(b.slug):9999)||String(b.publishedAt||'').localeCompare(String(a.publishedAt||'')));}
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


function patchHomePage(){
  if(typeof home!=='function')return;
  const before=home;
  const action=(el,url)=>{
    if(!el||!url)return;
    el.setAttribute('onclick',/^https?:\/\//i.test(url)?'window.open('+JSON.stringify(url)+',"_blank")':'go('+JSON.stringify(url)+')');
  };
  const books=slugs=>(slugs||[]).map(x=>W[x]).filter(Boolean);
  const shelf=slugs=>books(slugs).map(bookCard).join('');
  const set=(root,selector,value,html=false)=>{
    if(value===undefined||value===null||value==='')return;
    const el=root.querySelector(selector);if(!el)return;
    if(html)el.innerHTML=value;else el.textContent=value;
  };
  const sectionByHeading=(main,label)=>[...main.querySelectorAll('section')].find(sec=>[...sec.querySelectorAll('h2')].some(h=>h.textContent.trim()===label));
  const updatePlacement=(card,prefix,relations,image)=>{
    if(!card)return;
    const f=cmsData.routes.home.fields||{};
    set(card,'.placement-copy .eyebrow',f[prefix+'_eyebrow']);
    set(card,'.placement-copy h2',f[prefix+'_title']);
    set(card,'.placement-copy p',f[prefix+'_text']);
    const cta=card.querySelector('.placement-copy .cta');
    if(cta){cta.textContent=f[prefix+'_cta']||cta.textContent;action(cta,f[prefix+'_url']);}
    const media=card.querySelector('.placement-media');
    if(media){
      const badge=media.querySelector('.placement-badge')?.outerHTML||'<div class="placement-badge">Placement editorial · imagem/campanha</div>';
      if(image){
        media.innerHTML='<img src="'+esc(image)+'" alt="" style="width:100%;height:100%;min-height:320px;object-fit:cover;display:block">'+badge;
      }else{
        const collage=media.querySelector('.placement-collage');
        if(collage&&relations?.length)collage.innerHTML=books(relations).slice(0,3).map(w=>cover(w)).join('');
      }
    }
  };
  home=function(){
    const html=before();
    if(mode!=='cms'||!cmsData?.routes?.home)return html;
    const cfg=cmsData.routes.home, f=cfg.fields||{}, rel=cfg.relations||{}, rep=cfg.repeaters||{};
    const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;

    const hero=main.querySelector('.hero');
    if(hero){
      set(hero,'.eyebrow',f.hero_eyebrow);set(hero,'h1',f.hero_title);set(hero,'.lead',f.hero_lead);
      const input=hero.querySelector('.searchbox input');if(input&&f.search_placeholder)input.placeholder=f.search_placeholder;
      set(hero,'.searchbox button',f.search_button);
      const ex=hero.querySelector('.examples');
      if(ex&&Array.isArray(rep.search_examples)&&rep.search_examples.length){
        ex.innerHTML=rep.search_examples.map(x=>'<span class="chip" onclick="searchFor('+JSON.stringify(String(x.query||''))+')">'+esc(x.label||x.query||'')+'</span>').join('');
      }
      const hc=hero.querySelector('.hero-covers');
      if(hc&&rel.heroBooks?.length){
        const chosen=books(rel.heroBooks).slice(0,2);
        hc.innerHTML=chosen.map(w=>'<div class="hero-cover real" onclick="go('+JSON.stringify('/livros/'+w.slug)+')">'+cover(w)+'</div>').join('');
        if(chosen.length<2)hc.innerHTML+='<div class="hero-cover hero-placeholder"><div>Em breve<span>novo destaque</span></div></div>';
      }
    }

    const interests=[...main.querySelectorAll('section')].find(sec=>sec.querySelector('.cats'));
    if(interests){
      set(interests,'.sec-head h2',f.interest_title);
      const head=interests.querySelector('.sec-head>div');
      if(head&&f.interest_eyebrow&&!head.querySelector('.eyebrow'))head.insertAdjacentHTML('afterbegin','<div class="eyebrow">'+esc(f.interest_eyebrow)+'</div>');
      if(head&&f.interest_intro){
        let p=head.querySelector('p');if(!p){p=doc.createElement('p');head.appendChild(p);}p.textContent=f.interest_intro;
      }
      const link=interests.querySelector('.sec-head .link');if(link&&f.interest_link_label)link.textContent=f.interest_link_label;
      const catMap=new Map((cmsData.categories||[]).map(c=>[c.slug,c]));
      const selected=(rel.categories||[]).map(x=>catMap.get(x)).filter(Boolean);
      const cats=interests.querySelector('.cats');
      if(cats&&selected.length)cats.innerHTML=selected.map(c=>'<div class="cat" style="background:'+(c.color||'#514b45')+';color:'+(c.ink||'#fff')+'" onclick="go('+JSON.stringify('/categorias/'+c.slug)+')"><h3>'+esc(c.name)+'</h3>'+(c.shortDescription?'<p>'+esc(c.shortDescription)+'</p>':'')+'<strong>'+esc((c.name||'?').charAt(0).toUpperCase())+'</strong></div>').join('');
    }

    const arrivals=sectionByHeading(main,'Acabaram de chegar');
    if(arrivals){set(arrivals,'.sec-head h2',f.arrivals_title);const sh=arrivals.querySelector('.shelf');if(sh&&rel.arrivals?.length)sh.innerHTML=shelf(rel.arrivals);}

    const placements=[...main.querySelectorAll('.editorial-placement .placement-card')];
    updatePlacement(placements[0],'placement1',rel.placement1Books,rel.placement1Image);

    const collections=main.querySelector('.home-collections');
    if(collections&&rel.collections?.length){
      const chosen=rel.collections.map(slug=>cmsCollections.find(c=>c.slug===slug)).filter(Boolean);
      const grid=collections.querySelector('.home-collection-grid');
      if(grid&&chosen.length)grid.innerHTML=chosen.map(c=>'<article onclick="go('+JSON.stringify('/colecoes/'+c.slug)+')"><div class="eyebrow">'+esc(I[c.imprint]?.name||'Ediouro')+'</div><h3>'+esc(c.name)+'</h3><span>'+c.workSlugs.length+' livros →</span></article>').join('');
    }

    const reading=sectionByHeading(main,'Todo mundo está lendo');
    if(reading){set(reading,'.sec-head h2',f.reading_title);const sh=reading.querySelector('.shelf');if(sh&&rel.reading?.length)sh.innerHTML=shelf(rel.reading);}

    const brands=main.querySelector('.recess');
    if(brands){
      const title=brands.querySelector('.brand-title');if(title&&f.brands_title)title.innerHTML=esc(f.brands_title).replace(/\n/g,'<br>');
      const wrap=brands.querySelector('.wrap');
      if(wrap&&f.brands_eyebrow&&!wrap.querySelector('.brands-cms-eyebrow'))title?.insertAdjacentHTML('beforebegin','<div class="eyebrow brands-cms-eyebrow">'+esc(f.brands_eyebrow)+'</div>');
      const intro=brands.querySelector('.brand-title + p');if(intro&&f.brands_intro)intro.textContent=f.brands_intro;
      const selected=(rel.imprints||[]).map(slug=>I[slug]).filter(Boolean),bs=brands.querySelector('.brand-shelf');
      if(bs&&selected.length){
        const first=selected[0],featured=DATA.works.filter(w=>w.imprint===first.slug).slice(0,3);
        bs.innerHTML='<div class="brand-open" style="background:'+first.color+';color:'+first.ink+'" onclick="go('+JSON.stringify('/marcas/'+first.slug)+')"><div><div class="eyebrow" style="color:inherit;opacity:.75">'+esc(first.name)+'</div><h3>'+esc(first.tagline||first.name)+'</h3><p>'+esc(first.description||'')+'</p></div><div class="brand-mini">'+featured.map(w=>cover(w)).join('')+'</div></div>'+
          selected.slice(1).map(im=>'<div class="spine" style="background:'+im.color+';color:'+im.ink+'" onclick="go('+JSON.stringify('/marcas/'+im.slug)+')"><span>'+esc(im.name.toUpperCase())+'</span></div>').join('');
      }
    }

    updatePlacement(placements[1],'placement2',rel.placement2Books,rel.placement2Image);

    const comingSec=sectionByHeading(main,'Vem aí');
    if(comingSec){
      set(comingSec,'.sec-head h2',f.coming_title);
      const coming=comingSec.querySelector('.coming');
      if(coming&&rel.coming?.length)coming.innerHTML=books(rel.coming).map(w=>{const e=principal(w);return '<div class="coming-item" onclick="go('+JSON.stringify('/livros/'+w.slug)+')">'+cover(w)+'<div><div class="eyebrow">'+esc(e.status||'Em breve')+'</div><h3>'+esc(w.title)+'</h3><p>'+esc(authorNames(w))+(w.series&&S[w.series]?' · '+esc(S[w.series].name):'')+'</p></div></div>';}).join('');
      const ser=rel.series?S[rel.series]:null,box=comingSec.querySelector('.series-box');
      if(box&&ser){
        set(box,'.eyebrow',f.series_eyebrow);set(box,'h3',ser.name);set(box,'p',ser.description);
        const ol=box.querySelector('ol');if(ol)ol.innerHTML=(ser.workSlugs||[]).slice(0,3).map((slug,i)=>W[slug]?'<li>'+String(i+1).padStart(2,'0')+' · '+esc(W[slug].title)+'</li>':'').join('');
        const cta=box.querySelector('.cta');if(cta)action(cta,'/series/'+ser.slug);
      }
      const heads=[...comingSec.querySelectorAll('.sec-head h2')],authorHead=heads.find(h=>h.textContent.trim()==='Autores');
      if(authorHead&&f.authors_title)authorHead.textContent=f.authors_title;
      const authorLink=[...comingSec.querySelectorAll('.sec-head .link')].find(x=>x.textContent.includes('autores'));if(authorLink&&f.authors_link_label)authorLink.textContent=f.authors_link_label;
      const authors=comingSec.querySelector('.authors');
      if(authors&&rel.authors?.length)authors.innerHTML=(rel.authors||[]).map(slug=>C[slug]).filter(Boolean).map(a=>'<article class="author" onclick="go('+JSON.stringify('/autores/'+a.slug)+')"><div class="monogram">'+esc(initials(a.name))+'</div><h3>'+esc(a.name)+'</h3><p>'+esc(a.shortBio||'Autor publicado pelo Grupo Ediouro.')+'</p></article>').join('');
    }

    const discover=sectionByHeading(main,'Descubra');
    if(discover){
      set(discover,'.sec-head h2',f.discover_title);
      const intro=discover.querySelector('.sec-head p');if(intro&&f.discover_intro)intro.textContent=f.discover_intro;
      const link=discover.querySelector('.sec-head .link');if(link&&f.discover_link_label)link.textContent=f.discover_link_label;
      const postMap=new Map((POSTS||[]).map(p=>[p.slug,p])),chosen=(rel.articles||[]).map(slug=>postMap.get(slug)).filter(Boolean),pan=discover.querySelector('.panorama');
      if(pan&&chosen.length){
        const first=chosen[0],rest=chosen.slice(1);
        pan.innerHTML='<div class="story" onclick="go('+JSON.stringify('/descubra/'+first.slug)+')"><div class="eyebrow">'+esc(first.kind||'Descubra')+'</div><h3 style="font-size:42px">'+esc(first.title)+'</h3><p>'+esc(first.standfirst||'')+'</p></div><div>'+rest.map(p=>'<div class="story" onclick="go('+JSON.stringify('/descubra/'+p.slug)+')"><div class="eyebrow">'+esc(p.kind||'Descubra')+'</div><h3>'+esc(p.title)+'</h3></div>').join('')+'</div>';
      }
    }

    const institutional=main.querySelector('.institutional');
    if(institutional){
      set(institutional,'.eyebrow',f.institutional_eyebrow);set(institutional,'h2',f.institutional_title);set(institutional,'p',f.institutional_text);
      set(institutional,'.newsletter h3',f.newsletter_title);
      const field=institutional.querySelector('.newsletter .field');if(field&&f.newsletter_placeholder)field.textContent=f.newsletter_placeholder;
      set(institutional,'.newsletter .cta',f.newsletter_button);
    }

    const enabled=new Map((rep.sections||[]).map(x=>[x.key,String(x.enabled)!=='0']));
    const toggle=(key,el)=>{if(el&&enabled.has(key))el.style.display=enabled.get(key)?'':'none';};
    toggle('hero',hero);toggle('interests',interests);toggle('arrivals',arrivals);
    toggle('placement1',placements[0]?.closest('section'));toggle('reading',reading);toggle('brands',brands);toggle('placement2',placements[1]?.closest('section'));toggle('discover',discover);toggle('institutional',institutional);
    if(comingSec){
      const pan=comingSec.querySelector('.panorama'),comingBlock=pan?.children?.[0],seriesBox=comingSec.querySelector('.series-box'),authorsGrid=comingSec.querySelector('.authors'),authorsHead=authorsGrid?.previousElementSibling;
      toggle('coming',comingBlock);toggle('series',seriesBox);toggle('authors',authorsGrid);toggle('authors',authorsHead);
    }
    window.EDIOURO_CMS_HOME_AUDIT={fields:Object.keys(f).length,relations:Object.fromEntries(Object.entries(rel).map(([k,v])=>[k,Array.isArray(v)?v.length:(v?1:0)])),sections:(rep.sections||[]).length};
    return main.outerHTML;
  };
}


function patchDiscoverPages(){
  if(typeof discoverList==='function'){
    const before=discoverList;
    discoverList=function(){
      const html=before();if(mode!=='cms'||!cmsData?.routes?.['discover-index'])return html;
      const cfg=cmsData.routes['discover-index'],f=cfg.fields||{},rep=cfg.repeaters||{};
      const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.discover-v3-hero .eyebrow',f.eyebrow);set('.discover-v3-hero h1',f.title);set('.discover-v3-hero p',f.intro);
      const all=main.querySelector('.discover-filter[data-kind="todos"]');if(all&&f.all_filter)all.textContent=f.all_filter;
      const paths=main.querySelector('.discover-paths');
      if(paths&&Array.isArray(rep.paths)&&rep.paths.length){
        paths.innerHTML=rep.paths.map(x=>'<article class="discover-path" onclick="go('+JSON.stringify(String(x.url||'/livros'))+')"><div class="eyebrow" style="color:inherit;opacity:.65">'+esc(x.eyebrow||'')+'</div><div><h3>'+esc(x.title||'')+'</h3><p>'+esc(x.text||'')+'</p></div></article>').join('');
        const sec=paths.closest('section');if(sec){const e=sec.querySelector('.sec-head .eyebrow'),h=sec.querySelector('.sec-head h2');if(e&&f.paths_eyebrow)e.textContent=f.paths_eyebrow;if(h&&f.paths_title)h.textContent=f.paths_title;}
      }
      const archive=main.querySelector('.discover-all-grid')?.closest('section');if(archive){const e=archive.querySelector('.sec-head .eyebrow'),h=archive.querySelector('.sec-head h2');if(e&&f.archive_eyebrow)e.textContent=f.archive_eyebrow;if(h&&f.archive_title)h.textContent=f.archive_title;}
      return main.outerHTML;
    };
  }
}
function patchAuthorsPages(){
  if(typeof authorsList==='function'){
    const before=authorsList;
    authorsList=function(){
      const html=before();if(mode!=='cms'||!cmsData?.routes?.['authors-index'])return html;
      const cfg=cmsData.routes['authors-index'],f=cfg.fields||{},rel=cfg.relations||{};
      const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.authors-v3-hero .eyebrow',f.eyebrow);set('.authors-v3-hero h1',f.title);set('.authors-v3-hero p',f.intro);
      const input=main.querySelector('.authors-v3-search input');if(input&&f.search_placeholder)input.placeholder=f.search_placeholder;
      set('.authors-v3-search button',f.search_button);
      const featuredSec=main.querySelector('.authors-v3-featured');
      if(featuredSec){set('.authors-v3-featured .sec-head .eyebrow',f.featured_eyebrow);set('.authors-v3-featured .sec-head h2',f.featured_title);}
      const idx=main.querySelector('.authors-v3-index');if(idx){const e=idx.querySelector('.authors-v3-index-head .eyebrow'),h=idx.querySelector('.authors-v3-index-head h2');if(e&&f.directory_eyebrow)e.textContent=f.directory_eyebrow;if(h&&f.directory_title)h.textContent=f.directory_title;}
      const selected=(rel.featured||[]).map(slug=>C[slug]).filter(Boolean);
      const grid=featuredSec?.querySelector('.authors-v3-featured-grid');
      if(grid&&selected.length&&typeof authorBooksV3==='function'){
        const scored=selected.map(a=>({a,books:authorBooksV3(a.slug)}));
        const first=scored[0];
        grid.innerHTML='<article class="author-feature-main" onclick="go('+JSON.stringify('/autores/'+first.a.slug)+')"><div><div class="eyebrow" style="color:#bfb5dc">'+first.books.length+' '+(first.books.length===1?'livro':'livros')+' no catálogo</div><h2>'+esc(first.a.name)+'</h2><p>'+esc(typeof authorBioV3==='function'?authorBioV3(first.a):(first.a.shortBio||''))+'</p><div class="link" style="color:#fff;border-color:#fff;display:inline-block;margin-top:10px">Conhecer o autor</div></div><div class="author-orbit">'+esc(initials(first.a.name))+'</div></article><div class="author-feature-side">'+scored.slice(1).map(({a,books})=>'<article class="author-feature-small" onclick="go('+JSON.stringify('/autores/'+a.slug)+')"><div class="author-mini-mark">'+esc(initials(a.name))+'</div><div><div class="eyebrow">'+books.length+' '+(books.length===1?'livro':'livros')+'</div><h3>'+esc(a.name)+'</h3><p>'+esc(typeof authorBioV3==='function'?authorBioV3(a):(a.shortBio||''))+'</p></div></article>').join('')+'</div>';
      }
      return main.outerHTML;
    };
  }
  if(typeof authorPage==='function'){
    const beforeAuthor=authorPage;
    authorPage=function(slug){
      const html=beforeAuthor(slug);if(mode!=='cms')return html;
      const a=C[slug];if(!a?.photo)return html;
      const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main'),portrait=main?.querySelector('.author-v3-portrait');if(!main||!portrait)return html;
      portrait.innerHTML='<img src="'+esc(a.photo)+'" alt="'+esc(a.photoAlt||('Foto de '+a.name))+'" style="width:100%;height:100%;object-fit:cover;display:block">';
      return main.outerHTML;
    };
  }
}
function patchBrandPages(){
  if(typeof brandsList==='function'){
    const before=brandsList;
    brandsList=function(){
      const html=before();if(mode!=='cms'||!cmsData?.routes?.['imprints-index'])return html;
      const f=cmsData.routes['imprints-index'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.brands-v3-hero .eyebrow',f.eyebrow);set('.brands-v3-hero h1',f.title);set('.brands-v3-hero p',f.intro);
      return main.outerHTML;
    };
  }
  if(typeof brandPage==='function'){
    const beforeBrand=brandPage;
    brandPage=function(slug){
      const html=beforeBrand(slug);if(mode!=='cms'||!cmsData?.routes?.['imprints-index'])return html;
      const f=cmsData.routes['imprints-index'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const intro=main.querySelector('.brand-intro-v3');if(intro){const e=intro.querySelector('.eyebrow'),h=intro.querySelector('h2');if(e&&f.detail_identity_eyebrow)e.textContent=f.detail_identity_eyebrow;if(h&&f.detail_identity_title)h.textContent=f.detail_identity_title;}
      const heads=[...main.querySelectorAll('.sec-head')];
      for(const head of heads){
        const h=head.querySelector('h2'),e=head.querySelector('.eyebrow');if(!h)continue;
        const t=h.textContent.trim();
        if(t==='Comece por aqui'){if(e&&f.detail_highlights_eyebrow)e.textContent=f.detail_highlights_eyebrow;if(f.detail_highlights_title)h.textContent=f.detail_highlights_title;}
        else if(t==='Histórias para continuar.'){if(e&&f.detail_series_eyebrow)e.textContent=f.detail_series_eyebrow;if(f.detail_series_title)h.textContent=f.detail_series_title;}
        else if(t.startsWith('Vozes da ')&&f.detail_authors_title)h.textContent=f.detail_authors_title;
        else if(t.startsWith('Continue pela ')&&f.detail_discover_title)h.textContent=f.detail_discover_title;
      }
      return main.outerHTML;
    };
  }
}


function patchAboutPage(){
  if(typeof aboutPage!=='function')return;
  const before=aboutPage;
  aboutPage=function(){
    const html=before();if(mode!=='cms'||!cmsData?.routes?.sobre)return html;
    const cfg=cmsData.routes.sobre,f=cfg.fields||{},rep=cfg.repeaters||{};
    const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
    const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
    set('.about-v3-hero .eyebrow',f.hero_eyebrow);set('.about-v3-hero h1',f.hero_title);set('.about-v3-hero p',f.hero_intro);
    const intro=main.querySelector('.about-v3-intro');if(intro){const e=intro.querySelector('.eyebrow'),h=intro.querySelector('h2'),copy=intro.querySelector('.copy');if(e&&f.who_eyebrow)e.textContent=f.who_eyebrow;if(h&&f.who_title)h.textContent=f.who_title;if(copy&&f.who_body)copy.innerHTML='<p>'+esc(f.who_body)+'</p>';}
    const history=main.querySelector('.about-history');if(history){const e=history.querySelector('.eyebrow'),h=history.querySelector('h2');if(e&&f.history_eyebrow)e.textContent=f.history_eyebrow;if(h&&f.history_title)h.textContent=f.history_title;const tl=history.querySelector('.about-timeline');if(tl&&Array.isArray(rep.timeline)&&rep.timeline.length)tl.innerHTML=rep.timeline.map(x=>'<article class="about-milestone"><div class="year">'+esc(x.year||'')+'</div><h3>'+esc(x.title||'')+'</h3><p>'+esc(x.text||'')+'</p></article>').join('');}
    const system=main.querySelector('.about-system');if(system){const sec=system.closest('section'),e=sec?.querySelector('.sec-head .eyebrow'),h=sec?.querySelector('.sec-head h2');if(e&&f.structure_eyebrow)e.textContent=f.structure_eyebrow;if(h&&f.structure_title)h.textContent=f.structure_title;if(Array.isArray(rep.structure)&&rep.structure.length)system.innerHTML=rep.structure.map((x,i)=>'<article class="about-system-card"><div class="num">'+String(i+1).padStart(2,'0')+'</div><div><h3>'+esc(x.title||'')+'</h3><p>'+esc(x.text||'')+'</p></div></article>').join('');}
    const brands=main.querySelector('.about-brands-v3')?.closest('section');if(brands){const e=brands.querySelector('.sec-head .eyebrow'),h=brands.querySelector('.sec-head h2');if(e&&f.brands_eyebrow)e.textContent=f.brands_eyebrow;if(h&&f.brands_title)h.textContent=f.brands_title;}
    const actions=main.querySelector('.about-actions');if(actions){const h=actions.querySelector('h2');if(h&&f.continue_title)h.textContent=f.continue_title;const links=actions.querySelector('.about-action-links');if(links&&Array.isArray(rep.links)&&rep.links.length)links.innerHTML=rep.links.map(x=>'<div class="about-action-link" onclick="go('+JSON.stringify(String(x.url||'/'))+')">'+esc(x.label||'')+'</div>').join('');}
    return main.outerHTML;
  };
}
function patchEducationPages(){
  if(typeof educationPage==='function'){
    const before=educationPage;
    educationPage=function(params){
      const html=before(params);if(mode!=='cms'||!cmsData?.routes?.educacao)return html;
      const cfg=cmsData.routes.educacao,f=cfg.fields||{},rep=cfg.repeaters||{};
      const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(root,sel,val)=>{if(val===undefined||val===null||val==='')return;const el=root.querySelector(sel);if(el)el.textContent=val;};
      const hero=main.querySelector('.edu-hero');if(hero){set(hero,'.eyebrow',f.hero_eyebrow);set(hero,'h1',f.hero_title);set(hero,'p',f.hero_intro);const a=hero.querySelector('.edu-hero-actions .cta'),b=hero.querySelector('.edu-hero-actions .link');if(a&&f.primary_cta)a.textContent=f.primary_cta;if(b&&f.secondary_cta)b.textContent=f.secondary_cta;}
      const stages=main.querySelector('.edu-stage-grid')?.closest('section');if(stages){set(stages,'.sec-head .eyebrow',f.stages_eyebrow);set(stages,'.sec-head h2',f.stages_title);set(stages,'.edu-stage-note',f.stages_note);}
      const vals=main.querySelector('.edu-values');if(vals){set(vals,'.sec-head .eyebrow',f.values_eyebrow);set(vals,'.sec-head h2',f.values_title);const grid=vals.querySelector('.edu-values-grid');if(grid&&Array.isArray(rep.values)&&rep.values.length)grid.innerHTML=rep.values.map(x=>'<article><h3>'+esc(x.title||'')+'</h3><p>'+esc(x.text||'')+'</p></article>').join('');}
      const downs=main.querySelector('.edu-downloads');if(downs){set(downs,'.sec-head h2',f.catalogs_title);const grid=downs.querySelector('.edu-download-grid');if(grid&&Array.isArray(rep.catalogs)&&rep.catalogs.length)grid.innerHTML=rep.catalogs.map((c,i)=>'<article class="edu-download-card edu-download-card-'+(i+1)+'"><div class="edu-download-art" aria-hidden="true"><span>Ediouro<br>Educação</span><strong>'+esc((c.kicker||'CATÁLOGO').toUpperCase())+'</strong></div><div class="edu-download-copy"><div class="eyebrow">'+esc(c.kicker||'')+'</div><h3>'+esc(c.label||'')+'</h3><p>'+esc(c.text||'')+'</p><a class="edu-external-cta" href="'+esc(c.url||'#')+'" target="_blank" rel="noopener noreferrer">Baixar catálogo <span>↗</span></a></div></article>').join('');}
      return main.outerHTML;
    };
  }
  if(typeof educationArchivePage==='function'){
    const beforeArchive=educationArchivePage;
    educationArchivePage=function(params){
      const html=beforeArchive(params);if(mode!=='cms'||!cmsData?.routes?.['educacao-acervo'])return html;
      const f=cmsData.routes['educacao-acervo'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.edu-back',f.back_label);set('.edu-archive-hero .eyebrow',f.eyebrow);set('.edu-archive-title h1',f.title);set('.edu-archive-title p',f.intro);
      set('.edu-archive-filter-head .eyebrow',f.filter_eyebrow);
      const first=main.querySelector('.edu-archive-chip');if(first&&f.all_label){const span=first.querySelector('span')?.outerHTML||'';first.innerHTML=esc(f.all_label)+' '+span;}
      const label=main.querySelector('.edu-archive-search label');if(label&&f.search_label)label.textContent=f.search_label;
      const input=main.querySelector('.edu-archive-search input');if(input&&f.search_placeholder)input.placeholder=f.search_placeholder;
      const empty=main.querySelector('#eduArchiveEmpty');if(empty&&f.empty_text)empty.textContent=f.empty_text;
      return main.outerHTML;
    };
  }
}
function patchSupportPages(){
  if(typeof supportPage!=='function')return;
  const before=supportPage;
  supportPage=function(type){
    const html=before(type),cfg=mode==='cms'?cmsData?.routes?.[type]:null;if(!cfg)return html;
    const f=cfg.fields||{},rep=cfg.repeaters||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
    const set=(root,sel,val)=>{if(val===undefined||val===null||val==='')return;const el=root.querySelector(sel);if(el)el.textContent=val;};
    const hero=main.querySelector('.support-hero');if(hero){set(hero,'.eyebrow',f.hero_eyebrow);set(hero,'h1',f.hero_title);set(hero,'p',f.hero_intro);}
    const intro=main.querySelector('.support-intro-row');if(intro){set(intro,'.eyebrow',f.section_eyebrow);set(intro,'h2',f.section_title);const ps=[...intro.querySelectorAll('p')];if(ps.length&&f.section_body)ps[ps.length-1].textContent=f.section_body;}
    const grid=main.querySelector('.support-contact-grid');
    if(grid&&Array.isArray(rep.contacts)&&rep.contacts.length){
      grid.innerHTML=rep.contacts.map(c=>{
        if(c.email&&typeof supportEmailCard==='function')return supportEmailCard(c.eyebrow||'',c.title||'',c.text||'',c.email||'',c.subject||'');
        const url=c.url||'';return '<article class="support-contact-card '+(url?'support-card-link':'')+'" '+(url?'onclick="window.open('+JSON.stringify(url)+',\'_blank\')"':'')+'><div><div class="eyebrow">'+esc(c.eyebrow||'')+'</div><h3>'+esc(c.title||'')+'</h3><p>'+esc(c.text||'')+'</p></div>'+(c.cta_label?'<div class="support-email-cta"><span>'+esc(c.cta_label)+'</span><span>→</span></div>':'')+'</article>';
      }).join('');
    }
    const note=main.querySelector('.support-note');if(note&&Array.isArray(rep.notes)&&rep.notes.length)note.innerHTML=rep.notes.map(n=>'<div><strong>'+esc(n.title||'')+(n.title?':':'')+'</strong> '+esc(n.text||'')+'</div>').join('');
    const bottom=main.querySelector('.support-bottom-grid');if(bottom){set(bottom,'.eyebrow',f.bottom_eyebrow);set(bottom,'h3',f.bottom_title);set(bottom,'p',f.bottom_body);if(Array.isArray(rep.links)&&rep.links.length){const existing=bottom.children[1];if(existing)existing.outerHTML=typeof supportNavLinks==='function'?supportNavLinks(rep.links.map(x=>[x.label,x.url])):'<div class="support-links">'+rep.links.map(x=>'<div class="support-link" onclick="go('+JSON.stringify(String(x.url||'/'))+')"><span>'+esc(x.label||'')+'</span><span>→</span></div>').join('')+'</div>';}}
    return main.outerHTML;
  };
}


function patchSeriesPages(){
  if(typeof seriesList==='function'){
    const before=seriesList;
    seriesList=function(){
      const html=before();if(mode!=='cms'||!cmsData?.routes?.['series-index'])return html;
      const f=cmsData.routes['series-index'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.series-index-hero .eyebrow',f.eyebrow);set('.series-index-hero h1',f.title);set('.series-index-hero p',f.intro);set('#seriesAll .sec-head h2',f.section_title);
      return main.outerHTML;
    };
  }
  if(typeof cmsCollectionsList==='function'){
    const beforeCollections=cmsCollectionsList;
    cmsCollectionsList=function(){
      const html=beforeCollections();if(mode!=='cms'||!cmsData?.routes?.['collections-index'])return html;
      const f=cmsData.routes['collections-index'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.page-hero .eyebrow',f.eyebrow);set('.page-hero h1',f.title);set('.page-hero p',f.intro);
      const sec=main.querySelector('.collections-grid')?.closest('section');if(sec&&f.section_title){let head=sec.querySelector('.sec-head h2');if(!head){const wrap=sec.querySelector('.wrap');if(wrap)wrap.insertAdjacentHTML('afterbegin','<div class="sec-head"><h2>'+esc(f.section_title)+'</h2></div>');}else head.textContent=f.section_title;}
      return main.outerHTML;
    };
  }
}
function patchCatalogAndSearch(){
  if(typeof catalog==='function'){
    const before=catalog;
    catalog=function(params){
      const html=before(params);if(mode!=='cms'||!cmsData?.routes?.catalog)return html;
      const cfg=cmsData.routes.catalog,f=cfg.fields||{},rel=cfg.relations||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.catalog-v3-hero .eyebrow',f.eyebrow);set('.catalog-v3-title h1',f.title);set('.catalog-v3-title p',f.intro);
      const input=main.querySelector('#catalogSearch');if(input&&f.search_placeholder)input.placeholder=f.search_placeholder;set('.catalog-v3-search button',f.search_button);
      const shortcut=main.querySelector('.catalog-v3-shortcuts');if(shortcut){const lbl=shortcut.querySelector('span');if(lbl&&f.shortcut_label)lbl.textContent=f.shortcut_label;const cm=new Map((cmsData.categories||[]).map(c=>[c.slug,c]));if(rel.shortcuts?.length)shortcut.innerHTML='<span>'+esc(f.shortcut_label||'Explore:')+'</span>'+rel.shortcuts.map(slug=>cm.get(slug)).filter(Boolean).map(c=>'<button onclick="go('+JSON.stringify('/livros?categoria='+encodeURIComponent(c.slug))+')">'+esc(c.name)+'</button>').join('');}
      set('.catalog-aside-title',f.filter_title);
      const groups=[...main.querySelectorAll('.filter-group h4')];if(groups[0]&&f.filter_imprints)groups[0].textContent=f.filter_imprints;if(groups[1]&&f.filter_categories)groups[1].textContent=f.filter_categories;if(groups[2]&&f.filter_series)groups[2].textContent=f.filter_series;
      const chips=[...main.querySelectorAll('.catalog-sort .sort-chip')],sortMap=[[0,f.sort_featured],[1,f.sort_recent],[2,f.sort_az],[3,f.sort_price]];sortMap.forEach(([i,v])=>{if(chips[i]&&v)chips[i].textContent=v;});
      const empty=main.querySelector('.catalog-empty');if(empty){set('.catalog-empty .eyebrow',f.empty_eyebrow);set('.catalog-empty h3',f.empty_title);const b=empty.querySelector('button');if(b&&f.empty_button)b.textContent=f.empty_button;}
      return main.outerHTML;
    };
  }
  if(typeof globalSearch==='function'){
    const beforeSearch=globalSearch;
    globalSearch=function(params){
      const html=beforeSearch(params);if(mode!=='cms'||!cmsData?.routes?.search)return html;
      const f=cmsData.routes.search.fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const q=(params?.get?.('q')||'').trim(),set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.search-v3-hero .eyebrow',f.eyebrow);if(!q)set('.search-v3-hero h1',f.title);
      const input=main.querySelector('#globalSearch');if(input&&f.placeholder)input.placeholder=f.placeholder;
      if(!q){const state=main.querySelector('.state-card');if(state&&f.intro){const h=state.querySelector('h2');if(h)h.textContent=f.intro;}}
      const labels={Livros:f.books_label,Autores:f.authors_label,Séries:f.series_label,Marcas:f.imprints_label,Descubra:f.discover_label};
      [...main.querySelectorAll('.search-section-head h2')].forEach(h=>{if(labels[h.textContent.trim()])h.textContent=labels[h.textContent.trim()];});
      const empty=main.querySelector('.search-empty-v3');if(empty){set('.search-empty-v3 h2',f.empty_title);set('.search-empty-v3 p',f.empty_text);const cta=empty.querySelector('.cta');if(cta&&f.empty_cta)cta.textContent=f.empty_cta;}
      return main.outerHTML;
    };
  }
}
function patchStatePages(){
  if(typeof newsletterThanks==='function'){
    const before=newsletterThanks;
    newsletterThanks=function(){
      const html=before();if(mode!=='cms'||!cmsData?.routes?.['newsletter-obrigado'])return html;
      const f=cmsData.routes['newsletter-obrigado'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.support-hero .eyebrow',f.eyebrow);set('.support-hero h1',f.title);set('.support-hero p',f.intro);set('.state-card h2',f.card_title);set('.state-card p',f.card_text);const cta=main.querySelector('.state-card .cta');if(cta){if(f.cta)cta.textContent=f.cta;if(f.cta_url)cta.setAttribute('onclick','go('+JSON.stringify(f.cta_url)+')');}
      return main.outerHTML;
    };
  }
  if(typeof notFound==='function'){
    const before404=notFound;
    notFound=function(){
      const html=before404();if(mode!=='cms'||!cmsData?.routes?.['404'])return html;
      const f=cmsData.routes['404'].fields||{},doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const set=(sel,val)=>{if(val===undefined||val===null||val==='')return;const el=main.querySelector(sel);if(el)el.textContent=val;};
      set('.support-hero .eyebrow',f.eyebrow);set('.support-hero h1',f.title);set('.support-hero p',f.intro);return main.outerHTML;
    };
  }
}
function patchGlobalLabels(){
  const cfg=cmsData?.routes?.config,f=cfg?.fields||{};
  if(!cfg)return;
  if(typeof header==='function'){
    const beforeHeader=header;
    header=function(){const html=beforeHeader();if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),root=doc.body.firstElementChild;if(!root)return html;root.querySelectorAll('.logo').forEach(x=>{if(f.wordmark)x.textContent=f.wordmark;});const st=root.querySelector('.search-top');if(st&&f.search_label)st.textContent='⌕ '+f.search_label;const ab=root.querySelector('.top-link');if(ab&&f.about_label)ab.textContent=f.about_label;const mi=root.querySelector('#menuSearch');if(mi&&f.search_placeholder)mi.placeholder=f.search_placeholder;return root.outerHTML;};
  }
  if(typeof footer==='function'){
    const beforeFooter=footer;
    footer=function(){const html=beforeFooter();if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),root=doc.body.firstElementChild;if(!root)return html;const logo=root.querySelector('.logo');if(logo&&f.wordmark)logo.textContent=f.wordmark;const p=logo?.parentElement?.querySelector('p');if(p&&f.footer_tagline)p.textContent=f.footer_tagline;const contact=root.querySelector('.footer-contact');if(contact){const span=contact.querySelector('span'),a=contact.querySelector('a');if(span&&f.sac_label)span.textContent=f.sac_label;if(a&&f.sac_email){a.textContent=f.sac_email;a.href='mailto:'+f.sac_email;}}const badge=root.querySelector('.accessible-book-badge');if(badge&&f.accessibility_url)badge.href=f.accessibility_url;const media=cfg.media||{};const img=badge?.querySelector('img');if(img&&media.accessibilityLogo)img.src=media.accessibilityLogo;return root.outerHTML;};
  }
  if(typeof bookPage==='function'){
    const beforeBook=bookPage;
    bookPage=function(slug,params){const html=beforeBook(slug,params);if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;
      const crumb=main.querySelector('.breadcrumb .entity-crumb');if(crumb&&f.book_breadcrumb)crumb.textContent=f.book_breadcrumb;
      const ed=main.querySelector('.edition-label');if(ed&&f.book_choose_format)ed.textContent=f.book_choose_format;
      const price=main.querySelector('.price span');if(price&&f.book_price_label)price.textContent=f.book_price_label;
      const rt=main.querySelector('.retail-title');if(rt&&f.book_buy_label)rt.textContent=f.book_buy_label;
      const blocks=[...main.querySelectorAll('.detail-block')];if(blocks[0]){const h=blocks[0].querySelector('h2');if(h&&f.book_about_label)h.textContent=f.book_about_label;}
      blocks.forEach(b=>{const h=b.querySelector('.sec-head h2');if(h&&h.textContent.includes('·')&&f.book_series_order_label)h.textContent=h.textContent.split('·')[0].trim()+' · '+f.book_series_order_label;const l=b.querySelector('.sec-head .link');if(l&&f.book_series_link_label)l.textContent=f.book_series_link_label;const ae=b.querySelector('.author-entity-block .eyebrow');if(ae&&f.book_author_label)ae.textContent=f.book_author_label;});
      const rel=main.querySelector('section.related .sec-head h2');if(rel&&f.book_related_label)rel.textContent=f.book_related_label;
      const sections=[...main.querySelectorAll('section')];const contentSec=sections.find(x=>x.querySelector('.story'));const ch=contentSec?.querySelector('.sec-head h2');if(ch&&f.book_related_content_label)ch.textContent=f.book_related_content_label;
      const edu=main.querySelector('.book-education-card');if(edu){const e=edu.querySelector('.eyebrow'),h=edu.querySelector('h2');if(e&&f.book_education_eyebrow)e.textContent=f.book_education_eyebrow;if(h&&f.book_education_title)h.textContent=f.book_education_title;}
      const metaMap={Formato:f.meta_format,Páginas:f.meta_pages,ISBN:f.meta_isbn,Acabamento:f.meta_binding,Dimensões:f.meta_dimensions,Status:f.meta_status,EAN:f.meta_ean};main.querySelectorAll('.meta-row span').forEach(x=>{if(metaMap[x.textContent.trim()])x.textContent=metaMap[x.textContent.trim()];});
      return main.outerHTML;};
  }
  if(typeof authorPage==='function'){
    const beforeAuthor=authorPage;authorPage=function(slug){const html=beforeAuthor(slug);if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;const hero=main.querySelector('.author-v3-copy .eyebrow');if(hero&&f.author_eyebrow)hero.textContent=f.author_eyebrow;const about=main.querySelector('.narrow>.eyebrow');if(about&&f.author_about_label)about.textContent=f.author_about_label;const bib=main.querySelector('.author-v3-books .sec-head .eyebrow');if(bib&&f.author_bibliography_label)bib.textContent=f.author_bibliography_label;const ser=main.querySelector('.author-v3-series .sec-head .eyebrow');if(ser&&f.author_series_label)ser.textContent=f.author_series_label;const dis=main.querySelector('.author-v3-editorial .sec-head .eyebrow');if(dis&&f.author_discover_label)dis.textContent=f.author_discover_label;return main.outerHTML;};
  }
  if(typeof seriesPage==='function'){
    const beforeSeries=seriesPage;seriesPage=function(slug){const html=beforeSeries(slug);if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;const e=main.querySelector('.series-detail-hero .eyebrow');if(e&&f.series_eyebrow){const prefix=e.textContent.split('·')[0].trim();e.textContent=prefix+' · '+f.series_eyebrow;}const rh=main.querySelector('.series-reading-head h2');if(rh&&f.series_order_label)rh.textContent=f.series_order_label;const related=main.querySelector('.series-related-band .sec-head h2');if(related&&f.series_explore_label)related.textContent=f.series_explore_label;main.querySelectorAll('.series-reading-copy .eyebrow').forEach(x=>{if(f.series_volume_label)x.textContent=x.textContent.replace(/^Volume/i,f.series_volume_label);});return main.outerHTML;};
  }
  if(typeof articlePage==='function'){
    const beforeArticle=articlePage;articlePage=function(slug){const html=beforeArticle(slug);if(mode!=='cms')return html;const doc=new DOMParser().parseFromString(html,'text/html'),main=doc.querySelector('main');if(!main)return html;const side=[...main.querySelectorAll('.article-v3-side-block .eyebrow')];side.forEach(x=>{const t=x.textContent.trim();if(t==='Casa editorial'&&f.discover_imprint_label)x.textContent=f.discover_imprint_label;else if(t==='Autores relacionados'&&f.discover_authors_label)x.textContent=f.discover_authors_label;else if(t.includes('Séries')&&f.discover_series_label)x.textContent=f.discover_series_label;});const rel=main.querySelector('section.related .sec-head');if(rel){const e=rel.querySelector('.eyebrow'),h=rel.querySelector('h2');if(e&&f.discover_continue_label)e.textContent=f.discover_continue_label;if(h&&f.discover_books_label)h.textContent=f.discover_books_label;}const nx=main.querySelector('.article-next .eyebrow');if(nx&&f.discover_next_label)nx.textContent=f.discover_next_label;return main.outerHTML;};
  }
}

async function boot(){
  try{
    if(mode==='shadow'){
      const r=await fetch('/api/cms?summary=1',{cache:'no-cache'});if(!r.ok)throw new Error('CMS bridge '+r.status);
      const audit=await r.json();window.EDIOURO_CMS_SYNC={status:'shadow-ready',mode,...audit,checkedAt:new Date().toISOString()};return;
    }
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);let r;try{r=await fetch('/api/cms',{cache:'no-cache',signal:controller.signal});}finally{clearTimeout(timer)}if(!r.ok)throw new Error('CMS bridge '+r.status);
    const data=await r.json();if(!data?.ok)throw new Error('CMS payload inválido');
    applyCms(data);patchBookPage();patchHomePage();patchDiscoverPages();patchAuthorsPages();patchBrandPages();patchAboutPage();patchEducationPages();patchSupportPages();patchSeriesPages();patchCatalogAndSearch();patchStatePages();patchGlobalLabels();patchRouter();
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