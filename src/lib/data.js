import { requireClient, check, signedArtUrl, signedAvatarUrl } from './client.js';

const client = () => requireClient();

export async function readProfile(id) {
  return check(await client().from('profiles').select('*').eq('id',id).single());
}
export async function updateProfile(id, patch) {
  return check(await client().from('profiles').update(patch).eq('id',id).select().single());
}
export async function allProfiles(ids) {
  if (!ids.length) return [];
  const rows = check(await client().from('profiles').select('*').in('id',ids));
  return Promise.all(rows.map(async p=>({...p,avatar_url:await signedAvatarUrl(p.avatar_path).catch(()=>'')})));
}
export async function uploadAvatar(userId, file) {
  const contentType = file.type==='image/webp'?'image/webp':'image/jpeg';
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo.');
  if (file.size>5*1024*1024) throw new Error('Please use a photo under 5 MB.');
  const path = userId+'/'+crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');
  check(await client().storage.from('doodl-avatars').upload(path,file,{contentType,upsert:false}));
  return updateProfile(userId,{avatar_path:path});
}
export async function readCircles(userId) {
  const memberships=check(await client().from('circle_members').select('circle_id').eq('user_id',userId));
  if(!memberships.length)return [];
  return check(await client().from('circles').select('*').in('id',memberships.map(m=>m.circle_id)).order('created_at',{ascending:false}));
}
export async function createCircle(name,kind,timezone) {
  return check(await client().rpc('create_circle',{p_name:name,p_kind:kind,p_timezone:timezone}));
}
export async function joinCircle(code) {
  return check(await client().rpc('join_circle',{p_code:code}));
}
export async function leaveCircle(id,owner) {
  return check(await client().rpc(owner?'delete_circle':'leave_circle',{p_circle_id:id}));
}
export async function getMembers(circleId) {
  const members=check(await client().from('circle_members').select('user_id,joined_at').eq('circle_id',circleId).order('joined_at'));
  const profiles=await allProfiles(members.map(m=>m.user_id));
  return members.map(m=>({...m,profile:profiles.find(p=>p.id===m.user_id)||{id:m.user_id,display_name:'Artist'}}));
}
export async function loadRound(circleId,uid) {
  const id=check(await client().rpc('ensure_daily_round',{p_circle_id:circleId}));
  const round=check(await client().from('rounds').select('*').eq('id',id).single());
  const phase=check(await client().rpc('round_phase',{p_round_id:id}));
  const parts=check(await client().from('round_parts').select('user_id,prompt_index').eq('round_id',id));
  const submissions=await listDrawings(id);
  const [votes,consents]=await Promise.all([client().from('votes').select('submission_id').eq('round_id',id).eq('voter_id',uid),client().from('share_consents').select('user_id,approved').eq('round_id',id)]);
  return {round,phase,parts,submissions,myVote:check(votes)[0]?.submission_id||null,consents:check(consents)};
}
export async function listDrawings(roundId) {
  const rows=check(await client().from('submissions').select('*').eq('round_id',roundId).order('submitted_at'));
  return Promise.all(rows.map(async row=>({...row,url:await signedArtUrl(row.storage_path).catch(()=> '')})));
}
export async function getPreviousRound(circleId,currentDay) {
  const rows=check(await client().from('rounds').select('*').eq('circle_id',circleId).lt('day',currentDay).order('day',{ascending:false}).limit(1));
  if(!rows.length)return null;
  const phase=check(await client().rpc('round_phase',{p_round_id:rows[0].id}));
  if(phase!=='revealed')return null;
  const [submissions,consents]=await Promise.all([listDrawings(rows[0].id),client().from('share_consents').select('user_id,approved').eq('round_id',rows[0].id)]);
  return {...rows[0],phase,submissions,consents:check(consents)};
}
export async function submitDrawing(round,circleId,userId,blob,oldPath) {
  if(blob.size>10*1024*1024)throw new Error('Drawing is too large to upload.');
  const path=circleId+'/'+round+'/'+userId+'/'+crypto.randomUUID()+'.png';
  check(await client().storage.from('doodl-art').upload(path,blob,{contentType:'image/png',upsert:false}));
  try{
    const saved=check(await client().from('submissions').upsert({round_id:round,user_id:userId,storage_path:path},
      {onConflict:'round_id,user_id'}).select().single());
    if(oldPath) client().storage.from('doodl-art').remove([oldPath]).catch(()=>{});
    return {...saved,url:await signedArtUrl(path)};
  }catch(e){
    await client().storage.from('doodl-art').remove([path]);
    throw e;
  }
}
export async function approveSharing(roundId,userId,approved) {
  return check(await client().from('share_consents').upsert({round_id:roundId,user_id:userId,approved,updated_at:new Date().toISOString()},{onConflict:'round_id,user_id'}));
}
export async function castVote(roundId,submissionId) {
  return check(await client().rpc('cast_vote',{p_round_id:roundId,p_submission_id:submissionId}));
}
export async function leaderboard(circleId) {
  return check(await client().rpc('get_leaderboard',{p_circle_id:circleId}));
}
export async function listMessages(circleId) {
  const rows=check(await client().from('messages').select('*').eq('circle_id',circleId).order('created_at',{ascending:false}).limit(80));
  return rows.reverse();
}
export async function sendMessage(circleId,uid,body) {
  return check(await client().from('messages').insert({circle_id:circleId,user_id:uid,body:body.trim()}).select().single());
}
export async function deleteMessage(id,uid) {
  return check(await client().from('messages').delete().eq('id',id).eq('user_id',uid));
}
export async function listComments(submissionId) {
  return check(await client().from('comments').select('*').eq('submission_id',submissionId).order('created_at'));
}
export async function postComment(submissionId,uid,body) {
  return check(await client().from('comments').insert({submission_id:submissionId,user_id:uid,body:body.trim()}).select().single());
}
export async function reportContent(reporterId,targetId,category,reason) {
  return check(await client().from('reports').insert({reporter_id:reporterId,target_id:targetId,category,reason}));
}
export async function blockUser(userId,blockedId) {
  return check(await client().from('user_blocks').upsert({blocker_id:userId,blocked_id:blockedId}));
}
export async function listBlocks(userId) {
  return check(await client().from('user_blocks').select('blocked_id').eq('blocker_id',userId));
}
export function watchCircle(circleId,callback) {
  const channel=client().channel('circle-'+circleId+'-'+crypto.randomUUID());
  for(const table of ['messages','circle_members']){
    channel.on('postgres_changes',{event:'*',schema:'public',table,filter:'circle_id=eq.'+circleId},callback);
  }
  for(const table of ['submissions','votes','comments','share_consents']){
    channel.on('postgres_changes',{event:'*',schema:'public',table},callback);
  }
  channel.subscribe();
  return ()=>{client().removeChannel(channel)};
}
