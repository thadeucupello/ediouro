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

async function boot(){
  try{
    if(mode==='shadow'){
      const r=await fetch('/api/cms?summary=1',{cache:'no-cache'});if(!r.ok)throw new Error('CMS bridge '+r.status);
      const audit=await r.json();window.EDIOURO_CMS_SYNC={status:'shadow-ready',mode,...audit,checkedAt:new Date().toISOString()};return;
    }
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);let r;try{r=await fetch('/api/cms',{cache:'no-cache',signal:controller.signal});}finally{clearTimeout(timer)}if(!r.ok)throw new Error('CMS bridge '+r.status);
    const data=await r.json();if(!data?.ok)throw new Error('CMS payload inválido');
    applyCms(data);patchBookPage();patchHomePage();patchRouter();
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