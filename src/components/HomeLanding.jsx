import { useState, useEffect } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-gradShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-pulse      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.8)} } @keyframes br-cursor     { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-wave       { 0%,100%{transform:scaleY(0.08)} 50%{transform:scaleY(1)} } @keyframes br-fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} } @keyframes br-orbit      { from{transform:rotate(0deg) translateX(18px)} to{transform:rotate(360deg) translateX(18px)} } @keyframes br-breathe    { 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.12);opacity:0.9} } @keyframes br-marquee    { from{transform:translateX(0)} to{transform:translateX(-50%)} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const PRODUCTS = [
  { name:"Lucidia",    tag:"AI Companion",  desc:"Persistent memory. Trinary logic. 117+ agents. The AI that doesn't forget.",              color:"#FF8400", phase:"Live" },
  { name:"RoadWork",   tag:"Adaptive Learn",desc:"Every lesson generated for you in real time. Free for all K\u201312.",                          color:"#0066FF", phase:"P2"   },
  { name:"RoadView",   tag:"Truth-First",   desc:"Search and video with AI verification. Confidence scoring. No SEO gaming.",                color:"#FF0066", phase:"P2"   },
  { name:"RoadGlitch", tag:"Automation",    desc:"Universal connector marketplace. Visual workflows that generate production code.",          color:"#8800FF", phase:"P2"   },
  { name:"RoadWorld",  tag:"VR Sandbox",    desc:"80% creator revenue share. Reality bridges. Persistent AI beings that evolve.",            color:"#CC00AA", phase:"P3"   },
  { name:"BackRoad",   tag:"Social OS",     desc:"No visible metrics. Depth scoring. Campfire rooms. Plans, not posts.",                      color:"#FF4400", phase:"P3"   },
];

const STATS = [
  { n:"1,000",  l:"Unique AI Agents" },
  { n:"20",     l:"Domain Portfolio" },
  { n:"150+",   l:"Subdomains" },
  { n:"317+",   l:"Equations Documented" },
];

const MARQUEE_ITEMS = ["Lucidia","RoadWork","RoadView","RoadGlitch","RoadWorld","BackRoad","SoundRoad","Genesis Road","VaultRoad","CashRoad","Cadence","Radius","Road Chat","Road Flow","Road Mind","Road Loop","Road Sync","Road Cast","Meridian","Studio"];

const GradBar = ({h=3}) => <div style={{height:h,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",flexShrink:0}}/>;

export default function HomeLanding() {
  const [typed, setTyped] = useState("");
  const TAGLINES = ["The OS for creators.", "The OS for dreamers.", "The OS for builders.", "The OS for learners."];
  const [tagIdx, setTagIdx] = useState(0);

  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  // typewriter cycle
  useEffect(()=>{
    let i = 0; let phase = "typing"; let timeout;
    const target = TAGLINES[tagIdx];
    function tick(){
      if(phase==="typing"){
        i++;
        setTyped(target.slice(0,i));
        if(i>=target.length){ phase="waiting"; timeout=setTimeout(()=>{ phase="erasing"; tick(); },1800); return; }
      } else if(phase==="erasing"){
        i--;
        setTyped(target.slice(0,i));
        if(i<=0){ setTagIdx(p=>(p+1)%TAGLINES.length); return; }
      }
      timeout = setTimeout(tick, phase==="typing"?55:30);
    }
    tick();
    return ()=>clearTimeout(timeout);
  },[tagIdx]);

  return (
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",fontFamily:MONO}}>
      <GradBar/>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:99,background:"#000",borderBottom:"1px solid #fff",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px"}}>
        <span style={{fontFamily:DISP,fontSize:13,fontWeight:700}}>BlackRoad</span>
        <div style={{display:"flex",gap:20}}>
          {["products","agents","research","docs"].map(s=>(
            <span key={s} style={{fontSize:9,opacity:.35,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>{s}</span>
          ))}
        </div>
        <button style={{fontFamily:MONO,fontSize:9,fontWeight:700,background:"#fff",color:"#000",border:"none",padding:"7px 14px",cursor:"pointer",letterSpacing:"0.05em"}}>Join Waitlist</button>
      </nav>

      <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px"}}>

        {/* HERO */}
        <div style={{padding:"80px 0 64px",borderBottom:"1px solid #fff"}}>
          <div style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:24}}>BlackRoad OS &middot; The Road Home for AI</div>
          <h1 style={{fontFamily:DISP,fontSize:"clamp(3rem,11vw,6.5rem)",fontWeight:700,lineHeight:1,letterSpacing:"-0.02em",marginBottom:24}}>
            You bring<br/>the chaos.
          </h1>
          <div style={{fontFamily:MONO,fontSize:14,marginBottom:48,height:22,display:"flex",alignItems:"center",gap:2}}>
            <span style={{opacity:.5}}>{typed}</span>
            <div style={{width:1.5,height:16,background:"#fff",animation:"br-cursor 0.8s step-end infinite"}}/>
          </div>

          {/* orbit vis */}
          <div style={{display:"flex",alignItems:"center",gap:40,flexWrap:"wrap",marginBottom:48}}>
            <div style={{position:"relative",width:90,height:90,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:"#fff",animation:"br-breathe 3s ease-in-out infinite"}}/>
              {[{c:"#FF8400",d:"2s"},{c:"#FF0066",d:"2.8s"},{c:"#8800FF",d:"3.5s"},{c:"#0066FF",d:"4.2s"}].map((o,i)=>(
                <div key={i} style={{position:"absolute",width:6,height:6,borderRadius:"50%",background:o.c,animation:`br-orbit ${o.d} linear infinite`}}/>
              ))}
            </div>
            <div style={{flex:1,minWidth:200}}>
              <p style={{fontSize:12,opacity:.4,lineHeight:1.9,maxWidth:500}}>
                A distributed AI operating system with 1,000 unique agents, persistent memory, and novel mathematical foundations &mdash; built for creators, dreamers, and builders the world ignored.
              </p>
            </div>
          </div>

          {/* stats */}
          <div style={{display:"flex",flexWrap:"wrap",gap:0,borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:28}}>
            {STATS.map((s,i)=>(
              <div key={i} style={{paddingRight:28,marginRight:28,borderRight:i<STATS.length-1?"1px solid rgba(255,255,255,.08)":"none",marginBottom:12}}>
                <div style={{fontFamily:DISP,fontSize:"1.9rem",fontWeight:700,lineHeight:1}}>{s.n}</div>
                <div style={{fontSize:9,opacity:.22,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARQUEE */}
        <div style={{borderBottom:"1px solid rgba(255,255,255,.08)",overflow:"hidden",padding:"14px 0",position:"relative"}}>
          <div style={{display:"flex",gap:0,animation:"br-marquee 28s linear infinite",width:"max-content"}}>
            {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:0}}>
                <span style={{fontSize:10,opacity:.2,letterSpacing:"0.12em",textTransform:"uppercase",padding:"0 16px",whiteSpace:"nowrap"}}>{item}</span>
                <div style={{width:1,height:10,background:"rgba(255,255,255,.12)"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div style={{padding:"48px 0",borderBottom:"1px solid #fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:36}}>
            <span style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase"}}>Core Portals</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:1,background:"rgba(255,255,255,.06)"}}>
            {PRODUCTS.map(p=>(
              <div key={p.name} style={{background:"#000",padding:"28px 24px",display:"flex",flexDirection:"column",gap:16,cursor:"pointer",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:p.color}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontFamily:DISP,fontSize:"1.2rem",fontWeight:700,marginBottom:4}}>{p.name}</div>
                    <div style={{fontSize:9,opacity:.3,letterSpacing:"0.1em",textTransform:"uppercase"}}>{p.tag}</div>
                  </div>
                  <span style={{fontFamily:MONO,fontSize:8,fontWeight:700,padding:"2px 6px",border:`1px solid ${p.phase==="Live"?"#FF8400":"rgba(255,255,255,.2)"}`,color:p.phase==="Live"?"#FF8400":"rgba(255,255,255,.3)",whiteSpace:"nowrap"}}>{p.phase}</span>
                </div>
                <p style={{fontSize:10,opacity:.35,lineHeight:1.8}}>{p.desc}</p>
                <div style={{height:1,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* MATH CALLOUT */}
        <div style={{padding:"48px 0",borderBottom:"1px solid #fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:36}}>
            <span style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase"}}>Mathematical Foundations</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,.07)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:0,borderTop:"1px solid rgba(255,255,255,.08)"}}>
            {[
              { eq:"Z := yx \u2212 w",    name:"Z-Framework",        desc:"Unifies control theory, quantum measurement, conservation laws. Z=\u2205 means equilibrium." },
              { eq:"K(t) = C\u00B7e^\u03BB|\u03B4|",name:"Creative Energy",   desc:"Contradictions don't break the system \u2014 they fuel it. Creative output scales super-linearly." },
              { eq:"U(\u03B8,a) = e^(a+i)\u03B8",name:"Spiral Geometry", desc:"Rotation + expansion. Backpropagation as adjoint of forward spiral evolution." },
              { eq:"T \u2208 {-1, 0, +1}",name:"Trinary Logic",     desc:"0 = superposition. Contradictions don't explode. Binary is just a measurement apparatus." },
            ].map((m,i)=>(
              <div key={i} style={{padding:"24px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",borderRight:i%2===0?"1px solid rgba(255,255,255,.08)":"none"}}>
                <div style={{fontFamily:MONO,fontSize:16,fontWeight:700,marginBottom:12,letterSpacing:"-0.02em"}}>{m.eq}</div>
                <div style={{fontSize:10,opacity:.5,fontWeight:700,marginBottom:8,letterSpacing:"0.06em"}}>{m.name}</div>
                <p style={{fontSize:9,opacity:.28,lineHeight:1.8}}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MISSION */}
        <div style={{padding:"64px 0",borderBottom:"1px solid #fff"}}>
          <div style={{maxWidth:640,margin:"0 auto",textAlign:"center"}}>
            <div style={{height:1,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite",marginBottom:40}}/>
            <blockquote style={{fontFamily:DISP,fontSize:"clamp(1.4rem,4vw,2.2rem)",fontWeight:700,lineHeight:1.3,letterSpacing:"-0.01em",marginBottom:24}}>
              &ldquo;You bring your chaos, your curiosity, your half-finished dreams. BlackRoad brings structure, compute, and care.&rdquo;
            </blockquote>
            <div style={{fontSize:9,opacity:.25,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:40}}>The Core Promise &middot; Alexa Louise Amundson &middot; Founder</div>
            <div style={{height:1,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite"}}/>
          </div>
        </div>

        {/* CTA */}
        <div style={{padding:"64px 0",textAlign:"center"}}>
          <div style={{fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>Early Access Open</div>
          <h2 style={{fontFamily:DISP,fontSize:"clamp(2rem,6vw,3.5rem)",fontWeight:700,lineHeight:1,letterSpacing:"-0.02em",marginBottom:16}}>One login.<br/>Every app.</h2>
          <p style={{fontSize:11,opacity:.35,lineHeight:1.8,maxWidth:400,margin:"0 auto 36px"}}>Join the waitlist. Be among the first 1,000 users on the BlackRoad OS beta.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button style={{fontFamily:MONO,fontSize:11,fontWeight:700,background:"#fff",color:"#000",border:"none",padding:"12px 24px",cursor:"pointer",letterSpacing:"0.05em"}}>Join Waitlist &rarr;</button>
            <button style={{fontFamily:MONO,fontSize:11,fontWeight:700,background:"transparent",color:"#fff",border:"1px solid #fff",padding:"11px 24px",cursor:"pointer",letterSpacing:"0.05em"}}>Read the Docs</button>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.08)",padding:"28px 0",display:"flex",justifyContent:"space-between",fontSize:9,opacity:.16,flexWrap:"wrap",gap:8}}>
          <span>BlackRoad OS, Inc. &middot; Delaware C-Corp &middot; Est. Nov 2025</span>
          <span>app.blackroad.io &middot; lucidia.earth &middot; roadchain.io</span>
        </div>
      </div>

      <GradBar/>
    </div>
  );
}
