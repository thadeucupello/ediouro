const CMS_ORIGIN = 'https://cmsediouro.wpcomstaging.com';

export default async function handler(req, res) {
  const health = String(req.query?.health || '') === '1';
  const summary = String(req.query?.summary || '') === '1';
  const endpoint = health ? '/wp-json/ediouro/v1/health' : '/wp-json/ediouro/v1/site';
  try {
    const upstreamUrl = CMS_ORIGIN + endpoint + (endpoint.includes('?') ? '&' : '?') + '_ediouro_ts=' + Date.now();
    const upstream = await fetch(upstreamUrl, {
      cache: 'no-store',
      headers: {
        'accept': 'application/json',
        'cache-control': 'no-cache, no-store, max-age=0',
        'pragma': 'no-cache',
        'user-agent': 'Ediouro-Vercel-CMS-Bridge/1.0'
      }
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      res.status(upstream.status).json({ ok:false, upstreamStatus:upstream.status, endpoint, error:text.slice(0,1000) });
      return;
    }
    let data;
    try { data = JSON.parse(text); }
    catch (error) {
      res.status(502).json({ ok:false, endpoint, error:'CMS returned non-JSON', sample:text.slice(0,500) });
      return;
    }
    res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma','no-cache');
    res.setHeader('Expires','0');
    if (health || !summary) {
      res.status(200).json(data);
      return;
    }
    const series = Array.isArray(data.series) ? data.series : [];
    const collections = series.filter(x => x?.entityType === 'colecao');
    const realSeries = series.filter(x => x?.entityType !== 'colecao');
    const books = Array.isArray(data.books) ? data.books : [];
    const sampleSlugs = new Set(['coracao-de-mae','irmao-sol-irma-lua']);
    const samples = books.filter(x => sampleSlugs.has(x?.slug)).map(x => ({
      slug:x.slug,title:x.title,imprint:x.imprint,series:x.series,collections:x.collections,
      categories:x.categories,education:x.education,
      formats:(x.formats||[]).map(f=>({type:f.type,label:f.label,isbn:f.isbn,price:f.price,page_count:f.page_count,dimensions:f.dimensions,binding:f.binding,retailers:f.retailers}))
    }));
    const home = data.routes?.home || null;
    res.status(200).json({
      ok:true,source:data.source,version:data.version,generatedAt:data.generatedAt,
      counts:{
        books:books.length,authors:(data.authors||[]).length,imprints:(data.imprints||[]).length,
        series:realSeries.length,collections:collections.length,articles:(data.articles||[]).length,
        categories:(data.categories||[]).length,educationStages:(data.educationStages||[]).length,
        routes:Object.keys(data.routes||{}).length
      },
      routeKeys:Object.keys(data.routes||{}),
      collections:collections.map(x=>({slug:x.slug,name:x.name,count:(x.workSlugs||[]).length})),
      series:realSeries.map(x=>({slug:x.slug,name:x.name,count:(x.workSlugs||[]).length})),
      home:home?{
        fields:home.fields,
        relationCounts:Object.fromEntries(Object.entries(home.relations||{}).map(([k,v])=>[k,Array.isArray(v)?v.length:(v?1:0)]))
      }:null,
      samples
    });
  } catch (error) {
    res.status(502).json({ ok:false, endpoint, error:String(error?.message || error) });
  }
}
