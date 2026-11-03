// Safari can shrink the visible area without resizing the layout viewport.
const view=window.visualViewport;
if(view){
 let frame=0,previous=null;
 function fit(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const active=document.activeElement,dialog=active?.closest('dialog[open]');
   if(previous&&previous!==dialog)previous.classList.remove('keyboard-open');
   previous=dialog;
   if(!dialog)return;
   const typing=active.matches('input:not([type=checkbox]):not([type=radio]),textarea,select');
   const obscured=typing&&Math.abs(view.scale-1)<0.03&&document.documentElement.clientHeight-view.height>100;
   dialog.classList.toggle('keyboard-open',obscured);
   if(obscured){
    dialog.style.setProperty('--keyboard-top',(view.offsetTop+8)+'px');
    dialog.style.setProperty('--keyboard-space',Math.max(0,view.height-16)+'px');
    const box=active.getBoundingClientRect(),edge=dialog.getBoundingClientRect();
    if(box.bottom>edge.bottom-12)dialog.scrollTop+=box.bottom-edge.bottom+16;
   }
  });
 }
 view.addEventListener('resize',fit);view.addEventListener('scroll',fit);
 document.addEventListener('focusin',fit);document.addEventListener('focusout',fit);
}
