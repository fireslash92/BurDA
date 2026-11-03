import postgres from 'npm:postgres@3.4.7';
import {AsyncLocalStorage} from 'node:async_hooks';
const pool=postgres(Deno.env.get('SUPABASE_DB_URL')!,{prepare:false,max:1,idle_timeout:15});
const ctx=new AsyncLocalStorage<any>();
export const database=()=>ctx.getStore();
export function transaction<T>(fn:()=>Promise<T>){return pool.begin(async sql=>{
 await sql.unsafe('set local search_path=burda,pg_catalog');
 await sql.unsafe("select pg_advisory_xact_lock(215731,1)");
 function stmt(q:string,args:any[]=[]){let i=0;let pg=q.replace(/\?/g,()=>'$'+(++i));if(/^INSERT OR IGNORE/i.test(pg))pg=pg.replace(/^INSERT OR IGNORE/i,'INSERT')+' ON CONFLICT DO NOTHING';
 const exec=()=>sql.unsafe(pg,args);
 return {bind:(...a:any[])=>stmt(q,a),first:async()=> (await exec())[0],all:async()=>({results:await exec()}),run:async()=>({meta:{changes:(await exec()).count}})};}
 return await ctx.run({prepare:stmt,batch:async(items:any[])=>{const out=[];for(const s of items)out.push(await s.run());return out;}},fn);
});}
