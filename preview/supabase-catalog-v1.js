(function(){
const SUPABASE_URL='https://wubthvvtncflzkblgtzh.supabase.co';
const SUPABASE_KEY='sb_publishable_8kcCqGxfrFkWMuk9Oy8kaQ_2Axv3GuQ';
const qs='?select=*&limit=1000';
let bootPromise=null;
const meaningful=v=>{
  if(v===null||v===undefined)return false;
  if(typeof v==='string')return v.trim()!=='';
  if(Array.isArray(v))return v.length>0;
  if(typeof v==='object')return Object.keys(v).length>0;
  return true;
};
const mergeReal=(base,next)=>{
  const out={...base};
  for(const [k,v] of Object.entries(next||{}))if(meaningful(v))out[k]=v;
  return out;
};
const unionStrings=(a,b)=>Array.from(new Set([...(a||[]),...(b||[])].filter(Boolean)));
const unionCredits=(a,b)=>{
  const m=new Map();
  for(const x of [...(a||[]),...(b||[])]){
    if(!x)continue;
    const key=String(x.contributor||'')+'|'+String(x.role||'');
    if(key!=='|')m.set(key,x);
  }
  return [...m.values()];
};
const mergeWork=(base,next)=>{
  const baseline=next?.source?.system==='cms-baseline';
  if(!baseline)return mergeReal(base,next);
  const out={...base};
  for(const [k,v] of Object.entries(next||{})){
    if(['credits','collections','categories','subjects','featured'].includes(k))continue;
    if(!meaningful(out[k])&&meaningful(v))out[k]=v;
  }
  out.credits=unionCredits(base.credits,next.credits);
  out.collections=unionStrings(base.collections,next.collections);
  out.categories=unionStrings(base.categories,next.categories);
  out.subjects=unionStrings(base.subjects,next.subjects);
  out.featured=unionStrings(base.featured,next.featured);
  return out;
};
const mergeEdition=(base,next)=>{
  const baseline=next?.source?.system==='cms-baseline';
  if(!baseline)return mergeReal(base,next);
  const out={...base};
  for(const [k,v] of Object.entries(next||{})){
    if(!meaningful(out[k])&&meaningful(v))out[k]=v;
  }
  if(meaningful(next.cover))out.cover=next.cover;
  return out;
};
async function table(name,filter=''){
  const r=await fetch(SUPABASE_URL+'/rest/v1/'+name+qs+filter,{
    headers:{apikey:SUPABASE_KEY},
    cache:'no-cache'
  });
  if(!r.ok)throw new Error(name+' '+r.status);
  return r.json();
}
function workRow(x,slug){
  return {
    id:x.id,slug:slug||x.slug,title:x.title,subtitle:x.subtitle,
    shortDescription:x.short_description,description:x.description,
    credits:x.credits,imprint:x.imprint,collections:x.collections,
    categories:x.categories,subjects:x.subjects,featured:x.featured,
    popularity:x.popularity,seoTitle:x.seo_title,seoDescription:x.seo_description,
    series:x.series_slug,seriesOrder:x.series_order==null?null:Number(x.series_order),
    source:x.source,manual:x.manual
  };
}
function editionRow(x,workSlug){
  return {
    id:x.id,workSlug:workSlug||x.work_slug,label:x.label,format:x.format,
    publicationDate:x.publication_date,language:x.language,status:x.status,
    source:x.source,binding:x.binding,isbn:x.isbn,ean:x.ean,pageCount:x.page_count,
    dimensions:x.dimensions,cover:x.cover_url,gallery:x.gallery,
    price:x.price==null?null:Number(x.price),currency:x.currency,credits:x.credits,
    displayPriority:x.display_priority,retailerLinks:x.retailer_links,
    availabilityNote:x.availability_note,manual:x.manual
  };
}
function contributorRow(x){
  return {slug:x.slug,name:x.name,roles:x.roles,shortBio:x.short_bio,bio:x.bio,metadata:x.metadata};
}
function seriesRow(x,mapSlug){
  return {
    slug:x.slug,name:x.name,description:x.description,imprint:x.imprint,
    mainContributor:x.main_contributor,
    workSlugs:(x.work_slugs||[]).map(s=>mapSlug.get(s)||s),
    metadata:x.metadata
  };
}
function rebuildMaps(){
  if(typeof W!=='undefined'){
    Object.keys(W).forEach(k=>delete W[k]);
    (DATA.works||[]).forEach(w=>W[w.slug]=w);
  }
  if(typeof ED!=='undefined'){
    Object.keys(ED).forEach(k=>delete ED[k]);
    (DATA.editions||[]).forEach(e=>(ED[e.workSlug]??=[]).push(e));
  }
  if(typeof C!=='undefined'){
    Object.keys(C).forEach(k=>delete C[k]);
    (DATA.contributors||[]).forEach(c=>C[c.slug]=c);
  }
  if(typeof S!=='undefined'){
    Object.keys(S).forEach(k=>delete S[k]);
    (DATA.series||[]).forEach(s=>S[s.slug]=s);
  }
}
async function sync(){
  const [dbWorks,dbEditions,dbContributors,dbSeries]=await Promise.all([
    table('catalog_works','&active=eq.true'),
    table('catalog_editions','&active=eq.true'),
    table('catalog_contributors'),
    table('catalog_series')
  ]);

  const staticEdByIsbn=new Map();
  for(const e of DATA.editions||[]){
    const k=String(e.isbn||e.ean||'').replace(/\D/g,'');
    if(k.length===13)staticEdByIsbn.set(k,e);
  }

  // If an edition already exists in the static catalogue, keep its canonical
  // work slug so URLs do not change while the CMS migration is transitional.
  const workSlugMap=new Map();
  for(const e of dbEditions){
    const k=String(e.isbn||e.ean||'').replace(/\D/g,'');
    const old=staticEdByIsbn.get(k);
    if(old?.workSlug)workSlugMap.set(e.work_slug,old.workSlug);
  }

  const worksBySlug=new Map((DATA.works||[]).map(w=>[w.slug,w]));
  for(const row of dbWorks){
    const targetSlug=workSlugMap.get(row.slug)||row.slug;
    const next=workRow(row,targetSlug);
    const old=worksBySlug.get(targetSlug);
    if(old)Object.assign(old,mergeWork(old,next));
    else{DATA.works.push(next);worksBySlug.set(targetSlug,next);}
  }

  const editionsByIsbn=new Map();
  for(const e of DATA.editions||[]){
    const k=String(e.isbn||e.ean||'').replace(/\D/g,'');
    if(k)editionsByIsbn.set(k,e);
  }
  for(const row of dbEditions){
    const k=String(row.isbn||row.ean||'').replace(/\D/g,'');
    const targetWork=workSlugMap.get(row.work_slug)||row.work_slug;
    const next=editionRow(row,targetWork);
    const old=editionsByIsbn.get(k);
    if(old)Object.assign(old,mergeEdition(old,next));
    else{DATA.editions.push(next);if(k)editionsByIsbn.set(k,next);}
  }

  const contributorsBySlug=new Map((DATA.contributors||[]).map(c=>[c.slug,c]));
  for(const row of dbContributors){
    const next=contributorRow(row),old=contributorsBySlug.get(next.slug);
    if(old)Object.assign(old,mergeReal(old,next));
    else{DATA.contributors.push(next);contributorsBySlug.set(next.slug,next);}
  }

  const seriesBySlug=new Map((DATA.series||[]).map(s=>[s.slug,s]));
  for(const row of dbSeries){
    const next=seriesRow(row,workSlugMap),old=seriesBySlug.get(next.slug);
    if(old)Object.assign(old,mergeReal(old,next));
    else{DATA.series.push(next);seriesBySlug.set(next.slug,next);}
  }

  rebuildMaps();
  window.EDIOURO_CMS_SYNC={
    status:'ready',source:'supabase+static-fallback',
    works:dbWorks.length,editions:dbEditions.length,
    contributors:dbContributors.length,series:dbSeries.length,
    syncedAt:new Date().toISOString()
  };
}
window.ediouroCmsBootstrap=function(){
  if(bootPromise)return bootPromise;
  bootPromise=sync().catch(err=>{
    console.warn('[Ediouro CMS] fallback para catálogo estático:',err);
    window.EDIOURO_CMS_SYNC={status:'fallback',error:String(err),syncedAt:new Date().toISOString()};
  });
  return bootPromise;
};
})();