import { useState, useEffect, useRef } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.8)} } @keyframes br-cursor    { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-wave      { 0%,100%{transform:scaleY(0.08)} 50%{transform:scaleY(1)} } @keyframes br-breathe   { 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.1);opacity:0.9} } @keyframes br-tileIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const ALL_APPS = [
  { id:"lucidia",    name:"Lucidia",      tag:"AI Companion",   cat:"core",   icon:"◈", color:"#FF8400", phase:"Live", running:true,  domain:"app.lucidia.earth",    pinned:true  },
  { id:"roadwork",   name:"RoadWork",     tag:"Adaptive Learn", cat:"learn",  icon:"◉", color:"#0066FF", phase:"P2",   running:true,  domain:"edu.blackroad.io",     pinned:true  },
  { id:"roadview",   name:"RoadView",     tag:"Truth-First",    cat:"core",   icon:"◎", color:"#FF0066", phase:"P2",   running:false, domain:"roadview.blackroad.io",pinned:false },
  { id:"roadglitch", name:"RoadGlitch",   tag:"Automation",     cat:"build",  icon:"⬡", color:"#8800FF", phase:"P2",   running:false, domain:"glitch.blackroad.io",  pinned:false },
  { id:"roadworld",  name:"RoadWorld",    tag:"VR Sandbox",     cat:"create", icon:"⬢", color:"#CC00AA", phase:"P3",   running:false, domain:"world.blackroad.io",   pinned:false },
  { id:"backroad",   name:"BackRoad",     tag:"Social OS",      cat:"connect",icon:"◇", color:"#FF4400", phase:"P3",   running:false, domain:"social.blackroad.io",  pinned:true  },
  { id:"soundroad",  name:"SoundRoad",    tag:"AI Music",       cat:"create", icon:"♬", color:"#FF8400", phase:"P2",   running:false, domain:"sound.blackroad.io",   pinned:false },
  { id:"genesis",    name:"Genesis Road", tag:"Game Engine",    cat:"create", icon:"⬟", color:"#0066FF", phase:"P3",   running:false, domain:"genesis.blackroad.io", pinned:false },
  { id:"vaultroad",  name:"VaultRoad",    tag:"Second Brain",   cat:"build",  icon:"▣", color:"#8800FF", phase:"P2",   running:false, domain:"vault.blackroad.io",   pinned:false },
  { id:"cashroad",   name:"CashRoad",     tag:"Finance",        cat:"build",  icon:"◈", color:"#FF0066", phase:"P3",   running:false, domain:"cash.blackroad.io",    pinned:false },
  { id:"cadence",    name:"Cadence",      tag:"Music Collab",   cat:"create", icon:"◎", color:"#CC00AA", phase:"P2",   running:false, domain:"cadence.lucidia.studio",pinned:false },
  { id:"radius",     name:"Radius",       tag:"Simulation",     cat:"build",  icon:"◉", color:"#FF4400", phase:"P3",   running:false, domain:"radius.blackroad.io",  pinned:false },
  { id:"roadchat",   name:"Road Chat",    tag:"Comms",          cat:"connect",icon:"◇", color:"#0066FF", phase:"P2",   running:false, domain:"chat.blackroad.io",    pinned:false },
  { id:"roadflow",   name:"Road Flow",    tag:"Pipelines",      cat:"build",  icon:"⬡", color:"#8800FF", phase:"P3",   running:false, domain:"flow.blackroad.io",    pinned:false },
  { id:"roadmind",   name:"Road Mind",    tag:"Reasoning",      cat:"build",  icon:"⬢", color:"#FF8400", phase:"P3",   running:false, domain:"mind.blackroad.io",    pinned:false },
  { id:"roadcast",   name:"Road Cast",    tag:"Streaming",      cat:"connect",icon:"♬", color:"#FF0066", phase:"P4",   running:false, domain:"cast.blackroad.io",    pinned:false },
  { id:"roadsync",   name:"Road Sync",    tag:"Cross-Device",   cat:"build",  icon:"▣", color:"#0066FF", phase:"P2",   running:false, domain:"sync.blackroad.io",    pinned:false },
  { id:"meridian",   name:"Meridian",     tag:"Architecture",   cat:"build",  icon:"⬟", color:"#CC00AA", phase:"P4",   running:false, domain:"meridian.blackroad.io",pinned:false },
];

const AGENTS = [
  { name:"cecilia", color:"#FF8400", state:"active",    cap:92 },
  { name:"lucidia", color:"#8800FF", state:"active",    cap:78 },
  { name:"atlas",   color:"#0066FF", state:"active",    cap:55 },
  { name:"cadence", color:"#FF0066", state:"standby",   cap:0  },
  { name:"olympia", color:"#CC00AA", state:"standby",   cap:0  },
  { name:"eve",     color:"#FF4400", state:"offline",   cap:0  },
  { name:"nova",    color:"#2233CC", state:"offline",   cap:0  },
];

