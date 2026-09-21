// games/missile.js — Nuclear Defence.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function missile(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  let cities=[0,1,2,3,4,5].map(i=>({x:60+i*(W-120)/5,alive:true}));
  let enemies=[],shots=[],booms=[],t=0,rate=1.6,elapsed=0;
  return {
    pointer(x,y,type){if(type!=='down'||y>H-40)return;
      shots.push({x:W/2,y:H-24,tx:x,ty:y,p:0});beep(520,.05);},
    tick(dt){if(!isOver()){elapsed+=dt;t+=dt;rate=Math.max(.5,1.6-elapsed*.02);
      if(t>rate){t=0;const c=cities.filter(c=>c.alive);if(c.length){const tgt=c[Math.floor(R()*c.length)];
        enemies.push({x:R()*W,y:0,tx:tgt.x,ty:H-18,p:0,tgt});}}
      enemies.forEach(e=>{e.p+=dt*(.06+elapsed*.001);});
      shots.forEach(s=>{s.p+=dt*1.6;if(s.p>=1){booms.push({x:s.tx,y:s.ty,r:4,grow:1});beep(300,.1)}});
      shots=shots.filter(s=>s.p<1);
      booms.forEach(b=>{if(b.grow)b.r+=dt*90;if(b.r>44)b.grow=0;if(!b.grow)b.r-=dt*60;});
      booms=booms.filter(b=>b.r>2);
      enemies=enemies.filter(e=>{const ex=e.x+(e.tx-e.x)*e.p,ey=e.y+(e.ty-e.y)*e.p;
        for(const b of booms)if((ex-b.x)**2+(ey-b.y)**2<b.r*b.r){addScore(25);beep(900,.05);return false}
        if(e.p>=1){e.tgt.alive=false;booms.push({x:e.tx,y:e.ty,r:6,grow:1});beep(120,.25);
          if(!cities.some(c=>c.alive))gameOver();return false}
        return true});}
      clear(ctx,W,H,T);
      ctx.fillStyle=T.soft;ctx.fillRect(0,H-16,W,16);
      cities.forEach(c=>{ctx.fillStyle=c.alive?T.ink:T.line;ctx.fillRect(c.x-12,H-30,24,14);});
      ctx.fillStyle=T.accent;ctx.fillRect(W/2-14,H-34,28,18);
      ctx.strokeStyle=T.muted;enemies.forEach(e=>{const ex=e.x+(e.tx-e.x)*e.p,ey=e.y+(e.ty-e.y)*e.p;
        ctx.globalAlpha=.4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=1;
        ctx.fillStyle=T.ink;ctx.fillRect(ex-2,ey-2,4,4);});
      ctx.strokeStyle=T.accent;shots.forEach(s=>{const sx=s.x+(s.tx-s.x)*s.p,sy=s.y+(s.ty-s.y)*s.p;
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(sx,sy);ctx.stroke();});
      booms.forEach(b=>{ctx.fillStyle=T.accentSoft;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();
        ctx.strokeStyle=T.accent;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.stroke();});
      ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillText('click to intercept · defend the cities',10,16);}
  };
}
