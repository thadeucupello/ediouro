(function(){
const NF_LIVE_STORE_BY_ISBN={};
const digitsNFL=s=>String(s||'').replace(/\D/g,'');
function shortNFL(text,max=260){const s=String(text||'').replace(/\s+/g,' ').trim();if(s.length<=max)return s;const cut=s.slice(0,max+1),p=cut.lastIndexOf(' ');return (p>160?cut.slice(0,p):s.slice(0,max)).replace(/[,:;\s]+$/,'')+'…'}
let matched=0,filled=0;const filledIsbns=[];
for(const w of DATA.works){
 if(w.imprint!=='nova-fronteira')continue;
 let meta=null,matchedIsbn='';
 for(const e of (ED[w.slug]||[])){const k=digitsNFL(e.isbn||e.ean);if(NF_LIVE_STORE_BY_ISBN[k]){meta=NF_LIVE_STORE_BY_ISBN[k];matchedIsbn=k;break}}
 if(!meta)continue;matched++;
 const has=Array.isArray(w.description)&&w.description.some(p=>String(p||'').trim().length>=20);
 if(has)continue;
 w.description=meta.synopsis.slice();
 if(!String(w.shortDescription||'').trim())w.shortDescription=shortNFL(meta.synopsis.join(' '));
 if(!String(w.seoDescription||'').trim())w.seoDescription=shortNFL(meta.synopsis.join(' '),300);
 w.synopsisSource={system:'loja-nova-fronteira-oficial-live',matchedPrintIsbn:matchedIsbn,url:meta.url,importedAt:'2026-09-18'};
 filled++;filledIsbns.push(matchedIsbn);
}
window.EDIOURO_NF_LIVE_STORE_AUDIT={sourceRecords:Object.keys(NF_LIVE_STORE_BY_ISBN).length,matchedWorks:matched,filled,filledIsbns,rule:'preenche apenas obras sem sinopse; nunca sobrescreve conteúdo editorial existente'};
})();