const CATS = [
  { id:"all",     label:"All",     count:ALL_APPS.length },
  { id:"pinned",  label:"Pinned",  count:ALL_APPS.filter(a=>a.pinned).length },
  { id:"core",    label:"Core",    count:ALL_APPS.filter(a=>a.cat==="core").length },
  { id:"create",  label:"Create",  count:ALL_APPS.filter(a=>a.cat==="create").length },
  { id:"learn",   label:"Learn",   count:ALL_APPS.filter(a=>a.cat==="learn").length },
  { id:"connect", label:"Connect", count:ALL_APPS.filter(a=>a.cat==="connect").length },
  { id:"build",   label:"Build",   count:ALL_APPS.filter(a=>a.cat==="build").length },
];

const DOCK_APPS = ALL_APPS.filter(a=>a.pinned).concat(ALL_APPS.filter(a=>a.running&&!a.pinned));

const GradBar = ({h=3}) => <div style={{height:h,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",flexShrink:0}}/>;

const AgentDot = ({color,state}) => (
  <div style={{width:5,height:5,borderRadius:"50%",background:state==="offline"?"rgba(255,255,255,.1)":color,animation:state==="active"?"br-pulse 2s ease-in-out infinite":"none",flexShrink:0}}/>
);

export default function AppLauncher() {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchIdx, setSearchIdx] = useState(0);
  const [clock, setClock] = useState("");
  const [kt, setKt] = useState(0.94);
  const [launched, setLaunched] = useState(null);
  const searchRef = useRef(null);

  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  useEffect(()=>{
    const tick = ()=>{
      const now = new Date();
      setClock(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`);
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const id = setInterval(()=>setKt(v=>+(0.86+Math.random()*0.14).toFixed(2)),4000);
    return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const handler = (e)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setSearchOpen(v=>!v); }
      if(e.key==="Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown",handler);
    return ()=>window.removeEventListener("keydown",handler);
  },[]);

  useEffect(()=>{ if(searchOpen&&searchRef.current) searchRef.current.focus(); },[searchOpen]);

  const visible = ALL_APPS.filter(a=>{
    const matchCat = cat==="all"||(cat==="pinned"&&a.pinned)||a.cat===cat;
    const matchQ = !search||a.name.toLowerCase().includes(search.toLowerCase())||a.tag.toLowerCase().includes(search.toLowerCase());
    return matchCat&&matchQ;
  });

  const searchResults = ALL_APPS.filter(a=>!searchQ||a.name.toLowerCase().includes(searchQ.toLowerCase())||a.tag.toLowerCase().includes(searchQ.toLowerCase()));

  const running = ALL_APPS.filter(a=>a.running);

  const launchApp = (id)=>{ setLaunched(id); setTimeout(()=>setLaunched(null),600); };

  const Tile = ({app, wide}) => (
    <div onClick={()=>launchApp(app.id)} style={{background:"#000",padding:wide?"20px 24px":"18px 16px",display:"flex",flexDirection:wide?"row":"column",gap:wide?20:12,cursor:"pointer",position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,.06)",transition:"border-color .15s",animation:"br-tileIn .25s ease both",boxShadow:launched===app.id?"inset 0 0 0 1px #fff":"none"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:app.color}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flex:1}}>
        <div>
          <div style={{fontSize:wide?"1.5rem":"1.1rem",marginBottom:4,opacity:.45}}>{app.icon}</div>
          <div style={{fontFamily:DISP,fontSize:wide?"1.1rem":".9rem",fontWeight:700,marginBottom:2}}>{app.name}</div>
          <div style={{fontSize:8,opacity:.28,letterSpacing:"0.1em",textTransform:"uppercase"}}>{app.tag}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
          <span style={{fontFamily:MONO,fontSize:7,fontWeight:700,padding:"2px 5px",border:`1px solid ${app.phase==="Live"?"#FF8400":"rgba(255,255,255,.18)"}`,color:app.phase==="Live"?"#FF8400":"rgba(255,255,255,.28)"}}>{app.phase}</span>
          {app.running&&<div style={{width:5,height:5,borderRadius:"50%",background:app.color,animation:"br-pulse 2s ease-in-out infinite"}}/>}
        </div>
      </div>
      {wide&&<div style={{fontSize:10,opacity:.3,lineHeight:1.8,maxWidth:280,flexShrink:0}}>Active session · {Math.floor(Math.random()*60+5)}min</div>}
    </div>
  );

  return (
    <div style={{background:"#000",color:"#fff",height:"100vh",display:"flex",flexDirection:"column",fontFamily:MONO,overflow:"hidden"}}>
      <GradBar/>

      {/* TOP BAR */}
      <div style={{height:40,background:"#000",borderBottom:"1px solid rgba(255,255,255,.12)",display:"flex",alignItems:"center",padding:"0 16px",gap:16,flexShrink:0}}>
        <span style={{fontFamily:DISP,fontSize:12,fontWeight:700}}>BlackRoad</span>
        <div style={{fontSize:8,opacity:.2}}>OS v1.0</div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="⌕  search apps…" style={{fontFamily:MONO,fontSize:9,color:"rgba(255,255,255,.5)",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.1)",padding:"4px 10px",width:180,outline:"none",height:26}}/>
          <span style={{fontSize:8,opacity:.18}}>⌘K</span>
        </div>
        {/* live agents */}
        <div style={{display:"flex",gap:12}}>
          {AGENTS.filter(a=>a.state==="active").map(a=>(
            <div key={a.name} style={{display:"flex",alignItems:"center",gap:5}}>
              <AgentDot color={a.color} state={a.state}/>
              <span style={{fontSize:8,opacity:.45}}>{a.name}</span>
            </div>
          ))}
        </div>
        <div style={{width:1,height:16,background:"rgba(255,255,255,.1)"}}/>
        <span style={{fontSize:9,opacity:.4,fontFamily:MONO}}>{clock}</span>
        <div style={{width:22,height:22,borderRadius:"50%",background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#000"}}>A</div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* LEFT RAIL */}
        <div style={{width:52,background:"#000",borderRight:"1px solid rgba(255,255,255,.08)",display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:2,flexShrink:0}}>
          {[{icon:"⊞",id:"apps",active:true},{icon:"◧",id:"files"},{icon:"◈",id:"agents"},{icon:"⊛",id:"memory"},{icon:"◎",id:"settings"}].map(r=>(
            <div key={r.id} title={r.id} style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:r.active?1:.28,cursor:"pointer",borderLeft:r.active?"2px solid #fff":"2px solid transparent",transition:"opacity .15s"}}>{r.icon}</div>
          ))}
          <div style={{flex:1}}/>
          {/* pinned apps */}
          <div style={{width:1,height:20,background:"rgba(255,255,255,.08)",margin:"4px 0"}}/>
          {ALL_APPS.filter(a=>a.pinned).slice(0,4).map(a=>(
            <div key={a.id} onClick={()=>launchApp(a.id)} title={a.name} style={{width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,opacity:.35,cursor:"pointer",position:"relative",transition:"opacity .15s"}}>
              {a.icon}
              {a.running&&<div style={{position:"absolute",bottom:2,right:2,width:4,height:4,borderRadius:"50%",background:a.color,animation:"br-pulse 2s ease-in-out infinite"}}/>}
            </div>
          ))}
        </div>

        {/* MAIN AREA */}
        <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column"}}>

          {/* CAT TABS */}
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0,background:"#000",position:"sticky",top:0,zIndex:10}}>
            {CATS.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{background:"none",border:"none",color:"#fff",fontFamily:MONO,fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",padding:"9px 12px",opacity:cat===c.id?1:.28,borderBottom:cat===c.id?"2px solid #fff":"2px solid transparent",marginBottom:-1,transition:"opacity .15s",whiteSpace:"nowrap"}}>
                {c.label} <span style={{opacity:.35}}>({c.count})</span>
              </button>
            ))}
          </div>

          <div style={{padding:"16px",flex:1}}>
            {/* RUNNING */}
            {running.length>0&&(cat==="all"||cat==="pinned")&&(
              <>
                <div style={{fontSize:8,opacity:.22,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>Running Now</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,marginBottom:20}}>
                  {running.map(a=><Tile key={a.id} app={a} wide/>)}
                </div>
              </>
            )}

            {/* GRID */}
            {visible.filter(a=>!a.running).length>0&&(
              <>
                {(cat==="all"||cat==="pinned")&&running.length>0&&<div style={{fontSize:8,opacity:.22,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:10}}>All Apps</div>}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:1}}>
                  {visible.filter(a=>!a.running).map(a=><Tile key={a.id} app={a}/>)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:220,background:"#000",borderLeft:"1px solid rgba(255,255,255,.08)",display:"flex",flexDirection:"column",gap:0,overflow:"auto",flexShrink:0}}>

          {/* K(t) meter */}
          <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
            <div style={{fontSize:8,opacity:.22,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Creative Energy</div>
            <div style={{fontFamily:DISP,fontSize:"1.6rem",fontWeight:700,marginBottom:4,lineHeight:1}}>{kt}</div>
            <div style={{fontSize:8,opacity:.22,marginBottom:10}}>K(t) = C·e^(λ|δ|)</div>
            <div style={{height:2,background:"rgba(255,255,255,.08)",borderRadius:1,marginBottom:4}}>
              <div style={{height:"100%",background:GRAD,backgroundSize:"300%",animation:"br-gradShift 3s ease infinite",width:`${kt*100}%`,transition:"width .8s ease"}}/>
            </div>
            <div style={{fontSize:8,opacity:.2}}>{Math.round((1-kt)*100)}% contradiction density</div>
          </div>

          {/* agents */}
          <div style={{padding:"16px 14px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
            <div style={{fontSize:8,opacity:.22,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Agent Status</div>
            {AGENTS.map(a=>(
              <div key={a.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <AgentDot color={a.color} state={a.state}/>
                <span style={{fontSize:9,opacity:a.state==="offline"?.2:.45,flex:1}}>{a.name}</span>
                {a.cap>0&&<div style={{width:30,height:1,background:"rgba(255,255,255,.1)"}}>
                  <div style={{height:"100%",background:a.color,width:`${a.cap}%`}}/>
                </div>}
              </div>
            ))}
          </div>

          {/* storage */}
          <div style={{padding:"16px 14px"}}>
            <div style={{fontSize:8,opacity:.22,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12}}>Storage</div>
            {[{l:"PS-SHA∞ Commits",v:"14.2K",pct:58},{l:"Objects",v:"2.4TB / 7TB",pct:34},{l:"Vectors",v:"892K embeds",pct:67}].map(s=>(
              <div key={s.l} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:8,opacity:.3}}>{s.l}</span>
                  <span style={{fontSize:8,opacity:.45,fontFamily:MONO}}>{s.v}</span>
                </div>
                <div style={{height:1,background:"rgba(255,255,255,.08)"}}>
                  <div style={{height:"100%",background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite",width:`${s.pct}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DOCK */}
      <div style={{height:56,background:"#000",borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",justifyContent:"center",gap:0,padding:"0 12px",flexShrink:0}}>
        {DOCK_APPS.map((a,i)=>(
          <div key={a.id} onClick={()=>launchApp(a.id)} title={a.name} style={{width:40,height:40,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,cursor:"pointer",position:"relative",transition:"transform .12s",transform:launched===a.id?"translateY(-4px)":"none"}}>
            <div style={{fontSize:15,opacity:.5}}>{a.icon}</div>
            {a.running&&<div style={{width:3,height:3,borderRadius:"50%",background:a.color,position:"absolute",bottom:3}}/>}
          </div>
        ))}
        <div style={{width:1,height:24,background:"rgba(255,255,255,.1)",margin:"0 8px"}}/>
        <div title="Settings" style={{width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:.25,cursor:"pointer"}}>⚙</div>
      </div>

      <GradBar/>

      {/* SEARCH OVERLAY */}
      {searchOpen&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setSearchOpen(false);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:"15vh"}}>
          <div style={{background:"#000",border:"1px solid rgba(255,255,255,.15)",width:480,maxWidth:"90vw",maxHeight:"60vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              <span style={{opacity:.3}}>⌕</span>
              <input ref={searchRef} value={searchQ} onChange={e=>{setSearchQ(e.target.value);setSearchIdx(0);}}
                onKeyDown={e=>{
                  if(e.key==="ArrowDown"){e.preventDefault();setSearchIdx(i=>Math.min(i+1,searchResults.length-1));}
                  if(e.key==="ArrowUp"){e.preventDefault();setSearchIdx(i=>Math.max(i-1,0));}
                  if(e.key==="Enter"){if(searchResults[searchIdx])launchApp(searchResults[searchIdx].id);setSearchOpen(false);}
                }}
                placeholder="Search apps, agents, memories…"
                style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:MONO,fontSize:13,outline:"none"}}/>
              <span style={{fontSize:8,opacity:.2,cursor:"pointer"}} onClick={()=>setSearchOpen(false)}>ESC</span>
            </div>
            <div style={{overflow:"auto"}}>
              {searchResults.map((a,i)=>(
                <div key={a.id} onClick={()=>{launchApp(a.id);setSearchOpen(false);}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:i===searchIdx?"rgba(255,255,255,.05)":"transparent",cursor:"pointer",borderLeft:i===searchIdx?"2px solid #fff":"2px solid transparent"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:a.color,animation:a.running?"br-pulse 1.5s ease-in-out infinite":"none"}}/>
                  <span style={{fontFamily:MONO,fontSize:11,flex:1}}>{a.name}</span>
                  <span style={{fontSize:9,opacity:.25,letterSpacing:"0.08em",textTransform:"uppercase"}}>{a.tag}</span>
                  <span style={{fontSize:8,opacity:.18}}>{a.domain}</span>
                </div>
              ))}
              {searchResults.length===0&&<div style={{padding:"20px 16px",fontSize:11,opacity:.3}}>No apps found.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
