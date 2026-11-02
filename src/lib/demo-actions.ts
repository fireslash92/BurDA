import {newId as newUuid} from "./id";
import type {AppState,Achievement,Member,Ambassador,Indicator} from "./domain";
import {quarterPeriod} from "./domain";
export type ActionPayload={action:string;[key:string]:any};
export function demoMutation(state:AppState,v:ActionPayload,newId:string):AppState {
  const s=structuredClone(state),time=new Date().toISOString();
  if(v.action==="ambassador") {
    const row={...v,id:v.id??newId,created_at:time} as unknown as Ambassador;
    if(v.id)s.ambassadors=s.ambassadors.map(a=>a.id===v.id?{...a,...row}:a);
    else {s.ambassadors.push(row);s.targets.push(...s.indicators.map(i=>({ambassador_id:row.id,indicator_id:i.id,value:i.default_target})))}
  }
  if(v.action==="achievement") {
    const row={...v,id:v.id??newId,status:"draft",created_by:"عرض تجريبي",created_at:time,updated_at:time,reviewer:"",review_comment:"",reviewed_at:null} as unknown as Achievement;
    if(v.id)s.achievements=s.achievements.map(a=>a.id===v.id?{...a,...row}:a);else s.achievements.unshift(row);
  }
  if(v.action==="submit")s.achievements=s.achievements.map(a=>a.id===v.id?{...a,status:"submitted",updated_at:time}:a);
  if(v.action==="review")s.achievements=s.achievements.map(a=>a.id===v.id?{...a,status:v.status,reviewer:"مراجع تجريبي",review_comment:v.comment,reviewed_at:time,updated_at:time}:a);
  if(v.action==="targets")s.targets=s.targets.filter(t=>!(t.ambassador_id===v.ambassador_id&&v.items.find((i:any)=>i.indicator_id===t.indicator_id))).concat(v.items.map((i:any)=>({...i,ambassador_id:v.ambassador_id})));
  if(v.action==="indicators")s.indicators=s.indicators.map(i=>v.items.find((x:Indicator)=>x.id===i.id)?{...i,...v.items.find((x:Indicator)=>x.id===i.id)}:i);
  if(v.action==="lock")s.periods=s.periods.map(p=>p.id===v.period_id?{...p,locked:v.locked?1:0}:p);
  if(v.action==="period") {
    const p=quarterPeriod(v.year,v.quarter);
    if(s.periods.find(x=>x.id===p.id))throw new Error("هذه الفترة مضافة بالفعل.");
    const axes=s.indicators.filter(i=>i.period_id===v.source).map((i,j)=>({...i,id:p.id+"-demo"+j,period_id:p.id}));
    s.periods.unshift(p);s.indicators.push(...axes);s.targets.push(...s.ambassadors.filter(a=>a.active).flatMap(a=>axes.map(i=>({ambassador_id:a.id,indicator_id:i.id,value:i.default_target}))));
  }
  if(v.action==="member") {
    const row={...v,user_id:null,created_at:time} as unknown as Member;
    s.members=s.members.filter(m=>m.email!==v.email).concat(row);
  }
  if(v.action==="removeMember")s.members=s.members.filter(m=>m.email!==v.email);
  if(v.action==="file")s.files.push({id:newId,achievement_id:v.achievement_id,name:v.name,mime:v.mime,size:v.size,created_at:time});
  s.audit.unshift({id:newUuid(),actor:"عرض تجريبي",action:({review:"مراجعة إنجاز",ambassador:"تحديث سفير",achievement:"تسجيل إنجاز",submit:"إرسال للمراجعة",targets:"تعديل المستهدفات",indicators:"تعديل المؤشرات",period:"إضافة فترة",lock:"تغيير حالة الفترة",member:"تحديث صلاحية",removeMember:"إزالة صلاحية",file:"إرفاق دليل"} as Record<string,string>)[v.action]??v.action,entity_id:v.id??newId,detail:JSON.stringify(v),created_at:time});
  return s;
}
