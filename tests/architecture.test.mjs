import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('main app has only three navigation tabs',()=>{
 const app=read('src/App.jsx');
 for(const tab of ["label:'Today'","label:'Gallery'","label:'Chat'"])assert.ok(app.includes(tab),tab);
 assert.ok(!app.includes("screen==='circles'"));
 assert.ok(!app.includes("screen==='ranks'"));
 assert.ok(!app.includes("modal==='notifications'"));
});
test('drawing timer is backed by Supabase session RPC',()=>{
 const canvas=read('src/components/Canvas.jsx');
 const data=read('src/lib/data.js');
 assert.ok(canvas.includes('onStartSession(duration*60)'));
 assert.ok(canvas.includes('remaining(sessionInfo.deadline)'));
 assert.ok(data.includes("rpc('start_drawing_session'"));
});
test('prototype migration covers artwork privacy and artist consent',()=>{
 const migration=read('supabase/migrations/20261123204117_doodl_secure_gameplay_and_quick_rounds.sql');
 for(const name of ['can_read_art','can_export_round','drawing_sessions','share_consent_insert','drawings_view','activate_quick_round'])assert.ok(migration.includes(name),name);
 assert.ok(!migration.includes('p.round_id = p.round_id'));
});
