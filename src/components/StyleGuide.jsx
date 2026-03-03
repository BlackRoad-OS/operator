import { useState, useEffect } from "react";

const KEYFRAMES = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap'); @keyframes br-pulse      { 0%,100%{transform:scale(1)} 50%{transform:scale(1.7)} } @keyframes br-gradShift  { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} } @keyframes br-cursor     { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes br-wave       { 0%,100%{transform:scaleY(0.08)} 50%{transform:scaleY(1)} }`;

const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";
const MONO = "'JetBrains Mono',monospace";
const DISP = "'Space Grotesk',sans-serif";

const PALETTE = [
  { hex:"#FF8400", name:"orange" },
  { hex:"#FF4400", name:"red-orange" },
  { hex:"#FF0066", name:"hot pink" },
  { hex:"#CC00AA", name:"magenta" },
  { hex:"#8800FF", name:"purple" },
  { hex:"#0066FF", name:"blue" },
  { hex:"#2233CC", name:"deep navy" },
];

const NEUTRALS = [
  { hex:"#000",    name:"bg",       border:true },
  { hex:"#0a0a0a", name:"surface" },
  { hex:"#111",    name:"elevated" },
  { hex:"#222",    name:"border" },
  { hex:"#444",    name:"muted" },
  { hex:"#fff",    name:"fg" },
];

const GRADIENTS = [
  { label:"Full Spectrum \u00B7 90\u00B0",    uses:"rule bars \u00B7 strips \u00B7 loaders",      grad:GRAD, note:"7 stops \u00B7 orange\u2192navy" },
  { label:"Diagonal Quad \u00B7 135\u00B0",   uses:"large fills \u00B7 titlebars",            grad:"linear-gradient(135deg,#FF8400,#FF0066,#8800FF,#0066FF)", note:"135deg \u00B7 4 stops" },
  { label:"Vertical \u00B7 180\u00B0",        uses:"side strips \u00B7 tall indicators",      grad:"linear-gradient(180deg,#FF8400,#0066FF)", note:"180deg \u00B7 2 stops" },
  { label:"Warm Pair",              uses:"alerts \u00B7 errors \u00B7 warm states",      grad:"linear-gradient(90deg,#FF8400,#FF0066)", note:"orange \u2192 hot pink" },
  { label:"Cool Pair",              uses:"info \u00B7 agents \u00B7 links",              grad:"linear-gradient(90deg,#8800FF,#0066FF)", note:"purple \u2192 blue" },
  { label:"Fade Out",               uses:"decorative tapers \u00B7 section ends",   grad:"linear-gradient(90deg,#FF8400,transparent)", note:"color \u2192 transparent" },
];

const NAVS = ["wordmark","colors","type","rules","gradients","components","spacing","motion"];

