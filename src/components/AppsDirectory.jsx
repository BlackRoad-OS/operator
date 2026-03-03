import { useState, useEffect } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-gradShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-pulse     { 0%,100%{transform:scale(1)} 50%{transform:scale(1.8)} } @keyframes br-cursor    { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-wave      { 0%,100%{transform:scaleY(0.08)} 50%{transform:scaleY(1)} } @keyframes br-marquee   { from{transform:translateX(0)} to{transform:translateX(-50%)} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const APPS = [
  { id:"lucidia",    name:"Lucidia",     tag:"AI Companion",   cat:"core",   icon:"◈", color:"#FF8400", phase:"Live", domain:"app.lucidia.earth",     desc:"Persistent memory. Trinary logic. 117+ agents. The AI that doesn't forget.",                  featured:true },
  { id:"roadwork",   name:"RoadWork",    tag:"Adaptive Learn", cat:"learn",  icon:"◉", color:"#0066FF", phase:"P2",   domain:"edu.blackroad.io",      desc:"Every lesson generated for you in real time. Free for all K–12 content.",                     featured:false },
  { id:"roadview",   name:"RoadView",    tag:"Truth-First",    cat:"core",   icon:"◎", color:"#FF0066", phase:"P2",   domain:"roadview.blackroad.io", desc:"Search and video with AI verification. Confidence scoring. No SEO gaming.",                   featured:false },
  { id:"roadglitch", name:"RoadGlitch",  tag:"Automation",     cat:"build",  icon:"⬡", color:"#8800FF", phase:"P2",   domain:"glitch.blackroad.io",   desc:"Universal connector marketplace. Visual workflow builder. Generate production code.",         featured:false },
  { id:"roadworld",  name:"RoadWorld",   tag:"VR Sandbox",     cat:"create", icon:"⬢", color:"#CC00AA", phase:"P3",   domain:"world.blackroad.io",    desc:"80% creator revenue share. Reality bridges. Persistent AI beings that evolve over years.",    featured:false },
  { id:"backroad",   name:"BackRoad",    tag:"Social OS",      cat:"connect",icon:"◇", color:"#FF4400", phase:"P3",   domain:"social.blackroad.io",   desc:"No visible metrics. Depth scoring. Campfire rooms. Plans, not posts.",                        featured:false },
  { id:"soundroad",  name:"SoundRoad",   tag:"AI Music",       cat:"create", icon:"♬", color:"#FF8400", phase:"P2",   domain:"sound.blackroad.io",    desc:"Hum-to-track. Vibe-based production. One-click distribution to Spotify.",                     featured:false },
  { id:"genesis",    name:"Genesis Road",tag:"Game Engine",    cat:"create", icon:"⬟", color:"#0066FF", phase:"P3",   domain:"genesis.blackroad.io",  desc:"Natural language 3D. Physics you can describe. Instant multiplayer. Export everywhere.",      featured:false },
  { id:"vaultroad",  name:"VaultRoad",   tag:"Second Brain",   cat:"build",  icon:"▣", color:"#8800FF", phase:"P2",   domain:"vault.blackroad.io",    desc:"Capture from anywhere. Semantic search. Auto-connections across saves.",                      featured:false },
  { id:"cashroad",   name:"CashRoad",    tag:"Finance Co-Pilot",cat:"build", icon:"◈", color:"#FF0066", phase:"P3",   domain:"cash.blackroad.io",     desc:"No judgment, just clarity. Decision-time assistance. Future-You simulator.",                  featured:false },
  { id:"cadence",    name:"Cadence",     tag:"Music Collab",   cat:"create", icon:"◎", color:"#CC00AA", phase:"P2",   domain:"cadence.lucidia.studio",desc:"AI music composition with real-time collaboration. Full stem generation.",                     featured:false },
  { id:"radius",     name:"Radius",      tag:"Simulation",     cat:"build",  icon:"◉", color:"#FF4400", phase:"P3",   domain:"radius.blackroad.io",   desc:"Physics, chemistry, quantum simulation agent. Science in natural language.",                   featured:false },
  { id:"roadchat",   name:"Road Chat",   tag:"Comms",          cat:"connect",icon:"◇", color:"#0066FF", phase:"P2",   domain:"chat.blackroad.io",     desc:"Human ↔ agent ↔ agent communication layer across the full OS.",                              featured:false },
  { id:"roadflow",   name:"Road Flow",   tag:"Pipelines",      cat:"build",  icon:"⬡", color:"#8800FF", phase:"P3",   domain:"flow.blackroad.io",     desc:"Processing pipeline orchestration. Visual flows for complex data operations.",                featured:false },
  { id:"roadmind",   name:"Road Mind",   tag:"Reasoning",      cat:"build",  icon:"⬢", color:"#FF8400", phase:"P3",   domain:"mind.blackroad.io",     desc:"Reasoning and logic engine. The cognitive backbone for agent decision-making.",               featured:false },
  { id:"roadcast",   name:"Road Cast",   tag:"Streaming",      cat:"connect",icon:"♬", color:"#FF0066", phase:"P4",   domain:"cast.blackroad.io",     desc:"Broadcasting and streaming layer. Live events, agent streams, global reach.",                 featured:false },
  { id:"roadsync",   name:"Road Sync",   tag:"Cross-Device",   cat:"build",  icon:"▣", color:"#0066FF", phase:"P2",   domain:"sync.blackroad.io",     desc:"Cross-device synchronization. One identity, every surface.",                                  featured:false },
  { id:"meridian",   name:"Meridian",    tag:"Architecture",   cat:"build",  icon:"⬟", color:"#CC00AA", phase:"P4",   domain:"meridian.blackroad.io", desc:"AI architecture design tool. Blueprint your systems in natural language.",                    featured:false },
];

const CATS = [
  { id:"all",     label:"All Apps",       count: APPS.length },
  { id:"core",    label:"Core Portals",   count: APPS.filter(a=>a.cat==="core").length },
  { id:"create",  label:"Create",         count: APPS.filter(a=>a.cat==="create").length },
  { id:"learn",   label:"Learn",          count: APPS.filter(a=>a.cat==="learn").length },
  { id:"connect", label:"Connect",        count: APPS.filter(a=>a.cat==="connect").length },
  { id:"build",   label:"Build",          count: APPS.filter(a=>a.cat==="build").length },
];

const GradBar = ({h=3}) => <div style={{height:h,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",flexShrink:0}}/>;

const PhaseBadge = ({phase}) => {
  const live = phase==="Live";
  return <span style={{fontFamily:MONO,fontSize:8,fontWeight:700,padding:"2px 6px",border:`1px solid ${live?"#FF8400":"rgba(255,255,255,.2)"}`,color:live?"#FF8400":"rgba(255,255,255,.3)",whiteSpace:"nowrap",letterSpacing:"0.06em"}}>{phase}</span>;
};

export default function AppsDirectory() {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  const filtered = APPS.filter(a=>{
    const matchCat = cat==="all" || a.cat===cat;
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.tag.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && !a.featured;
  });

  const featured = APPS.find(a=>a.featured);

  return (
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",fontFamily:MONO}}>
      <GradBar/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:99,background:"#000",borderBottom:"1px solid #fff",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px"}}>
        <span style={{fontFamily:DISP,fontSize:13,fontWeight:700}}>BlackRoad</span>
        <div style={{display:"flex",gap:20}}>
          {["home","apps","agents","research","docs"].map(s=>(
            <span key={s} style={{fontSize:9,opacity:s==="apps"?1:.35,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",borderBottom:s==="apps"?"1px solid #fff":"none"}}>{s}</span>
          ))}
        </div>
        <button style={{fontFamily:MONO,fontSize:9,fontWeight:700,background:"#fff",color:"#000",border:"none",padding:"7px 14px",cursor:"pointer"}}>Join Waitlist</button>
      </nav>

      <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px"}}>

        {/* HERO */}
        <div style={{padding:"64px 0 48px",borderBottom:"1px solid #fff"}}>
          <div style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>BlackRoad OS · App Directory</div>
          <h1 style={{fontFamily:DISP,fontSize:"clamp(2.8rem,9vw,5rem)",fontWeight:700,lineHeight:1,letterSpacing:"-0.02em",marginBottom:20}}>Every app.<br/>One OS.</h1>
          <p style={{fontSize:11,opacity:.36,lineHeight:1.9,maxWidth:480,marginBottom:36}}>18 applications across creation, learning, connection, and infrastructure — unified under one identity, one memory layer, one agent network.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:0,borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:24}}>
            {[["6","Core Portals"],["12","Specialized Tools"],["18+","Total Apps"],["1","Unified OS"]].map(([n,l],i)=>(
              <div key={i} style={{paddingRight:24,marginRight:24,borderRight:i<3?"1px solid rgba(255,255,255,.08)":"none",marginBottom:12}}>
                <div style={{fontFamily:DISP,fontSize:"1.6rem",fontWeight:700,lineHeight:1}}>{n}</div>
                <div style={{fontSize:9,opacity:.22,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE */}
        <div style={{overflow:"hidden",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",animation:"br-marquee 30s linear infinite",width:"max-content"}}>
            {[...APPS,...APPS].map((a,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center"}}>
                <span style={{fontSize:9,opacity:.18,letterSpacing:"0.1em",textTransform:"uppercase",padding:"0 14px",whiteSpace:"nowrap"}}>{a.name}</span>
                <div style={{width:1,height:8,background:"rgba(255,255,255,.1)"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURED */}
        {featured && (
          <div style={{margin:"40px 0",border:"1px solid rgba(255,255,255,.1)",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:featured.color}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
              <div style={{padding:"36px"}}>
                <div style={{fontSize:9,opacity:.25,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:16}}>Featured · {featured.tag}</div>
                <div style={{fontFamily:DISP,fontSize:"2rem",fontWeight:700,marginBottom:12}}>{featured.name}</div>
                <p style={{fontSize:11,opacity:.38,lineHeight:1.8,marginBottom:24}}>{featured.desc}</p>
                <div style={{fontSize:9,opacity:.2,marginBottom:20,fontFamily:MONO}}>{featured.domain}</div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <button style={{fontFamily:MONO,fontSize:9,fontWeight:700,background:"#fff",color:"#000",border:"none",padding:"8px 16px",cursor:"pointer"}}>Launch App →</button>
                  <PhaseBadge phase={featured.phase}/>
                </div>
              </div>
              {/* mini live preview */}
              <div style={{borderLeft:"1px solid rgba(255,255,255,.07)",padding:"24px",display:"flex",flexDirection:"column",gap:12,background:"rgba(255,255,255,.01)"}}>
                <div style={{fontSize:9,opacity:.2,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Live Preview</div>
                <div style={{fontFamily:MONO,fontSize:10,lineHeight:1.9}}>
                  <div style={{opacity:.25}}>{"// PS-SHA∞ memory active"}</div>
                  <div style={{opacity:.5}}>{"agent_id: cecilia"}</div>
                  <div style={{opacity:.5}}>{"commits: 14,821"}</div>
                  <div style={{opacity:.5,display:"flex",alignItems:"center",gap:4}}>
                    <span>{"K(t): 0.94"}</span>
                    <div style={{height:1,width:40,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 3s ease infinite"}}/>
                  </div>
                </div>
                <div style={{borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:12}}>
                  {[{c:"#FF8400",n:"cecilia"},{c:"#8800FF",n:"lucidia"},{c:"rgba(255,255,255,.15)",n:"olympia",off:true}].map(a=>(
                    <div key={a.n} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:a.c,animation:a.off?"none":"br-pulse 2s ease-in-out infinite"}}/>
                      <span style={{fontSize:9,opacity:a.off?.18:.45}}>{a.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILTER + SEARCH */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:0}}>
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
            {CATS.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{background:"none",border:"none",color:"#fff",fontFamily:MONO,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",padding:"10px 14px",opacity:cat===c.id?1:.3,borderBottom:cat===c.id?"2px solid #fff":"2px solid transparent",marginBottom:-1,transition:"opacity .15s",whiteSpace:"nowrap"}}>
                {c.label} <span style={{opacity:.4}}>({c.count})</span>
              </button>
            ))}
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="search apps…" style={{fontFamily:MONO,fontSize:10,color:"#fff",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.2)",padding:"8px 0",width:160,outline:"none"}}/>
        </div>

        {/* GRID */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:1,background:"rgba(255,255,255,.05)",marginBottom:48}}>
          {filtered.map(a=>(
            <div key={a.id} style={{background:"#000",padding:"24px 20px",display:"flex",flexDirection:"column",gap:14,cursor:"pointer",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:a.color}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:"1.3rem",marginBottom:6,opacity:.5}}>{a.icon}</div>
                  <div style={{fontFamily:DISP,fontSize:"1rem",fontWeight:700,marginBottom:2}}>{a.name}</div>
                  <div style={{fontSize:9,opacity:.3,letterSpacing:"0.1em",textTransform:"uppercase"}}>{a.tag}</div>
                </div>
                <PhaseBadge phase={a.phase}/>
              </div>
              <p style={{fontSize:9,opacity:.3,lineHeight:1.8,flex:1}}>{a.desc}</p>
              <div style={{fontSize:8,opacity:.14,fontFamily:MONO}}>{a.domain}</div>
            </div>
          ))}
        </div>

        {/* ROADMAP */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:40,marginBottom:48}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
            <span style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase"}}>Launch Roadmap</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:0,border:"1px solid rgba(255,255,255,.08)"}}>
            {[
              { phase:"Now",  apps:["Lucidia","Road Chat","Road Sync"],           color:"#FF8400" },
              { phase:"P2",   apps:["RoadWork","RoadView","SoundRoad","Cadence"], color:"#0066FF" },
              { phase:"P3",   apps:["RoadGlitch","RoadWorld","BackRoad","Radius"],color:"#8800FF" },
              { phase:"P4",   apps:["CashRoad","Genesis Road","Road Cast"],       color:"#FF0066" },
              { phase:"P5+",  apps:["Meridian","Road Mind","VaultRoad"],          color:"#CC00AA" },
            ].map((r,i)=>(
              <div key={i} style={{padding:"20px 16px",borderRight:i<4?"1px solid rgba(255,255,255,.08)":"none",position:"relative"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:r.color}}/>
                <div style={{fontSize:11,fontWeight:700,marginBottom:16,opacity:.8,fontFamily:DISP,paddingTop:8}}>{r.phase}</div>
                {r.apps.map(a=><div key={a} style={{fontSize:9,opacity:.35,marginBottom:6,lineHeight:1.4}}>{a}</div>)}
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.07)",padding:"24px 0",display:"flex",justifyContent:"space-between",fontSize:9,opacity:.15,flexWrap:"wrap",gap:8}}>
          <span>BlackRoad OS, Inc. · App Directory v1.0</span>
          <span>18 apps · 1 OS · all your worlds</span>
        </div>
      </div>

      <GradBar/>
    </div>
  );
}
