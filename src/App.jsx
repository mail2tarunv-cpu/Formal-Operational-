import React, {useCallback,useEffect,useMemo,useState} from 'react';
import { ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
 Copy, Download, Ellipsis, Eye, Heart, Home, Image as ImageIcon, Images, Info, LockKeyhole,
 LogOut, MessageCircle, Pencil, Plus, Send, Settings, Share2, Shield, SlidersHorizontal,
 Sparkles, Trash2, Trophy, UploadCloud, UserRound, UserRoundPlus, UsersRound, X, Flag, Ban,
 Clock3, CalendarDays, RotateCw, Play, Palette, CheckCheck
} from 'lucide-react';
import Canvas from './components/Canvas.jsx';
import {enablePush,disablePush} from './lib/push.js';
import {supabase,backendConfigured,groupDate,THEMES,explainError,check} from './lib/client.js';
import {
 readProfile,updateProfile,allProfiles,uploadAvatar,readCircles,createCircle,joinCircle,leaveCircle,
 getMembers,loadRound,getPreviousRound,submitDrawing,castVote,approveSharing,leaderboard,listMessages,sendMessage,
 listComments,postComment,reportContent,blockUser,watchCircle
} from './lib/data.js';

const IconBtn=({icon:Icon,label,onClick,active=false})=><button type="button" className={'icon-btn '+(active?'active':'')} aria-label={label} title={label} onClick={onClick}><Icon size={21}/></button>;
const Avatar=({profile,size=42})=><span className="real-avatar" style={{width:size,height:size}} title={profile?.display_name||'Artist'}>{profile?.avatar_url?<img src={profile.avatar_url} alt={profile.display_name+' photo'}/>:<UserRound size={Math.floor(size*.47)} strokeWidth={1.65}/>}</span>;
const GroupAvatars=({members,size=31})=><div className="avatar-stack">{members.slice(0,5).map(m=><Avatar key={m.user_id} profile={m.profile} size={size}/>)}</div>;
const Btn=({children,onClick,icon:Icon,secondary=false,disabled=false,className='',type='button'})=><button type={type} className={'button '+(secondary?'button-alt':'')+' '+className} onClick={onClick} disabled={disabled}>{children}{Icon&&<Icon size={17}/>}</button>;
function Modal({title,subtitle,onClose,children}){
 return <div className="sheet-overlay" onPointerDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="sheet" role="dialog" aria-modal="true" aria-label={title}>
   <header className="sheet-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><IconBtn icon={X} label="Close" onClick={onClose}/></header>
   <div className="sheet-inner">{children}</div>
  </section>
 </div>;
}
function Waiting({message='Loading your circle…'}){return <div className="center-message"><div className="spinner"/><p>{message}</p></div>}
function SetupRequired(){return <div className="setup-page">
 <div className="setup-mark"><Pencil size={30}/></div>
 <div className="eyebrow">DOODL / PROJECT SETUP</div>
 <h1>The app is ready for its database.</h1>
 <p>Accounts, private circles, messages, drawings and votes need one dedicated Supabase project. The Vercel deployment does not have a database attached yet.</p>
 <div className="setup-checks">
  <div><Check size={18}/> Full React application</div><div><Check size={18}/> Private-group schema and access rules prepared</div>
  <div><Check size={18}/> Auth, real uploads, messaging and voting code</div>
  <div className="pending"><Clock3 size={18}/> Create/connect a dedicated Supabase project</div>
  <div className="pending"><Clock3 size={18}/> Apply migration and set Vercel environment variables</div>
 </div>
 <p className="setup-note">Required environment variables: <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. No user data is collected on this setup screen.</p>
 </div>}