const GradBar = ({h=3}) => <div style={{height:h,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 5s ease infinite",flexShrink:0}}/>;

const SecLabel = ({n}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28}}>
    <span style={{fontFamily:MONO,fontSize:9,opacity:.28,letterSpacing:"0.2em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{n}</span>
    <div style={{flex:1,height:1,background:"rgba(255,255,255,.08)"}}/>
  </div>
);

const Row = ({children, last, top}) => (
  <div style={{display:"flex",alignItems:"center",gap:20,padding:"18px 0",borderTop:top?"1px solid rgba(255,255,255,.08)":"none",borderBottom:last?"none":"1px solid rgba(255,255,255,.08)",flexWrap:"wrap"}}>
    {children}
  </div>
);

export default function StyleGuide() {
  const [active, setActive] = useState("wordmark");

  useEffect(()=>{
    const el = document.createElement("style");
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return ()=>document.head.removeChild(el);
  },[]);

  return (
    <div style={{background:"#000",color:"#fff",minHeight:"100vh",fontFamily:MONO}}>
      <GradBar/>

      {/* NAV */}
      <div style={{position:"sticky",top:0,zIndex:99,background:"#000",borderBottom:"1px solid #fff",height:48,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px"}}>
        <span style={{fontFamily:DISP,fontSize:13,fontWeight:700}}>BlackRoad</span>
        <div style={{display:"flex",overflowX:"auto"}}>
          {NAVS.map(s=>(
            <button key={s} onClick={()=>setActive(s)} style={{background:"none",border:"none",color:"#fff",fontFamily:MONO,fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:"0 12px",height:48,opacity:active===s?1:.3,borderBottom:active===s?"2px solid #fff":"2px solid transparent",whiteSpace:"nowrap",transition:"opacity .15s"}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"0 24px"}}>

        {/* HERO */}
        <div style={{padding:"64px 0 52px",borderBottom:"1px solid #fff"}}>
          <div style={{fontFamily:MONO,fontSize:9,opacity:.25,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:20}}>BlackRoad OS, Inc. &middot; Design System v1.0</div>
          <h1 style={{fontFamily:DISP,fontSize:"clamp(2.8rem,10vw,5.5rem)",fontWeight:700,lineHeight:1,letterSpacing:"-0.02em",marginBottom:18}}>Brand<br/>Style Guide</h1>
          <p style={{fontSize:11,opacity:.4,lineHeight:1.9,maxWidth:500,marginBottom:36}}>The canonical reference for BlackRoad's visual language — colors, typography, components, and motion.</p>
          <div style={{height:1,background:GRAD,backgroundSize:"300%",width:160,marginBottom:32}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:0}}>
            {[["7","Accent Colors"],["2","Typefaces"],["17","Motion Primitives"],["1","Rule: text is #fff or #000"]].map(([n,l],i)=>(
              <div key={i} style={{paddingRight:28,marginRight:28,borderRight:i<3?"1px solid rgba(255,255,255,.1)":"none",marginBottom:12}}>
                <div style={{fontFamily:DISP,fontSize:"2rem",fontWeight:700,lineHeight:1}}>{n}</div>
                <div style={{fontSize:9,opacity:.25,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WORDMARK */}
        {active==="wordmark" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="01 \u00B7 Wordmark"/>
            <Row top>
              <div style={{fontFamily:DISP,fontSize:"1.7rem",fontWeight:700,flex:1}}>BlackRoad</div>
              <div style={{fontSize:9,opacity:.18,textAlign:"right"}}>Space Grotesk 700 &middot; on black &middot; primary</div>
            </Row>
            <Row>
              <div style={{fontFamily:MONO,fontSize:"1rem",fontWeight:700,letterSpacing:"0.06em",flex:1}}>BLACKROAD</div>
              <div style={{fontSize:9,opacity:.18,textAlign:"right"}}>JetBrains Mono 700 &middot; mono/terminal variant</div>
            </Row>
            <Row last>
              <div style={{flex:1}}>
                <div style={{fontFamily:DISP,fontSize:"1.3rem",fontWeight:700}}>BlackRoad</div>
                <div style={{height:2,width:64,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite",marginTop:6}}/>
              </div>
              <div style={{fontSize:9,opacity:.18,textAlign:"right"}}>Wordmark + gradient rule &middot; marketing contexts</div>
            </Row>
          </div>
        )}

        {/* COLORS */}
        {active==="colors" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="02 \u00B7 Color Palette"/>
            {PALETTE.map((p,i)=>(
              <Row key={p.hex} top={i===0} last={i===PALETTE.length-1}>
                <div style={{width:10,height:10,borderRadius:"50%",background:p.hex,flexShrink:0}}/>
                <div style={{fontFamily:MONO,fontSize:13,fontWeight:700,minWidth:86}}>{p.hex}</div>
                <div style={{fontSize:9,opacity:.32,textTransform:"uppercase",letterSpacing:"0.1em",minWidth:90}}>{p.name}</div>
                <div style={{flex:1,height:2,background:p.hex}}/>
              </Row>
            ))}

            <div style={{marginTop:28,height:3,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite"}}/>
            <div style={{fontSize:9,opacity:.22,marginTop:6,letterSpacing:"0.1em"}}>Full spectrum &middot; shapes and surfaces only &middot; never on text</div>

            <div style={{marginTop:28,marginBottom:8}}>
              <div style={{fontSize:9,opacity:.22,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:0}}>Neutrals</div>
            </div>
            <div style={{display:"flex",borderTop:"1px solid rgba(255,255,255,.08)"}}>
              {NEUTRALS.map(n=>(
                <div key={n.hex} style={{flex:1,padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:n.hex,border:n.border?"1px solid rgba(255,255,255,.2)":"none",marginBottom:6}}/>
                  <div style={{fontSize:9,opacity:.45}}>{n.hex}</div>
                  <div style={{fontSize:8,opacity:.22,marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{n.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TYPE */}
        {active==="type" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="03 \u00B7 Typography"/>
            <Row top>
              <div style={{minWidth:140,flexShrink:0}}>
                <div style={{fontSize:9,opacity:.32,letterSpacing:"0.15em",textTransform:"uppercase"}}>Display</div>
                <div style={{fontSize:9,opacity:.18,marginTop:3}}>Space Grotesk &middot; 700</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:DISP,fontSize:"clamp(1.8rem,5vw,2.8rem)",fontWeight:700,lineHeight:1.05,letterSpacing:"-0.02em"}}>The road<br/>is black.</div>
                <table style={{width:"100%",marginTop:14,borderCollapse:"collapse"}}>
                  <tbody>
                    {[["Display","48\u201372px","700"],["H1","36\u201348px","700"],["H2","24\u201332px","600"]].map(r=>(
                      <tr key={r[0]} style={{borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                        <td style={{fontFamily:MONO,padding:"5px 0",fontSize:9,opacity:.45,width:80}}>{r[0]}</td>
                        <td style={{fontFamily:MONO,fontSize:9,opacity:.22}}>{r[1]}</td>
                        <td style={{fontFamily:MONO,fontSize:9,opacity:.14,textAlign:"right"}}>{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
            <Row last>
              <div style={{minWidth:140,flexShrink:0}}>
                <div style={{fontSize:9,opacity:.32,letterSpacing:"0.15em",textTransform:"uppercase"}}>UI &middot; Body &middot; Code</div>
                <div style={{fontSize:9,opacity:.18,marginTop:3}}>JetBrains Mono &middot; 400&ndash;700</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:10}}>System Status &middot; Online</div>
                <div style={{fontSize:11,opacity:.45,lineHeight:1.9,marginBottom:12}}>BlackRoad OS runs a distributed network of autonomous agents coordinated via NATS event bus and K3s orchestration.</div>
                <div style={{fontSize:11,lineHeight:1.8}}>
                  <div style={{opacity:.3}}>{"// agent bootstrap"}</div>
                  <div>{"const agent = await Agent.spawn({ id: 'cecilia' })"}</div>
                  <div style={{opacity:.3}}>{"// \u2192 memory loaded"}</div>
                </div>
                <table style={{width:"100%",marginTop:14,borderCollapse:"collapse"}}>
                  <tbody>
                    {[["Labels","0.52\u20130.6rem","uppercase + tracking"],["Body","0.68\u20130.75rem","opacity 0.5"],["Code","0.65\u20130.72rem","400\u2013500"],["UI heads","0.8\u20131rem","700"]].map(r=>(
                      <tr key={r[0]} style={{borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                        <td style={{fontFamily:MONO,padding:"5px 0",fontSize:9,opacity:.45,width:80}}>{r[0]}</td>
                        <td style={{fontFamily:MONO,fontSize:9,opacity:.22}}>{r[1]}</td>
                        <td style={{fontFamily:MONO,fontSize:9,opacity:.14,textAlign:"right"}}>{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Row>
          </div>
        )}

        {/* RULES */}
        {active==="rules" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="04 \u00B7 Text Color Rules"/>
            {[
              { tag:"DO",    label:"White on black",  demo:<span style={{fontSize:"1rem",fontWeight:700}}>BlackRoad OS</span>, note:"#ffffff on any dark bg. The default." },
              { tag:"DO",    label:"Black on white",  demo:<span style={{fontSize:"1rem",fontWeight:700,color:"#000",background:"#fff",padding:"2px 12px"}}>BlackRoad OS</span>, note:"#000000 on white or light fills only." },
              { tag:"DO",    label:"Opacity to dim",  demo:<div style={{display:"flex",flexDirection:"column",gap:3}}><span style={{fontSize:11,opacity:1}}>Full — opacity: 1</span><span style={{fontSize:11,opacity:.5}}>Dim — opacity: 0.5</span><span style={{fontSize:11,opacity:.25}}>Muted — opacity: 0.25</span></div>, note:"Always opacity to dim. Never a gray hex." },
              { tag:"DON'T", label:"Colored text",    demo:<span style={{fontSize:"1rem",fontWeight:700,color:"#FF8400",textDecoration:"line-through",opacity:.4}}>BlackRoad OS</span>, note:"Colors are for shapes. Never on words." },
              { tag:"DON'T", label:"Gray hex text",   demo:<span style={{fontSize:"1rem",fontWeight:700,color:"#888",textDecoration:"line-through",opacity:.4}}>BlackRoad OS</span>, note:"No #888, #555, #ccc. Use white + opacity." },
            ].map((r,i,arr)=>(
              <Row key={r.label} top={i===0} last={i===arr.length-1}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",padding:"3px 8px",minWidth:56,textAlign:"center",flexShrink:0,background:r.tag==="DO"?"#fff":"transparent",color:r.tag==="DO"?"#000":"#fff",border:r.tag==="DON'T"?"1px solid rgba(255,255,255,.25)":"none"}}>{r.tag}</div>
                <div style={{fontSize:9,opacity:.28,minWidth:130}}>{r.label}</div>
                <div style={{flex:1}}>{r.demo}</div>
                <div style={{fontSize:9,opacity:.18,maxWidth:200,lineHeight:1.7,marginLeft:"auto",textAlign:"right"}}>{r.note}</div>
              </Row>
            ))}
          </div>
        )}

        {/* GRADIENTS */}
        {active==="gradients" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="05 \u00B7 Gradient System"/>
            {GRADIENTS.map((g,i)=>(
              <Row key={g.label} top={i===0} last={i===GRADIENTS.length-1}>
                <div style={{width:100,height:3,background:g.grad,flexShrink:0}}/>
                <div style={{fontFamily:MONO,fontSize:12,fontWeight:700,minWidth:160}}>{g.label}</div>
                <div style={{fontSize:10,opacity:.28,flex:1}}>{g.uses}</div>
                <div style={{fontSize:9,opacity:.16,marginLeft:"auto",textAlign:"right"}}>{g.note}</div>
              </Row>
            ))}
          </div>
        )}

        {/* COMPONENTS */}
        {active==="components" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="06 \u00B7 Components"/>
            {/* Buttons */}
            <Row top>
              <div style={{fontSize:9,opacity:.28,letterSpacing:"0.15em",textTransform:"uppercase",minWidth:100,flexShrink:0}}>Buttons</div>
              <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",flex:1}}>
                {[{l:"Primary",bg:"#fff",c:"#000",border:"none"},{l:"Ghost",bg:"transparent",c:"#fff",border:"1px solid #fff"},{l:"Gradient",bg:GRAD,c:"#000",border:"none",bs:"300%"}].map(b=>(
                  <button key={b.l} style={{fontFamily:MONO,fontSize:9,fontWeight:700,letterSpacing:"0.05em",background:b.bg,backgroundSize:b.bs,color:b.c,padding:"8px 16px",border:b.border,cursor:"default"}}>{b.l}</button>
                ))}
              </div>
              <div style={{fontSize:9,opacity:.16,maxWidth:180,textAlign:"right",marginLeft:"auto",lineHeight:1.7}}>text always #000 or #fff &middot; no pill radius &middot; sharp corners</div>
            </Row>
            {/* Badges */}
            <Row>
              <div style={{fontSize:9,opacity:.28,letterSpacing:"0.15em",textTransform:"uppercase",minWidth:100,flexShrink:0}}>Badges</div>
              <div style={{display:"flex",gap:10,alignItems:"center",flex:1,flexWrap:"wrap"}}>
                {[{l:"ONLINE",bg:"transparent",c:"#fff",bc:"#fff"},{l:"ACTIVE",bg:"#FF8400",c:"#000",bc:"#FF8400"},{l:"AGENT",bg:"transparent",c:"#fff",bc:"#8800FF"},{l:"ALERT",bg:"#FF0066",c:"#000",bc:"#FF0066"}].map(b=>(
                  <span key={b.l} style={{fontFamily:MONO,fontSize:8,fontWeight:700,padding:"2px 7px",border:`1px solid ${b.bc}`,background:b.bg,color:b.c,letterSpacing:"0.08em"}}>{b.l}</span>
                ))}
              </div>
              <div style={{fontSize:9,opacity:.16,maxWidth:180,textAlign:"right",marginLeft:"auto",lineHeight:1.7}}>#000 on color fills &middot; #fff on transparent</div>
            </Row>
            {/* Inputs */}
            <Row>
              <div style={{fontSize:9,opacity:.28,letterSpacing:"0.15em",textTransform:"uppercase",minWidth:100,flexShrink:0}}>Inputs</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-start",flex:1}}>
                <input readOnly style={{fontFamily:MONO,fontSize:10,color:"rgba(255,255,255,.2)",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,.25)",padding:"8px 0",width:180,outline:"none"}} placeholder="Default input\u2026"/>
                <input readOnly defaultValue="Focused state" style={{fontFamily:MONO,fontSize:10,color:"#fff",background:"transparent",border:"none",borderBottom:"1px solid #fff",padding:"8px 0",width:180,outline:"none"}}/>
              </div>
              <div style={{fontSize:9,opacity:.16,maxWidth:180,textAlign:"right",marginLeft:"auto",lineHeight:1.7}}>underline only &middot; no box &middot; focused = full white line</div>
            </Row>
            {/* Status */}
            <Row>
              <div style={{fontSize:9,opacity:.28,letterSpacing:"0.15em",textTransform:"uppercase",minWidth:100,flexShrink:0}}>Status</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                {[{c:"#FF8400",n:"cecilia \u00B7 active",pulse:true},{c:"#0066FF",n:"cadence \u00B7 processing",pulse:false},{c:"#FF0066",n:"eve \u00B7 alert",pulse:true},{c:"rgba(255,255,255,.15)",n:"olympia \u00B7 offline",pulse:false,dim:true}].map(s=>(
                  <div key={s.n} style={{display:"flex",alignItems:"center",gap:8,opacity:s.dim?.3:1}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:s.c,animation:s.pulse?"br-pulse 1.5s ease-in-out infinite":"none",flexShrink:0}}/>
                    <span style={{fontSize:11}}>{s.n}</span>
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,opacity:.16,maxWidth:180,textAlign:"right",marginLeft:"auto",lineHeight:1.7}}>dot color = accent &middot; offline = no color &middot; alert = pulse</div>
            </Row>
            {/* Dividers */}
            <Row last>
              <div style={{fontSize:9,opacity:.28,letterSpacing:"0.15em",textTransform:"uppercase",minWidth:100,flexShrink:0}}>Dividers</div>
              <div style={{display:"flex",flexDirection:"column",gap:10,flex:1}}>
                <div style={{height:1,background:"#fff"}}/>
                <div style={{height:1,background:"rgba(255,255,255,.1)"}}/>
                <div style={{height:2,background:GRAD,backgroundSize:"300%",animation:"br-gradShift 4s ease infinite",maxWidth:180}}/>
                <div style={{height:1,background:"linear-gradient(90deg,#FF8400,transparent)",maxWidth:140}}/>
              </div>
              <div style={{fontSize:9,opacity:.16,maxWidth:180,textAlign:"right",marginLeft:"auto",lineHeight:1.7}}>white &middot; dim &middot; gradient &middot; gradient fade</div>
            </Row>
          </div>
        )}

        {/* SPACING */}
        {active==="spacing" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="07 \u00B7 Spacing Scale"/>
            <div style={{display:"flex",alignItems:"flex-end",gap:20,padding:"24px 0",flexWrap:"wrap"}}>
              {[4,8,12,16,20,24,32,40,48,64,80].map(v=>(
                <div key={v} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <div style={{width:1,height:v,background:"rgba(255,255,255,.6)"}}/>
                  <div style={{fontSize:8,opacity:.38}}>{v}</div>
                  {[4,8,16,24,32,40,48,64,80].indexOf(v)!==-1&&<div style={{fontSize:7,opacity:.18}}>{["xs","sm","","md","","lg","xl","2xl","3xl","4xl","5xl"][[4,8,12,16,20,24,32,40,48,64,80].indexOf(v)]}</div>}
                </div>
              ))}
            </div>
            <div style={{fontSize:9,opacity:.18}}>Base: 4px &middot; prefer multiples of 8 for layout &middot; multiples of 4 for fine spacing</div>
          </div>
        )}

        {/* MOTION */}
        {active==="motion" && (
          <div style={{paddingTop:48,borderBottom:"1px solid #fff"}}>
            <SecLabel n="08 \u00B7 Motion Rules"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,marginBottom:32}}>
              <div style={{paddingRight:32,borderRight:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",opacity:.35,marginBottom:16}}>DO</div>
                {["Animate shapes, dots, borders, fills","pulse for active agent/status states","step-end for cursor and blink only","Pair grow + grad-shift on gradient bars","Stagger wave bars 60\u2013120ms apart","breathe for idle / ambient elements","Linear timing for continuous rotations","Max 3\u20134 animated elements at once","Respect prefers-reduced-motion","Color animations on shapes, not text"].map((r,i)=>(
                  <div key={i} style={{fontSize:10,opacity:.35,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)",lineHeight:1.6}}>{r}</div>
                ))}
              </div>
              <div style={{paddingLeft:32}}>
                <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.15em",opacity:.35,marginBottom:16}}>DON'T</div>
                {["Never animate text \u2014 ever","No gradient-text + animation","Don't ease cursor or blink","Never >2 animations on one element","Don't animate the wordmark","No decorative meaningless loops","Don't use ease on spin/orbit","No durations under 0.5s","Don't animate color + transform together","No infinite loops on error states"].map((r,i)=>(
                  <div key={i} style={{fontSize:10,opacity:.35,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)",lineHeight:1.6}}>{r}</div>
                ))}
              </div>
            </div>
            {/* live demo strip */}
            <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:24,display:"flex",alignItems:"center",gap:32,flexWrap:"wrap"}}>
              <div style={{position:"relative",width:60,height:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",opacity:.4}}/>
                {[{c:"#FF8400",d:"2s"},{c:"#8800FF",d:"3.1s"},{c:"#0066FF",d:"4.5s"}].map((o,i)=>(
                  <div key={i} style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:o.c,animation:`br-orbit ${o.d} linear infinite`}}/>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:3,height:36}}>
                {["#FF8400","#FF4400","#FF0066","#CC00AA","#8800FF","#0066FF","#2233CC","#2233CC"].map((c,i)=>(
                  <div key={i} style={{width:2,height:30,background:c,animation:`br-wave 1s ease-in-out infinite ${i*.08}s`}}/>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {[{c:"#FF8400"},{c:"#8800FF"},{c:"rgba(255,255,255,.15)",off:true}].map((a,i)=>(
                  <div key={i} style={{width:7,height:7,borderRadius:"50%",background:a.c,animation:a.off?"none":"br-pulse 2s ease-in-out infinite"}}/>
                ))}
              </div>
              <div style={{fontFamily:MONO,fontSize:10,opacity:.4,display:"flex",alignItems:"center",gap:2}}>
                <span>blackroad</span>
                <div style={{width:1.5,height:12,background:"#fff",animation:"br-cursor 0.8s step-end infinite"}}/>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{padding:"28px 0",display:"flex",justifyContent:"space-between",fontSize:9,opacity:.16,flexWrap:"wrap",gap:8,borderTop:"1px solid rgba(255,255,255,.06)",marginTop:0}}>
          <span>BlackRoad OS, Inc. &middot; Design System v1.0 &middot; Est. Nov 2025</span>
          <span>JetBrains Mono &middot; Space Grotesk &middot; CSS only &middot; no containers</span>
        </div>
      </div>

      <GradBar/>
    </div>
  );
}
