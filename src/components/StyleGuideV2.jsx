import { useState, useEffect, useRef } from "react";

const KEYFRAMES = `@keyframes fade-k    { 0%,100%{opacity:1} 50%{opacity:0} } @keyframes slideX-k  { 0%{transform:translateX(-12px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateX(12px);opacity:0} } @keyframes slideY-k  { 0%{transform:translateY(-10px);opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{transform:translateY(10px);opacity:0} } @keyframes pulse-k   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.9)} } @keyframes spin-k    { from{transform:rotate(0)} to{transform:rotate(360deg)} } @keyframes blink-k   { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes bounce-k  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} } @keyframes grow-k    { 0%,100%{transform:scaleX(0.08)} 50%{transform:scaleX(1)} } @keyframes shake-k   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} } @keyframes wave-k    { 0%,100%{transform:scaleY(.1)} 50%{transform:scaleY(1)} } @keyframes flip-k    { 0%{transform:rotateY(0)} 100%{transform:rotateY(360deg)} } @keyframes orbit-k   { from{transform:rotate(0deg) translateX(10px)} to{transform:rotate(360deg) translateX(10px)} } @keyframes cursor-k  { 0%,49%,100%{opacity:1} 50%,99%{opacity:0} } @keyframes alertpulse-k { 0%,100%{opacity:1} 50%{opacity:0.3} }`;

const mono = { fontFamily: "'JetBrains Mono', monospace" };
const display = { fontFamily: "'Space Grotesk', sans-serif" };

const NAV = ["wordmark","colors","type","components","motion","rules"];

const ACCENTS = [
  ["#FF8400","orange"], ["#FF4400","red-orange"], ["#FF0066","hot pink"],
  ["#CC00AA","magenta"], ["#8800FF","purple"], ["#0066FF","blue"], ["#2233CC","deep navy"],
];

const NEUTRALS = [
  ["#000","bg"], ["#0a0a0a","surface"], ["#111","elevated"],
  ["#222","border"], ["#444","muted"], ["#fff","fg"],
];

const MOTIONS = [
  ["01","fade",        "opacity 1\u21920\u21921",              "ease \u00B7 2s"],
  ["02","slide-x",     "translateX \u221214\u219214",           "ease \u00B7 2s"],
  ["03","slide-y",     "translateY \u221210\u219210",           "ease \u00B7 2s"],
  ["04","pulse",       "scale 1\u21921.9\u21921",               "ease \u00B7 1.5s"],
  ["05","spin",        "rotate 0\u2192360\u00B0",               "linear \u00B7 2s"],
  ["06","blink",       "opacity hard cut",            "step-end \u00B7 1s"],
  ["07","bounce",      "translateY 0\u2192\u221211\u21920",          "ease \u00B7 1s"],
  ["08","grow",        "scaleX 0\u21921\u21920",                "ease \u00B7 2s"],
  ["09","shake",       "translateX \u00B15px",             "ease \u00B7 1s"],
  ["10","orbit",       "rotate + translateX",         "linear \u00B7 2s"],
  ["11","cursor",      "blinking text cursor",        "step-end \u00B7 0.8s"],
  ["12","wave",        "scaleY staggered bars",       "ease \u00B7 1s"],
  ["13","flip",        "rotateY 0\u2192360\u00B0",              "ease \u00B7 2s"],
  ["14","color-cycle", "accent color cycling",        "linear \u00B7 3s"],
  ["15","grad-shift",  "gradient position sweep",     "ease \u00B7 3s"],
  ["16","border-pulse","border opacity cycling",      "ease \u00B7 2s"],
  ["17","text rule",   "white on black \u00B7 black on white \u00B7 never color text", "static"],
];

const dot = (anim, size = 8) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "#fff", animation: anim }} />
);

const sq = (anim, size = 9) => (
  <div style={{ width: size, height: size, background: "#fff", animation: anim }} />
);

