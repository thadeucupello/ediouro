(function(){
function eduArchiveBooks(section){
  return DATA.works.filter(function(w){
    return w.education && (!section || w.education.section===section);
  });
}
var EDU_ARCHIVE_SECTIONS=[
  {key:'educacao-infantil',label:'Educação Infantil',age:'0 a 5 anos'},
  {key:'fundamental-1-1',label:'Fundamental I · 1º ano',age:'A partir de 6 anos'},
  {key:'fundamental-1-2',label:'Fundamental I · 2º ano',age:'A partir de 7 anos'},
  {key:'fundamental-1-3',label:'Fundamental I · 3º ano',age:'A partir de 8 anos'},
  {key:'fundamental-1-4',label:'Fundamental I · 4º ano',age:'A partir de 9 anos'},
  {key:'fundamental-1-5',label:'Fundamental I · 5º ano',age:'A partir de 10 anos'},
  {key:'referencia',label:'Obras de referência',age:'Consulta e apoio escolar'},
  {key:'professor',label:'Biblioteca do Professor',age:'Formação e prática pedagógica'}
];
function eduArchiveNorm(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function eduArchiveSearchText(w){
  var e=w.education||{};
  var authors='';
  try{
    if(typeof C!=='undefined'){
      authors=(w.credits||[]).map(function(x){return (C[x.contributor]&&C[x.contributor].name)||''}).filter(Boolean).join(' ');
    }
  }catch(err){}
  return eduArchiveNorm([w.title,authors,e.label,e.age,e.genre,e.themes,e.transversal].filter(Boolean).join(' '));
}
window.filterEducationArchive=function(value){
  var q=eduArchiveNorm(value);
  var items=[].slice.call(document.querySelectorAll('.edu-archive-book'));
  var visible=0;
  items.forEach(function(el){
    var ok=!q || String(el.getAttribute('data-edu-search')||'').indexOf(q)>=0;
    el.hidden=!ok;
    if(ok)visible++;
  });
  var summary=document.getElementById('eduArchiveResult');
  if(summary)summary.textContent=visible+' '+(visible===1?'título':'títulos');
  var empty=document.getElementById('eduArchiveEmpty');
  if(empty)empty.hidden=visible!==0;
};
window.educationArchivePage=function(params){
  var active=params&&params.get?params.get('etapa')||'':'';
  var all=eduArchiveBooks('');
  var books=eduArchiveBooks(active);
  var activeMeta=EDU_ARCHIVE_SECTIONS.find(function(s){return s.key===active});
  var chips='<button class="edu-archive-chip '+(!active?'active':'')+'" onclick="go(\'/educacao/acervo\')">Todos <span>'+all.length+'</span></button>';
  chips+=EDU_ARCHIVE_SECTIONS.map(function(s){
    var n=eduArchiveBooks(s.key).length;
    if(!n)return '';
    return '<button class="edu-archive-chip '+(active===s.key?'active':'')+'" onclick="go(\'/educacao/acervo?etapa='+s.key+'\')">'+esc(s.label)+' <span>'+n+'</span></button>';
  }).join('');
  var cards=books.map(function(w){
    return '<div class="edu-archive-book" data-edu-search="'+esc(eduArchiveSearchText(w))+'">'+bookCard(w)+'</div>';
  }).join('');
  return '<main class="education-page education-archive-page">'+
    '<section class="edu-archive-hero"><div class="wrap">'+
      '<div class="link edu-back" onclick="go(\'/educacao\')">← Voltar para Educação</div>'+
      '<div class="eyebrow">Ediouro Educação</div>'+
      '<div class="edu-archive-title"><div><h1>Acervo educacional</h1><p>Consulte os '+all.length+' títulos mapeados no Catálogo Infantil 2026/2027 por etapa, gênero e temas de trabalho.</p></div><strong>'+all.length+'</strong></div>'+
    '</div></section>'+
    '<section class="edu-archive-tools"><div class="wrap">'+
      '<div class="edu-archive-filter-head"><div><div class="eyebrow">Filtrar por etapa</div><h2>'+(activeMeta?esc(activeMeta.label):'Todos os títulos')+'</h2></div><div class="result-summary" id="eduArchiveResult">'+books.length+' '+(books.length===1?'título':'títulos')+'</div></div>'+
      '<div class="edu-archive-chips">'+chips+'</div>'+
      '<div class="edu-archive-search"><label for="eduArchiveSearch">Buscar neste acervo</label><input id="eduArchiveSearch" type="search" placeholder="Título, autor, gênero ou tema" oninput="filterEducationArchive(this.value)"></div>'+
    '</div></section>'+
    '<section class="edu-archive-catalog"><div class="wrap"><div class="catalog-grid">'+cards+'</div><div id="eduArchiveEmpty" class="edu-archive-empty" hidden>Nenhum título encontrado com esse termo.</div></div></section>'+
  '</main>';
};
var beforeEducationArchive=educationPage;
educationPage=function(params){
  var out=beforeEducationArchive(params);
  var total=eduArchiveBooks('').length;
  out=out.replace('onclick="document.getElementById(\'eduCatalog\')?.scrollIntoView({behavior:\'smooth\'})">Explorar o acervo</div>','onclick="document.getElementById(\'eduStages\')?.scrollIntoView({behavior:\'smooth\'})">Explorar por etapa</div>');
  out=out.replace('<section><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Por etapa</div>','<section id="eduStages"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Por etapa</div>');
  out=out.replace(/go\('\/educacao\?etapa=/g,"go('/educacao/acervo?etapa=");
  out=out.replace(/<section id="eduCatalog" class="edu-catalog">[\s\S]*?<\/section>\s*(?=<section class="edu-downloads">|<section class="edu-values">)/,'');
  var fullCard='<article class="edu-stage edu-stage-all" onclick="go(\'/educacao/acervo\')"><div class="eyebrow">'+total+' títulos</div><h3>Acervo completo</h3><p>Ver todos os livros em uma página de consulta</p></article>';
  var marker='<div class="edu-stage-grid">';
  var p=out.indexOf(marker);
  if(p>=0){
    var close=out.indexOf('</div></div></section>',p);
    if(close>=0)out=out.slice(0,close)+fullCard+out.slice(close);
  }
  return out;
};
var beforeBookArchive=bookPage;
bookPage=function(slug,params){
  var out=beforeBookArchive(slug,params);
  return out.replace(/go\('\/educacao\?etapa=/g,"go('/educacao/acervo?etapa=");
};
function renderEducationArchiveRoute(){
  var raw=location.hash.slice(1)||'/';
  var parts=raw.split('?');
  if(parts[0]!=='/educacao/acervo')return false;
  var params=new URLSearchParams(parts[1]||'');
  var app=document.getElementById('app');
  if(!app)return false;
  app.innerHTML=header()+educationArchivePage(params)+footer();
  scrollTo(0,0);
  return true;
}
addEventListener('hashchange',function(){setTimeout(renderEducationArchiveRoute,0)});
addEventListener('DOMContentLoaded',function(){setTimeout(renderEducationArchiveRoute,0)});
var style=document.createElement('style');
style.textContent=
'.edu-stage-all{background:#143f39;color:#fff;border-color:#143f39}.edu-stage-all .eyebrow,.edu-stage-all p{color:#e1ddd4}'+
'.edu-archive-hero{background:#143f39;color:#f6f1e8;padding:58px 0 52px}.edu-back{color:#fff;border-color:#fff;margin-bottom:34px;display:inline-block}.edu-archive-title{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:end}.edu-archive-title h1{font:64px/.95 Georgia,serif;margin:10px 0 14px}.edu-archive-title p{max-width:720px;color:#ddd8cf;font:17px/1.55 Georgia,serif}.edu-archive-title strong{font:82px/.85 Georgia,serif}'+
'.edu-archive-tools{background:#f5f0e7;padding:46px 0 34px}.edu-archive-filter-head{display:flex;justify-content:space-between;gap:30px;align-items:end}.edu-archive-filter-head h2{font:42px/1 Georgia,serif;margin:8px 0 0}.edu-archive-chips{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 28px}.edu-archive-chip{border:1px solid #bfb5a6;background:#fff;padding:10px 12px;cursor:pointer;font:700 10px/1.2 Archivo,Arial,sans-serif;letter-spacing:.02em;color:#3d3831}.edu-archive-chip span{opacity:.6;margin-left:5px}.edu-archive-chip.active,.edu-archive-chip:hover{background:#143f39;color:#fff;border-color:#143f39}'+
'.edu-archive-search{display:grid;grid-template-columns:150px minmax(0,520px);gap:20px;align-items:center;border-top:1px solid #d4cabc;padding-top:20px}.edu-archive-search label{font:700 9px/1.2 Archivo,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#665e54}.edu-archive-search input{border:0;border-bottom:1px solid #675f56;background:transparent;padding:11px 0;outline:none;font:16px/1.3 Arial,sans-serif;color:#231f1a}'+
'.edu-archive-catalog{background:#e9e2d7;padding:54px 0 72px}.edu-archive-book[hidden]{display:none!important}.edu-archive-empty{font:30px/1.15 Georgia,serif;padding:40px 0;color:#5f574e}'+
'@media(max-width:760px){.edu-archive-title{grid-template-columns:1fr}.edu-archive-title h1{font-size:48px}.edu-archive-title strong{font-size:60px}.edu-archive-filter-head{align-items:flex-start;flex-direction:column}.edu-archive-search{grid-template-columns:1fr;gap:8px}.edu-archive-chip{padding:9px 10px}}';
document.head.appendChild(style);
window.EDIOURO_EDUCATION_ARCHIVE={route:'/educacao/acervo',mapped:eduArchiveBooks('').length};
})();