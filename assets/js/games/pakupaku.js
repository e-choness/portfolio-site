// games/pakupaku.js — Paku Paku.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function pakupaku(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  const LY=Math.floor(H/2);
  let player={x:W*0.38,vx:1};
  // enemy starts on the opposite side from player, well away
  let enemy={x:W*0.85,eyeVx:0};
  let dots=[],powerTicks=0,animT=0,multiplier=0;

  function spawnDots(){
    multiplier++;
    // power dot on the side opposite to player so they must traverse the field
    const pi=player.x<W/2 ? 11+Math.floor(R()*4) : 1+Math.floor(R()*4);
    dots=[];
    for(let i=0;i<16;i++) dots.push({x:12+i*((W-24)/15),isPower:i===pi});
  }
  spawnDots();

  return {
    key(k,down){
      if(!down||isOver())return;
      if(k===' '||k==='ArrowLeft'||k==='ArrowRight'||k==='ArrowUp'||k==='ArrowDown')
        player.vx*=-1;
    },
    pointer(x,y,type){if(type==='down'&&!isOver())player.vx*=-1;},
    tick(dt){
      if(!isOver()){
        animT+=dt;
        const diff=1+multiplier*0.03;

        // move player; wrap at edges
        player.x+=player.vx*110*diff*dt;
        if(player.x<-14)player.x=W+14;
        else if(player.x>W+14)player.x=-14;

        // dot collisions
        dots=dots.filter(d=>{
          if(Math.abs(player.x-d.x)<13){
            if(d.isPower){beep(440,.1);if(enemy.eyeVx===0)powerTicks=3;}
            else beep(880,.02);
            addScore(multiplier);
            return false;
          }
          return true;
        });

        // enemy AI: eyeVx!=0 means it was just eaten and is fleeing to a wall
        const evx=enemy.eyeVx!==0?enemy.eyeVx:(player.x>enemy.x?1:-1)*(powerTicks>0?-1:1);
        const espd=enemy.eyeVx!==0?80:powerTicks>0?26:62;
        enemy.x=Math.max(0,Math.min(W,enemy.x+evx*espd*diff*dt));
        // once the fleeing enemy reaches a wall it resets and chases again from the far edge
        if((enemy.eyeVx<0&&enemy.x<=2)||(enemy.eyeVx>0&&enemy.x>=W-2))enemy.eyeVx=0;

        // player-enemy collision
        if(enemy.eyeVx===0&&Math.abs(player.x-enemy.x)<16){
          if(powerTicks>0){
            beep(660,.15);addScore(10*multiplier);
            // send enemy to the wall farther from player
            enemy.eyeVx=player.x>W/2?-1:1;
            powerTicks=0;multiplier++;
          } else {
            gameOver();
          }
        }

        powerTicks=Math.max(0,powerTicks-dt);
        if(dots.length===0){beep(740,.1);spawnDots();}
      }

      // ── draw ──────────────────────────────────────────────────────────
      clear(ctx,W,H,T);

      // track lanes
      ctx.strokeStyle=T.line;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,LY-16);ctx.lineTo(W,LY-16);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,LY+16);ctx.lineTo(W,LY+16);ctx.stroke();

      // dots
      dots.forEach(d=>{
        const blink=d.isPower&&Math.floor(animT*4)%2===0;
        if(!blink){
          ctx.fillStyle=d.isPower?T.accent:T.muted;
          ctx.beginPath();ctx.arc(d.x,LY,d.isPower?5:2.5,0,6.28);ctx.fill();
        }
      });

      // player — pac-man with animated mouth
      const mouth=Math.abs(Math.sin(animT*9))*0.32;
      const fa=player.vx>0?0:Math.PI;
      ctx.fillStyle=T.ink;
      ctx.beginPath();ctx.moveTo(player.x,LY);
      ctx.arc(player.x,LY,11,fa+mouth,fa+Math.PI*2-mouth);
      ctx.closePath();ctx.fill();

      // enemy — ghost shape; flickers when power is about to expire
      if(enemy.eyeVx!==0){
        // defeated: just floating eyes heading to a wall
        ctx.fillStyle=T.accent;
        ctx.beginPath();ctx.arc(enemy.x-4,LY-3,3,0,6.28);ctx.fill();
        ctx.beginPath();ctx.arc(enemy.x+4,LY-3,3,0,6.28);ctx.fill();
      } else {
        const flash=powerTicks>0&&powerTicks<1&&Math.floor(animT*7)%2===0;
        ctx.fillStyle=flash?T.ink:powerTicks>0?T.muted:T.accent;
        const gx=enemy.x,gy=LY;
        ctx.beginPath();
        ctx.arc(gx,gy-3,11,Math.PI,0);
        ctx.lineTo(gx+11,gy+9);
        ctx.lineTo(gx+7,gy+6);ctx.lineTo(gx+3,gy+9);
        ctx.lineTo(gx-1,gy+6);ctx.lineTo(gx-5,gy+9);
        ctx.lineTo(gx-9,gy+6);ctx.lineTo(gx-11,gy+9);
        ctx.closePath();ctx.fill();
        if(powerTicks===0){
          ctx.fillStyle=T.bg;
          ctx.beginPath();ctx.arc(gx-4,gy-4,2.5,0,6.28);ctx.fill();
          ctx.beginPath();ctx.arc(gx+4,gy-4,2.5,0,6.28);ctx.fill();
        }
      }

      // HUD
      ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';
      ctx.fillText('x'+multiplier+' · tap / space to turn',10,18);
      if(powerTicks>0){ctx.fillStyle=T.accent;ctx.textAlign='right';ctx.fillText('POWER!',W-10,18);}
    }
  };
}