function MotionPreview({ id }) {
  const map = {
    "01": dot("fade-k 2s ease-in-out infinite"),
    "02": dot("slideX-k 2s ease-in-out infinite"),
    "03": dot("slideY-k 2s ease-in-out infinite"),
    "04": dot("pulse-k 1.5s ease-in-out infinite"),
    "05": sq("spin-k 2s linear infinite"),
    "06": dot("blink-k 1s step-end infinite"),
    "07": dot("bounce-k 1s ease-in-out infinite"),
    "08": <div style={{ width:28, height:2, background:"#fff", transformOrigin:"left", animation:"grow-k 2s ease-in-out infinite" }} />,
    "09": dot("shake-k 1s ease-in-out infinite"),
    "10": (
      <div style={{ width:32, height:32, position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:4, height:4, borderRadius:"50%", background:"#fff", position:"absolute" }} />
        <div style={{ width:5, height:5, borderRadius:"50%", background:"rgba(255,255,255,0.5)", position:"absolute", animation:"orbit-k 2s linear infinite" }} />
      </div>
    ),
    "11": (
      <div style={{ display:"flex", alignItems:"center", gap:1, ...mono, fontSize:"0.55rem" }}>
        br<div style={{ width:1.5, height:14, background:"#fff", animation:"cursor-k 0.8s step-end infinite" }} />
      </div>
    ),
    "12": (
      <div style={{ display:"flex", alignItems:"center", gap:2, height:20 }}>
        {[0,0.15,0.3,0.45].map((d,i) => (
          <div key={i} style={{ width:2, height:16, background:"#fff", animation:`wave-k 1s ease-in-out infinite ${d}s` }} />
        ))}
      </div>
    ),
    "13": sq("flip-k 2s ease-in-out infinite"),
    "14": dot("pulse-k 3s ease-in-out infinite"),
    "15": <div style={{ width:28, height:2, background:"#fff", transformOrigin:"left", animation:"grow-k 3s ease-in-out infinite" }} />,
    "16": dot("alertpulse-k 2s ease-in-out infinite", 12),
    "17": <span style={{ ...mono, fontWeight:700, fontSize:"0.6rem" }}>&mdash;</span>,
  };
  return map[id] || null;
}

