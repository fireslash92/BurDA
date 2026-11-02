import {auth} from "./lib/cloud";
import React from "react";
import {createRoot} from "react-dom/client";
import DashboardApp from "./components/DashboardApp";
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<main className="loading-state"><h1>تعذر فتح التطبيق</h1><p>حدّث الصفحة وحاول مرة أخرى.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة المحاولة</button></main>:this.props.children}
}
function Entry(){
 const real=new URLSearchParams(location.search).has("office");
 const [name,setName]=React.useState<string|null>(null),[ready,setReady]=React.useState(false),[msg,setMsg]=React.useState("");
 React.useEffect(()=>{if(real)auth().then(a=>a.user()).then(u=>{if(u)setName(u.displayName||"المستخدم")}).catch(()=>setMsg("تعذر تحميل خدمة تسجيل الدخول. تحقق من الشبكة وأعد المحاولة.")).finally(()=>setReady(true))},[real]);
 if(!real||name)return <DashboardApp key={name||"guest"} displayName={name||"عرض تجريبي"} guest={!real}/>;
 return <main className="loading-state"><h1>سجل مكتب المحافظ</h1><p>سجّل الدخول بحساب Google المخوّل للاطلاع على بيانات السفراء.</p><button className="btn primary" disabled={!ready} onClick={async()=>{setMsg("");try{const u=(await (await auth()).login()).user;setName(u.displayName||"المستخدم")}catch(e){setMsg("تعذر تسجيل الدخول: "+(e instanceof Error?e.message:"حاول مرة أخرى."))}}}>الدخول بحساب Google</button>{msg&&<p role="alert">{msg}</p>}<a href="./">العودة إلى العرض التجريبي</a></main>;
}
createRoot(document.getElementById("root")!).render(<ErrorBoundary><Entry/></ErrorBoundary>);
