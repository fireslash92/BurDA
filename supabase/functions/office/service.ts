import { database } from "./db.ts";
import { z } from "npm:zod@3.25.76";
import { DEFAULT_AXES, canWriteFor, canReview, quarterPeriod, type AppState, type Member, type Period, type Indicator, type Ambassador, type Achievement, type EvidenceFile, type Target, type Audit } from "./domain.ts";
type ChatGPTUser={email:string,userId:string,displayName:string};

export class AppError extends Error { constructor(message:string,public status=400){super(message)} }
function now(){return new Date().toISOString()}
function id(){return crypto.randomUUID()}
const label=z.string().trim().min(2,"أدخل نصاً واضحاً.").max(150);
const email=z.string().trim().email("البريد الإلكتروني غير صحيح.").transform(v=>v.toLowerCase());
const optionalEmail=z.union([email,z.literal("")]);
const key=z.string().min(1).max(100);
const count=z.number().int().min(1).max(100000);
const optionalUrl=z.string().trim().max(1500).refine(v=>{if(!v)return true;try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password}catch{return false}},"رابط الدليل يجب أن يبدأ بـ https://");
export function logStatement(actor:string,action:string,entity:string,detail:unknown) {
  return database().prepare("INSERT INTO audit (id,actor,action,entity_id,detail,created_at) VALUES (?,?,?,?,?,?)").bind(id(),actor,action,entity,JSON.stringify(detail),now());
}
export async function getMember(user:ChatGPTUser):Promise<Member> {
  const db=database();
  // This address is provisioned privately by the project owner and consumed once.
  await db.prepare("insert into public.users(id,name,job_title,role) select ?,name,job_title,'admin' from initial_admin where lower(email)=? on conflict(id) do nothing").bind(user.userId,user.email.toLowerCase()).run();
  await db.prepare("delete from initial_admin where lower(email)=?").bind(user.email.toLowerCase()).run();
  const member=await db.prepare("select * from members where user_id=? and active").bind(user.userId).first<Member>();
  if(!member)throw new AppError("لا يوجد ملف مستخدم نشط لهذا الحساب. تواصل مع مدير المكتب.",403);
  await initialize();
  return member;
}
async function initialize() {
  const db=database(),p=quarterPeriod(2026,4);
  if(await db.prepare("SELECT value FROM settings WHERE key='initialized'").first())return;
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO periods (id,label,starts_on,ends_on,locked) VALUES (?,?,?,?,0)").bind(p.id,p.label,p.starts_on,p.ends_on),
    ...DEFAULT_AXES.map((a,i)=>db.prepare("INSERT OR IGNORE INTO indicators (id,period_id,label,description,unit,weight,default_target,position) VALUES (?,?,?,?,?,?,?,?)").bind(p.id+"-i"+i,p.id,a.label,a.description,a.unit,a.weight,a.default_target,i)),
    db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('initialized','1')"),
  ]);
}
async function all<T>(sql:string,...values:unknown[]){return (await database().prepare(sql).bind(...values).all<T>()).results}
export async function getState(me:Member):Promise<AppState> {
  const own=me.role==="ambassador",ownId=me.ambassador_id??"unassigned";
  const res=await Promise.all([
    own?all<Ambassador>("SELECT * FROM ambassadors WHERE id=?",ownId):all<Ambassador>("SELECT * FROM ambassadors ORDER BY active DESC,name"),
    all<Period>("SELECT * FROM periods ORDER BY starts_on DESC"), all<Indicator>("SELECT * FROM indicators ORDER BY period_id,position"),
    own?all<Target>("SELECT * FROM targets WHERE ambassador_id=?",ownId):all<Target>("SELECT * FROM targets"),
    own?all<Achievement>("SELECT * FROM achievements WHERE ambassador_id=? ORDER BY date DESC",ownId):all<Achievement>("SELECT * FROM achievements ORDER BY date DESC"),
    own?all<EvidenceFile>("SELECT files.id,files.achievement_id,files.name,files.mime,files.size,files.created_at FROM files JOIN achievements ON files.achievement_id=achievements.id WHERE achievements.ambassador_id=?",ownId):all<EvidenceFile>("SELECT id,achievement_id,name,mime,size,created_at FROM files"),
    me.role==="admin"?all<Member>("SELECT * FROM members ORDER BY role,name"):Promise.resolve([]),
    canReview(me.role)?all<Audit>("SELECT * FROM audit ORDER BY created_at DESC LIMIT 100"):Promise.resolve([]),
  ]);
  return {me,ambassadors:res[0],periods:res[1],indicators:res[2],targets:res[3],achievements:res[4],files:res[5],members:res[6],audit:res[7]};
}
function admin(me:Member){if(me.role!=="admin")throw new AppError("هذه العملية لمدير المنصة فقط.",403)}
export async function openPeriod(periodId:string) {
  const p=await database().prepare("SELECT * FROM periods WHERE id=?").bind(periodId).first<Period>();
  if(!p)throw new AppError("فترة الرصد غير موجودة.",404);
  if(p.locked)throw new AppError("هذه الفترة مغلقة. يجب أن يعيد مدير المنصة فتحها قبل التعديل.",409);
  return p;
}
export async function editableAchievement(me:Member,achievementId:string) {
  const a=await database().prepare("SELECT * FROM achievements WHERE id=?").bind(achievementId).first<Achievement>();
  if(!a)throw new AppError("الإنجاز غير موجود.",404);
  if(!canWriteFor(me,a.ambassador_id))throw new AppError("لا يمكنك تعديل سجل سفير آخر.",403);
  if(a.status!=="draft"&&a.status!=="returned")throw new AppError("يمكن تعديل المسودات والإنجازات المعادة فقط.",409);
  await openPeriod(a.period_id);
  return a;
}
export async function mutate(me:Member,input:unknown):Promise<{id?:string}> {
  const base=z.object({action:z.string()}).parse(input),db=database();
  if(base.action==="ambassador") {
    admin(me);
    const v=z.object({id:key.optional(),name:label,organization:label,wilaya:z.enum(["البريمي","محضة","السنينة"]),email:optionalEmail,active:z.number().int().min(0).max(1).default(1)}).parse(input),aid=v.id??id();
    if(v.id) {
      const old=await db.prepare("SELECT * FROM ambassadors WHERE id=?").bind(aid).first<Ambassador>();
      if(!old)throw new AppError("السفير غير موجود.",404);
      await db.batch([db.prepare("UPDATE ambassadors SET name=?,organization=?,wilaya=?,email=?,active=? WHERE id=?").bind(v.name,v.organization,v.wilaya,v.email,v.active,aid),logStatement(me.email,"تعديل ملف سفير",aid,{before:old,after:v})]);
    } else {
      const axes=await all<Indicator>("SELECT indicators.* FROM indicators JOIN periods ON indicators.period_id=periods.id WHERE periods.locked=0");
      await db.batch([db.prepare("INSERT INTO ambassadors (id,name,organization,wilaya,email,active,created_at) VALUES (?,?,?,?,?,?,?)").bind(aid,v.name,v.organization,v.wilaya,v.email,1,now()),...axes.map(a=>db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?)").bind(aid,a.id,a.default_target)),logStatement(me.email,"إضافة سفير",aid,v)]);
    }
    return {id:aid};
  }
  if(base.action==="period") {
    admin(me);
    const v=z.object({year:z.number().int().min(2020).max(2100),quarter:z.number().int().min(1).max(4),source:key}).parse(input),p=quarterPeriod(v.year,v.quarter);
    if(await db.prepare("SELECT id FROM periods WHERE id=?").bind(p.id).first())throw new AppError("هذه الفترة مضافة بالفعل.",409);
    const axes=await all<Indicator>("SELECT * FROM indicators WHERE period_id=? ORDER BY position",v.source);
    if(!axes.length)throw new AppError("الفترة المصدر غير موجودة.");
    const people=await all<Ambassador>("SELECT * FROM ambassadors WHERE active=1"),copies=axes.map((a,i)=>({...a,id:p.id+"-i"+i,period_id:p.id}));
    await db.batch([db.prepare("INSERT INTO periods (id,label,starts_on,ends_on,locked) VALUES (?,?,?,?,0)").bind(p.id,p.label,p.starts_on,p.ends_on),...copies.map(a=>db.prepare("INSERT INTO indicators (id,period_id,label,description,unit,weight,default_target,position) VALUES (?,?,?,?,?,?,?,?)").bind(a.id,p.id,a.label,a.description,a.unit,a.weight,a.default_target,a.position)),...people.flatMap(a=>copies.map(i=>db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?)").bind(a.id,i.id,i.default_target))),logStatement(me.email,"إضافة فترة رصد",p.id,p)]);
    return {id:p.id};
  }
  if(base.action==="lock") {
    admin(me);
    const v=z.object({period_id:key,locked:z.boolean()}).parse(input);
    if(!await db.prepare("SELECT id FROM periods WHERE id=?").bind(v.period_id).first())throw new AppError("الفترة غير موجودة.",404);
    if(v.locked && await db.prepare("SELECT id FROM achievements WHERE period_id=? AND status='submitted' LIMIT 1").bind(v.period_id).first())throw new AppError("أكمل مراجعة الإنجازات المعلقة قبل إغلاق الفترة.");
    await db.batch([db.prepare("UPDATE periods SET locked=? WHERE id=?").bind(v.locked?1:0,v.period_id),logStatement(me.email,v.locked?"إغلاق فترة":"إعادة فتح فترة",v.period_id,v)]);
    return {};
  }
  if(base.action==="indicators") {
    admin(me);
    const v=z.object({period_id:key,items:z.array(z.object({id:key,label:label,description:z.string().trim().min(5).max(1000),unit:z.string().trim().min(1).max(30),weight:z.number().min(1).max(100),default_target:count})).min(1).max(20)}).parse(input);
    await openPeriod(v.period_id);
    if(Math.abs(v.items.reduce((n,a)=>n+a.weight,0)-100)>0.001)throw new AppError("مجموع أوزان المؤشرات يجب أن يساوي 100%.");
    const old=await all<Indicator>("SELECT * FROM indicators WHERE period_id=?",v.period_id);
    if(v.items.length!==old.length||new Set(v.items.map(a=>a.id)).size!==old.length||v.items.some(a=>!old.find(i=>i.id===a.id)))throw new AppError("قائمة المؤشرات غير متطابقة.");
    await db.batch([...v.items.map(a=>db.prepare("UPDATE indicators SET label=?,description=?,unit=?,weight=?,default_target=? WHERE id=? AND period_id=?").bind(a.label,a.description,a.unit,a.weight,a.default_target,a.id,v.period_id)),logStatement(me.email,"تعديل المؤشرات والأوزان",v.period_id,{before:old,after:v.items})]);
    return {};
  }
  if(base.action==="targets") {
    admin(me);
    const v=z.object({period_id:key,ambassador_id:key,items:z.array(z.object({indicator_id:key,value:count})).min(1).max(20)}).parse(input);
    await openPeriod(v.period_id);
    if(!await db.prepare("SELECT id FROM ambassadors WHERE id=?").bind(v.ambassador_id).first())throw new AppError("السفير غير موجود.",404);
    const axes=await all<Indicator>("SELECT * FROM indicators WHERE period_id=?",v.period_id);
    if(v.items.length!==axes.length||new Set(v.items.map(a=>a.indicator_id)).size!==axes.length||v.items.some(a=>!axes.find(i=>i.id===a.indicator_id)))throw new AppError("المستهدفات لا تطابق مؤشرات الفترة.");
    const old=await all<Target>("SELECT targets.* FROM targets JOIN indicators ON targets.indicator_id=indicators.id WHERE targets.ambassador_id=? AND indicators.period_id=?",v.ambassador_id,v.period_id);
    await db.batch([...v.items.map(a=>db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?) ON CONFLICT(ambassador_id,indicator_id) DO UPDATE SET value=excluded.value").bind(v.ambassador_id,a.indicator_id,a.value)),logStatement(me.email,"تعديل مستهدفات سفير",v.ambassador_id,{period:v.period_id,before:old,after:v.items})]);
    return {};
  }
  if(base.action==="achievement") {
    const v=z.object({id:key.optional(),ambassador_id:key,indicator_id:key,period_id:key,title:label,description:z.string().trim().min(10,"اكتب وصفاً للإنجاز لا يقل عن 10 أحرف.").max(5000),quantity:count,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),beneficiaries:z.number().int().min(0).max(1000000),evidence_url:optionalUrl}).parse(input);
    if(!canWriteFor(me,v.ambassador_id))throw new AppError("لا يمكنك إضافة إنجاز لسفير آخر.",403);
    const p=await openPeriod(v.period_id);
    if(v.date<p.starts_on||v.date>p.ends_on||Number.isNaN(Date.parse(v.date))||new Date(v.date).toISOString().slice(0,10)!==v.date)throw new AppError("تاريخ الإنجاز يجب أن يكون صحيحاً وضمن فترة الرصد.");
    const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Muscat",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if(v.date>today)throw new AppError("سجّل إنجازاً تم تنفيذه بالفعل، دون تاريخ مستقبلي.");
    if(!await db.prepare("SELECT id FROM indicators WHERE id=? AND period_id=?").bind(v.indicator_id,v.period_id).first())throw new AppError("المؤشر لا يتبع الفترة المحددة.");
    if(!await db.prepare("SELECT id FROM ambassadors WHERE id=? AND active=1").bind(v.ambassador_id).first())throw new AppError("السفير غير موجود أو ملفه مؤرشف.");
    const aid=v.id??id(),time=now();
    if(v.id) {
      const old=await editableAchievement(me,v.id);
      if(old.ambassador_id!==v.ambassador_id||old.period_id!==v.period_id)throw new AppError("لا يمكن نقل الإنجاز إلى سفير أو فترة أخرى.");
      await db.batch([db.prepare("UPDATE achievements SET indicator_id=?,title=?,description=?,quantity=?,date=?,beneficiaries=?,evidence_url=?,status='draft',reviewer='',review_comment='',reviewed_at=NULL,updated_at=? WHERE id=? AND status IN ('draft','returned')").bind(v.indicator_id,v.title,v.description,v.quantity,v.date,v.beneficiaries,v.evidence_url,time,aid),logStatement(me.email,"تعديل مسودة إنجاز",aid,{before:old,after:v})]);
    } else await db.batch([db.prepare("INSERT INTO achievements (id,ambassador_id,indicator_id,period_id,title,description,quantity,date,beneficiaries,evidence_url,status,created_by,created_at,updated_at,reviewer,review_comment) VALUES (?,?,?,?,?,?,?,?,?,?,'draft',?,?,?,'','')").bind(aid,v.ambassador_id,v.indicator_id,v.period_id,v.title,v.description,v.quantity,v.date,v.beneficiaries,v.evidence_url,me.email,time,time),logStatement(me.email,"إضافة مسودة إنجاز",aid,v)]);
    return {id:aid};
  }
  if(base.action==="submit") {
    const v=z.object({id:key}).parse(input),a=await editableAchievement(me,v.id);
    if(!await db.prepare("SELECT id FROM files WHERE achievement_id=? LIMIT 1").bind(a.id).first()&&!a.evidence_url)throw new AppError("أرفق ملفاً أو رابط دليل قبل إرسال الإنجاز للمراجعة.");
    await db.batch([db.prepare("UPDATE achievements SET status='submitted',updated_at=? WHERE id=? AND status IN ('draft','returned')").bind(now(),a.id),logStatement(me.email,"إرسال إنجاز للمراجعة",a.id,{title:a.title})]);
    return {};
  }
  if(base.action==="review") {
    if(!canReview(me.role))throw new AppError("اعتماد الإنجازات متاح لمكتب المحافظ فقط.",403);
    const v=z.object({id:key,status:z.enum(["approved","returned"]),comment:z.string().trim().max(2000)}).parse(input),a=await db.prepare("SELECT * FROM achievements WHERE id=?").bind(v.id).first<Achievement>();
    if(!a)throw new AppError("الإنجاز غير موجود.",404);
    await openPeriod(a.period_id);
    if(a.status!=="submitted")throw new AppError("تمت معالجة الإنجاز أو لم يرسل للمراجعة.",409);
    if(v.status==="returned"&&v.comment.length<3)throw new AppError("اكتب سبب الإعادة ليتسنى للسفير تعديل الإنجاز.");
    const result=await db.batch([db.prepare("UPDATE achievements SET status=?,reviewer=?,review_comment=?,reviewed_at=?,updated_at=? WHERE id=? AND status='submitted'").bind(v.status,me.email,v.comment,now(),now(),a.id),logStatement(me.email,v.status==="approved"?"اعتماد إنجاز":"إعادة إنجاز للتعديل",a.id,{title:a.title,comment:v.comment})]);
    if(!result[0].meta.changes)throw new AppError("راجع شخص آخر هذا الإنجاز بالفعل. حدّث الصفحة.",409);
    return {};
  }
  if(base.action==="member") {
    admin(me);
    const v=z.object({email,name:label,job_title:z.string().trim().max(160).default(""),role:z.enum(["admin","reviewer","viewer","ambassador"]),ambassador_id:key.nullable()}).parse(input);
    const account=await db.prepare("select id from auth.users where lower(email)=?").bind(v.email).first();
    if(!account)throw new AppError("أنشئ حساب الدخول في Supabase Authentication أولاً.");
    if(account.id===me.user_id)throw new AppError("لا يمكنك تعديل صلاحيات حسابك.");
    if(v.role==="ambassador"&&(!v.ambassador_id||!await db.prepare("select id from ambassadors where id=? and active=1").bind(v.ambassador_id).first()))throw new AppError("اختر ملف سفير نشط.");
    await db.batch([db.prepare("insert into public.users(id,name,job_title,role,ambassador_id) values(?,?,?,?,?) on conflict(id) do update set name=excluded.name,job_title=excluded.job_title,role=excluded.role,ambassador_id=excluded.ambassador_id,active=true").bind(account.id,v.name,v.job_title,v.role,v.role==="ambassador"?v.ambassador_id:null),logStatement(me.email,"تحديث صلاحية مستخدم",account.id,v)]);
    return {};
  }
  if(base.action==="removeMember"){
    admin(me);const v=z.object({email}).parse(input),old=await db.prepare("select * from members where email=?").bind(v.email).first<Member>();
    if(!old||old.user_id===me.user_id)throw new AppError("لا يمكن إزالة هذا الحساب.");
    await db.batch([db.prepare("delete from public.users where id=?").bind(old.user_id),logStatement(me.email,"إزالة صلاحية مستخدم",old.user_id,old)]);return {};
  }
  throw new AppError("العملية غير معروفة.");
}
