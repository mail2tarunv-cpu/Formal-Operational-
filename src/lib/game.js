// Pure presentation helpers. Database RLS and RPCs remain the authority.
export const gameMode=playerCount=>playerCount===1?'solo':playerCount===2?'duo':'trio';
export function canShareRound(round){
 const submissions=round?.submissions||[];
 const approvals=round?.consents||[];
 return submissions.length>0&&submissions.every(s=>approvals.some(c=>c.user_id===s.user_id&&c.approved===true));
}
export const contributed=(round,userId)=>Boolean(round?.submissions?.some(s=>s.user_id===userId));
export const isGuestName=name=>/^Artist [0-9a-f]{6}$/i.test(name||'');
