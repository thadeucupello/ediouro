(function(){
const RGE_RANK_V1=["9788582782408","9786556402581","9786581339180","9786558371458","9788520938393","9786589132684","9786598579982","9786581339197","9786558371878","9786556401287","9786581339203","9786581339210","9786558371243","9786556403083","9786556401386","9786556400136","9786581339333","9786581339128","9788582782170","9786581339067","9786558372226","9788520947289","9786581339098","9786589132714","9788520941638","9786589132943","9786556407074","9786556408866"];
const rankMapV1=new Map(RGE_RANK_V1.map((isbn,i)=>[isbn,i]));
const digitsRec=s=>String(s||'').replace(/\D/g,'');
const pubRec=w=>(ED[w.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort().reverse()[0]||'';
const sameAny=(a,b)=>a.some(x=>b.includes(x));
function universeRec(w){
 const authors=authorSlugs(w);
 if(authors.includes('brandon-sanderson')){
  const cosmereSeries=new Set(['mistborn','mistborn-wax-wayne','arquivo-das-tempestades']);
  const cosmereStandalone=new Set(['tress-a-garota-do-mar-esmeralda','warbreaker-o-sopro-dos-deuses','yumi-e-o-pintor-de-pesadelos','o-homem-iluminado','mistborn-historia-secreta']);
  if(cosmereSeries.has(w.series)||cosmereStandalone.has(w.slug))return 'cosmere';
 }
 return w.series||'';
}
function salesBoostRec(w){
 let best=999;
 for(const e of (ED[w.slug]||[])){
  const k=digitsRec(e.isbn||e.ean),r=rankMapV1.get(k);
  if(r!=null&&r<best)best=r;
 }
 return best===999?0:Math.max(1,10-Math.floor(best/3));
}
function recencyBoostRec(w){
 const d=pubRec(w);if(!d)return 0;
 const y=Number(d.slice(0,4)),m=Number(d.slice(5,7)||1);
 if(y>=2026)return 8;
 if(y===2025)return 6;
 if(y===2024)return 4;
 if(y===2023)return 2;
 return 0;
}
function collectionKeysRec(w){
 const e=principal(w);
 return (e&&window.EDIOURO_EDITION_COLLECTIONS?.[e.id])||[];
}
function relatedBooksV1(w,limit=5){
 const seriesShown=w.series&&S[w.series]?.workSlugs?.length>1;
 const universe=universeRec(w),authors=authorSlugs(w),collections=collectionKeysRec(w),cats=w.categories||[],subjects=w.subjects||[];
 return DATA.works
  .filter(x=>x.slug!==w.slug)
  .filter(x=>!(seriesShown&&x.series===w.series))
  .map(x=>{
   let score=0;
   const xu=universeRec(x),xa=authorSlugs(x),xc=collectionKeysRec(x),xcat=x.categories||[],xsub=x.subjects||[];
   if(universe&&xu&&universe===xu&&x.series!==w.series)score+=70;
   if(collections.length&&sameAny(collections,xc))score+=50;
   if(authors.length&&sameAny(authors,xa))score+=40;
   const catShared=cats.filter(c=>xcat.includes(c)).length;score+=Math.min(30,catShared*18);
   const subShared=subjects.filter(s=>xsub.includes(s)).length;score+=Math.min(18,subShared*9);
   if(x.imprint===w.imprint)score+=8;
   score+=salesBoostRec(x)+recencyBoostRec(x);
   return {x,score,date:pubRec(x)};
  })
  .filter(o=>o.score>0)
  .sort((a,b)=>b.score-a.score||b.date.localeCompare(a.date)||a.x.title.localeCompare(b.x.title,'pt-BR'))
  .slice(0,limit).map(o=>o.x);
}
window.EDIOURO_RECOMMENDATION_LOGIC={
 weights:{sameUniverse:70,sameCollection:50,sameAuthor:40,sharedCategory:18,sharedSubject:9,sameImprint:8,rgeSalesUpTo:10,recencyUpTo:8},
 excludesSameDisplayedSeries:true
};

bookPage=function(slug,params){
 const w=W[slug];if(!w)return notFound();
 const eds=ED[slug]||[];let ed=eds.find(e=>e.id===params.get('edicao'))||principal(w)||eds[0]||{};
 const auts=authorSlugs(w).map(s=>C[s]).filter(Boolean),rel=relatedBooksV1(w,5);
 const im=I[w.imprint]||I.trama,ser=w.series?S[w.series]:null;
 return `<main><section><div class="wrap"><div class="breadcrumb"><span class="entity-crumb" onclick="go('/livros')">Livros</span> / <span class="entity-crumb" onclick="go('/marcas/${im.slug}')">${esc(im.name)}</span>${ser?` / <span class="entity-crumb" onclick="go('/series/${ser.slug}')">${esc(ser.name)}</span>`:''} / ${esc(w.title)}</div><div class="detail-top"><div>${coverForEdition(w,ed)}</div><div class="detail-main"><div class="eyebrow entity-eyebrow" style="color:${im.color}" onclick="go('/marcas/${im.slug}')">■ ${esc(im.name)}</div><h1>${esc(w.title)}</h1><p class="detail-author">${entityAuthorLine(w)}</p><p class="detail-pitch">${esc(w.shortDescription||'')}</p><div class="edition-label">ESCOLHA A EDIÇÃO</div><div class="editions">${eds.map(e=>`<button class="ed ${e.id===ed.id?'active':''}" onclick="selectEdition('${slug}','${e.id}')">${esc(e.label||e.format||'Edição')}<small>${money(e.price)}</small></button>`).join('')}</div><div class="price"><span style="display:block;font:700 9px/1.2 'Archivo',Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#7c736b;margin-bottom:5px">Preço sugerido</span>${money(ed.price)||'—'}</div><div class="retail-title">ONDE COMPRAR</div><div class="retail-grid">${['Amazon','Mercado Livre','Travessa','Martins Fontes'].map(n=>`<div class="retail" onclick="window.open('${retailerUrl(n,w,ed)}','_blank')">${esc(n)} <span>↗</span></div>`).join('')}</div><div class="meta-grid"><div><div class="meta-row"><span>Formato</span><strong>${esc(ed.format||'—')}</strong></div><div class="meta-row"><span>Páginas</span><strong>${esc(ed.pageCount||'—')}</strong></div><div class="meta-row"><span>ISBN</span><strong>${esc(ed.isbn||'—')}</strong></div></div><div><div class="meta-row"><span>Acabamento</span><strong>${esc(ed.binding||'—')}</strong></div><div class="meta-row"><span>Dimensões</span><strong>${esc(ed.dimensions||'—')}</strong></div><div class="meta-row"><span>Status</span><strong>${esc(ed.status||'—')}</strong></div><div class="meta-row"><span>EAN</span><strong>${esc(ed.ean||'—')}</strong></div></div></div></div></div>
 <div class="detail-block"><h2>Sobre o livro</h2><div class="bodycopy">${(w.description||[]).map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="tags">${(w.categories||[]).map(c=>`<span class="tag entity-tag" onclick="go('/livros?categoria=${encodeURIComponent(c)}')">${esc(c.replaceAll('-',' '))}</span>`).join('')}</div></div>
 ${ser&&ser.workSlugs.length>1?`<div class="detail-block"><div class="sec-head"><h2 class="entity-crumb" onclick="go('/series/${ser.slug}')">${esc(ser.name)} · série</h2><div class="link" onclick="go('/series/${ser.slug}')">Sobre a série</div></div><div class="volume-list">${(typeof seriesBooksLatestV==='function'?seriesBooksLatestV(ser):ser.workSlugs.map(s=>W[s]).filter(Boolean)).map((sw,i)=>`<div class="volume" onclick="go('/livros/${sw.slug}')">${cover(sw)}<div><div class="eyebrow">${sw.slug===slug?'Você está aqui':'Na série'}</div><h3>${esc(sw.title)}</h3></div></div>`).join('')}</div></div>`:''}
 ${auts.map(a=>`<div class="detail-block author-entity-block"><div class="eyebrow">Sobre o autor</div><h2 onclick="go('/autores/${a.slug}')">${esc(a.name)}</h2><p style="max-width:650px;line-height:1.6;color:#6e665e">${esc(a.shortBio||a.bio?.[0]||'Autor publicado pelo Grupo Ediouro.')}</p><div class="author-entity-actions"><div class="link" onclick="go('/autores/${a.slug}')">Ver página de ${esc(a.name)}</div><div class="link" onclick="go('/autores/${a.slug}')">Todos os livros</div></div></div>`).join('')}
 </div></section><section class="related"><div class="wrap"><div class="sec-head"><h2>Você também pode gostar</h2></div><div class="shelf">${rel.map(bookCard).join('')}</div></div></section>
 <section><div class="wrap"><div class="sec-head"><h2>Conteúdos relacionados</h2></div>${POSTS.filter(p=>p.relatedWorks.includes(slug)).map(p=>`<div class="story" onclick="go('/descubra/${p.slug}')"><div class="eyebrow">${esc(p.kind)}</div><h3>${esc(p.title)}</h3><p>${esc(p.standfirst)}</p></div>`).join('')||'<p style="color:#6d655d">Ainda não há conteúdos editoriais relacionados a este título nesta preview.</p>'}</div></section></main>`;
};
})();