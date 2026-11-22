import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Home, UsersRound, Images, Trophy, Settings2, Bell, Plus, ArrowRight, ArrowLeft,
  Clock3, Pencil, Eraser, Undo2, Redo2, Trash2, Check, Copy, Share2, Download,
  Heart, MessageCircle, Send, X, Sparkles, Play, Pause, ChevronRight, LockKeyhole,
  UserRoundPlus, Eye, Star, CalendarDays, Info, ShieldCheck, RotateCcw, CheckCircle2,
  Brush, Highlighter, Volume2, MoreHorizontal, Palette, ExternalLink, Image as ImageIcon
} from 'lucide-react';

const PEOPLE = [
  { id: 'you', name: 'You', initials: 'YO', color: '#d5ff78', handle: '@you' },
  { id: 'maya', name: 'Maya', initials: 'MA', color: '#ff9eae', handle: '@mayamakes' },
  { id: 'jules', name: 'Jules', initials: 'JU', color: '#aaa5ff', handle: '@julesdraws' },
  { id: 'noah', name: 'Noah', initials: 'NO', color: '#a0dfff', handle: '@noah' },
  { id: 'ava', name: 'Ava', initials: 'AV', color: '#ffcf92', handle: '@avasketches' }
];
const THEMES = [
  {
    title: 'A CITY ON MARS',
    subtitle: 'A whole new world. Drawn by your crew.',
    label: 'WORLD BUILDING',
    prompts: [
      { label: 'The skyline', detail: 'Imagine the buildings that could exist on Mars. Make the architecture your own.' },
      { label: 'The Martian sky', detail: 'Draw the sky, moons, stars, or strange weather above this new city.' },
      { label: 'The locals', detail: 'Draw the people, aliens, or creatures who call this city home.' },
      { label: 'Getting around', detail: 'Invent a vehicle that could take people across the planet.' },
      { label: 'The landscape', detail: 'Draw the mountains, craters, and unusual plants surrounding the city.' }
    ]
  },
  {
    title: 'UNDERWATER FUTURE',
    subtitle: 'An entire civilization below the surface.',
    label: 'IMAGINATION',
    prompts: [
      { label: 'Ocean architecture', detail: 'Invent buildings that belong deep underwater.' },
      { label: 'The sea above', detail: 'Draw what the water and light look like from below.' },
      { label: 'Deep sea residents', detail: 'Imagine the creatures living in this underwater city.' },
      { label: 'Water transport', detail: 'Draw an unexpected way of getting around underwater.' },
      { label: 'The ocean floor', detail: 'Imagine the terrain, coral, and hidden spaces around the city.' }
    ]
  },
  {
    title: 'THE LAST ARCADE',
    subtitle: 'A place no one wants to leave.',
    label: 'CREATE A PLACE',
    prompts: [
      { label: 'The arcade machines', detail: 'Draw the games and machines you would find inside.' },
      { label: 'The atmosphere', detail: 'Show the lighting, posters, and signs around this arcade.' },
      { label: 'The characters', detail: 'Draw the people or creatures who spend time here.' },
      { label: 'The odd details', detail: 'Add something weird or surprising to this arcade.' },
      { label: 'Outside the arcade', detail: 'Draw the street and neighborhood around this place.' }
    ]
  }
];
const START_GROUP = {
  id: 'orbit', name: 'The Orbit Club', code: 'ORBIT7', members: ['you', 'maya', 'jules', 'noah'],
  type: 'group', accent: '#cfbbff', created: '2026-11-22', demo: true
};
const INITIAL = {
  groups: [START_GROUP], activeGroup: 'orbit', profile: { name: 'You', notifications: false },
  submissions: {}, votes: {}, comments: {}, seenNotifications: false,
  chats: {
    orbit: [
      { id: 's1', by: 'maya', text: 'Our sketches are going to look so chaotic 😭', at: '10:24' },
      { id: 's2', by: 'jules', text: 'That is literally the point', at: '10:26' },
      { id: 's3', by: 'noah', text: 'Calling dibs on drawing the aliens', at: '10:27' }
    ]
  }
};
const KEY = 'formal-operational-doodle-v1';
function getSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored && Array.isArray(stored.groups)) return { ...INITIAL, ...stored };
  } catch (_) {}
  return INITIAL;
}
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function getDayKey(date) {
  const local = new Date(date);
  if (local.getHours() < 7) local.setDate(local.getDate() - 1);
  return [local.getFullYear(), String(local.getMonth() + 1).padStart(2, '0'), String(local.getDate()).padStart(2, '0')].join('-');
}
function getTheme(date) {
  const day = Number(getDayKey(date).replaceAll('-', ''));
  return THEMES[(day + 2) % THEMES.length];
}
function getPerson(id) {
  return PEOPLE.find((p) => p.id === id) || { id, name: id, initials: id.slice(0, 2).toUpperCase(), color: '#d5ff78' };
}
function getRealPhase(date) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19 ? 'drawing' : 'voting';
}
function nextTime(date, hours) {
  const d = new Date(date);
  d.setHours(hours, 0, 0, 0);
  if (d <= date) d.setDate(d.getDate() + 1);
  const ms = d.getTime() - date.getTime();
  const hh = Math.floor(ms / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  return (hh ? hh + 'h ' : '') + mm + 'm';
}
function freshCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = new Uint32Array(6);
  crypto.getRandomValues(rand);
  return Array.from(rand, (n) => letters[n % letters.length]).join('');
}
function Avatar({ id, size = 36, className = '' }) {
  const p = getPerson(id);
  return <span title={p.name} className={'avatar ' + className} style={{ '--avatar': p.color, width: size, height: size, fontSize: size * 0.29 }}>{p.initials}</span>;
}
function Stack({ ids, size = 32 }) {
  return <span className="avatar-stack">{ids.map((id) => <Avatar key={id} id={id} size={size} />)}</span>;
}
function Illustration({ variant = 'city', className = '', size = 'large' }) {
  const v = variant;
  return <svg className={'illustration illustration-' + size + ' ' + className} viewBox="0 0 460 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id={'skyg-' + v} x1="0" y1="0" x2="1" y2="1"><stop stopColor={v === 'sky' ? '#f88bbd' : '#514bd3'} /><stop offset=".59" stopColor={v === 'sky' ? '#a89ff2' : '#aa6bc0'} /><stop offset="1" stopColor={v === 'sky' ? '#ffd4ac' : '#f7a47b'} /></linearGradient>
      <linearGradient id={'sandg-' + v} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b56699" /><stop offset="1" stopColor="#613b83" /></linearGradient>
      <pattern id={'dots-' + v} width="33" height="33" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#fff" opacity=".3"/></pattern>
    </defs>
    <rect width="460" height="360" rx="24" fill={'url(#skyg-' + v + ')'} />
    <rect width="460" height="360" rx="24" fill={'url(#dots-' + v + ')'} />
    <circle cx="340" cy="88" r="51" fill="#ffe8b7" opacity=".95"/><circle cx="340" cy="88" r="62" stroke="#fff4d9" strokeWidth="1.5" opacity=".62"/>
    <ellipse cx="113" cy="100" rx="45" ry="14" fill="#f1bde9" opacity=".4"/><ellipse cx="147" cy="96" rx="32" ry="8" fill="#f9d6ff" opacity=".45"/>
    <path d="M0 257L91 188L170 254L237 193L327 254L393 214L460 267V360H0Z" fill="#b96cba" opacity=".7"/>
    <path d="M0 299L87 260L161 286L251 250L341 282L415 255L460 273V360H0Z" fill={'url(#sandg-' + v + ')'} />
    {(v === 'city' || v === 'building' || v === 'sky') && <>
      <path d="M76 265V160L115 143L153 160V265" fill="#312a6e" stroke="#ecd6fd" strokeWidth="3"/>
      <path d="M174 266V108L205 85L240 108V266" fill="#3b326f" stroke="#eadfff" strokeWidth="3"/>
      <path d="M251 266V169L285 140L319 169V266" fill="#46347e" stroke="#eadfff" strokeWidth="3"/>
      <path d="M326 270V199L360 182L399 203V270" fill="#332d75" stroke="#eadfff" strokeWidth="3"/>
      <path d="M205 85V54M193 62H217" stroke="#f2e9f9" strokeWidth="3" strokeLinecap="round"/>
      {[88, 114, 140, 166].map((y) => <g key={y} stroke="#ffe5b9" strokeWidth="3" strokeLinecap="round"><path d={'M189 ' + (y+1) + 'h10M214 ' + (y+1) + 'h10'} /><path d={'M100 ' + (y+78) + 'h10M120 ' + (y+78) + 'h8'}/></g>)}
      <path d="M158 263C190 248 254 248 298 263" stroke="#ffa9c9" strokeWidth="3"/>
    </>}
    {(v === 'locals') && <>
      {[133,230,329].map((x,i) => <g key={x} transform={'translate(' + x + ' ' + (i===1?155:172) + ')'}>
        <path d="M-19 59L-31 103M19 59L31 103M-20 97L-29 140M20 97L29 140" stroke="#fff3da" strokeWidth="7" strokeLinecap="round"/>
        <ellipse cy="65" rx="28" ry="39" fill={i===1?'#d8ff9c':'#ffb9d0'} stroke="#473d7b" strokeWidth="3"/>
        <ellipse cy="3" rx="35" ry="35" fill={i===1?'#d8ff9c':'#ffc6d7'} stroke="#473d7b" strokeWidth="3"/>
        <circle cx="-12" cy="1" r="5" fill="#473d7b"/><circle cx="12" cy="1" r="5" fill="#473d7b"/>
        <path d="M-12 17Q0 27 12 17" stroke="#473d7b" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-17 -31L-24 -44M17 -31L24 -44" stroke="#473d7b" strokeWidth="3" strokeLinecap="round"/>
      </g>)}
    </>}
    {(v === 'transport') && <>
      <g transform="translate(53 148)">
        <path d="M26 89L47 41H225L267 89Z" fill="#e9d7ff" stroke="#382866" strokeWidth="5" strokeLinejoin="round"/>
        <path d="M92 40V8H184V40" fill="#cdff8c" stroke="#382866" strokeWidth="5"/>
        <circle cx="77" cy="108" r="29" fill="#242345" stroke="#efdfff" strokeWidth="7"/>
        <circle cx="213" cy="108" r="29" fill="#242345" stroke="#efdfff" strokeWidth="7"/>
        <path d="M119 59H191" stroke="#5f418b" strokeWidth="6" strokeLinecap="round"/>
        <path d="M184 8L214 -18" stroke="#f8f3fd" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="214" cy="-18" r="8" fill="#f5ffaf"/>
      </g>
    </>}
    <path d="M0 331C100 317 157 327 224 339S383 320 460 329" stroke="#f8d0f0" strokeWidth="2" opacity=".6"/>
    <circle cx="57" cy="69" r="3" fill="#fff9d6"/><circle cx="240" cy="48" r="3" fill="#fff9d6"/><circle cx="414" cy="153" r="2" fill="#fff9d6"/>
  </svg>;
}
function Modal({ title, subtitle, onClose, children, large = false }) {
  return <div className="modal-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className={'modal ' + (large ? 'modal-wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close" onClick={onClose}><X size={21}/></button></div>
      {children}
    </section>
  </div>;
}
function Button({ children, onClick, variant = 'primary', icon: Icon = null, className = '', disabled = false, type = 'button' }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={'btn btn-' + variant + ' ' + className}>{children}{Icon && <Icon size={17}/>}</button>;
}
const palette = ['#2a273a', '#f4518a', '#8d68ff', '#84d5ff', '#bcf17a', '#f5b45d', '#fffaf2'];
function DrawingStudio({ group, prompt, initialSeconds, paused, onPause, onTime, onExit, onSubmit, toast }) {
  const canvas = useRef(null);
  const drawing = useRef(null);
  const [strokes, setStrokes] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('doodle-draft-' + group.id)) || []; } catch (_) { return []; }
  });
  const [undone, setUndone] = useState([]);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#2a273a');
  const [showPrompt, setShowPrompt] = useState(false);
  const [size, setSize] = useState(6);
  const [duration, setDuration] = useState(7);
  const hasDrawing = strokes.length > 0;
  const coordinates = (e) => {
    const box = canvas.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(900, (e.clientX - box.left) * 900 / box.width)), y: Math.max(0, Math.min(650, (e.clientY - box.top) * 650 / box.height)) };
  };
  const render = () => {
    const node = canvas.current;
    if (!node) return;
    const ctx = node.getContext('2d');
    ctx.clearRect(0, 0, 900, 650);
    const paint = (stroke) => {
      if (!stroke || !stroke.points || !stroke.points.length) return;
      ctx.save();
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = stroke.tool === 'marker' ? 0.5 : 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.tool === 'eraser' ? '#000' : stroke.color;
      ctx.lineWidth = stroke.width;
      const points = stroke.points;
      if (points.length === 1) {
        ctx.beginPath();ctx.arc(points[0].x,points[0].y,stroke.width/2,0,Math.PI*2);ctx.fill();
      } else {
        ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x,points[i].y);
        ctx.stroke();
      }
      ctx.restore();
    };
    strokes.forEach(paint);
    paint(drawing.current);
  };
  useEffect(() => { render();sessionStorage.setItem('doodle-draft-' + group.id, JSON.stringify(strokes)); }, [strokes, group.id]);
  useEffect(() => {
    const handler = () => { if (document.hidden) onPause(true); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [onPause]);
  const down = (e) => {
    if (paused || initialSeconds <= 0) return;
    e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = { points:[coordinates(e)], color, tool, width: tool === 'marker' ? size * 3 : tool === 'eraser' ? 34 : size };
    render();
  };
  const move = (e) => {
    if (!drawing.current) return;
    drawing.current.points.push(coordinates(e));
    render();
  };
  const up = () => {
    if (!drawing.current) return;
    const finished = drawing.current;
    drawing.current = null;
    setStrokes((s) => [...s, finished]);
    setUndone([]);
  };
  const undo = () => { if (!strokes.length) return;setUndone((u) => [...u, strokes[strokes.length - 1]]);setStrokes((s) => s.slice(0, -1)); };
  const redo = () => { if (!undone.length) return;setStrokes((s) => [...s, undone[undone.length - 1]]);setUndone((u) => u.slice(0, -1)); };
  const submit = () => {
    if (!hasDrawing) return toast('Draw something before submitting.');
    onPause(true);
    onSubmit(canvas.current.toDataURL('image/png'));
    sessionStorage.removeItem('doodle-draft-' + group.id);
  };
  const minutes = String(Math.floor(initialSeconds / 60)).padStart(2, '0');
  const seconds = String(initialSeconds % 60).padStart(2, '0');
  return <main className="studio">
    <header className="studio-header">
      <button className="back-text" onClick={() => { onPause(true);onExit(); }}><ArrowLeft size={19}/> Exit studio</button>
      <div className="studio-header-title"><span>YOU'RE DRAWING</span><strong>{group.name}</strong></div>
      <button className="prompt-peek" onClick={() => setShowPrompt((v) => !v)}><Eye size={17}/> View prompt</button>
    </header>
    <div className="studio-body">
      <div className="studio-intro"><span className="tag tag-accent">YOUR SECRET PROMPT</span><h1>{prompt.label}<span className="title-star">✳</span></h1><p>{prompt.detail}</p></div>
      <div className="canvas-shell">
        <div className="canvas-topline"><div className="canvas-meta"><span className="tiny-dot"/><span>Untitled masterpiece</span></div><div className={'timer ' + (initialSeconds < 60 ? 'timer-urgent' : '')}><Clock3 size={17}/>{minutes}:{seconds}<button aria-label={paused ? 'Resume timer' : 'Pause timer'} onClick={() => onPause(!paused)}>{paused ? <Play size={17} fill="currentColor"/> : <Pause size={17} fill="currentColor"/>}</button></div></div>
        <div className="paper">
          <div className="paper-grid"/>
          {!hasDrawing && <div className="canvas-hint">Draw anything.<br/>Seriously, anything. <span>✳</span></div>}
          <canvas ref={canvas} width="900" height="650" aria-label="Draw with touch or mouse" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} style={{touchAction:'none'}}/>
          {paused && <div className="canvas-pause"><Pause size={23}/><strong>Taking five?</strong><span>Your timer is paused.</span><Button onClick={() => onPause(false)} icon={Play}>Keep drawing</Button></div>}
        </div>
        <div className="tools-bar">
          <div className="tool-group">
            <button title="Pen" className={'tool-btn ' + (tool === 'pen' ? 'selected':'')} onClick={() => setTool('pen')}><Pencil size={19}/></button>
            <button title="Marker" className={'tool-btn ' + (tool === 'marker' ? 'selected':'')} onClick={() => setTool('marker')}><Highlighter size={19}/></button>
            <button title="Eraser" className={'tool-btn ' + (tool === 'eraser' ? 'selected':'')} onClick={() => setTool('eraser')}><Eraser size={19}/></button>
          </div>
          <span className="tool-separator"/>
          <div className="color-row">{palette.map((c) => <button key={c} title={'Color ' + c} aria-label={'Choose ' + c} className={'color-button ' + (color === c && tool !== 'eraser' ? 'active':'')} style={{ '--swatch': c }} onClick={() => {setColor(c);if (tool === 'eraser') setTool('pen');}}/>)}</div>
          <span className="tool-separator"/>
          <div className="tool-group tools-actions">
            <button className="tool-btn" title="Undo" disabled={!strokes.length} onClick={undo}><Undo2 size={19}/></button>
            <button className="tool-btn" title="Redo" disabled={!undone.length} onClick={redo}><Redo2 size={19}/></button>
            <button className="tool-btn tool-trash" title="Clear canvas" disabled={!strokes.length} onClick={() => {setStrokes([]);setUndone([]);}}><Trash2 size={18}/></button>
          </div>
        </div>
      </div>
      <div className="studio-foot"><div><span className="small-label">BRUSH SIZE</span><input aria-label="Brush size" type="range" min="2" max="22" value={size} onChange={(e)=>setSize(Number(e.target.value))}/></div><div className="studio-foot-right"><span>Take your time. It doesn't have to be perfect.</span><Button onClick={submit} icon={ArrowRight} disabled={!hasDrawing}>Finish drawing</Button></div></div>
    </div>
    {showPrompt && <Modal title="Your prompt" subtitle="Only you can see this assignment." onClose={() => setShowPrompt(false)}><div className="prompt-modal"><span className="tiny-eyebrow">TODAY'S DRAWING</span><h3>{prompt.label}</h3><p>{prompt.detail}</p><Button onClick={() => setShowPrompt(false)}>Got it <Check size={16}/></Button></div></Modal>}
  </main>;
}
function composeImage(group, members, submission, theme, onDone) {
  const c = document.createElement('canvas');c.width=1080;c.height=1080;
  const x = c.getContext('2d');
  const bg = x.createLinearGradient(0,0,1000,1080);bg.addColorStop(0,'#221a54');bg.addColorStop(.54,'#a95f99');bg.addColorStop(1,'#fcab83');x.fillStyle=bg;x.fillRect(0,0,1080,1080);
  for (let i=0; i<55; i++) {const a=i*79%1080,b=i*137%700;x.beginPath();x.arc(a,b,(i%3+1)*1.2,0,Math.PI*2);x.fillStyle='#ffe4d3';x.fill();}
  x.beginPath();x.arc(820,190,110,0,Math.PI*2);x.fillStyle='#ffe3b0';x.fill();
  x.beginPath();x.arc(820,190,135,0,Math.PI*2);x.strokeStyle='#ffffff66';x.lineWidth=3;x.stroke();
  x.fillStyle='#6d3b82';x.beginPath();x.moveTo(0,740);x.lineTo(250,490);x.lineTo(450,750);x.lineTo(680,550);x.lineTo(1080,790);x.lineTo(1080,1080);x.lineTo(0,1080);x.fill();
  x.fillStyle='#39275b';
  const buildings=[[135,500,130,350],[285,410,120,440],[447,300,148,555],[626,490,160,370],[820,445,120,400]];
  buildings.forEach(([bx,by,bw,bh],i)=>{
    x.fillStyle=i%2?'#30265d':'#423270';x.fillRect(bx,by,bw,bh);
    x.strokeStyle='#d9d0ff';x.lineWidth=4;x.strokeRect(bx,by,bw,bh);
    for(let j=0;j<4;j++)for(let k=0;k<3;k++){x.fillStyle='#ffe5ad';x.fillRect(bx+22+k*30,by+30+j*60,10,17);}
  });
  x.strokeStyle='#ffdeec';x.lineWidth=5;x.beginPath();x.moveTo(521,300);x.lineTo(521,230);x.stroke();
  x.fillStyle='#4d315f';x.fillRect(0,820,1080,260);
  for(let j=0;j<4;j++){const px=380+j*85;x.fillStyle=j%2?'#d1ff9a':'#ffd6e7';x.beginPath();x.arc(px,835,20,0,Math.PI*2);x.fill();x.fillRect(px-17,856,34,61);}
  x.fillStyle='#e9ffab';x.fillRect(800,899,185,50);x.fillStyle='#272544';x.beginPath();x.arc(839,953,28,0,7);x.arc(941,953,28,0,7);x.fill();
  x.fillStyle='#fff';x.font='bold 30px sans-serif';x.fillText('MADE TOGETHER',70,78);x.font='bold 59px sans-serif';x.fillText(theme.title,70,148);
  x.font='25px sans-serif';x.fillStyle='#fff0e4';x.fillText(group.name + '  •  ' + members.length + ' artists',70,1009);
  if (submission) {
    const i=new window.Image();
    i.onload=()=>{x.globalAlpha=.98;x.drawImage(i,115,390,840,570);x.globalAlpha=1;onDone(c.toDataURL('image/png'));};
    i.onerror=()=>onDone(c.toDataURL('image/png'));
    i.src=submission;
  }else onDone(c.toDataURL('image/png'));
}
function Reveal({ group, members, submission, theme, onDownload, onShare }) {
  const [image,setImage]=useState('');
  useEffect(()=>{let alive=true;composeImage(group,members,submission,theme,(src)=>{if(alive)setImage(src);});return()=>{alive=false;};},[group.id,submission,theme.title]);
  return <div className="reveal">
    <div className="reveal-text"><span className="tag tag-accent"><Sparkles size={13}/> FINAL REVEAL</span><h2>Better when<br/><em>we make it together.</em></h2><p>This is a composed preview of your group's work. The AI blending service isn't connected yet.</p><Stack ids={members} size={38}/><div className="reveal-actions"><Button icon={Download} onClick={()=>image && onDownload(image)}>Save artwork</Button><Button variant="outline" icon={Share2} onClick={()=>image && onShare(image)}>Share</Button></div></div>
    <div className="final-art">{image ? <img src={image} alt={'Composed drawing for ' + theme.title}/> : <div className="skeleton-art"/>}<span className="art-stamp">THE DAILY DROP <Star size={13} fill="currentColor"/></span></div>
  </div>;
}
const NAV=[
  {id:'home',label:'Home',icon:Home},{id:'groups',label:'My circles',icon:UsersRound},
  {id:'gallery',label:'The gallery',icon:Images},{id:'leaderboard',label:'Leaderboard',icon:Trophy}
];
function App() {
  const [db,setDb]=useState(getSaved);
  const [view,setView]=useState('home');
  const [modal,setModal]=useState('');
  const [now,setNow]=useState(()=>new Date());
  const [demo,setDemo]=useState('live');
  const [showDemo,setShowDemo]=useState(false);
  const [toastMessage,setToastMessage]=useState('');
  const [newGroupName,setNewGroupName]=useState('');
  const [newGroupType,setNewGroupType]=useState('group');
  const [chosen,setChosen]=useState(['maya','jules','noah']);
  const [joinCode,setJoinCode]=useState('');
  const [chatText,setChatText]=useState('');
  const [commentText,setCommentText]=useState('');
  const [selectedSketch,setSelectedSketch]=useState(null);
  const [seconds,setSeconds]=useState(420);
  const [paused,setPaused]=useState(false);
  const [showChat,setShowChat]=useState(false);
  const [notificationsOn,setNotificationsOn]=useState(false);
  const [customName,setCustomName]=useState(db.profile.name);
  const timerRef=useRef(null);
  const group=db.groups.find((g)=>g.id===db.activeGroup)||db.groups[0];
  const members=group.members;
  const theme=getTheme(now);
  const phase=demo==='live'?getRealPhase(now):demo;
  const prompt=theme.prompts[Math.max(0,members.indexOf('you'))%theme.prompts.length];
  const dayKey=getDayKey(now);
  const roundKey=group.id+'@'+dayKey;
  const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
  const previousKey=group.id+'@'+getDayKey(new Date(yesterday.getFullYear(),yesterday.getMonth(),yesterday.getDate(),12));
  const previousSketch=db.submissions[previousKey]?.you;
  const previousTheme=getTheme(new Date(yesterday.getFullYear(),yesterday.getMonth(),yesterday.getDate(),12));
  const savedSketch=db.submissions[roundKey]?.you;
  const peopleInGroup=members.map(getPerson);
  const vote=db.votes[roundKey];
  const userScores={you:74,maya:124,jules:106,noah:92,ava:83};
  const revealedVote=db.votes[previousKey];
  if (revealedVote) userScores[revealedVote]=(userScores[revealedVote]||0)+10;
  const ranking=peopleInGroup.map(p=>({...p,score:userScores[p.id]||0})).sort((a,b)=>b.score-a.score);
  const activeSketches=members.map((id,i)=>({id,person:getPerson(id),role:theme.prompts[i%theme.prompts.length],image:id==='you'?savedSketch:null,kind:id==='maya'?'sky':id==='jules'?'locals':id==='noah'?'transport':id==='ava'?'city':'city',sample:id!=='you'&&group.demo}));
  useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(db));}catch(_){}},[db]);
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id);},[]);
  useEffect(()=>{if(view!=='draw'||paused||seconds<=0)return;timerRef.current=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(timerRef.current);},[view,paused,seconds<=0]);
  useEffect(()=>{if(seconds===0)setPaused(true);},[seconds]);
  useEffect(()=>{
    if(!db.profile.notifications||!('Notification'in window)||Notification.permission!=='granted')return;
    const hour=now.getHours();const minute=now.getMinutes();
    if ((hour===7||hour===19)&&minute===0){
      const key='doodle-alert-'+getDayKey(now)+'-'+hour;
      if(sessionStorage.getItem(key))return;
      sessionStorage.setItem(key,'1');
      try {new Notification(hour===7?'Your daily doodle is ready':'Voting has opened!',{body:hour===7?'Your group has a new challenge.':'Check out what your friends made.'});}catch(_){}
    }
  },[now,db.profile.notifications]);
  useEffect(()=>{if(toastMessage){const t=setTimeout(()=>setToastMessage(''),3500);return()=>clearTimeout(t);}},[toastMessage]);
  const notify=(msg)=>setToastMessage(msg);
  const update=(fn)=>setDb(d=>fn(d));
  const switchView=(next)=>{if(view==='draw')setPaused(true);setView(next);window.scrollTo({top:0,behavior:'smooth'});};
  const selectGroup=(id)=>{update(d=>({...d,activeGroup:id}));switchView('home');};
  const createGroup=()=>{
    const name=newGroupName.trim();
    if(name.length<2)return notify('Give your circle a name first.');
    if(newGroupType==='duo'&&chosen.length!==1)return notify('Choose one friend for a one-on-one.');
    if(newGroupType==='group'&&chosen.length<1)return notify('Choose at least one friend.');
    const id='g'+Date.now();
    const g={id,name,code:freshCode(),members:['you',...chosen],type:newGroupType,demo:false,created:new Date().toISOString().slice(0,10)};
    update(d=>({...d,groups:[...d.groups,g],activeGroup:id,chats:{...d.chats,[id]:[]}}));
    setModal('');setNewGroupName('');switchView('home');notify('Your circle is ready. Invite your friends with the code.');
  };
  const joinGroup=()=>{
    const found=db.groups.find(g=>g.code.toUpperCase()===joinCode.trim().toUpperCase());
    if(found){selectGroup(found.id);setModal('');setJoinCode('');notify('Opened ' + found.name);return;}
    notify('This preview stores circles only on this device. Cross-device invites need a backend.');
  };
  const copyCode=async()=>{
    try{await navigator.clipboard.writeText(group.code);notify('Invite code copied.');}
    catch(_){notify('Code: '+group.code);}
  };
  const startDraw=()=>{setSeconds(s=>s||420);setPaused(false);switchView('draw');setPaused(false);};
  const submitDrawing=(dataUrl)=>{
    update(d=>({...d,submissions:{...d.submissions,[roundKey]:{...(d.submissions[roundKey]||{}),you:dataUrl}}}));
    setPaused(true);switchView('gallery');notify('Drawing saved! You can revisit it in the gallery.');
  };
  const voteFor=(id)=>{
    if(id==='you')return notify('You can’t vote for your own doodle.');
    if(phase!=='voting')return notify('Voting opens at 7 PM. Use demo preview to explore it now.');
    update(d=>({...d,votes:{...d.votes,[roundKey]:id}}));notify('Vote saved for '+getPerson(id).name+'!');
  };
  const sendChat=()=>{
    const text=chatText.trim();if(!text)return;
    update(d=>({...d,chats:{...d.chats,[group.id]:[...(d.chats[group.id]||[]),{id:'m'+Date.now(),by:'you',text,at:formatTime(new Date())}]}}));
    setChatText('');
  };
  const sendComment=()=>{
    const text=commentText.trim();if(!text||!selectedSketch)return;
    const key=roundKey+':'+selectedSketch.id;
    update(d=>({...d,comments:{...d.comments,[key]:[...(d.comments[key]||[]),{id:Date.now(),by:'you',text}]}}));
    setCommentText('');
  };
  const download=(src)=>{
    const a=document.createElement('a');a.href=src;a.download='our-daily-doodle.png';document.body.appendChild(a);a.click();a.remove();notify('Artwork saved.');
  };
  const share=async(src)=>{
    if(!navigator.share){download(src);return;}
    try{
      const res=await fetch(src);const blob=await res.blob();const file=new File([blob],'our-daily-doodle.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Our daily doodle'});}
      else await navigator.share({title:'Our daily doodle'});
    }catch(e){if(e.name!=='AbortError')download(src);}
  };
  const toggleNotification=async()=>{
    if(!('Notification'in window))return notify('This browser does not support notifications.');
    try{
      const permission=await Notification.requestPermission();
      if(permission==='granted'){update(d=>({...d,profile:{...d.profile,notifications:!d.profile.notifications}}));notify('Browser alerts only work while this prototype is open.');}
      else notify('Notifications are blocked in your browser.');
    }catch(_){notify('Notification permission unavailable.');}
  };
  const openSketch=(sketch)=>{setSelectedSketch(sketch);setCommentText('');setModal('sketch');};
  const groupChat=db.chats[group.id]||[];
  const tabs=<div className="nav-items">{NAV.map(item=><button key={item.id} className={'nav-link '+(view===item.id?'nav-active':'')} onClick={()=>switchView(item.id)}><item.icon size={21} strokeWidth={view===item.id?2.4:1.8}/><span>{item.label}</span>{view===item.id&&<i/>}</button>)}</div>;
  const groupMini=<button className="current-circle" onClick={()=>setModal('switch')}><div className="circle-badge">✳</div><div><strong>{group.name}</strong><span>{members.length} friends in here</span></div><ChevronRight size={17}/></button>;
  if(view==='draw')return <>
    <DrawingStudio group={group} prompt={prompt} initialSeconds={seconds} paused={paused} onPause={setPaused} onTime={setSeconds} onExit={()=>switchView('home')} onSubmit={submitDrawing} toast={notify}/>
    {toastMessage&&<div role="status" className="toast"><Info size={17}/>{toastMessage}</div>}
  </>;
  return <div className="app-shell">
    <div className="device-status" aria-hidden="true"><span>9:41</span><span className="device-status-icons">●● <span className="device-battery">▰</span></span></div>
    <aside className="sidebar">
      <button className="logo" onClick={()=>switchView('home')}>doodl<span>✳</span><b>.</b></button>
      <div className="sidebar-label">YOUR SPACE</div>{tabs}
      <div className="sidebar-gap"/>
      <div className="sidebar-label">YOUR CIRCLE</div>{groupMini}
      <button className="sidebar-add" onClick={()=>setModal('new')}><Plus size={16}/> New circle</button>
      <div className="sidebar-bottom"><div className="mini-avatar"><Avatar id="you" size={39}/></div><div className="sidebar-me"><strong>{db.profile.name}</strong><span>your creative corner</span></div><button className="icon-button" onClick={()=>switchView('profile')} title="Settings"><Settings2 size={20}/></button></div>
    </aside>
    <div className="page-area">
      <header className="topbar">
        <button className="mobile-logo" onClick={()=>switchView('home')}>doodl<span>✳</span><b>.</b></button>
        <div className="topbar-titles"><span>THE DAILY DROP</span><strong>{view==='home'?'Home':view==='groups'?'Your circles':view==='gallery'?'The gallery':view==='leaderboard'?'Leaderboard':'Your space'}</strong></div>
        <div className="topbar-right"><span className="day-badge"><span className="live-dot"/> {getRealPhase(now)==='drawing'?'Drawing window':'Voting window'}</span><button className="icon-button notification-btn" title="Notifications" onClick={()=>setModal('notifications')}><Bell size={21}/><span className="unread-dot"/></button><button className="user-pill" onClick={()=>switchView('profile')}><Avatar id="you" size={33}/></button></div>
      </header>
      <main className="content">
        <div className={'demo-strip '+(showDemo?'demo-open':'')}>
          <button className="demo-toggle" onClick={()=>setShowDemo(v=>!v)} aria-expanded={showDemo}>
            <span><Sparkles size={13}/> Interactive prototype <span className="demo-current">{demo==='live'?'Live':demo==='drawing'?'Drawing':demo==='voting'?'Voting':'Reveal'}</span></span><ChevronRight size={15}/>
          </button>
          {showDemo&&<div className="demo-options">{[{id:'live',label:'Live'},{id:'drawing',label:'Draw'},{id:'voting',label:'Vote'},{id:'reveal',label:'Reveal'}].map(item=><button key={item.id} className={demo===item.id?'selected':''} onClick={()=>{setDemo(item.id);setShowDemo(false);}}>{item.label}</button>)}</div>}
        </div>
        {view==='home'&&<>
          <div className="welcome-row"><div><div className="eyebrow">{formatDate(now).toUpperCase()}</div><h1>Make something<br/><em>weird today.</em></h1><p>Your daily dose of drawing with friends.</p></div><div className="welcome-side"><div className="floating-asterisk">✳</div></div></div>
          <div className="mobile-stories" aria-label="Your friend circles">
            <button className="story-item" onClick={()=>setModal('new')}><span className="story-ring story-add"><Plus size={25}/></span><span>New circle</span></button>
            {db.groups.map((circle, i)=><button key={circle.id} className={'story-item '+(circle.id===group.id?'story-selected':'')} onClick={()=>selectGroup(circle.id)}>
              <span className="story-ring"><span className={'story-avatar story-avatar-'+(i%4)}>{circle.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}</span></span>
              <span>{circle.name.length>12?circle.name.slice(0,10)+'…':circle.name}</span>
            </button>)}
            <button className="story-item" onClick={()=>setModal('join')}><span className="story-ring story-join"><UserRoundPlus size={21}/></span><span>Join circle</span></button>
          </div>
          <div className="home-meta"><span>THE DAILY DROP <span className="home-meta-dot">✳</span></span><button onClick={()=>setModal('switch')}>{group.name} <ChevronRight size={15}/></button></div>
          <div className="hero-card">
            <div className="hero-copy"><div className="hero-badges"><span className="tag tag-dark"><span className="pulse-dot"/> TODAY'S DROP</span><span className="tag tag-dark">{theme.label}</span></div><div className="hero-overline">YOUR DAILY CREATIVE CHALLENGE</div><h2>{theme.title}<span>✳</span></h2><p>{theme.subtitle}</p><div className="hero-action"><Button onClick={startDraw} icon={ArrowRight}>{savedSketch?'Draw again':'Start doodling'}</Button><span><Clock3 size={15}/> 7 AM – 7 PM</span></div></div>
            <div className="hero-image"><Illustration variant="city"/><span className="hero-art-credit">IMAGINE THE IMPOSSIBLE / 001</span></div>
          </div>
          <div className="schedule"><div className={'schedule-step '+(phase==='drawing'?'step-active':'')}><span className="schedule-icon"><Pencil size={19}/></span><div><strong>01 / Draw</strong><span>7 AM – 7 PM</span></div></div><div className="schedule-line"/><div className={'schedule-step '+(phase==='voting'?'step-active':'')}><span className="schedule-icon"><Heart size={19}/></span><div><strong>02 / Vote</strong><span>7 PM – 7 AM</span></div></div><div className="schedule-line"/><div className={'schedule-step '+(phase==='reveal'?'step-active':'')}><span className="schedule-icon"><Sparkles size={19}/></span><div><strong>03 / Reveal</strong><span>Next day, 7 AM</span></div></div></div>
          {phase==='reveal'?<Reveal group={group} members={members} submission={savedSketch} theme={theme} onDownload={download} onShare={share}/>:<div className="home-columns">
            <div className="daily-prompt"><div className="section-label"><span className="mono">01 / YOUR ASSIGNMENT</span><span className="privacy"><LockKeyhole size={12}/> JUST FOR YOU</span></div><span className="prompt-asterisk">✳</span><span className="prompt-caption">YOU GOT THE</span><h3>{prompt.label}<span>.</span></h3><p>{prompt.detail}</p><Button onClick={startDraw} icon={ArrowRight} variant="white">{savedSketch?'Edit your drawing':'Let’s draw'}</Button></div>
            <div className="crew-card"><div className="section-label"><span className="mono">02 / YOUR CREW</span><button onClick={()=>setShowChat(true)}>Open chat <ArrowRight size={15}/></button></div><div className="crew-list">{members.map((id,i)=><div key={id} className="crew-person"><Avatar id={id} size={42}/><div><strong>{id==='you'?db.profile.name:getPerson(id).name}</strong><span>{theme.prompts[i%theme.prompts.length].label}</span></div><span className={'person-status '+(id==='you'&&savedSketch?'complete':'')}>{id==='you'?(savedSketch?'Done':'You'):(group.demo?'Sketching':'Invited')}</span></div>)}</div><button className="crew-invite" onClick={()=>setModal('invite')}><UserRoundPlus size={18}/> Invite someone <ArrowRight size={17}/></button></div>
          </div>}
          <div className="section-header"><div><div className="eyebrow">PULL UP A SEAT</div><h2>What your friends are making<span className="accent-period">.</span></h2></div><button onClick={()=>switchView('gallery')} className="text-link">See all sketches <ArrowRight size={17}/></button></div>
          <div className="preview-gallery">{activeSketches.filter(a=>a.id!=='you'||a.image).slice(0,3).map((art,i)=><button key={art.id} className="art-preview" onClick={()=>openSketch(art)}><div className={'art-cover tone-'+i}>{art.image?<img src={art.image} alt="Your doodle"/>:<Illustration variant={art.kind}/>}<span className="art-cover-icon"><MessageCircle size={17}/></span></div><div className="art-preview-meta"><Avatar id={art.id} size={32}/><div><strong>{art.person.name}</strong><span>{art.role.label}</span></div><ChevronRight size={17}/></div></button>)}</div>
          {(previousSketch||group.demo)&&<><div className="section-header"><div><div className="eyebrow">THE MORNING AFTER</div><h2>Yesterday's group artwork<span className="accent-period">.</span></h2></div><span className="count-chip">Unlocked at 7 AM</span></div><Reveal group={group} members={members} submission={previousSketch} theme={previousTheme} onDownload={download} onShare={share}/></>}
          {group.demo&&<div className="demo-note"><Info size={16}/><span>The other friends and their sketches are sample data for the prototype. Changes are saved in this browser only.</span></div>}
        </>}
        {view==='groups'&&<>
          <div className="page-heading"><span className="eyebrow">YOUR PEOPLE / YOUR RULES</span><h1>Good ideas<br/><em>start together.</em></h1><p>Create a private circle or hang out one-on-one. Invite friends using a code, never a public search.</p><div className="heading-actions"><Button onClick={()=>setModal('new')} icon={Plus}>Create a circle</Button><Button onClick={()=>setModal('join')} variant="outline" icon={ArrowRight}>Join with code</Button></div></div>
          <div className="section-header"><h2>Your circles<span className="accent-period">.</span></h2><span className="count-chip">{db.groups.length} total</span></div>
          <div className="group-grid">{db.groups.map(g=><button key={g.id} className={'group-tile '+(g.id===group.id?'active':'')} onClick={()=>selectGroup(g.id)}><div className="tile-graphic"><span>✳</span><div className="tile-bubbles"><i/><i/><i/></div></div><div className="tile-content"><div className="group-type"><LockKeyhole size={13}/> {g.type==='duo'?'ONE-ON-ONE':'PRIVATE CIRCLE'}</div><h3>{g.name}</h3><Stack ids={g.members} size={34}/><div className="tile-foot"><span>{g.members.length} members</span><span>Open circle <ArrowRight size={15}/></span></div></div></button>)}</div>
          <div className="group-tools"><div><span className="eyebrow">YOUR INVITE CODE</span><h3>{group.code}</h3><p>Only people with your code can join once a shared backend is connected.</p></div><Button variant="outline" onClick={copyCode} icon={Copy}>Copy code</Button></div>
          <div className="chat-section"><div className="section-header"><div><div className="eyebrow">GROUP CONVERSATION</div><h2>{group.name} chat<span className="accent-period">.</span></h2></div></div><Chat messages={groupChat} text={chatText} onText={setChatText} onSend={sendChat} currentName={db.profile.name}/></div>
        </>}
        {view==='gallery'&&<>
          <div className="page-heading compact"><span className="eyebrow">THE GROUP GALLERY</span><h1>Show us<br/><em>what you made.</em></h1><p>Watch everyone's ideas come to life. Leave a note on a sketch, or vote during the evening window.</p></div>
          <div className="gallery-summary"><div><span className="tag tag-accent">{phase==='voting'?'VOTING OPEN':phase==='reveal'?'REVEAL TIME':'DRAWING IN PROGRESS'}</span><h3>{theme.title}</h3><p>{group.name} · {members.length} artists</p></div><div className="gallery-countdown"><Clock3 size={20}/><span>{phase==='drawing'?'Voting begins in':'Next reveal in'}<b>{nextTime(now,phase==='drawing'?19:7)}</b></span></div></div>
          <div className="section-header"><h2>Today's doodles<span className="accent-period">.</span></h2><span className="count-chip">{activeSketches.filter(a=>a.sample||a.image).length} / {members.length} in</span></div>
          <div className="gallery-grid">{activeSketches.map((art,i)=><article key={art.id} className="gallery-tile">
            <button className={'gallery-art tone-'+i} onClick={()=>art.image||art.sample?openSketch(art):art.id==='you'?startDraw():notify('Waiting for '+art.person.name+' to draw.')}>{art.image?<img src={art.image} alt={'Drawing by '+art.person.name}/>:art.sample?<Illustration variant={art.kind}/>:<div className="waiting-art"><Pencil size={30}/><span>{art.id==='you'?'Your canvas is waiting':'Not submitted yet'}</span></div>}
              {(art.image||art.sample)&&<span className="gallery-overlay">View doodle <ArrowRight size={15}/></span>}</button>
            <div className="gallery-info"><div className="gallery-identity"><Avatar id={art.id} size={37}/><div><strong>{art.id==='you'?db.profile.name:art.person.name}</strong><span>{art.role.label}</span></div></div>{phase==='voting'&&art.id!=='you'&&(art.image||art.sample)?<button className={'vote-button '+(vote===art.id?'voted':'')} onClick={()=>voteFor(art.id)}><Heart size={17} fill={vote===art.id?'currentColor':'none'}/>{vote===art.id?'Voted':'Vote'}</button>:<button className="round-icon" onClick={()=>openSketch(art)} disabled={!art.image&&!art.sample}><MessageCircle size={18}/></button>}</div>
          </article>)}</div>
          {phase==='drawing'&&<div className="centered-notice"><Clock3 size={18}/><span>Voting opens at 7 PM. You can preview the voting state using Prototype Mode.</span></div>}
          {phase==='voting'&&<div className="centered-notice"><Heart size={18}/><span>One vote per person, per circle. Voting closes at 7 AM.</span></div>}
          {phase==='reveal'&&<Reveal group={group} members={members} submission={savedSketch} theme={theme} onDownload={download} onShare={share}/>}
        </>}
        {view==='leaderboard'&&<>
          <div className="page-heading compact"><span className="eyebrow">BRAGGING RIGHTS</span><h1>A little<br/><em>friendly rivalry.</em></h1><p>Who's been bringing the creative chaos? Points show up after the morning reveal.</p></div>
          <div className="leader-top"><div><span className="eyebrow">THE ORBIT CLUB / ALL TIME</span><h2>Your circle's<br/>creative legends.</h2></div><Trophy size={68} strokeWidth={1.1}/></div>
          <div className="podium">{ranking.slice(0,3).map((person,i)=><div key={person.id} className={'podium-card podium-'+i}><div className="rank-medal">{i===0?'01':i===1?'02':'03'}</div><Avatar id={person.id} size={65}/><strong>{person.id==='you'?db.profile.name:person.name}</strong><span>{person.score} pts</span></div>)}</div>
          <div className="ranking-list"><div className="ranking-header"><span>RANKING</span><span>POINTS</span></div>{ranking.map((person,i)=><div key={person.id} className="rank-row"><span className="rank-index">{String(i+1).padStart(2,'0')}</span><Avatar id={person.id} size={44}/><div className="rank-name"><strong>{person.id==='you'?db.profile.name:person.name}</strong><span>{person.handle||'@artist'}</span></div><span className="rank-points">{person.score} <small>pts</small></span></div>)}</div>
          <div className="centered-notice"><Info size={18}/><span>Scores are illustrative until accounts and a shared voting database are connected.</span></div>
        </>}
        {view==='profile'&&<>
          <div className="page-heading compact"><span className="eyebrow">THE PERSON BEHIND THE PEN</span><h1>Your space.<br/><em>Your rules.</em></h1><p>Make this corner yours. It's a prototype, so settings are stored on this device.</p></div>
          <div className="settings-card"><div className="settings-profile"><Avatar id="you" size={74}/><div><h3>{db.profile.name}</h3><p>Here for the doodles</p></div></div><label className="field-label" htmlFor="profile-name">Display name</label><div className="field-row"><input id="profile-name" className="text-input" maxLength="25" value={customName} onChange={e=>setCustomName(e.target.value)}/><Button onClick={()=>{update(d=>({...d,profile:{...d.profile,name:customName.trim()||'You'}}));notify('Name updated.');}}>Save</Button></div><div className="setting-row"><div><strong>Browser notifications</strong><p>Ask permission for 7 AM prompts and 7 PM voting alerts. Alerts only fire while this browser tab is open.</p></div><button className={'switch '+(db.profile.notifications?'on':'')} aria-label="Toggle browser notifications" aria-pressed={db.profile.notifications} onClick={toggleNotification}><i/></button></div><div className="setting-row"><div><strong>Preview information</strong><p>All data lives in this browser. Groups are not synced across devices and AI image stitching is not connected.</p></div><ShieldCheck size={23}/></div></div>
          <div className="danger-card"><h3>Reset this preview</h3><p>Remove your doodles, messages, created circles, and votes from this browser.</p><button onClick={()=>setModal('reset')}>Reset all demo data <RotateCcw size={16}/></button></div>
        </>}
      </main>
    </div>
    <nav className="mobile-nav" aria-label="Main navigation">
      {NAV.slice(0,2).map(item=><button key={item.id} className={view===item.id?'selected':''} onClick={()=>switchView(item.id)}><item.icon size={22} strokeWidth={view===item.id?2.4:1.85}/><span>{item.label==='My circles'?'Circles':item.label}</span></button>)}
      <button className="nav-create" aria-label="Open drawing studio" onClick={startDraw}><span className="nav-create-icon"><Pencil size={22}/></span><span>Draw</span></button>
      {NAV.slice(2).map(item=><button key={item.id} className={view===item.id?'selected':''} onClick={()=>switchView(item.id)}><item.icon size={22} strokeWidth={view===item.id?2.4:1.85}/><span>{item.label==='The gallery'?'Gallery':'Ranks'}</span></button>)}
    </nav>
    <button className="floating-chat" onClick={()=>setShowChat(true)} title="Open group chat"><MessageCircle size={22}/><span>Chat</span></button>
    {showChat&&<div className="chat-drawer-wrap" onPointerDown={e=>{if(e.target===e.currentTarget)setShowChat(false);}}><section className="chat-drawer"><div className="drawer-head"><div><span className="eyebrow">YOUR CIRCLE</span><h2>{group.name}</h2></div><button className="icon-button" onClick={()=>setShowChat(false)}><X size={22}/></button></div><Chat messages={groupChat} text={chatText} onText={setChatText} onSend={sendChat} currentName={db.profile.name}/></section></div>}
    {modal==='new'&&<Modal title="Start a circle" subtitle="The best things happen with your people." onClose={()=>setModal('')}>
      <div className="modal-content"><div className="segmented">{[{id:'group',label:'Group circle'},{id:'duo',label:'One-on-one'}].map(t=><button key={t.id} className={newGroupType===t.id?'active':''} onClick={()=>{setNewGroupType(t.id);setChosen(t.id==='duo'?['maya']:['maya','jules','noah']);}}>{t.label}</button>)}</div>
      <label className="field-label" htmlFor="circle-name">CIRCLE NAME</label><input className="text-input" id="circle-name" placeholder="e.g. The After Hours" maxLength="40" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)}/>
      <span className="field-label">INVITE YOUR FRIENDS</span><div className="friends-picker">{PEOPLE.filter(p=>p.id!=='you').map(p=><button key={p.id} className={'friend-choice '+(chosen.includes(p.id)?'chosen':'')} onClick={()=>setChosen(list=>newGroupType==='duo'?[p.id]:list.includes(p.id)?list.filter(x=>x!==p.id):[...list,p.id])}><Avatar id={p.id} size={36}/><span>{p.name}</span>{chosen.includes(p.id)?<CheckCircle2 size={20}/>:<Plus size={19}/>}</button>)}</div><div className="modal-foot"><p>Private by default. Invite codes are demo-only for now.</p><Button onClick={createGroup} icon={ArrowRight}>Create circle</Button></div></div>
    </Modal>}
    {modal==='join'&&<Modal title="Join a circle" subtitle="Got a code from a friend?" onClose={()=>setModal('')}><div className="modal-content"><label className="field-label" htmlFor="join-code">INVITE CODE</label><input className="text-input code-input" id="join-code" value={joinCode} maxLength="12" onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="ENTER CODE"/><div className="modal-foot"><p>Codes only work for circles created in this browser until a shared backend is added.</p><Button onClick={joinGroup} icon={ArrowRight}>Join circle</Button></div></div></Modal>}
    {modal==='switch'&&<Modal title="Switch circles" subtitle="Pick who you're making things with." onClose={()=>setModal('')}><div className="modal-content circle-picker">{db.groups.map(g=><button key={g.id} className="circle-choice" onClick={()=>{selectGroup(g.id);setModal('');}}><div className="circle-badge">✳</div><div><strong>{g.name}</strong><span>{g.members.length} friends · {g.type==='duo'?'one-on-one':'group circle'}</span></div>{g.id===group.id?<CheckCircle2 size={20}/>:<ChevronRight size={20}/>}</button>)}<button className="circle-choice add-choice" onClick={()=>setModal('new')}><div className="circle-badge"><Plus size={21}/></div><strong>Create a new circle</strong></button></div></Modal>}
    {modal==='invite'&&<Modal title="Invite your friends" subtitle={'Only people with the code can join '+group.name+'.'} onClose={()=>setModal('')}><div className="modal-content invite-box"><div className="invite-symbol">✳</div><span className="eyebrow">YOUR PRIVATE CIRCLE CODE</span><strong>{group.code}</strong><Button onClick={copyCode} icon={Copy}>Copy invite code</Button><p>In this prototype codes work only in the current browser. Real invitations require a shared backend.</p></div></Modal>}
    {modal==='notifications'&&<Modal title="Heads up" subtitle="Here's what is happening with your crew." onClose={()=>setModal('')}><div className="modal-content notification-list"><div className="notification-line"><div className="notification-symbol"><Pencil size={21}/></div><div><strong>Your daily prompt is ready</strong><p>{theme.title} · Drawing closes at 7 PM.</p></div></div><div className="notification-line"><div className="notification-symbol alt"><Heart size={21}/></div><div><strong>Vote on your favorites</strong><p>Voting runs from 7 PM to 7 AM every day.</p></div></div><Button variant="outline" onClick={()=>{setModal('');switchView('gallery');}}>Open today's gallery <ArrowRight size={16}/></Button></div></Modal>}
    {modal==='sketch'&&selectedSketch&&<Modal large title={selectedSketch.person.name+'’s sketch'} subtitle={selectedSketch.role.label} onClose={()=>setModal('')}>
      <div className="sketch-modal-layout"><div className="sketch-modal-art">{selectedSketch.image?<img src={selectedSketch.image} alt="Selected doodle"/>:<Illustration variant={selectedSketch.kind}/>}</div><div className="sketch-comments"><div className="comments-heading"><MessageCircle size={18}/> Comments</div><div className="comment-list">{(db.comments[roundKey+':'+selectedSketch.id]||[]).length===0?<p className="no-comments">No comments yet. Be the first to say something nice.</p>:(db.comments[roundKey+':'+selectedSketch.id]||[]).map(c=><div className="comment" key={c.id}><Avatar id={c.by} size={29}/><div><strong>{c.by==='you'?db.profile.name:getPerson(c.by).name}</strong><p>{c.text}</p></div></div>)}</div><form className="comment-form" onSubmit={e=>{e.preventDefault();sendComment();}}><input className="text-input" value={commentText} onChange={e=>setCommentText(e.target.value)} maxLength={200} placeholder="Leave a comment..."/><button aria-label="Send comment" type="submit"><Send size={19}/></button></form>{selectedSketch.id!=='you'&&phase==='voting'&&<Button variant={vote===selectedSketch.id?'white':'primary'} onClick={()=>voteFor(selectedSketch.id)} icon={Heart}>{vote===selectedSketch.id?'Voted for this':'Vote for this'}</Button>}</div></div>
    </Modal>}
    {modal==='reset'&&<Modal title="Reset your preview?" subtitle="This can't be undone." onClose={()=>setModal('')}><div className="modal-content"><p className="reset-copy">Your local sketches, circles, votes, chat, and settings will be removed from this browser.</p><div className="modal-foot"><Button variant="outline" onClick={()=>setModal('')}>Cancel</Button><Button onClick={()=>{setDb(INITIAL);setModal('');switchView('home');notify('Preview reset.');}}>Reset everything</Button></div></div></Modal>}
    {toastMessage&&<div role="status" className="toast"><Info size={17}/>{toastMessage}</div>}
  </div>;
}
function Chat({messages,text,onText,onSend,currentName}) {
  const end=useRef(null);
  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[messages.length]);
  return <div className="chat-body"><div className="chat-messages">{messages.length===0&&<div className="chat-empty"><MessageCircle size={32}/><strong>Start the conversation</strong><span>Your sketches aren't the only thing worth sharing.</span></div>}{messages.map(m=><div className={'chat-line '+(m.by==='you'?'me':'')} key={m.id}>{m.by!=='you'&&<Avatar id={m.by} size={31}/>}<div><div className="bubble-author">{m.by==='you'?currentName:getPerson(m.by).name} <span>{m.at}</span></div><div className="chat-bubble">{m.text}</div></div></div>)}<div ref={end}/></div><form className="chat-compose" onSubmit={e=>{e.preventDefault();onSend();}}><input value={text} maxLength="400" onChange={e=>onText(e.target.value)} aria-label="Message" placeholder="Say something..."/><button type="submit" disabled={!text.trim()} aria-label="Send message"><Send size={19}/></button></form></div>;
}
export default App;
