const homeBeforeInterestNav = home;
home = function(){
 const html = homeBeforeInterestNav();
 const rx = /<section><div class="wrap"><div class="sec-head"><div><h2>O que você quer ler\?<\/h2><\/div><div class="link" onclick="go\('\/livros'\)">Ver todo o catálogo<\/div><\/div><div class="cats">[\s\S]*?<\/div><\/div><\/section>\s*(?=<section><div class="wrap"><div class="sec-head"><h2>Acabaram de chegar<\/h2>)/;
 const card=(cls,style,title,slug,desc='')=>`<div class="cat interest-card ${cls||''}" ${style?`style="${style}"`:''} role="link" tabindex="0" onclick="go('/categorias/${slug}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();go('/categorias/${slug}')}" aria-label="Explorar ${title}"><div><h3>${title}</h3>${desc?`<p>${desc}</p>`:''}</div><span class="interest-card-cta">Explorar →</span></div>`;
 const next = `<section class="interest-nav-section"><div class="wrap"><div class="sec-head interest-nav-head"><div><div class="eyebrow">Explore por interesse</div><h2>O que você quer ler?</h2><p>Escolha um tema para abrir uma seleção do catálogo.</p></div><div class="link" onclick="go('/livros')">Ver todo o catálogo</div></div><div class="cats interest-cats">${card('fantasy','','Literatura','literatura','Vozes que atravessam gerações.')}${card('','background:#241c52','Fantasia','fantasia')}${card('romance','','Romance','romance')}${card('crime','','Crime e mistério','crime-e-misterio')}${card('','background:#8c6326','Clássicos','classicos')}${card('','background:#df5d2d','Infantil e juvenil','infantil-e-juvenil')}${card('','background:#176a61','Espiritualidade','espiritualidade')}${card('','background:#6b7c38','Comportamento','comportamento')}${card('','background:#286c72','Não ficção','nao-ficcao')}${card('','background:#d59a0b;color:#231f1a','Jogos e passatempos','jogos-e-passatempos')}</div></div></section>\n `;
 let out = html.replace(rx,next);
 const interest = out.match(/<section class="interest-nav-section">[\s\S]*?<\/section>/)?.[0];
 const arrivals = out.match(/<section><div class="wrap"><div class="sec-head"><h2>Acabaram de chegar<\/h2><\/div><div class="shelf">[\s\S]*?<\/div><\/div><\/section>/)?.[0];
 if(interest && arrivals && out.indexOf(interest) < out.indexOf(arrivals)){
  out = out.replace(interest,'__INTEREST_NAV__');
  out = out.replace(arrivals,arrivals+'\n'+interest);
  out = out.replace('__INTEREST_NAV__','');
 }
 return out;
};
(function(){
 const css=`.interest-nav-head>div:first-child{max-width:620px}.interest-nav-head p{margin:10px 0 0;color:#6e665e;font:17px/1.45 'Newsreader',Georgia,serif}.interest-card{cursor:pointer;position:relative;display:flex!important;flex-direction:column;justify-content:space-between;gap:24px;transition:transform .18s ease,box-shadow .18s ease}.interest-card:hover,.interest-card:focus-visible{transform:translateY(-4px);box-shadow:0 14px 28px rgba(35,31,26,.14);outline:none}.interest-card-cta{font:700 9px/1.2 'Archivo',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.78}.interest-card:hover .interest-card-cta,.interest-card:focus-visible .interest-card-cta{opacity:1}@media(max-width:760px){.interest-nav-head{align-items:flex-start}.interest-cats{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;padding-bottom:8px;margin-right:-20px;padding-right:20px}.interest-cats .interest-card{min-width:220px;scroll-snap-align:start}.interest-card:hover{transform:none}}`;
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
})();
