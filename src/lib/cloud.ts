export type User={emailVerified:boolean;email:string|null;uid:string;displayName:string|null;getIdToken:()=>Promise<string>};
type Auth={watch:(fn:(u:User|null)=>void)=>()=>void;verify:()=>Promise<void>;reset:(email:string)=>Promise<void>;refresh:()=>Promise<User|null>;login:(email:string,password:string)=>Promise<{user:User}>;logout:()=>Promise<void>;user:()=>Promise<User|null>};
export const auth=():Promise<Auth>=>import(new URL('firebase-client.js',document.baseURI).href);
export async function office(op:string,payload:unknown={}){
 const u=await (await auth()).user();if(!u)throw new Error('سجّل الدخول أولاً.');
 const res=await fetch('https://us-central1-buraimidta.cloudfunctions.net/office',{method:'POST',headers:{Authorization:'Bearer '+await u.getIdToken(),'Content-Type':'application/json'},body:JSON.stringify({op,payload})});
 if(!res.ok){const v=await res.json().catch(()=>({}));throw new Error(v.error||'تعذر الاتصال بخدمة المكتب. تحقق من نشرها في Firebase.');}return res;
}
export async function sendFile(id:string,file:File){const base64=await new Promise<string>((ok,no)=>{const reader=new FileReader();reader.onload=()=>ok(String(reader.result).split(',')[1]);reader.onerror=no;reader.readAsDataURL(file);});await office('upload',{id,name:file.name,base64});}
export async function downloadFile(id:string,name:string){const url=URL.createObjectURL(await (await office('download',{id})).blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