function Auth({onError}){
 const[email,setEmail]=useState(''),[token,setToken]=useState(''),[sent,setSent]=useState(false),[busy,setBusy]=useState(false);
 const send=async e=>{e.preventDefault();setBusy(true);
  try{check(await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin,shouldCreateUser:true}}));setSent(true)}
  catch(e){onError(explainError(e))}finally{setBusy(false)}
 };
 const verify=async e=>{e.preventDefault();setBusy(true);
  try{check(await supabase.auth.verifyOtp({email:email.trim(),token:token.trim(),type:'email'}))}
  catch(e){onError(explainError(e))}finally{setBusy(false)}
 };
 return <main className="auth-shell">
  <div className="auth-top"><span className="wordmark">doodl<span>.</span></span><span className="auth-private"><LockKeyhole size={15}/> Private by default</span></div>
  <div className="auth-art" aria-hidden="true"><div className="auth-pattern"><Pencil size={51} strokeWidth={1.2}/></div></div>
  <div className="auth-content"><span className="eyebrow">GOOD IDEAS ARE BETTER TOGETHER</span><h1>Draw with<br/>your people.</h1><p>One theme. Different ideas. One circle of friends. A new doodle every day.</p>
   {sent?<form onSubmit={verify} className="auth-form"><label htmlFor="otp">Enter the code from your email</label><input id="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="Email code" value={token} onChange={e=>setToken(e.target.value)} minLength={6} maxLength={12} required/><Btn type="submit" disabled={busy} icon={ArrowRight}>{busy?'Checking…':'Verify code'}</Btn><button type="button" className="text-button" onClick={()=>setSent(false)}>Use another email</button></form>
   :<form className="auth-form" onSubmit={send}><label htmlFor="email">Your email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><Btn type="submit" disabled={busy} icon={ArrowRight}>{busy?'Sending…':'Continue with email'}</Btn></form>}
   <p className="auth-privacy"><Shield size={15}/> No public profiles or friend search. Join circles with an invite code.</p>
  </div>
 </main>;
}
function composeArtwork(theme,members,submissions){
 return new Promise(async(resolve,reject)=>{
  try{
   const available=submissions.filter(x=>x.url);
   if(!available.length)throw new Error('No drawings to export yet.');
   const canvas=document.createElement('canvas');const c=canvas.getContext('2d');
   canvas.width=1080;canvas.height=1350;c.fillStyle='#f4f0ea';c.fillRect(0,0,1080,1350);
   c.fillStyle='#1d1e20';c.font='bold 24px Arial';c.fillText('DOODL / MADE TOGETHER',62,78);
   c.font='bold 50px Arial';c.fillText(theme.name,62,151);c.fillStyle='#d96f5e';c.fillRect(62,180,956,4);
   const cols=available.length===1?1:2;const rows=Math.ceil(available.length/cols);
   const cellW=(956-(cols-1)*14)/cols,cellH=Math.min(460,(995-(rows-1)*14)/rows);
   for(let i=0;i<available.length;i++){
    const item=available[i],x=62+(i%cols)*(cellW+14),y=211+Math.floor(i/cols)*(cellH+14);
    c.fillStyle='#ded8d1';c.fillRect(x,y,cellW,cellH);
    const res=await fetch(item.url);if(!res.ok)continue;
    const blob=await res.blob();
    const img=await createImageBitmap(blob);
    const scale=Math.min(cellW/img.width,cellH/img.height);const w=img.width*scale,h=img.height*scale;
    c.drawImage(img,x+(cellW-w)/2,y+(cellH-h)/2,w,h);img.close?.();
   }
   c.fillStyle='#242526';c.font='24px Arial';c.fillText('Made by '+members.length+' friends · Doodl',62,1287);
   canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not export artwork')),'image/png');
  }catch(e){reject(e)}
 });
}
function MemberPicker({circle,members,me,onReport,onBlock}){
 return <div className="member-list">{members.map(member=><div className="member-row" key={member.user_id}>
  <Avatar profile={member.profile} size={42}/><div className="member-identity"><strong>{member.profile.display_name}{member.user_id===me?' (you)':''}</strong><small>{member.user_id===circle.owner_id?'Circle creator':'Circle member'}</small></div>
  {member.user_id!==me&&<button className="member-report" onClick={()=>onReport(member.user_id)} aria-label={'Report '+member.profile.display_name}><Flag size={16}/></button>}
 </div>)}</div>;
}
function Doodl() {
 const[user,setUser]=useState(undefined),[profile,setProfile]=useState(null);
 const[groups,setGroups]=useState([]),[groupId,setGroupId]=useState('');
 const[screen,setScreen]=useState('home'),[modal,setModal]=useState('');
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
 const[members,setMembers]=useState([]),[board,setBoard]=useState(null),[previous,setPrevious]=useState(null);
 const[chat,setChat]=useState([]),[scores,setScores]=useState([]);
 const[newCircle,setNewCircle]=useState(''),[kind,setKind]=useState('group'),[joinCode,setJoinCode]=useState('');
 const[message,setMessage]=useState(''),[comment,setComment]=useState(''),[selectedDrawing,setSelectedDrawing]=useState(null),[comments,setComments]=useState([]);
 const[displayName,setDisplayName]=useState(''),[now,setNow]=useState(new Date()),[avatarBusy,setAvatarBusy]=useState(false);
 const[reportTarget,setReportTarget]=useState(null),[reportReason,setReportReason]=useState('');
 const[loading,setLoading]=useState(false),[profileLoading,setProfileLoading]=useState(false);
 const[pushEnabled,setPushEnabled]=useState(false);
 const group=groups.find(g=>g.id===groupId)||null;
 const theme=board?THEMES[board.round.theme_index]:THEMES[0];
 const mine=board?.parts.find(p=>p.user_id===user?.id);
 const prompt={label:theme.prompt[mine?.prompt_index||0],description:theme.description[mine?.prompt_index||0]};
 const mySubmission=board?.submissions.find(s=>s.user_id===user?.id);
 const phase=board?.phase||'drawing';
 const people=useMemo(()=>Object.fromEntries(members.map(m=>[m.user_id,m.profile])),[members]);
 const handleError=(e)=>{setError(explainError(e));};
 const alert=(text)=>setToast(text);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3400);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{if(!supabase)return;
  supabase.auth.getSession().then(({data,error})=>{if(error)setError(error.message);setUser(data.session?.user||null)}).catch(handleError);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{const interval=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(interval)},[]);
 useEffect(()=>{if('serviceWorker' in navigator)navigator.serviceWorker.getRegistration('/').then(reg=>reg?.pushManager?.getSubscription()).then(sub=>setPushEnabled(Boolean(sub))).catch(()=>{});},[]);
 useEffect(()=>{if(screen==='draw'&&board&&board.phase!=='drawing')setScreen('gallery');},[screen,board?.phase]);
 const refreshCircles=useCallback(async()=>{
  if(!user)return;
  const data=await readCircles(user.id);
  setGroups(data);
  setGroupId(previousId=>data.some(g=>g.id===previousId)?previousId:(data[0]?.id||''));
  return data;
 },[user?.id]);
 const refreshProfile=useCallback(async()=>{
  if(!user)return;
  setProfileLoading(true);
  try{const p=await readProfile(user.id);let avatar_url='';
   if(p.avatar_path){const {signedAvatarUrl}=await import('./lib/client.js');avatar_url=await signedAvatarUrl(p.avatar_path).catch(()=>'')}
   setProfile({...p,avatar_url});setDisplayName(p.display_name)
  }finally{setProfileLoading(false)}
 },[user?.id]);
 useEffect(()=>{if(!user){setGroups([]);setProfile(null);setBoard(null);return}
  Promise.all([refreshProfile(),refreshCircles()]).catch(handleError);
 },[user?.id,refreshProfile,refreshCircles]);
 const refreshGroup=useCallback(async(silent=false)=>{
  if(!group||!user)return;
  if(!silent)setLoading(true);
  try{
   const [m,b,msg,rank]=await Promise.all([
     getMembers(group.id),loadRound(group.id,user.id),listMessages(group.id),leaderboard(group.id)
   ]);
   const prior=await getPreviousRound(group.id,b.round.day);
   setMembers(m);setBoard(b);setChat(msg);setScores(rank);setPrevious(prior);
  }catch(e){handleError(e)}finally{if(!silent)setLoading(false)}
 },[group?.id,user?.id]);
 useEffect(()=>{if(!group)return;refreshGroup();const update=()=>refreshGroup(true);
  const stop=watchCircle(group.id,update);const int=setInterval(update,60000);
  return()=>{stop();clearInterval(int)};
 },[group?.id,refreshGroup]);
 const switchTab=(name)=>{setScreen(name);setModal('');setError('')};
 const create=async()=>{
  if(newCircle.trim().length<2)return alert('Give your circle a name.');
  setBusy(true);try{
   const id=await createCircle(newCircle.trim(),kind,Intl.DateTimeFormat().resolvedOptions().timeZone||'America/New_York');
   await refreshCircles();setGroupId(id);setNewCircle('');setModal('');setScreen('home');alert('Circle created. Share the invite code.');
  }catch(e){handleError(e)}finally{setBusy(false)}
 };
 const join=async()=>{
  setBusy(true);try{const id=await joinCircle(joinCode.trim().toUpperCase());await refreshCircles();setGroupId(id);setJoinCode('');setModal('');setScreen('home');alert('You joined the circle.')}
  catch(e){handleError(e)}finally{setBusy(false)}
 };
 const onSubmit=async blob=>{
  await submitDrawing(board.round.id,group.id,user.id,blob,mySubmission?.storage_path);
  await refreshGroup(true);setScreen('gallery');alert('Drawing uploaded to your circle.');
 };
 const vote=async item=>{
  try{await castVote(board.round.id,item.id);await refreshGroup(true);alert('Your vote is saved.')}
  catch(e){handleError(e)}
 };
 const send=async e=>{
  e.preventDefault();if(!message.trim())return;
  const body=message.trim();setMessage('');
  try{await sendMessage(group.id,user.id,body);setChat(await listMessages(group.id))}
  catch(e){setMessage(body);handleError(e)}
 };
 const openDrawing=async item=>{
  setSelectedDrawing(item);setComments([]);setComment('');setModal('drawing');
  try{setComments(await listComments(item.id))}catch(e){handleError(e)}
 };
 const sendComment=async e=>{
  e.preventDefault();if(!comment.trim()||!selectedDrawing)return;
  try{await postComment(selectedDrawing.id,user.id,comment.trim());setComment('');setComments(await listComments(selectedDrawing.id))}
  catch(e){handleError(e)}
 };
 const shareCode=async()=>{
  if(!group)return;
  const str='Join my Doodl circle “'+group.name+'” with code: '+group.invite_code;
  try{if(navigator.share)await navigator.share({text:str,title:'Join my Doodl circle'});
      else{await navigator.clipboard.writeText(str);alert('Invite copied.');}}
  catch(e){if(e.name!=='AbortError')alert(str)}
 };
 const exportArt=async(round)=>{
  if(!round?.submissions?.length)return alert('No drawings to export.');
  const approved=round.consents?.filter(c=>c.approved).map(c=>c.user_id)||[];
  if(members.some(m=>!approved.includes(m.user_id)))return alert('Every artist must approve group sharing first.');
  try{
   setBusy(true);const blob=await composeArtwork(THEMES[round.theme_index],members,round.submissions);
   const file=new File([blob],'our-doodl.png',{type:'image/png'});
   if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Our group doodle'});}
   else{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);alert('Artwork saved.');}
  }catch(e){if(e.name!=='AbortError')handleError(e)}finally{setBusy(false)}
 };
 const setSharing=async(round)=>{
  const accepted=round.consents?.some(c=>c.user_id===user.id&&c.approved);
  try{await approveSharing(round.id,user.id,!accepted);await refreshGroup(true);alert(accepted?'Sharing permission withdrawn.':'You approved group sharing.')}
  catch(e){handleError(e)}
 };
 const saveProfile=async()=>{if(displayName.trim().length<2)return alert('Please enter at least two characters.');
  try{setBusy(true);await updateProfile(user.id,{display_name:displayName.trim()});await refreshProfile();alert('Profile updated.')}
  catch(e){handleError(e)}finally{setBusy(false)}
 };
 const changeAvatar=async e=>{const file=e.target.files?.[0];if(!file)return;setAvatarBusy(true);
  try{await uploadAvatar(user.id,file);await refreshProfile();alert('Profile photo updated.')}
  catch(e){handleError(e)}finally{setAvatarBusy(false)}
 };
 const submitReport=async()=>{
  if(!reportTarget||reportReason.trim().length<4)return alert('Explain why you are reporting this.');
  try{await reportContent(user.id,reportTarget,'profile',reportReason);setModal('');setReportReason('');alert('Report submitted.')}
  catch(e){handleError(e)}
 };
 const block=async userId=>{
  if(!window.confirm('Block this person? You will no longer see their messages.'))return;
  try{await blockUser(user.id,userId);await refreshGroup(true);setModal('');alert('Person blocked.')}
  catch(e){handleError(e)}
 };
 const togglePush=async()=>{
  setBusy(true);
  try{
   if(pushEnabled){await disablePush(user.id);setPushEnabled(false);alert('Reminders disabled on this device.');}
   else{await enablePush(user.id,group?.timezone);setPushEnabled(true);alert('Daily notifications enabled on this device.');}
  }catch(e){handleError(e)}finally{setBusy(false)}
 };
 const exitCircle=async()=>{
  if(!window.confirm(group?.owner_id===user.id?'Delete this circle for everyone?':'Leave this circle?'))return;
  try{await leaveCircle(group.id,group.owner_id===user.id);setModal('');setScreen('circles');await refreshCircles();alert('Circle updated.')}
  catch(e){handleError(e)}
 };
 if(!backendConfigured)return <SetupRequired/>;
 if(user===undefined)return <Waiting message="Starting Doodl…"/>;
 if(!user)return <><Auth onError={handleError}/>{error&&<div className="global-notice error" role="alert">{error}<button onClick={()=>setError('')}><X size={16}/></button></div>}</>;
 if(screen==='draw'&&group&&board?.phase==='drawing')return <><Canvas key={board.round.id+user.id} roundId={board.round.id} userId={user.id} prompt={prompt} theme={theme} existing={mySubmission} onClose={()=>switchTab('home')} onSubmit={onSubmit} onMessage={alert}/>{toast&&<div className="global-notice">{toast}</div>}</>;
 return <div className="live-app">
  <div className="live-device-clock" aria-hidden="true"><span>9:41</span><span>●● ◖▰</span></div>
  <header className="live-topbar"><button className="wordmark" onClick={()=>switchTab('home')}>doodl<span>.</span></button>
   <div className="live-top-actions"><IconBtn icon={Bell} label="Notifications" onClick={()=>setModal('notifications')}/><button className="avatar-button" onClick={()=>switchTab('settings')} aria-label="Profile"><Avatar profile={profile} size={34}/></button></div>
  </header>
  <main className="live-scroll">
   {error&&<div className="inline-error" role="alert"><span>{error}</span><button onClick={()=>setError('')} aria-label="Dismiss error"><X size={17}/></button></div>}
   {screen==='home'&&<div className="screen home-screen">
    <div className="eyebrow">{new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now).toUpperCase()}</div>
    <h1>Draw something<br/><em>together.</em></h1>
    {!groups.length?<div className="empty-group"><UsersRound size={40}/><h2>Start with your people.</h2><p>Create a circle or join one with an invite code. Only people you invite can join.</p><Btn icon={Plus} onClick={()=>setModal('create')}>Create a circle</Btn><Btn secondary onClick={()=>setModal('join')}>I have an invite code</Btn></div>
    :<>
     <div className="story-rail"><button className="story" onClick={()=>setModal('create')}><span className="story-icon"><Plus size={24}/></span><small>New circle</small></button>
      {groups.map(g=><button key={g.id} className={'story '+(g.id===group?.id?'is-current':'')} onClick={()=>setGroupId(g.id)}><span className="story-icon circle-story"><UsersRound size={24}/></span><small>{g.name}</small></button>)}</div>
     <div className="overline-row"><span><CalendarDays size={16}/> TODAY'S DROP</span><button onClick={()=>setModal('switch')}>{group?.name}<ChevronDown size={16}/></button></div>
     {loading?<Waiting/>:board&&<div className="challenge-poster">
      <div className="poster-image"><span className="poster-watermark"><Palette size={90} strokeWidth={.8}/></span><div><span>{theme.category}</span><h2>{theme.name}</h2></div></div>
      <div className="challenge-details"><div className="status-row"><span className="phase-tag"><span/>{phase==='drawing'?'DRAWING OPEN':phase==='voting'?'VOTING OPEN':'ROUND COMPLETE'}</span><span>7 AM – 7 PM / {group?.timezone?.split('/').at(-1).replaceAll('_',' ')}</span></div>
       {phase==='drawing'?<><h3>Your part: {prompt.label}</h3><p>{prompt.description}</p><Btn icon={Pencil} onClick={()=>switchTab('draw')}>{mySubmission?'Redo your drawing':'Start drawing'}</Btn></>
       :phase==='voting'?<><h3>Time to vote.</h3><p>Everyone's doodles are in. Choose your favorite before 7 AM tomorrow.</p><Btn icon={Heart} onClick={()=>switchTab('gallery')}>See today's drawings</Btn></>
       :<><h3>That's a wrap.</h3><p>See what your friends made together and check the results.</p><Btn icon={Images} onClick={()=>switchTab('gallery')}>See the artwork</Btn></>}
      </div>
     </div>}
     <div className="section-heading"><h2>Your circle</h2><button onClick={()=>switchTab('circles')}>See all <ChevronRight size={16}/></button></div>
     <div className="home-circle" onClick={()=>setModal('members')} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setModal('members')}}><GroupAvatars members={members}/><div><strong>{members.length} friends</strong><small>{group?.name}</small></div><ChevronRight size={18}/></div>
     <div className="home-action-grid"><button onClick={()=>switchTab('chat')}><MessageCircle size={22}/><strong>Group chat</strong><small>Catch up with everyone</small><ArrowRight size={16}/></button><button onClick={()=>switchTab('gallery')}><Images size={22}/><strong>Gallery</strong><small>See today's doodles</small><ArrowRight size={16}/></button></div>
     {previous&&<><div className="section-heading"><h2>Yesterday's reveal</h2></div><div className="previous-card"><div className="previous-heading"><CheckCheck size={22}/><div><strong>{THEMES[previous.theme_index].name}</strong><small>{previous.submissions.length} drawings · sharing needs everyone's approval</small></div></div><Btn secondary icon={Download} onClick={()=>exportArt(previous)} disabled={busy||!previous.submissions.length||((previous.consents?.filter(c=>c.approved).length||0)<members.length)}>Save or share collage</Btn><button className="text-button consent-home" onClick={()=>switchTab('gallery')}>Review sharing permissions <ArrowRight size={14}/></button></div></>}
    </>}
   </div>}
   {screen==='circles'&&<div className="screen">
    <div className="eyebrow">YOUR PEOPLE</div><h1>My circles<span>.</span></h1><p className="screen-subtitle">A private space for you and your friends. No public search.</p>
    <div className="top-pair"><Btn onClick={()=>setModal('create')} icon={Plus}>Create</Btn><Btn secondary onClick={()=>setModal('join')} icon={UserRoundPlus}>Join with code</Btn></div>
    <div className="list-section-label">YOUR CIRCLES / {groups.length}</div>
    {groups.length?<div className="circle-list">{groups.map(g=><button className={'circle-row '+(g.id===group?.id?'selected':'')} key={g.id} onClick={()=>{setGroupId(g.id);switchTab('home')}}><span className="circle-icon"><UsersRound size={24}/></span><span><strong>{g.name}</strong><small>{g.kind==='duo'?'One-on-one':'Group circle'} · Private</small></span><ChevronRight size={18}/></button>)}</div>
    :<div className="empty-small"><UsersRound size={32}/><h3>No circles yet.</h3><p>Invite a friend and create your first shared canvas.</p></div>}
    {group&&<><div className="section-heading"><h2>{group.name}</h2><button onClick={()=>setModal('members')}>Members <ChevronRight size={16}/></button></div>
    <div className="code-card"><span>INVITE CODE</span><strong>{group.invite_code}</strong><p>Share this code with people you trust. Up to {group.kind==='duo'?'2':'8'} members.</p><Btn secondary icon={Share2} onClick={shareCode}>Share invite</Btn></div>
    <div className="list-section-label">MEMBERS</div><MemberPicker circle={group} members={members} me={user.id} onReport={id=>{setReportTarget(id);setModal('report')}}/>
    <button className="danger-link" onClick={exitCircle}><Trash2 size={17}/>{group.owner_id===user.id?'Delete circle':'Leave circle'}</button></>}
   </div>}
   {screen==='gallery'&&<div className="screen">
    <div className="eyebrow">FRIEND ARTWORK</div><h1>The gallery<span>.</span></h1><p className="screen-subtitle">What everyone made from today's theme.</p>
    {!group?<div className="empty-small"><Images size={33}/><p>Join a circle to see drawings.</p></div>:loading?<Waiting/>:board&&<>
     <div className="gallery-period"><div><span className="phase-tag"><span/>{phase==='drawing'?'DRAWING':phase==='voting'?'VOTING':'REVEALED'}</span><h3>{theme.name}</h3><p>{board.submissions.length} / {members.length} drawings submitted</p></div><Clock3 size={24}/></div>
     {board.submissions.length===0?<div className="empty-small"><Pencil size={32}/><h3>No drawings yet.</h3><p>Be the first person to make something for this round.</p>{phase==='drawing'&&<Btn icon={Pencil} onClick={()=>switchTab('draw')}>Start drawing</Btn>}</div>
     :<div className="drawing-grid">{board.submissions.map(s=><article className="drawing-card" key={s.id}>
      <button className="drawing-image" onClick={()=>openDrawing(s)}>{s.url?<img src={s.url} alt={'Drawing by '+(people[s.user_id]?.display_name||'Artist')}/>:<ImageIcon size={30}/>}</button>
      <div className="drawing-person"><Avatar profile={people[s.user_id]} size={31}/><span>{people[s.user_id]?.display_name||'Artist'}</span><button aria-label="Comments" onClick={()=>openDrawing(s)}><MessageCircle size={19}/></button></div>
      {phase==='voting'&&s.user_id!==user.id&&<button className={'vote-action '+(board.myVote===s.id?'voted':'')} onClick={()=>vote(s)}><Heart size={17} fill={board.myVote===s.id?'currentColor':'none'}/>{board.myVote===s.id?'Voted':'Vote for this'}</button>}
     </article>)}</div>}
     {phase==='drawing'&&<p className="helper-note"><Clock3 size={16}/> Voting opens at 7 PM in your circle's timezone.</p>}
     {phase==='voting'&&<p className="helper-note"><Heart size={16}/> One vote per member. You can change your vote until 7 AM.</p>}
     {phase==='revealed'&&<div className="gallery-export"><h3>Your group's artwork</h3><p>Export all submitted drawings together as a shareable collage. AI blending will be added later. Each artist must approve sharing.</p><div className="consent-status"><Shield size={16}/>{board.consents?.filter(c=>c.approved).length||0} / {members.length} artists approved sharing</div><button className="consent-toggle" onClick={()=>setSharing({...board.round,consents:board.consents})}>{board.consents?.some(c=>c.user_id===user.id&&c.approved)?<CheckCircle2 size={19}/>:<Shield size={19}/>} {board.consents?.some(c=>c.user_id===user.id&&c.approved)?'Withdraw permission':'Approve group sharing'}</button><Btn icon={Download} onClick={()=>exportArt({...board.round,submissions:board.submissions,consents:board.consents})} disabled={busy||((board.consents?.filter(c=>c.approved).length||0)<members.length)}>Save or share</Btn></div>}
     {previous&&phase!=='revealed'&&<div className="gallery-export"><div className="eyebrow">PREVIOUS ROUND</div><h3>{THEMES[previous.theme_index].name}</h3><p>{previous.submissions.length} submitted drawings · {previous.consents?.filter(c=>c.approved).length||0} / {members.length} sharing approvals</p><button className="consent-toggle" onClick={()=>setSharing(previous)}>{previous.consents?.some(c=>c.user_id===user.id&&c.approved)?'Withdraw sharing permission':'Approve sharing'}</button><Btn secondary icon={Share2} onClick={()=>exportArt(previous)} disabled={busy||!previous.submissions.length||((previous.consents?.filter(c=>c.approved).length||0)<members.length)}>Share last round</Btn></div>}
    </>}
   </div>}
   {screen==='chat'&&<div className="screen chat-screen">
    <header className="chat-screen-head"><div className="eyebrow">YOUR CIRCLE</div><h1>{group?.name||'Messages'}</h1><div className="chat-avatars"><GroupAvatars members={members} size={29}/><span>{members.length} members</span></div></header>
    {!group?<div className="empty-small"><MessageCircle size={31}/><p>Create a circle first.</p></div>:
    <><div className="messages-scroll">{chat.length===0?<div className="empty-chat"><MessageCircle size={32}/><h3>Say something first.</h3><p>This conversation stays in your private circle.</p></div>:chat.map(m=><div className={'message '+(m.user_id===user.id?'mine':'')} key={m.id}>{m.user_id!==user.id&&<Avatar profile={people[m.user_id]} size={31}/>}<div><span className="message-name">{m.user_id===user.id?'You':people[m.user_id]?.display_name||'Artist'}</span><p>{m.body}</p><time>{new Date(m.created_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</time></div></div>)}</div>
    <form className="message-compose" onSubmit={send}><input value={message} onChange={e=>setMessage(e.target.value)} maxLength={800} placeholder="Message your circle..." aria-label="Message"/><button type="submit" aria-label="Send" disabled={!message.trim()}><Send size={20}/></button></form></>}
   </div>}
   {screen==='ranks'&&<div className="screen">
    <div className="eyebrow">CREATIVE BRAGGING RIGHTS</div><h1>Leaderboard<span>.</span></h1><p className="screen-subtitle">Points are awarded when a voting round finishes.</p>
    {group?<><div className="leader-banner"><Trophy size={29}/><div><strong>{group.name}</strong><small>10 points for every vote received</small></div></div>
     {scores.length?<div className="leader-list">{scores.map((rank,i)=><div key={rank.user_id} className="leader-row"><span className="leader-position">{String(i+1).padStart(2,'0')}</span><Avatar profile={people[rank.user_id]} size={43}/><span className="leader-name">{people[rank.user_id]?.display_name||'Artist'}{rank.user_id===user.id?' (you)':''}</span><strong>{rank.points} <small>pts</small></strong></div>)}</div>:<div className="empty-small"><Trophy size={35}/><p>Scores appear here after voting closes.</p></div>}</>:
     <div className="empty-small"><Trophy size={35}/><p>Join a circle to start earning points.</p></div>}
   </div>}
   {screen==='settings'&&<div className="screen">
    <div className="eyebrow">PERSONAL SPACE</div><h1>My profile<span>.</span></h1>
    <div className="profile-card"><div className="profile-picture"><Avatar profile={profile} size={76}/><label className="upload-overlay" htmlFor="avatar-file" aria-label="Upload profile photo"><UploadCloud size={17}/></label><input id="avatar-file" accept="image/jpeg,image/png,image/webp" type="file" disabled={avatarBusy} onChange={changeAvatar}/></div><div><strong>{profile?.display_name||'Artist'}</strong><small>{user.email}</small></div></div>
    <label className="field-label" htmlFor="displayname">DISPLAY NAME</label><input className="field-input" id="displayname" maxLength={32} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/><Btn onClick={saveProfile} disabled={busy||profileLoading} icon={Check}>Save profile</Btn>
    <div className="settings-section"><div className="section-heading"><h2>Privacy and account</h2></div>
     <div className="setting-item"><Shield size={19}/><div><strong>Private circles</strong><small>Your content is only available to members of your circles.</small></div></div>
     <div className="setting-item"><Bell size={19}/><div><strong>Daily notifications</strong><small>Get 7 AM drawing and 7 PM voting reminders when the push server is configured.</small></div><button className="text-button" disabled={busy||!import.meta.env.VITE_VAPID_PUBLIC_KEY} onClick={togglePush}>{!import.meta.env.VITE_VAPID_PUBLIC_KEY?'Not set up':pushEnabled?'Disable':'Enable'}</button></div>
     <button className="setting-item setting-button" onClick={async()=>{await supabase.auth.signOut();setScreen('home')}}><LogOut size={19}/><div><strong>Sign out</strong></div><ArrowRight size={17}/></button>
    </div><p className="helper-note">Doodl does not provide public user discovery. Never share private group codes publicly.</p>
   </div>}
  </main>
  <nav className="live-tabs" aria-label="Primary navigation">{[
   {id:'home',icon:Home,label:'Home'},
   {id:'circles',icon:UsersRound,label:'Circles'},
   {id:'draw',icon:Pencil,label:'Draw'},
   {id:'gallery',icon:Images,label:'Gallery'},
   {id:'ranks',icon:Trophy,label:'Ranks'}
  ].map(item=><button key={item.id} className={'tab '+(screen===item.id?'selected':'')+' '+(item.id==='draw'?'draw-tab':'')} onClick={()=>{if(item.id==='draw'&&(!group||phase!=='drawing')){alert(!group?'Create or join a circle first.':'Drawing is only open from 7 AM–7 PM.');return;}switchTab(item.id)}} aria-label={item.label}><span className="tab-icon"><item.icon size={22} strokeWidth={screen===item.id?2.4:1.8}/></span><small>{item.label}</small></button>)}</nav>
  {modal==='create'&&<Modal title="Create a circle" subtitle="No public search. Only your invited friends can join." onClose={()=>setModal('')}><label className="field-label" htmlFor="circle">CIRCLE NAME</label><input id="circle" className="field-input" maxLength={48} value={newCircle} onChange={e=>setNewCircle(e.target.value)} placeholder="e.g. The Late Night Crew"/><div className="field-label">TYPE</div><div className="toggle-choice"><button className={kind==='group'?'active':''} onClick={()=>setKind('group')}><UsersRound size={18}/> Group (up to 8)</button><button className={kind==='duo'?'active':''} onClick={()=>setKind('duo')}><UserRound size={18}/> One-on-one</button></div><p className="sheet-help">Friends join with a private invite code. They need their own accounts.</p><Btn icon={ArrowRight} disabled={busy} onClick={create}>Create circle</Btn></Modal>}
  {modal==='join'&&<Modal title="Join a circle" subtitle="Enter the invitation code from your friend." onClose={()=>setModal('')}><label className="field-label" htmlFor="invite">INVITATION CODE</label><input className="field-input invite-code-input" id="invite" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={16} placeholder="ENTER CODE" autoCapitalize="characters"/><Btn icon={ArrowRight} disabled={busy} onClick={join}>Join circle</Btn></Modal>}
  {modal==='switch'&&<Modal title="Switch circle" onClose={()=>setModal('')}><div className="circle-list">{groups.map(g=><button key={g.id} className={'circle-row '+(g.id===group?.id?'selected':'')} onClick={()=>{setGroupId(g.id);setModal('')}}><span className="circle-icon"><UsersRound size={22}/></span><span><strong>{g.name}</strong><small>{g.kind==='duo'?'One-on-one':'Group'}</small></span>{g.id===group?.id?<CheckCircle2 size={19}/>:<ChevronRight size={18}/>}</button>)}</div><button className="sheet-link" onClick={()=>setModal('create')}><Plus size={17}/> Make another circle</button></Modal>}
  {modal==='members'&&<Modal title={group?.name||'Members'} subtitle="People in this circle" onClose={()=>setModal('')}><MemberPicker circle={group} members={members} me={user.id} onReport={id=>{setReportTarget(id);setModal('report')}}/><div className="sheet-footer"><Btn secondary icon={Share2} onClick={shareCode}>Share invitation</Btn></div></Modal>}
  {modal==='drawing'&&selectedDrawing&&<Modal title={people[selectedDrawing.user_id]?.display_name||'Doodle'} subtitle="Submitted artwork" onClose={()=>setModal('')}>
    <div className="detail-art">{selectedDrawing.url?<img src={selectedDrawing.url} alt="Selected friend's drawing"/>:<ImageIcon size={38}/>}</div>
    <div className="detail-caption"><Avatar profile={people[selectedDrawing.user_id]} size={35}/><strong>{people[selectedDrawing.user_id]?.display_name||'Artist'}</strong>
     {selectedDrawing.user_id!==user.id&&<button className="flag-icon" onClick={()=>{setReportTarget(selectedDrawing.id);setModal('report-art')}} aria-label="Report drawing"><Flag size={17}/></button>}
    </div>
    <h3 className="detail-section">Comments</h3>
    <div className="comments-list">{comments.length?comments.map(c=><div className="comment-item" key={c.id}><Avatar profile={people[c.user_id]} size={31}/><div><strong>{people[c.user_id]?.display_name||'Artist'}</strong><p>{c.body}</p></div></div>):<p className="sheet-help">No comments yet. Say something kind.</p>}</div>
    <form className="comment-compose" onSubmit={sendComment}><input value={comment} onChange={e=>setComment(e.target.value)} maxLength={350} placeholder="Leave a comment..." aria-label="Comment"/><button type="submit" disabled={!comment.trim()}><Send size={19}/></button></form>
    {phase==='voting'&&selectedDrawing.user_id!==user.id&&<Btn icon={Heart} onClick={()=>{vote(selectedDrawing);setModal('')}}>{board.myVote===selectedDrawing.id?'Change vote':'Vote for this drawing'}</Btn>}
   </Modal>}
  {modal==='notifications'&&<Modal title="Daily reminders" subtitle="One prompt every day at 7 AM" onClose={()=>setModal('')}><div className="notification-info"><CalendarDays size={26}/><h3>Make time for something creative.</h3><p>Draw between 7 AM and 7 PM, vote overnight, and see the reveal the next morning. Turn on background reminders in Profile once your circle's push service is connected.</p></div><Btn secondary onClick={()=>{setModal('');switchTab('gallery')}} icon={Images}>Open the gallery</Btn></Modal>}
  {(modal==='report'||modal==='report-art')&&<Modal title="Report content" subtitle="Help us keep circles safer." onClose={()=>setModal('')}><label className="field-label" htmlFor="reason">WHAT HAPPENED?</label><textarea id="reason" className="field-input" rows={4} maxLength={500} value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Tell us what is wrong…"/><Btn icon={Flag} onClick={async()=>{if(modal==='report-art'){try{await reportContent(user.id,reportTarget,'drawing',reportReason);setModal('');alert('Report submitted.')}catch(e){handleError(e)}}else submitReport()}}>Submit report</Btn>{modal==='report'&&<button className="sheet-link" onClick={()=>block(reportTarget)}><Ban size={17}/> Block this person</button>}</Modal>}
  {toast&&<div className="global-notice" role="status">{toast}</div>}
 </div>;
}
export default Doodl;
