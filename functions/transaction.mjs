import {DatabaseSync} from 'node:sqlite';
import {AsyncLocalStorage} from 'node:async_hooks';
import {readFileSync} from 'node:fs';
const scope=new AsyncLocalStorage(), schema=readFileSync(new URL('./schema.sql',import.meta.url),'utf8');
const tables=['settings','periods','ambassadors','indicators','members','targets','achievements','files','audit'];
const key=(t,r)=>Buffer.from(JSON.stringify(t==='targets'?[r.ambassador_id,r.indicator_id]:r.id??r.key??r.email)).toString('base64url');
export const database=()=>scope.getStore();
export async function withStore(store,work){
 return store.runTransaction(async tx=>{
  const sql=new DatabaseSync(':memory:');
  try{
   sql.exec(schema);
   const old=new Map();
   const collections=tables.map(t=>store.collection('burdaOffice/v1/'+t));
   const snapshots=await Promise.all(collections.map(c=>tx.get(c)));
   for(const [i,t] of tables.entries()){
    const cols=sql.prepare('pragma table_info('+t+')').all().map(r=>r.name);
    const insert=sql.prepare('insert into '+t+' values ('+cols.map(()=>'?').join(',')+')');
    const prev=new Map();old.set(t,prev);
    for(const d of snapshots[i].docs){const r=d.data();insert.run(...cols.map(k=>r[k]));prev.set(d.id,JSON.stringify(Object.fromEntries(cols.map(k=>[k,r[k]]))));}
   }
   function statement(query,args=[]){const st=sql.prepare(query);return {bind:(...a)=>statement(query,a),first:()=>st.get(...args),all:()=>({results:st.all(...args)}),run:()=>({meta:st.run(...args)})};}
   const api={prepare:statement,batch:items=>items.map(s=>s.run())};
   const result=await scope.run(api,work);
   for(const [i,t] of tables.entries()){const prev=old.get(t);for(const row of sql.prepare('select * from '+t).all()){const id=key(t,row);if(prev.get(id)!==JSON.stringify(row))tx.set(collections[i].doc(id),{...row});prev.delete(id);}for(const id of prev.keys())tx.delete(collections[i].doc(id));}
   return result;
  }finally{sql.close();}
 });
}
