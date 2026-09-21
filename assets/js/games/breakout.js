// games/breakout.js — Breakout.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function breakout(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  let pw=86,px=W/2-pw/2,keys={},lives=3;
  let ball={x:W/2,y:H-60,vx:150,vy:-210};
  const BC=10,BR=5,bw=(W-40)/BC,bh=18;
  let bricks=[];for(let r=0;r<BR;r++)for(let c=0;c<BC;c++)bricks.push({x:20+c*bw,y:40+r*(bh+6),alive:true,r});
  const reset=()=>{ball={x:W/2,y:H-60,vx:(R()>.5?1:-1)*150,vy:-210}};
  return {
    key(k,down){keys[k]=down},
    pointer(x,y,type){if(type==='move')px=Math.max(0,Math.min(W-pw,x-pw/2))},
    tick(dt){if(!isOver()){
      if(keys.ArrowLeft)px=Math.max(0,px-320*dt);if(keys.ArrowRight)px=Math.min(W-pw,px+320*dt);
      ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x<6||ball.x>W-6){ball.vx*=-1;beep(440,.03)}
      if(ball.y<6){ball.vy*=-1;beep(440,.03)}
      if(ball.y>H+10){lives--;beep(150,.2);if(lives<=0)gameOver();else reset();}
      if(ball.vy>0&&ball.y>H-26&&ball.y<H-12&&ball.x>px-6&&ball.x<px+pw+6){
        ball.vy=-Math.abs(ball.vy)*1.02;ball.vx+=((ball.x-(px+pw/2))/pw)*220;beep(560,.04);}
      bricks.forEach(b=>{if(b.alive&&ball.x>b.x&&ball.x<b.x+bw-4&&ball.y>b.y&&ball.y<b.y+bh){
        b.alive=false;ball.vy*=-1;addScore(10);beep(700+b.r*60,.05);}});
      if(bricks.every(b=>!b.alive)){bricks.forEach(b=>b.alive=true);ball.vx*=1.15;ball.vy*=1.15;addScore(100);}}
      clear(ctx,W,H,T);
      bricks.forEach(b=>{if(b.alive){ctx.fillStyle=b.r%2?T.ink:T.accent;ctx.fillRect(b.x,b.y,bw-4,bh)}});
      ctx.fillStyle=T.ink;ctx.fillRect(px,H-20,pw,8);
      ctx.beginPath();ctx.arc(ball.x,ball.y,6,0,7);ctx.fill();
      ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillText('lives '+lives+' · arrows or mouse',10,16);}
  };
}
