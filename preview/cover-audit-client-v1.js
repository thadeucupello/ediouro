(function(){
window.EDIOURO_BROKEN_COVERS=window.EDIOURO_BROKEN_COVERS||[];
window.ediouroCoverError=function(img){
  if(!img)return;
  if(!img.dataset.rgeRetried && /\/PRD\/\//.test(img.src)){
    img.dataset.rgeRetried='1';
    img.src=img.src.replace('/PRD//','/PRD/');
    return;
  }
  const box=img.closest?.('.cover');
  const title=img.alt?.replace(/^Capa de\s+/i,'')||'';
  if(img.src&&!window.EDIOURO_BROKEN_COVERS.some(x=>x.url===img.src)){
    window.EDIOURO_BROKEN_COVERS.push({title,url:img.src,at:new Date().toISOString()});
  }
  if(!box)return;
  box.classList.add('cover-broken');
  img.remove();
};

function coverAuditPage(){
  return `<main>
    <div class="page-hero"><div class="wrap"><div class="eyebrow">QA interno</div><h1>Auditoria de capas</h1><p>Confere no navegador as capas frontais do RGE/SimpleSet. Nenhuma imagem de e-commerce é usada neste teste.</p></div></div>
    <section><div class="wrap">
      <div class="cover-audit-summary">
        <div><strong id="caTotal">0</strong><span>capas verificadas</span></div>
        <div><strong id="caOk">0</strong><span>carregaram</span></div>
        <div><strong id="caBroken">0</strong><span>com problema</span></div>
      </div>
      <div class="cover-audit-progress"><div id="caBar"></div></div>
      <div class="cover-audit-actions"><button class="cta" id="caCopy" onclick="copyCoverAudit()" disabled>Copiar relatório</button></div>
      <div id="caList" class="cover-audit-list"><p>Iniciando conferência…</p></div>
    </div></section>
  </main>`;
}
async function testCoverAuditRow(row){
  const [isbn,title,,,,,,file]=row;
  const base='https://simpleset.ediouro.com.br/imagens/capas/PRD/';
  const candidates=[base+'/'+file,base+file];
  for(let i=0;i<candidates.length;i++){
    const url=candidates[i];
    const ok=await new Promise(resolve=>{
      const im=new Image();
      const timer=setTimeout(()=>{im.onload=im.onerror=null;im.src='';resolve(false)},4500);
      im.onload=()=>{clearTimeout(timer);resolve(true)};
      im.onerror=()=>{clearTimeout(timer);resolve(false)};
      im.src=url;
    });
    if(ok)return {isbn,title,file,ok:true,url,attempt:i+1};
  }
  return {isbn,title,file,ok:false,url:base+file};
}
async function runCoverAudit(){
  const rows=(window.__EDIOURO_CATALOG_SOURCE||[]).slice();
  const list=document.getElementById('caList'),bar=document.getElementById('caBar');
  if(!list||!rows.length)return;
  const results=[];let index=0,ok=0,broken=0;
  const concurrency=16;
  async function worker(){
    while(index<rows.length){
      const current=index++;
      const result=await testCoverAuditRow(rows[current]);
      results[current]=result;
      if(result.ok)ok++;else broken++;
      const done=ok+broken;
      const totalEl=document.getElementById('caTotal'),okEl=document.getElementById('caOk'),brokenEl=document.getElementById('caBroken');
      if(totalEl)totalEl.textContent=done;
      if(okEl)okEl.textContent=ok;
      if(brokenEl)brokenEl.textContent=broken;
      if(bar)bar.style.width=((done/rows.length)*100).toFixed(1)+'%';
    }
  }
  await Promise.all(Array.from({length:concurrency},worker));
  window.EDIOURO_COVER_AUDIT_RESULTS=results;
  const bad=results.filter(x=>x&&!x.ok);
  list.innerHTML=bad.length
    ? `<div class="eyebrow">${bad.length} capas para corrigir na origem</div>${bad.map(x=>`<article class="cover-audit-row"><div><strong>${esc(x.title)}</strong><span>${esc(x.isbn)}</span></div><code>${esc(x.file)}</code></article>`).join('')}`
    : '<div class="state-card"><h2>Todas as capas carregaram.</h2><p>Nenhuma falha encontrada neste navegador.</p></div>';
  const copy=document.getElementById('caCopy');if(copy)copy.disabled=false;
}
window.copyCoverAudit=async function(){
  const r=window.EDIOURO_COVER_AUDIT_RESULTS||[];
  const bad=r.filter(x=>x&&!x.ok);
  const text=['AUDITORIA DE CAPAS EDIOURO',`Total: ${r.length}`,`OK: ${r.length-bad.length}`,`Problemas: ${bad.length}`,'',...bad.map(x=>`${x.isbn}\t${x.title}\t${x.file}`)].join('\n');
  try{await navigator.clipboard.writeText(text);const b=document.getElementById('caCopy');if(b)b.textContent='Relatório copiado'}catch(e){}
};
function renderCoverAuditRoute(){
  const raw=location.hash.slice(1)||'/',path=raw.split('?')[0];
  if(path!=='/auditoria-capas')return false;
  const app=document.getElementById('app');if(!app)return false;
  app.innerHTML=header()+coverAuditPage()+footer();
  scrollTo(0,0);setTimeout(runCoverAudit,50);return true;
}
addEventListener('hashchange',()=>setTimeout(renderCoverAuditRoute,0));
addEventListener('DOMContentLoaded',()=>setTimeout(renderCoverAuditRoute,0));
const style=document.createElement('style');
style.textContent=`
.cover-audit-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cover-audit-summary>div{background:#f3eee6;border:1px solid var(--line);padding:24px}.cover-audit-summary strong{display:block;font:48px/1 Georgia,serif}.cover-audit-summary span{font-size:11px;color:#6e665e}.cover-audit-progress{height:7px;background:#ddd5c8;margin:24px 0;overflow:hidden}.cover-audit-progress>div{height:100%;width:0;background:#143f39;transition:width .2s}.cover-audit-actions{margin-bottom:28px}.cover-audit-actions .cta:disabled{opacity:.45;cursor:default}.cover-audit-list{border-top:1px solid var(--line)}.cover-audit-row{display:grid;grid-template-columns:1fr auto;gap:20px;padding:14px 0;border-bottom:1px solid var(--line);align-items:center}.cover-audit-row strong{display:block;font-size:14px}.cover-audit-row span{display:block;font-size:10px;color:#857b72;margin-top:3px}.cover-audit-row code{font-size:10px;color:#6b635a}
@media(max-width:650px){.cover-audit-summary{grid-template-columns:1fr 1fr 1fr}.cover-audit-summary>div{padding:16px}.cover-audit-summary strong{font-size:34px}.cover-audit-row{grid-template-columns:1fr}.cover-audit-row code{word-break:break-all}}
`;
document.head.appendChild(style);
})();