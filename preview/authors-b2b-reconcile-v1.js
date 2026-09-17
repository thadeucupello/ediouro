(function(){
const rows=window.__EDIOURO_CATALOG_SOURCE||[];
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const slug=s=>norm(s).replace(/\s+/g,'-');
const isbnAuthors=new Map();
for(const r of rows){
 const isbn=String(r[0]||'').replace(/\D/g,'');
 if(!isbn)continue;
 const authors=String(r[3]||'').split('|').map(x=>slug(x)).filter(Boolean);
 if(authors.length)isbnAuthors.set(isbn,new Set(authors));
}
function ensureContributor(s){
 if(C[s])return s;
 const raw=s.split('-').map((x,i)=>['de','da','do','dos','das','e'].includes(x)&&i?x:x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
 const c={slug:s,name:raw,shortBio:'Autor(a) publicado(a) pelo Grupo Ediouro.',bio:[],roles:['autor'],imprints:[]};
 DATA.contributors.push(c);C[s]=c;return s;
}
for(const w of DATA.works){
 const linked=new Set();
 for(const e of (ED[w.slug]||[])){
  const isbn=String(e.isbn||e.ean||'').replace(/\D/g,'');
  const a=isbnAuthors.get(isbn);if(a)a.forEach(x=>linked.add(x));
 }
 if(linked.size){
  w.credits=w.credits||[];
  linked.forEach(s=>{ensureContributor(s);if(!w.credits.some(x=>x.role==='autor'&&x.contributor===s))w.credits.push({contributor:s,role:'autor'})});
 }
}
const baseAuthorBooks=authorBooksV3;
authorBooksV3=function(authorSlug){
 const out=[],seen=new Set();
 for(const w of DATA.works){
  let hit=(w.credits||[]).some(x=>x.role==='autor'&&x.contributor===authorSlug);
  if(!hit){
   for(const e of (ED[w.slug]||[])){
    const isbn=String(e.isbn||e.ean||'').replace(/\D/g,'');
    if(isbnAuthors.get(isbn)?.has(authorSlug)){hit=true;break}
   }
  }
  if(hit&&!seen.has(w.slug)){seen.add(w.slug);out.push(w)}
 }
 return out;
};
window.EDIOURO_AUTHOR_RECONCILIATION={
 rows:rows.length,
 brandon:authorBooksV3('brandon-sanderson').map(w=>w.title),
 cara:authorBooksV3('cara-hunter').map(w=>w.title),
 claire:authorBooksV3('claire-douglas').map(w=>w.title)
};
})();