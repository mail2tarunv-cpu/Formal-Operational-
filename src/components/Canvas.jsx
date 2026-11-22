import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock3, Eraser, Eye, Highlighter, Pencil, Pause, Play, RotateCcw, RotateCw, Trash2, X } from 'lucide-react';
const colors=['#201d23','#ffffff','#ec706c','#ecab52','#ece26b','#6bbfa7','#759bd3','#a58bd6'];
const EMPTY=()=>({strokes:[],redo:[],seconds:420,paused:true,started:false,size:6,color:colors[0],tool:'pen'});
export default function Canvas({ roundId,userId,prompt,theme,existing,onClose,onSubmit,onMessage }) {
 const [state,setState]=useState(()=>{
  try{const data=JSON.parse(sessionStorage.getItem('doodl-canvas-'+roundId+'-'+userId));return data?{...EMPTY(),...data,paused:true}:EMPTY();}
  catch{return EMPTY();}
 });
 const [showPrompt,setShowPrompt]=useState(false);
 const [busy,setBusy]=useState(false);
 const node=useRef(null),active=useRef(null),raf=useRef(0);
 const key='doodl-canvas-'+roundId+'-'+userId;
 const commit=useCallback((patch)=>setState(s=>({...s,...patch})),[]);
 const drawAll=useCallback(()=>{
  const c=node.current;if(!c)return;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle='#faf8f5';ctx.fillRect(0,0,c.width,c.height);
  ctx.save();
  for(const stroke of [...state.strokes,...(active.current?[active.current]:[])]) {
   if(!stroke.points.length)continue;
   ctx.globalAlpha=stroke.tool==='marker'?.45:1;
   ctx.strokeStyle=stroke.tool==='eraser'?'#faf8f5':stroke.color;
   ctx.fillStyle=ctx.strokeStyle;
   ctx.lineWidth=stroke.tool==='eraser'?28:stroke.tool==='marker'?stroke.size*3:stroke.size;
   ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
   ctx.moveTo(stroke.points[0][0],stroke.points[0][1]);
   if(stroke.points.length===1){ctx.lineTo(stroke.points[0][0]+.01,stroke.points[0][1]+.01);}
   else stroke.points.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
   ctx.stroke();
  }
  ctx.restore();
 },[state.strokes]);
 useEffect(()=>{drawAll()},[drawAll]);
 useEffect(()=>{sessionStorage.setItem(key,JSON.stringify({...state,paused:true}))},[state,key]);
 useEffect(()=>{
  if(!state.started||state.paused||state.seconds<=0)return;
  const id=setInterval(()=>setState(s=>({...s,seconds:Math.max(0,s.seconds-1),paused:s.seconds<=1})),1000);
  return()=>clearInterval(id);
 },[state.started,state.paused,state.seconds<=0]);
 useEffect(()=>{
  const handler=()=>{if(document.hidden)setState(s=>({...s,paused:true}))};
  document.addEventListener('visibilitychange',handler);return()=>document.removeEventListener('visibilitychange',handler);
 },[]);
 const point=e=>{
  const rect=node.current.getBoundingClientRect();
  return [Math.max(0,Math.min(900,(e.clientX-rect.left)*900/rect.width)),Math.max(0,Math.min(900,(e.clientY-rect.top)*900/rect.height))];
 };
 const down=e=>{
  if(!state.started||state.paused||state.seconds===0||busy)return;
  e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
  active.current={tool:state.tool,color:state.color,size:state.size,points:[point(e)]};
  drawAll();
 };
 const move=e=>{
  if(!active.current)return;
  e.preventDefault();active.current.points.push(point(e));
  if(raf.current)cancelAnimationFrame(raf.current);
  raf.current=requestAnimationFrame(drawAll);
 };
 const finish=()=>{
  if(!active.current)return;
  const stroke=active.current;active.current=null;
  setState(s=>({...s,strokes:[...s.strokes,stroke],redo:[]}));
 };
 const undo=()=>setState(s=>s.strokes.length?{...s,strokes:s.strokes.slice(0,-1),redo:[...s.redo,s.strokes.at(-1)]}:s);
 const redo=()=>setState(s=>s.redo.length?{...s,strokes:[...s.strokes,s.redo.at(-1)],redo:s.redo.slice(0,-1)}:s);
 const submit=async()=>{
  if(!state.strokes.length)return onMessage('Draw something first.');
  if(state.seconds===0){onMessage('Your drawing time has ended.');}
  setBusy(true);commit({paused:true});
  try{
   const blob=await new Promise((resolve,reject)=>node.current.toBlob(b=>b?resolve(b):reject(new Error('Could not export drawing')),'image/png'));
   await onSubmit(blob);
   sessionStorage.removeItem(key);
  }catch(err){onMessage(err.message||'Upload failed.');setBusy(false);}
 };
 const time=String(Math.floor(state.seconds/60)).padStart(2,'0')+':'+String(state.seconds%60).padStart(2,'0');
 return <section className="drawing-app">
  <header className="draw-head">
   <button onClick={onClose} className="draw-back" aria-label="Exit studio"><ArrowLeft size={21}/></button>
   <span className="draw-head-center">DRAWING STUDIO</span>
   <button className="draw-prompt-link" onClick={()=>setShowPrompt(true)}><Eye size={17}/> Prompt</button>
  </header>
  <div className="draw-main">
   <div className="draw-intro"><div className="eyebrow">{theme.name} / YOUR PART</div><h1>{prompt.label}</h1><p>{prompt.description}</p></div>
   <div className="draw-meta"><span><Pencil size={15}/> Your canvas</span><button className="draw-clock" onClick={()=>commit({paused:!state.paused})} disabled={!state.started||state.seconds===0}>
    <Clock3 size={17}/><strong>{time}</strong>{state.paused?<Play size={17} fill="currentColor"/>:<Pause size={16} fill="currentColor"/>}
   </button></div>
   <div className="draw-canvas">
    <canvas ref={node} width={900} height={900} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label="Drawing canvas" style={{touchAction:'none'}} />
    {(!state.started||state.paused)&&<div className="draw-screen-cover">
      <div className="draw-cover-icon">{state.started?<Pause size={29}/>:<Pencil size={28}/>}</div>
      <h2>{state.started?'Paused':'Make your mark.'}</h2>
      <p>{state.started?'Your time is paused.':'Pick up a pen and create your part.'}</p>
      {!state.started&&<div className="duration-choices" aria-label="Choose drawing time">
       {[5,7,10].map(n=><button className={state.seconds===n*60?'active':''} key={n} onClick={()=>commit({seconds:n*60})}>{n} min</button>)}
      </div>}
      <button className="cta" onClick={()=>commit({paused:false,started:true})}>{state.started?'Resume drawing':'Start drawing'} <Play size={17} fill="currentColor"/></button>
     </div>}
   </div>
   <div className="draw-tools" aria-label="Drawing tools">
    <div className="tools-top">
     <div className="draw-tool-mode">
       {[{id:'pen',icon:Pencil,label:'Pen'},{id:'marker',icon:Highlighter,label:'Marker'},{id:'eraser',icon:Eraser,label:'Eraser'}].map(o=><button key={o.id} className={state.tool===o.id?'active':''} aria-label={o.label} aria-pressed={state.tool===o.id} onClick={()=>commit({tool:o.id})}><o.icon size={20}/></button>)}
     </div>
     <div className="draw-tool-mode"><button onClick={undo} disabled={!state.strokes.length} aria-label="Undo"><RotateCcw size={20}/></button><button onClick={redo} disabled={!state.redo.length} aria-label="Redo"><RotateCw size={20}/></button><button onClick={()=>{if(window.confirm('Clear your entire canvas?'))commit({strokes:[],redo:[]})}} disabled={!state.strokes.length} aria-label="Clear canvas"><Trash2 size={18}/></button></div>
    </div>
    <div className="draw-colors">{colors.map(color=><button key={color} aria-label={'Use color '+color} className={state.color===color?'active':''} onClick={()=>commit({color,tool:state.tool==='eraser'?'pen':state.tool})} style={{backgroundColor:color}}/>)}</div>
    <div className="size-row"><span>Brush size</span><input type="range" min="2" max="24" value={state.size} onChange={e=>commit({size:Number(e.target.value)})} aria-label="Brush size"/><span>{state.size}px</span></div>
   </div>
   {existing&&<p className="draw-note">Submitting again will replace your previous drawing for this round.</p>}
   <button className="draw-submit" onClick={submit} disabled={!state.strokes.length||busy}>{busy?'Uploading...':'Submit drawing'} <Check size={18}/></button>
   <p className="draw-footnote">Only members of your circle can see your drawing.</p>
  </div>
  {showPrompt&&<div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&setShowPrompt(false)}><div className="sheet"><div className="sheet-head"><h2>Your part</h2><button onClick={()=>setShowPrompt(false)}><X size={20}/></button></div><span className="eyebrow">{theme.name}</span><h3>{prompt.label}</h3><p>{prompt.description}</p><button className="cta" onClick={()=>setShowPrompt(false)}>Keep drawing</button></div></div>}
 </section>;
}
