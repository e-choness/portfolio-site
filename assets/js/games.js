// EchoOS Arcade — the runner and a loader, nothing else.
// Each game lives in games/<id>.js and is fetched the first time it is played,
// so a visit that never opens the Arcade never pays for any of them. Every
// sprite, sound and explosion is still generated in JS: no art or audio files.
//
// This file knows how to *run* an id; it deliberately holds no catalogue. Names,
// tags, glyphs, hints, pads and exhibit copy all live in _data/arcade.yml and
// reach the grid through apps/arcade.js.
//
// window.EchoGames.start(canvas, id, theme, onScore, dataName?)
//   -> Promise<{ stop(), pointer(x, y, type), key(k) }>
// window.EchoGames.preload([id, ...], [dataName, ...])  — warm, ignore failures
(function(){
  const HS='echoos-hiscores';
  const hs=()=>{try{return JSON.parse(localStorage.getItem(HS)||'{}')}catch(e){return{}}};
  const setHs=(g,v)=>{const h=hs();if(v>(h[g]||0)){h[g]=v;localStorage.setItem(HS,JSON.stringify(h));}};

  // games/ sits next to this file, and the data files a game may want are in
  // ../data/. Take the URL from the script element rather than a literal, so it
  // keeps working under the site's baseurl; fall back to the root element's
  // data-base if currentScript is unavailable.
  const here=document.currentScript&&document.currentScript.src;
  const root=document.getElementById('echoos-root');
  const base=here?here.replace(/[^/]*$/,''):((root&&root.dataset.base)||'')+'/assets/js/';
  const dir=base+'games/';
  const dataDir=base.replace(/js\/$/,'data/');

  const mods={};
  const fetchGame=(id)=>import(dir+id+'.js');
  // Every game imports common.js, so left alone the browser would discover it
  // only after the game module has been fetched and parsed — two round trips for
  // one click. Kick it off alongside instead; the module map dedupes the fetch.
  let commonStarted=false;
  function fetchCommon(){
    if(commonStarted)return;
    commonStarted=true;
    import(dir+'common.js').catch(()=>{commonStarted=false});
  }
  function load(id){
    if(!mods[id]){
      fetchCommon();
      mods[id]=fetchGame(id).then(m=>m.default,e=>{delete mods[id];throw e});
    }
    return mods[id];
  }
  // A game whose registry entry names a `data` file gets it as env.data. It
  // lives in _data/<name>.yml and is emitted to /assets/data/<name>.json, so the
  // figures stay editable as YAML next to the rest of the site's content.
  const datas={};
  function loadData(name){
    if(!datas[name])datas[name]=fetch(dataDir+name+'.json')
      .then(r=>{if(!r.ok)throw new Error(name+'.json '+r.status);return r.json()})
      .catch(e=>{delete datas[name];throw e});
    return datas[name];
  }

  // Warm the caches ahead of a click. Failures are ignored here — if the game is
  // really needed, start() will ask again and surface the error then.
  function preload(ids,dataNames){
    for(const id of ids||[])load(id).catch(()=>{});
    for(const n of dataNames||[])loadData(n).catch(()=>{});
  }

  function makeRunner(canvas, gameId, theme, onScore, factory, data){
    const ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
    const T=theme, beep=(f,d)=>{if(T.beep)T.beep(f,d)};
    let score=0, over=false, dead=false;
    const report=()=>{setHs(gameId,score);onScore(score,over,Math.max(score,hs()[gameId]||0))};
    const addScore=(n)=>{score+=n;report()};
    const gameOver=()=>{if(over)return;over=true;beep(160,.3);report()};
    const G=factory({ctx,W,H,T,beep,addScore,gameOver,isOver:()=>over,data});
    let raf=null,last=0;
    const kd=e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>-1)e.preventDefault();if(over){canvas.dispatchEvent(new CustomEvent('echoos:game-restart',{bubbles:true}));}else if(G.key)G.key(e.key,true)};
    const ku=e=>{if(G.key)G.key(e.key,false)};
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
    function loop(t){if(dead)return;raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-last)/1000||.016);last=t;G.tick(dt);
      if(over){ctx.fillStyle=T.overlay;ctx.fillRect(0,0,W,H);ctx.fillStyle=T.ink;ctx.font='700 26px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-8);ctx.font='13px "IBM Plex Mono",monospace';ctx.fillStyle=T.muted;ctx.fillText('score '+score+'  ·  press any key to restart',W/2,H/2+20);}}
    raf=requestAnimationFrame(loop);
    report();
    return {
      stop(){dead=true;if(raf)cancelAnimationFrame(raf);window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);},
      pointer(x,y,type){if(G.pointer&&!over)G.pointer(x,y,type)},
      key(k){if(G.key&&!over){G.key(k,true);setTimeout(()=>{if(!dead&&G.key)G.key(k,false)},90)}}
    };
  }

  // The module and its data are fetched together, not one after the other.
  function start(canvas, gameId, theme, onScore, dataName){
    return Promise.all([load(gameId), dataName?loadData(dataName):null])
      .then(([factory,data])=>makeRunner(canvas,gameId,theme,onScore,factory,data));
  }

  window.EchoGames={start, load, preload, highscores:hs};
})();
