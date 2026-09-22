// games/catmario/engine.js — the rules of Syobon Action, and nothing else.
//
// GENERATED — a mechanical translation of Mainprogram() and the stage loader
// from Open Syobon Action's main.cpp (Chiku's 2007 game, ported to SDL by
// Mathew Velasquez). Every trap in the game is hard-coded in that loop rather
// than described by data, so the only honest way to keep all nine stages
// intact is to keep the loop. What changed on the way over:
//   · globals live on one object, g, which the renderer reads directly
//   · C integer division is kept as (a / b | 0) — positions are fixed-point
//     hundredths of a pixel and the collision maths depends on truncation
//   · drawing, sleeping, music and joystick calls are gone; input is hit(name)
//     and sound is snd(n), both supplied by the caller
//   · the 17 stage grids are sparse base-36 strings instead of 17×1001 arrays
// Hand edits here will be lost if it is regenerated; the per-frame glue that
// rpaint() used to do lives in ../catmario.js.

// Stage grids: rows joined by '|', cells "col:value[*run]" in base 36.
const GRIDS = [
  "|1s:2a|m:2a,34:2q,3f:2r|6:2a,1g:1e||e:2q,1d:2q*3,1g:1*2,1l:1*3,22:2,2v:2q,37:4*2|2h:7,36:4*3|1c:1e,1u:u,35:4*4|z:2q,34:4*5|8:2q,c:1,d:2q,e:1,f:2,g:1,14:7,1a:1,1b:2q,1c:1,1n:2q,1u:1,1v:2q,1z:2,22:2,25:2,2r:1*2,2t:2,2u:1,33:4*6|1:28,d:7,k:14,x:28,2c:4,2g:4,2i:7*5,2n:14,32:4*7,3k:2b|k:15,2b:4*2,2g:4*2,2n:15,2y:14,31:4*8|a:1e,g:1e,j:29,k:15,q:29,r:2q,1a:29,1p:1e,1r:1e,1u:1f,26:29,2a:4*3,2g:4*2,2n:15,2t:1e,2v:1e,2y:15,30:4*9,3f:4,3g:29|0:5*14,17:5*b,1l:5*f,25:5*8,2g:5*6,2n:5*16,3u:5*7|0:6*14,17:6*b,1l:6*f,25:6*8,2g:6*6,2n:6*16,3u:6*8|",
  "||||||||b:7,g:7||1:2b|d:18||0:5*14,17:5*b,1l:5*f,25:5*8,2g:5*6,2n:5*16,3u:5*7|0:6*14,17:6*b,1l:6*f,25:6*8,2g:6*6,2n:6*16,3u:6*8|",
  "43:2p|0:1,4:1*1c,1h:1,1t:1,23:1,24:4*9,2d:1*o,3d:1*a,3n:2q,3p:1*l,4d:1|0:1,2c:4,3p:1*8,4d:1|0:1,2c:4,3p:1*8,4d:1|0:1,2c:4,3p:1*8,4d:1|0:1,q:7,27:2,2c:4,3p:1*8,4d:1|0:1,2c:4,3p:1*8,4d:1|0:1,3l:2p,3m:18,3p:1*8,4d:1|0:1,j:7,29:1,2c:1i,2e:1,30:2p,3f:7*5,3p:1*8,4d:1|0:1,7:2q,8:2*2,a:2q,k:4,l:7*4,p:4,1d:2q,29:1,2a:4*4,2e:1*2,3d:1*2,3k:1*d,4d:1|0:1,k:4,p:4,r:4,t:1f,20:7,28:1*2,2a:4*4,2e:1*3,30:1,3d:1*2,3k:1*d,4d:1|0:1,g:4,i:4,k:4,p:4,r:4,t:4,1i:14,1p:u,27:1*3,2a:4*4,2e:1*4,2o:1,2z:1*2,3d:1*2,3k:1*d,4d:1|0:1,2:7,a:1e,c:1e,e:4,g:4,i:4,k:4,m:1e,p:4,r:4,t:4,v:4,10:1e*3,13:7,1i:15,26:1*4,2a:4*4,2e:1*5,2n:1*3,2y:1*3,3d:1*2,3k:1*d,4d:1|0:5*2,3:5*l,p:5*i,1a:5*3,1g:5*6,1o:5*2,1u:5*6,23:5*y,3d:1*2,3k:1*d,3x:5*h|0:6*2,3:6*l,p:6*i,1a:6*3,1g:6*6,1o:6*2,1u:6*6,23:6*y,3d:1*2,3k:1*d,3x:6*h|",
  "|1:2a|q:2r,10:2a|||c:4*2|b:4*3|a:4*4|9:4*5|8:4*6|7:4*7,v:2b|2:14,6:4*8|2:15,5:4*g,q:1,11:29|0:5*1i,1l:5*f,25:5*8,2g:5*6,2n:5*16,3u:5*7|0:6*1i,1l:6*f,25:6*8,2g:6*6,2n:6*16,3u:6*8|",
  "33:2p,39:2p|9:2a,s:2p,1c:2c,2o:1l,2s:2c,3d:2c|q:1i,1v:2a,2d:2c,3k:1f,3o:2c,3u:2r,41:2a|q:1*4|3g:1,3m:1|1l:1,2h:2p,2o:1l,2w:2p,3e:1m|1l:1,2h:1*3|1l:1|1l:1,2c:1k,32:u|i:7,1l:1,1o:1,1q:2,2k:2c,3h:1*5|1:2b,z:2c,1l:1,2b:4*2,32:1*5,3z:2b|h:2p,1e:2p,1l:1,1p:u,1w:2d*2,25:2p,2a:4*3|5:29,f:29,1f:29,1k:1*2,1r:29,1w:1e,1y:1e,29:4*4,3r:29,3u:4|0:5*9,c:5*6,l:5*3,r:5*3,1e:5*8,1p:5*d,25:5*8,3q:5*d|0:6*9,c:6*6,l:6*3,r:6*3,1e:6*8,1p:6*d,25:6*8,3q:6*d|",
  "|0:1,3:1*e|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,g:1|0:1,1:1i,3:1i,5:1i,7:1i,9:1i,b:1i,d:1i,f:1i,g:1|0:5*g,g:1,h:8*4|0:6*g,g:1|",
  "||||||||2:9,4:9,6:9,8:9,a:9|3:9,5:9,7:9,9:9|2:9,4:9,6:9,8:9,a:9|||0:8*e,g:8*5||",
  "0:5*3,7:5*4,j:5|0:5*3,7:5*4,j:5,14:5*x,25:5*f,2k:7*4,2o:5*4,31:5*e,3l:5*m,4a:5*j|0:5*3,a:5,j:5,1b:5,1u:5*7,46:5,4p:5|a:5,j:5,1b:5,1u:5*6,2h:1o,2r:1o,46:5,4p:5|a:5,1b:5,1y:5*2,2d:3,2r:1o,46:5,4p:5|1b:5,1y:5*2,2c:5*2,2l:1o,2r:1o,46:5,4p:5|1b:5,1y:5,2a:1e,2c:5,2f:5,2r:1o,46:5,4p:5|s:5,t:3,u:5,1b:5,1y:5,23:u,2a:5*3,2f:5,2r:1o,32:2,46:5,4p:5|n:5*2,1b:5,1y:5,2f:5*2,2n:7,2r:1o,46:5,4p:5|14:5*4,1b:3,1f:5*2,1m:7*2,1o:2*2,1q:7,1r:5*4,1y:3,23:5*4,2f:5*5,2o:5*4,3o:5*2,46:5,4p:5|f:5,l:1n,14:5*4,1f:5*5,1r:5*4,23:5*4,2f:5*5,2o:5*4,39:5*2,3o:5*2,46:5,4p:5|7:5*3,f:5*2,14:5*4,1f:5*5,1r:5*4,22:5*5,2f:5*5,2o:5*4,2y:5*9,39:5*2,3o:5*2,46:5,4p:5|7:5*3,f:5*5,12:1n,14:5*4,1f:5*5,1l:1n,1r:5*4,22:5*5,2f:5*5,2o:5*4,2x:5*a,39:5*2,3o:5*2,44:14,46:5,4p:5|7:5*3,f:5*5,14:5*g,1o:5*d,22:5*5,2d:5*7,2o:5*4,2x:5*a,39:5*2,3o:5*g,44:15,46:5*k|7:5*3,a:2e,d:2e,f:5*5,k:2e,n:2e,q:2e,t:2e,w:2e,z:2e,12:2e,14:5*g,1k:2e,1n:2e,1o:5*d,21:2e,22:5*5,27:2e,2a:2e,2d:5*7,2k:2e,2n:2e,2o:5*4,2s:2e,2v:2e,2x:5*a,37:2e,39:5*2,3b:2e,3e:2e,3h:2e,3k:2e,3n:2e,3o:5*g,44:15,46:5*l|",
  "7:4,2d:4|7:4,1s:2a,21:4,2d:4|7:4,21:4*2,25:4,28:4,2d:4,2g:2a,2w:2r|7:4,12:4*4,17:2a,28:4,2d:4|7:4,n:4*2,y:4,12:4,17:4*4,1b:1*4,1i:1*4,1y:4,28:4,2d:4|7:4,k:4*2,r:4*2,z:4*3,1i:1*4,1y:4*4,28:4,2d:4,2n:4*2|7:4,h:4*3,1i:1*4,1v:4,1y:4,28:4,2d:4,2m:4*2|7:4,d:4,h:4,u:1*4,14:7,1i:1*4,1o:4*5,1v:4,1w:7*2,1y:4,28:4,29:2*2,2b:2q,2c:2,2d:4,2l:4*3|7:4,e:4*3,1i:a*4,1o:a*4,1s:4,1t:1*2,1v:4,2d:4,2k:4*4,2v:7,2x:4*8|7:4,e:4,14:2q,2d:4,2j:4*6|7:4,8:7*3,b:4*3,i:28,x:28,1h:28,2d:4,2i:4*6|2d:4,2e:7,2h:4*7|5:29,q:29,1a:29,1e:29,1n:1e,1q:1e,1t:1e,1u:29,26:29,2d:4,2g:4*8,2w:4|0:5*2,4:5*q,y:5*6,19:5*13,2f:5*a,2v:5*2,32:5*3|0:6*2,4:6*q,y:6*6,19:6*13,2f:6*a,2v:6*2,32:6*3|",
  "||9:2a|||||||c:7*2|1:28|||0:5*7,e:5*3|0:6*7,e:6*3|",
  "7:4*o,2u:4*c,36:2q,37:4*6,3g:4*a,3q:2q,3r:1|0:4,7:a*o,13:7,17:7,2u:a*b,37:1*6,3g:a*9,3r:1|0:4,y:7,37:1*6,3r:1|0:4,g:7,m:7,s:7,37:1*6,3r:1|0:4,1f:4*4,2d:1f,2k:7,37:1*6,3r:1|0:4,1f:a*4,2c:4*3,2s:4*2,37:1*6,3d:4*2,3r:1|0:4,12:3,16:3,1a:3,1g:u,2s:4*2,37:1*6,3d:4,3r:1|0:4,j:1l,p:1l,v:4*3,1n:4*7,23:1*3,2j:7,2s:a,2t:4,34:18,37:1*6,3d:4,3r:1|0:4,1f:4*3,2t:4,2z:7*3,33:2p,37:1*6,3d:4,3r:1|0:4,1:7*6,7:1*4,2t:4*2,2y:1,32:1*b,3d:4*2,3i:1*2,3o:18,3r:1|0:4,7:1*4,2t:4,2y:1,32:1*b,3d:4,3i:1*2,3n:2p,3r:1|0:4,7:1*4,2t:4,2y:1,32:1*b,3d:4,3i:1*2,3n:1*5|0:4,7:1*4,2t:4,2y:1,32:1*b,3d:4,3i:1*2,3n:1*5|0:5*2,2s:5*4,2y:1,32:1*b,3d:5*3,3i:1*2,3n:1*5|0:6*2,2s:6*4,2y:1,32:1*b,3d:6*3,3i:1*2,3n:1*5|",
  "|1:2a|r:2r||h:1e,i:1f|g:4*5|f:4*6|e:4*7|c:1e,d:4*8|c:4*9|b:4*a|2:14,a:4*b|2:15,9:4*c,r:4,x:1i|0:5*l,r:5*9|0:6*l,r:6*9|",
  "18:4*a,1j:4,25:4*c|l:2a,10:7,12:7,18:4*3,1p:2a,1w:1k,25:4,26:a*b,38:2r|z:1,11:1f,13:1,18:4*3,1t:1,1x:1,23:2a,25:4|6:2a,i:1e,y:7,z:1,13:1,14:7,18:4*3,25:4,2y:7|18:4*3,25:4,27:4|18:4*3,25:4,27:a,28:4*3,2c:1i,2e:1i,2g:4|s:1m,18:4*3,25:4,28:4,2b:4*6,2x:7|18:7,19:4,1a:7,25:4,28:4,2g:4,3a:1m|25:4,28:4,2g:4,2u:7,2y:7|25:4*2,28:4,2g:4,2v:7,2x:7|1i:1g,1n:4,1o:1*3,1r:4,25:a*2,28:4,2g:4,2w:4|19:7,1d:4,1i:4,1p:u,28:4,2g:4,2w:4|1n:7,1r:3,28:4,2g:4,2w:4,38:4|b:1*2,1m:5*7,28:4,2g:4,2v:5*3,38:5*2,3b:5*5|1m:6*7,25:4*4,2g:4,2v:6*3,38:6*2,3b:6*5|",
  "0:5,4:5*y|0:5*7,9:7,h:a,l:a*3,u:5*8|0:5*7,s:7*2,u:a*3,x:5*5|0:5,6:5,r:5,10:5*2|0:5,6:5,c:7,r:5,10:5*2|0:5*9,d:5*4,h:7*3,k:3,l:7,n:7,o:5,r:5*3,v:1m,x:5,10:5*2|0:5*9,d:5*4,o:5,r:5*3,x:5*5|0:5*7,f:5*2,o:5,r:5*3,x:5*5|0:5*7,f:5*2,o:5,r:5*3,x:5*5|0:5*7,d:5*4,o:5,r:5*3,x:5*5|0:5*7,d:5*4,o:5,r:5*3,x:5*5|0:5,a:1n*2,d:5*4,o:5,t:5,u:1n,x:5*5|0:5,d:5*4,o:5,t:5,x:5*5|0:5*6,6:14,8:5,d:5*4,o:5,t:5,v:1n,x:5*5|0:5,1:2e,2:5*4,6:15,8:5,9:2e,c:2e,d:5*4,h:2e,k:2e,n:2e,o:5,q:2e,r:5*3,u:2e,x:5*5|a:1n*2,w:1n",
  "0:5*i,i:2q|8:5|8:5|8:5|8:5|3:7*2,8:5|5:5,8:5|5:5,a:7|5:5,b:5|1:5*2,5:5,b:5|1:a*2,5:5,b:5|5:5,b:5,g:18|5:5,b:5,f:2p|1:14,5:5,b:5,f:5*4|0:2e,1:15,3:2e,5:5,6:2e,9:2e,b:5,c:2e,f:2e,i:2e|",
  "0:5*3,4:5*9,o:5*2x|0:5,6:5,9:5,c:5,16:5,1b:5,1h:5,1x:1o,2i:5*4|0:5,6:5,9:5,c:5,16:5,1b:5,1h:5,1x:1o,2i:5*4|0:5,6:5,9:5,c:5,16:5,1b:5,1d:5*3,1h:5,1x:1o,2i:5*3|0:5,6:5,9:5,c:5,m:7*2,o:5*3,11:5*3,16:5,19:5,1b:5,1d:a*2,1f:5,1h:5,1x:1o,24:5*3,2i:5*3|0:5,6:5,o:5*3,11:5,16:5,19:5,1b:5,1f:5,1h:5,1o:5,24:5*3,2i:5*2|0:5,6:5,o:5*3,11:5,16:5,17:3,19:5,1b:3,1f:5,1h:5,1o:5,24:5*3,2i:5*2|0:5,6:5,o:5*3,11:5,16:5,19:5,1b:5*3,1f:5,1h:5,1o:5,21:7*3,24:5*3,2i:5|0:3,3:3,6:3,7:7,9:3,a:7*2,c:5,o:5*3,11:5,13:5,15:5,19:5,1b:5,1c:a*2,1f:5,1h:5,1o:5,1s:5,24:5*3,27:7*2,2i:5|0:5,3:5,9:5,c:5,o:5*4,10:5*2,19:5,1b:5,1f:5,1h:5,1i:7,1o:5,1s:5,2g:3|0:5,3:5,9:5,c:5,o:5*3,11:5,19:5,1d:u,1f:5,1m:7*2,1o:5,1s:5,2g:5|0:5,3:5,9:5,c:5,11:5,13:5*4,19:5,1c:7,1f:5,1l:5,1o:5,1s:5,1w:5*5,24:5*3,2a:5*3,2g:5,31:5*k|0:5,3:5,9:5,c:5,11:5,19:5,1d:5,1f:5,1l:5,1o:5,1s:5,1t:1n,1v:1n,1w:5*5,24:5*3,2g:5*9,31:5*k|0:5,1:14,3:5,6:5,9:5,c:5,o:5*3,11:5,19:5,1d:5,1f:5,1h:5,1l:5,1o:5,1s:5,1u:1n,1w:5*5,24:5*3,2g:5*9,31:5*k|0:5,1:15,3:5,4:2e,6:5,7:2e,9:5*4,d:2e,g:2e,j:2e,m:2e,p:2e,s:2e,v:2e,y:2e,11:5,12:2e,15:2e,18:2e,19:5,1b:2e,1d:5,1e:2e,1f:5,1h:5,1i:2e,1l:5*4,1p:2e,1s:5,1t:2e,1u:1n,1w:5*5,21:2e,24:2e,25:5*2,27:2e,2a:2e,2d:2e,2g:5*9,2p:2e,2s:2e,2v:2e,2y:2e,31:5*k|18:1n,1e:1n,1g:1n,1t:1n,1v:1n",
  "x:4,17:7,28:4,2d:4|x:4,1s:2a,28:4,2d:4|x:4,28:4,2d:4,2e:7*e,2s:2r|6:2a,x:4*3,10:7,12:4*3,28:4,29:7*4,2d:4,2g:2a|x:4,y:a*2,12:a*2,14:4,23:4*4,28:4,2d:4,2v:4|3:7,x:4,11:7,14:4,26:4,28:4,2d:4,2n:4*2|x:4,14:4,26:4,28:4,2d:4,2m:4*2|x:4,14:4,26:3,28:3,29:4*5,2l:4*3|x:4,y:7,z:4*4,14:4,26:4,28:4*6,2k:4*4,2r:4,2t:7*2,2v:4*4,30:4*7|3:7,g:7,x:4,14:4,23:7,26:4,28:4*6,2j:4*6,30:4*7|14:4,26:4,28:4*6,2i:4*6,30:4*7|14:4,1r:u,26:4,2h:4*7,30:4*7|l:1,n:1f,o:1,q:29,t:1*5,y:7,14:4,26:4,2d:7,2g:4*8,2s:4,30:4*7|2:5,l:5*d,13:5*2,1q:1,1t:1,22:5,26:5*6,2e:7,2f:5*e,2v:5*c|2:6,l:6*d,13:6*2,22:6,26:6*6,2f:6*e,2v:6*c|"
];

// Hitbox (and sprite) size per enemy type, in pixels — the original read these
// off its sprite sheets at load time.
const SIZES = {0:[30,30],1:[30,43],2:[30,30],3:[30,44],4:[33,35],5:[37,55],6:[36,50],7:[32,32],8:[37,47],9:[26,30],10:[46,16],30:[30,36],31:[49,79],79:[120,15],80:[70,40],81:[70,40],82:[30,30],83:[49,48],84:[30,30],85:[25,300],86:[49,59],90:[64,63],100:[30,30],101:[30,30],102:[30,30],105:[30,30],110:[30,30],130:[70,40]};

const smax = 31, tmax = 641, emax = 201, amax = 24, bmax = 81, nmax = 41, srmax = 21;

