import React, {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import { ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
 Copy, Download, Ellipsis, Eye, Heart, Home, Image as ImageIcon, Images, Info, LockKeyhole,
 LogOut, MessageCircle, Pencil, Plus, Send, Settings, Share2, Shield, SlidersHorizontal,
 Sparkles, Trash2, Trophy, UploadCloud, UserRound, UserRoundPlus, UsersRound, X, Flag, Ban,
 Clock3, CalendarDays, RotateCw, Play, Palette, CheckCheck
} from 'lucide-react';
import Canvas from './components/Canvas.jsx';
import {canShareRound,contributed,gameMode,isGuestName} from './lib/game.js';
import {supabase,backendConfigured,groupDate,THEMES,explainError,check} from './lib/client.js';
import {
 readProfile,updateProfile,allProfiles,uploadAvatar,readCircles,createCircle,joinCircle,leaveCircle,
 getMembers,loadRound,getPreviousRound,submitDrawing,castVote,approveSharing,leaderboard,listMessages,sendMessage,
 listComments,postComment,reportContent,blockUser,watchCircle,startDrawingSession,startQuickRound,canExportRound
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
// Separate device identity, backed by Supabase Auth rather than public database access.
let guestPromise=null;
function startGuestSession(){
 if(!guestPromise)guestPromise=(async()=>{
  const existing=await supabase.auth.getSession();
  if(existing.error)throw existing.error;
  if(existing.data.session?.user)return existing.data.session.user;
  const newSession=await supabase.auth.signInAnonymously();
  if(newSession.error)throw newSession.error;
  if(!newSession.data.user)throw new Error('Guest session could not be created.');
  return newSession.data.user;
 })().finally(()=>{guestPromise=null});
 return guestPromise;
}
function GuestUnavailable({error,onRetry}){
 return <main className="guest-unavailable">
  <span className="wordmark">doodl<span>.</span></span>
  <div className="guest-unavailable-content"><div className="guest-unavailable-icon"><UsersRound size={29}/></div>
   <h1>Guest rooms aren't available yet.</h1>
   <p>There's no need to sign in. The Doodl project owner just needs to enable anonymous sign-ins in Supabase.</p>
   {error&&<p className="guest-error" role="alert">{error}</p>}
   <Btn icon={RotateCw} onClick={onRetry}>Try again</Btn>
  </div>
  <p className="guest-footnote">Your drawings and messages will stay in your private circle.</p>
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
 const[guestError,setGuestError]=useState('');
 const[groups,setGroups]=useState([]),[groupId,setGroupId]=useState('');
 const[screen,setScreen]=useState('home'),[modal,setModal]=useState('');
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState('');
 const[members,setMembers]=useState([]),[loadedBoard,setBoard]=useState(null),[previous,setPrevious]=useState(null);
 const[chat,setChat]=useState([]),[scores,setScores]=useState([]);
 const[newCircle,setNewCircle]=useState(''),[playerCount,setPlayerCount]=useState(3),[joinCode,setJoinCode]=useState('');
 const initialInvite=useMemo(()=>new URLSearchParams(window.location.search).get('join')?.toUpperCase().replace(/[^0-9A-F]/g,'').slice(0,16)||'',[]);
 const[message,setMessage]=useState(''),[comment,setComment]=useState(''),[selectedDrawing,setSelectedDrawing]=useState(null),[comments,setComments]=useState([]);
 const[displayName,setDisplayName]=useState(''),[now,setNow]=useState(new Date()),[avatarBusy,setAvatarBusy]=useState(false);
 const[reportTarget,setReportTarget]=useState(null),[reportReason,setReportReason]=useState('');
 const[loading,setLoading]=useState(false),[profileLoading,setProfileLoading]=useState(false);
 const activeGroupRef=useRef('');
 const group=groups.find(g=>g.id===groupId)||null;
 const board=loadedBoard?.round?.circle_id===groupId?loadedBoard:null;
 activeGroupRef.current=group?.id||'';
 const mode=gameMode(group?.player_count);
 const roomReady=Boolean(group&&members.length===group.player_count);
 const canQuickStart=Boolean(group&&board&&group.owner_id===user?.id&&roomReady&&!board.round.quick_started_at&&board.phase==='drawing'&&!board.submissions.length);
 const theme=board?THEMES[board.round.theme_index]:THEMES[0];
 const mine=board?.parts.find(p=>p.user_id===user?.id);
 const prompt={label:theme.prompt[mine?.prompt_index||0],description:theme.description[mine?.prompt_index||0]};
 const mySubmission=board?.submissions.find(s=>s.user_id===user?.id);
 const phase=board?.phase||'upcoming';
 const people=useMemo(()=>Object.fromEntries(members.map(m=>[m.user_id,m.profile])),[members]);
 const handleError=(e)=>{setError(explainError(e));};
 const alert=(text)=>setToast(text);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3400);return()=>clearTimeout(t)},[toast]);
 const bootGuest=useCallback(async()=>{
  setGuestError('');setUser(undefined);
  try{setUser(await startGuestSession())}
  catch(e){setGuestError(explainError(e));setUser(null)}
 },[]);
 useEffect(()=>{
  if(!supabase)return;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(session?.user){setUser(session.user);setGuestError('')}
  });
  bootGuest();
  return()=>subscription.unsubscribe();
 },[bootGuest]);
 useEffect(()=>{
  if(!user?.id||!initialInvite)return;
  setJoinCode(initialInvite);setModal('join');
  window.history.replaceState(null,'',window.location.pathname);
 },[user?.id,initialInvite]);
 useEffect(()=>{const interval=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(interval)},[]);
 
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
 useEffect(()=>{
  if(profile&&user&&isGuestName(profile.display_name)&&!initialInvite&&!sessionStorage.getItem('doodl-name-prompt-'+user.id))setModal('name');
 },[profile?.display_name,user?.id,initialInvite]);
 useEffect(()=>{if(!user){setGroups([]);setProfile(null);setBoard(null);return}
  Promise.all([refreshProfile(),refreshCircles()]).catch(handleError);
 },[user?.id,refreshProfile,refreshCircles]);
 const refreshGroup=useCallback(async(silent=false)=>{
  if(!group||!user)return;
  const requested=group.id;
  if(!silent)setLoading(true);
  try{
   const [m,b,msg,rank]=await Promise.all([getMembers(requested),loadRound(requested,user.id),listMessages(requested),group.player_count===3?leaderboard(requested):Promise.resolve([])]);
   const prior=await getPreviousRound(requested,b.round.day);
   if(activeGroupRef.current!==requested)return;
   setMembers(m);setBoard(b);setChat(msg);setScores(rank);setPrevious(prior);
  }catch(e){if(activeGroupRef.current===requested)handleError(e)}
  finally{if(!silent&&activeGroupRef.current===requested)setLoading(false)}
 },[group?.id,group?.player_count,user?.id]);
 useEffect(()=>{setBoard(null);setMembers([]);setChat([]);setScores([]);setPrevious(null)},[groupId]);
 useEffect(()=>{
  if(!group)return;
  refreshGroup();
  const update=()=>refreshGroup(true);
  const stop=watchCircle(group.id,update,board?.round?.id);
  const interval=setInterval(update,20000);
  return()=>{stop();clearInterval(interval)};
 },[group?.id,refreshGroup,board?.round?.id]);
 const switchTab=(name)=>{setScreen(name);setModal('');setError('')};
 const create=async()=>{
  if(newCircle.trim().length<2)return alert('Give your circle a name.');
  setBusy(true);try{
   const id=await createCircle(newCircle.trim(),playerCount,Intl.DateTimeFormat().resolvedOptions().timeZone||'America/New_York');
   await refreshCircles();setGroupId(id);setNewCircle('');setModal('created');setScreen('home');
  }catch(e){handleError(e)}finally{setBusy(false)}
 };
 const join=async()=>{
  setBusy(true);try{const id=await joinCircle(joinCode.trim().toUpperCase());await refreshCircles();setGroupId(id);setJoinCode('');setModal('');setScreen('home');alert('You joined the circle.')}
  catch(e){handleError(e)}finally{setBusy(false)}
 };
 const startSession=durationSeconds=>startDrawingSession(board.round.id,durationSeconds);
 const launchQuickRound=async()=>{
  if(!group||!canQuickStart)return;
  try{setBusy(true);await startQuickRound(group.id);await refreshGroup(true);alert('Quick round started. You have 10 minutes to draw.');}
  catch(e){handleError(e)}finally{setBusy(false)}
 };
 const onSubmit=async blob=>{
  await submitDrawing(board.round.id,group.id,user.id,blob,mySubmission?.storage_path);
  await refreshGroup(true);setScreen('gallery');alert('Drawing uploaded to your circle.');
 };
 const vote=async item=>{
  if(mode!=='trio')return;
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
  const invite=new URL(window.location.href);
  invite.pathname='/';invite.hash='';
  invite.searchParams.set('join',group.invite_code);
  const message='Join my Doodl circle, '+group.name+'. Code: '+group.invite_code;
  try{
   if(navigator.share)await navigator.share({title:'Doodl · '+group.name,text:message,url:invite.toString()});
   else{await navigator.clipboard.writeText(invite.toString());alert('Invite link copied.')}
  }catch(e){if(e.name!=='AbortError')alert('Could not share. Copy the code instead.')}
 };
 const copyCode=async()=>{
  if(!group)return;
  try{await navigator.clipboard.writeText(group.invite_code);alert('Code copied.')}
  catch{alert('Your code is '+group.invite_code)}
 };
 const exportArt=async(round)=>{
  if(!round?.submissions?.length)return alert('No drawings to export.');
  if(!canShareRound(round))return alert('Every contributing artist must approve sharing first.');
  if(!(await canExportRound(round.id)))return alert('Sharing approval changed. Refresh the gallery.');
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
  try{setBusy(true);await updateProfile(user.id,{display_name:displayName.trim()});sessionStorage.setItem('doodl-name-prompt-'+user.id,'1');await refreshProfile();setModal(m=>m==='name'?'':m);alert('Name saved.')}
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
 const exitCircle=async()=>{
  if(!window.confirm(group?.owner_id===user.id?'Delete this circle for everyone?':'Leave this circle?'))return;
  try{await leaveCircle(group.id,group.owner_id===user.id);setModal('');setScreen('home');await refreshCircles();alert('Circle updated.')}
  catch(e){handleError(e)}
 };
 if(!backendConfigured)return <SetupRequired/>;
 if(user===undefined)return <Waiting message="Opening your studio…"/>;
 if(!user)return <GuestUnavailable error={guestError} onRetry={bootGuest}/>;
 if(screen==='draw'&&group&&board?.phase==='drawing')return <><Canvas key={board.round.id+user.id} roundId={board.round.id} userId={user.id} prompt={prompt} theme={theme} existing={mySubmission} session={board.session} onStartSession={startSession} onClose={()=>switchTab('home')} onSubmit={onSubmit} onMessage={alert}/>{toast&&<div className="global-notice">{toast}</div>}</>;
 return <div className="live-app">
  
  <header className="live-topbar"><button className="wordmark" onClick={()=>switchTab('home')}>doodl<span>.</span></button>
   <div className="live-top-actions"><button className="top-room-switch" onClick={()=>setModal('switch')} aria-label="Select room">{group?<><span>{group.name}</span><ChevronDown size={15}/></>:<><span>Rooms</span><Plus size={15}/></>}</button><button className="avatar-button" onClick={()=>switchTab('settings')} aria-label="Profile"><Avatar profile={profile} size={34}/></button></div>
  </header>
  <main className="live-scroll">
   {error&&<div className="inline-error" role="alert"><span>{error}</span><button onClick={()=>setError('')} aria-label="Dismiss error"><X size={17}/></button></div>}
   {screen==='home'&&<div className="screen home-screen">
    <div className="eyebrow">{new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now).toUpperCase()}</div>
    <h1>Good things<br/><em>start small.</em></h1>
    {!groups.length?<div className="empty-group"><UsersRound size={40}/><h2>Make something together.</h2><p>One prompt a day. Your favorite people. Nothing public.</p><Btn icon={Plus} onClick={()=>setModal('create')}>Create a circle</Btn><Btn secondary onClick={()=>setModal('join')}>I have an invite code</Btn></div>
    :<>
     <div className="story-rail"><button className="story" onClick={()=>setModal('create')}><span className="story-icon"><Plus size={24}/></span><small>New circle</small></button>
      {groups.map(g=><button key={g.id} className={'story '+(g.id===group?.id?'is-current':'')} onClick={()=>setGroupId(g.id)}><span className="story-icon circle-story"><UsersRound size={24}/></span><small>{g.name}</small></button>)}</div>
     <div className="overline-row"><span><CalendarDays size={16}/> TODAY'S DROP</span><button onClick={()=>setModal('switch')}>{group?.name}<ChevronDown size={16}/></button></div>
     {loading?<Waiting/>:board&&<div className="challenge-poster">
      <div className={"poster-image theme-"+board.round.theme_index} style={board.submissions.find(s=>s.url)?.url?{backgroundImage:"linear-gradient(0deg,rgba(8,8,8,.94),rgba(8,8,8,.1) 90%),url("+board.submissions.find(s=>s.url).url+")"}:undefined}><div><span>THE DAILY DROP · {theme.category}</span><h2>{theme.name}</h2></div></div>
      <div className="challenge-details"><div className="status-row"><span className="phase-tag"><span/>{phase==='drawing'?'DRAWING OPEN':phase==='voting'?'VOTING OPEN':'ROUND COMPLETE'}</span><span>7 AM – 7 PM / {group?.timezone?.split('/').at(-1).replaceAll('_',' ')}</span></div>
       {phase==='drawing'?<><h3>Your part: {prompt.label}</h3><p>{prompt.description}</p><Btn icon={Pencil} onClick={()=>switchTab('draw')}>{mySubmission?'Redo your drawing':'Start drawing'}</Btn></>
       :phase==='voting'?<><h3>Time to vote.</h3><p>Everyone's doodles are in. Choose your favorite before 7 AM tomorrow.</p><Btn icon={Heart} onClick={()=>switchTab('gallery')}>See today's drawings</Btn></>
       :<><h3>That's a wrap.</h3><p>See what your friends made together and check the results.</p><Btn icon={Images} onClick={()=>switchTab('gallery')}>See the artwork</Btn></>}
      </div>
     </div>}
     <div className="section-heading"><h2>Your circle</h2><button onClick={()=>switchTab('circles')}>See all <ChevronRight size={16}/></button></div>
     <div className="home-circle" onClick={()=>setModal('members')} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter')setModal('members')}}><GroupAvatars members={members}/><div><strong>{members.length} of {group?.player_count||3} players</strong><small>{group?.name}</small></div><ChevronRight size={18}/></div>
     <div className="home-action-grid"><button onClick={()=>switchTab('chat')}><MessageCircle size={22}/><strong>Group chat</strong><small>Catch up with everyone</small><ArrowRight size={16}/></button><button onClick={()=>switchTab('gallery')}><Images size={22}/><strong>Gallery</strong><small>See today's doodles</small><ArrowRight size={16}/></button></div>
     {previous&&<><div className="section-heading"><h2>Yesterday's reveal</h2></div><div className="previous-card"><div className="previous-heading"><CheckCheck size={22}/><div><strong>{THEMES[previous.theme_index].name}</strong><small>{previous.submissions.length} drawings · sharing needs everyone's approval</small></div></div><Btn secondary icon={Download} onClick={()=>exportArt(previous)} disabled={busy||!previous.submissions.length||((previous.consents?.filter(c=>c.approved).length||0)<members.length)}>Save or share collage</Btn><button className="text-button consent-home" onClick={()=>switchTab('gallery')}>Review sharing permissions <ArrowRight size={14}/></button></div></>}
    </>}
   </div>}
   {screen==='circles'&&<div className="screen">
    <div className="eyebrow">YOUR PRIVATE ROOMS</div><h1>My circles<span>.</span></h1><p className="screen-subtitle">A private space for you and your friends. No public search.</p>
    <div className="top-pair"><Btn onClick={()=>setModal('create')} icon={Plus}>Create</Btn><Btn secondary onClick={()=>setModal('join')} icon={UserRoundPlus}>Join with code</Btn></div>
    <div className="list-section-label">YOUR CIRCLES / {groups.length}</div>
    {groups.length?<div className="circle-list">{groups.map(g=><button className={'circle-row '+(g.id===group?.id?'selected':'')} key={g.id} onClick={()=>{setGroupId(g.id);switchTab('home')}}><span className="circle-icon"><UsersRound size={24}/></span><span><strong>{g.name}</strong><small>{g.player_count||3} players · Private</small></span><ChevronRight size={18}/></button>)}</div>
    :<div className="empty-small"><UsersRound size={32}/><h3>No circles yet.</h3><p>Invite a friend and create your first shared canvas.</p></div>}
    {group&&<><div className="section-heading"><h2>{group.name}</h2><button onClick={()=>setModal('members')}>Members <ChevronRight size={16}/></button></div>
    <div className="code-card"><span>INVITE CODE</span><strong>{group.invite_code}</strong><p>{group.player_count||3} players total, including you. Join from another device using this code.</p><Btn secondary icon={Share2} onClick={shareCode}>Share invite link</Btn><button className="copy-invite" onClick={copyCode}><Copy size={15}/> Copy code</button></div>
    <div className="list-section-label">MEMBERS</div><MemberPicker circle={group} members={members} me={user.id} onReport={id=>{setReportTarget(id);setModal('report')}}/>
    <button className="danger-link" onClick={exitCircle}><Trash2 size={17}/>{group.owner_id===user.id?'Delete circle':'Leave circle'}</button></>}
   </div>}
   {screen==='gallery'&&<div className="screen">
    <div className="eyebrow">THE COLLECTION</div><h1>The gallery<span>.</span></h1><p className="screen-subtitle">What everyone made from today's theme.</p>
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
     {phase==='revealed'&&<div className="gallery-export"><h3>Your group's artwork</h3><p>A collage of your circle’s drawings. Everyone must approve before it can be shared.</p><div className="consent-status"><Shield size={16}/>{board.consents?.filter(c=>c.approved).length||0} / {members.length} artists approved sharing</div><button className="consent-toggle" onClick={()=>setSharing({...board.round,consents:board.consents})}>{board.consents?.some(c=>c.user_id===user.id&&c.approved)?<CheckCircle2 size={19}/>:<Shield size={19}/>} {board.consents?.some(c=>c.user_id===user.id&&c.approved)?'Withdraw permission':'Approve group sharing'}</button><Btn icon={Download} onClick={()=>exportArt({...board.round,submissions:board.submissions,consents:board.consents})} disabled={busy||((board.consents?.filter(c=>c.approved).length||0)<members.length)}>Save or share</Btn></div>}
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
    <div className="eyebrow">THE STANDINGS</div><h1>Leaderboard<span>.</span></h1><p className="screen-subtitle">Points are awarded when a voting round finishes.</p>
    {group?<><div className="leader-banner"><Trophy size={29}/><div><strong>{group.name}</strong><small>10 points for every vote received</small></div></div>
     {scores.length?<div className="leader-list">{scores.map((rank,i)=><div key={rank.user_id} className="leader-row"><span className="leader-position">{String(i+1).padStart(2,'0')}</span><Avatar profile={people[rank.user_id]} size={43}/><span className="leader-name">{people[rank.user_id]?.display_name||'Artist'}{rank.user_id===user.id?' (you)':''}</span><strong>{rank.points} <small>pts</small></strong></div>)}</div>:<div className="empty-small"><Trophy size={35}/><p>Scores appear here after voting closes.</p></div>}</>:
     <div className="empty-small"><Trophy size={35}/><p>Join a circle to start earning points.</p></div>}
   </div>}
   {screen==='settings'&&<div className="screen">
    <div className="eyebrow">PERSONAL SPACE</div><h1>My profile<span>.</span></h1>
    <div className="profile-card"><div className="profile-picture"><Avatar profile={profile} size={76}/><label className="upload-overlay" htmlFor="avatar-file" aria-label="Upload profile photo"><UploadCloud size={17}/></label><input id="avatar-file" accept="image/jpeg,image/png,image/webp" type="file" disabled={avatarBusy} onChange={changeAvatar}/></div><div><strong>{profile?.display_name||'Artist'}</strong><small>{user.email||'Guest on this device'}</small></div></div>
    <label className="field-label" htmlFor="displayname">DISPLAY NAME</label><input className="field-input" id="displayname" maxLength={32} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name"/><Btn onClick={saveProfile} disabled={busy||profileLoading} icon={Check}>Save profile</Btn>
    <div className="settings-section"><div className="section-heading"><h2>Privacy and account</h2></div>
     <div className="setting-item"><Shield size={19}/><div><strong>Private circles</strong><small>Your content is only available to members of your circles.</small></div></div>
     
     <div className="guest-device-note"><LockKeyhole size={18}/><p>This browser remembers your guest profile. Clearing browser data loses your original player. Joining with a code from another browser creates a separate player.</p></div>
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
  {modal==='create'&&<Modal title="Start a circle" subtitle="Choose how many people can play." onClose={()=>setModal('')}><div className="field-label">PLAYERS</div><div className="player-choice" role="group" aria-label="Number of players">{[1,2,3].map(n=><button key={n} type="button" aria-pressed={playerCount===n} className={playerCount===n?'active':''} onClick={()=>setPlayerCount(n)}><strong>{n}</strong><span>{n===1?'Just me':n===2?'A duo':'A trio'}</span>{playerCount===n&&<Check size={17}/>}</button>)}</div><label className="field-label" htmlFor="circle">CIRCLE NAME</label><input id="circle" className="field-input" maxLength={48} value={newCircle} onChange={e=>setNewCircle(e.target.value)} placeholder="Give your circle a name"/><p className="sheet-help">{playerCount===1?'A private space just for you.':'You count as one player. Invite '+(playerCount-1)+' '+(playerCount===2?'friend':'friends')+' with your code.'}</p><Btn icon={ArrowRight} disabled={busy||newCircle.trim().length<2} onClick={create}>{busy?'Creating…':'Create circle'}</Btn></Modal>}
  {modal==='created'&&group&&<Modal title="Circle created." subtitle="Your private room is ready." onClose={()=>setModal('')}><div className="created-room"><div className="created-check"><Check size={23}/></div><h3>{group.name}</h3><p>{group.player_count===1?'A circle just for you.':'Room for '+group.player_count+' players, including you.'}</p></div><div className="field-label">PRIVATE INVITE CODE</div><div className="created-code" role="status">{group.invite_code}</div><button className="copy-invite" onClick={copyCode}><Copy size={16}/> Copy code</button><p className="sheet-help">{group.player_count===1?'Start your drawing whenever the round opens.':'Send the code or link to friends. They can join without signing in.'}</p>{group.player_count>1&&<Btn icon={Share2} onClick={shareCode}>Share invite code</Btn>}<Btn secondary onClick={()=>{setModal('');setScreen('home')}}>Go to my circle <ArrowRight size={16}/></Btn></Modal>}
   {modal==='join'&&<Modal title="Join a circle" subtitle="Enter the invitation code from your friend." onClose={()=>setModal('')}><label className="field-label" htmlFor="invite">INVITATION CODE</label><input className="field-input invite-code-input" id="invite" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} maxLength={16} placeholder="ENTER CODE" autoCapitalize="characters"/><Btn icon={ArrowRight} disabled={busy||joinCode.trim().length!==16} onClick={join}>Join circle</Btn></Modal>}
  {modal==='switch'&&<Modal title="Switch circle" onClose={()=>setModal('')}><div className="circle-list">{groups.map(g=><button key={g.id} className={'circle-row '+(g.id===group?.id?'selected':'')} onClick={()=>{setGroupId(g.id);setModal('')}}><span className="circle-icon"><UsersRound size={22}/></span><span><strong>{g.name}</strong><small>{g.player_count||3} players</small></span>{g.id===group?.id?<CheckCircle2 size={19}/>:<ChevronRight size={18}/>}</button>)}</div><button className="sheet-link" onClick={()=>setModal('create')}><Plus size={17}/> Make another circle</button></Modal>}
  {modal==='members'&&<Modal title={group?.name||'Members'} subtitle="People in this circle" onClose={()=>setModal('')}><MemberPicker circle={group} members={members} me={user.id} onReport={id=>{setReportTarget(id);setModal('report')}}/><div className="sheet-footer"><Btn secondary icon={Share2} onClick={shareCode}>Share invitation</Btn></div></Modal>}
  {modal==='drawing'&&selectedDrawing&&<Modal title={people[selectedDrawing.user_id]?.display_name||'Doodle'} subtitle="Submitted artwork" onClose={()=>setModal('')}>
    <div className="detail-art">{selectedDrawing.url?<img src={selectedDrawing.url} alt="Selected friend's drawing"/>:<ImageIcon size={38}/>}</div>
    <div className="detail-caption"><Avatar profile={people[selectedDrawing.user_id]} size={35}/><strong>{people[selectedDrawing.user_id]?.display_name||'Artist'}</strong>
     {selectedDrawing.user_id!==user.id&&<button className="flag-icon" onClick={()=>{setReportTarget(selectedDrawing.id);setModal('report-art')}} aria-label="Report drawing"><Flag size={17}/></button>}
    </div>
    {phase!=='drawing'&&<><h3 className="detail-section">Comments</h3>
    <div className="comments-list">{comments.length?comments.map(c=><div className="comment-item" key={c.id}><Avatar profile={people[c.user_id]} size={31}/><div><strong>{people[c.user_id]?.display_name||'Artist'}</strong><p>{c.body}</p></div></div>):<p className="sheet-help">No comments yet. Say something kind.</p>}</div>
    <form className="comment-compose" onSubmit={sendComment}><input value={comment} onChange={e=>setComment(e.target.value)} maxLength={350} placeholder="Leave a comment..." aria-label="Comment"/><button type="submit" disabled={!comment.trim()}><Send size={19}/></button></form>
    {mode==='trio'&&phase==='voting'&&selectedDrawing.user_id!==user.id&&<Btn icon={Heart} onClick={()=>{vote(selectedDrawing);setModal('')}}>{board.myVote===selectedDrawing.id?'Change vote':'Vote for this drawing'}</Btn>}
   </Modal>}
  {(modal==='report'||modal==='report-art')&&<Modal title="Report content" subtitle="Help us keep circles safer." onClose={()=>setModal('')}><label className="field-label" htmlFor="reason">WHAT HAPPENED?</label><textarea id="reason" className="field-input" rows={4} maxLength={500} value={reportReason} onChange={e=>setReportReason(e.target.value)} placeholder="Tell us what is wrong…"/><Btn icon={Flag} onClick={async()=>{if(modal==='report-art'){try{await reportContent(user.id,reportTarget,'drawing',reportReason);setModal('');alert('Report submitted.')}catch(e){handleError(e)}}else submitReport()}}>Submit report</Btn>{modal==='report'&&<button className="sheet-link" onClick={()=>block(reportTarget)}><Ban size={17}/> Block this person</button>}</Modal>}
  {toast&&<div className="global-notice" role="status">{toast}</div>}
 </div>;
}
export default Doodl;
