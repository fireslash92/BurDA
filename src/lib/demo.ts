import {DEFAULT_AXES,quarterPeriod,type AppState,type Member,type Achievement} from "./domain";
export function demoState(me:Member):AppState {
  const period=quarterPeriod(2026,4);
  const axes=DEFAULT_AXES.map((a,i)=>({...a,id:`demo-i${i+1}`,period_id:period.id,position:i}));
  const ambassadors=[
    ["سفير تجريبي ١","جهة تجريبية أ","البريمي"], ["سفيرة تجريبية ٢","جهة تجريبية ب","محضة"],
    ["سفير تجريبي ٣","جهة تجريبية ج","السنينة"], ["سفيرة تجريبية ٤","جهة تجريبية د","البريمي"],
    ["سفير تجريبي ٥","جهة تجريبية هـ","محضة"], ["سفيرة تجريبية ٦","جهة تجريبية و","البريمي"],
  ].map(([name,organization,wilaya],i)=>({id:`demo-a${i+1}`,name,organization,wilaya,email:"",active:1,created_at:"2026-10-01T08:00:00Z"}));
  const quantity=[[4,2,7,3,1],[3,2,6,2,2],[2,1,4,2,1],[4,1,5,3,1],[1,1,3,1,0],[2,0,2,1,1]];
  const titles=["جلسات توعية بالخدمات الرقمية","تحسين إجراءات العمل رقمياً","دعم الموظفين ونقل المعرفة","تقرير متابعة التحول الرقمي","تعاون في مبادرة رقمية مشتركة"];
  const achievements:Achievement[]=[];
  ambassadors.forEach((a,j)=>axes.forEach((axis,i)=>{if(quantity[j][i]) achievements.push({id:`demo-e${j}-${i}`,ambassador_id:a.id,indicator_id:axis.id,period_id:period.id,title:titles[i],description:"سجل توضيحي لا يمثل إنجازاً فعلياً. يوضح طريقة احتساب الأداء بعد اعتماد الأدلة.",quantity:quantity[j][i],date:`2026-10-${String(2+j).padStart(2,"0")}`,beneficiaries:i===0?quantity[j][i]*12:0,evidence_url:"",status:"approved",created_by:"عرض تجريبي",created_at:"2026-10-08T08:00:00Z",updated_at:"2026-10-08T08:00:00Z",reviewer:"مراجع تجريبي",review_comment:"اعتماد توضيحي",reviewed_at:"2026-10-08T08:00:00Z"})}));
  [0,2,4].forEach((j,i)=>achievements.push({id:`demo-p${i}`,ambassador_id:ambassadors[j].id,indicator_id:axes[i].id,period_id:period.id,title:["ورشة أدوات العمل الرقمي","توثيق مبادرة تبسيط الإجراءات","مادة معرفية للموظفين"][i],description:"بيانات توضيحية لعرض قائمة المراجعة. ليست بيانات حقيقية.",quantity:1,date:"2026-10-10",beneficiaries:15,evidence_url:"",status:"submitted",created_by:"عرض تجريبي",created_at:"2026-10-10T08:00:00Z",updated_at:"2026-10-10T08:00:00Z",reviewer:"",review_comment:"",reviewed_at:null}));
  return {me:{...me,role:"admin"},ambassadors,periods:[period],indicators:axes,targets:ambassadors.flatMap(a=>axes.map(i=>({ambassador_id:a.id,indicator_id:i.id,value:i.default_target}))),achievements,files:[],members:[],audit:[]};
}
