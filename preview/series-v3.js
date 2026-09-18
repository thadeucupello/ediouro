function seriesBooksV3(s){
 const listed=(s.workSlugs||[]).map(x=>W[x]).filter(Boolean),seen=new Set(listed.map(w=>w.slug));
 const extras=DATA.works.filter(w=>w.series===s.slug&&!seen.has(w.slug)).sort((a,b)=>{
  const ao=Number.isFinite(a.seriesOrder)?a.seriesOrder:999,bo=Number.isFinite(b.seriesOrder)?b.seriesOrder:999;
  if(ao!==bo)return ao-bo;
  const ad=(ED[a.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort()[0]||'9999';
  const bd=(ED[b.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort()[0]||'9999';
  return ad.localeCompare(bd)||a.title.localeCompare(b.title,'pt-BR');
 });
 return [...listed,...extras]
}
function seriesList(){
 const list=[...DATA.series];
 const totalBooks=list.reduce((n,s)=>n+seriesBooksV3(s).length,0);
 return `<main>
  <div class="series-index-hero"><div class="wrap"><div class="eyebrow">Séries e universos</div><h1>Entre por uma história. Fique por um universo inteiro.</h1><p>Sagas, trilogias e mundos conectados, organizados para você descobrir por onde começar e o que ler depois.</p><div class="series-index-strip"><span onclick="document.getElementById('seriesAll')?.scrollIntoView({behavior:'smooth'})">Todas as séries · ${list.length}</span><span onclick="go('/livros')">${totalBooks} livros relacionados</span>${[...new Set(list.map(s=>I[s.imprint]?.name).filter(Boolean))].map(n=>`<span onclick="go('/livros?marca=${I[Object.keys(I).find(k=>I[k].name===n)]?.slug||''}')">${esc(n)}</span>`).join('')}</div></div></div>
  <section id="seriesAll"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Explore</div><h2>Séries para continuar lendo</h2></div></div><div class="series-showcase">${list.map(s=>{const books=seriesBooksV3(s),im=I[s.imprint]||I.trama,a=s.mainContributor?C[s.mainContributor]:null;return `<article class="series-showcase-card" style="background:${im.color};color:${im.ink}" onclick="go('/series/${s.slug}')"><div><div class="eyebrow" style="color:inherit;opacity:.68">${esc(im.name)} · ${books.length} ${books.length===1?'volume':'volumes'}</div><h2>${esc(s.name)}</h2><p>${esc(s.description||'Conheça os livros desta série e siga a ordem de leitura.')}</p><div class="series-showcase-meta">${a?`<span>${esc(a.name)}</span>`:''}<span>Ver ordem de leitura</span></div></div><div class="series-showcase-covers">${books.slice(0,3).map(w=>cover(w)).join('')}</div></article>`}).join('')}</div>${list.length? '': '<div class="series-empty-note">As séries entram aqui conforme o catálogo for integrado.</div>'}</div></section>
 </main>`
}

function seriesPage(slug){
 const s=S[slug];if(!s)return notFound();
 const im=I[s.imprint]||I.trama;
 const a=s.mainContributor?C[s.mainContributor]:null;
 const books=seriesBooksV3(s);
 const editions=books.flatMap(w=>ED[w.slug]||[]);
 const onSale=editions.filter(e=>e.status==='em-catalogo'||e.status==='pre-venda').length;
 const seriesWorkSlugs=books.map(w=>w.slug);const relatedPosts=POSTS.filter(p=>(p.relatedWorks||[]).some(x=>seriesWorkSlugs.includes(x)));
 const first=books[0];
 return `<main>
  <div class="series-detail-hero" style="background:${im.color};color:${im.ink}"><div class="wrap series-detail-grid"><div><div class="eyebrow" style="color:inherit;opacity:.7">${esc(im.name)} · Série</div><h1>${esc(s.name)}</h1><p>${esc(s.description||'Descubra todos os volumes desta série e siga a ordem de leitura.')}</p><div class="series-detail-actions">${first?`<div class="cta" onclick="go('/livros/${first.slug}')">Começar pelo primeiro livro</div>`:''}<div class="cta" onclick="go('/livros?serie=${s.slug}')">Ver no catálogo</div></div><div class="series-facts"><div class="series-fact"><strong>${books.length}</strong><span>${books.length===1?'volume':'volumes'}</span></div><div class="series-fact"><strong>${onSale||'—'}</strong><span>edições disponíveis</span></div><div class="series-fact"><strong>${a?'1':'—'}</strong><span>autor principal</span></div></div></div><div class="series-detail-covers">${books.slice(0,3).map(w=>cover(w)).join('')}</div></div></div>
  <section><div class="wrap"><div class="series-intro"><div><div class="eyebrow">Sobre a série</div><h2>${books.length>2?'Uma história para acompanhar livro a livro.':'Comece por aqui.'}</h2></div><div><p>${esc(s.description||'Esta página reúne os volumes já integrados ao catálogo, na sequência de leitura cadastrada para a série.')}</p><div class="series-intro-links">${a?`<span class="cross-chip" onclick="go('/autores/${a.slug}')">${esc(a.name)}</span>`:''}<span class="cross-chip" onclick="go('/marcas/${im.slug}')">${esc(im.name)}</span></div></div></div></div></section>
  <section style="padding-top:20px"><div class="wrap"><div class="series-reading-head"><div><div class="eyebrow">Do primeiro ao último</div><h2>Ordem de leitura</h2></div><div class="result-summary">${books.length} ${books.length===1?'livro':'livros'} integrados</div></div><div class="series-reading-list">${books.map((w,i)=>{const e=principal(w);return `<article class="series-reading-item" onclick="go('/livros/${w.slug}')"><div class="series-reading-number">${String(i+1).padStart(2,'0')}</div><div>${cover(w)}</div><div class="series-reading-copy"><div class="eyebrow">Volume ${i+1}${e.status==='pre-venda'?' · Pré-venda':''}</div><h3>${esc(w.title)}</h3><p>${esc(w.shortDescription||'')}</p></div><div style="display:flex;align-items:center"><div class="series-reading-price">${e.price?money(e.price):''}</div><div class="series-reading-arrow">→</div></div></article>`}).join('')}</div></div></section>
  ${relatedPosts.length?`<section class="series-related-band"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Além dos volumes</div><h2>Explore este universo</h2></div></div><div class="series-related-grid"><article class="series-related-feature" onclick="go('/descubra/${relatedPosts[0].slug}')"><div class="eyebrow" style="color:#cfc4b7">${esc(relatedPosts[0].kind)}</div><h3>${esc(relatedPosts[0].title)}</h3><p>${esc(relatedPosts[0].standfirst)}</p></article><div class="series-related-side">${relatedPosts.slice(1).map(p=>`<article class="discover-card" onclick="go('/descubra/${p.slug}')"><div class="eyebrow">${esc(p.kind)}</div><h3>${esc(p.title)}</h3><p>${esc(p.standfirst)}</p></article>`).join('')}</div></div></div></section>`:''}
 </main>`
}