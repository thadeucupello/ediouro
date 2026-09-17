(function(){
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const palette=[
    {match:n=>n.includes('nova fronteira'),color:'#183B63',ink:'#F7F2E9'},
    {match:n=>n==='trama'||n.includes('trama'),color:'#111111',ink:'#F7F2E9'},
    {match:n=>n==='agir'||n.includes('agir'),color:'#F26A2E',ink:'#241F1A'},
    {match:n=>n.includes('petra'),color:'#6E2034',ink:'#F7F2E9'},
    {match:n=>n.includes('coquetel'),color:'#27B8C7',ink:'#173238'},
    {match:n=>n.includes('pixel'),color:'#B39AD9',ink:'#241F1A'}
  ];
  if(typeof IMPRINTS!=='undefined') IMPRINTS.forEach(im=>{
    const n=norm(im.name||im.slug);
    const p=palette.find(x=>x.match(n));
    if(!p)return;
    im.color=p.color;
    im.ink=p.ink;
    if(typeof I!=='undefined'&&I[im.slug]){I[im.slug].color=p.color;I[im.slug].ink=p.ink;}
  });
  const root=document.documentElement;
  root.style.setProperty('--trama','#111111');
})();
