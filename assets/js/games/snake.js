// games/snake.js — Snake.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function snake(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  const C=20,COLS=Math.floor(W/C),ROWS=Math.floor(H/C);
  let snake=[{x:5,y:8},{x:4,y:8},{x:3,y:8}],dir={x:1,y:0},pend=dir,t=0,speed=.12;
  let food={x:12,y:8};
  const place=()=>{do{food={x:Math.floor(R()*COLS),y:Math.floor(R()*ROWS)}}while(snake.some(s=>s.x===food.x&&s.y===food.y))};
  return {
    key(k,down){if(!down)return;const d={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}}[k];
      if(d&&!(d.x===-dir.x&&d.y===-dir.y))pend=d;},
    tick(dt){if(!isOver()){t+=dt;if(t>speed){t=0;dir=pend;
      const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
      if(h.x<0||h.y<0||h.x>=COLS||h.y>=ROWS||snake.some(s=>s.x===h.x&&s.y===h.y)){gameOver();}
      else{snake.unshift(h);
        if(h.x===food.x&&h.y===food.y){addScore(10);beep(740,.06);speed=Math.max(.055,speed-.002);place();}
        else snake.pop();}}}
      clear(ctx,W,H,T);
      ctx.fillStyle=T.soft;for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++)if((x+y)%2)ctx.fillRect(x*C,y*C,C,C);
      ctx.fillStyle=T.accent;ctx.beginPath();ctx.arc(food.x*C+C/2,food.y*C+C/2,C*.32,0,7);ctx.fill();
      snake.forEach((s,i)=>{ctx.globalAlpha=1-i/snake.length*.72;ctx.fillStyle=i===0?T.ink:T.accent;ctx.fillRect(s.x*C+2,s.y*C+2,C-4,C-4)});ctx.globalAlpha=1;}
  };
}
