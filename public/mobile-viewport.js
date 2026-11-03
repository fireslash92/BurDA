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

// During a native AutoFill / password prompt the layout viewport may stay
// unchanged while Safari pans a magnified visual viewport across the form.
// Fit the login card into that visible rectangle; never change the zoom level.
if(view){
 const credential='input[autocomplete="username"],input[autocomplete="current-password"]';
 let formPage=null,eligible=false,raf=0;
 const mobile=matchMedia('(max-width:760px), (orientation:landscape) and (max-width:940px) and (max-height:540px)');
 const clear=()=>{if(formPage){formPage.removeAttribute('data-credential-fit');formPage.style.removeProperty('--credential-width');formPage.style.removeProperty('--credential-offset')}};
 const stop=()=>{eligible=false;clear()};
 function fitLogin(){
  cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{
   if(!eligible||!mobile.matches||!formPage?.isConnected||view.scale<=1.025){clear();return}
   const rect=formPage.getBoundingClientRect(),style=getComputedStyle(formPage);
   const left=Math.max(0,view.offsetLeft-rect.left),right=Math.min(rect.width,view.offsetLeft+view.width-rect.left);
   const inner=Math.max(0,right-left-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight));
   if(inner<190){clear();return}
   formPage.style.setProperty('--credential-width',inner+'px');
   formPage.style.setProperty('--credential-offset',left+'px');
   formPage.setAttribute('data-credential-fit','');
  });
 }
 function arm(e){if(!e.target.matches?.(credential))return;
  const page=e.target.closest('.gateway');if(!page||!mobile.matches)return;
  if(view.scale<=1.025){formPage=page;eligible=true}fitLogin();
 }
 document.addEventListener('pointerdown',arm,true);document.addEventListener('focusin',arm,true);
 document.addEventListener('touchstart',e=>{if(e.touches.length>1)stop()},{capture:true,passive:true});
 document.addEventListener('gesturestart',stop,{passive:true});
 view.addEventListener('resize',fitLogin);view.addEventListener('scroll',fitLogin);
 window.addEventListener('pageshow',fitLogin);window.addEventListener('pagehide',stop);
}
