(function(){
const EDIOURO_COVER_BASE='https://wubthvvtncflzkblgtzh.supabase.co/storage/v1/object/public/catalog-covers/';
const EDIOURO_CATALOG_FIXES={
  'E do meio do mundo prostituto só amores guardei ao meu charuto':{
    isbn:'9788520929964',
    author:'Rubem Fonseca'
  }
};
for(const [title,fix] of Object.entries(EDIOURO_CATALOG_FIXES)){
  const work=(DATA.works||[]).find(w=>String(w?.title||'').trim()===title);
  if(!work)continue;
  for(const e of (DATA.editions||[]).filter(e=>e.workSlug===work.slug)){
    e.isbn=fix.isbn;
    e.ean=fix.isbn;
    e.source={...(e.source||{}),sku:fix.isbn,catalogCorrection:'2026-09-18'};
  }
  const contributor=(DATA.contributors||[]).find(x=>String(x?.name||'').trim().toLocaleLowerCase('pt-BR')===fix.author.toLocaleLowerCase('pt-BR'));
  if(contributor){
    work.credits=work.credits||[];
    if(!work.credits.some(x=>x?.role==='autor'&&x?.contributor===contributor.slug)){
      work.credits.push({contributor:contributor.slug,role:'autor'});
    }
  }
}
function ediouroCatalogCoverKey(value){
  return String(value||'').replace(/\D/g,'');
}
function ediouroEditionCoverKey(e){
  for(const value of [e?.isbn,e?.ean,e?.source?.sku]){
    const key=ediouroCatalogCoverKey(value);
    if(key.length===13)return key;
  }
  return '';
}
function ediouroCatalogCoverUrl(value){
  const key=ediouroCatalogCoverKey(value);
  return key.length===13?EDIOURO_COVER_BASE+key+'.jpg':'';
}
window.ediouroCatalogCoverUrl=ediouroCatalogCoverUrl;

// A partir de 18/09/2026, o catálogo público usa as cópias próprias do Grupo Ediouro
// no Supabase, nomeadas pelo ISBN. O RGE fica somente como acervo/origem mestre.
// Algumas edições antigas têm ISBN formatado ou incompleto; nesses casos usamos a
// edição irmã da mesma obra para que o card não permaneça em "Capa em atualização".
const ediouroWorkCoverKey={};
(DATA.editions||[]).forEach(e=>{
  const key=ediouroEditionCoverKey(e);
  if(key&&!ediouroWorkCoverKey[e.workSlug])ediouroWorkCoverKey[e.workSlug]=key;
});
(DATA.editions||[]).forEach(e=>{
  const key=ediouroEditionCoverKey(e)||ediouroWorkCoverKey[e.workSlug]||'';
  if(key)e.cover=EDIOURO_COVER_BASE+key+'.jpg';
});
window.ediouroCoverError=function(img){
  const box=img&&img.closest?img.closest('.cover'):null;
  if(!box)return;
  box.classList.add('cover-broken');
  img.remove();
};
function coverPlaceholderV2(w,cls=''){
  return `<div class="cover cover-broken ${cls}" role="img" aria-label="Capa em atualização"><div class="cover-fallback"><strong>Capa em atualização</strong></div></div>`;
}
cover=function(w,cls=''){
  const url=coverUrl(w);
  if(!url)return coverPlaceholderV2(w,cls);
  return `<div class="cover ${cls}"><img src="${esc(url)}" alt="Capa de ${esc(w.title)}" loading="lazy" decoding="async" onerror="ediouroCoverError(this)"><div class="cover-fallback"><strong>Capa em atualização</strong></div></div>`;
};
coverForEdition=function(w,e){
  const url=e?.cover||coverUrl(w);
  if(!url)return coverPlaceholderV2(w);
  return `<div class="cover"><img src="${esc(url)}" alt="Capa de ${esc(w.title)}" decoding="async" onerror="ediouroCoverError(this)"><div class="cover-fallback"><strong>Capa em atualização</strong></div></div>`;
};
const style=document.createElement('style');
style.textContent=`
:root{--ediouro-cover-bg:#d8d1c5;--ediouro-cover-shadow:0 15px 28px -20px rgba(0,0,0,.8)}
.book-cover{aspect-ratio:2/3;background:var(--ediouro-cover-bg);overflow:hidden;box-shadow:var(--ediouro-cover-shadow)!important}
.book-cover>.cover{width:100%;height:100%;aspect-ratio:auto}
.cover{position:relative;background:var(--ediouro-cover-bg);overflow:hidden}
.cover img{width:100%;height:100%;object-fit:contain;display:block;background:transparent}
.cover-fallback{display:none;width:100%;height:100%;min-height:100%;place-items:center;text-align:center;padding:20px;background:#d8d1c5;color:#6f675f}
.cover-fallback strong{font:700 10px/1.35 Archivo,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;max-width:120px}
.cover.cover-broken{display:grid;place-items:stretch;background:#d8d1c5}
.cover.cover-broken .cover-fallback{display:grid}
.cover.cover-broken img{display:none!important}
.catalog-grid .book-cover{width:100%!important;aspect-ratio:2/3}
.catalog-grid .book-cover .cover{width:100%;height:100%;aspect-ratio:auto}
.shelf .book-cover{aspect-ratio:2/3}
.detail-top>div:first-child>.cover{aspect-ratio:2/3;box-shadow:var(--ediouro-cover-shadow)}
.series-covers .cover,.mini-row .cover,.brand-mini .cover,.volume .cover{background:var(--ediouro-cover-bg)}
`;
document.head.appendChild(style);
window.EDIOURO_COVER_POLICY={
  canonicalSource:'Supabase catalog-covers (originais preservados no Drive/RGE)',
  naming:'ISBN-13.jpg',
  ecommerceFallback:false,
  brokenImageFallback:'placeholder institucional',
  cardRatio:'2:3',
  rule:'O site público não depende mais das URLs de capa do RGE/SimpleSet.'
};
})();