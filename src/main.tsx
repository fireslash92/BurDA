import {auth,type User} from "./lib/cloud";
import React from "react";
import {createRoot} from "react-dom/client";
import DashboardApp from "./components/DashboardApp";
import PasswordRecovery,{recoveryError} from "./components/PasswordRecovery";
// Capture callback state before Supabase consumes and clears the URL fragment.
const authCallback=new URLSearchParams(location.hash.slice(1));
const recoveryInvalid=authCallback.has("error")||authCallback.has("error_code");
const recoveryRequested=new URLSearchParams(location.search).has("recover")||authCallback.get("type")==="recovery"||recoveryInvalid;
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<main className="loading-state"><h1>تعذر فتح التطبيق</h1><p>حدّث الصفحة وحاول مرة أخرى.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة المحاولة</button></main>:this.props.children}
}
function Entry(){
 const [u,setUser]=React.useState<User|null>(null),[verified,setVerified]=React.useState(false),[ready,setReady]=React.useState(false),[msg,setMsg]=React.useState(""),[busy,setBusy]=React.useState(false);
 const [email,setEmail]=React.useState(""),[password,setPassword]=React.useState(""),[reset,setReset]=React.useState(false);
 const [recovery,setRecovery]=React.useState(recoveryRequested);
 const loginTransition=React.useRef(false);
 function session(v:User|null,event=""){if(loginTransition.current&&event==="SIGNED_IN"&&v?.emailVerified)return;if(event==="PASSWORD_RECOVERY"){setRecovery(true);history.replaceState(null,"",new URL("./?recover=1",location.href));}setUser(v);setVerified(!!v?.emailVerified);setPassword("");setReady(true);setMsg("");}
 React.useEffect(()=>{if(recoveryInvalid)history.replaceState(null,"",new URL("./?recover=1",location.href));let active=true,stop:(()=>void)|undefined;auth().then(a=>{if(active)stop=a.watch(session)}).catch(()=>{setReady(true);setMsg("تعذر الاتصال بخدمة الدخول. تحقق من الشبكة ثم حدّث الصفحة.")});return()=>{active=false;stop?.()}},[]);
 async function act(fn:()=>Promise<void>){setBusy(true);setMsg("");try{await fn()}catch(e){const code=(e as {code?:string}).code;setMsg(reset?recoveryError(e):code==="over_request_rate_limit"?"محاولات كثيرة. حاول لاحقًا.":code==="auth/network-request-failed"?"تعذر الاتصال. تحقق من الشبكة.":code==="email_not_confirmed"?"يجب تأكيد البريد الإلكتروني قبل الدخول.":"تعذر إكمال الطلب. تحقق من بيانات الدخول وحاول مرة أخرى.")}finally{setBusy(false)}}
 if(recovery)return <PasswordRecovery user={u} ready={ready} invalid={recoveryInvalid} onBack={()=>{history.replaceState(null,"",new URL('./',location.href));setRecovery(false);setMsg("")}}/>;
 if(u&&verified)return <DashboardApp key={u.uid}/>;
 return <main className="office-login gateway"><div className="gateway-layout"><aside className="gateway-intro"><span className="intro-label">محافظة البريمي · مكتب المحافظ</span><h2>سفراء <br/>التحول الرقمي</h2><p>منصة متابعة أداء السفراء وتوثيق إنجازاتهم.</p><span className="intro-foot">سجل مؤشرات الأداء</span></aside><section className="office-card"><div className="office-brand"><img src="./favicon.svg" alt=""/><span>محافظة البريمي<br/><strong>مكتب المحافظ</strong></span></div><p className="eyebrow">سفراء التحول الرقمي</p><h1>{u?"تأكيد البريد الإلكتروني":reset?"استعادة كلمة المرور":"تسجيل الدخول"}</h1>
 <p>{u?"أكّد بريدك قبل فتح سجل المكتب.":reset?"أدخل بريد حسابك لتصلك تعليمات استعادة كلمة المرور.":"ادخل بحسابك المخصص لمتابعة مؤشرات أداء السفراء."}</p>
 {u?<section><p>أكّد بريدك من رسالة Supabase ثم أعد تسجيل الدخول.</p><button className="btn" onClick={()=>act(async()=>{await (await auth()).logout()})}>العودة للدخول</button></section>:
 <form onSubmit={e=>{e.preventDefault();void act(async()=>{const a=await auth();if(reset){await a.reset(email.trim());setMsg("إذا كان البريد مسجّلًا، ستصلك رسالة الاستعادة. افتح أحدث رسالة واضغط رابط تغيير كلمة المرور. تحقق أيضًا من البريد غير المرغوب فيه.")}else{loginTransition.current=true;
 const field=document.activeElement;if(field instanceof HTMLInputElement)field.blur();
 try{await a.login(email.trim(),password);setPassword("");location.reload()}catch(e){loginTransition.current=false;throw e}}})}}>
 <label>البريد الإلكتروني<input type="email" required dir="ltr" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {!reset&&<label>كلمة المرور<input type="password" required dir="ltr" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 <button className="btn primary" disabled={!ready||busy}>{busy?"جارٍ تنفيذ الطلب…":reset?"إرسال رابط الاستعادة":"دخول المنصة"}</button><button type="button" className="btn" disabled={busy} onClick={()=>{setReset(!reset);setPassword("");setMsg("")}}>{reset?"العودة لتسجيل الدخول":"نسيت كلمة المرور؟"}</button></form>}
 {msg&&<p role="status">{msg}</p>}<small>الدخول مخصص للمستخدمين المخوّلين من مكتب المحافظ.</small></section></div></main>;
}
createRoot(document.getElementById("root")!).render(<ErrorBoundary><Entry/></ErrorBoundary>);
