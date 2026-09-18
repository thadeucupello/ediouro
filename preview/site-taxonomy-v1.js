(function(){
const COLLECTION_NAMED_RGE=[["9786586668933","Coleção Milkshake"],["9786586668988","Coleção Milkshake"],["9788582782415","Coleção Haja Vista"],["9788520934999","Coleção Cícero"],["9786556401904","Clássicos de Ouro"],["9786556404028","Clássicos de Ouro"],["9786556401386","Clássicos de Ouro"],["9786581349714","Coleção Milkshake"],["9786581349981","Coleção Milkshake"],["9786556405520","Clássicos de Ouro"],["9786556401287","Clássicos de Ouro"],["9788520947395","Coleção Cícero"],["9788560347810","Coleção Milkshake"],["9786556402284","Clássicos de Ouro"],["9786556400778","Clássicos de Ouro"],["9788582782422","Coleção Haja Vista"],["9786556400594","Coleção Cícero"],["9786583894021","Coleção Haja Vista"],["9786556402512","Clássicos de Ouro"],["9786556403076","Clássicos de Ouro"],["9786556400136","Clássicos de Ouro"],["9786556400259","Clássicos de Ouro"],["9786581349387","Coleção Milkshake"],["9786556400457","Clássicos de Ouro"],["9786551990212","Coleção Milkshake"],["9786556408552","Coleção Jovem Leitor"],["9786556400211","Clássicos de Ouro"],["9786556407036","Clássicos de Ouro"],["9786556407630","Coleção Jovem Leitor"],["9786556400808","Coleção Cícero"],["9786556408941","Clássicos de Ouro"],["9786556401270","Clássicos de Ouro"],["9786583894052","Coleção Haja Vista"],["9786556408248","Clássicos de Ouro"],["9786556402185","Clássicos de Ouro"],["9786556404776","Clássicos de Ouro"],["9786556402529","Clássicos de Ouro"],["9786556400464","Clássicos de Ouro"],["9788520937433","Coleção Cícero"],["9786556403144","Coleção Cícero"],["9786556401614","Clássicos de Ouro"],["9786556408583","Clássicos de Ouro"],["9786581349394","Coleção Milkshake"],["9786586668919","Coleção Milkshake"],["9788520943359","Coleção Cícero"],["9786556406091","Clássicos de Ouro"],["9786556409610","Clássicos de Ouro"],["9786586668841","Coleção Milkshake"],["9786581349400","Coleção Milkshake"],["9786581349554","Coleção Milkshake"],["9786556407623","Coleção Jovem Leitor"],["9786581349431","Coleção Milkshake"],["9786556404592","Clássicos de Ouro"],["9786556401621","Clássicos de Ouro"],["9786586668902","Coleção Milkshake"],["9786556401607","Clássicos de Ouro"],["9786556402055","Clássicos de Ouro"],["9786556406947","Coleção Jovem Leitor"],["9786586668926","Coleção Milkshake"],["9788520941492","Clássicos de Ouro"],["9786581349585","Coleção Milkshake"],["9786581349660","Coleção Milkshake"],["9786556405728","Coleção CPT"],["9786581349578","Coleção Milkshake"],["9786556406978","Clássicos de Ouro"],["9786586668940","Coleção Milkshake"],["9786581349424","Coleção Milkshake"],["9786556405858","Coleção CPT"],["9786556405643","Coleção CPT"],["9786556407074","Clássicos de Ouro"],["9786586668834","Coleção Milkshake"],["9786556405872","Coleção CPT"],["9786556405704","Coleção CPT"],["9786556407654","Coleção Cícero"],["9786556405841","Coleção CPT"],["9786556402062","Clássicos de Ouro"]];
const COLLECTION_AUTHOR_RGE=[["9788520938393","ARIANO SUASSUNA"],["9786556409412","ARIANO SUASSUNA"],["9788520947210","BERTRAND RUSSELL"],["9786556405094","CARLOS HEITOR CONY"],["9786556409665","ARIANO SUASSUNA"],["9786556401263","RUBEM FONSECA"],["9788520941638","ARIANO SUASSUNA"],["9786556407593","MAYA ANGELOU"],["9786556409740","SIMONE DE BEAUVOIR"],["9788520947326","MAYA ANGELOU"],["9786556401973","EVANILDO BECHARA"],["9786556400587","NELSON RODRIGUES"],["9786556404622","ARIANO SUASSUNA"],["9786556403267","NELSON RODRIGUES"],["9786556400617","CARLOS HEITOR CONY"],["9786556408781","SIMONE DE BEAUVOIR"],["9788520942864","ARIANO SUASSUNA"],["9786556400556","NELSON RODRIGUES"],["9786556401492","RUBEM FONSECA"],["9788520942895","ARIANO SUASSUNA"],["9786556402659","EVANILDO BECHARA"],["9788520945070","CARLOS HEITOR CONY"],["9786556406589","NELSON RODRIGUES"],["9788520943366","RUBEM FONSECA"],["9786556409818","BERTRAND RUSSELL"],["9786556400525","NELSON RODRIGUES"],["9786556400822","NELSON RODRIGUES"],["9786556400785","RUBEM FONSECA"],["9786556402895","NELSON RODRIGUES"],["9786556401508","CARLOS HEITOR CONY"],["9786556405957","SIMONE DE BEAUVOIR"],["9786556407388","SIMONE DE BEAUVOIR"],["9786556408866","EVANILDO BECHARA"],["9786556406909","EVANILDO BECHARA"],["9786556401942","NELSON RODRIGUES"],["9786556404899","EVANILDO BECHARA"],["9786556405940","BERTRAND RUSSELL"],["9788520942888","ARIANO SUASSUNA"],["9786556404646","ARIANO SUASSUNA"],["9786556408491","SIMONE DE BEAUVOIR"],["9788520931158","EVANILDO BECHARA"],["9788520939277","ARIANO SUASSUNA"],["9788520933619","MÁRIO DE ANDRADE"],["9786556401683","RUBEM FONSECA"],["9786556403380","NELSON RODRIGUES"],["9788520933350","NELSON RODRIGUES"],["9786556408507","SIMONE DE BEAUVOIR"],["9786556409368","EVANILDO BECHARA"],["9788520923450","EVANILDO BECHARA"],["9788520944271","ARIANO SUASSUNA"],["9786556400792","NELSON RODRIGUES"],["9786556401911","BERTRAND RUSSELL"],["9786556408392","BERTRAND RUSSELL"],["9786556400754","ARIANO SUASSUNA"],["9786556403403","ARIANO SUASSUNA"],["9786556403274","ARIANO SUASSUNA"],["9786556408675","RUBEM FONSECA"],["9786556409030","SIMONE DE BEAUVOIR"],["9788520944776","ARIANO SUASSUNA"],["9786556403250","EVANILDO BECHARA"],["9786556408682","RUBEM FONSECA"],["9788520940648","CARLOS HEITOR CONY"],["9786556406282","SIMONE DE BEAUVOIR"],["9786556406480","EVANILDO BECHARA"],["9786556409658","RUBEM FONSECA"],["9788520924686","MÁRIO DE ANDRADE"],["9786556401959","ARIANO SUASSUNA"],["9788520923818","MÁRIO DE ANDRADE"],["9788520929919","MÁRIO DE ANDRADE"],["9786556407258","MAYA ANGELOU"],["9788520927793","MÁRIO DE ANDRADE"],["9788520937631","CARLOS HEITOR CONY"],["9786556403908","EVANILDO BECHARA"],["9788520944615","NELSON RODRIGUES"],["9786556403694","RUBEM FONSECA"],["9788520930694","NELSON RODRIGUES"],["9788520933312","MÁRIO DE ANDRADE"],["9786556401966","RUBEM FONSECA"]];
const COLLECTION_CURATED_OVERRIDES=[["9786556407593","Coleção Maya Angelou","author"],["9786556408408","Coleção Maya Angelou","author"],["9786556406916","Coleção Maya Angelou","author"],["9788520947326","Coleção Maya Angelou","author"]]
const READING_RGE_RANK=["9788582782408","9786556402581","9786581339180","9786558371458","9788520938393","9786589132684","9786598579982","9786581339197","9786558371878","9786556401287","9786581339203","9786581339210","9786558371243","9786556403083","9786556401386","9786556400136","9786581339333","9786581339128","9788582782170","9786581339067","9786558372226","9788520947289","9786581339098","9786589132714","9788520941638","9786589132943","9786556407074","9786556408866"];
const digitsV=s=>String(s||'').replace(/\D/g,'');
const pubDateV=w=>(ED[w.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort().reverse()[0]||'';
const latestFirstV=(a,b)=>pubDateV(b).localeCompare(pubDateV(a))||a.title.localeCompare(b.title,'pt-BR');
const slugV=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const hardbackV=e=>/capa[- ]?dura|hardcover/i.test([e?.format,e?.binding,e?.label].join(' '));
const isbnEditionV=new Map();
DATA.editions.forEach(e=>{const k=digitsV(e.isbn||e.ean);if(k)isbnEditionV.set(k,e)});

// Ordem padrão de agrupamentos: lançamento mais recente primeiro.
DATA.works.sort(latestFirstV);

// Corrige e completa as séries editoriais conhecidas.
function setSeriesV(slug,name,mainContributor,imprint,description,slugs){
 let s=S[slug];
 if(!s){s={slug,name,mainContributor,imprint,description,workSlugs:[]};DATA.series.push(s);S[slug]=s}
 s.name=name||s.name;s.mainContributor=mainContributor||s.mainContributor;s.imprint=imprint||s.imprint;s.description=description||s.description;
 const list=[];
 for(const x of slugs){if(W[x]&&!list.includes(x))list.push(x)}
 for(const w of DATA.works){if(w.series===slug&&!list.includes(w.slug))list.push(w.slug)}
 s.workSlugs=list;
 list.forEach((x,i)=>{if(W[x]){W[x].series=slug;if(!Number.isFinite(W[x].seriesOrder))W[x].seriesOrder=i+1}});
}
function workSlugByIsbnV(isbn){
 const e=isbnEditionV.get(digitsV(isbn));
 return e&&W[e.workSlug]?e.workSlug:null;
}
function seriesMembersV(isbns,fallback=[]){
 const out=[];
 for(const isbn of isbns){const s=workSlugByIsbnV(isbn);if(s&&!out.includes(s))out.push(s)}
 for(const s of fallback){if(W[s]&&!out.includes(s))out.push(s)}
 return out;
}
if(W['mistborn-historia-secreta'])delete W['mistborn-historia-secreta'].series;
setSeriesV('mistborn','Mistborn — Trilogia Original','brandon-sanderson','trama','A trilogia original de Mistborn: O Império Final, O Poço da Ascensão e O Herói das Eras.',seriesMembersV(['9786581339180','9786581339197','9786581339203'],['mistborn-o-imperio-final','mistborn-o-poco-da-ascensao','mistborn-o-heroi-das-eras']));
setSeriesV('mistborn-wax-wayne','Mistborn — Wax & Wayne','brandon-sanderson','trama','A segunda era de Mistborn, acompanhando Wax e Wayne em uma Scadrial em transformação.',seriesMembersV(['9786581339753','9786581339760','9786581339777','9786581339784'],['mistborn-a-liga-da-lei','mistborn-as-sombras-de-si-mesmo','mistborn-os-braceletes-da-perdicao','mistborn-o-metal-perdido']));
setSeriesV('arquivo-das-tempestades','Os Relatos da Guerra das Tempestades','brandon-sanderson','trama','Roshar é varrido por tempestades que moldam a vida, a guerra e a magia.',seriesMembersV(['9786589132684','9786589132714','9786589132967','9786581339210'],['o-caminho-dos-reis','palavras-de-radiancia','sacramentadora','ritmo-da-guerra','vento-e-verdade']));
setSeriesV('bloodsworn','Saga Bloodsworn','john-gwynne','trama','Fantasia épica de inspiração nórdica, com deuses mortos, juramentos e batalhas.',['a-sombra-dos-deuses','a-fome-dos-deuses','a-furia-dos-deuses']);
setSeriesV('legado-do-ferro-negro','O Legado do Ferro Negro','gareth-hanrahan','trama','A série de fantasia de Gareth Hanrahan ambientada em Guerdon.',['a-oracao-dos-miseraveis','o-santo-das-sombras','o-deus-quebrado']);

// Coleções: RGE como fonte. Só mostramos linhas com volume real.
// "Coleção de Autor" é desdobrada por autor; coleções unitárias ficam de fora.
const COLLECTIONS=[];
const collectionMap=new Map();
const editionCollectionsV={};
const titleNameV=s=>{
 const particles=new Set(['de','da','do','dos','das','e']);
 return String(s||'').trim().toLocaleLowerCase('pt-BR').split(/\s+/).map((w,i)=>i>0&&particles.has(w)?w:w.charAt(0).toLocaleUpperCase('pt-BR')+w.slice(1)).join(' ');
};
const collectionRowsRawV=[
 ...COLLECTION_NAMED_RGE.map(([isbn,name])=>[isbn,name,'named']),
 ...COLLECTION_AUTHOR_RGE.map(([isbn,author])=>[isbn,'Coleção '+titleNameV(author),'author']),
 ...COLLECTION_CURATED_OVERRIDES
];
const collectionRowsV=[...new Map(collectionRowsRawV.map(r=>[r[0]+'|'+r[1],r])).values()];
for(const [isbn,baseName,kind] of collectionRowsV){
 const e=isbnEditionV.get(isbn);if(!e)continue;
 const w=W[e.workSlug];if(!w)continue;
 const hard=hardbackV(e);
 const slug=slugV(w.imprint+'-'+baseName+(hard?'-capa-dura':''));
 let col=collectionMap.get(slug);
 if(!col){
  col={slug,baseName,name:baseName+(hard?' · Capa dura':''),imprint:w.imprint,hardcover:hard,kind,entries:[]};
  collectionMap.set(slug,col);COLLECTIONS.push(col);
 }
 if(!col.entries.some(x=>x.edition.id===e.id))col.entries.push({work:w,edition:e});
 (editionCollectionsV[e.id]??=[]).push(slug);
}
COLLECTIONS.forEach(col=>col.entries.sort((a,b)=>(b.edition.publicationDate||'').localeCompare(a.edition.publicationDate||'')||a.work.title.localeCompare(b.work.title,'pt-BR')));
// Evita transformar classificações unitárias em "coleção" no site.
for(let i=COLLECTIONS.length-1;i>=0;i--){
 if(COLLECTIONS[i].entries.length<2){collectionMap.delete(COLLECTIONS[i].slug);COLLECTIONS.splice(i,1)}
}
for(const [eid,slugs] of Object.entries(editionCollectionsV))editionCollectionsV[eid]=slugs.filter(s=>collectionMap.has(s));
DATA.works.forEach(w=>{w.collections=[]});
for(const w of DATA.works){
 const pe=principal(w);
 w.collections=(pe&&editionCollectionsV[pe.id])?[...editionCollectionsV[pe.id]]:[];
}
COLLECTIONS.sort((a,b)=>{
 const ad=a.entries[0]?.edition?.publicationDate||'',bd=b.entries[0]?.edition?.publicationDate||'';
 return bd.localeCompare(ad)||a.name.localeCompare(b.name,'pt-BR');
});
window.EDIOURO_COLLECTIONS=COLLECTIONS;
window.EDIOURO_EDITION_COLLECTIONS=editionCollectionsV;

function collectionCoverV(entry){
 const w=entry.work,e=entry.edition,u=coverUrl(w,e),im=I[w.imprint]||I.trama;
 return u?'<div class="cover"><img src="'+esc(u)+'" alt="Capa de '+esc(w.title)+'"></div>':'<div class="cover placeholder" style="background:'+im.color+'"><strong>Em breve</strong></div>';
}
function collectionCardV(entry){
 const w=entry.work,e=entry.edition;
 return '<article class="book" onclick="go(\'/livros/'+w.slug+'?edicao='+encodeURIComponent(e.id)+'\')"><div class="book-cover">'+collectionCoverV(entry)+'</div><h3>'+esc(w.title)+'</h3><p>'+esc(authorNames(w)||'Grupo Ediouro')+'</p><small>'+esc(I[w.imprint]?.name||w.imprint)+'</small></article>';
}
function collectionsListV(){
 return '<main class="collections-v1"><div class="page-hero"><div class="wrap"><div class="eyebrow">Coleções Ediouro</div><h1>Livros que pertencem juntos.</h1><p>Coleções identificadas a partir da linha editorial do RGE. Quando uma coleção tem edição em capa dura, ela aparece separadamente.</p></div></div><section><div class="wrap"><div class="collections-grid">'+COLLECTIONS.map(c=>{
  const im=I[c.imprint]||I.trama;
  return '<article class="collection-tile" style="--collection-color:'+im.color+'" onclick="go(\'/colecoes/'+c.slug+'\')"><div class="eyebrow">'+esc(im.name)+(c.hardcover?' · Capa dura':'')+'</div><h2>'+esc(c.baseName)+'</h2><p>'+c.entries.length+' '+(c.entries.length===1?'livro':'livros')+'</p><div class="collection-covers">'+c.entries.slice(0,3).map(collectionCoverV).join('')+'</div><span>Ver coleção →</span></article>'
 }).join('')+'</div></div></section></main>';
}
function collectionPageV(slug){
 const c=collectionMap.get(slug);if(!c)return notFound();
 const im=I[c.imprint]||I.trama;
 return '<main class="collections-v1"><div class="collection-hero" style="background:'+im.color+';color:'+im.ink+'"><div class="wrap"><div class="eyebrow" style="color:inherit;opacity:.72">'+esc(im.name)+(c.hardcover?' · Capa dura':'')+'</div><h1>'+esc(c.baseName)+'</h1><p>'+c.entries.length+' '+(c.entries.length===1?'livro':'livros')+' · do lançamento mais recente ao mais antigo</p></div></div><section><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Coleção</div><h2>Livros da coleção</h2></div><div class="result-summary">'+c.entries.length+' títulos</div></div><div class="catalog-grid">'+c.entries.map(collectionCardV).join('')+'</div></div></section></main>';
}

// "Todo mundo está lendo": RGE 17/09/2026. Ranking por média Nielsen dos
// últimos 3 meses, venda interna como desempate; sem kits/merchandising,
// só títulos publicados, com estoque. Diversidade: máx. 1 por autor e 2 por selo.
function readingNowV(){
 const selected=[],seen=new Set(),authorsUsed=new Set(),imprintCount={};
 for(const isbn of READING_RGE_RANK){
  const e=isbnEditionV.get(isbn);if(!e)continue;
  const w=W[e.workSlug];if(!w||seen.has(w.slug))continue;
  const a=authorSlugs(w)[0]||'';
  if(a&&authorsUsed.has(a))continue;
  if((imprintCount[w.imprint]||0)>=2)continue;
  selected.push({work:w,edition:e,isbn});seen.add(w.slug);if(a)authorsUsed.add(a);imprintCount[w.imprint]=(imprintCount[w.imprint]||0)+1;
  if(selected.length===6)break;
 }
 return selected;
}
function readingCardV(entry){
 const w=entry.work,e=entry.edition;
 return '<article class="book" onclick="go(\'/livros/'+w.slug+'?edicao='+encodeURIComponent(e.id)+'\')"><div class="book-cover">'+coverForEdition(w,e)+'</div><h3>'+esc(w.title)+'</h3><p>'+esc(authorNames(w)||'Grupo Ediouro')+'</p><small>'+esc(I[w.imprint]?.name||w.imprint)+'</small></article>';
}

// Séries: completas e sempre do lançamento mais recente para o mais antigo.
function seriesBooksLatestV(s){
 const set=new Set(s.workSlugs||[]);
 DATA.works.forEach(w=>{if(w.series===s.slug)set.add(w.slug)});
 return [...set].map(x=>W[x]).filter(Boolean).sort(latestFirstV);
}
seriesList=function(){
 const list=[...DATA.series].filter(s=>seriesBooksLatestV(s).length).sort((a,b)=>{
  const ad=pubDateV(seriesBooksLatestV(a)[0]||{}),bd=pubDateV(seriesBooksLatestV(b)[0]||{});
  return bd.localeCompare(ad)||a.name.localeCompare(b.name,'pt-BR');
 });
 const totalBooks=list.reduce((n,s)=>n+seriesBooksLatestV(s).length,0);
 return '<main><div class="series-index-hero"><div class="wrap"><div class="eyebrow">Séries e universos</div><h1>Histórias que continuam.</h1><p>Todos os livros de cada série, organizados do lançamento mais recente para o mais antigo.</p><div class="series-index-strip"><span>'+list.length+' séries</span><span>'+totalBooks+' livros relacionados</span></div></div></div><section><div class="wrap"><div class="series-showcase">'+list.map(s=>{
  const books=seriesBooksLatestV(s),im=I[s.imprint]||I.trama,a=s.mainContributor?C[s.mainContributor]:null;
  return '<article class="series-showcase-card" style="background:'+im.color+';color:'+im.ink+'" onclick="go(\'/series/'+s.slug+'\')"><div><div class="eyebrow" style="color:inherit;opacity:.68">'+esc(im.name)+' · '+books.length+' '+(books.length===1?'livro':'livros')+'</div><h2>'+esc(s.name)+'</h2><p>'+esc(s.description||'')+'</p><div class="series-showcase-meta">'+(a?'<span>'+esc(a.name)+'</span>':'')+'<span>Ver série</span></div></div><div class="series-showcase-covers">'+books.slice(0,3).map(w=>cover(w)).join('')+'</div></article>'
 }).join('')+'</div></div></section></main>';
};
seriesPage=function(slug){
 const s=S[slug];if(!s)return notFound();
 const im=I[s.imprint]||I.trama,a=s.mainContributor?C[s.mainContributor]:null,books=seriesBooksLatestV(s);
 const editions=books.flatMap(w=>ED[w.slug]||[]),onSale=editions.filter(e=>e.status==='em-catalogo'||e.status==='pre-venda').length;
 return '<main><div class="series-detail-hero" style="background:'+im.color+';color:'+im.ink+'"><div class="wrap series-detail-grid"><div><div class="eyebrow" style="color:inherit;opacity:.7">'+esc(im.name)+' · Série</div><h1>'+esc(s.name)+'</h1><p>'+esc(s.description||'')+'</p><div class="series-facts"><div class="series-fact"><strong>'+books.length+'</strong><span>livros</span></div><div class="series-fact"><strong>'+onSale+'</strong><span>edições disponíveis</span></div></div></div><div class="series-detail-covers">'+books.slice(0,3).map(w=>cover(w)).join('')+'</div></div></div><section style="padding-top:30px"><div class="wrap"><div class="series-reading-head"><div><div class="eyebrow">Do mais recente ao primeiro</div><h2>Livros da série</h2></div><div class="result-summary">'+books.length+' títulos</div></div><div class="series-reading-list">'+books.map(w=>{
  const e=principal(w),d=e.publicationDate?new Date(e.publicationDate+'T12:00:00').toLocaleDateString('pt-BR',{year:'numeric',month:'long'}):'';
  return '<article class="series-reading-item" onclick="go(\'/livros/'+w.slug+'\')"><div>'+cover(w)+'</div><div class="series-reading-copy"><div class="eyebrow">'+esc(d)+(e.status==='pre-venda'?' · Pré-venda':'')+'</div><h3>'+esc(w.title)+'</h3><p>'+esc(w.shortDescription||'')+'</p></div><div class="series-reading-arrow">→</div></article>'
 }).join('')+'</div></div></section></main>';
};

// Marca também passa a herdar a ordem global por lançamento.
const brandPageBeforeCollections=brandPage;
brandPage=function(slug){return brandPageBeforeCollections(slug).replaceAll('Ver ordem de leitura','Ver série')};

// Navegação.
const headerBeforeCollections=header;
header=function(){
 let out=headerBeforeCollections();
 out=out.replace('<a href="#/series">Séries</a>','<a href="#/series">Séries</a><a href="#/colecoes">Coleções</a>');
 out=out.replace('<div class="mobile-main-link" onclick="menuGo(\'/series\')">Séries</div>','<div class="mobile-main-link" onclick="menuGo(\'/series\')">Séries</div><div class="mobile-main-link" onclick="menuGo(\'/colecoes\')">Coleções</div>');
 return out;
};
const footerBeforeCollections=footer;
footer=function(){return footerBeforeCollections().replace('<li onclick="go(\'/series\')">Séries</li>','<li onclick="go(\'/series\')">Séries</li><li onclick="go(\'/colecoes\')">Coleções</li>')};

const homeBeforeCollections=home;
home=function(){
 let out=homeBeforeCollections(),read=readingNowV(),top=COLLECTIONS.slice(0,4);
 out=out.replace(/(<section><div class="wrap"><div class="sec-head"><h2>Todo mundo está lendo<\/h2><\/div><div class="shelf">)[\s\S]*?(<\/div><\/div><\/section>)/,'$1'+read.map(readingCardV).join('')+'$2');
 if(top.length){
  const block='<section class="home-collections"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Coleções</div><h2>Nossas coleções</h2></div><div class="link" onclick="go(\'/colecoes\')">Ver todas</div></div><div class="home-collection-grid">'+top.map(c=>'<article onclick="go(\'/colecoes/'+c.slug+'\')"><div class="eyebrow">'+esc(I[c.imprint]?.name||'Ediouro')+'</div><h3>'+esc(c.name)+'</h3><span>'+c.entries.length+' livros →</span></article>').join('')+'</div></div></section>';
  out=out.replace('<section><div class="wrap"><div class="sec-head"><h2>Todo mundo está lendo</h2>',block+'<section><div class="wrap"><div class="sec-head"><h2>Todo mundo está lendo</h2>');
 }
 return out;
};

const routerBeforeCollections=router;
router=function(){
 const raw=location.hash.slice(1)||'/',parts=raw.split('?'),path=parts[0];
 if(path==='/colecoes'||path.startsWith('/colecoes/')){
  const body=path==='/colecoes'?collectionsListV():collectionPageV(decodeURIComponent(path.split('/')[2]));
  document.getElementById('app').innerHTML=header()+body+footer();scrollTo(0,0);return;
 }
 return routerBeforeCollections();
};

window.EDIOURO_TAXONOMY_AUDIT={
 rgeNamedCollectionRows:COLLECTION_NAMED_RGE.length,
 rgeAuthorCollectionRows:COLLECTION_AUTHOR_RGE.length,
 liveCollections:COLLECTIONS.length,
 readingCriterion:'Nielsen média últimos 3 meses; venda interna como desempate; publicados, em estoque, sem kits/merchandising; máximo 1 por autor e 2 por selo',
 stormlight:seriesBooksLatestV(S['arquivo-das-tempestades']).map(w=>w.title),
 mistborn:seriesBooksLatestV(S['mistborn']).map(w=>w.title),
 mistbornWaxWayne:seriesBooksLatestV(S['mistborn-wax-wayne']).map(w=>w.title),
 seriesVisible:DATA.series.filter(s=>seriesBooksLatestV(s).length).map(s=>({slug:s.slug,name:s.name,count:seriesBooksLatestV(s).length})),
 mayaAngelouCollection:collectionMap.get(slugV('nova-fronteira-Coleção Maya Angelou'))?.entries.map(x=>({isbn:digitsV(x.edition.isbn||x.edition.ean),title:x.work.title}))||[],
 readingNow:readingNowV().map(x=>({isbn:x.isbn,title:x.work.title,edition:x.edition.label||x.edition.format}))
};
})();