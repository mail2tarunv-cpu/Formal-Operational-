import {supabase} from './client.js';

function decodeKey(base64) {
 const pad='='.repeat((4-base64.length%4)%4);
 const raw=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
export async function enablePush(userId,timezone) {
 const key=import.meta.env.VITE_VAPID_PUBLIC_KEY;
 if(!key)throw new Error('Push server has not been configured yet.');
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))
  throw new Error('This browser cannot receive web push notifications.');
 const permission=await Notification.requestPermission();
 if(permission!=='granted')throw new Error('Notification permission was not granted.');
 const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});
 await navigator.serviceWorker.ready;
 const previous=await registration.pushManager.getSubscription();
 const subscription=previous||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(key)});
 const json=subscription.toJSON();
 const {error}=await supabase.from('push_subscriptions').upsert({
  endpoint:json.endpoint,user_id:userId,p256dh:json.keys.p256dh,auth:json.keys.auth,
  timezone:timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'America/New_York'
 },{onConflict:'endpoint'});
 if(error)throw error;
 return true;
}
export async function disablePush(userId){
 const reg=await navigator.serviceWorker.getRegistration('/');
 const sub=await reg?.pushManager.getSubscription();
 if(!sub)return;
 const {error}=await supabase.from('push_subscriptions').delete().eq('endpoint',sub.endpoint).eq('user_id',userId);
 if(error)throw error;
 await sub.unsubscribe();
}
