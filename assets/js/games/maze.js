// games/maze.js — Labyrinth, after the Windows 95 3D Maze screensaver.
// Column raycaster. One ray per pixel boundary, then adjacent columns that hit
// the same wall face are merged into a single perspective quad — so a frame is
// ~10 fills and ~10 strokes no matter how big the maze is. Bricks are drawn as
// perspective-correct vector seams, not sampled textures: no image data, no
// per-pixel loops, nothing to preload.
// Factory: takes the runner env, returns { key?, pointer?, tick }.
import { R } from './common.js';

export default function maze(env){
  const {ctx,W,H,T,beep,addScore,gameOver,isOver}=env;
  const PLANE=.66, PROJ=(W/2)/PLANE, STEP_T=.26, TURN_T=.2;
  // The screensaver moves at its own, much calmer pace, and rests a beat between
  // moves — the player's timings are snappy on purpose, which is exhausting to
  // just sit and watch.
  const DEMO_STEP=.62, DEMO_TURN=.46, DEMO_REST=.14;
  const DX=[1,0,-1,0], DY=[0,1,0,-1], NX=W+1;
  // ray/hit buffers — allocated once, reused every frame (no per-frame GC churn)
  const rdx=new Float32Array(NX),rdy=new Float32Array(NX);
  const fdd=new Float32Array(NX),fpc=new Float32Array(NX);
  const fmx=new Int16Array(NX),fmy=new Int16Array(NX),fsd=new Uint8Array(NX);

  let GW=0,GH=0,g=null,gate=[0,0],seen=null,walked=null,mini=null,mctx=null;
  let level=1,cx=1,cy=1,facing=0,ang=0,camx=1.5,camy=1.5,bob=0;
  let mv=null,queued=null,held={},demo=true,timeLeft=0,plan=[],rest=0;

  // ── maze generation ────────────────────────────────────────────────────
  // Recursive backtracker on an odd grid: 0 = floor, 1 = wall, 2 = the gate.
  function build(n){
    GW=GH=n*2+1;
    g=Array.from({length:GH},()=>new Uint8Array(GW).fill(1));
    const st=[[1,1]];g[1][1]=0;
    while(st.length){
      const c=st[st.length-1],x=c[0],y=c[1],opts=[];
      for(let d=0;d<4;d++){const nx=x+DX[d]*2,ny=y+DY[d]*2;
        if(nx>0&&ny>0&&nx<GW-1&&ny<GH-1&&g[ny][nx])opts.push(d);}
      if(!opts.length){st.pop();continue}
      const d=opts[Math.floor(R()*opts.length)];
      g[y+DY[d]][x+DX[d]]=0;g[y+DY[d]*2][x+DX[d]*2]=0;
      st.push([x+DX[d]*2,y+DY[d]*2]);
    }
    // gate goes in a wall beside the cell furthest (by corridor) from the start
    const dist=Array.from({length:GH},()=>new Int16Array(GW).fill(-1));
    const q=[[1,1]];let far=[1,1];dist[1][1]=0;
    for(let i=0;i<q.length;i++){
      const x=q[i][0],y=q[i][1];
      if(dist[y][x]>dist[far[1]][far[0]])far=[x,y];
      for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d];
        if(!g[ny][nx]&&dist[ny][nx]<0){dist[ny][nx]=dist[y][x]+1;q.push([nx,ny])}}
    }
    gate=null;
    for(let pass=0;pass<2&&!gate;pass++)
      for(let d=0;d<4&&!gate;d++){
        const nx=far[0]+DX[d],ny=far[1]+DY[d];
        const border=nx===0||ny===0||nx===GW-1||ny===GH-1;
        if(g[ny][nx]===1&&(border||pass))gate=[nx,ny];
      }
    g[gate[1]][gate[0]]=2;
  }

  function newLevel(){
    build(Math.min(12,5+level));
    cx=cy=1;facing=0;ang=0;camx=camy=1.5;mv=null;queued=null;bob=0;plan=[];rest=0;
    seen=Array.from({length:GH},()=>new Uint8Array(GW));
    walked=Array.from({length:GH},()=>new Uint8Array(GW));
    // minimap lives on an offscreen canvas and is painted once per revealed
    // cell, so the HUD costs exactly one drawImage per frame
    mini=document.createElement('canvas');
    mini.width=GW*3;mini.height=GH*3;
    mctx=mini.getContext('2d');
    mctx.fillStyle=T.bg;mctx.fillRect(0,0,mini.width,mini.height);
    timeLeft=42+level*6;
    walked[1][1]=1;reveal(1,1);
  }

  function reveal(x,y){
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const nx=x+i,ny=y+j;
      if(nx<0||ny<0||nx>=GW||ny>=GH||seen[ny][nx])continue;
      seen[ny][nx]=1;
      const v=g[ny][nx];
      mctx.fillStyle=v===2?T.accent:v?T.line:T.soft;
      mctx.fillRect(nx*3,ny*3,3,3);
    }
  }

  // ── movement (grid-locked, smoothly interpolated — as the original) ────
  function turn(sgn){
    mv={k:'t',t:0,d:demo?DEMO_TURN:TURN_T,a0:ang,a1:ang+sgn*Math.PI/2};
    facing=(facing+sgn+4)%4;
  }
  function step(sgn){
    const nx=cx+DX[facing]*sgn,ny=cy+DY[facing]*sgn,v=g[ny][nx];
    if(v===2){complete();return}
    if(v===1){mv={k:'b',t:0,d:.16,sgn:sgn};beep(130,.07);return}
    mv={k:'s',t:0,d:demo?DEMO_STEP:STEP_T,x0:cx,y0:cy,x1:nx,y1:ny};
    cx=nx;cy=ny;
    if(!walked[ny][nx]){walked[ny][nx]=1;if(!demo)addScore(2)}
    reveal(nx,ny);
    if(!demo)beep(330,.02); // a footstep every 0.6s for minutes on end is not restful
  }
  function act(k){
    if(k==='ArrowLeft')turn(-1);
    else if(k==='ArrowRight')turn(1);
    else if(k==='ArrowDown')step(-1);
    else if(k==='ArrowUp'||k===' ')step(1);
  }
  const HELD_ORDER=['ArrowUp','ArrowLeft','ArrowRight','ArrowDown',' '];
  function heldKey(){
    for(const k of HELD_ORDER)if(held[k])return k;
    return null;
  }
  function complete(){
    // The screensaver isn't playing for points — it finds the way out, then
    // quietly starts over on a fresh maze.
    if(demo){newLevel();return}
    beep(980,.18);
    addScore(120+Math.floor(timeLeft)*3);
    level++;newLevel();
  }
  function takeControl(){
    demo=false;level=1;held={};queued=null;plan=[];newLevel();beep(760,.08);
  }
  // Screensaver autopilot. The original solved its mazes with the left-hand rule
  // — keep your left hand on the wall and a simply-connected maze always opens up
  // eventually — so this one does too, and it takes the gate the moment it comes
  // into reach.
  //
  // The decision is made once per cell and then committed as a little plan of
  // moves. Re-deciding after each turn is what makes a wall follower fail: the
  // cell behind is always open, so "is my left open?" keeps answering yes until
  // the camera has spun all the way round and walks back where it came from,
  // oscillating between two cells forever.
  function drift(){
    if(!plan.length){
      const look=[(facing+3)%4,facing,(facing+1)%4,(facing+2)%4]; // left, on, right, back
      const at=(d)=>g[cy+DY[d]][cx+DX[d]];
      const out=look.find((d)=>at(d)===2);
      let d=out!==undefined?out:look.find((dd)=>at(dd)===0);
      if(d===undefined)d=(facing+2)%4;
      const diff=(d-facing+4)%4;
      plan=diff===0?[]:diff===1?[1]:diff===2?[1,1]:[-1];
      plan.push('s');
    }
    const m=plan.shift();
    if(m==='s')step(1);else turn(m);
  }

  function pose(dt){
    if(!mv)return;
    mv.t+=dt;
    const r=Math.min(1,mv.t/mv.d);
    if(mv.k==='s'){
      camx=mv.x0+.5+(mv.x1-mv.x0)*r;camy=mv.y0+.5+(mv.y1-mv.y0)*r;
      bob=Math.sin(r*Math.PI*2)*(demo?1.1:2.4);
    }else if(mv.k==='t'){
      ang=mv.a0+(mv.a1-mv.a0)*(r*r*(3-2*r));
    }else{
      const e=Math.sin(r*Math.PI)*.16*mv.sgn;
      camx=cx+.5+DX[facing]*e;camy=cy+.5+DY[facing]*e;
    }
    if(r>=1){
      if(mv.k==='t')ang=mv.a1;else{camx=cx+.5;camy=cy+.5;bob=0}
      mv=null;
    }
  }

  // ── raycast ────────────────────────────────────────────────────────────
  function cast(px,py,a){
    const dirX=Math.cos(a),dirY=Math.sin(a),plX=-Math.sin(a)*PLANE,plY=Math.cos(a)*PLANE;
    const mx0=Math.floor(px),my0=Math.floor(py);
    for(let i=0;i<NX;i++){
      const c=2*i/W-1,rx=dirX+plX*c,ry=dirY+plY*c;
      rdx[i]=rx;rdy[i]=ry;
      const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);
      let mx=mx0,my=my0,sx,sy,sdx,sdy,side=0;
      if(rx<0){sx=-1;sdx=(px-mx)*ddx}else{sx=1;sdx=(mx+1-px)*ddx}
      if(ry<0){sy=-1;sdy=(py-my)*ddy}else{sy=1;sdy=(my+1-py)*ddy}
      for(let s=0;s<48;s++){
        if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
        if(mx<0||my<0||mx>=GW||my>=GH)break;
        if(g[my][mx])break;
      }
      mx=mx<0?0:mx>=GW?GW-1:mx;my=my<0?0:my>=GH?GH-1:my;
      const pc=side===0?mx+(1-sx)/2:my+(1-sy)/2;
      let d=side===0?(pc-px)/rx:(pc-py)/ry;
      if(!(d>.03))d=.03;
      fmx[i]=mx;fmy[i]=my;fsd[i]=side;fpc[i]=pc;fdd[i]=d;
    }
  }
  // perspective-correct inverse: where across the face (0..1) does wall
  // coordinate u land, given the two edge coordinates and their depths
  function sOf(u,uA,dA,uB,dB){
    const p=(uA-u)/dA,q=(u-uB)/dB,den=p+q;
    return den?p/den:0;
  }

  function drawFace(xa,dA,xb,dB,side,mx,my,px,py,hz){
    const hA=PROJ/dA,hB=PROJ/dB;
    const tA=hz-hA/2,bA=hz+hA/2,tB=hz-hB/2,bB=hz+hB/2;
    const quad=()=>{ctx.beginPath();ctx.moveTo(xa,tA);ctx.lineTo(xb,tB);ctx.lineTo(xb,bB);ctx.lineTo(xa,bA);ctx.closePath()};
    const dm=(dA+dB)/2;
    // one wall colour, two alphas: distance fog towards the background plus a
    // fixed knock-down for the faces at right angles — the two-tone lighting of
    // the original, and no colour value ever has to be parsed
    const lit=Math.max(.1,Math.min(.86,1.3/(1+dm*.34)))*(side?.72:1);
    const isGate=g[my][mx]===2;
    quad();ctx.fillStyle=T.bg;ctx.fill();
    ctx.globalAlpha=lit;ctx.fillStyle=isGate?T.accent:T.ink;ctx.fill();
    ctx.globalAlpha=1;

    const uA=side===0?py+dA*rdy[xa]:px+dA*rdx[xa];
    const uB=side===0?py+dB*rdy[xb]:px+dB*rdx[xb];

    if(isGate){
      ctx.save();quad();ctx.clip();
      const base=side===0?my:mx;
      const at=(u,f)=>{
        const s=Math.max(-2,Math.min(3,sOf(u,uA,dA,uB,dB)));
        const x=xa+(xb-xa)*s,t=tA+(tB-tA)*s,b=bA+(bB-bA)*s;
        return [x,t+(b-t)*f];
      };
      const poly=(p)=>{ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);
        for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath()};
      ctx.globalAlpha=Math.min(1,lit+.25);
      poly([at(base+.3,.34),at(base+.7,.34),at(base+.7,.9),at(base+.3,.9)]);
      ctx.fillStyle=T.bg;ctx.fill();
      poly([at(base+.5,.42),at(base+.64,.58),at(base+.56,.58),at(base+.56,.76),
            at(base+.44,.76),at(base+.44,.58),at(base+.36,.58)]);
      ctx.fillStyle=T.accent;ctx.fill();ctx.globalAlpha=1;
      ctx.restore();
    }else if(xb-xa>9&&dm<9){
      // brick seams: staggered courses of 2:1 bricks, all of them batched into
      // a single path and one stroke. Faces further away drop to half the
      // detail — a cheap LOD that also keeps distant walls from turning to mush.
      const near=dm<3.6,rows=near?8:4,bw=near?.25:.5;
      ctx.beginPath();
      for(let k=1;k<rows;k++){const f=k/rows;
        ctx.moveTo(xa,tA+(bA-tA)*f);ctx.lineTo(xb,tB+(bB-tB)*f)}
      const lo=Math.min(uA,uB),hi=Math.max(uA,uB);
      for(let k=0;k<rows;k++){
        const off=k%2?bw/2:0,f0=k/rows,f1=(k+1)/rows;
        let u=Math.ceil((lo-off)/bw)*bw+off,n=0;
        while(u<hi&&n++<14){
          const s=sOf(u,uA,dA,uB,dB);
          if(s>0&&s<1){
            const x=xa+(xb-xa)*s,t=tA+(tB-tA)*s,b=bA+(bB-bA)*s;
            ctx.moveTo(x,t+(b-t)*f0);ctx.lineTo(x,t+(b-t)*f1);
          }
          u+=bw;
        }
      }
      ctx.globalAlpha=Math.min(.85,lit*.8);
      ctx.strokeStyle=T.bg;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1;
    }
    // corner seam — one crisp line where this face meets the previous one
    ctx.globalAlpha=Math.min(1,lit+.2);ctx.strokeStyle=T.line;
    ctx.beginPath();ctx.moveTo(xa+.5,tA);ctx.lineTo(xa+.5,bA);ctx.stroke();
    ctx.globalAlpha=1;
  }

  function draw(){
    const px=camx,py=camy,hz=H/2+bob;
    ctx.fillStyle=T.bg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=T.soft;ctx.fillRect(0,hz,W,H-hz);
    ctx.strokeStyle=T.line;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,hz+.5);ctx.lineTo(W,hz+.5);ctx.stroke();

    cast(px,py,ang);
    let a=0;
    while(a<NX-1){
      let b=a;
      while(b+1<NX&&fmx[b+1]===fmx[a]&&fmy[b+1]===fmy[a]&&fsd[b+1]===fsd[a])b++;
      const rb=b+1<NX?b+1:b;
      let dB=fdd[b];
      if(rb>b){
        // extrapolate this face's own plane out to the shared corner, so
        // neighbouring quads meet exactly and leave no seam
        const e=fsd[a]===0?(fpc[a]-px)/rdx[rb]:(fpc[a]-py)/rdy[rb];
        if(e>.03&&e<80)dB=e;
      }
      drawFace(a,fdd[a],rb,dB,fsd[a],fmx[a],fmy[a],px,py,hz);
      a=b+1;
    }

    const mw=mini.width,mh=mini.height,ox=W-mw-10,oy=10;
    ctx.globalAlpha=.9;ctx.drawImage(mini,ox,oy);ctx.globalAlpha=1;
    ctx.strokeStyle=T.line;ctx.strokeRect(ox-.5,oy-.5,mw+1,mh+1);
    ctx.fillStyle=T.ink;ctx.fillRect(ox+px*3-1.5,oy+py*3-1.5,3,3);
    ctx.strokeStyle=T.ink;ctx.beginPath();
    ctx.moveTo(ox+px*3,oy+py*3);
    ctx.lineTo(ox+px*3+Math.cos(ang)*6,oy+py*3+Math.sin(ang)*6);
    ctx.stroke();

    ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='left';
    ctx.fillStyle=T.muted;ctx.fillText('level '+level,10,18);
    if(demo){
      ctx.fillStyle=T.overlay;ctx.fillRect(0,H-44,W,44);
      ctx.textAlign='center';
      ctx.font='700 13px "IBM Plex Mono",monospace';ctx.fillStyle=T.ink;
      ctx.fillText('screensaver mode',W/2,H-25);
      ctx.font='11px "IBM Plex Mono",monospace';ctx.fillStyle=T.muted;
      ctx.fillText('press a key or tap to take the controls',W/2,H-9);
    }else{
      ctx.fillStyle=timeLeft<10?T.accent:T.muted;
      ctx.fillText('time '+Math.ceil(timeLeft),10,34);
    }
  }

  newLevel();

  return {
    key(k,down){
      if(!down){held[k]=false;return}
      if(isOver())return;
      if(demo){takeControl();return}
      held[k]=true;
      if(mv)queued=k;else act(k);
    },
    pointer(x,y,type){
      if(type!=='down'||isOver())return;
      if(demo){takeControl();return}
      const k=x<W*.3?'ArrowLeft':x>W*.7?'ArrowRight':'ArrowUp';
      if(mv)queued=k;else act(k);
    },
    tick(dt){
      if(!isOver()){
        pose(dt);
        if(!mv){
          if(demo){
            rest-=dt;
            if(rest<=0){drift();rest=DEMO_REST}
          }
          else{const k=queued||heldKey();queued=null;if(k)act(k)}
        }
        if(!demo){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;gameOver()}}
      }
      draw();
    }
  };
}
