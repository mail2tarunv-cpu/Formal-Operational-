import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';

// This endpoint must be called only by a trusted scheduler.
// Configure CRON_SECRET in Vercel; never include it in the browser.
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(!process.env.CRON_SECRET||req.headers.authorization!=='Bearer '+process.env.CRON_SECRET)
  return res.status(401).json({error:'Unauthorized'});
 const needed=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT'];
 if(needed.some(k=>!process.env[k]))return res.status(503).json({error:'Notification service not configured'});
 const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
 webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
 const now=new Date();let scanned=0,sent=0,failed=0,removed=0;
 let offset=0;const page=100;
 while(true){
  const {data:subscriptions,error}=await db.from('push_subscriptions').select('*').order('created_at').range(offset,offset+page-1);
  if(error)return res.status(500).json({error:'Could not read subscriptions'});
  if(!subscriptions?.length)break;
  for(const s of subscriptions){
   scanned++;
   let local;
   try{local=new Intl.DateTimeFormat('en-CA',{timeZone:s.timezone||'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).reduce((a,p)=>{if(p.type!=='literal')a[p.type]=p.value;return a},{});}
   catch{failed++;continue}
   const hour=Number(local.hour);
   if(hour!==7&&hour!==19)continue;
   const minute=Number(local.minute);
   if(minute>=10)continue;
   const slot=local.year+'-'+local.month+'-'+local.day+'@'+hour;
   if(s.last_sent_slot===slot)continue;
   const {count, error:countErr}=await db.from('circle_members').select('*',{count:'exact',head:true}).eq('user_id',s.user_id);
   if(countErr||!count)continue;
   const payload=JSON.stringify(hour===7
    ?{title:'Your daily doodle is ready',body:'Open Doodl and see your prompt.',tag:'daily-prompt',url:'/'}
    :{title:'Voting just opened',body:'Choose your favorite drawing before 7 AM.',tag:'daily-vote',url:'/'});
   try{
    await webpush.sendNotification({endpoint:s.endpoint,keys:{auth:s.auth,p256dh:s.p256dh}},payload,{TTL:3600});
    sent++;
    await db.from('push_subscriptions').update({last_sent_slot:slot}).eq('endpoint',s.endpoint);
   }catch(e){
    if(e.statusCode===404||e.statusCode===410){await db.from('push_subscriptions').delete().eq('endpoint',s.endpoint);removed++;}
    else failed++;
   }
  }
  if(subscriptions.length<page)break;
  offset+=subscriptions.length;
  if(offset>=5000)break;
 }
 return res.status(200).json({scanned,sent,failed,removed});
}