const Row = ({ children, first, last }) => (
  <div style={{
    display:"flex", alignItems:"center", gap:20, padding:"18px 0", flexWrap:"wrap",
    borderTop: first ? "1px solid rgba(255,255,255,0.08)" : "none",
    borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.08)",
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ ...mono, fontSize:"0.5rem", opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase", minWidth:100, flexShrink:0 }}>
    {children}
  </div>
);

const Note = ({ children }) => (
  <div style={{ ...mono, fontSize:"0.44rem", opacity:0.18, maxWidth:180, textAlign:"right", lineHeight:1.7, marginLeft:"auto" }}>
    {children}
  </div>
);

const SecLabel = ({ num, label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:36 }}>
    <div style={{ ...mono, fontSize:"0.5rem", opacity:0.3, letterSpacing:"0.2em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
      {num} &middot; {label}
    </div>
    <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
  </div>
);

// --- section components ---

function Wordmark() {
  return <>
    <Row first>
      <div style={{ flex:1, ...display, fontSize:"1.8rem", fontWeight:700 }}>BlackRoad</div>
      <div style={{ ...mono, fontSize:"0.48rem", opacity:0.2 }}>Space Grotesk 700 &middot; primary</div>
    </Row>
    <Row>
      <div style={{ flex:1, ...mono, fontSize:"1.1rem", fontWeight:700, letterSpacing:"0.06em" }}>BLACKROAD</div>
      <div style={{ ...mono, fontSize:"0.48rem", opacity:0.2 }}>JetBrains Mono 700 &middot; terminal</div>
    </Row>
    <Row last>
      <div style={{ flex:1 }}>
        <div style={{ ...display, fontSize:"1.4rem", fontWeight:700 }}>BlackRoad</div>
        <div style={{ height:2, width:64, background:"#fff", marginTop:6 }} />
      </div>
      <div style={{ ...mono, fontSize:"0.48rem", opacity:0.2 }}>Wordmark + white rule &middot; marketing</div>
    </Row>
  </>;
}

function Colors() {
  const [copied, setCopied] = useState(null);
  const copy = hex => { navigator.clipboard?.writeText(hex); setCopied(hex); setTimeout(() => setCopied(null), 1000); };
  return <>
    {ACCENTS.map(([hex, name], i) => (
      <Row key={hex} first={i===0} last={i===ACCENTS.length-1}>
        <div onClick={() => copy(hex)} title="Click to copy"
          style={{ width:10, height:10, borderRadius:"50%", background:hex, flexShrink:0, cursor:"pointer" }} />
        <div style={{ ...mono, fontSize:"0.65rem", fontWeight:700, minWidth:86 }}>{copied===hex ? "copied!" : hex}</div>
        <div style={{ ...mono, fontSize:"0.48rem", opacity:0.3, textTransform:"uppercase", letterSpacing:"0.1em", minWidth:90 }}>{name}</div>
        <div style={{ flex:1, height:2, background:hex }} />
      </Row>
    ))}
    <div style={{ height:1, background:"rgba(255,255,255,0.1)", margin:"24px 0 8px" }} />
    <div style={{ ...mono, fontSize:"0.46rem", opacity:0.22 }}>Accent colors &middot; shapes and surfaces only &middot; never on text</div>
    <div style={{ ...mono, fontSize:"0.46rem", opacity:0.22, letterSpacing:"0.15em", textTransform:"uppercase", margin:"24px 0 10px" }}>Neutrals</div>
    <div style={{ display:"flex", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
      {NEUTRALS.map(([hex, name]) => (
        <div key={hex} style={{ flex:1, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:hex, marginBottom:6, border: hex==="#000" ? "1px solid rgba(255,255,255,0.2)" : "none" }} />
          <div style={{ ...mono, fontSize:"0.44rem", opacity:0.5 }}>{hex}</div>
          <div style={{ ...mono, fontSize:"0.38rem", opacity:0.22, marginTop:2, textTransform:"uppercase" }}>{name}</div>
        </div>
      ))}
    </div>
  </>;
}

function Type() {
  return <>
    <Row first style={{ alignItems:"flex-start", gap:32 }}>
      <div style={{ minWidth:140, flexShrink:0 }}>
        <div style={{ ...mono, fontSize:"0.48rem", opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase" }}>Display</div>
        <div style={{ ...mono, fontSize:"0.44rem", opacity:0.18, marginTop:3 }}>Space Grotesk &middot; 700</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ ...display, fontSize:"clamp(1.8rem,5vw,2.8rem)", fontWeight:700, lineHeight:1.05, letterSpacing:"-0.02em" }}>The road<br/>is black.</div>
        <table style={{ width:"100%", marginTop:14, borderCollapse:"collapse" }}>
          <tbody>
            {[["Display","48\u201372px","700"],["H1","36\u201348px","700"],["H2","24\u201332px","600"]].map(([s,z,w]) => (
              <tr key={s}>
                <td style={{ padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", ...mono, fontSize:"0.5rem", opacity:0.5, width:80 }}>{s}</td>
                <td style={{ padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", ...mono, fontSize:"0.5rem", opacity:0.25 }}>{z}</td>
                <td style={{ padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.06)", ...mono, fontSize:"0.5rem", opacity:0.15, textAlign:"right" }}>{w}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Row>
    <Row last style={{ alignItems:"flex-start", gap:32 }}>
      <div style={{ minWidth:140, flexShrink:0 }}>
        <div style={{ ...mono, fontSize:"0.48rem", opacity:0.3, letterSpacing:"0.15em", textTransform:"uppercase" }}>UI &middot; Body &middot; Code</div>
        <div style={{ ...mono, fontSize:"0.44rem", opacity:0.18, marginTop:3 }}>JetBrains Mono &middot; 400&ndash;700</div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ ...mono, fontSize:"0.52rem", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:10 }}>System Status &middot; Online</div>
        <div style={{ ...mono, fontSize:"0.66rem", opacity:0.5, lineHeight:1.9 }}>BlackRoad OS runs a distributed network of autonomous agents coordinated via NATS event bus and K3s orchestration.</div>
        <div style={{ ...mono, fontSize:"0.64rem", lineHeight:1.8, marginTop:12 }}>
          <span style={{ opacity:0.3 }}>{"// agent bootstrap"}</span><br/>
          {"const agent = await Agent.spawn({ id: 'cecilia' })"}<br/>
          <span style={{ opacity:0.3 }}>{"// \u2192 memory loaded"}</span>
        </div>
      </div>
    </Row>
  </>;
}

function Components() {
  const [focused, setFocused] = useState(false);
  const [clicked, setClicked] = useState(null);
  const click = k => { setClicked(k); setTimeout(() => setClicked(null), 600); };

  const btnStyle = (variant) => ({
    ...mono, fontSize:"0.56rem", fontWeight:700, cursor:"pointer", padding:"8px 16px",
    transition:"transform 0.1s",
    transform: clicked===variant ? "scale(0.95)" : "scale(1)",
    ...(variant==="primary"
      ? { background:"#fff", color:"#000", border:"none" }
      : { background:"transparent", color:"#fff", border:"1px solid #fff" }),
  });

  return <>
    <Row first>
      <Label>Buttons</Label>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", flex:1 }}>
        <button onClick={() => click("primary")} style={btnStyle("primary")}>{clicked==="primary" ? "\u2713" : "Primary"}</button>
        <button onClick={() => click("ghost")}   style={btnStyle("ghost")}>{clicked==="ghost" ? "\u2713" : "Ghost"}</button>
        <button disabled style={{ ...mono, fontSize:"0.56rem", fontWeight:700, background:"transparent", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", padding:"8px 16px", opacity:0.3, cursor:"not-allowed" }}>Disabled</button>
      </div>
      <Note>sharp corners &middot; no radius &middot; #000 or #fff text only</Note>
    </Row>
    <Row>
      <Label>Badges</Label>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", flex:1 }}>
        {[["ONLINE","#fff","transparent","#fff"],["ACTIVE","#000","#fff","#fff"],["AGENT","#fff","transparent","rgba(255,255,255,0.4)"],["OFFLINE","#fff","transparent","rgba(255,255,255,0.15)"]].map(([l,c,bg,b]) => (
          <div key={l} style={{ ...mono, fontSize:"0.46rem", fontWeight:700, padding:"2px 7px", color:c, background:bg, border:`1px solid ${b}`, letterSpacing:"0.08em", opacity: l==="OFFLINE" ? 0.35 : 1 }}>{l}</div>
        ))}
      </div>
      <Note>opacity for inactive &middot; fill for emphasis &middot; no color</Note>
    </Row>
    <Row>
      <Label>Inputs</Label>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, alignItems:"flex-start" }}>
        <input placeholder="Default\u2026" style={{ ...mono, fontSize:"0.58rem", color:"#fff", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.2)", padding:"8px 0", width:200, outline:"none" }} />
        <input placeholder="Click to focus\u2026" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...mono, fontSize:"0.58rem", color:"#fff", background:"transparent", border:"none", borderBottom: focused ? "1px solid #fff" : "1px solid rgba(255,255,255,0.2)", padding:"8px 0", width:200, outline:"none", transition:"border-color 0.15s" }} />
      </div>
      <Note>underline only &middot; no box &middot; focused = full white</Note>
    </Row>
    <Row>
      <Label>Status</Label>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        {[["cecilia \u00B7 active",1,1,false],["cadence \u00B7 processing",0.8,0.6,false],["eve \u00B7 alert",1,1,true],["olympia \u00B7 offline",0.25,0.2,false]].map(([l,o,dotOpacity,p]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:8, opacity:o }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#fff", opacity:dotOpacity, flexShrink:0, animation: p ? "alertpulse-k 1.2s ease-in-out infinite" : "none" }} />
            <div style={{ ...mono, fontSize:"0.56rem" }}>{l}</div>
          </div>
        ))}
      </div>
      <Note>white dots &middot; opacity for states &middot; pulse for alert</Note>
    </Row>
    <Row last>
      <Label>Dividers</Label>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
        {[["#fff","primary"],["rgba(255,255,255,0.2)","secondary"],["rgba(255,255,255,0.08)","dim"],["linear-gradient(90deg,#fff,transparent)","fade"]].map(([bg,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ height:1, width:160, background:bg }} />
            <div style={{ ...mono, fontSize:"0.38rem", opacity:0.25 }}>{l}</div>
          </div>
        ))}
      </div>
      <Note>white &middot; opacity variants &middot; fade</Note>
    </Row>
  </>;
}

function Motion() {
  return <>
    {MOTIONS.map(([id, name, desc, time], i) => (
      <Row key={id} first={i===0} last={i===MOTIONS.length-1}>
        <div style={{ ...mono, fontSize:"0.44rem", opacity:0.2, width:22, flexShrink:0 }}>{id}</div>
        <div style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <MotionPreview id={id} />
        </div>
        <div style={{ ...mono, fontSize:"0.56rem", fontWeight:700, minWidth:110 }}>{name}</div>
        <div style={{ ...mono, fontSize:"0.48rem", opacity:0.3, flex:1 }}>{desc}</div>
        <div style={{ ...mono, fontSize:"0.42rem", opacity:0.18, marginLeft:"auto" }}>{time}</div>
      </Row>
    ))}
  </>;
}

function Rules() {
  const dos = ["Text is #ffffff or #000000 only","Use opacity to dim \u2014 never a gray hex","Colors on shapes, fills, dots, borders only","JetBrains Mono for all UI, labels, code, data","Space Grotesk for display headings only","Gradient as structural accent \u2014 rules, strips","Sharp corners \u2014 0 to 4px radius max","Lines over boxes wherever possible","1px white lines for section dividers","Animate shapes in color, not text"];
  const donts = ["Never color text \u2014 orange, pink, purple, blue","No gray hex values on text \u2014 #888, #555, #ccc","No gradient text (-webkit-text-fill-color)","No pill buttons (border-radius > 4px)","No system fonts \u2014 Arial, Helvetica, system-ui","No drop shadows on text","Never rotate, skew, or recolor the wordmark","No more than 2 accent colors per component","No color on disabled states \u2014 opacity only","No unnecessary containers \u2014 lines over boxes"];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
      {[[dos,"DO"],[donts,"DON'T"]].map(([items,head],col) => (
        <div key={head} style={{ paddingRight:col===0?32:0, paddingLeft:col===1?32:0, borderRight:col===0?"1px solid rgba(255,255,255,0.08)":"none" }}>
          <div style={{ ...mono, fontSize:"0.5rem", fontWeight:700, letterSpacing:"0.15em", opacity:0.4, marginBottom:14 }}>{head}</div>
          {items.map((item,i) => (
            <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ ...mono, fontSize:"0.52rem", opacity:0.35, lineHeight:1.5 }}>{item}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- main ---

export default function StyleGuide() {
  const [active, setActive] = useState("");
  const scrollRef = useRef(null);
  const secRefs = useRef({});

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      let cur = "";
      for (const id of NAV) {
        const sec = secRefs.current[id];
        if (sec && sec.offsetTop - 80 <= el.scrollTop) cur = id;
      }
      setActive(cur);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = id => {
    const el = secRefs.current[id];
    if (el && scrollRef.current) scrollRef.current.scrollTo({ top: el.offsetTop - 52, behavior:"smooth" });
  };

  const Section = ({ id, num, label, children }) => (
    <div ref={el => secRefs.current[id] = el} id={id} style={{ padding:"56px 0 48px", borderBottom:"1px solid #fff" }}>
      <SecLabel num={num} label={label} />
      {children}
    </div>
  );

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#000", color:"#fff", ...mono }}>

        <div style={{ height:3, background:"#fff", flexShrink:0 }} />

        <nav style={{ height:48, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", borderBottom:"1px solid #fff", background:"#000" }}>
          <div style={{ ...display, fontSize:"0.78rem", fontWeight:700 }}>BlackRoad</div>
          <div style={{ display:"flex", gap:24 }}>
            {NAV.map(id => (
              <button key={id} onClick={() => scrollTo(id)} style={{ ...mono, fontSize:"0.48rem", color:"#fff", background:"none", border:"none", cursor:"pointer", opacity: active===id ? 1 : 0.3, letterSpacing:"0.12em", textTransform:"uppercase", transition:"opacity 0.15s" }}>
                {id}
              </button>
            ))}
          </div>
        </nav>

        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.1) transparent" }}>
          <div style={{ maxWidth:960, margin:"0 auto", padding:"0 24px" }}>

            {/* hero */}
            <div style={{ padding:"72px 0 56px", borderBottom:"1px solid #fff" }}>
              <div style={{ ...mono, fontSize:"0.5rem", opacity:0.28, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:20 }}>BlackRoad OS, Inc. &middot; Design System v1.0</div>
              <div style={{ ...display, fontSize:"clamp(3rem,11vw,6rem)", fontWeight:700, lineHeight:1, letterSpacing:"-0.02em" }}>Brand<br/>Style Guide</div>
              <div style={{ marginTop:20, fontSize:"0.66rem", opacity:0.42, lineHeight:1.9, maxWidth:500 }}>
                The canonical reference for BlackRoad&apos;s visual language &mdash; colors, typography, components, and motion.
              </div>
              <div style={{ height:1, background:"#fff", width:160, margin:"32px 0" }} />
              <div style={{ display:"flex", gap:0, flexWrap:"wrap" }}>
                {[["7","Accent Colors"],["2","Typefaces"],["17","Motion Primitives"],["1","Rule: text is #fff or #000"]].map(([n,l],i,a) => (
                  <div key={l} style={{ paddingRight:32, marginRight:32, borderRight:i<a.length-1?"1px solid rgba(255,255,255,0.12)":"none" }}>
                    <div style={{ ...display, fontSize:"2.2rem", fontWeight:700, lineHeight:1 }}>{n}</div>
                    <div style={{ ...mono, fontSize:"0.44rem", opacity:0.28, letterSpacing:"0.15em", textTransform:"uppercase", marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <Section id="wordmark"   num="01" label="Wordmark"><Wordmark /></Section>
            <Section id="colors"     num="02" label="Color Palette"><Colors /></Section>
            <Section id="type"       num="03" label="Typography"><Type /></Section>
            <Section id="components" num="04" label="Components"><Components /></Section>
            <Section id="motion"     num="05" label="Motion Primitives"><Motion /></Section>
            <Section id="rules"      num="06" label="Rules"><Rules /></Section>

            <footer style={{ padding:"32px 0", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
              <div style={{ ...mono, fontSize:"0.48rem", opacity:0.16 }}>BlackRoad OS, Inc. &middot; Design System v1.0 &middot; Est. Nov 2025</div>
              <div style={{ ...mono, fontSize:"0.48rem", opacity:0.16 }}>JetBrains Mono &middot; Space Grotesk &middot; React</div>
            </footer>

          </div>
        </div>

        <div style={{ height:3, background:"#fff", flexShrink:0 }} />
      </div>
    </>
  );
}
