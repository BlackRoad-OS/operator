/**
 * BlackRoad OS — Agent Dashboard Renderer
 * Vanilla JS implementation. No frameworks.
 */

const AgentDashboard = (() => {
  const GRAD = "linear-gradient(90deg,#FF8400,#FF4400,#FF0066,#CC00AA,#8800FF,#0066FF,#2233CC)";

  // ── SEED DATA: first 20 named agents ──
  const NAMED_AGENTS = [
    { id:"001", name:"Cecilia",  role:"Core AI",        domain:"reasoning",   status:"active",     uptime:99.97, mem:847,  tasks:12043 },
    { id:"002", name:"Alice",    role:"Gateway",         domain:"networking",  status:"active",     uptime:99.91, mem:512,  tasks:8821  },
    { id:"003", name:"Cadence",  role:"Music AI",        domain:"creative",    status:"processing", uptime:98.40, mem:341,  tasks:2201  },
    { id:"004", name:"Eve",      role:"Alert Monitor",   domain:"security",    status:"alert",      uptime:97.10, mem:128,  tasks:44102 },
    { id:"005", name:"Olympia",  role:"Compute",         domain:"infra",       status:"offline",    uptime:0,     mem:0,    tasks:1892  },
    { id:"006", name:"Meridian", role:"Architect",       domain:"design",      status:"active",     uptime:99.50, mem:623,  tasks:3301  },
    { id:"007", name:"Radius",   role:"Physics Sim",     domain:"science",     status:"active",     uptime:99.20, mem:901,  tasks:980   },
    { id:"008", name:"Cadillac", role:"Transport",       domain:"logistics",   status:"active",     uptime:98.80, mem:256,  tasks:5512  },
    { id:"009", name:"Nova",     role:"Research",        domain:"knowledge",   status:"active",     uptime:99.10, mem:734,  tasks:7741  },
    { id:"010", name:"Iris",     role:"Vision AI",       domain:"vision",      status:"processing", uptime:96.30, mem:1024, tasks:3302  },
    { id:"011", name:"Atlas",    role:"Data Store",      domain:"storage",     status:"active",     uptime:99.99, mem:2048, tasks:91203 },
    { id:"012", name:"Soleil",   role:"Creative",        domain:"creative",    status:"active",     uptime:98.70, mem:441,  tasks:1203  },
    { id:"013", name:"Zephyr",   role:"Stream Proc.",    domain:"data",        status:"active",     uptime:99.40, mem:512,  tasks:28801 },
    { id:"014", name:"Indigo",   role:"Color/Vision",    domain:"vision",      status:"idle",       uptime:94.20, mem:302,  tasks:891   },
    { id:"015", name:"Pascal",   role:"Math Engine",     domain:"reasoning",   status:"active",     uptime:99.85, mem:688,  tasks:4410  },
    { id:"016", name:"Lumen",    role:"Light/Render",    domain:"creative",    status:"processing", uptime:97.80, mem:1280, tasks:2203  },
    { id:"017", name:"Axiom",    role:"Logic Core",      domain:"reasoning",   status:"active",     uptime:99.95, mem:512,  tasks:33102 },
    { id:"018", name:"Vesper",   role:"Evening Sync",    domain:"sync",        status:"idle",       uptime:91.30, mem:128,  tasks:441   },
    { id:"019", name:"Chord",    role:"Audio Proc.",     domain:"creative",    status:"active",     uptime:98.20, mem:640,  tasks:1102  },
    { id:"020", name:"Celine",   role:"Language",        domain:"reasoning",   status:"active",     uptime:99.30, mem:920,  tasks:6612  },
  ];

  const STATUS_COLORS = { active:"#fff", processing:"#aaa", alert:"#fff", offline:"#333", idle:"#666" };
  const STATUS_DOTS   = { active:"\u25CF", processing:"\u25C9", alert:"\u25B2", offline:"\u25CB", idle:"\u2013" };

  const DOMAINS  = ["all","reasoning","networking","creative","security","infra","design","science","logistics","knowledge","vision","storage","data","sync"];
  const STATUSES = ["all","active","processing","alert","idle","offline"];

  const TOTAL_TARGET = 1000;
  const ONLINE_COUNT = 847;
  const PER_PAGE = 40;

  // ── Generate agents 021-1000 ──
  function generateAgents() {
    const names = ["Astra","Briar","Crest","Dune","Echo","Fable","Gale","Haven","Iona","Jade","Kira","Lynx","Mira","Nemo","Opal","Peta","Quill","Rune","Sable","Tide","Uma","Vale","Wren","Xara","Yule","Zora"];
    const roles = ["Processing","Routing","Analysis","Storage","Monitor","Compute","Sync","Index","Query","Archive"];
    const domains = ["reasoning","networking","creative","security","infra","design","science","logistics","knowledge","vision","storage","data","sync"];
    const statuses = ["active","active","active","active","processing","idle","offline"];
    const agents = [];
    for (let i = 21; i <= TOTAL_TARGET; i++) {
      const id = String(i).padStart(3, "0");
      const name = names[(i - 21) % names.length] + (Math.floor((i - 21) / names.length) > 0 ? "-" + Math.floor((i - 21) / names.length) : "");
      agents.push({
        id: id,
        name: name,
        role: roles[(i * 7) % roles.length],
        domain: domains[(i * 3) % domains.length],
        status: statuses[(i * 11) % statuses.length],
        uptime: statuses[(i * 11) % statuses.length] === "offline" ? 0 : 85 + Math.round((((i * 17) % 150)) / 10),
        mem: statuses[(i * 11) % statuses.length] === "offline" ? 0 : 64 + ((i * 13) % 1984),
        tasks: ((i * 997) % 50000),
      });
    }
    return agents;
  }

  const ALL_AGENTS = NAMED_AGENTS.concat(generateAgents());

  // ── State ──
  let state = {
    search: "",
    domain: "all",
    statusFilter: "all",
    selected: null,
    page: 0,
  };

  // ── DOM helpers ──
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k.startsWith("on")) node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      if (typeof child === "string" || typeof child === "number") node.appendChild(document.createTextNode(String(child)));
      else if (Array.isArray(child)) child.forEach(c => { if (c) node.appendChild(c); });
      else node.appendChild(child);
    }
    return node;
  }

  function clear(container) { container.innerHTML = ""; }

  // ── Filtering ──
  function getFiltered() {
    return ALL_AGENTS.filter(function(a) {
      var q = state.search.toLowerCase();
      var matchSearch = !q || a.name.toLowerCase().indexOf(q) !== -1 || a.role.toLowerCase().indexOf(q) !== -1 || a.id.indexOf(q) !== -1 || a.domain.indexOf(q) !== -1;
      var matchDomain = state.domain === "all" || a.domain === state.domain;
      var matchStatus = state.statusFilter === "all" || a.status === state.statusFilter;
      return matchSearch && matchDomain && matchStatus;
    });
  }

  function getCounts() {
    return {
      active: ALL_AGENTS.filter(function(a) { return a.status === "active"; }).length,
      processing: ALL_AGENTS.filter(function(a) { return a.status === "processing"; }).length,
      alert: ALL_AGENTS.filter(function(a) { return a.status === "alert"; }).length,
      idle: ALL_AGENTS.filter(function(a) { return a.status === "idle"; }).length,
      offline: ALL_AGENTS.filter(function(a) { return a.status === "offline"; }).length,
    };
  }

  // ── Stat card ──
  function renderStatCard(label, value, sub) {
    var card = el("div", { style: { flex:"1", padding:"16px 20px", borderRight:"1px solid #1a1a1a" } },
      el("div", { style: { fontSize:"24px", fontWeight:"700", lineHeight:"1" } }, String(value)),
      el("div", { style: { fontSize:"10px", opacity:"0.3", letterSpacing:"0.15em", textTransform:"uppercase", marginTop:"4px" } }, label)
    );
    if (sub) card.appendChild(el("div", { style: { fontSize:"10px", opacity:"0.2", marginTop:"3px" } }, sub));
    return card;
  }

  // ── Agent row ──
  function renderAgentRow(agent, isSelected) {
    var dot = STATUS_DOTS[agent.status] || "\u25CF";
    var col = STATUS_COLORS[agent.status] || "#333";
    var row = el("div", {
      style: {
        display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px",
        borderBottom:"1px solid #0d0d0d", cursor:"pointer",
        background: isSelected ? "#0d0d0d" : "transparent",
        transition:"background 0.1s",
      },
      onClick: function() {
        state.selected = (state.selected && state.selected.id === agent.id) ? null : agent;
        render();
      },
      onMouseenter: function(e) { if (!isSelected) e.currentTarget.style.background = "#080808"; },
      onMouseleave: function(e) { if (!isSelected) e.currentTarget.style.background = "transparent"; },
    },
      el("span", { style: { color:col, fontSize:"10px", width:"10px", flexShrink:"0" } }, dot),
      el("span", { style: { fontSize:"10px", opacity:"0.25", width:"30px", flexShrink:"0" } }, "#" + agent.id),
      el("span", { style: { fontSize:"12px", fontWeight:"600", width:"90px", flexShrink:"0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" } }, agent.name),
      el("span", { style: { fontSize:"11px", opacity:"0.4", flex:"1", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" } }, agent.role),
      el("span", { style: { fontSize:"10px", opacity:"0.25", width:"80px", flexShrink:"0", textAlign:"right" } }, agent.domain),
      el("span", { style: { fontSize:"10px", opacity:"0.25", width:"50px", flexShrink:"0", textAlign:"right" } }, agent.uptime > 0 ? agent.uptime.toFixed(1) + "%" : "\u2014"),
      el("span", { style: { fontSize:"10px", opacity:"0.2", width:"60px", flexShrink:"0", textAlign:"right" } }, agent.mem > 0 ? agent.mem + "mb" : "\u2014")
    );
    return row;
  }

  // ── Agent detail panel ──
  function renderDetail(agent) {
    if (!agent) return null;
    var col = STATUS_COLORS[agent.status];
    var dot = STATUS_DOTS[agent.status];
    var idHash = "PS-SHA\u221E\u00B7" + agent.id + "." + Math.abs(agent.name.split("").reduce(function(a,c){ return a + c.charCodeAt(0); }, 0)).toString(36);

    var fields = [
      ["Role",      agent.role],
      ["Domain",    agent.domain],
      ["Uptime",    agent.uptime > 0 ? agent.uptime.toFixed(2) + "%" : "offline"],
      ["Memory",    agent.mem > 0 ? agent.mem + " mb" : "\u2014"],
      ["Tasks",     agent.tasks.toLocaleString()],
      ["ID Hash",   idHash],
      ["Mesh Node", "agent-" + agent.id + ".agents.blackroad.network"],
    ];

    var fieldEls = fields.map(function(pair) {
      return el("div", { style: { marginBottom:"12px", paddingBottom:"12px", borderBottom:"1px solid #0d0d0d" } },
        el("div", { style: { fontSize:"9px", opacity:"0.3", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"3px" } }, pair[0]),
        el("div", { style: { fontSize:"11px", opacity:"0.7", wordBreak:"break-all" } }, pair[1])
      );
    });

    var capabilities = ["read","write","execute","mesh-comm","memory","ps-sha",agent.domain];
    var capEls = capabilities.map(function(c) {
      return el("span", { style: { fontSize:"9px", border:"1px solid #222", padding:"2px 6px", color:"#666", letterSpacing:"0.08em" } }, c);
    });

    var actions;
    if (agent.status === "offline") {
      actions = el("div", { style: { marginTop:"20px", display:"flex", flexDirection:"column", gap:"6px" } },
        el("button", { style: { background:"#fff", color:"#000", border:"none", fontFamily:"monospace", fontSize:"11px", fontWeight:"700", padding:"8px 0", cursor:"pointer" } }, "BOOT AGENT")
      );
    } else {
      actions = el("div", { style: { marginTop:"20px", display:"flex", flexDirection:"column", gap:"6px" } },
        el("button", { style: { background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:"11px", padding:"7px 0", cursor:"pointer" } }, "VIEW LOGS"),
        el("button", { style: { background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:"11px", padding:"7px 0", cursor:"pointer" } }, "PING"),
        el("button", { style: { background:"transparent", border:"1px solid #222", color:"#555", fontFamily:"monospace", fontSize:"11px", padding:"7px 0", cursor:"pointer" } }, "RESTART")
      );
    }

    var content = el("div", { style: { flex:"1", overflowY:"auto", padding:"16px" } },
      el("div", { style: { marginBottom:"20px" } },
        el("div", { style: { display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" } },
          el("span", { style: { color:col, fontSize:"12px" } }, dot),
          el("span", { style: { fontSize:"18px", fontWeight:"700" } }, agent.name)
        ),
        el("div", { style: { fontSize:"11px", opacity:"0.4" } }, "#" + agent.id + " \u00B7 " + agent.status.toUpperCase())
      ),
      fieldEls,
      el("div", { style: { marginTop:"4px" } },
        el("div", { style: { fontSize:"9px", opacity:"0.3", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"8px" } }, "Capabilities"),
        el("div", { style: { display:"flex", flexWrap:"wrap", gap:"5px" } }, capEls)
      ),
      actions
    );

    var panel = el("div", { style: { width:"280px", borderLeft:"1px solid #1a1a1a", display:"flex", flexDirection:"column", background:"#000", flexShrink:"0", overflow:"hidden" } },
      el("div", { style: { padding:"14px 16px", borderBottom:"1px solid #1a1a1a", display:"flex", justifyContent:"space-between" } },
        el("span", { style: { fontSize:"11px", opacity:"0.4", letterSpacing:"0.15em", textTransform:"uppercase" } }, "Agent"),
        el("button", {
          style: { background:"none", border:"none", color:"#fff", opacity:"0.3", cursor:"pointer", fontSize:"14px" },
          onClick: function() { state.selected = null; render(); }
        }, "\u2715")
      ),
      content
    );
    return panel;
  }

  // ── Pagination button ──
  function pgBtn(label, targetPage, disabled) {
    return el("button", {
      style: { background:"none", border:"none", color: disabled ? "#333" : "#fff", cursor: disabled ? "default" : "pointer", fontFamily:"monospace", fontSize:"11px" },
      onClick: disabled ? null : function() { state.page = targetPage; render(); },
    }, label);
  }

  // ── Main render ──
  function render() {
    var root = document.getElementById("agent-dashboard");
    if (!root) return;
    clear(root);

    var filtered = getFiltered();
    var counts = getCounts();
    var totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
    if (state.page >= totalPages) state.page = totalPages - 1;
    var visible = filtered.slice(state.page * PER_PAGE, (state.page + 1) * PER_PAGE);

    // Stats bar
    var statsBar = el("div", { style: { display:"flex", borderBottom:"1px solid #1a1a1a", flexShrink:"0" } },
      renderStatCard("Total Agents", TOTAL_TARGET.toLocaleString(), "target"),
      renderStatCard("Online", ONLINE_COUNT, ((ONLINE_COUNT / TOTAL_TARGET) * 100).toFixed(1) + "% uptime"),
      renderStatCard("Active", counts.active, null),
      renderStatCard("Alert", counts.alert, "requires attention"),
      renderStatCard("Offline", counts.offline, null)
    );
    var meshCoverage = el("div", { style: { flex:"1", padding:"16px 20px" } },
      el("div", { style: { fontSize:"10px", opacity:"0.2", marginBottom:"8px", letterSpacing:"0.15em", textTransform:"uppercase" } }, "Mesh coverage"),
      el("div", { style: { height:"4px", background:"#111", position:"relative" } },
        el("div", { style: { position:"absolute", left:"0", top:"0", height:"100%", width: ((ONLINE_COUNT / TOTAL_TARGET) * 100) + "%", background:GRAD } })
      ),
      el("div", { style: { fontSize:"10px", opacity:"0.2", marginTop:"4px" } }, "blackroad.network \u00B7 na1 eu1 ap1")
    );
    statsBar.appendChild(meshCoverage);

    // Toolbar
    var searchInput = el("input", {
      style: { background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:"12px", padding:"5px 10px", outline:"none", width:"200px", caretColor:"#fff" },
      placeholder: "Search agents\u2026",
      value: state.search,
      onInput: function(e) { state.search = e.target.value; state.page = 0; render(); },
    });

    var domainSelect = el("select", {
      style: { background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:"11px", padding:"5px 8px", outline:"none" },
      onChange: function(e) { state.domain = e.target.value; state.page = 0; render(); },
    });
    DOMAINS.forEach(function(d) {
      var opt = el("option", { value: d }, d);
      if (d === state.domain) opt.selected = true;
      domainSelect.appendChild(opt);
    });

    var statusSelect = el("select", {
      style: { background:"#000", border:"1px solid #222", color:"#fff", fontFamily:"monospace", fontSize:"11px", padding:"5px 8px", outline:"none" },
      onChange: function(e) { state.statusFilter = e.target.value; state.page = 0; render(); },
    });
    STATUSES.forEach(function(s) {
      var opt = el("option", { value: s }, s);
      if (s === state.statusFilter) opt.selected = true;
      statusSelect.appendChild(opt);
    });

    var toolbar = el("div", { style: { display:"flex", alignItems:"center", gap:"10px", padding:"8px 16px", borderBottom:"1px solid #1a1a1a", flexShrink:"0", flexWrap:"wrap" } },
      searchInput, domainSelect, statusSelect,
      el("span", { style: { fontSize:"11px", opacity:"0.3", marginLeft:"auto" } }, filtered.length.toLocaleString() + " agents")
    );

    // Column headers
    var headerCols = [["","10px"],["#","30px"],["Name","90px"],["Role","1fr"],["Domain","80px"],["Uptime","50px"],["Mem","60px"]];
    var colHeader = el("div", { style: { display:"flex", alignItems:"center", gap:"12px", padding:"6px 16px", borderBottom:"1px solid #111", flexShrink:"0" } });
    headerCols.forEach(function(pair) {
      var l = pair[0], w = pair[1];
      var s = { fontSize:"9px", opacity:"0.2", letterSpacing:"0.15em", textTransform:"uppercase", flexShrink:"0" };
      if (w === "1fr") s.flex = "1"; else s.width = w;
      if (["Uptime","Mem","Domain"].indexOf(l) !== -1) s.textAlign = "right";
      colHeader.appendChild(el("span", { style: s }, l));
    });

    // Agent list
    var listContainer = el("div", { style: { flex:"1", overflowY:"auto", minWidth:"0" } });
    if (visible.length === 0) {
      listContainer.appendChild(el("div", { style: { padding:"40px", textAlign:"center", opacity:"0.2", fontSize:"12px" } }, "No agents match filters"));
    } else {
      visible.forEach(function(a) {
        listContainer.appendChild(renderAgentRow(a, state.selected && state.selected.id === a.id));
      });
    }

    var mainArea = el("div", { style: { flex:"1", display:"flex", overflow:"hidden", minHeight:"0" } }, listContainer);
    var detail = renderDetail(state.selected);
    if (detail) mainArea.appendChild(detail);

    // Pagination
    var p = state.page;
    var pagination = el("div", { style: { height:"36px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", borderTop:"1px solid #1a1a1a", flexShrink:"0", fontSize:"11px" } },
      pgBtn("\u00AB", 0, p === 0),
      pgBtn("\u2039", Math.max(0, p - 1), p === 0),
      el("span", { style: { opacity:"0.3" } }, (p + 1) + " / " + totalPages),
      pgBtn("\u203A", Math.min(totalPages - 1, p + 1), p >= totalPages - 1),
      pgBtn("\u00BB", totalPages - 1, p >= totalPages - 1)
    );

    // Assemble
    root.style.height = "100%";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.background = "#000";
    root.style.color = "#fff";
    root.style.overflow = "hidden";
    root.style.fontFamily = "monospace";

    root.appendChild(statsBar);
    root.appendChild(toolbar);
    root.appendChild(colHeader);
    root.appendChild(mainArea);
    root.appendChild(pagination);
  }

  return { render: render };
})();
