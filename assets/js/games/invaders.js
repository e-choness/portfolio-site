// games/invaders.js — Invaders.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function invaders(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  let px=W/2,keys={},pshots=[],eshots=[],dir=1,step=14,speed=26,wave=1;
  const mk=()=>{const a=[];for(let r=0;r<4;r++)for(let c=0;c<8;c++)a.push({x:60+c*46,y:44+r*34,alive:true,r});return a};
  let inv=mk(),cool=0;
  return {
    key(k,down){keys[k]=down;if(down&&k===' '&&cool<=0&&!isOver()){pshots.push({x:px,y:H-36});cool=.35;beep(600,.04)}},
    pointer(x,y,type){if(type==='move')px=Math.max(16,Math.min(W-16,x));if(type==='down'&&cool<=0&&!isOver()){pshots.push({x:px,y:H-36});cool=.35;beep(600,.04)}},
    tick(dt){if(!isOver()){cool-=dt;
      if(keys.ArrowLeft)px=Math.max(16,px-260*dt);if(keys.ArrowRight)px=Math.min(W-16,px+260*dt);
      let edge=false;inv.forEach(i=>{if(i.alive){i.x+=dir*speed*dt;if(i.x<18||i.x>W-18)edge=true}});
      if(edge){dir*=-1;inv.forEach(i=>{i.y+=step;if(i.alive&&i.y>H-60)gameOver()});}
      if(R()<dt*1.2){const a=inv.filter(i=>i.alive);if(a.length){const s=a[Math.floor(R()*a.length)];eshots.push({x:s.x,y:s.y})}}
      pshots.forEach(s=>s.y-=340*dt);eshots.forEach(s=>s.y+=(150+wave*18)*dt);
      pshots=pshots.filter(s=>{if(s.y<0)return false;
        for(const i of inv)if(i.alive&&Math.abs(i.x-s.x)<15&&Math.abs(i.y-s.y)<12){i.alive=false;addScore(20);beep(840,.05);return false}
        return true});
      eshots=eshots.filter(s=>{if(s.y>H)return false;
        if(Math.abs(s.x-px)<14&&s.y>H-34){gameOver();return false}return true});
      if(inv.every(i=>!i.alive)){wave++;speed+=14;inv=mk();addScore(100);beep(980,.12);}}
      clear(ctx,W,H,T);
      inv.forEach(i=>{if(i.alive){ctx.fillStyle=i.r%2?T.accent:T.ink;
        ctx.fillRect(i.x-13,i.y-8,26,16);ctx.fillStyle=T.bg;ctx.fillRect(i.x-6,i.y-3,4,4);ctx.fillRect(i.x+2,i.y-3,4,4);}});
      ctx.fillStyle=T.accent;ctx.beginPath();ctx.moveTo(px,H-38);ctx.lineTo(px-15,H-16);ctx.lineTo(px+15,H-16);ctx.closePath();ctx.fill();
      ctx.fillStyle=T.ink;pshots.forEach(s=>ctx.fillRect(s.x-1.5,s.y-6,3,9));
      ctx.fillStyle=T.muted;eshots.forEach(s=>ctx.fillRect(s.x-1.5,s.y-6,3,9));
      ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillStyle=T.muted;ctx.fillText('wave '+wave+' · arrows + space, or mouse',10,16);}
  };
}
