import test from 'node:test';
import assert from 'node:assert/strict';
import {withStore} from './transaction.mjs';
import {getMember,getState,mutate} from './service.mjs';
test('only the configured UID bootstraps; records persist and a viewer cannot edit',async()=>{
 const rows=new Map(), store={collection:path=>({path,doc:id=>({path,id})}),runTransaction:async work=>{
  const writes=[];const result=await work({get:async c=>({docs:[...rows.values()].filter(r=>r.path===c.path).map(r=>({id:r.id,data:()=>r.data}))}),set:(ref,data)=>writes.push({...ref,data}),delete:ref=>writes.push(ref)});
  for(const r of writes){const k=r.path+'/'+r.id;if(r.data)rows.set(k,r);else rows.delete(k);}return result;}};
 process.env.BURDA_OWNER_UID='office-owner';
 const as=(uid,fn)=>withStore(store,async()=>fn(await getMember({email:uid+'@example.org',displayName:uid,userId:uid})));
 await assert.rejects(as('stranger',getState),e=>e.status===403);
 assert.equal(rows.size,0);
 await as('office-owner',me=>mutate(me,{action:'ambassador',name:'سفير اختبار',organization:'مكتب الاختبار',wilaya:'البريمي',email:''}));
 await as('office-owner',me=>mutate(me,{action:'member',name:'حساب اطلاع',email:'viewer@example.org',role:'viewer',ambassador_id:null}));
 const state=await as('viewer',getState);assert.equal(state.ambassadors.length,1);assert.equal(state.targets.length,5);assert.equal(state.members.length,0);
 await assert.rejects(as('viewer',me=>mutate(me,{action:'lock',period_id:'2026-Q4',locked:true})),e=>e.status===403);
});
