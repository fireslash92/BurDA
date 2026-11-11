import React from "react";
import {auth,type User} from "../lib/cloud";

export function passwordError(password:string,confirmation:string){
 if(password.length<8)return "استخدم كلمة مرور من 8 أحرف على الأقل.";
 if(password!==confirmation)return "كلمتا المرور غير متطابقتين. أعد كتابة التأكيد.";
 return "";
}
export function recoveryError(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==="same_password")return "اختر كلمة مرور مختلفة عن كلمة المرور الحالية.";
 if(code==="weak_password")return "كلمة المرور ضعيفة. استخدم كلمة أطول تجمع أحرفًا وأرقامًا ورموزًا.";
 if(code==="over_email_send_rate_limit")return "بلغت خدمة البريد الحد المسموح لإرسال الرسائل مؤقتًا. حاول لاحقًا، وتواصل مع مدير المنصة إذا استمرت المشكلة.";
 if(code==="over_request_rate_limit")return "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.";
 if(code==="otp_expired"||code==="session_not_found"||code==="refresh_token_not_found")return "انتهت صلاحية جلسة الاستعادة. ارجع واطلب رابطًا جديدًا.";
 return "تعذر إكمال الطلب. تحقق من اتصال الإنترنت وحاول مرة أخرى.";
}
export default function PasswordRecovery({user,ready,invalid,onBack}:{user:User|null;ready:boolean;invalid:boolean;onBack:()=>void}){
 const [password,setPassword]=React.useState("");
 const [confirmation,setConfirmation]=React.useState("");
 const [show,setShow]=React.useState(false);
 const [email,setEmail]=React.useState("");
 const [busy,setBusy]=React.useState(false);
 const [message,setMessage]=React.useState("");
 const [done,setDone]=React.useState(false);
 const [requestNew,setRequestNew]=React.useState(false);
 const [cooldown,setCooldown]=React.useState(0);
 const saving=React.useRef(false);
 React.useEffect(()=>{if(!cooldown)return;const t=setTimeout(()=>setCooldown(cooldown-1),1000);return()=>clearTimeout(t)},[cooldown]);
 const canChange=!!user&&!invalid&&!requestNew;
 async function save(e:React.FormEvent){
  e.preventDefault();if(saving.current)return;
  const validation=passwordError(password,confirmation);if(validation){setMessage(validation);return;}
  saving.current=true;setBusy(true);setMessage("");
  try{
   const a=await auth();await a.setPassword(password);
   setPassword("");setConfirmation("");setDone(true);
   // A recovery session must not silently open the dashboard after saving.
   await a.logout().catch(()=>{});
  }catch(error){setMessage(recoveryError(error))}finally{saving.current=false;setBusy(false)}
 }
 async function resend(e:React.FormEvent){
  e.preventDefault();if(saving.current||cooldown)return;
  saving.current=true;setBusy(true);setMessage("");
  try{await(await auth()).reset(email.trim());setCooldown(60);setMessage("إذا كان البريد مسجّلًا، ستصلك رسالة الاستعادة. افتح أحدث رسالة فقط، وتحقق من البريد غير المرغوب فيه.")}
  catch(error){setMessage(recoveryError(error))}finally{saving.current=false;setBusy(false)}
 }
 return <main className="office-login"><section className="office-card recovery-card" aria-busy={busy}>
  <div className="office-brand"><img src="./favicon.svg" alt=""/><span>محافظة البريمي<br/><strong>مكتب المحافظ</strong></span></div>
  <h1>{done?"تم تغيير كلمة المرور":canChange?"تعيين كلمة مرور جديدة":"استعادة كلمة المرور"}</h1>
  {done?<><p role="status">حُفظت كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول بها.</p><button className="btn primary" onClick={()=>location.replace(new URL('./',location.href).href)}>العودة لتسجيل الدخول</button></>:
   !ready?<p role="status">جارٍ التحقق من رابط الاستعادة…</p>:
   canChange?<form onSubmit={save}>
    <p>أدخل كلمة مرور جديدة ثم أعد كتابتها للتأكيد.</p>
    <label>كلمة المرور الجديدة<input type={show?"text":"password"} autoComplete="new-password" dir="ltr" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} aria-describedby="password-help"/></label>
    <small id="password-help">8 أحرف على الأقل. يُفضّل الجمع بين الأحرف والأرقام والرموز.</small>
    <label>تأكيد كلمة المرور<input type={show?"text":"password"} autoComplete="new-password" dir="ltr" required minLength={8} value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
    <button type="button" className="btn" aria-pressed={show} onClick={()=>setShow(!show)}>{show?"إخفاء كلمة المرور":"إظهار كلمة المرور"}</button>
    <button className="btn primary" disabled={busy}>{busy?"جارٍ حفظ كلمة المرور…":"حفظ كلمة المرور الجديدة"}</button>
    <button type="button" className="btn" disabled={busy} onClick={()=>{setRequestNew(true);setMessage("");setPassword("");setConfirmation("")}}>طلب رابط جديد</button>
   </form>:<form onSubmit={resend}>
    <p role="status">{invalid?"رابط الاستعادة غير صالح أو انتهت صلاحيته، وقد يكون استُخدم مسبقًا.":"اطلب رابطًا جديدًا لتعيين كلمة المرور لحسابك."}</p>
    <label>البريد الإلكتروني<input type="email" autoComplete="email" dir="ltr" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <button className="btn primary" disabled={busy||cooldown>0}>{busy?"جارٍ إرسال الطلب…":cooldown?`يمكن إعادة الإرسال بعد ${cooldown} ثانية`:"إرسال رابط جديد"}</button>
    <button type="button" className="btn" disabled={busy} onClick={onBack}>العودة لتسجيل الدخول</button>
   </form>}
  {message&&<p role="status" aria-live="polite">{message}</p>}
 </section></main>;
}
