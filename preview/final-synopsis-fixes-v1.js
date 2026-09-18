(function(){
const FINAL_SYNOPSIS_BY_ISBN={"9786556402567":{"synopsis":["Em uma escola onde todas as crianças têm lugar, diferenças de origem, aparência e história viram motivo para celebrar convivência, acolhimento e diversidade. Com texto rimado e uma narrativa marcada pelo afeto, o livro acompanha um dia em que todos são recebidos de braços abertos."],"sourceUrl":"https://www.b2bediouro.com.br/todos-sao-bem-vindos","source":"b2b-ediouro"},"9788520904916":{"synopsis":["Uma rainha autoritária proíbe a tristeza em seu reino, mas seus súditos descobrem que a saudade não pode ser aprisionada. A história transforma esse sentimento em uma reflexão delicada sobre perda, memória e afeto."],"sourceUrl":"https://www.travessa.com.br/por-uma-questao-de-saudade/artigo/68dc116b-70c1-485c-ba85-0f10fe991042","source":"livraria-travessa"},"9786581349547":{"synopsis":["O Flow Pack da coleção Elo Monsters Books traz um livro sortido da coleção e um Gogo's Elo Monsters de brinde. Os oito livros apresentam as famílias e os personagens do universo Elo Monsters, com curiosidades e adesivos colecionáveis para completar o Livro Ilustrado Oficial."],"sourceUrl":"https://www.b2bediouro.com.br/colecao-elo-monsters-books","source":"b2b-ediouro"},"9786581349714":{"synopsis":["Gru está de volta, agora conciliando suas missões como agente da Liga Antivilões com a vida em família. Ao lado de Lucy, das três filhas adotivas e do pequeno Gru Jr., ele usa sua inventividade e suas engenhocas para enfrentar novos perigos e proteger quem ama."],"sourceUrl":"https://www.b2bediouro.com.br/meu-malvado-favorito-novas-missoes-para-viver-colecao-mil","source":"b2b-ediouro"},"9786581349806":{"synopsis":["O Livro Ilustrado Oficial Elo Monsters é o ponto de encontro da coleção criada em parceria com Enaldinho. Os 40 personagens do universo se dividem em oito famílias, apresentadas ao longo dos livros da coleção, cujos adesivos podem ser reunidos e colados neste álbum ilustrado."],"sourceUrl":"https://www.b2bediouro.com.br/livro-ilustrado-elo-monsters","source":"b2b-ediouro"}};
const digitsFS=s=>String(s||'').replace(/\D/g,'');
function shortFS(text,max=260){
  const s=String(text||'').replace(/\s+/g,' ').trim();
  if(s.length<=max)return s;
  const cut=s.slice(0,max+1),p=cut.lastIndexOf(' ');
  return (p>160?cut.slice(0,p):s.slice(0,max)).replace(/[,:;\s]+$/,'')+'…';
}
let matched=0,filled=0;const filledIsbns=[];
for(const w of DATA.works){
  let meta=null,matchedIsbn='';
  for(const e of (ED[w.slug]||[])){
    const k=digitsFS(e.isbn||e.ean);
    if(FINAL_SYNOPSIS_BY_ISBN[k]){meta=FINAL_SYNOPSIS_BY_ISBN[k];matchedIsbn=k;break}
  }
  if(!meta)continue;
  matched++;
  const has=Array.isArray(w.description)&&w.description.some(p=>String(p||'').trim().length>=20);
  if(has)continue;
  w.description=meta.synopsis.slice();
  if(!String(w.shortDescription||'').trim())w.shortDescription=shortFS(meta.synopsis.join(' '));
  if(!String(w.seoDescription||'').trim())w.seoDescription=shortFS(meta.synopsis.join(' '),300);
  w.synopsisSource={system:meta.source,matchedPrintIsbn:matchedIsbn,url:meta.sourceUrl,importedAt:'2026-09-18'};
  filled++;filledIsbns.push(matchedIsbn);
}
window.EDIOURO_FINAL_SYNOPSIS_AUDIT={
  sourceRecords:Object.keys(FINAL_SYNOPSIS_BY_ISBN).length,
  matchedWorks:matched,
  filled,
  filledIsbns,
  rule:'preenche apenas obras sem sinopse; nunca sobrescreve conteúdo editorial existente'
};
})();