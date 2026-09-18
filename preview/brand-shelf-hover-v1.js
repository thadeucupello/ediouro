/* Brand shelf hover preview — 2026-09-18 */
(function(){
  const palette={
    'nova-fronteira':['#1E4B8F','#F7F2E9'],
    'trama':['#111111','#F7F2E9'],
    'agir':['#F26A2E','#241F1A'],
    'petra':['#6E2034','#F7F2E9'],
    'coquetel':['#27B8C7','#173238'],
    'pixel':['#B39AD9','#241F1A'],
    'livros-da-alice':['#A8315F','#F7F2E9']
  };
  const safeDate=w=>{
    try{
      return (ED[w.slug]||[]).map(e=>e.publicationDate||'').filter(Boolean).sort().reverse()[0]||'';
    }catch(_){return ''}
  };
  const samples=slug=>{
    try{
      return DATA.works
        .filter(w=>w.imprint===slug&&coverUrl(w))
        .sort((a,b)=>safeDate(b).localeCompare(safeDate(a))||a.title.localeCompare(b.title,'pt-BR'))
        .slice(0,3);
    }catch(_){return []}
  };
  const panelHtml=(im,i)=>{
    const p=palette[im.slug]||[im.color||'#222',im.ink||'#fff'];
    const books=samples(im.slug);
    return '<div class="brand-panel '+(i===0?'is-active':'')+'" data-brand="'+im.slug+'" style="--brand-color:'+p[0]+';--brand-ink:'+p[1]+'">'+
      '<div class="brand-panel-spine"><span>'+esc(im.name.toUpperCase())+'</span></div>'+
      '<div class="brand-panel-open">'+
        '<div><div class="eyebrow">'+esc(im.name.toUpperCase())+'</div><h3>'+esc(im.tagline||im.name)+'</h3><p>'+esc(im.description||'')+'</p></div>'+
        '<div class="brand-mini">'+books.map(w=>cover(w)).join('')+'</div>'+
        '<div class="brand-visit">Conheça a marca</div>'+
      '</div>'+
    '</div>';
  };
  function enhance(){
    if(typeof IMPRINTS==='undefined'||typeof DATA==='undefined'||typeof cover!=='function')return;
    document.querySelectorAll('.brand-shelf:not([data-brand-hover])').forEach(shelf=>{
      shelf.dataset.brandHover='1';
      shelf.classList.add('brand-shelf-hover');
      shelf.innerHTML=IMPRINTS.map(panelHtml).join('');
      const panels=[...shelf.querySelectorAll('.brand-panel')];
      const activate=panel=>panels.forEach(p=>p.classList.toggle('is-active',p===panel));
      const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
      panels.forEach(panel=>{
        if(fine)panel.addEventListener('pointerenter',()=>activate(panel));
        panel.addEventListener('click',e=>{
          const active=panel.classList.contains('is-active');
          if(!fine&&!active){e.preventDefault();activate(panel);return}
          const slug=panel.dataset.brand;
          if(slug)go('/marcas/'+slug);
        });
      });
    });
  }
  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
