export type Role = "admin" | "reviewer" | "viewer" | "ambassador";
export type Status = "draft" | "submitted" | "approved" | "returned";
export interface Member {email:string;user_id:string|null;name:string;role:Role;ambassador_id:string|null;created_at:string}
export interface Ambassador {id:string;name:string;organization:string;wilaya:string;email:string;active:number;created_at:string}
export interface Period {id:string;label:string;starts_on:string;ends_on:string;locked:number}
export interface Indicator {id:string;period_id:string;label:string;description:string;unit:string;weight:number;default_target:number;position:number}
export interface Target {ambassador_id:string;indicator_id:string;value:number}
export interface Achievement {id:string;ambassador_id:string;indicator_id:string;period_id:string;title:string;description:string;quantity:number;date:string;beneficiaries:number;evidence_url:string;status:Status;created_by:string;created_at:string;updated_at:string;reviewer:string;review_comment:string;reviewed_at:string|null}
export interface EvidenceFile {id:string;achievement_id:string;key?:string;name:string;mime:string;size:number;created_at:string}
export interface Audit {id:string;actor:string;action:string;entity_id:string;detail:string;created_at:string}
export interface AppState {me:Member;ambassadors:Ambassador[];periods:Period[];indicators:Indicator[];targets:Target[];achievements:Achievement[];files:EvidenceFile[];members:Member[];audit:Audit[]}
export const DEFAULT_AXES = [
  {label:"التوعية والتدريب",description:"ورش وجلسات مكتملة للتوعية بالتحول الرقمي، موثقة بحضور ومحتوى واضح.",unit:"جلسة",weight:25,default_target:4},
  {label:"المبادرات الرقمية",description:"مبادرات أو تحسينات رقمية منفذة، موثقة بمخرجات وأثر قابل للقياس.",unit:"مبادرة",weight:30,default_target:2},
  {label:"الدعم ونقل المعرفة",description:"حالات دعم مكتملة أو مواد معرفية تمت مشاركتها وتوثيق الاستفادة منها.",unit:"مساهمة",weight:20,default_target:8},
  {label:"التقارير والمتابعة",description:"تقارير دورية مكتملة ومرفوعة في المواعيد المحددة مع توثيق المتابعة.",unit:"تقرير",weight:15,default_target:3},
  {label:"الشراكات والتعاون",description:"أنشطة تعاون منفذة مع جهات أخرى لدعم التحول الرقمي.",unit:"نشاط",weight:10,default_target:2},
];
export const STATUS_LABELS:Record<Status,string> = {draft:"مسودة",submitted:"بانتظار المراجعة",approved:"معتمد",returned:"أعيد للتعديل"};
export const ROLE_LABELS:Record<Role,string> = {admin:"مدير المنصة",reviewer:"مراجع مكتب المحافظ",viewer:"اطلاع فقط",ambassador:"سفير التحول الرقمي"};
export function scoreAmbassador(id:string, axes:Indicator[], targets:Target[], achievements:Achievement[]) {
  const parts = axes.map(axis=>{
    const target = targets.find(t=>t.ambassador_id===id&&t.indicator_id===axis.id)?.value ?? 0;
    const actual = achievements.filter(a=>a.ambassador_id===id&&a.indicator_id===axis.id&&a.period_id===axis.period_id&&a.status==="approved").reduce((n,a)=>n+a.quantity,0);
    const ratio = target>0 ? Math.min(actual/target,1) : 0;
    return {axis,target,actual,ratio,contribution:ratio*axis.weight};
  });
  const ready=parts.length>0&&parts.every(p=>p.target>0)&&Math.abs(axes.reduce((n,a)=>n+a.weight,0)-100)<0.01;
  return {score:ready ? Math.round(parts.reduce((n,p)=>n+p.contribution,0)*10)/10 : null, parts};
}
export function scoreLabel(score:number|null) {return score===null?"مستهدفات غير مكتملة":score>=85?"تحقق مرتفع":score>=65?"تحقق جيد":score>=40?"تحقق متوسط":"يحتاج متابعة"}
export function canManage(role:Role) {return role==="admin"}
export function canReview(role:Role) {return role==="admin"||role==="reviewer"}
export function canWriteFor(member:Pick<Member,"role"|"ambassador_id">,id:string) {return member.role==="admin"||(member.role==="ambassador"&&member.ambassador_id===id)}
export function quarterPeriod(year:number, quarter:number):Period {
  const month=(quarter-1)*3+1;
  const end=new Date(Date.UTC(year,month+2,0)).toISOString().slice(0,10);
  return {id:`${year}-Q${quarter}`,label:`الربع ${["الأول","الثاني","الثالث","الرابع"][quarter-1]} ${year}`,starts_on:`${year}-${String(month).padStart(2,"0")}-01`,ends_on:end,locked:0};
}
export function csvCell(value:unknown) {
  let str=String(value??"");
  if (/^[\s]*[=+\-@\t\r]/.test(str)) str="'"+str;
  return '"'+str.replaceAll('"','""')+'"';
}
export function makeCsv(rows:unknown[][]) {return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")}
