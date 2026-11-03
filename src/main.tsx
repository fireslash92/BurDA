import {auth,type User} from "./lib/cloud";
import React from "react";
import {createRoot} from "react-dom/client";
import DashboardApp from "./components/DashboardApp";
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<main className="loading-state"><h1>تعذر فتح التطبيق</h1><p>حدّث الصفحة وحاول مرة أخرى.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة المحاولة</button></main>:this.props.children}
}
function Entry(){
 const [u,setUser]=React.useState<User|null>(null),[verified,setVerified]=React.useState(false),[ready,setReady]=React.useState(false),[msg,setMsg]=React.useState(""),[busy,setBusy]=React.useState(false);
 const [email,setEmail]=React.useState(""),[password,setPassword]=React.useState(""),[reset,setReset]=React.useState(false);
 const [recovery,setRecovery]=React.useState(new URLSearchParams(location.search).has("recover"));
 function session(v:User|null,event=""){if(event==="PASSWORD_RECOVERY")setRecovery(true);setUser(v);setVerified(!!v?.emailVerified);setPassword("");setReady(true);setMsg("");}
 React.useEffect(()=>{let active=true,stop:(()=>void)|undefined;auth().then(a=>{if(active)stop=a.watch(session)}).catch(()=>setMsg("تعذر الاتصال بخدمة الدخول. تحقق من الشبكة ثم حدّث الصفحة."));return()=>{active=false;stop?.()}},[]);
 async function act(fn:()=>Promise<void>){setBusy(true);setMsg("");try{await fn()}catch(e){const code=(e as {code?:string}).code;setMsg(code==="over_request_rate_limit"?"محاولات كثيرة. حاول لاحقًا.":code==="auth/network-request-failed"?"تعذر الاتصال. تحقق من الشبكة.":code==="email_not_confirmed"?"يجب تأكيد البريد الإلكتروني قبل الدخول.":"تعذر إكمال الطلب. تحقق من بيانات الدخول وحاول مرة أخرى.")}finally{setBusy(false)}}
 if(u&&recovery)return <main className="office-login"><form className="office-card" onSubmit={e=>{e.preventDefault();void act(async()=>{await (await auth()).setPassword(password);setPassword("");history.replaceState(null,"","./");setRecovery(false)})}}><h1>تعيين كلمة مرور جديدة</h1><label>كلمة المرور الجديدة<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary" disabled={busy}>حفظ كلمة المرور</button><p role="status">{msg}</p></form></main>;
 if(u&&verified)return <DashboardApp key={u.uid}/>;
 return <main className="office-login gateway"><div className="gateway-layout"><aside className="gateway-intro"><span className="intro-label">محافظة البريمي · مكتب المحافظ</span><h2>سفراء <br/>التحول الرقمي</h2><p>منصة متابعة أداء السفراء وتوثيق إنجازاتهم.</p><span className="intro-foot">سجل مؤشرات الأداء</span></aside><section className="office-card"><div className="office-brand"><img src="./favicon.svg" alt=""/><span>محافظة البريمي<br/><strong>مكتب المحافظ</strong></span></div><p className="eyebrow">سفراء التحول الرقمي</p><h1>{u?"تأكيد البريد الإلكتروني":reset?"استعادة كلمة المرور":"تسجيل الدخول"}</h1>
 <p>{u?"أكّد بريدك قبل فتح سجل المكتب.":reset?"أدخل بريد حسابك لتصلك تعليمات استعادة كلمة المرور.":"ادخل بحسابك المخصص لمتابعة مؤشرات أداء السفراء."}</p>
 {u?<section><p>أكّد بريدك من رسالة Supabase ثم أعد تسجيل الدخول.</p><button className="btn" onClick={()=>act(async()=>{await (await auth()).logout()})}>العودة للدخول</button></section>:
 <form onSubmit={e=>{e.preventDefault();void act(async()=>{const a=await auth();if(reset){await a.reset(email.trim());setMsg("إذا كان البريد مسجّلًا، ستصلك تعليمات الاستعادة.")}else{await a.login(email.trim(),password);setPassword("")}})}}>
 <label>البريد الإلكتروني<input type="email" required dir="ltr" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {!reset&&<label>كلمة المرور<input type="password" required dir="ltr" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 <button className="btn primary" disabled={!ready||busy}>{busy?"جارٍ تنفيذ الطلب…":reset?"إرسال رابط الاستعادة":"دخول المنصة"}</button><button type="button" className="btn" disabled={busy} onClick={()=>{setReset(!reset);setPassword("");setMsg("")}}>{reset?"العودة لتسجيل الدخول":"نسيت كلمة المرور؟"}</button></form>}
 {msg&&<p role="status">{msg}</p>}<small>الدخول مخصص للمستخدمين المخوّلين من مكتب المحافظ.</small></section></div></main>;
}
createRoot(document.getElementById("root")!).render(<ErrorBoundary><Entry/></ErrorBoundary>);
