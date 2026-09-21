// games/tetris.js — Blockfall.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R, clear } from './common.js';

export default function tetris(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  const COLS=10,ROWS=18,C=Math.floor((H-24)/ROWS),BX=Math.max(8,Math.floor((W-COLS*C)/2)-60),BY=Math.floor((H-ROWS*C)/2);
  const SHAPES=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
  let grid=Array.from({length:ROWS},()=>Array(COLS).fill(0)),lines=0;
  const spawn=()=>({m:SHAPES[Math.floor(R()*7)].map(r=>r.slice()),x:3,y:0});
  let cur=spawn(),next=spawn(),t=0,fall=.75;
  const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
  const fits=(m,x,y)=>m.every((row,j)=>row.every((v,i)=>!v||(x+i>=0&&x+i<COLS&&y+j<ROWS&&y+j>=0&&!grid[y+j][x+i])));
  const lock=()=>{cur.m.forEach((row,j)=>row.forEach((v,i)=>{if(v&&cur.y+j>=0)grid[cur.y+j][cur.x+i]=1}));
    let n=0;grid=grid.filter(r=>{if(r.every(v=>v)){n++;return false}return true});
    while(grid.length<ROWS)grid.unshift(Array(COLS).fill(0));
    addScore(4);
    if(n){lines+=n;addScore([0,100,300,500,800][n]);beep(660+n*80,.08);fall=Math.max(.12,.75-lines*.02)}
    cur=next;next=spawn();if(!fits(cur.m,cur.x,cur.y))gameOver();};
  const move=dx=>{if(fits(cur.m,cur.x+dx,cur.y)){cur.x+=dx;beep(880,.02)}};
  const drop=()=>{if(fits(cur.m,cur.x,cur.y+1))cur.y++;else lock()};
  return {
    key(k,down){if(!down||isOver())return;
      if(k==='ArrowLeft')move(-1);else if(k==='ArrowRight')move(1);
      else if(k==='ArrowDown'){drop();addScore(1);}
      else if(k==='ArrowUp'){const r=rot(cur.m);if(fits(r,cur.x,cur.y)){cur.m=r;beep(520,.03)}}
      else if(k===' '){while(fits(cur.m,cur.x,cur.y+1))cur.y++;lock()}},
    tick(dt){if(!isOver()){t+=dt;if(t>fall){t=0;drop()}}
      clear(ctx,W,H,T);
      ctx.strokeStyle=T.line;ctx.strokeRect(BX-.5,BY-.5,COLS*C+1,ROWS*C+1);
      const cell=(x,y,col)=>{ctx.fillStyle=col;ctx.fillRect(BX+x*C+1,BY+y*C+1,C-2,C-2)};
      grid.forEach((row,y)=>row.forEach((v,x)=>{if(v)cell(x,y,T.ink)}));
      cur.m.forEach((row,j)=>row.forEach((v,i)=>{if(v&&cur.y+j>=0)cell(cur.x+i,cur.y+j,T.accent)}));
      ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';
      ctx.fillText('NEXT',BX+COLS*C+18,BY+14);ctx.fillText('LINES '+lines,BX+COLS*C+18,BY+96);
      next.m.forEach((row,j)=>row.forEach((v,i)=>{if(v){ctx.fillStyle=T.accent;ctx.fillRect(BX+COLS*C+18+i*12,BY+24+j*12,10,10)}}));}
  };
}
