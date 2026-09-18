(function(){
function replaceCommonCopy(html){
 return String(html||'')
  .replaceAll('títulos integrados nesta prévia','títulos no catálogo')
  .replaceAll('autores já conectados','autores no catálogo')
  .replaceAll('títulos integrados','títulos no catálogo')
  .replaceAll('resultados nesta prévia','resultados encontrados')
  .replaceAll('disponíveis nesta prévia do catálogo','disponíveis no catálogo')
  .replaceAll('Ainda não há conteúdos editoriais relacionados a este título nesta preview.','Ainda não há conteúdos editoriais relacionados a este título.')
  .replaceAll('Uma porta de entrada editorial que conecta livros, autores, séries e conteúdos sem transformar o tema em apenas mais um filtro.','Encontre livros, autores, séries e conteúdos relacionados a este tema.')
  .replaceAll('Uma história institucional que leva de volta aos livros.','Conheça o universo editorial da Ediouro.')
  .replaceAll('Outros canais só devem ser divulgados aqui depois de confirmação institucional.','Para outros assuntos, use os canais específicos disponíveis no site.');
}
if(typeof aboutPage==='function'){
 const old=aboutPage;
 aboutPage=function(){return replaceCommonCopy(old())}
}
if(typeof brandsList==='function'){
 const old=brandsList;
 brandsList=function(){return replaceCommonCopy(old())}
}
if(typeof brandPage==='function'){
 const old=brandPage;
 brandPage=function(slug){
  let out=replaceCommonCopy(old(slug));
  if(slug==='coquetel'){
   out=out
    .replaceAll('Catálogo em integração','Seleção editorial')
    .replaceAll('CATÁLOGO EM INTEGRAÇÃO.','SELEÇÃO EDITORIAL')
    .replaceAll('A casa já está pronta.','Coquetel, do seu jeito.')
    .replaceAll('Os títulos entram na próxima carga oficial sem alterar a estrutura editorial da marca.','Jogos, passatempos e publicações especiais serão reunidos aqui em uma seleção própria.')
    .replaceAll('Próxima etapa','Em destaque')
    .replaceAll('Catálogo em integração.','Uma seleção própria para a Coquetel.')
    .replaceAll(/A estrutura editorial da Coquetel está pronta para receber títulos, autores e séries na próxima carga B2B sem precisar redesenhar esta página\./g,'A seleção de livros e produtos da Coquetel será construída separadamente do catálogo geral.');
  }else{
   out=out
    .replaceAll('Catálogo em integração','Novidades editoriais')
    .replaceAll('CATÁLOGO EM INTEGRAÇÃO.','NOVIDADES EDITORIAIS')
    .replaceAll('A casa já está pronta.','Mais títulos por aqui.')
    .replaceAll('Os títulos entram na próxima carga oficial sem alterar a estrutura editorial da marca.','Novos títulos serão reunidos aqui conforme chegarem ao catálogo.')
    .replaceAll('Próxima etapa','Em destaque')
    .replaceAll('Catálogo em integração.','Mais títulos em breve.')
    .replace(/A estrutura editorial da ([^<]+) está pronta para receber títulos, autores e séries na próxima carga B2B sem precisar redesenhar esta página\./g,'Novos títulos desta marca serão reunidos aqui conforme chegarem ao catálogo.');
  }
  return out;
 }
}
if(typeof categoryPage==='function'){
 const old=categoryPage;
 categoryPage=function(slug){
  return replaceCommonCopy(old(slug))
   .replaceAll('Catálogo em integração','Explore o catálogo')
   .replaceAll('Esta categoria já tem endereço.','Encontre sua próxima leitura.')
   .replaceAll('A estrutura está pronta para receber os títulos correspondentes na carga completa do catálogo.','Veja outros temas e títulos disponíveis no catálogo Ediouro.');
 }
}
if(typeof globalSearch==='function'){
 const old=globalSearch;
 globalSearch=function(params){return replaceCommonCopy(old(params))}
}
if(typeof supportPage==='function'){
 const old=supportPage;
 supportPage=function(type){
  return replaceCommonCopy(old(type))
   .replaceAll('esta prévia já organiza o canal e a experiência de atendimento. A redação jurídica completa e aprovada da Política de Privacidade deverá ser incorporada antes da publicação definitiva do novo site.','a Política de Privacidade completa será disponibilizada nesta página.');
 }
}
if(typeof bookPage==='function'){
 const old=bookPage;
 bookPage=function(slug,params){return replaceCommonCopy(old(slug,params))}
}
})();