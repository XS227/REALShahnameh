document.querySelectorAll('.orb').forEach((orb)=>{
  orb.addEventListener('click',(e)=>{
    const fx=document.createElement('div');
    fx.className='tap-fx';
    fx.textContent='+12';
    const r=orb.getBoundingClientRect();
    fx.style.left=`${e.clientX-r.left-10}px`;
    fx.style.top=`${e.clientY-r.top-10}px`;
    orb.parentElement.appendChild(fx);
    setTimeout(()=>fx.remove(),1000);
  });
});

document.querySelectorAll('[data-copy]').forEach(btn=>{
  btn.addEventListener('click', async()=>{
    const text=btn.getAttribute('data-copy');
    try{await navigator.clipboard.writeText(text);btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',1200);}catch{btn.textContent='Copy manually';}
  });
});
