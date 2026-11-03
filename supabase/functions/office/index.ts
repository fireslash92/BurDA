import {createClient} from 'npm:@supabase/supabase-js@2.95.3';
import {Buffer} from 'node:buffer';
import {transaction,database} from './db.ts';
import {getMember,getState,mutate,editableAchievement,logStatement,AppError} from './service.ts';
const api=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket=api.storage.from('burda-evidence');
const headers={'Access-Control-Allow-Origin':'https://fireslash92.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
function fileType(b:Buffer){if(b.subarray(0,5).toString()==='%PDF-')return 'application/pdf';if(b.subarray(0,3).toString('hex')==='ffd8ff')return 'image/jpeg';if(b.subarray(0,8).toString('hex')==='89504e470d0a1a0a')return 'image/png';if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')return 'image/webp';}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
 if(req.method!=='POST')throw new AppError('استخدم POST.',405);
 const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];if(!token)throw new AppError('سجّل الدخول أولاً.',401);
 const {data:{user},error}=await api.auth.getUser(token);if(error||!user?.email_confirmed_at||!user.email)throw new AppError('سجّل الدخول بحساب موثّق.',401);
 const run=(fn:any)=>transaction(async()=>fn(await getMember({userId:user.id,email:user.email!,displayName:user.email!})));
 const {op,payload={}}=await req.json();
 if(op==='state')return json(await run(getState));
 if(op==='action')return json(await run((me:any)=>mutate(me,payload)));
 if(op==='download'){const row:any=await run(async(me:any)=>{const f=await database().prepare('select f.*,a.ambassador_id from files f join achievements a on a.id=f.achievement_id where f.id=?').bind(payload.id).first();if(!f||(me.role==='ambassador'&&me.ambassador_id!==f.ambassador_id))throw new AppError('الملف غير متاح.',403);return f;});
 const {data,error}=await bucket.download(row.key);if(error)throw error;return new Response(data,{headers:{...headers,'Content-Type':'application/octet-stream'}});}
 if(op==='upload'){const {base64,name,id}=payload;if(typeof id!=='string'||typeof name!=='string'||typeof base64!=='string'||base64.length>13981016)throw new AppError('ملف غير صالح.');const b=Buffer.from(base64,'base64'),mime=fileType(b);if(!mime||b.length<10||b.length>10485760)throw new AppError('ملف غير مدعوم.');
 const check=async(me:any)=>{await editableAchievement(me,id);if(Number((await database().prepare('select count(*) as n from files where achievement_id=?').bind(id).first()).n)>=5)throw new AppError('الحد خمسة مرفقات.');};await run(check);
 const fid=crypto.randomUUID(),key='evidence/'+fid;const uploaded=await bucket.upload(key,b,{contentType:mime});if(uploaded.error)throw uploaded.error;
 try{await run(async(me:any)=>{await check(me);const safe=name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);await database().batch([database().prepare('insert into files(id,achievement_id,key,name,mime,size,created_at) values(?,?,?,?,?,?,?)').bind(fid,id,key,safe,mime,b.length,new Date().toISOString()),logStatement(me.email,'إرفاق دليل',id,{name:safe})]);});}catch(e){await bucket.remove([key]);throw e;}return json({id:fid});}
 throw new AppError('طلب غير معروف.');
 }catch(e){if(!(e instanceof AppError)&&e.name!=='ZodError')console.error('office operation failed',e.code??e.name);return json({error:e instanceof AppError?e.message:e.name==='ZodError'?'تحقق من الحقول المدخلة.':'تعذر إكمال الطلب.'},e instanceof AppError?e.status:e.name==='ZodError'?400:500);}
});
