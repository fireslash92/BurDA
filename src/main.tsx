import React from "react";
import {createRoot} from "react-dom/client";
import DashboardApp from "./components/DashboardApp";
class ErrorBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<main className="loading-state"><h1>تعذر فتح التطبيق</h1><p>حدّث الصفحة وحاول مرة أخرى.</p><button className="btn primary" onClick={()=>location.reload()}>إعادة المحاولة</button></main>:this.props.children}
}
createRoot(document.getElementById("root")!).render(<ErrorBoundary><DashboardApp displayName="عرض تجريبي"/></ErrorBoundary>);
