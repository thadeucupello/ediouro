(function(){
  function getMenu(){return document.getElementById('mobileMenu')||document.querySelector('.mobile-menu')}
  function setMenu(open){
    const m=getMenu();
    if(!m)return;
    m.classList.toggle('open',!!open);
    if(open){
      m.style.display='block';
      m.style.visibility='visible';
      m.style.pointerEvents='auto';
      m.style.transform='translateX(0)';
      m.style.position='fixed';
      m.style.inset='0';
      m.style.zIndex='9999';
      document.body.classList.add('menu-open');
    }else{
      m.style.transform='translateX(-100%)';
      m.style.pointerEvents='none';
      document.body.classList.remove('menu-open');
      setTimeout(()=>{if(!m.classList.contains('open')){m.style.visibility='';m.style.display=''}},300);
    }
  }
  window.toggleMenu=setMenu;
  document.addEventListener('click',function(e){
    const open=e.target.closest&&e.target.closest('.mobile-hamb');
    if(open){e.preventDefault();e.stopPropagation();setMenu(true);return}
    const close=e.target.closest&&e.target.closest('.mobile-menu-close');
    if(close){e.preventDefault();e.stopPropagation();setMenu(false);return}
    const nav=e.target.closest&&e.target.closest('.mobile-main-link,.mobile-brand-link');
    if(nav)setMenu(false);
  },true);
  window.addEventListener('hashchange',()=>setMenu(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false)});
})();
