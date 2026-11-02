import {onRequest} from 'firebase-functions/v2/https';
import {defineString} from 'firebase-functions/params';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {withStore,database} from './transaction.mjs';
import {getMember,getState,mutate,editableAchievement,logStatement,AppError} from './service.mjs';
import {randomUUID} from 'node:crypto';
initializeApp();
const owner=defineString('BURDA_OWNER_UID',{description:'Firebase Authentication UID of the first authorized office administrator'});
const bucket=()=>getStorage().bucket('buraimidta.firebasestorage.app');
function type(b){if(b.subarray(0,5).toString()==='%PDF-')return 'application/pdf';if(b.subarray(0,3).toString('hex')==='ffd8ff')return 'image/jpeg';if(b.subarray(0,8).toString('hex')==='89504e470d0a1a0a')return 'image/png';if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')return 'image/webp';}
export const office=onRequest({region:'us-central1',cors:['https://fireslash92.github.io'],maxInstances:4},async(req,res)=>{
 res.set('Cache-Control','private, no-store');
 try{
  if(req.method!=='POST')throw new AppError('استخدم طلب POST.',405);
  let token;try{token=await getAuth().verifyIdToken((req.get('authorization')||'').replace(/^Bearer /,''),true);}catch{throw new AppError('سجّل الدخول أولاً.',401);}
  if(!token.email_verified||!token.email)throw new AppError('يلزم حساب ببريد موثّق.',403);
  if(!owner.value())throw new AppError('لم يكتمل إعداد المدير.',503);
  const identity={userId:token.uid,email:token.email,displayName:token.name||token.email};
  const run=fn=>withStore(getFirestore(),async()=>fn(await getMember(identity)));
  const {op,payload={}}=req.body||{};
  if(op==='state')return res.json(await run(getState));
  if(op==='action')return res.json(await run(me=>mutate(me,payload)));
  if(op==='download'){const f=await run(async me=>{
   const f=database().prepare('select f.*,a.ambassador_id from files f join achievements a on a.id=f.achievement_id where f.id=?').bind(payload.id).first();
   if(!f||(me.role==='ambassador'&&me.ambassador_id!==f.ambassador_id))throw new AppError('الملف غير متاح.',403);return f;});
   const [bytes]=await bucket().file(f.key).download();return res.type('application/octet-stream').send(bytes);}
  if(op==='upload'){
   const {id,base64,name}=payload;if(typeof id!=='string'||typeof base64!=='string'||typeof name!=='string'||base64.length>13981016)throw new AppError('ملف غير صالح.');
   const bytes=Buffer.from(base64,'base64'),mime=type(bytes);if(!mime||bytes.length<10||bytes.length>10485760)throw new AppError('اختر PDF أو صورة مدعومة لا تتجاوز 10 ميجابايت.');
   const check=async me=>{await editableAchievement(me,id);if(database().prepare('select count(*) as n from files where achievement_id=?').bind(id).first().n>=5)throw new AppError('الحد خمسة مرفقات.');};
   await run(check);const fid=randomUUID(),key='burda-evidence/'+fid,object=bucket().file(key);
   await object.save(bytes,{metadata:{contentType:mime},resumable:false});
   try{await run(async me=>{await check(me);const safe=name.replace(/[\\/\x00-\x1f]/g,'_').slice(0,180);database().batch([database().prepare('insert into files (id,achievement_id,key,name,mime,size,created_at) values (?,?,?,?,?,?,?)').bind(fid,id,key,safe,mime,bytes.length,new Date().toISOString()),logStatement(me.email,'إرفاق دليل',id,{name:safe})]);});}catch(e){await object.delete();throw e;}return res.json({id:fid});}
  throw new AppError('طلب غير معروف.');
 }catch(e){const validation=e.name==='ZodError';res.status(e instanceof AppError?e.status:validation?400:500).json({error:e instanceof AppError?e.message:validation?'تحقق من البيانات المدخلة.':'تعذر إكمال العملية.'});}
});
