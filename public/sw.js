self.addEventListener('push',event=>{
 let data={title:'Your Doodl is ready',body:'Check in with your circle.',url:'/'};
 try{if(event.data)data={...data,...event.data.json()}}catch{}
 event.waitUntil(self.registration.showNotification(String(data.title).slice(0,100),{
  body:String(data.body).slice(0,180),
  icon:'/icon.svg',badge:'/icon.svg',tag:String(data.tag||'doodl-daily'),
  data:{url:new URL(data.url||'/',self.location.origin).pathname}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>{
  const existing=windows.find(w=>new URL(w.url).origin===self.location.origin);
  if(existing){existing.focus();return existing.navigate(event.notification.data?.url||'/')}
  return clients.openWindow(event.notification.data?.url||'/');
 }));
});
