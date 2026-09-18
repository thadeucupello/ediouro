(function(){
const EDU_CATALOGS=[
  {
    label:'Catálogo Infantil 2026',
    kicker:'Educação Infantil e Fundamental I',
    text:'Acervo organizado para apoiar a escolha de livros por faixa etária, ano escolar, gênero e temas.',
    url:'https://marketing.ediouro.com.br/catalogos_2026#baixe-os-catalogos-infantil-2026-e696414868ef63b68b65'
  },
  {
    label:'Catálogo Juvenil 2026',
    kicker:'Leitores em formação',
    text:'Seleção de obras para ampliar repertório, leitura literária e projetos pedagógicos com jovens leitores.',
    url:'https://marketing.ediouro.com.br/catalogos_2026#baixe-os-catalogos-juvenil-2026-c1a373032a827c6f89e2'
  }
];
const EDU_PNLD_URL='https://www.ediouropnld.com.br/';
const beforeEducationDownloads=educationPage;
educationPage=function(params){
  let out=beforeEducationDownloads(params);
  const downloads=`<section class="edu-downloads"><div class="wrap">
    <div class="sec-head"><div><div class="eyebrow">Materiais para educadores</div><h2>Baixe nossos catálogos.</h2><p>Consulte as versões digitais mais recentes dos catálogos Infantil e Juvenil da Ediouro Educação.</p></div></div>
    <div class="edu-download-grid">
      ${EDU_CATALOGS.map((c,i)=>`<article class="edu-download-card edu-download-card-${i+1}">
        <div class="edu-download-art" aria-hidden="true"><span>EDIouro<br>Educação</span><strong>${i===0?'INFANTIL':'JUVENIL'}</strong><small>2026</small></div>
        <div class="edu-download-copy"><div class="eyebrow">${esc(c.kicker)}</div><h3>${esc(c.label)}</h3><p>${esc(c.text)}</p><a class="edu-external-cta" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Baixar catálogo <span>↗</span></a></div>
      </article>`).join('')}
    </div>
  </div></section>
  <section class="edu-pnld"><div class="wrap edu-pnld-grid">
    <div><div class="eyebrow">Programa Nacional do Livro e do Material Didático</div><h2>PNLD 2026 · Educação Infantil</h2><p>Conheça as obras literárias, informativas e de apoio pedagógico da Ediouro Educação, organizadas para Creche, Pré-escola e formação de professores.</p></div>
    <div class="edu-pnld-side"><div class="edu-pnld-tags"><span>Creche · 0 a 3 anos</span><span>Pré-escola · 4 e 5 anos</span><span>Apoio Pedagógico · professores</span></div><a class="edu-external-cta edu-pnld-cta" href="${EDU_PNLD_URL}" target="_blank" rel="noopener noreferrer">Acessar o site do PNLD <span>↗</span></a></div>
  </div></section>`;
  return out.replace('<section class="edu-values">',downloads+'<section class="edu-values">');
};
const style=document.createElement('style');
style.textContent=`
.edu-downloads{background:#f5f0e7}.edu-downloads .sec-head p{max-width:680px;color:#6a6259;line-height:1.55;margin-top:10px}.edu-download-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.edu-download-card{border:1px solid #d6cdbf;background:#fff;display:grid;grid-template-columns:155px 1fr;min-height:265px;overflow:hidden}.edu-download-art{padding:22px;display:flex;flex-direction:column;justify-content:space-between;background:#1c5c52;color:#fff;min-height:265px}.edu-download-card-2 .edu-download-art{background:#243a6b}.edu-download-art span{font:700 11px/1.2 Archivo,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.8}.edu-download-art strong{font:36px/.92 Georgia,serif;word-break:break-word}.edu-download-art small{font:700 11px/1 Archivo,Arial,sans-serif;letter-spacing:.18em}.edu-download-copy{padding:26px;display:flex;flex-direction:column;align-items:flex-start}.edu-download-copy h3{font:34px/1.02 Georgia,serif;margin:12px 0}.edu-download-copy p{font-size:13px;line-height:1.55;color:#655d55;max-width:430px}.edu-external-cta{margin-top:auto;display:inline-flex;align-items:center;gap:16px;border-bottom:1px solid currentColor;padding:8px 0 4px;color:#231f1a;text-decoration:none;font:700 11px/1.2 Archivo,Arial,sans-serif;letter-spacing:.04em}.edu-pnld{background:#203d73;color:#fff}.edu-pnld-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:60px;align-items:end}.edu-pnld h2{font:64px/.95 Georgia,serif;margin:10px 0 16px}.edu-pnld p{max-width:700px;line-height:1.6;color:#dce3f0}.edu-pnld-side{display:flex;flex-direction:column;align-items:flex-start;gap:26px}.edu-pnld-tags{display:flex;gap:8px;flex-wrap:wrap}.edu-pnld-tags span{border:1px solid rgba(255,255,255,.45);padding:7px 9px;font-size:10px}.edu-pnld-cta{color:#fff}
@media(max-width:800px){.edu-download-grid{grid-template-columns:1fr}.edu-pnld-grid{grid-template-columns:1fr}.edu-download-card{grid-template-columns:120px 1fr}.edu-download-art{min-height:235px;padding:18px}.edu-download-art strong{font-size:29px}.edu-pnld h2{font-size:50px}}
@media(max-width:520px){.edu-download-card{grid-template-columns:95px 1fr}.edu-download-copy{padding:20px}.edu-download-copy h3{font-size:28px}.edu-download-art strong{font-size:22px}.edu-download-art span{font-size:9px}}
`;
document.head.appendChild(style);
window.EDIOURO_EDUCATION_LINKS={
  catalogs:'https://marketing.ediouro.com.br/catalogos_2026',
  pnld2026:EDU_PNLD_URL
};
})();