export function createEngine(io) {
  const hit = io.hit, snd = io.snd, bgm = io.bgm;
  const trunc = Math.trunc;
  const rnd = (n) => Math.floor(Math.random() * n);

  const g = {
    mainZ: 100,
    maintm: 0,
    stagecolor: 1,
    sta: 1,
    stb: 4,
    stc: 0,
    fast: 1,
    trap: 1,
    tyuukan: 0,
    ending: 0,
    stagerr: 0,
    stagepoint: 0,
    over: 0,
    stageonoff: 0,
    maint: 0,
    t: 0,
    tt: 0,
    t1: 0,
    t2: 0,
    t3: 0,
    t4: 0,
    zxon: 0,
    zzxon: 0,
    key: 0,
    keytm: 0,
    sx: 0,
    sco: 0,
    sa: new Int32Array(31),
    sb: new Int32Array(31),
    sc: new Int32Array(31),
    sd: new Int32Array(31),
    stype: new Int32Array(31),
    sxtype: new Int32Array(31),
    sr: new Int32Array(31),
    sgtype: new Int32Array(31),
    mainmsgtype: 0,
    ma: 0,
    mb: 0,
    mnobia: 0,
    mnobib: 0,
    mhp: 0,
    mc: 0,
    md: 0,
    macttype: 0,
    atkon: 0,
    atktm: 0,
    mactsok: 0,
    msstar: 0,
    nokori: 3,
    mactp: 0,
    mact: 0,
    mtype: 0,
    mxtype: 0,
    mtm: 0,
    mzz: 0,
    mzimen: 0,
    mrzimen: 0,
    mkasok: 0,
    mmuki: 0,
    mmukitm: 0,
    mjumptm: 0,
    mkeytm: 0,
    mcleartm: 0,
    mmutekitm: 0,
    mmutekion: 0,
    mztm: 0,
    mztype: 0,
    actaon: new Int32Array(7),
    mmsgtm: 0,
    mmsgtype: 0,
    mascrollmax: 21000,
    tco: 0,
    ta: new Int32Array(641),
    tb: new Int32Array(641),
    tc: new Int32Array(641),
    td: new Int32Array(641),
    thp: new Int32Array(641),
    ttype: new Int32Array(641),
    titem: new Int32Array(641),
    txtype: new Int32Array(641),
    tmsgtm: 0,
    tmsgtype: 0,
    tmsgx: 0,
    tmsgy: 0,
    tmsgnobix: 0,
    tmsgnobiy: 0,
    tmsg: 0,
    eco: 0,
    ea: new Int32Array(201),
    eb: new Int32Array(201),
    enobia: new Int32Array(201),
    enobib: new Int32Array(201),
    ec: new Int32Array(201),
    ed: new Int32Array(201),
    ee: new Int32Array(201),
    ef: new Int32Array(201),
    etm: new Int32Array(201),
    egtype: new Int32Array(201),
    aco: 0,
    aa: new Int32Array(24),
    ab: new Int32Array(24),
    anobia: new Int32Array(24),
    anobib: new Int32Array(24),
    ac: new Int32Array(24),
    ad: new Int32Array(24),
    ae: new Int32Array(24),
    af: new Int32Array(24),
    abrocktm: new Int32Array(24),
    aacta: new Int32Array(24),
    aactb: new Int32Array(24),
    azimentype: new Int32Array(24),
    axzimen: new Int32Array(24),
    atype: new Int32Array(24),
    axtype: new Int32Array(24),
    amuki: new Int32Array(24),
    ahp: new Int32Array(24),
    anotm: new Int32Array(24),
    anx: new Int32Array(160),
    any: new Int32Array(160),
    atm: new Int32Array(24),
    a2tm: new Int32Array(24),
    amsgtm: new Int32Array(24),
    amsgtype: new Int32Array(24),
    bco: 0,
    ba: new Int32Array(81),
    bb: new Int32Array(81),
    btm: new Int32Array(81),
    btype: new Int32Array(81),
    bxtype: new Int32Array(81),
    bz: new Int32Array(81),
    nxxmax: 0,
    nco: 0,
    na: new Int32Array(41),
    nb: new Int32Array(41),
    nc: new Int32Array(41),
    nd: new Int32Array(41),
    ntype: new Int32Array(41),
    ne: new Int32Array(41),
    nf: new Int32Array(41),
    ng: new Int32Array(41),
    nx: new Int32Array(41),
    srco: 0,
    sra: new Int32Array(21),
    srb: new Int32Array(21),
    src: new Int32Array(21),
    srd: new Int32Array(21),
    sre: new Int32Array(21),
    srf: new Int32Array(21),
    srtype: new Int32Array(21),
    srgtype: new Int32Array(21),
    sracttype: new Int32Array(21),
    srsp: new Int32Array(21),
    srmuki: new Int32Array(21),
    sron: new Int32Array(21),
    sree: new Int32Array(21),
    srsok: new Int32Array(21),
    srmovep: new Int32Array(21),
    srmove: new Int32Array(21),
    fx: 0,
    fy: 0,
    fzx: 0,
    fzy: 0,
    scrollx: 0,
    scrolly: 0,
    fmb: 0,
    kscroll: 0,
    fxmax: 48000,
    fymax: 42000,
    stagedate: Array.from({ length: 17 }, () => new Uint8Array(2001)),
    blacktm: 1,
    blackx: 0,
    xx: new Int32Array(91),
    xd: new Float64Array(11),
    fma: 0
  };
  for (const k in SIZES) { g.anx[k] = SIZES[k][0] * 100; g.any[k] = SIZES[k][1] * 100; }

  const gridCache = [];
  function GRID(i) {
    if (gridCache[i]) return gridCache[i];
    const rows = Array.from({ length: 17 }, () => new Uint8Array(1001));
    GRIDS[i].split('|').forEach((row, r) => {
      if (!row) return;
      for (const cell of row.split(',')) {
        const [c, rest] = cell.split(':'), [v, n] = rest.split('*');
        const c0 = parseInt(c, 36), val = parseInt(v, 36), len = n ? parseInt(n, 36) : 1;
        rows[r].fill(val, c0, c0 + len);
      }
    });
    return (gridCache[i] = rows);
  }

  function Mainprogram() {
    if (g.ending == 1) g.mainZ = 2;
    if (g.mainZ == 1 && g.tmsgtype == 0) {
      if (g.zxon == 0) {
        g.zxon = 1;
        g.mainmsgtype = 0;
        g.stagecolor = 1;
        g.ma = 5600;
        g.mb = 32000;
        g.mmuki = 1;
        g.mhp = 1;
        g.mc = 0;
        g.md = 0;
        g.mnobia = 3000;
        g.mnobib = 3600;
        g.mtype = 0;
        g.fx = 0;
        g.fy = 0;
        g.fzx = 0;
        g.stageonoff = 0;
        bgm(1);
        stagecls();
        stage();
        if (g.over == 1) {
          for (g.t = 0; g.t < tmax; g.t++) {
            if (rnd(3) <= 1) {
              g.ta[g.t] = (rnd(500) - 1) * 29 * 100;
              g.tb[g.t] = rnd(14) * 100 * 29 - 1200;
              g.ttype[g.t] = rnd(142);
              if (g.ttype[g.t] >= 9 && g.ttype[g.t] <= 99) {
                g.ttype[g.t] = rnd(8);
              }
              g.txtype[g.t] = rnd(4);
            }
          }
          for (g.t = 0; g.t < bmax; g.t++) {
            if (rnd(2) <= 1) {
              g.ba[g.t] = (rnd(500) - 1) * 29 * 100;
              g.bb[g.t] = rnd(15) * 100 * 29 - 1200 - 3000;
              if (rnd(6) == 0) {
                g.btype[g.t] = rnd(9);
              }
            }
          }
          g.srco = 0;
          g.t = g.srco;
          g.sra[g.t] = g.ma + g.fx;
          g.srb[g.t] = (13 * 29 - 12) * 100;
          g.src[g.t] = 30 * 100;
          g.srtype[g.t] = 0;
          g.sracttype[g.t] = 0;
          g.sre[g.t] = 0;
          g.srsp[g.t] = 0;
          g.srco++;
          if (rnd(4) == 0) g.stagecolor = rnd(5);
        }
      }
      g.xx[0] = 0;
      g.actaon[2] = 0;
      g.actaon[3] = 0;
      if (g.mkeytm <= 0) {
        if (hit("LEFT") && g.keytm <= 0) {
          g.actaon[0] = -1;
          g.mmuki = 0;
          g.actaon[4] = -1;
        }
        if (hit("RIGHT") && g.keytm <= 0) {
          g.actaon[0] = 1;
          g.mmuki = 1;
          g.actaon[4] = 1;
        }
        if (hit("DOWN")) {
          g.actaon[3] = 1;
        }
      }
      if (hit("F1") == 1) {
        g.mainZ = 100;
      }
      if (hit("O") == 1) {
        if (g.mhp >= 1) g.mhp = 0;
        if (g.stc >= 5) {
          g.stc = 0;
          g.stagepoint = 0;
        }
      }
      if (g.mkeytm <= 0) {
        if (hit("Z") == 1 || hit("UP") == 1 || false) {
          if (g.actaon[1] == 10) {
            g.actaon[1] = 1;
            g.xx[0] = 1;
          }
          g.actaon[2] = 1;
        }
      }
      if (hit("Z") == 1 || hit("UP") == 1 || false) {
        if (g.mjumptm == 8 && g.md >= -900) {
          g.md = -1300;
          g.xx[22] = 200;
          if (g.mc >= g.xx[22] || g.mc <= -g.xx[22]) {
            g.md = -1400;
          }
          g.xx[22] = 600;
          if (g.mc >= g.xx[22] || g.mc <= -g.xx[22]) {
            g.md = -1500;
          }
        }
        if (g.xx[0] == 0) g.actaon[1] = 10;
      }
      g.xx[0] = 40;
      g.xx[1] = 700;
      g.xx[8] = 500;
      g.xx[9] = 700;
      g.xx[12] = 1;
      g.xx[13] = 2;
      if (g.mrzimen == 1) {
        g.xx[0] = 20;
        g.xx[12] = 9;
        g.xx[13] = 10;
      }
      if (g.actaon[0] == -1) {
        if (!(g.mzimen == 0 && g.mc < -g.xx[8])) {
          if (g.mc >= -g.xx[9]) {
            g.mc -= g.xx[0];
            if (g.mc < -g.xx[9]) {
              g.mc = -g.xx[9] - 1;
            }
          }
          if (g.mc < -g.xx[9] && g.atktm <= 0) g.mc -= g.xx[0] / 10 | 0;
        }
        if (g.mrzimen != 1) {
          if (g.mc > 100 && g.mzimen == 0) {
            g.mc -= g.xx[0] * 2 / 3 | 0;
          }
          if (g.mc > 100 && g.mzimen == 1) {
            g.mc -= g.xx[0];
            if (g.mzimen == 1) {
              g.mc -= g.xx[0] * 1 / 2 | 0;
            }
          }
          g.actaon[0] = 3;
          g.mkasok += 1;
        }
      }
      if (g.actaon[0] == 1) {
        if (!(g.mzimen == 0 && g.mc > g.xx[8])) {
          if (g.mc <= g.xx[9]) {
            g.mc += g.xx[0];
            if (g.mc > g.xx[9]) {
              g.mc = g.xx[9] + 1;
            }
          }
          if (g.mc > g.xx[9] && g.atktm <= 0) g.mc += g.xx[0] / 10 | 0;
        }
        if (g.mrzimen != 1) {
          if (g.mc < -100 && g.mzimen == 0) {
            g.mc += g.xx[0] * 2 / 3 | 0;
          }
          if (g.mc < -100 && g.mzimen == 1) {
            g.mc += g.xx[0];
            if (g.mzimen == 1) {
              g.mc += g.xx[0] * 1 / 2 | 0;
            }
          }
          g.actaon[0] = 3;
          g.mkasok += 1;
        }
      }
      if (g.actaon[0] == 0 && g.mkasok > 0) {
        g.mkasok -= 2;
      }
      if (g.mkasok > 8) {
        g.mkasok = 8;
      }
      if (g.mzimen != 1) g.mrzimen = 0;
      if (g.mjumptm >= 0) g.mjumptm--;
      if (g.actaon[1] == 1 && g.mzimen == 1) {
        g.mb -= 400;
        g.md = -1200;
        g.mjumptm = 10;
        snd(1);
        g.mzimen = 0;
      }
      if (g.actaon[1] <= 9) g.actaon[1] = 0;
      if (g.mmutekitm >= -1) g.mmutekitm--;
      if (g.mhp <= 0 && g.mhp >= -9) {
        g.mkeytm = 12;
        g.mhp = -20;
        g.mtype = 200;
        g.mtm = 0;
        snd(0);
        bgm(0);
        snd(12);
        void 0;
      }
      if (g.mtype == 200) {
        if (g.mtm <= 11) {
          g.mc = 0;
          g.md = 0;
        }
        if (g.mtm == 12) {
          g.md = -1200;
        }
        if (g.mtm >= 12) {
          g.mc = 0;
        }
        if (g.mtm >= 100 || g.fast == 1) {
          g.zxon = 0;
          g.mainZ = 10;
          g.mtm = 0;
          g.mkeytm = 0;
          g.nokori--;
          if (g.fast == 1) g.mtype = 0;
        }
      }
      if (g.mtype == 2) {
        g.mtm++;
        g.mkeytm = 2;
        g.md = -1500;
        if (g.mb <= -6000) {
          g.blackx = 1;
          g.blacktm = 20;
          g.stc += 5;
          g.stagerr = 0;
          bgm(0);
          g.mtm = 0;
          g.mtype = 0;
          g.mkeytm = -1;
        }
      }
      if (g.mtype == 3) {
        g.md = -2400;
        if (g.mb <= -6000) {
          g.mb = -80000000;
          g.mhp = 0;
        }
      }
      if (g.mtype >= 100) {
        g.mtm++;
        if (g.mtype == 100) {
          if (g.mxtype == 0) {
            g.mc = 0;
            g.md = 0;
            g.t = 28;
            if (g.mtm <= 16) {
              g.mb += 240;
              g.mzz = 100;
            }
            if (g.mtm == 17) {
              g.mb = -80000000;
            }
            if (g.mtm == 23) {
              g.sa[g.t] -= 100;
            }
            if (g.mtm >= 44 && g.mtm <= 60) {
              if (g.mtm % 2 == 0) g.sa[g.t] += 200;
              if (g.mtm % 2 == 1) g.sa[g.t] -= 200;
            }
            if (g.mtm >= 61 && g.mtm <= 77) {
              if (g.mtm % 2 == 0) g.sa[g.t] += 400;
              if (g.mtm % 2 == 1) g.sa[g.t] -= 400;
            }
            if (g.mtm >= 78 && g.mtm <= 78 + 16) {
              if (g.mtm % 2 == 0) g.sa[g.t] += 600;
              if (g.mtm % 2 == 1) g.sa[g.t] -= 600;
            }
            if (g.mtm >= 110) {
              g.sb[g.t] -= g.mzz;
              g.mzz += 80;
              if (g.mzz > 1600) g.mzz = 1600;
            }
            if (g.mtm == 160) {
              g.mtype = 0;
              g.mhp--;
            }
          } else if (g.mxtype == 10) {
            g.mc = 0;
            g.md = 0;
            if (g.mtm <= 16) {
              g.ma += 240;
            }
            if (g.mtm == 16) g.mb -= 1100;
            if (g.mtm == 20) snd(10);
            if (g.mtm >= 24) {
              g.ma -= 2000;
              g.mmuki = 0;
            }
            if (g.mtm >= 48) {
              g.mtype = 0;
              g.mhp--;
            }
          } else {
            g.mc = 0;
            g.md = 0;
            if (g.mtm <= 16 && g.mxtype != 3) {
              g.mb += 240;
            }
            if (g.mtm <= 16 && g.mxtype == 3) {
              g.ma += 240;
            }
            if (g.mtm == 19 && g.mxtype == 2) {
              g.mhp = 0;
              g.mtype = 2000;
              g.mtm = 0;
              g.mmsgtm = 30;
              g.mmsgtype = 51;
            }
            if (g.mtm == 19 && g.mxtype == 5) {
              g.mhp = 0;
              g.mtype = 2000;
              g.mtm = 0;
              g.mmsgtm = 30;
              g.mmsgtype = 52;
            }
            if (g.mtm == 20) {
              if (g.mxtype == 6) {
                g.stc += 10;
              } else {
                g.stc++;
              }
              g.mb = -80000000;
              g.mxtype = 0;
              g.blackx = 1;
              g.blacktm = 20;
              g.stagerr = 0;
              bgm(0);
            }
          }
        }
        if (g.mtype == 300) {
          g.mkeytm = 3;
          if (g.mtm <= 1) {
            g.mc = 0;
            g.md = 0;
          }
          if (g.mtm >= 2 && g.mtm <= 42) {
            g.md = 600;
            g.mmuki = 1;
          }
          if (g.mtm > 43 && g.mtm <= 108) {
            g.mc = 300;
          }
          if (g.mtm == 110) {
            g.mb = -80000000;
            g.mc = 0;
          }
          if (g.mtm == 250) {
            g.stb++;
            g.stc = 0;
            g.zxon = 0;
            g.tyuukan = 0;
            g.mainZ = 10;
            g.maintm = 0;
          }
        }
        if (g.mtype == 301 || g.mtype == 302) {
          g.mkeytm = 3;
          if (g.mtm <= 1) {
            g.mc = 0;
            g.md = 0;
          }
          if (g.mtm >= 2 && (g.mtype == 301 && g.mtm <= 102 || g.mtype == 302 && g.mtm <= 60)) {
            g.xx[5] = 500;
            g.ma -= g.xx[5];
            g.fx += g.xx[5];
            g.fzx += g.xx[5];
          }
          if ((g.mtype == 301 || g.mtype == 302) && g.mtm >= 2 && g.mtm <= 100) {
            g.mc = 250;
            g.mmuki = 1;
          }
          if (g.mtm == 200) {
            snd(17);
            if (g.mtype == 301) {
              g.na[g.nco] = 117 * 29 * 100 - 1100;
              g.nb[g.nco] = 4 * 29 * 100;
              g.ntype[g.nco] = 101;
              g.nco++;
              if (g.nco >= nmax) g.nco = 0;
              g.na[g.nco] = 115 * 29 * 100 - 1100;
              g.nb[g.nco] = 6 * 29 * 100;
              g.ntype[g.nco] = 102;
              g.nco++;
              if (g.nco >= nmax) g.nco = 0;
            } else {
              g.na[g.nco] = 157 * 29 * 100 - 1100;
              g.nb[g.nco] = 4 * 29 * 100;
              g.ntype[g.nco] = 101;
              g.nco++;
              if (g.nco >= nmax) g.nco = 0;
              g.na[g.nco] = 155 * 29 * 100 - 1100;
              g.nb[g.nco] = 6 * 29 * 100;
              g.ntype[g.nco] = 102;
              g.nco++;
              if (g.nco >= nmax) g.nco = 0;
            }
          }
          if (g.mtm == 440) {
            if (g.mtype == 301) {
              g.ending = 1;
            } else {
              g.sta++;
              g.stb = 1;
              g.stc = 0;
              g.zxon = 0;
              g.tyuukan = 0;
              g.mainZ = 10;
              g.maintm = 0;
            }
          }
        }
      }
      if (g.mkeytm >= 1) {
        g.mkeytm--;
      }
      g.ma += g.mc;
      g.mb += g.md;
      if (g.mc < 0) g.mactp += -g.mc;
      if (g.mc >= 0) g.mactp += g.mc;
      if (g.mtype <= 9 || g.mtype == 200 || g.mtype == 300 || g.mtype == 301 || g.mtype == 302) g.md += 100;
      if (g.mtype == 0) {
        g.xx[0] = 800;
        g.xx[1] = 1600;
        if (g.mc > g.xx[0] && g.mc < g.xx[0] + 200) {
          g.mc = g.xx[0];
        }
        if (g.mc > g.xx[0] + 200) {
          g.mc -= 200;
        }
        if (g.mc < -g.xx[0] && g.mc > -g.xx[0] - 200) {
          g.mc = -g.xx[0];
        }
        if (g.mc < -g.xx[0] - 200) {
          g.mc += 200;
        }
        if (g.md > g.xx[1]) {
          g.md = g.xx[1];
        }
      }
      if (g.mzimen == 1 && g.actaon[0] != 3) {
        if (g.mtype <= 9 || g.mtype == 300 || g.mtype == 301 || g.mtype == 302) {
          if (g.mrzimen == 0) {
            g.xx[2] = 30;
            g.xx[1] = 60;
            g.xx[3] = 30;
            if (g.mc >= -g.xx[3] && g.mc <= g.xx[3]) {
              g.mc = 0;
            }
            if (g.mc >= g.xx[2]) {
              g.mc -= g.xx[1];
            }
            if (g.mc <= -g.xx[2]) {
              g.mc += g.xx[1];
            }
          }
          if (g.mrzimen == 1) {
            g.xx[2] = 5;
            g.xx[1] = 10;
            g.xx[3] = 5;
            if (g.mc >= -g.xx[3] && g.mc <= g.xx[3]) {
              g.mc = 0;
            }
            if (g.mc >= g.xx[2]) {
              g.mc -= g.xx[1];
            }
            if (g.mc <= -g.xx[2]) {
              g.mc += g.xx[1];
            }
          }
        }
      }
      g.mzimen = 0;
      if (g.mtype <= 9 && g.mhp >= 1) {
        if (g.ma < 100) {
          g.ma = 100;
          g.mc = 0;
        }
        if (g.ma + g.mnobia > g.fxmax) {
          g.ma = g.fxmax - g.mnobia;
          g.mc = 0;
        }
      }
      if (g.mb >= 38000 && g.mhp >= 0 && g.stagecolor == 4) {
        g.mhp = -2;
        g.mmsgtm = 30;
        g.mmsgtype = 55;
      }
      if (g.mb >= 52000 && g.mhp >= 0) {
        g.mhp = -2;
      }
      g.xx[15] = 0;
      for (g.t = 0; g.t < tmax; g.t++) {
        g.xx[0] = 200;
        g.xx[1] = 3000;
        g.xx[2] = 1000;
        g.xx[3] = 3000;
        g.xx[8] = g.ta[g.t] - g.fx;
        g.xx[9] = g.tb[g.t] - g.fy;
        if (g.ta[g.t] - g.fx + g.xx[1] >= -10 - g.xx[3] && g.ta[g.t] - g.fx <= g.fxmax + 12000 + g.xx[3]) {
          if (g.mtype != 200 && g.mtype != 1 && g.mtype != 2) {
            if (g.ttype[g.t] < 1000 && g.ttype[g.t] != 800 && g.ttype[g.t] != 140 && g.ttype[g.t] != 141) {
              if (!(g.mztype == 1)) {
                g.xx[16] = 0;
                g.xx[17] = 0;
                if (g.ttype[g.t] != 7 && g.ttype[g.t] != 110 && !(g.ttype[g.t] == 114)) {
                  if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 + 100 && g.ma < g.xx[8] + g.xx[1] - g.xx[0] * 2 - 100 && g.mb + g.mnobib > g.xx[9] && g.mb + g.mnobib < g.xx[9] + g.xx[1] && g.md >= -100) {
                    if (g.ttype[g.t] != 115 && g.ttype[g.t] != 400 && g.ttype[g.t] != 117 && g.ttype[g.t] != 118 && g.ttype[g.t] != 120) {
                      g.mb = g.xx[9] - g.mnobib + 100;
                      g.md = 0;
                      g.mzimen = 1;
                      g.xx[16] = 1;
                    } else if (g.ttype[g.t] == 115) {
                      snd(3);
                      eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
                      eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
                      eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
                      eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
                      brockbreak(g.t);
                    } else if (g.ttype[g.t] == 400) {
                      g.md = 0;
                      g.ta[g.t] = -8000000;
                      snd(13);
                      for (g.tt = 0; g.tt < tmax; g.tt++) {
                        if (g.ttype[g.tt] != 7) {
                          g.ttype[g.tt] = 800;
                        }
                      }
                      bgm(0);
                    } else if (g.ttype[g.t] == 117) {
                      snd(14);
                      g.md = -1500;
                      g.mtype = 2;
                      g.mtm = 0;
                      if (g.txtype[g.t] >= 2 && g.mtype == 2) {
                        g.mtype = 0;
                        g.md = -1600;
                        g.txtype[g.t] = 3;
                      }
                      if (g.txtype[g.t] == 0) g.txtype[g.t] = 1;
                    } else if (g.ttype[g.t] == 120) {
                      g.md = -2400;
                      g.mtype = 3;
                      g.mtm = 0;
                    }
                  }
                }
              }
              if (!(g.mztm >= 1 && g.mztype == 1)) {
                g.xx[21] = 0;
                g.xx[22] = 1;
                if (g.mzimen == 1 || g.mjumptm >= 10) {
                  g.xx[21] = 3;
                  g.xx[22] = 0;
                }
                for (g.t3 = 0; g.t3 <= 1; g.t3++) {
                  if (g.t3 == g.xx[21] && g.mtype != 100 && g.ttype[g.t] != 117) {
                    if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 + 800 && g.ma < g.xx[8] + g.xx[1] - g.xx[0] * 2 - 800 && g.mb > g.xx[9] - g.xx[0] * 2 && g.mb < g.xx[9] + g.xx[1] - g.xx[0] * 2 && g.md <= 0) {
                      g.xx[16] = 1;
                      g.xx[17] = 1;
                      g.mb = g.xx[9] + g.xx[1] + g.xx[0];
                      if (g.md < 0) {
                        g.md = -g.md * 2 / 3 | 0;
                      }
                      if (g.ttype[g.t] == 1 && g.mzimen == 0) {
                        snd(3);
                        eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
                        eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
                        eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
                        eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
                        brockbreak(g.t);
                      }
                      if (g.ttype[g.t] == 2 && g.mzimen == 0) {
                        snd(4);
                        eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
                        g.ttype[g.t] = 3;
                      }
                      if (g.ttype[g.t] == 7) {
                        snd(4);
                        eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
                        g.mb = g.xx[9] + g.xx[1] + g.xx[0];
                        g.ttype[g.t] = 3;
                        if (g.md < 0) {
                          g.md = -g.md * 2 / 3 | 0;
                        }
                      }
                      if (g.ttype[g.t] == 10) {
                        g.mmsgtm = 30;
                        g.mmsgtype = 3;
                        g.mhp--;
                      }
                    }
                  }
                  if (g.t3 == g.xx[22] && g.xx[15] == 0) {
                    if (g.ttype[g.t] != 7 && g.ttype[g.t] != 110 && g.ttype[g.t] != 117) {
                      if (!(g.ttype[g.t] == 114)) {
                        if (g.ta[g.t] >= -20000) {
                          if (g.ma + g.mnobia > g.xx[8] && g.ma < g.xx[8] + g.xx[2] && g.mb + g.mnobib > g.xx[9] + (g.xx[1] / 2 | 0) - g.xx[0] && g.mb < g.xx[9] + g.xx[2] && g.mc >= 0) {
                            g.ma = g.xx[8] - g.mnobia;
                            g.mc = 0;
                            g.xx[16] = 1;
                          }
                          if (g.ma + g.mnobia > g.xx[8] + g.xx[2] && g.ma < g.xx[8] + g.xx[1] && g.mb + g.mnobib > g.xx[9] + (g.xx[1] / 2 | 0) - g.xx[0] && g.mb < g.xx[9] + g.xx[2] && g.mc <= 0) {
                            g.ma = g.xx[8] + g.xx[1];
                            g.mc = 0;
                            g.xx[16] = 1;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            if (g.ttype[g.t] == 800) {
              if (g.mb > g.xx[9] - g.xx[0] * 2 - 2000 && g.mb < g.xx[9] + g.xx[1] - g.xx[0] * 2 + 2000 && g.ma + g.mnobia > g.xx[8] - 400 && g.ma < g.xx[8] + g.xx[1]) {
                g.ta[g.t] = -800000;
                snd(4);
              }
            }
            if (g.ttype[g.t] == 140) {
              if (g.mb > g.xx[9] - g.xx[0] * 2 - 2000 && g.mb < g.xx[9] + g.xx[1] - g.xx[0] * 2 + 2000 && g.ma + g.mnobia > g.xx[8] - 400 && g.ma < g.xx[8] + g.xx[1]) {
                g.ta[g.t] = -800000;
                g.sracttype[20] = 1;
                g.sron[20] = 1;
                bgm(0);
                g.mtype = 301;
                g.mtm = 0;
                snd(16);
              }
            }
            if (g.ttype[g.t] == 100) {
              if (g.mb > g.xx[9] - g.xx[0] * 2 - 2000 && g.mb < g.xx[9] + g.xx[1] - g.xx[0] * 2 + 2000 && g.ma + g.mnobia > g.xx[8] - 400 && g.ma < g.xx[8] + g.xx[1] && g.md <= 0) {
                if (g.txtype[g.t] == 0) g.tb[g.t] = g.mb + g.fy - 1200 - g.xx[1];
              }
              if (g.txtype[g.t] == 1) {
                if (g.xx[17] == 1) {
                  if (g.ma + g.mnobia > g.xx[8] - 400 && g.ma < g.xx[8] + (g.xx[1] / 2 | 0) - 1500) {
                    g.ta[g.t] += 3000;
                  } else if (g.ma + g.mnobia >= g.xx[8] + (g.xx[1] / 2 | 0) - 1500 && g.ma < g.xx[8] + g.xx[1]) {
                    g.ta[g.t] -= 3000;
                  }
                }
              }
              if (g.xx[17] == 1 && g.txtype[g.t] == 0) {
                snd(4);
                eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
                g.ttype[g.t] = 3;
              }
            }
            if (g.ttype[g.t] == 101) {
              if (g.xx[17] == 1) {
                snd(8);
                g.ttype[g.t] = 3;
                g.abrocktm[g.aco] = 16;
                if (g.txtype[g.t] == 0) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 0, 0);
                if (g.txtype[g.t] == 1) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 4, 0);
                if (g.txtype[g.t] == 3) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 101, 0);
                if (g.txtype[g.t] == 4) {
                  g.abrocktm[g.aco] = 20;
                  ayobi(g.ta[g.t] - 400, g.tb[g.t] - 1600, 0, 0, 0, 6, 0);
                }
                if (g.txtype[g.t] == 10) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 101, 0);
              }
            }
            if (g.ttype[g.t] == 102) {
              if (g.xx[17] == 1) {
                snd(8);
                g.ttype[g.t] = 3;
                g.abrocktm[g.aco] = 16;
                if (g.txtype[g.t] == 0) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 100, 0);
                if (g.txtype[g.t] == 2) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 100, 2);
                if (g.txtype[g.t] == 3) ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 102, 1);
              }
            }
            if (g.ttype[g.t] == 103) {
              if (g.xx[17] == 1) {
                snd(8);
                g.ttype[g.t] = 3;
                g.abrocktm[g.aco] = 16;
                ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 100, 1);
              }
            }
            if (g.ttype[g.t] == 104) {
              if (g.xx[17] == 1) {
                snd(8);
                g.ttype[g.t] = 3;
                g.abrocktm[g.aco] = 16;
                ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 110, 0);
              }
            }
            if (g.ttype[g.t] == 110) {
              if (g.xx[17] == 1) {
                g.ttype[g.t] = 111;
                g.thp[g.t] = 999;
              }
            }
            if (g.ttype[g.t] == 111 && g.ta[g.t] - g.fx >= 0) {
              g.thp[g.t]++;
              if (g.thp[g.t] >= 16) {
                g.thp[g.t] = 0;
                snd(8);
                g.abrocktm[g.aco] = 16;
                ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 102, 1);
              }
            }
            if (g.ttype[g.t] == 112) {
              if (g.xx[17] == 1) {
                g.ttype[g.t] = 113;
                g.thp[g.t] = 999;
                g.titem[g.t] = 0;
              }
            }
            if (g.ttype[g.t] == 113 && g.ta[g.t] - g.fx >= 0) {
              if (g.titem[g.t] <= 19) g.thp[g.t]++;
              if (g.thp[g.t] >= 3) {
                g.thp[g.t] = 0;
                g.titem[g.t]++;
                snd(4);
                eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
              }
            }
            if (g.ttype[g.t] == 114) {
              if (g.xx[17] == 1) {
                if (g.txtype[g.t] == 0) {
                  snd(8);
                  g.ttype[g.t] = 3;
                  g.abrocktm[g.aco] = 16;
                  ayobi(g.ta[g.t], g.tb[g.t], 0, 0, 0, 102, 1);
                }
                if (g.txtype[g.t] == 2) {
                  snd(4);
                  eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
                  g.ttype[g.t] = 115;
                  g.txtype[g.t] = 0;
                }
                if (g.txtype[g.t] == 10) {
                  if (g.stageonoff == 1) {
                    g.ttype[g.t] = 130;
                    g.stageonoff = 0;
                    snd(13);
                    g.txtype[g.t] = 2;
                    for (g.t = 0; g.t < amax; g.t++) {
                      if (g.atype[g.t] == 87 || g.atype[g.t] == 88) {
                        if (g.axtype[g.t] == 105) {
                          g.axtype[g.t] = 110;
                        }
                      }
                    }
                  } else {
                    snd(4);
                    eyobi(g.ta[g.t] + 10, g.tb[g.t], 0, -800, 0, 40, 3000, 3000, 0, 16);
                    g.ttype[g.t] = 3;
                  }
                }
              }
            }
            if (g.ttype[g.t] == 115) {}
            if (g.ttype[g.t] == 116) {
              if (g.xx[17] == 1) {
                snd(8);
                g.ttype[g.t] = 3;
                tyobi(g.ta[g.t] / 100 | 0, (g.tb[g.t] / 100 | 0) - 29, 400);
              }
            }
            if (g.ttype[g.t] == 124) {
              if (g.xx[17] == 1) {
                snd(13);
                for (g.t = 0; g.t < amax; g.t++) {
                  if (g.atype[g.t] == 87 || g.atype[g.t] == 88) {
                    if (g.axtype[g.t] == 101) {
                      g.axtype[g.t] = 120;
                    }
                  }
                }
                g.ttype[g.t] = 3;
              }
            }
            if (g.ttype[g.t] == 130) {
              if (g.xx[17] == 1) {
                if (g.txtype[g.t] != 1) {
                  g.stageonoff = 0;
                  snd(13);
                }
              }
            } else if (g.ttype[g.t] == 131) {
              if (g.xx[17] == 1 && g.txtype[g.t] != 2) {
                g.stageonoff = 1;
                snd(13);
                if (g.txtype[g.t] == 1) {
                  for (g.t = 0; g.t < amax; g.t++) {
                    if (g.atype[g.t] == 87 || g.atype[g.t] == 88) {
                      if (g.axtype[g.t] == 105) {
                        g.axtype[g.t] = 110;
                      }
                    }
                  }
                  g.bxtype[3] = 105;
                }
              }
            }
            if (g.ttype[g.t] == 300) {
              if (g.xx[17] == 1) {
                snd(15);
                if (g.txtype[g.t] <= 100) {
                  g.tmsgtype = 1;
                  g.tmsgtm = 15;
                  g.tmsgy = 300 + (g.txtype[g.t] - 1);
                  g.tmsg = g.txtype[g.t];
                }
                if (g.txtype[g.t] == 540) {
                  g.tmsgtype = 1;
                  g.tmsgtm = 15;
                  g.tmsgy = 400;
                  g.tmsg = 100;
                  g.txtype[g.t] = 541;
                }
              }
            }
            if (g.ttype[g.t] == 301) {
              if (g.xx[17] == 1) {
                snd(3);
                eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
                brockbreak(g.t);
              }
            }
          } else if (g.mtype == 1) {
            if (g.ma + g.mnobia > g.xx[8] && g.ma < g.xx[8] + g.xx[1] && g.mb + g.mnobib > g.xx[9] && g.mb < g.xx[9] + g.xx[1]) {
              snd(3);
              eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
              eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
              eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
              eyobi(g.ta[g.t] + 1200, g.tb[g.t] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
              brockbreak(g.t);
            }
          }
          if (g.ttype[g.t] == 130 && g.stageonoff == 0) {
            g.ttype[g.t] = 131;
          }
          if (g.ttype[g.t] == 131 && g.stageonoff == 1) {
            g.ttype[g.t] = 130;
          }
          if (g.ttype[g.t] == 300) {
            if (g.txtype[g.t] >= 500 && g.ta[g.t] >= -6000) {
              if (g.txtype[g.t] <= 539) g.txtype[g.t]++;
              if (g.txtype[g.t] >= 540) {
                g.ta[g.t] -= 500;
              }
            }
          }
        }
      }
      for (g.t = 0; g.t < smax; g.t++) {
        if (g.sa[g.t] - g.fx + g.sc[g.t] >= -12000 && g.sa[g.t] - g.fx <= g.fxmax) {
          g.xx[0] = 200;
          g.xx[1] = 2400;
          g.xx[2] = 1000;
          g.xx[7] = 0;
          g.xx[8] = g.sa[g.t] - g.fx;
          g.xx[9] = g.sb[g.t] - g.fy;
          if ((g.stype[g.t] <= 99 || g.stype[g.t] == 200) && g.mtype < 10) {
            if (g.stype[g.t] == 51) {
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] + 3000 && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] && g.mb + g.mnobib > g.xx[9] + 3000 && g.sgtype[g.t] == 0) {
                if (g.sxtype[g.t] == 0) {
                  g.sgtype[g.t] = 1;
                  g.sr[g.t] = 0;
                }
              }
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] + 1000 && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] && g.mb + g.mnobib > g.xx[9] + 3000 && g.sgtype[g.t] == 0) {
                if (g.sxtype[g.t] == 10 && g.sgtype[g.t] == 0) {
                  g.sgtype[g.t] = 1;
                  g.sr[g.t] = 0;
                }
              }
              if (g.sxtype[g.t] == 1 && g.sb[27] >= 25000 && g.sa[27] > g.ma + g.mnobia && g.t != 27 && g.sgtype[g.t] == 0) {
                g.sgtype[g.t] = 1;
                g.sr[g.t] = 0;
              }
              if (g.sxtype[g.t] == 2 && g.sb[28] >= 48000 && g.t != 28 && g.sgtype[g.t] == 0 && g.mhp >= 1) {
                g.sgtype[g.t] = 1;
                g.sr[g.t] = 0;
              }
              if ((g.sxtype[g.t] == 3 && g.mb >= 30000 || g.sxtype[g.t] == 4 && g.mb >= 25000) && g.sgtype[g.t] == 0 && g.mhp >= 1 && g.ma + g.mnobia > g.xx[8] + g.xx[0] + 3000 - 300 && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0]) {
                g.sgtype[g.t] = 1;
                g.sr[g.t] = 0;
                if (g.sxtype[g.t] == 4) g.sr[g.t] = 100;
              }
              if (g.sgtype[g.t] == 1 && g.sb[g.t] <= g.fymax + 18000) {
                g.sr[g.t] += 120;
                if (g.sr[g.t] >= 1600) {
                  g.sr[g.t] = 1600;
                }
                g.sb[g.t] += g.sr[g.t];
                if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] && g.mb + g.mnobib > g.xx[9] && g.mb < g.xx[9] + g.sd[g.t] + g.xx[0]) {
                  g.mhp--;
                  g.xx[7] = 1;
                }
              }
            }
            if (g.stype[g.t] == 52) {
              if (g.sgtype[g.t] == 0 && g.ma + g.mnobia > g.xx[8] + g.xx[0] + 2000 && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] - 2500 && g.mb + g.mnobib > g.xx[9] - 3000) {
                g.sgtype[g.t] = 1;
                g.sr[g.t] = 0;
              }
              if (g.sgtype[g.t] == 1) {
                g.sr[g.t] += 120;
                if (g.sr[g.t] >= 1600) {
                  g.sr[g.t] = 1600;
                }
                g.sb[g.t] += g.sr[g.t];
              }
            }
            if (g.xx[7] == 0) {
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] && g.mb + g.mnobib > g.xx[9] && g.mb + g.mnobib < g.xx[9] + g.xx[1] && g.md >= -100) {
                g.mb = g.sb[g.t] - g.fy - g.mnobib + 100;
                g.md = 0;
                g.mzimen = 1;
              }
              if (g.ma + g.mnobia > g.xx[8] - g.xx[0] && g.ma < g.xx[8] + g.xx[2] && g.mb + g.mnobib > g.xx[9] + (g.xx[1] * 3 / 4 | 0) && g.mb < g.xx[9] + g.sd[g.t] - g.xx[2]) {
                g.ma = g.xx[8] - g.xx[0] - g.mnobia;
                g.mc = 0;
              }
              if (g.ma + g.mnobia > g.xx[8] + g.sc[g.t] - g.xx[0] && g.ma < g.xx[8] + g.sc[g.t] + g.xx[0] && g.mb + g.mnobib > g.xx[9] + (g.xx[1] * 3 / 4 | 0) && g.mb < g.xx[9] + g.sd[g.t] - g.xx[2]) {
                g.ma = g.xx[8] + g.sc[g.t] + g.xx[0];
                g.mc = 0;
              }
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] * 2 && g.mb > g.xx[9] + g.sd[g.t] - g.xx[1] && g.mb < g.xx[9] + g.sd[g.t] + g.xx[0]) {
                g.mb = g.xx[9] + g.sd[g.t] + g.xx[0];
                if (g.md < 0) {
                  g.md = -g.md * 2 / 3 | 0;
                }
              }
            }
            if (g.stype[g.t] == 50) {
              if (g.ma + g.mnobia > g.xx[8] + 2800 && g.ma < g.xx[8] + g.sc[g.t] - 3000 && g.mb + g.mnobib > g.xx[9] - 1000 && g.mb + g.mnobib < g.xx[9] + g.xx[1] + 3000 && g.mzimen == 1 && g.actaon[3] == 1 && g.mtype == 0) {
                if (g.sxtype[g.t] == 0) {
                  g.mtype = 100;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 0;
                }
                if (g.sxtype[g.t] == 1) {
                  g.mtype = 100;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 1;
                }
                if (g.sxtype[g.t] == 2) {
                  g.mtype = 100;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 2;
                }
                if (g.sxtype[g.t] == 5) {
                  g.mtype = 100;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 5;
                }
                if (g.sxtype[g.t] == 6) {
                  g.mtype = 100;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 6;
                }
              }
            }
            if (g.stype[g.t] == 40) {
              if (g.ma + g.mnobia > g.xx[8] - 300 && g.ma < g.xx[8] + g.sc[g.t] - 1000 && g.mb > g.xx[9] + 1000 && g.mb + g.mnobib < g.xx[9] + g.xx[1] + 4000 && g.mzimen == 1 && g.actaon[4] == 1 && g.mtype == 0) {
                if (g.sxtype[g.t] == 0) {
                  g.mtype = 500;
                  g.mtm = 0;
                  snd(7);
                  g.mtype = 100;
                  g.mxtype = 10;
                }
                if (g.sxtype[g.t] == 2) {
                  g.mxtype = 3;
                  g.mtm = 0;
                  snd(7);
                  g.mtype = 100;
                }
                if (g.sxtype[g.t] == 6) {
                  g.mtype = 3;
                  g.mtm = 0;
                  snd(7);
                  g.mxtype = 6;
                }
              }
            }
          } else {
            if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.sc[g.t] - g.xx[0] && g.mb + g.mnobib > g.xx[9] && g.mb < g.xx[9] + g.sd[g.t] + g.xx[0]) {
              if (g.stype[g.t] == 100) {
                if (g.sxtype[g.t] == 0 || g.sxtype[g.t] == 1 && g.ttype[1] != 3) {
                  ayobi(g.sa[g.t] + 1000, 32000, 0, 0, 0, 3, 0);
                  g.sa[g.t] = -800000000;
                  snd(10);
                }
              }
              if (g.stype[g.t] == 101) {
                ayobi(g.sa[g.t] + 6000, -4000, 0, 0, 0, 3, 1);
                g.sa[g.t] = -800000000;
                snd(10);
              }
              if (g.stype[g.t] == 102) {
                if (g.sxtype[g.t] == 0) {
                  for (g.t3 = 0; g.t3 <= 3; g.t3++) {
                    ayobi(g.sa[g.t] + g.t3 * 3000, -3000, 0, 0, 0, 0, 0);
                  }
                }
                if (g.sxtype[g.t] == 1 && g.mb >= 16000) {
                  ayobi(g.sa[g.t] + 1500, 44000, 0, -2000, 0, 4, 0);
                } else if (g.sxtype[g.t] == 2) {
                  ayobi(g.sa[g.t] + 4500, 30000, 0, -1600, 0, 5, 0);
                  snd(10);
                  g.sxtype[g.t] = 3;
                  g.sa[g.t] -= 12000;
                } else if (g.sxtype[g.t] == 3) {
                  g.sa[g.t] += 12000;
                  g.sxtype[g.t] = 4;
                } else if (g.sxtype[g.t] == 4) {
                  ayobi(g.sa[g.t] + 4500, 30000, 0, -1600, 0, 5, 0);
                  snd(10);
                  g.sxtype[g.t] = 5;
                  g.sxtype[g.t] = 0;
                } else if (g.sxtype[g.t] == 7) {
                  g.mainmsgtype = 1;
                } else if (g.sxtype[g.t] == 8) {
                  ayobi(g.sa[g.t] - 5000 - 3000 * 1, 26000, 0, -1600, 0, 5, 0);
                  snd(10);
                } else if (g.sxtype[g.t] == 9) {
                  for (g.t3 = 0; g.t3 <= 2; g.t3++) {
                    ayobi(g.sa[g.t] + g.t3 * 3000 + 3000, 48000, 0, -6000, 0, 3, 0);
                  }
                }
                if (g.sxtype[g.t] == 10) {
                  g.sa[g.t] -= 5 * 30 * 100;
                  g.stype[g.t] = 101;
                }
                if (g.sxtype[g.t] == 12) {
                  for (g.t3 = 1; g.t3 <= 3; g.t3++) {
                    ayobi(g.sa[g.t] + g.t3 * 3000 - 1000, 40000, 0, -2600, 0, 9, 0);
                  }
                }
                if (g.sxtype[g.t] == 20) {
                  g.scrollx = 0;
                }
                if (g.sxtype[g.t] == 30) {
                  g.sa[g.t] = -80000000;
                  g.md = 0;
                  bgm(0);
                  g.mtype = 302;
                  g.mtm = 0;
                  snd(16);
                }
                if (g.sxtype[g.t] != 3 && g.sxtype[g.t] != 4 && g.sxtype[g.t] != 10) {
                  g.sa[g.t] = -800000000;
                }
              }
              if (g.stype[g.t] == 103) {
                if (g.sxtype[g.t] == 0) {
                  g.amsgtm[g.aco] = 10;
                  g.amsgtype[g.aco] = 50;
                  ayobi(g.sa[g.t] + 9000, g.sb[g.t] + 2000, 0, 0, 0, 79, 0);
                  g.sa[g.t] = -800000000;
                }
                if (g.sxtype[g.t] == 1 && g.ttype[6] <= 6) {
                  g.amsgtm[g.aco] = 10;
                  g.amsgtype[g.aco] = 50;
                  ayobi(g.sa[g.t] - 12000, g.sb[g.t] + 2000, 0, 0, 0, 79, 0);
                  g.sa[g.t] = -800000000;
                  g.txtype[9] = 500;
                }
              }
              if (g.stype[g.t] == 104) {
                if (g.sxtype[g.t] == 0) {
                  ayobi(g.sa[g.t] + 12000, g.sb[g.t] + 2000 + 3000, 0, 0, 0, 79, 0);
                  ayobi(g.sa[g.t] + 12000, g.sb[g.t] + 2000 + 3000, 0, 0, 0, 79, 1);
                  ayobi(g.sa[g.t] + 12000, g.sb[g.t] + 2000 + 3000, 0, 0, 0, 79, 2);
                  ayobi(g.sa[g.t] + 12000, g.sb[g.t] + 2000 + 3000, 0, 0, 0, 79, 3);
                  ayobi(g.sa[g.t] + 12000, g.sb[g.t] + 2000 + 3000, 0, 0, 0, 79, 4);
                  g.sa[g.t] = -800000000;
                }
              }
              if (g.stype[g.t] == 105 && g.mzimen == 0 && g.md >= 0) {
                g.ta[1] -= 1000;
                g.ta[2] += 1000;
                g.sxtype[g.t]++;
                if (g.sxtype[g.t] >= 3) g.sa[g.t] = -8000000;
              }
              if (g.stype[g.t] == 300 && g.mtype == 0 && g.mb < g.xx[9] + g.sd[g.t] + g.xx[0] - 3000 && g.mhp >= 1) {
                bgm(0);
                g.mtype = 300;
                g.mtm = 0;
                g.ma = g.sa[g.t] - g.fx - 2000;
                snd(11);
              }
              if (g.stype[g.t] == 500 && g.mtype == 0 && g.mhp >= 1) {
                g.tyuukan += 1;
                g.sa[g.t] = -80000000;
              }
            }
            if (g.stype[g.t] == 180) {
              g.sr[g.t]++;
              if (g.sr[g.t] >= g.sgtype[g.t]) {
                g.sr[g.t] = 0;
                ayobi(g.sa[g.t], 30000, rnd(600) - 300, -1600 - rnd(900), 0, 84, 0);
              }
            }
          }
        }
      }
      g.actaon[0] = 0;
      g.actaon[4] = 0;
      for (g.t = 0; g.t < srmax; g.t++) {
        g.xx[10] = g.sra[g.t];
        g.xx[11] = g.srb[g.t];
        g.xx[12] = g.src[g.t];
        g.xx[13] = g.srd[g.t];
        g.xx[8] = g.xx[10] - g.fx;
        g.xx[9] = g.xx[11] - g.fy;
        if (g.xx[8] + g.xx[12] >= -10 - 12000 && g.xx[8] <= g.fxmax + 12100) {
          g.xx[0] = 500;
          g.xx[1] = 1200;
          g.xx[2] = 1000;
          g.xx[7] = 2000;
          if (g.md >= 100) {
            g.xx[1] = 900 + g.md;
          }
          if (g.md > g.xx[1]) g.xx[1] = g.md + 100;
          g.srb[g.t] += g.sre[g.t];
          g.sre[g.t] += g.srf[g.t];
          switch (g.sracttype[g.t]) {
            case 1:
              if (g.sron[g.t] == 1) g.srf[g.t] = 60;
              break;
            case 2:
              break;
            case 3:
              break;
            case 5:
              if (g.srmove[g.t] == 0) {
                g.srmuki[g.t] = 0;
              } else {
                g.srmuki[g.t] = 1;
              }
              if (g.srb[g.t] - g.fy < -2100) {
                g.srb[g.t] = g.fymax + g.fy + g.scrolly + 2000;
              }
              if (g.srb[g.t] - g.fy > g.fymax + g.scrolly + 2000) {
                g.srb[g.t] = -2100 + g.fy;
              }
              break;
            case 6:
              if (g.sron[g.t] == 1) g.srf[g.t] = 40;
              break;
            case 7:
              break;
          }
          if (!(g.mztm >= 1 && g.mztype == 1 && g.actaon[3] == 1) && g.mhp >= 1) {
            if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.xx[12] - g.xx[0] && g.mb + g.mnobib > g.xx[9] && g.mb + g.mnobib < g.xx[9] + g.xx[1] && g.md >= -100) {
              g.mb = g.xx[9] - g.mnobib + 100;
              if (g.srtype[g.t] == 1) {
                g.sre[10] = 900;
                g.sre[11] = 900;
              }
              if (g.srsp[g.t] != 12) {
                g.mzimen = 1;
                g.md = 0;
              } else {
                g.md = -800;
              }
              if (g.sracttype[g.t] == 1 && g.sron[g.t] == 0) g.sron[g.t] = 1;
              if (g.sracttype[g.t] == 1 && g.sron[g.t] == 1 || g.sracttype[g.t] == 3 || g.sracttype[g.t] == 5) {
                g.mb += g.sre[g.t];
              }
              if (g.sracttype[g.t] == 7) {
                if (g.actaon[2] != 1) {
                  g.md = -600;
                  g.mb -= 810;
                }
                if (g.actaon[2] == 1) {
                  g.mb -= 400;
                  g.md = -1400;
                  g.mjumptm = 10;
                }
              }
              if (g.srsp[g.t] == 1) {
                snd(3);
                eyobi(g.sra[g.t] + 200, g.srb[g.t] - 1000, -240, -1400, 0, 160, 4500, 4500, 2, 120);
                eyobi(g.sra[g.t] + 4500 - 200, g.srb[g.t] - 1000, 240, -1400, 0, 160, 4500, 4500, 3, 120);
                g.sra[g.t] = -70000000;
              }
              if (g.srsp[g.t] == 2) {
                g.mc = -2400;
                g.srmove[g.t] += 1;
                if (g.srmove[g.t] >= 100) {
                  g.mhp = 0;
                  g.mmsgtype = 53;
                  g.mmsgtm = 30;
                  g.srmove[g.t] = -5000;
                }
              }
              if (g.srsp[g.t] == 3) {
                g.mc = 2400;
                g.srmove[g.t] += 1;
                if (g.srmove[g.t] >= 100) {
                  g.mhp = 0;
                  g.mmsgtype = 53;
                  g.mmsgtm = 30;
                  g.srmove[g.t] = -5000;
                }
              }
            }
            if ((g.srsp[g.t] == 2 || g.srsp[g.t] == 3) && g.mc != -2400 && g.srmove[g.t] > 0) {
              g.srmove[g.t]--;
            }
            if (g.srsp[g.t] == 11) {
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] - 2000 && g.ma < g.xx[8] + g.xx[12] - g.xx[0]) {
                g.sron[g.t] = 1;
              }
              if (g.sron[g.t] == 1) {
                g.srf[g.t] = 60;
                g.srb[g.t] += g.sre[g.t];
              }
            }
            if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.xx[12] - g.xx[0] && g.mb > g.xx[9] - (g.xx[1] / 2 | 0) && g.mb < g.xx[9] + (g.xx[1] / 2 | 0)) {
              if (g.srtype[g.t] == 2) {
                if (g.md < 0) {
                  g.md = -g.md;
                }
                g.mb += 110;
                if (g.mmutekitm <= 0) g.mhp -= 1;
                if (g.mmutekion != 1) g.mmutekitm = 40;
              }
            }
            if (g.sracttype[g.t] == 6) {
              if (g.ma + g.mnobia > g.xx[8] + g.xx[0] && g.ma < g.xx[8] + g.xx[12] - g.xx[0]) {
                g.sron[g.t] = 1;
              }
            }
          }
          if (g.sracttype[g.t] == 2 || g.sracttype[g.t] == 4) {
            if (g.srmuki[g.t] == 0) g.sra[g.t] -= g.srsok[g.t];
            if (g.srmuki[g.t] == 1) g.sra[g.t] += g.srsok[g.t];
          }
          if (g.sracttype[g.t] == 3 || g.sracttype[g.t] == 5) {
            if (g.srmuki[g.t] == 0) g.srb[g.t] -= g.srsok[g.t];
            if (g.srmuki[g.t] == 1) g.srb[g.t] += g.srsok[g.t];
          }
          for (g.tt = 0; g.tt < amax; g.tt++) {
            if (g.azimentype[g.tt] == 1) {
              if (g.aa[g.tt] + g.anobia[g.tt] - g.fx > g.xx[8] + g.xx[0] && g.aa[g.tt] - g.fx < g.xx[8] + g.xx[12] - g.xx[0] && g.ab[g.tt] + g.anobib[g.tt] > g.xx[11] - 100 && g.ab[g.tt] + g.anobib[g.tt] < g.xx[11] + g.xx[1] + 500 && g.ad[g.tt] >= -100) {
                g.ab[g.tt] = g.xx[9] - g.anobib[g.tt] + 100;
                g.ad[g.tt] = 0;
                g.axzimen[g.tt] = 1;
              }
            }
          }
        }
      }
      for (g.t = 0; g.t < emax; g.t++) {
        g.xx[0] = g.ea[g.t] - g.fx;
        g.xx[1] = g.eb[g.t] - g.fy;
        g.xx[2] = g.enobia[g.t] / 100 | 0;
        g.xx[3] = g.enobib[g.t] / 100 | 0;
        if (g.etm[g.t] >= 0) g.etm[g.t]--;
        if (g.xx[0] + g.xx[2] * 100 >= -10 && g.xx[1] <= g.fxmax && g.xx[1] + g.xx[3] * 100 >= -10 - 8000 && g.xx[3] <= g.fymax && g.etm[g.t] >= 0) {
          g.ea[g.t] += g.ec[g.t];
          g.eb[g.t] += g.ed[g.t];
          g.ec[g.t] += g.ee[g.t];
          g.ed[g.t] += g.ef[g.t];
        } else {
          g.ea[g.t] = -9000000;
        }
      }
      for (g.t = 0; g.t < bmax; g.t++) {
        if (g.ba[g.t] >= -80000) {
          if (g.btm[g.t] >= 0) {
            g.btm[g.t] = g.btm[g.t] - 1;
          }
          for (g.tt = 0; g.tt <= 1; g.tt++) {
            g.xx[0] = 0;
            g.xx[1] = 0;
            if (g.bz[g.t] == 0 && g.btm[g.t] < 0 && g.ba[g.t] - g.fx >= g.fxmax + 2000 && g.ba[g.t] - g.fx < g.fxmax + 2000 + g.mc && g.tt == 0) {
              g.xx[0] = 1;
              g.amuki[g.aco] = 0;
            }
            if (g.bz[g.t] == 0 && g.btm[g.t] < 0 && g.ba[g.t] - g.fx >= -400 - g.anx[g.btype[g.t]] + g.mc && g.ba[g.t] - g.fx < -400 - g.anx[g.btype[g.t]] && g.tt == 1) {
              g.xx[0] = 1;
              g.xx[1] = 1;
              g.amuki[g.aco] = 1;
            }
            if (g.bz[g.t] == 1 && g.ba[g.t] - g.fx >= 0 - g.anx[g.btype[g.t]] && g.ba[g.t] - g.fx <= g.fxmax + 4000 && g.bb[g.t] - g.fy >= -9000 && g.bb[g.t] - g.fy <= g.fymax + 4000 && g.btm[g.t] < 0) {
              g.xx[0] = 1;
              g.bz[g.t] = 0;
            }
            if (g.xx[0] == 1) {
              g.btm[g.t] = 401;
              g.xx[0] = 0;
              if (g.btype[g.t] >= 10) {
                g.btm[g.t] = 9999999;
              }
              ayobi(g.ba[g.t], g.bb[g.t], 0, 0, 0, g.btype[g.t], g.bxtype[g.t]);
            }
          }
        }
      }
      for (g.t = 0; g.t < amax; g.t++) {
        g.xx[0] = g.aa[g.t] - g.fx;
        g.xx[1] = g.ab[g.t] - g.fy;
        g.xx[2] = g.anobia[g.t];
        g.xx[3] = g.anobib[g.t];
        g.xx[14] = 12000 * 1;
        if (g.anotm[g.t] >= 0) g.anotm[g.t]--;
        if (g.xx[0] + g.xx[2] >= -g.xx[14] && g.xx[0] <= g.fxmax + g.xx[14] && g.xx[1] + g.xx[3] >= -10 - 9000 && g.xx[1] <= g.fymax + 20000) {
          g.aacta[g.t] = 0;
          g.aactb[g.t] = 0;
          g.xx[10] = 0;
          switch (g.atype[g.t]) {
            case 0:
              g.xx[10] = 100;
              break;
            case 1:
              g.xx[10] = 100;
              break;
            case 2:
              g.xx[10] = 0;
              g.xx[17] = 800;
              if (g.axtype[g.t] >= 1) g.xx[10] = g.xx[17];
              if (g.axtype[g.t] >= 1) {
                for (g.tt = 0; g.tt < amax; g.tt++) {
                  g.xx[0] = 250;
                  g.xx[5] = -800;
                  g.xx[12] = 0;
                  g.xx[1] = 1600;
                  g.xx[8] = g.aa[g.tt] - g.fx;
                  g.xx[9] = g.ab[g.tt] - g.fy;
                  if (g.t != g.tt) {
                    if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] * 2 && g.aa[g.t] - g.fx < g.xx[8] + g.anobia[g.tt] - g.xx[0] * 2 && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + g.xx[5] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.xx[1] * 3 + g.xx[12] + 1500) {
                      g.aa[g.tt] = -800000;
                      snd(6);
                    }
                  }
                }
              }
              break;
            case 3:
              g.azimentype[g.t] = 0;
              if (g.axtype[g.t] == 0) {
                g.ab[g.t] -= 800;
              }
              if (g.axtype[g.t] == 1) g.ab[g.t] += 1200;
              break;
            case 4:
              g.xx[10] = 120;
              g.xx[0] = 250;
              g.xx[8] = g.aa[g.t] - g.fx;
              g.xx[9] = g.ab[g.t] - g.fy;
              if (g.atm[g.t] >= 0) g.atm[g.t]--;
              if (Math.abs(g.ma + g.mnobia - g.xx[8] - g.xx[0] * 2) < 9000 && Math.abs(g.ma < g.xx[8] - g.anobia[g.t] + g.xx[0] * 2) < 3000 && g.md <= -600 && g.atm[g.t] <= 0) {
                if (g.axtype[g.t] == 1 && g.mzimen == 0 && g.axzimen[g.t] == 1) {
                  g.ad[g.t] = -1600;
                  g.atm[g.t] = 40;
                  g.ab[g.t] -= 1000;
                }
              }
              break;
            case 5:
              g.xx[10] = 160;
              break;
            case 6:
              if (g.azimentype[g.t] == 30) {
                g.ad[g.t] = -1600;
                g.ab[g.t] += g.ad[g.t];
              }
              g.xx[10] = 120;
              if (g.atm[g.t] >= 10) {
                g.atm[g.t]++;
                if (g.mhp >= 1) {
                  if (g.atm[g.t] <= 19) {
                    g.ma = g.xx[0];
                    g.mb = g.xx[1] - 3000;
                    g.mtype = 0;
                  }
                  g.xx[10] = 0;
                  if (g.atm[g.t] == 20) {
                    g.mc = 700;
                    g.mkeytm = 24;
                    g.md = -1200;
                    g.mb = g.xx[1] - 1000 - 3000;
                    g.amuki[g.t] = 1;
                    if (g.axtype[g.t] == 1) {
                      g.mc = 840;
                      g.axtype[g.t] = 0;
                    }
                  }
                  if (g.atm[g.t] == 40) {
                    g.amuki[g.t] = 0;
                    g.atm[g.t] = 0;
                  }
                }
              }
              if (g.axtype[g.t] == 1) {
                for (g.tt = 0; g.tt < smax; g.tt++) {
                  if (g.stype[g.tt] == 300) {
                    if (g.aa[g.t] - g.fx >= -8000 && g.aa[g.t] >= g.sa[g.tt] + 2000 && g.aa[g.t] <= g.sa[g.tt] + 3600 && g.axzimen[g.t] == 1) {
                      g.sa[g.tt] = -800000;
                      g.atm[g.t] = 100;
                    }
                  }
                }
                if (g.atm[g.t] == 100) {
                  eyobi(g.aa[g.t] + 1200 - 1200, g.ab[g.t] + 3000 - 10 * 3000 - 1500, 0, 0, 0, 0, 1000, 10 * 3000 - 1200, 4, 20);
                  if (g.mtype == 300) {
                    g.mtype = 0;
                    void 0;
                    bgm(1);
                  }
                  for (g.t1 = 0; g.t1 < smax; g.t1++) {
                    if (g.stype[g.t1] == 104) g.sa[g.t1] = -80000000;
                  }
                }
                if (g.atm[g.t] == 120) {
                  eyobi(g.aa[g.t] + 1200 - 1200, g.ab[g.t] + 3000 - 10 * 3000 - 1500, 600, -1200, 0, 160, 1000, 10 * 3000 - 1200, 4, 240);
                  g.amuki[g.t] = 1;
                }
                if (g.atm[g.t] == 140) {
                  g.amuki[g.t] = 0;
                  g.atm[g.t] = 0;
                }
              }
              if (g.atm[g.t] >= 220) {
                g.atm[g.t] = 0;
                g.amuki[g.t] = 0;
              }
              for (g.tt = 0; g.tt < amax; g.tt++) {
                g.xx[0] = 250;
                g.xx[5] = -800;
                g.xx[12] = 0;
                g.xx[1] = 1600;
                g.xx[8] = g.aa[g.tt] - g.fx;
                g.xx[9] = g.ab[g.tt] - g.fy;
                if (g.t != g.tt && g.atype[g.tt] >= 100) {
                  if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] * 2 && g.aa[g.t] - g.fx < g.xx[8] + g.anobia[g.tt] - g.xx[0] * 2 && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + g.xx[5] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.xx[1] * 3 + g.xx[12] + 1500) {
                    g.amuki[g.tt] = 1;
                    g.aa[g.tt] = g.aa[g.t] + 300;
                    g.ab[g.tt] = g.ab[g.t] - 3000;
                    g.abrocktm[g.tt] = 120;
                    g.atm[g.t] = 200;
                    g.amuki[g.t] = 1;
                  }
                }
              }
              break;
            case 7:
              g.azimentype[g.t] = 0;
              g.xx[10] = 0;
              g.xx[11] = 400;
              if (g.axtype[g.t] == 0) g.xx[10] = g.xx[11];
              if (g.axtype[g.t] == 1) g.xx[10] = -g.xx[11];
              if (g.axtype[g.t] == 2) g.ab[g.t] -= g.xx[11];
              if (g.axtype[g.t] == 3) g.ab[g.t] += g.xx[11];
              break;
            case 8:
              g.azimentype[g.t] = 0;
              g.xx[22] = 20;
              if (g.atm[g.t] == 0) {
                g.af[g.t] += g.xx[22];
                g.ad[g.t] += g.xx[22];
              }
              if (g.atm[g.t] == 1) {
                g.af[g.t] -= g.xx[22];
                g.ad[g.t] -= g.xx[22];
              }
              if (g.ad[g.t] > 300) g.ad[g.t] = 300;
              if (g.ad[g.t] < -300) g.ad[g.t] = -300;
              if (g.af[g.t] >= 1200) g.atm[g.t] = 1;
              if (g.af[g.t] < -0) g.atm[g.t] = 0;
              g.ab[g.t] += g.ad[g.t];
              break;
            case 151:
              g.azimentype[g.t] = 2;
              break;
            case 9:
              g.azimentype[g.t] = 5;
              g.ab[g.t] += g.ad[g.t];
              g.ad[g.t] += 100;
              if (g.ab[g.t] >= g.fymax + 1000) {
                g.ad[g.t] = 900;
              }
              if (g.ab[g.t] >= g.fymax + 12000) {
                g.ab[g.t] = g.fymax;
                g.ad[g.t] = -2600;
              }
              break;
            case 10:
              g.azimentype[g.t] = 0;
              g.xx[10] = 0;
              g.xx[11] = 400;
              if (g.axtype[g.t] == 0) g.xx[10] = g.xx[11];
              if (g.axtype[g.t] == 1) g.xx[10] = -g.xx[11];
              break;
            case 30:
              g.atm[g.t] += 1;
              if (g.axtype[g.t] == 0) {
                if (g.atm[g.t] == 50 && g.mb >= 6000) {
                  g.ac[g.t] = 300;
                  g.ad[g.t] -= 1600;
                  g.ab[g.t] -= 1000;
                }
                for (g.tt = 0; g.tt < amax; g.tt++) {
                  g.xx[0] = 250;
                  g.xx[5] = -800;
                  g.xx[12] = 0;
                  g.xx[1] = 1600;
                  g.xx[8] = g.aa[g.tt] - g.fx;
                  g.xx[9] = g.ab[g.tt] - g.fy;
                  if (g.t != g.tt && g.atype[g.tt] == 102) {
                    if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] * 2 && g.aa[g.t] - g.fx < g.xx[8] + g.anobia[g.tt] - g.xx[0] * 2 && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + g.xx[5] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.xx[1] * 3 + g.xx[12] + 1500) {
                      g.aa[g.tt] = -800000;
                      g.axtype[g.t] = 1;
                      g.ad[g.t] = -1600;
                      g.amsgtm[g.t] = 30;
                      g.amsgtype[g.t] = 25;
                    }
                  }
                }
              }
              if (g.axtype[g.t] == 1) {
                g.azimentype[g.t] = 0;
                g.ab[g.t] += g.ad[g.t];
                g.ad[g.t] += 120;
              }
              break;
            case 79:
              g.azimentype[g.t] = 0;
              g.xx[10] = 1600;
              if (g.axtype[g.t] == 1) {
                g.xx[10] = 1200;
                g.ab[g.t] -= 200;
              }
              if (g.axtype[g.t] == 2) {
                g.xx[10] = 1200;
                g.ab[g.t] += 200;
              }
              if (g.axtype[g.t] == 3) {
                g.xx[10] = 900;
                g.ab[g.t] -= 600;
              }
              if (g.axtype[g.t] == 4) {
                g.xx[10] = 900;
                g.ab[g.t] += 600;
              }
              break;
            case 80:
              g.azimentype[g.t] = 0;
              break;
            case 81:
              g.azimentype[g.t] = 0;
              break;
            case 82:
              g.azimentype[g.t] = 0;
              break;
            case 83:
              g.azimentype[g.t] = 0;
              break;
            case 84:
              g.azimentype[g.t] = 2;
              break;
            case 85:
              g.xx[23] = 400;
              if (g.axtype[g.t] == 0) {
                g.axtype[g.t] = 1;
                g.amuki[g.t] = 1;
              }
              if (g.mb >= 30000 && g.ma >= g.aa[g.t] - 3000 * 5 - g.fx && g.ma <= g.aa[g.t] - g.fx && g.axtype[g.t] == 1) {
                g.axtype[g.t] = 5;
                g.amuki[g.t] = 0;
              }
              if (g.mb >= 24000 && g.ma <= g.aa[g.t] + 3000 * 8 - g.fx && g.ma >= g.aa[g.t] - g.fx && g.axtype[g.t] == 1) {
                g.axtype[g.t] = 5;
                g.amuki[g.t] = 1;
              }
              if (g.axtype[g.t] == 5) g.xx[10] = g.xx[23];
              break;
            case 86:
              g.azimentype[g.t] = 4;
              g.xx[23] = 1000;
              if (g.ma >= g.aa[g.t] - g.fx - g.mnobia - g.xx[26] && g.ma <= g.aa[g.t] - g.fx + g.anobia[g.t] + g.xx[26]) {
                g.atm[g.t] = 1;
              }
              if (g.atm[g.t] == 1) {
                g.ab[g.t] += 1200;
              }
              break;
            case 87:
              g.azimentype[g.t] = 0;
              if (g.aa[g.t] % 10 != 1) g.atm[g.t] += 6; else {
                g.atm[g.t] -= 6;
              }
              g.xx[25] = 2;
              if (g.atm[g.t] > 360 * g.xx[25]) g.atm[g.t] -= 360 * g.xx[25];
              if (g.atm[g.t] < 0) g.atm[g.t] += 360 * g.xx[25];
              for (g.tt = 0; g.tt <= g.axtype[g.t] % 100; g.tt++) {
                g.xx[26] = 18;
                g.xd[4] = g.tt * g.xx[26] * Math.cos(g.atm[g.t] * Math.PI / 180 / 2);
                g.xd[5] = g.tt * g.xx[26] * Math.sin(g.atm[g.t] * Math.PI / 180 / 2);
                g.xx[4] = 1800;
                g.xx[5] = 800;
                g.xx[8] = g.aa[g.t] - g.fx + trunc(g.xd[4]) * 100 - (g.xx[4] / 2 | 0);
                g.xx[9] = g.ab[g.t] - g.fy + trunc(g.xd[5]) * 100 - (g.xx[4] / 2 | 0);
                if (g.ma + g.mnobia > g.xx[8] + g.xx[5] && g.ma < g.xx[8] + g.xx[4] - g.xx[5] && g.mb + g.mnobib > g.xx[9] + g.xx[5] && g.mb < g.xx[9] + g.xx[4] - g.xx[5]) {
                  g.mhp -= 1;
                  g.mmsgtype = 51;
                  g.mmsgtm = 30;
                }
              }
              break;
            case 88:
              g.azimentype[g.t] = 0;
              if (g.aa[g.t] % 10 != 1) g.atm[g.t] += 6; else {
                g.atm[g.t] -= 6;
              }
              g.xx[25] = 2;
              if (g.atm[g.t] > 360 * g.xx[25]) g.atm[g.t] -= 360 * g.xx[25];
              if (g.atm[g.t] < 0) g.atm[g.t] += 360 * g.xx[25];
              for (g.tt = 0; g.tt <= g.axtype[g.t] % 100; g.tt++) {
                g.xx[26] = 18;
                g.xd[4] = -g.tt * g.xx[26] * Math.cos(g.atm[g.t] * Math.PI / 180 / 2);
                g.xd[5] = g.tt * g.xx[26] * Math.sin(g.atm[g.t] * Math.PI / 180 / 2);
                g.xx[4] = 1800;
                g.xx[5] = 800;
                g.xx[8] = g.aa[g.t] - g.fx + trunc(g.xd[4]) * 100 - (g.xx[4] / 2 | 0);
                g.xx[9] = g.ab[g.t] - g.fy + trunc(g.xd[5]) * 100 - (g.xx[4] / 2 | 0);
                if (g.ma + g.mnobia > g.xx[8] + g.xx[5] && g.ma < g.xx[8] + g.xx[4] - g.xx[5] && g.mb + g.mnobib > g.xx[9] + g.xx[5] && g.mb < g.xx[9] + g.xx[4] - g.xx[5]) {
                  g.mhp -= 1;
                  g.mmsgtype = 51;
                  g.mmsgtm = 30;
                }
              }
              break;
            case 90:
              g.xx[10] = 160;
              break;
            case 100:
              g.azimentype[g.t] = 1;
              g.xx[10] = 100;
              if (g.axtype[g.t] == 2) {
                for (g.tt = 0; g.tt < amax; g.tt++) {
                  g.xx[0] = 250;
                  g.xx[5] = -800;
                  g.xx[12] = 0;
                  g.xx[1] = 1600;
                  g.xx[8] = g.aa[g.tt] - g.fx;
                  g.xx[9] = g.ab[g.tt] - g.fy;
                  if (g.t != g.tt) {
                    if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] * 2 && g.aa[g.t] - g.fx < g.xx[8] + g.anobia[g.tt] - g.xx[0] * 2 && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + g.xx[5] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.xx[1] * 3 + g.xx[12]) {
                      if (g.atype[g.tt] == 0 || g.atype[g.tt] == 4) {
                        g.atype[g.tt] = 90;
                        g.anobia[g.tt] = 6400;
                        g.anobib[g.tt] = 6300;
                        g.axtype[g.tt] = 0;
                        g.aa[g.tt] -= 1050;
                        g.ab[g.tt] -= 1050;
                        snd(9);
                        g.aa[g.t] = -80000000;
                      }
                    }
                  }
                }
              }
              break;
            case 102:
              g.azimentype[g.t] = 1;
              g.xx[10] = 100;
              if (g.axtype[g.t] == 1) g.xx[10] = 200;
              break;
            case 110:
              g.azimentype[g.t] = 1;
              g.xx[10] = 200;
              if (g.axzimen[g.t] == 1) {
                g.ab[g.t] -= 1200;
                g.ad[g.t] = -1400;
              }
              break;
            case 200:
              g.azimentype[g.t] = 1;
              g.xx[10] = 100;
              break;
          }
          if (g.abrocktm[g.t] >= 1) g.xx[10] = 0;
          if (g.amuki[g.t] == 0) g.aacta[g.t] -= g.xx[10];
          if (g.amuki[g.t] == 1) g.aacta[g.t] += g.xx[10];
          g.xx[0] = 850;
          g.xx[1] = 1200;
          if (g.ad[g.t] > g.xx[1] && g.azimentype[g.t] != 5) {
            g.ad[g.t] = g.xx[1];
          }
          g.aa[g.t] += g.aacta[g.t];
          if ((g.azimentype[g.t] >= 1 || g.azimentype[g.t] == -1) && g.abrocktm[g.t] <= 0) {
            g.aa[g.t] += g.ac[g.t];
            if (g.azimentype[g.t] >= 1 && g.azimentype[g.t] <= 3) {
              g.ab[g.t] += g.ad[g.t];
              g.ad[g.t] += 120;
            }
            if (g.axzimen[g.t] == 1) {
              g.xx[0] = 100;
              if (g.ac[g.t] >= 200) {
                g.ac[g.t] -= g.xx[0];
              } else if (g.ac[g.t] <= -200) {
                g.ac[g.t] += g.xx[0];
              } else {
                g.ac[g.t] = 0;
              }
            }
            g.axzimen[g.t] = 0;
            if (g.azimentype[g.t] != 2) {
              tekizimen();
            }
          }
          if (g.abrocktm[g.t] > 0) {
            g.abrocktm[g.t]--;
            if (g.abrocktm[g.t] < 100) {
              g.ab[g.t] -= 180;
            }
            if (g.abrocktm[g.t] > 100) {}
            if (g.abrocktm[g.t] == 100) {
              g.ab[g.t] -= 800;
              g.ad[g.t] = -1200;
              g.ac[g.t] = 700;
              g.abrocktm[g.t] = 0;
            }
          }
          g.xx[0] = 250;
          g.xx[1] = 1600;
          g.xx[2] = 1000;
          g.xx[4] = 500;
          g.xx[5] = -800;
          g.xx[8] = g.aa[g.t] - g.fx;
          g.xx[9] = g.ab[g.t] - g.fy;
          g.xx[12] = 0;
          if (g.md >= 100) g.xx[12] = g.md;
          g.xx[25] = 0;
          if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 && g.ma < g.xx[8] + g.anobia[g.t] - g.xx[0] * 2 && g.mb + g.mnobib > g.xx[9] - g.xx[5] && g.mb + g.mnobib < g.xx[9] + g.xx[1] + g.xx[12] && (g.mmutekitm <= 0 || g.md >= 100) && g.abrocktm[g.t] <= 0) {
            if (g.atype[g.t] != 4 && g.atype[g.t] != 9 && g.atype[g.t] != 10 && (g.atype[g.t] <= 78 || g.atype[g.t] == 85) && g.mzimen != 1 && g.mtype != 200) {
              if (g.atype[g.t] == 0) {
                if (g.axtype[g.t] == 0) g.aa[g.t] = -900000;
                if (g.axtype[g.t] == 1) {
                  snd(5);
                  g.mb = g.xx[9] - 900 - g.anobib[g.t];
                  g.md = -2100;
                  g.xx[25] = 1;
                  g.actaon[2] = 0;
                }
              }
              if (g.atype[g.t] == 1) {
                g.atype[g.t] = 2;
                g.anobib[g.t] = 3000;
                g.axtype[g.t] = 0;
              } else if (g.atype[g.t] == 2 && g.md >= 0) {
                if (g.axtype[g.t] == 1 || g.axtype[g.t] == 2) {
                  g.axtype[g.t] = 0;
                } else if (g.axtype[g.t] == 0) {
                  if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 && g.ma < g.xx[8] + (g.anobia[g.t] / 2 | 0) - g.xx[0] * 4) {
                    g.axtype[g.t] = 1;
                    g.amuki[g.t] = 1;
                  } else {
                    g.axtype[g.t] = 1;
                    g.amuki[g.t] = 0;
                  }
                }
              }
              if (g.atype[g.t] == 3) {
                g.xx[25] = 1;
              }
              if (g.atype[g.t] == 6) {
                g.atm[g.t] = 10;
                g.md = 0;
                g.actaon[2] = 0;
              }
              if (g.atype[g.t] == 7) {
                g.aa[g.t] = -900000;
              }
              if (g.atype[g.t] == 8) {
                g.atype[g.t] = 151;
                g.ad[g.t] = 0;
              }
              if (g.atype[g.t] != 85) {
                if (g.xx[25] == 0) {
                  snd(5);
                  g.mb = g.xx[9] - 1000 - g.anobib[g.t];
                  g.md = -1000;
                }
              }
              if (g.atype[g.t] == 85) {
                if (g.xx[25] == 0) {
                  snd(5);
                  g.mb = g.xx[9] - 4000;
                  g.md = -1000;
                  g.axtype[g.t] = 5;
                }
              }
              if (g.actaon[2] == 1) {
                g.md = -1600;
                g.actaon[2] = 0;
              }
            }
          }
          g.xx[15] = -500;
          g.xx[16] = 0;
          if (g.atype[g.t] == 4 || g.atype[g.t] == 9 || g.atype[g.t] == 10) g.xx[16] = -3000;
          if (g.atype[g.t] == 82 || g.atype[g.t] == 83 || g.atype[g.t] == 84) g.xx[16] = -3200;
          if (g.atype[g.t] == 85) g.xx[16] = -g.anobib[g.t] + 6000;
          if (g.ma + g.mnobia > g.xx[8] + g.xx[4] && g.ma < g.xx[8] + g.anobia[g.t] - g.xx[4] && g.mb < g.xx[9] + g.anobib[g.t] + g.xx[15] && g.mb + g.mnobib > g.xx[9] + g.anobib[g.t] - g.xx[0] + g.xx[16] && g.anotm[g.t] <= 0 && g.abrocktm[g.t] <= 0) {
            if (g.mmutekion == 1) {
              g.aa[g.t] = -9000000;
            }
            if (g.mmutekitm <= 0 && (g.atype[g.t] <= 99 || g.atype[g.t] >= 200)) {
              if (g.mmutekion != 1 && g.mtype != 200) {
                if ((g.atype[g.t] != 2 || g.axtype[g.t] != 0) && g.mhp >= 1) {
                  if (g.atype[g.t] != 6) {
                    g.mhp -= 1;
                  }
                }
                if (g.atype[g.t] == 6) {
                  g.atm[g.t] = 10;
                }
                if (g.mhp == 0) {
                  if (g.atype[g.t] == 0 || g.atype[g.t] == 7) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = rnd(7) + 1 + 1000 + (g.stb - 1) * 10;
                  }
                  if (g.atype[g.t] == 1) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = rnd(2) + 15;
                  }
                  if (g.atype[g.t] == 2 && g.axtype[g.t] >= 1 && g.mmutekitm <= 0) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = 18;
                  }
                  if (g.atype[g.t] == 3) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = 20;
                  }
                  if (g.atype[g.t] == 4) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = rnd(7) + 1 + 1000 + (g.stb - 1) * 10;
                  }
                  if (g.atype[g.t] == 5) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = 21;
                  }
                  if (g.atype[g.t] == 9 || g.atype[g.t] == 10) {
                    g.mmsgtm = 30;
                    g.mmsgtype = 54;
                  }
                  if (g.atype[g.t] == 31) {
                    g.amsgtm[g.t] = 30;
                    g.amsgtype[g.t] = 24;
                  }
                  if (g.atype[g.t] == 80 || g.atype[g.t] == 81) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = 30;
                  }
                  if (g.atype[g.t] == 82) {
                    g.amsgtm[g.t] = 20;
                    g.amsgtype[g.t] = rnd(1) + 31;
                    g.xx[24] = 900;
                    g.atype[g.t] = 83;
                    g.aa[g.t] -= g.xx[24] + 100;
                    g.ab[g.t] -= g.xx[24] - 100 * 0;
                  }
                  if (g.atype[g.t] == 84) {
                    g.mmsgtm = 30;
                    g.mmsgtype = 50;
                  }
                  if (g.atype[g.t] == 85) {
                    g.amsgtm[g.t] = 60;
                    g.amsgtype[g.t] = rnd(1) + 85;
                  }
                  if (g.atype[g.t] == 80) {
                    g.atype[g.t] = 81;
                  }
                }
                if (g.atype[g.t] == 2) {
                  if (g.axtype[g.t] == 0) {
                    if (g.ma + g.mnobia > g.xx[8] + g.xx[0] * 2 && g.ma < g.xx[8] + (g.anobia[g.t] / 2 | 0) - g.xx[0] * 4) {
                      g.axtype[g.t] = 1;
                      g.amuki[g.t] = 1;
                      g.aa[g.t] = g.ma + g.mnobia + g.fx + g.mc;
                      g.mmutekitm = 5;
                    } else {
                      g.axtype[g.t] = 1;
                      g.amuki[g.t] = 0;
                      g.aa[g.t] = g.ma - g.anobia[g.t] + g.fx - g.mc;
                      g.mmutekitm = 5;
                    }
                  } else {
                    g.mhp -= 1;
                  }
                }
              }
            }
            if (g.atype[g.t] >= 100 && g.atype[g.t] <= 199) {
              if (g.atype[g.t] == 100 && g.axtype[g.t] == 0) {
                g.mmsgtm = 30;
                g.mmsgtype = 1;
                snd(9);
              }
              if (g.atype[g.t] == 100 && g.axtype[g.t] == 1) {
                g.mmsgtm = 30;
                g.mmsgtype = 2;
                snd(9);
              }
              if (g.atype[g.t] == 100 && g.axtype[g.t] == 2) {
                g.mnobia = 5200;
                g.mnobib = 7300;
                snd(9);
                g.ma -= 1100;
                g.mb -= 4000;
                g.mtype = 1;
                g.mhp = 50000000;
              }
              if (g.atype[g.t] == 101) {
                g.mhp -= 1;
                g.mmsgtm = 30;
                g.mmsgtype = 11;
              }
              if (g.atype[g.t] == 102) {
                g.mhp -= 1;
                g.mmsgtm = 30;
                g.mmsgtype = 10;
              }
              if (g.atype[g.t] == 105) {
                if (g.axtype[g.t] == 0) {
                  snd(4);
                  g.sgtype[26] = 6;
                }
                if (g.axtype[g.t] == 1) {
                  g.txtype[7] = 80;
                  snd(4);
                  ayobi(g.aa[g.t] - 8 * 3000 - 1000, -4 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] - 10 * 3000 + 1000, -1 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] + 4 * 3000 + 1000, -2 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] + 5 * 3000 - 1000, -3 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] + 6 * 3000 + 1000, -4 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] + 7 * 3000 - 1000, -2 * 3000, 0, 0, 0, 110, 0);
                  ayobi(g.aa[g.t] + 8 * 3000 + 1000, -2 * 3000 - 1000, 0, 0, 0, 110, 0);
                  g.tb[0] += 3000 * 3;
                }
              }
              if (g.atype[g.t] == 110) {
                g.mhp -= 1;
                g.mmsgtm = 30;
                g.mmsgtype = 3;
              }
              g.aa[g.t] = -90000000;
            }
          }
        } else {
          g.aa[g.t] = -9000000;
        }
      }
      if (g.kscroll != 1 && g.kscroll != 2) {
        g.xx[2] = g.mascrollmax;
        g.xx[3] = 0;
        g.xx[1] = g.xx[2];
        if (g.ma > g.xx[1] && g.fzx < g.scrollx) {
          g.xx[5] = g.ma - g.xx[1];
          g.ma = g.xx[1];
          g.fx += g.xx[5];
          g.fzx += g.xx[5];
          if (g.xx[1] <= 5000) g.xx[3] = 1;
        }
      }
    }
    if (g.mainZ == 2) {
      g.maintm++;
      g.xx[7] = 46;
      if (hit("1") == 1) {
        void 0;
      }
      if (hit("SPACE") == 1) {
        for (g.t = 0; g.t <= g.xx[7]; g.t += 1) {
          g.xx[12 + g.t] -= 300;
        }
      }
      if (g.maintm <= 1) {
        g.maintm = 2;
        bgm(5);
        g.xx[10] = 0;
        for (g.t = 0; g.t <= g.xx[7]; g.t += 1) {
          g.xx[12 + g.t] = 980000;
        }
        g.xx[12] = 460;
        g.xx[13] = 540;
        g.xx[14] = 590;
        g.xx[15] = 650;
        g.xx[16] = 700;
        g.xx[17] = 760;
        g.xx[18] = 810;
        g.xx[19] = 870;
        g.xx[20] = 920;
        g.xx[21] = 1000;
        g.xx[22] = 1050;
        g.xx[23] = 1100;
        g.xx[24] = 1180;
        g.xx[25] = 1230;
        g.xx[26] = 1360;
        g.xx[27] = 1410;
        g.xx[28] = 1540;
        g.xx[29] = 1590;
        g.xx[30] = 1800;
        for (g.t = 0; g.t <= g.xx[7]; g.t += 1) {
          g.xx[12 + g.t] *= 100;
        }
      }
      g.xx[10] += 1;
      for (g.t = 0; g.t <= g.xx[7]; g.t += 1) {
        g.xx[12 + g.t] -= 100;
      }
      if (g.xx[30] == -200) {
        bgm(5);
      }
      if (g.xx[30] <= -400) {
        g.mainZ = 100;
        g.nokori = 2;
        g.maintm = 0;
        g.ending = 0;
      }
    }
    if (g.mainZ == 10) {
      g.maintm++;
      if (g.fast == 1) g.maintm += 2;
      if (g.maintm >= 30) {
        g.maintm = 0;
        g.mainZ = 1;
        g.zxon = 0;
      }
    }
    if (g.mainZ == 100) {
      g.maintm++;
      g.xx[0] = 0;
      if (g.maintm <= 10) {
        g.maintm = 11;
        g.sta = 1;
        g.stb = 1;
        g.stc = 0;
        g.over = 0;
      }
      if (hit("1") == 1) {
        g.sta = 1;
        g.stb = 1;
        g.stc = 0;
      }
      if (hit("2") == 1) {
        g.sta = 1;
        g.stb = 2;
        g.stc = 0;
      }
      if (hit("3") == 1) {
        g.sta = 1;
        g.stb = 3;
        g.stc = 0;
      }
      if (hit("4") == 1) {
        g.sta = 1;
        g.stb = 4;
        g.stc = 0;
      }
      if (hit("5") == 1) {
        g.sta = 2;
        g.stb = 1;
        g.stc = 0;
      }
      if (hit("6") == 1) {
        g.sta = 2;
        g.stb = 2;
        g.stc = 0;
      }
      if (hit("7") == 1) {
        g.sta = 2;
        g.stb = 3;
        g.stc = 0;
      }
      if (hit("8") == 1) {
        g.sta = 2;
        g.stb = 4;
        g.stc = 0;
      }
      if (hit("9") == 1) {
        g.sta = 3;
        g.stb = 1;
        g.stc = 0;
      }
      if (hit("0") == 1) {
        g.xx[0] = 1;
        g.over = 1;
      }
      if (hit("RETURN") == 1) {
        g.xx[0] = 1;
      }
      if (hit("Z") == 1) {
        g.xx[0] = 1;
      }
      if (g.xx[0] == 1) {
        g.mainZ = 10;
        g.zxon = 0;
        g.maintm = 0;
        g.nokori = 2;
        g.fast = 0;
        g.trap = 0;
        g.tyuukan = 0;
      }
    }
    g.xx[0] = 30;
    if (hit("SPACE") == 1) {
      g.xx[0] = 60;
    }
  }
  function tekizimen() {
    for (g.tt = 0; g.tt < smax; g.tt++) {
      if (g.sa[g.tt] - g.fx + g.sc[g.tt] >= -12010 && g.sa[g.tt] - g.fx <= g.fxmax + 12100 && g.stype[g.tt] <= 99) {
        g.xx[0] = 200;
        g.xx[2] = 1000;
        g.xx[1] = 2000;
        g.xx[8] = g.sa[g.tt] - g.fx;
        g.xx[9] = g.sb[g.tt] - g.fy;
        if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] - g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.xx[2] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + (g.xx[1] * 3 / 4 | 0) && g.ab[g.t] - g.fy < g.xx[9] + g.sd[g.tt] - g.xx[2]) {
          g.aa[g.t] = g.xx[8] - g.xx[0] - g.anobia[g.t] + g.fx;
          g.amuki[g.t] = 0;
        }
        if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.sc[g.tt] - g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.sc[g.tt] + g.xx[0] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + (g.xx[1] * 3 / 4 | 0) && g.ab[g.t] - g.fy < g.xx[9] + g.sd[g.tt] - g.xx[2]) {
          g.aa[g.t] = g.xx[8] + g.sc[g.tt] + g.xx[0] + g.fx;
          g.amuki[g.t] = 1;
        }
        if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.sc[g.tt] - g.xx[0] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.sd[g.tt] - g.xx[1] && g.ad[g.t] >= -100) {
          g.ab[g.t] = g.sb[g.tt] - g.fy - g.anobib[g.t] + 100 + g.fy;
          g.ad[g.t] = 0;
          g.axzimen[g.t] = 1;
        }
        if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.sc[g.tt] - g.xx[0] && g.ab[g.t] - g.fy > g.xx[9] + g.sd[g.tt] - g.xx[1] && g.ab[g.t] - g.fy < g.xx[9] + g.sd[g.tt] + g.xx[0]) {
          g.ab[g.t] = g.xx[9] + g.sd[g.tt] + g.xx[0] + g.fy;
          if (g.ad[g.t] < 0) {
            g.ad[g.t] = -g.ad[g.t] * 2 / 3 | 0;
          }
        }
      }
    }
    for (g.tt = 0; g.tt < tmax; g.tt++) {
      g.xx[0] = 200;
      g.xx[1] = 3000;
      g.xx[2] = 1000;
      g.xx[8] = g.ta[g.tt] - g.fx;
      g.xx[9] = g.tb[g.tt] - g.fy;
      if (g.ta[g.tt] - g.fx + g.xx[1] >= -12010 && g.ta[g.tt] - g.fx <= g.fxmax + 12000) {
        if (g.atype[g.t] != 86 && g.atype[g.t] != 90 && g.ttype[g.tt] != 140) {
          if (g.ttype[g.tt] != 7) {
            if (!(g.ttype[g.tt] == 117)) {
              if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.xx[1] - g.xx[0] * 1 && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] && g.ab[g.t] + g.anobib[g.t] - g.fy < g.xx[9] + g.xx[1] && g.ad[g.t] >= -100) {
                g.ab[g.t] = g.xx[9] - g.anobib[g.t] + 100 + g.fy;
                g.ad[g.t] = 0;
                g.axzimen[g.t] = 1;
                if (g.ttype[g.tt] == 120) {
                  g.ad[g.t] = -1600;
                  g.azimentype[g.t] = 30;
                }
              }
            }
          }
          if (g.ttype[g.tt] != 117) {
            if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[0] && g.aa[g.t] - g.fx < g.xx[8] + g.xx[1] - g.xx[0] * 1 && g.ab[g.t] - g.fy > g.xx[9] + g.xx[1] - g.xx[1] && g.ab[g.t] - g.fy < g.xx[9] + g.xx[1] + g.xx[0]) {
              g.ab[g.t] = g.xx[9] + g.xx[1] + g.xx[0] + g.fy;
              if (g.ad[g.t] < 0) {
                g.ad[g.t] = 0;
              }
            }
          }
          g.xx[27] = 0;
          if ((g.atype[g.t] >= 100 || (g.ttype[g.tt] != 7 || g.ttype[g.tt] == 7 && g.atype[g.t] == 2)) && g.ttype[g.tt] != 117) {
            if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] && g.aa[g.t] - g.fx < g.xx[8] + g.xx[2] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + (g.xx[1] / 2 | 0) - g.xx[0] && g.ab[g.t] - g.fy < g.xx[9] + g.xx[2]) {
              g.aa[g.t] = g.xx[8] - g.anobia[g.t] + g.fx;
              g.ac[g.t] = 0;
              g.amuki[g.t] = 0;
              g.xx[27] = 1;
            }
            if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] + g.xx[1] - g.xx[0] * 2 && g.aa[g.t] - g.fx < g.xx[8] + g.xx[1] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] + (g.xx[1] / 2 | 0) - g.xx[0] && g.ab[g.t] - g.fy < g.xx[9] + g.xx[2]) {
              g.aa[g.t] = g.xx[8] + g.xx[1] + g.fx;
              g.ac[g.t] = 0;
              g.amuki[g.t] = 1;
              g.xx[27] = 1;
            }
            if (g.xx[27] == 1 && (g.ttype[g.tt] == 7 || g.ttype[g.tt] == 1) && g.atype[g.t] == 2) {
              if (g.ttype[g.tt] == 7) {
                snd(4);
                g.ttype[g.tt] = 3;
                eyobi(g.ta[g.tt] + 10, g.tb[g.tt], 0, -800, 0, 40, 3000, 3000, 0, 16);
              } else if (g.ttype[g.tt] == 1) {
                snd(3);
                eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
                eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
                brockbreak(g.tt);
              }
            }
          }
        }
        if (g.atype[g.t] == 86 || g.atype[g.t] == 90) {
          if (g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] && g.aa[g.t] - g.fx < g.xx[8] + g.xx[1] && g.ab[g.t] + g.anobib[g.t] - g.fy > g.xx[9] && g.ab[g.t] - g.fy < g.xx[9] + g.xx[1]) {
            snd(3);
            eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, 300, -1000, 0, 160, 1000, 1000, 1, 120);
            eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, -300, -1000, 0, 160, 1000, 1000, 1, 120);
            eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, 240, -1400, 0, 160, 1000, 1000, 1, 120);
            eyobi(g.ta[g.tt] + 1200, g.tb[g.tt] + 1200, -240, -1400, 0, 160, 1000, 1000, 1, 120);
            brockbreak(g.tt);
          }
        }
      }
      if (g.ttype[g.tt] == 140) {
        if (g.ab[g.t] - g.fy > g.xx[9] - g.xx[0] * 2 - 2000 && g.ab[g.t] - g.fy < g.xx[9] + g.xx[1] - g.xx[0] * 2 + 2000 && g.aa[g.t] + g.anobia[g.t] - g.fx > g.xx[8] - 400 && g.aa[g.t] - g.fx < g.xx[8] + g.xx[1]) {
          g.ta[g.tt] = -800000;
          g.sracttype[20] = 1;
          g.sron[20] = 1;
        }
      }
    }
  }
  function stagecls() {
    for (g.t = 0; g.t < smax; g.t++) {
      g.sa[g.t] = -9000000;
      g.sb[g.t] = 1;
      g.sc[g.t] = 1;
      g.sd[g.t] = 1;
      g.sgtype[g.t] = 0;
      g.stype[g.t] = 0;
      g.sxtype[g.t] = 0;
    }
    for (g.t = 0; g.t < tmax; g.t++) {
      g.ta[g.t] = -9000000;
      g.tb[g.t] = 1;
      g.tc[g.t] = 1;
      g.td[g.t] = 1;
      g.titem[g.t] = 0;
      g.txtype[g.t] = 0;
    }
    for (g.t = 0; g.t < srmax; g.t++) {
      g.sra[g.t] = -9000000;
      g.srb[g.t] = 1;
      g.src[g.t] = 1;
      g.srd[g.t] = 1;
      g.sre[g.t] = 0;
      g.srf[g.t] = 0;
      g.srmuki[g.t] = 0;
      g.sron[g.t] = 0;
      g.sree[g.t] = 0;
      g.srsok[g.t] = 0;
      g.srmove[g.t] = 0;
      g.srmovep[g.t] = 0;
      g.srsp[g.t] = 0;
    }
    for (g.t = 0; g.t < amax; g.t++) {
      g.aa[g.t] = -9000000;
      g.ab[g.t] = 1;
      g.ac[g.t] = 0;
      g.ad[g.t] = 1;
      g.azimentype[g.t] = 0;
      g.atype[g.t] = 0;
      g.axtype[g.t] = 0;
      g.ae[g.t] = 0;
      g.af[g.t] = 0;
      g.atm[g.t] = 0;
      g.a2tm[g.t] = 0;
      g.abrocktm[g.t] = 0;
      g.amsgtm[g.t] = 0;
    }
    for (g.t = 0; g.t < bmax; g.t++) {
      g.ba[g.t] = -9000000;
      g.bb[g.t] = 1;
      g.bz[g.t] = 1;
      g.btm[g.t] = 0;
      g.bxtype[g.t] = 0;
    }
    for (g.t = 0; g.t < emax; g.t++) {
      g.ea[g.t] = -9000000;
      g.eb[g.t] = 1;
      g.ec[g.t] = 1;
      g.ed[g.t] = 1;
      g.egtype[g.t] = 0;
    }
    for (g.t = 0; g.t < nmax; g.t++) {
      g.na[g.t] = -9000000;
      g.nb[g.t] = 1;
      g.nc[g.t] = 1;
      g.nd[g.t] = 1;
      g.ne[g.t] = 1;
      g.nf[g.t] = 1;
      g.ng[g.t] = 0;
      g.ntype[g.t] = 0;
    }
    g.sco = 0;
    g.tco = 0;
    g.aco = 0;
    g.bco = 0;
    g.eco = 0;
    g.nco = 0;
  }
  function stage() {
    g.scrollx = 3600 * 100;
    stagep();
    for (g.tt = 0; g.tt <= 1000; g.tt++) {
      for (g.t = 0; g.t <= 16; g.t++) {
        g.xx[10] = 0;
        if (g.stagedate[g.t][g.tt] >= 1 && g.stagedate[g.t][g.tt] <= 255) g.xx[10] = trunc(g.stagedate[g.t][g.tt]);
        g.xx[21] = g.tt * 29;
        g.xx[22] = g.t * 29 - 12;
        g.xx[23] = g.xx[10];
        if (g.xx[10] >= 1 && g.xx[10] <= 19 && g.xx[10] != 9) {
          tyobi(g.tt * 29, g.t * 29 - 12, g.xx[10]);
        }
        if (g.xx[10] >= 20 && g.xx[10] <= 29) {
          g.sra[g.srco] = g.xx[21] * 100;
          g.srb[g.srco] = g.xx[22] * 100;
          g.src[g.srco] = 3000;
          g.srtype[g.srco] = 0;
          g.srco++;
          if (g.srco >= srmax) g.srco = 0;
        }
        if (g.xx[10] == 30) {
          g.sa[g.sco] = g.xx[21] * 100;
          g.sb[g.sco] = g.xx[22] * 100;
          g.sc[g.sco] = 3000;
          g.sd[g.sco] = 6000;
          g.stype[g.sco] = 500;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
        if (g.xx[10] == 40) {
          g.sa[g.sco] = g.xx[21] * 100;
          g.sb[g.sco] = g.xx[22] * 100;
          g.sc[g.sco] = 6000;
          g.sd[g.sco] = 3000;
          g.stype[g.sco] = 1;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
        if (g.xx[10] == 41) {
          g.sa[g.sco] = g.xx[21] * 100 + 500;
          g.sb[g.sco] = g.xx[22] * 100;
          g.sc[g.sco] = 5000;
          g.sd[g.sco] = 3000;
          g.stype[g.sco] = 2;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
        if (g.xx[10] == 43) {
          g.sa[g.sco] = g.xx[21] * 100;
          g.sb[g.sco] = g.xx[22] * 100 + 500;
          g.sc[g.sco] = 2900;
          g.sd[g.sco] = 5300;
          g.stype[g.sco] = 1;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
        if (g.xx[10] == 44) {
          g.sa[g.sco] = g.xx[21] * 100;
          g.sb[g.sco] = g.xx[22] * 100 + 700;
          g.sc[g.sco] = 3900;
          g.sd[g.sco] = 5000;
          g.stype[g.sco] = 5;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
        if (g.xx[10] >= 50 && g.xx[10] <= 79) {
          g.ba[g.bco] = g.xx[21] * 100;
          g.bb[g.bco] = g.xx[22] * 100;
          g.btype[g.bco] = g.xx[23] - 50;
          g.bco++;
          if (g.bco >= bmax) g.bco = 0;
        }
        if (g.xx[10] >= 80 && g.xx[10] <= 89) {
          g.na[g.nco] = g.xx[21] * 100;
          g.nb[g.nco] = g.xx[22] * 100;
          g.ntype[g.nco] = g.xx[23] - 80;
          g.nco++;
          if (g.nco >= nmax) g.nco = 0;
        }
        if (g.xx[10] == 9) {
          tyobi(g.tt * 29, g.t * 29 - 12, 800);
        }
        if (g.xx[10] == 99) {
          g.sa[g.sco] = g.xx[21] * 100;
          g.sb[g.sco] = g.xx[22] * 100;
          g.sc[g.sco] = 3000;
          g.sd[g.sco] = (12 - g.t) * 3000;
          g.stype[g.sco] = 300;
          g.sco++;
          if (g.sco >= smax) g.sco = 0;
        }
      }
    }
    if (g.tyuukan >= 1) {
      g.xx[17] = 0;
      for (g.t = 0; g.t < smax; g.t++) {
        if (g.stype[g.t] == 500 && g.tyuukan >= 1) {
          g.fx = g.sa[g.t] - (g.fxmax / 2 | 0);
          g.fzx = g.fx;
          g.ma = g.sa[g.t] - g.fx;
          g.mb = g.sb[g.t] - g.fy;
          g.tyuukan--;
          g.xx[17]++;
          g.sa[g.t] = -80000000;
        }
      }
      g.tyuukan += g.xx[17];
    }
  }
  function stagep() {
    let stagedatex;
    g.scrollx = 3600 * 100;
    if (g.sta == 1 && g.stb == 1 && g.stc == 0) {
      stagedatex = GRID(0);
      tyobi(8 * 29, 9 * 29 - 12, 100);
      g.txtype[g.tco] = 2;
      tyobi(13 * 29, 9 * 29 - 12, 102);
      g.txtype[g.tco] = 0;
      tyobi(14 * 29, 5 * 29 - 12, 101);
      tyobi(35 * 29, 8 * 29 - 12, 110);
      tyobi(47 * 29, 9 * 29 - 12, 103);
      tyobi(59 * 29, 9 * 29 - 12, 112);
      tyobi(67 * 29, 9 * 29 - 12, 104);
      g.sco = 0;
      g.t = g.sco;
      g.sa[g.t] = 20 * 29 * 100 + 500;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 5000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 100;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 54 * 29 * 100 - 500;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 7000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 101;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 112 * 29 * 100 + 1000;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 117 * 29 * 100;
      g.sb[g.t] = (2 * 29 - 12) * 100 - 1500;
      g.sc[g.t] = 15000;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 103;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 125 * 29 * 100;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 9000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 101;
      g.sco++;
      g.t = 28;
      g.sa[g.t] = 29 * 29 * 100 + 500;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 49 * 29 * 100;
      g.sb[g.t] = (5 * 29 - 12) * 100;
      g.sc[g.t] = 9000 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 51;
      g.sgtype[g.t] = 0;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 72 * 29 * 100;
      g.sb[g.t] = (13 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 5 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 52;
      g.sco++;
      g.bco = 0;
      g.t = g.bco;
      g.ba[g.t] = 27 * 29 * 100;
      g.bb[g.t] = (9 * 29 - 12) * 100;
      g.btype[g.t] = 0;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 103 * 29 * 100;
      g.bb[g.t] = (5 * 29 - 12 + 10) * 100;
      g.btype[g.t] = 80;
      g.bxtype[g.t] = 0;
      g.bco++;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 2 && g.stc == 0) {
      bgm(1);
      g.scrollx = 0 * 100;
      stagedatex = GRID(1);
      g.tco = 0;
      g.txtype[g.tco] = 1;
      tyobi(4 * 29, 9 * 29 - 12, 300);
      tyobi(13 * 29, 8 * 29 - 12, 114);
      g.sco = 0;
      g.t = g.sco;
      g.sa[g.t] = 14 * 29 * 100 + 500;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 12 * 29 * 100;
      g.sb[g.t] = (11 * 29 - 12) * 100;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 6000 - 200;
      g.stype[g.t] = 40;
      g.sxtype[g.t] = 0;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 14 * 29 * 100 + 1000;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 5000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 100;
      g.sxtype[g.t] = 1;
      g.sco++;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 2 && g.stc == 1) {
      bgm(2);
      g.scrollx = 4080 * 100;
      g.ma = 6000;
      g.mb = 3000;
      g.stagecolor = 2;
      stagedatex = GRID(2);
      g.tco = 0;
      g.txtype[g.tco] = 2;
      tyobi(7 * 29, 9 * 29 - 12, 102);
      tyobi(10 * 29, 9 * 29 - 12, 101);
      g.txtype[g.tco] = 2;
      tyobi(49 * 29, 9 * 29 - 12, 114);
      for (g.t = 0; g.t >= -7; g.t--) {
        tyobi(53 * 29, g.t * 29 - 12, 1);
      }
      g.txtype[g.tco] = 1;
      tyobi(80 * 29, 5 * 29 - 12, 104);
      g.txtype[g.tco] = 2;
      tyobi(78 * 29, 5 * 29 - 12, 102);
      g.sco = 0;
      g.t = g.sco;
      g.sa[g.t] = 2 * 29 * 100;
      g.sb[g.t] = (13 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 1 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 52;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 24 * 29 * 100;
      g.sb[g.t] = (13 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 1 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 52;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 43 * 29 * 100 + 500;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 53 * 29 * 100 + 500;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 2;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 129 * 29 * 100;
      g.sb[g.t] = (7 * 29 - 12) * 100;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 6000 - 200;
      g.stype[g.t] = 40;
      g.sxtype[g.t] = 2;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 154 * 29 * 100;
      g.sb[g.t] = 3000;
      g.sc[g.t] = 9000;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 7;
      g.sco++;
      g.t = 27;
      g.sa[g.t] = 69 * 29 * 100;
      g.sb[g.t] = (1 * 29 - 12) * 100;
      g.sc[g.t] = 9000 * 2 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 51;
      g.sxtype[g.t] = 0;
      g.sgtype[g.t] = 0;
      g.sco++;
      g.t = 28;
      g.sa[g.t] = 66 * 29 * 100;
      g.sb[g.t] = (1 * 29 - 12) * 100;
      g.sc[g.t] = 9000 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 51;
      g.sxtype[g.t] = 1;
      g.sgtype[g.t] = 0;
      g.sco++;
      g.t = 29;
      g.sa[g.t] = 66 * 29 * 100;
      g.sb[g.t] = (-2 * 29 - 12) * 100;
      g.sc[g.t] = 9000 * 3 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 51;
      g.sxtype[g.t] = 2;
      g.sgtype[g.t] = 0;
      g.sco++;
      g.t = 26;
      g.sa[g.t] = 103 * 29 * 100 - 1500;
      g.sb[g.t] = (9 * 29 - 12) * 100 - 2000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 180;
      g.sxtype[g.t] = 0;
      g.sr[g.t] = 0;
      g.sgtype[g.t] = 48;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 102 * 29 * 100;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 2;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 123 * 29 * 100;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 5 - 1;
      g.sd[g.t] = 3000 * 5;
      g.stype[g.t] = 52;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 131 * 29 * 100;
      g.sb[g.t] = (1 * 29 - 12) * 100;
      g.sc[g.t] = 4700;
      g.sd[g.t] = 3000 * 8 - 700;
      g.stype[g.t] = 1;
      g.sxtype[g.t] = 0;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 143 * 29 * 100;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 5;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 148 * 29 * 100;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 5;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 153 * 29 * 100;
      g.sb[g.t] = (9 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 12000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 5;
      g.sco++;
      g.bco = 0;
      g.t = g.bco;
      g.ba[g.t] = 18 * 29 * 100;
      g.bb[g.t] = (10 * 29 - 12) * 100;
      g.btype[g.t] = 82;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 51 * 29 * 100 + 1000;
      g.bb[g.t] = (2 * 29 - 12 + 10) * 100;
      g.btype[g.t] = 80;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 96 * 29 * 100 + 100;
      g.bb[g.t] = (10 * 29 - 12) * 100;
      g.btype[g.t] = 105;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.srco = 0;
      g.t = g.srco;
      g.sra[g.t] = 111 * 29 * 100;
      g.srb[g.t] = (8 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 5;
      g.sre[g.t] = -300;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 111 * 29 * 100;
      g.srb[g.t] = (0 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 5;
      g.sre[g.t] = -300;
      g.srco++;
      g.t = 10;
      g.sra[g.t] = 116 * 29 * 100;
      g.srb[g.t] = (4 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 1;
      g.sracttype[g.t] = 5;
      g.sre[g.t] = 300;
      g.srco++;
      g.t = 11;
      g.sra[g.t] = 116 * 29 * 100;
      g.srb[g.t] = (12 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 1;
      g.sracttype[g.t] = 5;
      g.sre[g.t] = 300;
      g.srco++;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 2 && g.stc == 2) {
      bgm(1);
      g.scrollx = 900 * 100;
      g.ma = 7500;
      g.mb = 3000 * 9;
      stagedatex = GRID(3);
      g.t = g.sco;
      g.sa[g.t] = 5 * 29 * 100 + 500;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 8;
      g.sco++;
      g.t = 28;
      g.sa[g.t] = 44 * 29 * 100 + 500;
      g.sb[g.t] = (10 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 9000 - 200;
      g.stype[g.t] = 50;
      g.sco++;
      g.bco = 0;
      g.t = g.bco;
      g.ba[g.t] = 19 * 29 * 100;
      g.bb[g.t] = (2 * 29 - 12) * 100;
      g.btype[g.t] = 85;
      g.bxtype[g.t] = 0;
      g.bco++;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 3 && g.stc == 6) {
      g.stc = 0;
    }
    if (g.sta == 1 && g.stb == 3 && g.stc == 0) {
      bgm(1);
      g.scrollx = 3900 * 100;
      stagedatex = GRID(4);
      g.tco = 0;
      tyobi(22 * 29, 3 * 29 - 12, 1);
      tyobi(54 * 29, 9 * 29 - 12, 116);
      tyobi(18 * 29, 14 * 29 - 12, 117);
      tyobi(19 * 29, 14 * 29 - 12, 117);
      tyobi(20 * 29, 14 * 29 - 12, 117);
      g.txtype[g.tco] = 1;
      tyobi(61 * 29, 9 * 29 - 12, 101);
      tyobi(74 * 29, 9 * 29 - 12, 7);
      g.txtype[g.tco] = 2;
      tyobi(28 * 29, 9 * 29 - 12, 300);
      g.txtype[g.tco] = 3;
      tyobi(7 * 29, 9 * 29 - 12, 101);
      g.txtype[g.tco] = 4;
      tyobi(70 * 29, 8 * 29 - 12, 300);
      g.txtype[g.tco] = 1;
      tyobi(58 * 29, 13 * 29 - 12, 115);
      g.txtype[g.tco] = 1;
      tyobi(59 * 29, 13 * 29 - 12, 115);
      g.txtype[g.tco] = 1;
      tyobi(60 * 29, 13 * 29 - 12, 115);
      g.txtype[g.tco] = 0;
      tyobi(111 * 29, 6 * 29 - 12, 301);
      g.txtype[g.tco] = 0;
      tyobi(114 * 29, 9 * 29 - 12, 120);
      g.bco = 0;
      g.t = g.bco;
      g.ba[g.t] = 101 * 29 * 100;
      g.bb[g.t] = (5 * 29 - 12) * 100;
      g.btype[g.t] = 4;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 146 * 29 * 100;
      g.bb[g.t] = (10 * 29 - 12) * 100;
      g.btype[g.t] = 6;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.sco;
      g.sa[g.t] = 9 * 29 * 100;
      g.sb[g.t] = (13 * 29 - 12) * 100;
      g.sc[g.t] = 9000 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 52;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 65 * 29 * 100 + 500;
      g.sb[g.t] = (10 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 9000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 74 * 29 * 100;
      g.sb[g.t] = (8 * 29 - 12) * 100 - 1500;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 103;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 96 * 29 * 100 - 3000;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 9000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 10;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 131 * 29 * 100 - 1500;
      g.sb[g.t] = (1 * 29 - 12) * 100 - 3000;
      g.sc[g.t] = 15000;
      g.sd[g.t] = 14000;
      g.stype[g.t] = 104;
      g.sco++;
      g.t = g.bco;
      g.ba[g.t] = 10 * 29 * 100 + 100;
      g.bb[g.t] = (11 * 29 - 12) * 100;
      g.btype[g.t] = 105;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 43 * 29 * 100;
      g.bb[g.t] = (11 * 29 - 12) * 100;
      g.btype[g.t] = 82;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 1 * 29 * 100;
      g.bb[g.t] = (2 * 29 - 12 + 10) * 100 - 1000;
      g.btype[g.t] = 80;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.srco = 0;
      g.t = g.srco;
      g.sra[g.t] = 33 * 29 * 100;
      g.srb[g.t] = (3 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 1;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 39 * 29 * 100 - 2000;
      g.srb[g.t] = (6 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 1;
      g.sre[g.t] = 0;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 45 * 29 * 100 + 1500;
      g.srb[g.t] = (10 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 2;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 95 * 29 * 100;
      g.srb[g.t] = (7 * 29 - 12) * 100;
      g.src[g.t] = 180 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 10;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 104 * 29 * 100;
      g.srb[g.t] = (9 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 12;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 117 * 29 * 100;
      g.srb[g.t] = (3 * 29 - 12) * 100;
      g.src[g.t] = 90 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 1;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 15;
      g.srco++;
      g.t = g.srco;
      g.sra[g.t] = 124 * 29 * 100;
      g.srb[g.t] = (5 * 29 - 12) * 100;
      g.src[g.t] = 210 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.sre[g.t] = 0;
      g.srsp[g.t] = 10;
      g.srco++;
      if (g.stagepoint == 1) {
        g.stagepoint = 0;
        g.ma = 4500;
        g.mb = -3000;
        g.tyuukan = 0;
      }
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 3 && g.stc == 1) {
      bgm(2);
      g.scrollx = 0 * 100;
      g.ma = 6000;
      g.mb = 6000;
      g.stagecolor = 2;
      stagedatex = GRID(5);
      g.tco = 0;
      g.stc = 0;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 3 && g.stc == 5) {
      g.stagecolor = 3;
      bgm(3);
      g.scrollx = 0 * 100;
      g.ma = 3000;
      g.mb = 33000;
      g.stagepoint = 1;
      stagedatex = GRID(6);
      g.sco = 0;
      g.t = g.sco;
      g.sa[g.t] = 14 * 29 * 100 - 5;
      g.sb[g.t] = (11 * 29 - 12) * 100;
      g.sc[g.t] = 6000;
      g.sd[g.t] = 15000 - 200;
      g.stype[g.t] = 50;
      g.sxtype[g.t] = 1;
      g.sco++;
      g.txtype[g.tco] = 0;
      tyobi(12 * 29, 4 * 29 - 12, 112);
      g.txtype[g.tco] = 3;
      tyobi(12 * 29, 8 * 29 - 12, 300);
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 1 && g.stb == 4 && g.stc == 0) {
      bgm(4);
      g.scrollx = 4400 * 100;
      g.ma = 12000;
      g.mb = 6000;
      g.stagecolor = 4;
      stagedatex = GRID(7);
      g.sco = 0;
      g.t = g.sco;
      g.sa[g.t] = 35 * 29 * 100 - 1500 + 750;
      g.sb[g.t] = (8 * 29 - 12) * 100 - 1500;
      g.sc[g.t] = 1500;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 105;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 67 * 29 * 100;
      g.sb[g.t] = (4 * 29 - 12) * 100;
      g.sc[g.t] = 9000 - 1;
      g.sd[g.t] = 3000 * 1 - 1;
      g.stype[g.t] = 51;
      g.sxtype[g.t] = 3;
      g.sgtype[g.t] = 0;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 73 * 29 * 100;
      g.sb[g.t] = (13 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 1 - 1;
      g.sd[g.t] = 3000;
      g.stype[g.t] = 52;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 123 * 29 * 100;
      g.sb[g.t] = (1 * 29 - 12) * 100;
      g.sc[g.t] = 30 * 6 * 100 - 1 + 0;
      g.sd[g.t] = 3000 - 200;
      g.stype[g.t] = 51;
      g.sxtype[g.t] = 10;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 124 * 29 * 100 + 3000;
      g.sb[g.t] = (2 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 1 - 1;
      g.sd[g.t] = 300000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 20;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 148 * 29 * 100 + 1000;
      g.sb[g.t] = (-12 * 29 - 12) * 100;
      g.sc[g.t] = 3000 * 1 - 1;
      g.sd[g.t] = 300000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 30;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 100 * 29 * 100 + 1000;
      g.sb[g.t] = -6000;
      g.sc[g.t] = 3000;
      g.sd[g.t] = 70000;
      g.stype[g.t] = 102;
      g.sxtype[g.t] = 12;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 0 * 29 * 100 - 0;
      g.sb[g.t] = 9 * 29 * 100 + 1700;
      g.sc[g.t] = 3000 * 7 - 1;
      g.sd[g.t] = 3000 * 5 - 1;
      g.stype[g.t] = 200;
      g.sxtype[g.t] = 0;
      g.sco++;
      g.t = g.sco;
      g.sa[g.t] = 11 * 29 * 100;
      g.sb[g.t] = -1 * 29 * 100 + 1700;
      g.sc[g.t] = 3000 * 8 - 1;
      g.sd[g.t] = 3000 * 4 - 1;
      g.stype[g.t] = 200;
      g.sxtype[g.t] = 0;
      g.sco++;
      g.bco = 0;
      g.t = g.bco;
      g.ba[g.t] = 8 * 29 * 100 - 1400;
      g.bb[g.t] = (2 * 29 - 12) * 100 + 500;
      g.btype[g.t] = 86;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 42 * 29 * 100 - 1400;
      g.bb[g.t] = (-2 * 29 - 12) * 100 + 500;
      g.btype[g.t] = 86;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 29 * 29 * 100 + 1500;
      g.bb[g.t] = (7 * 29 - 12) * 100 + 1500;
      g.btype[g.t] = 87;
      g.bxtype[g.t] = 105;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 47 * 29 * 100 + 1500;
      g.bb[g.t] = (9 * 29 - 12) * 100 + 1500;
      g.btype[g.t] = 87;
      g.bxtype[g.t] = 110;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 70 * 29 * 100 + 1500;
      g.bb[g.t] = (9 * 29 - 12) * 100 + 1500;
      g.btype[g.t] = 87;
      g.bxtype[g.t] = 105;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 66 * 29 * 100 + 1501;
      g.bb[g.t] = (4 * 29 - 12) * 100 + 1500;
      g.btype[g.t] = 87;
      g.bxtype[g.t] = 101;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 85 * 29 * 100 + 1501;
      g.bb[g.t] = (4 * 29 - 12) * 100 + 1500;
      g.btype[g.t] = 87;
      g.bxtype[g.t] = 105;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 57 * 29 * 100;
      g.bb[g.t] = (2 * 29 - 12 + 10) * 100 - 500;
      g.btype[g.t] = 80;
      g.bxtype[g.t] = 1;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 77 * 29 * 100;
      g.bb[g.t] = (5 * 29 - 12) * 100;
      g.btype[g.t] = 82;
      g.bxtype[g.t] = 2;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 130 * 29 * 100;
      g.bb[g.t] = (8 * 29 - 12) * 100;
      g.btype[g.t] = 30;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.t = g.bco;
      g.ba[g.t] = 142 * 29 * 100;
      g.bb[g.t] = (10 * 29 - 12) * 100;
      g.btype[g.t] = 31;
      g.bxtype[g.t] = 0;
      g.bco++;
      g.nco = 0;
      g.na[g.nco] = 7 * 29 * 100 - 300;
      g.nb[g.nco] = 14 * 29 * 100 - 1200;
      g.ntype[g.nco] = 6;
      g.nco++;
      if (g.nco >= nmax) g.nco = 0;
      g.na[g.nco] = 41 * 29 * 100 - 300;
      g.nb[g.nco] = 14 * 29 * 100 - 1200;
      g.ntype[g.nco] = 6;
      g.nco++;
      if (g.nco >= nmax) g.nco = 0;
      g.na[g.nco] = 149 * 29 * 100 - 1100;
      g.nb[g.nco] = 10 * 29 * 100 - 600;
      g.ntype[g.nco] = 100;
      g.nco++;
      if (g.nco >= nmax) g.nco = 0;
      g.tco = 0;
      g.txtype[g.tco] = 1;
      tyobi(29 * 29, 3 * 29 - 12, 130);
      tyobi(34 * 29, 9 * 29 - 12, 5);
      tyobi(35 * 29, 9 * 29 - 12, 5);
      tyobi(55 * 29 + 15, 6 * 29 - 12, 7);
      g.txtype[g.tco] = 10;
      tyobi(50 * 29, 9 * 29 - 12, 114);
      g.txtype[g.tco] = 5;
      tyobi(1 * 29, 5 * 29 - 12, 300);
      g.txtype[g.tco] = 3;
      tyobi(86 * 29, 9 * 29 - 12, 101);
      g.txtype[g.tco] = 2;
      tyobi(86 * 29, 6 * 29 - 12, 117);
      for (g.t = 0; g.t <= 2; g.t++) {
        g.txtype[g.tco] = 3;
        tyobi((79 + g.t) * 29, 13 * 29 - 12, 115);
      }
      g.txtype[g.tco] = 3;
      tyobi(105 * 29, 11 * 29 - 12, 120);
      g.txtype[g.tco] = 3;
      tyobi(109 * 29, 7 * 29 - 12, 102);
      g.txtype[g.tco] = 4;
      tyobi(111 * 29, 7 * 29 - 12, 101);
      tyobi(132 * 29, 8 * 29 - 12 - 3, 140);
      tyobi(131 * 29, 9 * 29 - 12, 141);
      tyobi(161 * 29, 12 * 29 - 12, 142);
      tyobi(66 * 29, 4 * 29 - 12, 124);
      g.srco = 0;
      g.t = g.srco;
      g.sra[g.t] = 93 * 29 * 100;
      g.srb[g.t] = (10 * 29 - 12) * 100;
      g.src[g.t] = 60 * 100;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 1;
      g.sre[g.t] = 0;
      g.srco++;
      g.t = 20;
      g.sra[g.t] = 119 * 29 * 100 + 300;
      g.srb[g.t] = (10 * 29 - 12) * 100;
      g.src[g.t] = 12 * 30 * 100 + 1000;
      g.srtype[g.t] = 0;
      g.sracttype[g.t] = 0;
      g.srsp[g.t] = 21;
      g.sre[g.t] = 0;
      g.srco++;
      g.stc = 0;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 1 && g.stc == 0) {
      g.ma = 5600;
      g.mb = 32000;
      bgm(1);
      g.stagecolor = 1;
      g.scrollx = 2900 * (113 - 19);
      stagedatex = GRID(8);
      g.tco = 0;
      g.txtype[g.tco] = 6;
      tyobi(1 * 29, 9 * 29 - 12, 300);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(40 * 29, 9 * 29 - 12, 110);
      g.tco += 1;
      g.txtype[g.tco] = 7;
      tyobi(79 * 29, 7 * 29 - 12, 300);
      g.tco += 1;
      g.txtype[g.tco] = 2;
      tyobi(83 * 29, 7 * 29 - 12, 102);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(83 * 29, 2 * 29 - 12, 114);
      g.tco += 1;
      for (let i = -1; i > -7; i -= 1) {
        tyobi(85 * 29, i * 29 - 12, 4);
        g.tco += 1;
      }
      g.sco = 0;
      g.sa[g.sco] = 30 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 12000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 51 * 29 * 100;
      g.sb[g.sco] = (4 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 51;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 84 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 105 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 15000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.bco = 0;
      g.ba[g.bco] = 6 * 29 * 100;
      g.bb[g.bco] = (3 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 13 * 29 * 100;
      g.bb[g.bco] = (6 * 29 - 12) * 100;
      g.btype[g.bco] = 4;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 23 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 25 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 27 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 88 * 29 * 100;
      g.bb[g.bco] = (12 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 2 && g.stc == 0) {
      bgm(1);
      g.stagecolor = 1;
      g.scrollx = 2900 * (19 - 19);
      stagedatex = GRID(9);
      g.sa[g.sco] = 14 * 29 * 100 + 200;
      g.sb[g.sco] = -6000;
      g.sc[g.sco] = 5000;
      g.sd[g.sco] = 70000;
      g.stype[g.sco] = 100;
      g.sco += 1;
      g.sa[g.sco] = 12 * 29 * 100 + 1200;
      g.sb[g.sco] = -6000;
      g.sc[g.sco] = 7000;
      g.sd[g.sco] = 70000;
      g.stype[g.sco] = 101;
      g.sco += 1;
      g.sa[g.sco] = 12 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 6000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sgtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 14 * 29 * 100;
      g.sb[g.sco] = (9 * 29 - 12) * 100;
      g.sc[g.sco] = 6000;
      g.sd[g.sco] = 12000 - 200;
      g.stype[g.sco] = 50;
      g.sxtype[g.sco] = 1;
      g.sco += 1;
      tyobi(6 * 29, 9 * 29 - 12, 110);
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 2 && g.stc == 1) {
      bgm(2);
      g.stagecolor = 2;
      g.ma = 7500;
      g.mb = 9000;
      g.scrollx = 2900 * (137 - 19);
      stagedatex = GRID(10);
      g.bco = 0;
      g.ba[g.bco] = 32 * 29 * 100 - 1400;
      g.bb[g.bco] = (-2 * 29 - 12) * 100 + 500;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = (31 * 29 - 12) * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 7;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 38 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 38 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 42 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 42 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 46 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 46 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 58 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 66 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 76 * 29 * 100 - 1400;
      g.bb[g.bco] = (-2 * 29 - 12) * 100 + 500;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.sco = 0;
      g.sa[g.sco] = 2 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 300000 - 6001;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 3 * 29 * 100;
      g.sb[g.sco] = (7 * 29 - 12) * 100;
      g.sc[g.sco] = 3000;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 105;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 107 * 29 * 100;
      g.sb[g.sco] = (9 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 24000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 1;
      g.sco += 1;
      g.sa[g.sco] = 111 * 29 * 100;
      g.sb[g.sco] = (7 * 29 - 12) * 100;
      g.sc[g.sco] = 3000;
      g.sd[g.sco] = 6000 - 200;
      g.stype[g.sco] = 40;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 113 * 29 * 100 + 1100;
      g.sb[g.sco] = (0 * 29 - 12) * 100;
      g.sc[g.sco] = 4700;
      g.sd[g.sco] = 27000 - 1000;
      g.stype[g.sco] = 0;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 128 * 29 * 100;
      g.sb[g.sco] = (9 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 24000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 1;
      g.sco += 1;
      g.sa[g.sco] = 131 * 29 * 100;
      g.sb[g.sco] = (9 * 29 - 12) * 100;
      g.sc[g.sco] = 3000;
      g.sd[g.sco] = 6000 - 200;
      g.stype[g.sco] = 40;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 133 * 29 * 100 + 1100;
      g.sb[g.sco] = (0 * 29 - 12) * 100;
      g.sc[g.sco] = 4700;
      g.sd[g.sco] = 32000;
      g.stype[g.sco] = 0;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.tco = 0;
      g.txtype[g.tco] = 0;
      tyobi(0 * 29, 0 * 29 - 12, 4);
      g.tco = 1;
      g.txtype[g.tco] = 0;
      tyobi(2 * 29, 9 * 29 - 12, 4);
      g.tco = 2;
      g.txtype[g.tco] = 0;
      tyobi(3 * 29, 9 * 29 - 12, 4);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(5 * 29, 9 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(6 * 29, 9 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(5 * 29, 10 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(6 * 29, 10 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(5 * 29, 11 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(6 * 29, 11 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(5 * 29, 12 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(6 * 29, 12 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(70 * 29, 7 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(71 * 29, 7 * 29 - 12, 115);
      g.tco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 2 && g.stc == 2) {
      bgm(1);
      g.stagecolor = 1;
      g.scrollx = 2900 * (36 - 19);
      g.ma = 7500;
      g.mb = 3000 * 9;
      stagedatex = GRID(11);
      g.bco = 0;
      g.ba[g.bco] = 9 * 29 * 100;
      g.bb[g.bco] = (12 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 10 * 29 * 100;
      g.bb[g.bco] = (11 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 11 * 29 * 100;
      g.bb[g.bco] = (10 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 12 * 29 * 100;
      g.bb[g.bco] = (9 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 13 * 29 * 100;
      g.bb[g.bco] = (8 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 14 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 15 * 29 * 100;
      g.bb[g.bco] = (6 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 16 * 29 * 100;
      g.bb[g.bco] = (5 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 17 * 29 * 100;
      g.bb[g.bco] = (5 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 18 * 29 * 100;
      g.bb[g.bco] = (5 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 19 * 29 * 100;
      g.bb[g.bco] = (5 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 20 * 29 * 100;
      g.bb[g.bco] = (5 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 3 && g.stc == 0) {
      g.ma = 7500;
      g.mb = 3000 * 8;
      bgm(1);
      g.stagecolor = 1;
      g.scrollx = 2900 * (126 - 19);
      stagedatex = GRID(12);
      g.tco = 0;
      g.txtype[g.tco] = 0;
      for (let i = -1; i > -7; i -= 1) {
        tyobi(55 * 29, i * 29 - 12, 4);
        g.tco += 1;
      }
      g.txtype[g.tco] = 0;
      tyobi(64 * 29, 12 * 29 - 12, 120);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(66 * 29, 3 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(67 * 29, 3 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(68 * 29, 3 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 8;
      tyobi(60 * 29, 6 * 29 - 12, 300);
      g.tco += 1;
      g.sco = 0;
      g.ba[g.sco] = (102 * 29 - 12) * 100;
      g.bb[g.sco] = (10 * 29 - 12) * 100;
      g.btype[g.sco] = 50;
      g.bxtype[g.sco] = 1;
      g.sco += 1;
      g.srco = 0;
      g.sra[g.srco] = 1 * 29 * 100;
      g.srb[g.srco] = (10 * 29 - 12) * 100;
      g.src[g.srco] = 5 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 1;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 10;
      g.srco++;
      g.sra[g.srco] = 18 * 29 * 100;
      g.srb[g.srco] = (4 * 29 - 12) * 100;
      g.src[g.srco] = 3 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 10;
      g.srco++;
      g.sra[g.srco] = 35 * 29 * 100;
      g.srb[g.srco] = (4 * 29 - 12) * 100;
      g.src[g.srco] = 5 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 10;
      g.srco++;
      g.sra[g.srco] = 35 * 29 * 100;
      g.srb[g.srco] = (8 * 29 - 12) * 100;
      g.src[g.srco] = 5 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 10;
      g.srco++;
      g.sra[g.srco] = 94 * 29 * 100;
      g.srb[g.srco] = (6 * 29 - 12) * 100;
      g.src[g.srco] = 3 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 1;
      g.srco++;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 4 && (g.stc == 0 || g.stc == 10 || g.stc == 12)) {
      if (g.stc == 0) {
        g.ma = 7500;
        g.mb = 3000 * 4;
      } else {
        g.ma = 19500;
        g.mb = 3000 * 11;
        g.stc = 0;
      }
      bgm(4);
      g.stagecolor = 4;
      g.scrollx = 2900 * (40 - 19);
      stagedatex = GRID(13);
      g.tco = 0;
      g.txtype[g.tco] = 0;
      tyobi(0 * 29, -1 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(4 * 29, -1 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(1 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(6 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(7 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.bco = 0;
      g.ba[g.bco] = 2 * 29 * 100 - 1400;
      g.bb[g.bco] = (-2 * 29 - 12) * 100 + 500;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 20 * 29 * 100 + 1500;
      g.bb[g.bco] = (5 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.sco = 0;
      g.sa[g.sco] = 17 * 29 * 100;
      g.sb[g.sco] = (9 * 29 - 12) * 100;
      g.sc[g.sco] = 21000 - 1;
      g.sd[g.sco] = 3000 - 1;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 27 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 6000;
      g.sd[g.sco] = 6000;
      g.stype[g.sco] = 50;
      g.sxtype[g.sco] = 6;
      g.sco += 1;
      g.sa[g.sco] = 34 * 29 * 100;
      g.sb[g.sco] = (5 * 29 - 12) * 100;
      g.sc[g.sco] = 6000;
      g.sd[g.sco] = 30000;
      g.stype[g.sco] = 50;
      g.sxtype[g.sco] = 1;
      g.sco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 4 && g.stc == 1) {
      g.ma = 4500;
      g.mb = 3000 * 11;
      bgm(4);
      g.stagecolor = 4;
      g.scrollx = 2900 * (21 - 19);
      stagedatex = GRID(14);
      g.tco = 0;
      g.txtype[g.tco] = 1;
      tyobi(12 * 29, 13 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(13 * 29, 13 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(14 * 29, 13 * 29 - 12, 115);
      g.tco += 1;
      g.sco = 0;
      g.sa[g.sco] = 6 * 29 * 100;
      g.sb[g.sco] = (6 * 29 - 12) * 100;
      g.sc[g.sco] = 18000 - 1;
      g.sd[g.sco] = 6000 - 1;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 12 * 29 * 100;
      g.sb[g.sco] = (8 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000 - 1;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 15 * 29 * 100;
      g.sb[g.sco] = (11 * 29 - 12) * 100;
      g.sc[g.sco] = 3000;
      g.sd[g.sco] = 6000;
      g.stype[g.sco] = 40;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 17 * 29 * 100 + 1100;
      g.sb[g.sco] = (0 * 29 - 12) * 100;
      g.sc[g.sco] = 4700;
      g.sd[g.sco] = 38000;
      g.stype[g.sco] = 0;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 2 && g.stb == 4 && g.stc == 2) {
      g.ma = 4500;
      g.mb = 3000 * 11;
      bgm(5);
      g.stagecolor = 4;
      g.scrollx = 2900 * (128 - 19);
      stagedatex = GRID(15);
      g.tco = 0;
      g.txtype[g.tco] = 0;
      tyobi(1 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(2 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 9;
      tyobi(3 * 29, 4 * 29 - 12, 300);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(32 * 29, 9 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(76 * 29, 14 * 29 - 12, 5);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(108 * 29, 11 * 29 - 12, 141);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(109 * 29, 10 * 29 - 12 - 3, 140);
      g.tco += 1;
      g.txtype[g.tco] = 0;
      tyobi(121 * 29, 10 * 29 - 12, 142);
      g.tco += 1;
      g.bco = 0;
      g.ba[g.bco] = 0 * 29 * 100 + 1500;
      g.bb[g.bco] = (8 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 2 * 29 * 100;
      g.bb[g.bco] = (0 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 3 * 29 * 100 + 1500;
      g.bb[g.bco] = (8 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 6 * 29 * 100 + 1500;
      g.bb[g.bco] = (8 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 9 * 29 * 100 + 1500;
      g.bb[g.bco] = (8 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 107;
      g.bco += 1;
      g.ba[g.bco] = 25 * 29 * 100 - 1400;
      g.bb[g.bco] = (2 * 29 - 12) * 100 - 400;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 40 * 29 * 100;
      g.bb[g.bco] = (8 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 42 * 29 * 100;
      g.bb[g.bco] = (8 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 43 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 47 * 29 * 100 + 1500;
      g.bb[g.bco] = (6 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 57 * 29 * 100;
      g.bb[g.bco] = (7 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 77 * 29 * 100 - 1400;
      g.bb[g.bco] = (2 * 29 - 12) * 100 - 400;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 83 * 29 * 100 - 1400;
      g.bb[g.bco] = (2 * 29 - 12) * 100 - 400;
      g.btype[g.bco] = 86;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 88 * 29 * 100 + 1500;
      g.bb[g.bco] = (9 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 88 * 29 * 100 + 1500;
      g.bb[g.bco] = (9 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 90 * 29 * 100;
      g.bb[g.bco] = (9 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.ba[g.bco] = 107 * 29 * 100;
      g.bb[g.bco] = (10 * 29 - 12) * 100;
      g.btype[g.bco] = 30;
      g.bxtype[g.bco] = 0;
      g.bco += 1;
      g.sco = 0;
      g.sa[g.sco] = 13 * 29 * 100;
      g.sb[g.sco] = (8 * 29 - 12) * 100;
      g.sc[g.sco] = 33000 - 1;
      g.sd[g.sco] = 3000 - 1;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 13 * 29 * 100;
      g.sb[g.sco] = (0 * 29 - 12) * 100;
      g.sc[g.sco] = 33000 - 1;
      g.sd[g.sco] = 3000 - 1;
      g.stype[g.sco] = 51;
      g.sxtype[g.sco] = 3;
      g.sco += 1;
      g.sa[g.sco] = 10 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 6000;
      g.sd[g.sco] = 6000;
      g.stype[g.sco] = 50;
      g.sxtype[g.sco] = 6;
      g.sco += 1;
      g.sa[g.sco] = 46 * 29 * 100;
      g.sb[g.sco] = (12 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000 - 1;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 2;
      g.sco += 1;
      g.sa[g.sco] = 58 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 6000;
      g.sd[g.sco] = 6000;
      g.stype[g.sco] = 50;
      g.sxtype[g.sco] = 6;
      g.sco += 1;
      g.sa[g.sco] = 101 * 29 * 100 - 1500;
      g.sb[g.sco] = (10 * 29 - 12) * 100 - 3000;
      g.sc[g.sco] = 12000;
      g.sd[g.sco] = 12000;
      g.stype[g.sco] = 104;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 102 * 29 * 100 + 3000;
      g.sb[g.sco] = (2 * 29 - 12) * 100;
      g.sc[g.sco] = 3000 - 1;
      g.sd[g.sco] = 300000;
      g.stype[g.sco] = 102;
      g.sxtype[g.sco] = 20;
      g.sco += 1;
      g.srco = 0;
      g.sra[g.srco] = 74 * 29 * 100 - 1500;
      g.srb[g.srco] = (7 * 29 - 12) * 100;
      g.src[g.srco] = 2 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 1;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 0;
      g.srco = 20;
      g.sra[g.srco] = 97 * 29 * 100;
      g.srb[g.srco] = (12 * 29 - 12) * 100;
      g.src[g.srco] = 12 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 21;
      g.srco += 1;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
    if (g.sta == 3 && g.stb == 1 && g.stc == 0) {
      g.ma = 5600;
      g.mb = 32000;
      bgm(1);
      g.stagecolor = 5;
      g.scrollx = 2900 * (112 - 19);
      stagedatex = GRID(16);
      g.tco = 0;
      g.txtype[g.tco] = 10;
      tyobi(2 * 29, 9 * 29 - 12, 300);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(63 * 29, 13 * 29 - 12, 115);
      g.tco += 1;
      g.txtype[g.tco] = 1;
      tyobi(64 * 29, 13 * 29 - 12, 115);
      g.tco += 1;
      g.sco = 0;
      g.sa[g.sco] = 13 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.sa[g.sco] = 84 * 29 * 100;
      g.sb[g.sco] = (13 * 29 - 12) * 100;
      g.sc[g.sco] = 9000 - 1;
      g.sd[g.sco] = 3000;
      g.stype[g.sco] = 52;
      g.sxtype[g.sco] = 0;
      g.sco += 1;
      g.bco = 0;
      g.ba[g.bco] = 108 * 29 * 100;
      g.bb[g.bco] = (6 * 29 - 12) * 100;
      g.btype[g.bco] = 6;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 33 * 29 * 100;
      g.bb[g.bco] = (10 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 36 * 29 * 100;
      g.bb[g.bco] = (0 * 29 - 12) * 100;
      g.btype[g.bco] = 80;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.ba[g.bco] = 78 * 29 * 100 + 1500;
      g.bb[g.bco] = (7 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 88;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 80 * 29 * 100 + 1500;
      g.bb[g.bco] = (7 * 29 - 12) * 100 + 1500;
      g.btype[g.bco] = 87;
      g.bxtype[g.bco] = 105;
      g.bco += 1;
      g.ba[g.bco] = 85 * 29 * 100;
      g.bb[g.bco] = (11 * 29 - 12) * 100;
      g.btype[g.bco] = 82;
      g.bxtype[g.bco] = 1;
      g.bco += 1;
      g.srco = 0;
      g.sra[g.srco] = 41 * 29 * 100;
      g.srb[g.srco] = (3 * 29 - 12) * 100;
      g.src[g.srco] = 3 * 3000;
      g.srtype[g.srco] = 0;
      g.sracttype[g.srco] = 0;
      g.sre[g.srco] = 0;
      g.srsp[g.srco] = 3;
      g.srco = 0;
      for (g.tt = 0; g.tt <= 1000; g.tt++) {
        for (g.t = 0; g.t <= 16; g.t++) {
          g.stagedate[g.t][g.tt] = 0;
          g.stagedate[g.t][g.tt] = stagedatex[g.t][g.tt];
        }
      }
    }
  }
  function tyobi(x, y, type) {
    g.ta[g.tco] = x * 100;
    g.tb[g.tco] = y * 100;
    g.ttype[g.tco] = type;
    g.tco++;
    if (g.tco >= tmax) g.tco = 0;
  }
  function brockbreak(t) {
    if (g.titem[t] == 1) {}
    if (g.titem[t] >= 2 && g.titem[t] <= 7) {}
    g.ta[t] = -800000;
  }
  function eyobi(xa, xb, xc, xd, xe, xf, xnobia, xnobib, xgtype, xtm) {
    g.ea[g.eco] = xa;
    g.eb[g.eco] = xb;
    g.ec[g.eco] = xc;
    g.ed[g.eco] = xd;
    g.ee[g.eco] = xe;
    g.ef[g.eco] = xf;
    g.egtype[g.eco] = xgtype;
    g.etm[g.eco] = xtm;
    g.enobia[g.eco] = xnobia;
    g.enobib[g.eco] = xnobib;
    g.eco++;
    if (g.eco >= emax) g.eco = 0;
  }
  function ayobi(xa, xb, xc, xd, xnotm, xtype, xxtype) {
    let rz = 0;
    for (g.t1 = 0; g.t1 <= 1; g.t1++) {
      g.t1 = 2;
      if (g.aa[g.aco] >= -9000 && g.aa[g.aco] <= 30000) g.t1 = 0;
      rz++;
      if (rz <= amax) {
        g.t1 = 3;
        g.aa[g.aco] = xa;
        g.ab[g.aco] = xb;
        g.ac[g.aco] = xc;
        g.ad[g.aco] = xd;
        if (xxtype > 100) g.ac[g.aco] = xxtype;
        g.atype[g.aco] = xtype;
        if (xxtype >= 0 && xxtype <= 99100) g.axtype[g.aco] = xxtype;
        g.anotm[g.aco] = xnotm;
        if (g.aa[g.aco] - g.fx <= g.ma + (g.mnobia / 2 | 0)) g.amuki[g.aco] = 1;
        if (g.aa[g.aco] - g.fx > g.ma + (g.mnobia / 2 | 0)) g.amuki[g.aco] = 0;
        if (g.abrocktm[g.aco] >= 1) g.amuki[g.aco] = 1;
        if (g.abrocktm[g.aco] == 20) g.amuki[g.aco] = 0;
        g.anobia[g.aco] = g.anx[g.atype[g.aco]];
        g.anobib[g.aco] = g.any[g.atype[g.aco]];
        if (xtype == 7 && 0 == 0) {
          snd(10);
        }
        if (xtype == 10 && 0 == 0) {
          snd(18);
        }
        g.azimentype[g.aco] = 1;
        switch (g.atype[g.aco]) {
        }
        if (xtype == 87) {
          g.atm[g.aco] = rnd(179) + -90;
        }
        g.aco += 1;
        if (g.aco >= amax - 1) {
          g.aco = 0;
        }
      }
    }
  }


  return { g, Mainprogram };
}
