// games/pond.js — Feed the Pond.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function pond(env){
  const {ctx,W,H,T,beep,addScore}=env;
  let fish=Array.from({length:7},()=>({x:R()*W,y:40+R()*(H-80),a:R()*6.28,s:16+R()*8,v:34+R()*22,turn:0,fed:0}));
  let food=[],ripples=[];
  return {
    pointer(x,y,type){if(type!=='down')return;food.push({x,y,vy:14});ripples.push({x,y,r:4});beep(660,.04);},
    tick(dt){
      ripples.forEach(r=>r.r+=dt*46);ripples=ripples.filter(r=>r.r<52);
      food.forEach(f=>{f.y+=f.vy*dt;f.vy=Math.max(4,f.vy-6*dt)});
      food=food.filter(f=>f.y<H-8);
      fish.forEach(f=>{
        let tgt=null,best=1e9;
        food.forEach(p=>{const d=(p.x-f.x)**2+(p.y-f.y)**2;if(d<best&&d<220*220){best=d;tgt=p}});
        if(tgt){const want=Math.atan2(tgt.y-f.y,tgt.x-f.x);let d=want-f.a;while(d>3.14)d-=6.28;while(d<-3.14)d+=6.28;f.a+=d*Math.min(1,dt*4);
          if(best<(f.s*.8)**2){tgt.eaten=true;f.fed++;f.s=Math.min(34,f.s+1.2);addScore(5);beep(820+R()*160,.05);}}
        else{f.turn+=(R()-.5)*dt*3;f.a+=f.turn*dt;}
        f.x+=Math.cos(f.a)*f.v*dt;f.y+=Math.sin(f.a)*f.v*dt;
        if(f.x<20||f.x>W-20)f.a=3.14-f.a;if(f.y<24||f.y>H-24)f.a=-f.a;
        f.x=Math.max(18,Math.min(W-18,f.x));f.y=Math.max(22,Math.min(H-22,f.y));});
      food=food.filter(f=>!f.eaten);
      clear(ctx,W,H,T);
      ctx.strokeStyle=T.line;ripples.forEach(r=>{ctx.globalAlpha=1-r.r/52;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke();ctx.globalAlpha=1});
      ctx.fillStyle=T.ink;food.forEach(f=>{ctx.beginPath();ctx.arc(f.x,f.y,3,0,7);ctx.fill()});
      fish.forEach(f=>{
        const ft=Math.min(1,f.fed/10);
        ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);
        ctx.fillStyle=T.muted;
        ctx.beginPath();ctx.ellipse(0,0,f.s*.7,f.s*.34,0,0,7);ctx.fill();
        ctx.beginPath();ctx.moveTo(-f.s*.6,0);ctx.lineTo(-f.s*1.05,-f.s*.3);ctx.lineTo(-f.s*1.05,f.s*.3);ctx.closePath();ctx.fill();
        if(ft>0){ctx.globalAlpha=ft;ctx.fillStyle=T.accent;ctx.beginPath();ctx.ellipse(0,0,f.s*.7,f.s*.34,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-f.s*.6,0);ctx.lineTo(-f.s*1.05,-f.s*.3);ctx.lineTo(-f.s*1.05,f.s*.3);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
        ctx.fillStyle=T.bg;ctx.beginPath();ctx.arc(f.s*.4,-f.s*.08,2.2,0,7);ctx.fill();ctx.restore();});
      ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillText('click to drop food · fish grow as they eat',10,16);}
  };
}
