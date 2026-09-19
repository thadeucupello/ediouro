const SOURCE='https://raw.githubusercontent.com/thadeucupello/ediouro/79160aa2cb932ff2fcc7d956e6175d57f7ecf4b7/index.html';
const OLD_COVER='https://raw.githubusercontent.com/thadeucupello/ediouro/d4c17f80a03c268f4337f6d5930d9ab92f5f8539/preview/covers-v2.js';
const NEW_COVER='https://raw.githubusercontent.com/thadeucupello/ediouro/75899b074c2f6823d0b456e1000dd9c58551a364/preview/covers-v2.js';
const OLD_CATALOG_CSS='https://raw.githubusercontent.com/thadeucupello/ediouro/3477e2abbe9049a3385eb419a368862374341def/preview/catalog-v3.css';
const NEW_CATALOG_CSS='https://raw.githubusercontent.com/thadeucupello/ediouro/ce7b1c480bd3520f92376bc33dc884af0a99e45b/preview/catalog-v3.css';
const OLD_CATALOG_JS='https://raw.githubusercontent.com/thadeucupello/ediouro/0505d298ed57ddb534b46dbe0e4408feb9d99e73/preview/catalog-v3.js';
const NEW_CATALOG_JS='https://raw.githubusercontent.com/thadeucupello/ediouro/054195f0dcfe0e7f3c585411fa139ec8cbcb3b28/preview/catalog-v3.js';
const OLD_PCP='https://raw.githubusercontent.com/thadeucupello/ediouro/8bdbc6d00024aa4b4cff88784ad4ee750192f577/preview/pcp-v2/';
const NEW_PCP='https://raw.githubusercontent.com/thadeucupello/ediouro/ce7b1c480bd3520f92376bc33dc884af0a99e45b/preview/pcp-v2/';

async function getText(url){
  const r=await fetch(url,{headers:{'accept':'text/plain,*/*','user-agent':'Ediouro-Vercel-Shell/1.0'}});
  if(!r.ok)throw new Error(url+' '+r.status);
  return r.text();
}
function extractScript(html){
  const a=html.indexOf('<script>');
  const b=html.lastIndexOf('</script>');
  if(a<0||b<a)throw new Error('builder script not found');
  return html.slice(a+8,b);
}
function injectBeforeLast(h,marker,code){
  const p=h.lastIndexOf(marker);
  if(p<0)throw new Error('router marker not found');
  return h.slice(0,p)+code+'\n'+h.slice(p);
}

export default async function handler(req,res){
  const cms=String(req.query?.cms||'')==='1';
  try{
    let builder=await getText(SOURCE);
    builder=builder
      .replaceAll(OLD_COVER,NEW_COVER)
      .replaceAll(OLD_CATALOG_CSS,NEW_CATALOG_CSS)
      .replaceAll(OLD_CATALOG_JS,NEW_CATALOG_JS)
      .replaceAll(OLD_PCP,NEW_PCP);

    const body=extractScript(builder);
    let captured='';
    const documentMock={
      open(){},
      write(v){captured=String(v||'');},
      close(){}
    };
    const run=new Function('fetch','document','setTimeout','console','Promise','URL','URLSearchParams',
      'return '+body);
    await run(fetch,documentMock,setTimeout,console,Promise,URL,URLSearchParams);
    if(!captured)throw new Error('builder returned empty shell');

    if(cms){
      const ref=process.env.VERCEL_GIT_COMMIT_SHA||'cms-headless-v1';
      const adapterUrl='https://raw.githubusercontent.com/thadeucupello/ediouro/'+ref+'/preview/wordpress-cms-v1.js';
      const adapter=await getText(adapterUrl);
      captured=injectBeforeLast(captured,"addEventListener('hashchange',router);",adapter);
    }

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Robots-Tag','noindex');
    res.status(200).send(captured);
  }catch(error){
    res.setHeader('Cache-Control','no-store');
    res.status(500).send('<!doctype html><meta charset="utf-8"><title>Ediouro</title><pre>'+String(error?.message||error).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))+'</pre>');
  }
}
