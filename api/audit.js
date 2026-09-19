export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex');
  if(req.method!=='POST'){res.status(405).json({ok:false});return;}
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const safe={
      staticWorks:Number(body.staticWorks||0),
      cmsBooks:Number(body.cmsBooks||0),
      mappedCmsBooks:Number(body.mappedCmsBooks||0),
      orphanCount:Number(body.orphanCount||0),
      orphans:Array.isArray(body.orphans)?body.orphans.slice(0,50).map(x=>({slug:String(x.slug||''),title:String(x.title||'')})):[]
    };
    console.log('[EDIOURO_CMS_AUDIT]',JSON.stringify(safe));
    res.status(204).end();
  }catch(error){
    console.error('[EDIOURO_CMS_AUDIT_ERROR]',String(error?.message||error));
    res.status(400).json({ok:false});
  }
}
