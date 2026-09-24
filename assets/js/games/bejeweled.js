// games/bejeweled.js — Gemfall.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
// Bejeweled's classic rules: swap two neighbours to line up three or more, the
// board cascades, and the game ends when no swap anywhere makes a match. The
// seven gems are told apart by shape, not hue, so every theme reads the same.
import { R, clear } from './common.js';

export default function bejeweled(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  const N=8,K=7,C=Math.floor((H-32)/N),BX=Math.floor((W-N*C)/2)-90,BY=Math.floor((H-N*C)/2);
  const PX=BX+N*C+28;
  const SWAP=.16,CLEAR=.22,HINT=9;
  const kind=()=>Math.floor(R()*K);
  const gem=(k,y)=>({k,y,s:1,dead:false,ph:R()*6.2832});

  let g,phase='idle',t=0,a=null,b=null,sel=null,cur={r:3,c:3},showCur=false,drag=null;
  let chain=0,level=1,pts=0,idle=0,animT=0,moves=0,pops=[];
  const need=l=>500*l*(l+1)/2;            // cumulative points to finish level l

  // --- board logic ---------------------------------------------------------
  const k=(r,c)=>(r>=0&&r<N&&c>=0&&c<N&&g[r][c])?g[r][c].k:-1;
  // Does the gem at r,c sit in a run of three or more?
  function matchAt(r,c){
    const v=k(r,c);if(v<0)return false;
    let h=1,i=c-1;while(k(r,i)===v){h++;i--}i=c+1;while(k(r,i)===v){h++;i++}
    if(h>=3)return true;
    let n=1;i=r-1;while(k(i,c)===v){n++;i--}i=r+1;while(k(i,c)===v){n++;i++}
    return n>=3;
  }
  const swapData=(p,q)=>{const x=g[p.r][p.c];g[p.r][p.c]=g[q.r][q.c];g[q.r][q.c]=x};
  // Every swap that would make a match, as [from, to] pairs.
  function allMoves(){
    const out=[];
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const [dr,dc] of [[0,1],[1,0]]){
      const p={r,c},q={r:r+dr,c:c+dc};if(q.r>=N||q.c>=N)continue;
      swapData(p,q);if(matchAt(p.r,p.c)||matchAt(q.r,q.c))out.push([p,q]);swapData(p,q);
    }
    return out;
  }
  // Runs of three or more along rows and columns; a gem in an L or T counts once.
  function findRuns(){
    const runs=[];
    for(let r=0;r<N;r++){let s=0;for(let c=1;c<=N;c++){if(c===N||k(r,c)!==k(r,s)){if(c-s>=3)runs.push({r,c:s,len:c-s,dr:0,dc:1});s=c}}}
    for(let c=0;c<N;c++){let s=0;for(let r=1;r<=N;r++){if(r===N||k(r,c)!==k(s,c)){if(r-s>=3)runs.push({r:s,c,len:r-s,dr:1,dc:0});s=r}}}
    return runs;
  }
  // A fresh deal never starts with a match, and always has at least one move.
  function deal(){
    do{
      g=Array.from({length:N},()=>Array(N).fill(null));
      for(let r=0;r<N;r++)for(let c=0;c<N;c++){
        let v;do v=kind();while((c>1&&k(r,c-1)===v&&k(r,c-2)===v)||(r>1&&k(r-1,c)===v&&k(r-2,c)===v));
        g[r][c]=gem(v,r-N-1);             // start above the board and fall in
      }
    }while(!allMoves().length);
    phase='fall';
  }

  function tryDown(p){
    if(sel&&Math.abs(sel.r-p.r)+Math.abs(sel.c-p.c)===1){startSwap(sel,p);return}
    if(sel&&sel.r===p.r&&sel.c===p.c){sel=null;return}
    sel=p;beep(700,.02);
  }
  function startSwap(p,q){
    if(phase!=='idle'||q.r<0||q.r>=N||q.c<0||q.c>=N)return;
    a=p;b=q;sel=null;phase='swap';t=0;idle=0;beep(520,.03);
  }
  // Clear whatever lines up; when the board is still, check for a dead end.
  function resolve(){
    const runs=findRuns();
    if(!runs.length){
      chain=0;phase='idle';moves=allMoves().length;
      if(!moves){phase='done';beep(220,.2);gameOver()}
      return;
    }
    chain++;
    for(const run of runs){
      for(let i=0;i<run.len;i++)g[run.r+run.dr*i][run.c+run.dc*i].dead=true;
      const v=10*run.len*(run.len-2)*chain*level;
      pts+=v;addScore(v);
      const m=(run.len-1)/2;
      pops.push({x:BX+(run.c+run.dc*m+.5)*C,y:BY+(run.r+run.dr*m+.5)*C,v,t:0});
    }
    beep(440+Math.min(chain,6)*110,.08);
    while(pts>=need(level)){level++;beep(990,.18)}
    phase='clear';t=0;
  }
  // Drop the survivors, then top every column up from above the board.
  function collapse(){
    for(let c=0;c<N;c++){
      let w=N-1;
      for(let r=N-1;r>=0;r--){const x=g[r][c];if(x&&!x.dead){g[r][c]=null;g[w][c]=x;w--}else g[r][c]=null}
      for(let r=w;r>=0;r--)g[r][c]=gem(kind(),r-w-1);
    }
    phase='fall';
  }

  deal();

  // --- drawing -------------------------------------------------------------
  // Colour: six hues walked round the wheel from the theme accent, plus a
  // near-white stone. Saturation and lightness come from the accent (clamped so
  // a pastel dark-mode accent still gives rich stones), so nothing is
  // hard-coded and a new accent re-tints the whole set.
  function hslOf(css){
    let r=106,gg=90,bb=214,m;
    if((m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(css).trim()))){
      let h=m[1];if(h.length===3)h=h.split('').map(x=>x+x).join('');
      const n=parseInt(h,16);r=n>>16&255;gg=n>>8&255;bb=n&255;
    }else if((m=/rgba?\(([^)]+)\)/.exec(css))){[r,gg,bb]=m[1].split(/[ ,/]+/).map(Number)}
    r/=255;gg/=255;bb/=255;
    const mx=Math.max(r,gg,bb),mn=Math.min(r,gg,bb),l=(mx+mn)/2,d=mx-mn;
    let h=0,s=0;
    if(d){s=d/(1-Math.abs(2*l-1));h=mx===r?((gg-bb)/d)%6:mx===gg?(bb-r)/d+2:(r-gg)/d+4;h*=60}
    return [(h+360)%360,s*100,l*100];
  }
  const [h0,s0,l0]=hslOf(T.accent);
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const HUE=[0,1,2,3,4,5].map(i=>[(h0+i*60)%360,cl(s0,55,85),cl(l0,46,60)]).concat([[h0,12,84]]);
  const hsl=(v,dl,ds=0)=>{const [h,s,l]=HUE[v];return `hsl(${h} ${cl(s+ds,0,100)}% ${cl(l+dl,6,97)}%)`};

  // Cuts, as a girdle outline in unit radius (y down). A smaller copy of the
  // outline is the table; the ring between them splits into facets.
  const poly=(n,rx,ry,rot)=>Array.from({length:n},(_,i)=>{const q=rot+i*2*Math.PI/n;return [Math.cos(q)*rx,Math.sin(q)*ry]});
  const CUT=[
    {p:poly(8,1,1,Math.PI/8),t:.56},                                                    // round brilliant
    {p:[[-.5,-.92],[.5,-.92],[.82,-.6],[.82,.6],[.5,.92],[-.5,.92],[-.82,.6],[-.82,-.6]],t:.5}, // emerald step cut
    {p:[[0,-1.12],[.86,0],[0,1.12],[-.86,0]],t:.42},                                     // lozenge
    {p:[[0,-1],[1.02,.78],[-1.02,.78]],t:.42},                                           // trillion
    {p:poly(6,1,1,0),t:.54},                                                             // hexagon
    {p:[[-.5,-.78],[.5,-.78],[1,-.22],[0,1.02],[-1,-.22]],t:.5},                         // brilliant, side-on
    {p:poly(10,.74,1.02,-Math.PI/2),t:.5},                                               // oval
  ].map(c=>{
    const n=c.p.length,cx=c.p.reduce((s,q)=>s+q[0],0)/n,cy=c.p.reduce((s,q)=>s+q[1],0)/n;
    // Light from the top left: each facet's brightness is how far its outward
    // direction points that way.
    const shade=c.p.map((q,i)=>{const w=c.p[(i+1)%n],mx=(q[0]+w[0])/2-cx,my=(q[1]+w[1])/2-cy,d=Math.hypot(mx,my)||1;return -(mx*.6+my*.8)/d});
    return {p:c.p,tb:c.p.map(q=>[cx+(q[0]-cx)*c.t,cy+(q[1]-cy)*c.t-.06]),shade};
  });

  function drawGem(v,x,y,r,ph){
    if(r<=.5)return;
    const {p,tb,shade}=CUT[v],n=p.length,P=q=>[x+q[0]*r,y+q[1]*r];
    const shape=pts=>{ctx.beginPath();pts.forEach((q,i)=>{const [a,b]=P(q);i?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.closePath()};
    // Crown facets, each lit by which way it faces.
    for(let i=0;i<n;i++){
      const j=(i+1)%n;shape([p[i],p[j],tb[j],tb[i]]);
      ctx.fillStyle=hsl(v,shade[i]*22,shade[i]*-8);ctx.fill();
    }
    // The table, with a soft band of reflected light across its upper half.
    shape(tb);ctx.fillStyle=hsl(v,9);ctx.fill();
    ctx.save();ctx.clip();ctx.globalAlpha=.35;ctx.fillStyle=hsl(v,40,-20);
    ctx.beginPath();ctx.moveTo(x-r,y-r*.25);ctx.lineTo(x+r*.2,y-r);ctx.lineTo(x+r*.55,y-r);ctx.lineTo(x-r,y+r*.2);ctx.fill();
    ctx.restore();
    // Facet edges, then the girdle.
    ctx.strokeStyle=hsl(v,-22);ctx.lineWidth=.8;ctx.globalAlpha=.55;
    ctx.beginPath();for(let i=0;i<n;i++){const [a,b]=P(p[i]),[c,d]=P(tb[i]);ctx.moveTo(a,b);ctx.lineTo(c,d)}ctx.stroke();
    shape(tb);ctx.stroke();ctx.globalAlpha=1;
    shape(p);ctx.lineWidth=1.2;ctx.strokeStyle=hsl(v,-30);ctx.stroke();
    // Now and then a stone catches the light.
    const tw=Math.pow(Math.max(0,Math.sin(animT*1.3+ph)),24);
    if(tw>.02){
      const sx=x-r*.34,sy=y-r*.4,s=r*.5*tw;
      ctx.fillStyle=hsl(v,60,-40);ctx.globalAlpha=tw;
      ctx.beginPath();ctx.moveTo(sx,sy-s);ctx.lineTo(sx+s*.18,sy-s*.18);ctx.lineTo(sx+s,sy);ctx.lineTo(sx+s*.18,sy+s*.18);
      ctx.lineTo(sx,sy+s);ctx.lineTo(sx-s*.18,sy+s*.18);ctx.lineTo(sx-s,sy);ctx.lineTo(sx-s*.18,sy-s*.18);ctx.closePath();ctx.fill();
      ctx.globalAlpha=1;
    }
  }
  const cellBox=(p,pad,col,w)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.strokeRect(BX+p.c*C+pad,BY+p.r*C+pad,C-pad*2,C-pad*2)};

  function draw(){
    clear(ctx,W,H,T);
    ctx.fillStyle=T.line;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if((r+c)%2)ctx.fillRect(BX+c*C,BY+r*C,C,C);
    ctx.strokeStyle=T.line;ctx.lineWidth=1;ctx.strokeRect(BX-.5,BY-.5,N*C+1,N*C+1);

    // Hint: after a while with nothing happening, one of the live moves pulses.
    if(phase==='idle'&&idle>HINT){
      const m=allMoves()[0];
      if(m){ctx.globalAlpha=.4+.4*Math.sin(animT*6);for(const p of m)cellBox(p,3,T.accent,2);ctx.globalAlpha=1}
    }
    if(sel)cellBox(sel,2,T.accent,2+Math.sin(animT*8));
    if(showCur&&!isOver()){ctx.setLineDash([4,3]);cellBox(cur,4,T.muted,1.5);ctx.setLineDash([])}

    ctx.save();ctx.beginPath();ctx.rect(BX,BY,N*C,N*C);ctx.clip();
    const p=phase==='swap'?Math.min(1,t/SWAP):phase==='back'?1-Math.min(1,t/SWAP):0;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const x=g[r][c];if(!x)continue;
      let ox=0,oy=0;
      if(a&&(phase==='swap'||phase==='back')){
        if(r===a.r&&c===a.c){ox=(b.c-a.c)*p;oy=(b.r-a.r)*p}
        else if(r===b.r&&c===b.c){ox=(a.c-b.c)*p;oy=(a.r-b.r)*p}
      }
      drawGem(x.k,BX+(c+ox+.5)*C,BY+(x.y+oy+.5)*C,C*.4*x.s,x.ph);
    }
    ctx.restore();

    // Score pops drift up and fade.
    ctx.font='700 13px "IBM Plex Mono",monospace';ctx.textAlign='center';
    for(const q of pops){ctx.globalAlpha=Math.max(0,1-q.t);ctx.fillStyle=T.ink;ctx.fillText('+'+q.v,q.x,q.y-q.t*26)}
    ctx.globalAlpha=1;

    // Side panel: level bar, cascade counter, moves left on the board.
    ctx.textAlign='left';ctx.fillStyle=T.muted;ctx.font='11px "IBM Plex Mono",monospace';
    ctx.fillText('LEVEL '+level,PX,BY+14);
    const lo=level>1?need(level-1):0,f=Math.min(1,(pts-lo)/(need(level)-lo)),bw=W-PX-16;
    ctx.strokeStyle=T.line;ctx.lineWidth=1;ctx.strokeRect(PX+.5,BY+24.5,bw,10);
    ctx.fillStyle=T.accent;ctx.fillRect(PX+2,BY+27,Math.max(0,(bw-3)*f),5);
    ctx.fillStyle=T.muted;
    ctx.fillText('MOVES '+(phase==='idle'||phase==='done'?moves:'…'),PX,BY+62);
    ctx.fillText('x'+level+' points',PX,BY+80);
    if(chain>1){ctx.fillStyle=T.accent;ctx.font='700 18px "IBM Plex Mono",monospace';ctx.fillText('CASCADE x'+chain,PX,BY+118)}
    if(phase==='done'){ctx.fillStyle=T.ink;ctx.font='700 13px "IBM Plex Mono",monospace';ctx.fillText('no more moves',PX,BY+118)}
    ctx.fillStyle=T.muted;ctx.font='10px "IBM Plex Mono",monospace';
    ctx.fillText('match 3+ in a line',PX,BY+N*C-30);
    ctx.fillText('4 and 5 score extra',PX,BY+N*C-16);
    ctx.fillText('cascades multiply',PX,BY+N*C-2);
  }

  // --- input ---------------------------------------------------------------
  const cellAt=(x,y)=>{const c=Math.floor((x-BX)/C),r=Math.floor((y-BY)/C);return r>=0&&r<N&&c>=0&&c<N?{r,c}:null};
  const DIR={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};

  return {
    key(key,down){
      if(!down||isOver())return;
      showCur=true;idle=0;
      const d=DIR[key];
      if(d){
        const q={r:cur.r+d[0],c:cur.c+d[1]};
        // With a gem picked up, an arrow swaps it that way; otherwise it moves the cursor.
        if(sel){if(phase==='idle'&&q.r>=0&&q.r<N&&q.c>=0&&q.c<N){startSwap(sel,q);cur=q}}
        else cur={r:Math.max(0,Math.min(N-1,q.r)),c:Math.max(0,Math.min(N-1,q.c))};
      }else if(key===' '||key==='Enter'){
        if(phase==='idle')tryDown({r:cur.r,c:cur.c});
      }
    },
    pointer(x,y,type){
      if(isOver())return;
      if(type==='up'){drag=null;return}
      if(type==='down'){
        const p=cellAt(x,y);idle=0;
        if(!p||phase!=='idle'){drag=null;return}
        showCur=false;cur=p;drag={p,x,y};tryDown(p);return;
      }
      // Dragging a gem past half a cell swaps it that way.
      if(!drag||phase!=='idle')return;
      const dx=x-drag.x,dy=y-drag.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))<C*.45)return;
      const q=Math.abs(dx)>Math.abs(dy)?{r:drag.p.r,c:drag.p.c+Math.sign(dx)}:{r:drag.p.r+Math.sign(dy),c:drag.p.c};
      const from=drag.p;drag=null;startSwap(from,q);
    },
    tick(dt){
      animT+=dt;
      for(const q of pops)q.t+=dt*1.4;
      pops=pops.filter(q=>q.t<1);
      if(!isOver()){
        t+=dt;
        if(phase==='idle')idle+=dt;
        else if(phase==='swap'&&t>=SWAP){
          swapData(a,b);
          if(matchAt(a.r,a.c)||matchAt(b.r,b.c)){a=b=null;resolve()}
          else{swapData(a,b);phase='back';t=0;beep(200,.08)}
        }
        else if(phase==='back'&&t>=SWAP){a=b=null;phase='idle'}
        else if(phase==='clear'){
          const s=Math.max(0,1-t/CLEAR);
          for(const row of g)for(const x of row)if(x&&x.dead)x.s=s;
          if(t>=CLEAR)collapse();
        }
        else if(phase==='fall'){
          let moving=false;
          for(let r=0;r<N;r++)for(let c=0;c<N;c++){
            const x=g[r][c];
            if(x.y<r){x.y=Math.min(r,x.y+dt*14);moving=true}
          }
          if(!moving){beep(330,.02);resolve()}
        }
      }
      draw();
    }
  };
}
