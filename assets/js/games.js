// EchoOS Arcade — six canvas games, all assets generated in JS. No art files.
// window.EchoGames.start(canvas, gameId, theme, onScore) -> {stop, pointer(x,y,type)}
(function(){
  const HS='echoos-hiscores';
  const hs=()=>{try{return JSON.parse(localStorage.getItem(HS)||'{}')}catch(e){return{}}};
  const setHs=(g,v)=>{const h=hs();if(v>(h[g]||0)){h[g]=v;localStorage.setItem(HS,JSON.stringify(h));}};
  const R=Math.random;

  function makeRunner(canvas, gameId, theme, onScore){
    const ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
    const T=theme, beep=(f,d)=>{if(T.beep)T.beep(f,d)};
    let score=0, over=false, dead=false;
    const report=()=>{setHs(gameId,score);onScore(score,over,Math.max(score,hs()[gameId]||0))};
    const addScore=(n)=>{score+=n;report()};
    const gameOver=()=>{if(over)return;over=true;beep(160,.3);report()};
    const G=GAMES[gameId]({ctx,W,H,T,beep,addScore,gameOver,isOver:()=>over});
    let raf=null,last=0;
    const kd=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>-1)e.preventDefault();if(G.key)G.key(e.key,true)};
    const ku=e=>{if(G.key)G.key(e.key,false)};
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    function loop(t){if(dead)return;raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||.016);last=t;G.tick(dt);
      if(over){ctx.fillStyle=T.overlay;ctx.fillRect(0,0,W,H);ctx.fillStyle=T.ink;ctx.font='700 26px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-8);ctx.font='13px "IBM Plex Mono",monospace';ctx.fillStyle=T.muted;ctx.fillText('score '+score+'  ·  press restart',W/2,H/2+20);}}
    raf=requestAnimationFrame(loop);
    report();
    return {
      stop(){dead=true;if(raf)cancelAnimationFrame(raf);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);},
      pointer(x,y,type){if(G.pointer&&!over)G.pointer(x,y,type)},
      key(k){if(G.key&&!over){G.key(k,true);setTimeout(()=>{if(!dead&&G.key)G.key(k,false)},90)}}
    };
  }

  function clear(ctx,W,H,T){ctx.fillStyle=T.bg;ctx.fillRect(0,0,W,H);}

  const GAMES={
    // ---------------- TETRIS ----------------
    tetris(env){
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
    },
    // ---------------- SNAKE ----------------
    snake(env){
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
    },
    // ---------------- NUCLEAR DEFENCE (missile command) ----------------
    missile(env){
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
    },
    // ---------------- FEED THE POND ----------------
    pond(env){
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
          fish.forEach(f=>{ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);
            ctx.fillStyle=f.fed>4?T.accent:T.muted;
            ctx.beginPath();ctx.ellipse(0,0,f.s*.7,f.s*.34,0,0,7);ctx.fill();
            ctx.beginPath();ctx.moveTo(-f.s*.6,0);ctx.lineTo(-f.s*1.05,-f.s*.3);ctx.lineTo(-f.s*1.05,f.s*.3);ctx.closePath();ctx.fill();
            ctx.fillStyle=T.bg;ctx.beginPath();ctx.arc(f.s*.4,-f.s*.08,2.2,0,7);ctx.fill();ctx.restore();});
          ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';ctx.fillText('click to drop food · fish grow as they eat',10,16);}
      };
    },
    // ---------------- BREAKOUT ----------------
    breakout(env){
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
    },
    // ---------------- INVADERS ----------------
    invaders(env){
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
  };

  window.EchoGames={start:makeRunner, highscores:hs, list:[
    {id:'tetris', name:'Blockfall', tag:'tetris-like', hint:'← → move · ↑ rotate · space drop', pad:[{k:'ArrowLeft',l:'←'},{k:'ArrowUp',l:'↻'},{k:'ArrowRight',l:'→'},{k:'ArrowDown',l:'↓'},{k:' ',l:'⤓'}]},
    {id:'snake', name:'Snake', tag:'classic', hint:'arrow keys · or the pad below', pad:[{k:'ArrowLeft',l:'←'},{k:'ArrowUp',l:'↑'},{k:'ArrowDown',l:'↓'},{k:'ArrowRight',l:'→'}]},
    {id:'missile', name:'Nuclear Defence', tag:'missile command', hint:'click to intercept'},
    {id:'pond', name:'Feed the Pond', tag:'zen sim', hint:'click to drop food'},
    {id:'breakout', name:'Breakout', tag:'brick breaker', hint:'arrows or mouse'},
    {id:'invaders', name:'Invaders', tag:'shoot-em-up', hint:'arrows + space'}
  ]};
})();
