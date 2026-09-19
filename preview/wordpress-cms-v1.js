(function(){
let bootPromise=null;
async function boot(){
  try{
    const r=await fetch('/api/cms?summary=1',{cache:'no-cache'});
    if(!r.ok)throw new Error('CMS bridge '+r.status);
    const audit=await r.json();
    window.EDIOURO_CMS_SYNC={status:'shadow-ready',mode:'shadow',...audit,checkedAt:new Date().toISOString()};
  }catch(err){
    console.warn('[Ediouro CMS] shadow audit indisponível:',err);
    window.EDIOURO_CMS_SYNC={status:'shadow-fallback',mode:'shadow',error:String(err),checkedAt:new Date().toISOString()};
  }
}
window.ediouroCmsBootstrap=function(){
  if(!bootPromise)bootPromise=boot();
  return bootPromise;
};
})();
