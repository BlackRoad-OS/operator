import { useState, useEffect } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-fade       { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes br-slideX     { 0%{transform:translateX(-16px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateX(16px);opacity:0} } @keyframes br-slideY     { 0%{transform:translateY(-10px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateY(10px);opacity:0} } @keyframes br-pulse      { 0%,100%{transform:scale(1)} 50%{transform:scale(2)} } @keyframes br-spin       { from{transform:rotate(0deg)} to{transform:rotate(360deg)} } @keyframes br-blink      { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-bounce     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} } @keyframes br-grow       { 0%,100%{transform:scaleX(0.06)} 50%{transform:scaleX(1)} } @keyframes br-shake      { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} } @keyframes br-orbit      { from{transform:rotate(0deg) translateX(14px)} to{transform:rotate(360deg) translateX(14px)} } @keyframes br-cursor     { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-wave       { 0%,100%{transform:scaleY(0.08)} 50%{transform:scaleY(1)} } @keyframes br-flip       { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(360deg)} } @keyframes br-colorCycle { 0%{background:#FF8400}25%{background:#FF0066}50%{background:#8800FF}75%{background:#0066FF}100%{background:#FF8400} } @keyframes br-gradShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-borderPulse{ 0%,100%{border-color:#FF8400} 33%{border-color:#FF0066} 66%{border-color:#0066FF} } @keyframes br-breathe    { 0%,100%{transform:scale(1);opacity:0.4} 50%{transform:scale(1.15);opacity:1} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const PRIMS = [
  { num:"01", name:"fade",         cat:"opacity",   timing:"ease · 2s",        desc:"opacity 1→0→1",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#0066FF",animation:"br-fade 2s ease-in-out infinite"}}/> },
  { num:"02", name:"slide-x",      cat:"transform", timing:"ease · 2s",        desc:"translateX −16→16",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#FF0066",animation:"br-slideX 2s ease-in-out infinite"}}/> },
  { num:"03", name:"slide-y",      cat:"transform", timing:"ease · 2s",        desc:"translateY −10→10",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#8800FF",animation:"br-slideY 2s ease-in-out infinite"}}/> },
  { num:"04", name:"pulse",        cat:"transform", timing:"ease · 1.5s",      desc:"scale 1→2→1",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#FF8400",animation:"br-pulse 1.5s ease-in-out infinite"}}/> },
  { num:"05", name:"spin",         cat:"transform", timing:"linear · 2s",      desc:"rotate 0→360°",
    P:()=><div style={{width:10,height:10,background:"#0066FF",animation:"br-spin 2s linear infinite"}}/> },
  { num:"06", name:"blink",        cat:"opacity",   timing:"step-end · 1s",    desc:"opacity hard cut",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#CC00AA",animation:"br-blink 1s step-end infinite"}}/> },
  { num:"07", name:"bounce",       cat:"transform", timing:"ease · 1s",        desc:"translateY 0→−12→0",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#FF4400",animation:"br-bounce 1s ease-in-out infinite"}}/> },
  { num:"08", name:"grow",         cat:"transform", timing:"ease · 2s",        desc:"scaleX 0→1→0",
    P:()=><div style={{width:36,height:2,background:GRAD,backgroundSize:"300%",transformOrigin:"left",animation:"br-grow 2s ease-in-out infinite,br-gradShift 3s ease infinite"}}/> },
  { num:"09", name:"shake",        cat:"transform", timing:"ease · 1s",        desc:"translateX ±5px",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",background:"#FF0066",animation:"br-shake 1s ease-in-out infinite"}}/> },
  { num:"10", name:"orbit",        cat:"transform", timing:"linear · 2s",      desc:"rotate + translateX",
    P:()=><div style={{position:"relative",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:4,height:4,borderRadius:"50%",background:"#fff",opacity:.4,position:"absolute"}}/>
      <div style={{width:6,height:6,borderRadius:"50%",background:"#8800FF",position:"absolute",animation:"br-orbit 2s linear infinite"}}/>
    </div> },
  { num:"11", name:"cursor",       cat:"opacity",   timing:"step-end · 0.8s",  desc:"blinking text cursor",
    P:()=><div style={{display:"flex",alignItems:"center",gap:2,fontFamily:MONO,fontSize:11}}>
      <span style={{opacity:.4}}>br</span>
      <div style={{width:1.5,height:12,background:"#fff",animation:"br-cursor 0.8s step-end infinite"}}/>
    </div> },
  { num:"12", name:"wave",         cat:"transform", timing:"ease · 1s stagger",desc:"scaleY staggered bars",
    P:()=><div style={{display:"flex",alignItems:"center",gap:2,height:24}}>
      {["#FF8400","#FF0066","#8800FF","#0066FF"].map((c,i)=>(
        <div key={i} style={{width:2,height:20,background:c,animation:`br-wave 1s ease-in-out infinite ${i*.15}s`}}/>
      ))}
    </div> },
  { num:"13", name:"flip",         cat:"transform", timing:"ease · 2s",        desc:"rotateY 0→360°",
    P:()=><div style={{width:10,height:10,background:"#FF8400",animation:"br-flip 2s ease-in-out infinite"}}/> },
  { num:"14", name:"color-cycle",  cat:"color",     timing:"linear · 3s",      desc:"orange→pink→purple→blue",
    P:()=><div style={{width:10,height:10,borderRadius:"50%",animation:"br-colorCycle 3s linear infinite"}}/> },
  { num:"15", name:"grad-shift",   cat:"color",     timing:"ease · 3s",        desc:"gradient position sweep",
    P:()=><div style={{width:36,height:5,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 3s ease infinite"}}/> },
  { num:"16", name:"border-pulse", cat:"color",     timing:"ease · 2s",        desc:"border-color cycles palette",
    P:()=><div style={{width:14,height:14,borderRadius:"50%",border:"2px solid #FF8400",animation:"br-borderPulse 2s ease-in-out infinite"}}/> },
  { num:"17", name:"breathe",      cat:"transform", timing:"ease · 3s",        desc:"scale + opacity, ambient",
    P:()=><div style={{width:12,height:12,borderRadius:"50%",background:"#fff",animation:"br-breathe 3s ease-in-out infinite"}}/> },
];

const COMPOSITES = [
  { name:"Agent Status",    desc:"pulse + color → live indicator",
    P:()=><div style={{display:"flex",gap:16,alignItems:"center"}}>
      {[{c:"#FF8400",n:"cecilia"},{c:"#8800FF",n:"lucidia"},{c:"rgba(255,255,255,.15)",n:"olympia",off:true}].map(a=>(
        <div key={a.n} style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:a.c,animation:a.off?"none":"br-pulse 2s ease-in-out infinite"}}/>
          <span style={{fontFamily:MONO,fontSize:10,opacity:a.off?.18:.5}}>{a.n}</span>
        </div>
      ))}
    </div> },
  { name:"Staggered Loader",desc:"grow + grad-shift × 3 delayed",
    P:()=><div style={{display:"flex",flexDirection:"column",gap:7,width:"100%"}}>
      {[0,.3,.6].map((d,i)=>(
        <div key={i} style={{height:2,background:GRAD,backgroundSize:"300%",transformOrigin:"left",animation:`br-grow 2s ease-in-out infinite ${d}s,br-gradShift 3s ease infinite`}}/>
      ))}
    </div> },
  { name:"Spectrum Waveform",desc:"wave × 10 bars, 70ms stagger",
    P:()=><div style={{display:"flex",alignItems:"center",gap:3,height:36}}>
      {["#FF8400","#FF4400","#FF0066","#FF0066","#CC00AA","#8800FF","#8800FF","#0066FF","#0066FF","#2233CC"].map((c,i)=>(
        <div key={i} style={{width:2,height:32,background:c,animation:`br-wave 1s ease-in-out infinite ${i*.07}s`}}/>
      ))}
    </div> },
  { name:"Terminal Cursor", desc:"cursor + static mono text",
    P:()=><div style={{fontFamily:MONO,fontSize:10,lineHeight:1.9}}>
      <div style={{opacity:.2}}>{"// agent bootstrap"}</div>
      <div style={{opacity:.5}}>{"Z := yx − w → ∅"}</div>
      <div style={{display:"flex",alignItems:"center",opacity:.5}}>
        <span>{"K(t) = 0.97"}</span>
        <div style={{width:1.5,height:11,background:"#fff",marginLeft:2,animation:"br-cursor 0.8s step-end infinite"}}/>
      </div>
    </div> },
  { name:"Orbit System",    desc:"orbit × 3 + breathe — hub state",
    P:()=><div style={{position:"relative",width:70,height:70,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:"br-breathe 3s ease-in-out infinite"}}/>
      {[{c:"#FF8400",d:"2s"},{c:"#8800FF",d:"3.2s"},{c:"#0066FF",d:"4.6s"}].map((o,i)=>(
        <div key={i} style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:o.c,animation:`br-orbit ${o.d} linear infinite`}}/>
      ))}
    </div> },
  { name:"Event Stream",    desc:"slide-x stagger — real-time feeds",
    P:()=><div style={{display:"flex",flexDirection:"column",gap:5,width:"100%"}}>
      {[{t:"LEDGER",m:"commit · sha∞://4821",c:"#FF8400"},{t:"AGENT",m:"atlas → deploy · ok",c:"#0066FF"},{t:"POLICY",m:"cece · allowed",c:"#8800FF"}].map((e,i)=>(
        <div key={i} style={{display:"flex",gap:8,fontFamily:MONO,fontSize:10,animation:`br-slideX 2.4s ease-in-out ${i*.25}s infinite`}}>
          <span style={{color:e.c,opacity:.7,minWidth:48}}>{e.t}</span>
          <span style={{opacity:.3}}>{e.m}</span>
        </div>
      ))}
    </div> },
];

const TIMING_CURVES = [
  {name:"ease",       val:"cubic-bezier(0.25,0.1,0.25,1)",uses:"fade · pulse · slide · bounce · shake · grow",c:"#FF8400"},
  {name:"linear",     val:"linear",                        uses:"spin · orbit · color-cycle · grad-shift",     c:"#0066FF"},
  {name:"ease-in-out",val:"cubic-bezier(0.42,0,0.58,1)",  uses:"breathe · wave · border-pulse · float",       c:"#8800FF"},
  {name:"step-end",   val:"steps(1, end)",                 uses:"cursor · blink — hard cuts only",             c:"#FF0066"},
];

const CATS = ["all","opacity","transform","color"];
const NAVS = ["primitives","composites","timing","rules"];

const GradBar = ({h=3}: {h?: number}) => <div style={{height:h,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",flexShrink:0}}/>;

const Lbl = ({n,children}: {n: string; children: React.ReactNode}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,margin:"44px 0 20px"}}>
    <span style={{fontFamily:MONO,fontSize:9,opacity:.25,letterSpacing:"0.18em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{n} · {children}</span>
    <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
  </div>
);

export default function AnimationShowcase() {
  const [cat, setCat] = useState("all");
  const [sec, setSec] = useState("primitives");

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  return (
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",fontFamily:MONO}}>
      <GradBar/>

      {/* NAV */}
      <div style={{position:"sticky",top:0,zIndex:99,background:"#000",borderBottom:"1px solid #fff",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px"}}>
        <span style={{fontFamily:DISP,fontSize:13,fontWeight:700}}>BlackRoad</span>
        <div style={{display:"flex"}}>
          {NAVS.map(s=>(
            <button key={s} onClick={()=>setSec(s)} style={{background:"none",border:"none",color:"#fff",fontFamily:MONO,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:"0 14px",height:48,opacity:sec===s?1:.3,borderBottom:sec===s?"2px solid #fff":"2px solid transparent",transition:"opacity .15s"}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px"}}>

        {/* HERO */}
        <div style={{padding:"64px 0 52px",borderBottom:"1px solid #fff"}}>
          <div style={{fontFamily:MONO,fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>BlackRoad OS · Motion System v1.0</div>
          <h1 style={{fontFamily:DISP,fontSize:"clamp(2.8rem,9vw,5rem)",fontWeight:700,lineHeight:1,letterSpacing:"-0.02em",marginBottom:18}}>Motion<br/>Primitives</h1>
          <p style={{fontSize:11,opacity:.36,lineHeight:1.9,maxWidth:480,marginBottom:40}}>17 primitives. 6 composite patterns. 4 timing curves. Colors on shapes — never on text. Every animation has a single, legible purpose.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:0,paddingTop:24,borderTop:"1px solid rgba(255,255,255,.07)"}}>
            {[["17","Primitives"],["6","Composites"],["4","Timing Curves"],["0","Animated Text — Ever"]].map(([n,l],i)=>(
              <div key={i} style={{paddingRight:28,marginRight:28,borderRight:i<3?"1px solid rgba(255,255,255,.08)":"none",marginBottom:12}}>
                <div style={{fontFamily:DISP,fontSize:"1.8rem",fontWeight:700,lineHeight:1}}>{n}</div>
                <div style={{fontSize:9,opacity:.2,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE STAGE */}
        <div style={{margin:"36px 0",border:"1px solid rgba(255,255,255,.1)",padding:"36px",display:"flex",alignItems:"center",justifyContent:"center",gap:48,flexWrap:"wrap",minHeight:150,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite"}}/>
          {/* orbit */}
          <div style={{position:"relative",width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <div style={{width:9,height:9,borderRadius:"50%",background:"#fff",animation:"br-breathe 3s ease-in-out infinite"}}/>
            {[{c:"#FF8400",d:"2s"},{c:"#8800FF",d:"3.1s"},{c:"#0066FF",d:"4.5s"}].map((o,i)=>(
              <div key={i} style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:o.c,animation:`br-orbit ${o.d} linear infinite`}}/>
            ))}
          </div>
          {/* waveform */}
          <div style={{display:"flex",alignItems:"center",gap:3,height:44,flexShrink:0}}>
            {["#FF8400","#FF4400","#FF0066","#FF0066","#CC00AA","#8800FF","#8800FF","#0066FF","#0066FF","#2233CC","#2233CC","#2233CC"].map((c,i)=>(
              <div key={i} style={{width:2,height:38,background:c,animation:`br-wave 1s ease-in-out infinite ${i*.07}s`}}/>
            ))}
          </div>
          {/* terminal */}
          <div style={{fontSize:10,lineHeight:1.9,flexShrink:0}}>
            <div style={{opacity:.2}}>{"// Z := yx − w"}</div>
            <div style={{opacity:.5}}>{"K(t) = C(t)·e^(λ|δ|)"}</div>
            <div style={{display:"flex",alignItems:"center",opacity:.5}}>
              <span>{"δ → 3 · fuel"}</span>
              <div style={{width:1.5,height:11,background:"#fff",marginLeft:2,animation:"br-cursor 0.8s step-end infinite"}}/>
            </div>
          </div>
          {/* agents */}
          <div style={{display:"flex",flexDirection:"column",gap:10,flexShrink:0}}>
            {[{c:"#FF8400",n:"cecilia",on:true},{c:"#8800FF",n:"lucidia",on:true},{c:"rgba(255,255,255,.15)",n:"olympia",on:false}].map(a=>(
              <div key={a.n} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:a.c,animation:a.on?"br-pulse 2s ease-in-out infinite":"none"}}/>
                <span style={{fontSize:10,opacity:a.on?.5:.18}}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PRIMITIVES */}
        {sec==="primitives" && <>
          <Lbl n="01">Primitives · {PRIMS.length} total</Lbl>
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setCat(c)} style={{background:"none",border:"none",color:"#fff",fontFamily:MONO,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",padding:"9px 16px",opacity:cat===c?1:.25,borderBottom:cat===c?"2px solid #fff":"2px solid transparent",marginBottom:-1,transition:"opacity .15s"}}>
                {c}
              </button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",borderLeft:"1px solid rgba(255,255,255,.06)",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
            {PRIMS.map(p=>{
              const active = cat==="all"||p.cat===cat;
              return (
                <div key={p.num} style={{borderTop:"1px solid rgba(255,255,255,.06)",borderRight:"1px solid rgba(255,255,255,.06)",padding:"18px 14px",display:"flex",flexDirection:"column",gap:12,opacity:active?1:.1,transition:"opacity .2s",background:"#000"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:36}}><p.P/></div>
                  <div>
                    <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,marginBottom:2}}>{p.name}</div>
                    <div style={{fontSize:9,opacity:.28,marginBottom:4,lineHeight:1.5}}>{p.desc}</div>
                    <div style={{fontSize:8,opacity:.14,letterSpacing:"0.05em"}}>{p.timing}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* COMPOSITES */}
        {sec==="composites" && <>
          <Lbl n="02">Composite Patterns · {COMPOSITES.length} patterns</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:1,background:"rgba(255,255,255,.06)"}}>
            {COMPOSITES.map(c=>(
              <div key={c.name} style={{background:"#000",padding:"24px 20px",display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:56}}><c.P/></div>
                <div style={{height:1,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite"}}/>
                <div>
                  <div style={{fontFamily:MONO,fontSize:11,fontWeight:700,marginBottom:4}}>{c.name}</div>
                  <div style={{fontSize:9,opacity:.28,lineHeight:1.7}}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* TIMING */}
        {sec==="timing" && <>
          <Lbl n="03">Timing Curves</Lbl>
          <div style={{borderTop:"1px solid rgba(255,255,255,.07)"}}>
            {TIMING_CURVES.map(t=>(
              <div key={t.name} style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:20,padding:"20px 0",borderBottom:"1px solid rgba(255,255,255,.06)",alignItems:"start"}}>
                <div>
                  <div style={{width:4,height:4,borderRadius:"50%",background:t.c,marginBottom:8,animation:"br-pulse 2s ease-in-out infinite"}}/>
                  <div style={{fontFamily:MONO,fontSize:13,fontWeight:700,marginBottom:4}}>{t.name}</div>
                  <div style={{fontSize:8,opacity:.18,wordBreak:"break-all",lineHeight:1.6}}>{t.val}</div>
                </div>
                <div style={{fontSize:11,opacity:.35,lineHeight:1.9}}>{t.uses}</div>
              </div>
            ))}
          </div>
          <Lbl n="04">Duration Scale</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",border:"1px solid rgba(255,255,255,.08)"}}>
            {[["Micro","0.8s","cursor · blink","#FF0066"],["Standard","1–2s","pulse · wave · bounce · fade","#FF8400"],["Slow","2–3s","orbit · grow · grad-shift","#8800FF"],["Ambient","4s+","background loops only","#0066FF"]].map(([label,range,uses,c],i)=>(
              <div key={i} style={{padding:"20px 16px",borderRight:i<3?"1px solid rgba(255,255,255,.08)":"none"}}>
                <div style={{width:4,height:4,borderRadius:"50%",background:c,marginBottom:10}}/>
                <div style={{fontFamily:MONO,fontSize:13,fontWeight:700,marginBottom:4}}>{label}</div>
                <div style={{fontFamily:DISP,fontSize:"1.5rem",fontWeight:700,opacity:.15,marginBottom:8}}>{range}</div>
                <div style={{fontSize:10,opacity:.28,lineHeight:1.7}}>{uses}</div>
              </div>
            ))}
          </div>
        </>}

        {/* RULES */}
        {sec==="rules" && <>
          <Lbl n="05">Rules</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            <div style={{paddingRight:32,borderRight:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",opacity:.35,marginBottom:16}}>DO</div>
              {["Animate shapes, dots, borders, fills","pulse for active agent/status states","step-end for cursor and blink only","Pair grow + grad-shift on gradient bars","Stagger wave bars 60–120ms apart","breathe for idle / ambient elements","Linear timing for continuous rotations","Max 3–4 animated elements at once","Respect prefers-reduced-motion","Color animations on shapes, not text"].map((r,i)=>(
                <div key={i} style={{fontSize:10,opacity:.35,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.05)",lineHeight:1.6}}>{r}</div>
              ))}
            </div>
            <div style={{paddingLeft:32}}>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",opacity:.35,marginBottom:16}}>DON'T</div>
              {["Never animate text — ever","No gradient-text + animation","Don't ease cursor or blink","Never >2 animations on one element","Don't animate the wordmark","No decorative meaningless loops","Don't use ease on spin/orbit","No durations under 0.5s","Don't animate color + transform together","No infinite loops on error states"].map((r,i)=>(
                <div key={i} style={{fontSize:10,opacity:.35,padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,.05)",lineHeight:1.6}}>{r}</div>
              ))}
            </div>
          </div>
        </>}

        <div style={{height:64}}/>
      </div>
      <GradBar/>
    </div>
  );
}
