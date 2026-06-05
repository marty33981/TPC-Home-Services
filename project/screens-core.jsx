// ─────────────────────────────────────────────────────────────
// TPC Home Services — core screens
// ─────────────────────────────────────────────────────────────

// ── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ nav }) {
  const urgent = HW.schedule.find(s => s.status === "urgent");
  const today = HW.schedule.filter(s => s.date === "May 15");
  const stats = HW.stats;
  const statCards = [
    { icon:"home",          v:stats.active_properties, l:"Active properties", c:"var(--pine)",  bg:"var(--mint-bg)" },
    { icon:"alert-triangle",v:stats.alerts_open,        l:"Open alerts",       c:"var(--danger)",bg:"var(--danger-bg)" },
    { icon:"calendar-check",v:stats.visits_this_week,   l:"Visits this week",  c:"var(--info)",  bg:"var(--info-bg)" },
    { icon:"file-text",     v:stats.reports_sent,        l:"Reports sent",      c:"var(--warn)",  bg:"var(--warn-bg)" },
  ];
  return (
    <div className="hw-scroll">
      <AppHeader large={false} />
      {/* greeting */}
      <div style={{ padding:"4px 20px 6px" }} className="anim-fade">
        <div className="eyebrow" style={{ marginBottom:8 }}>Thursday, May 15</div>
        <h1 style={{ margin:0, fontSize:34, fontWeight:500, letterSpacing:-0.5, lineHeight:1.06, fontFamily:"var(--greet-font)" }}>
          Good morning,<br/><span style={{ fontStyle:"italic" }}>Maria</span>
        </h1>
        <p style={{ margin:"10px 0 0", color:"var(--ink-2)", fontSize:15.5, fontWeight:500 }}>
          3 properties need attention today.
        </p>
      </div>

      {/* urgent banner */}
      {urgent && (
        <div className="rise" style={{ margin:"16px 20px 0" }}>
          <button onClick={() => nav.push("property", { id:1 })} className="tap" style={{ width:"100%", textAlign:"left", border:"none",
            background:"var(--danger)", color:"#fff", borderRadius:"var(--r)", padding:"15px 16px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:13, boxShadow:"0 8px 22px rgba(178,58,46,0.28)" }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="droplet-filled" size={22} color="#fff" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>Water intrusion · Gulf Breeze Villa</div>
              <div style={{ fontSize:13, opacity:0.9, marginTop:1 }}>Shut-off engaged — review now</div>
            </div>
            <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.9)" />
          </button>
        </div>
      )}

      {/* stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:11, padding:"18px 20px 0" }}>
        {statCards.map((s, i) => (
          <div key={s.l} className="card rise" style={{ padding:"14px 15px", animationDelay:`${0.04*i}s` }}>
            <IconTile icon={s.icon} bg={s.bg} color={s.c} size={34} r={10} iconSize={18} />
            <div className="tnum" style={{ fontSize:28, fontWeight:800, letterSpacing:-0.8, marginTop:10, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12.5, color:"var(--ink-2)", fontWeight:600, marginTop:3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* today schedule */}
      <SectionTitle action="Full schedule" onAction={() => nav.go("schedule")}>Today's route</SectionTitle>
      <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:10 }}>
        {today.map((s, i) => <ScheduleRow key={s.id} item={s} nav={nav} delay={0.04*i} />)}
      </div>

      {/* recent alerts */}
      <SectionTitle action="View all" onAction={() => nav.go("alerts")}>Recent alerts</SectionTitle>
      <div style={{ padding:"0 20px 8px", display:"flex", flexDirection:"column", gap:10 }}>
        {HW.alerts.slice(0,2).map((a,i) => <AlertRow key={a.id} a={a} nav={nav} delay={0.04*i} />)}
      </div>
    </div>
  );
}

// schedule row (reused on dashboard + schedule)
function ScheduleRow({ item, nav, delay = 0 }) {
  return (
    <button onClick={() => nav.push("inspection", { schedId:item.id })} className="card tap rise"
      style={{ display:"flex", alignItems:"center", gap:13, padding:"13px 14px", border:"none", textAlign:"left", cursor:"pointer", width:"100%", animationDelay:`${delay}s` }}>
      <div style={{ width:54, flexShrink:0, textAlign:"center" }}>
        <div className="tnum" style={{ fontSize:15, fontWeight:800, letterSpacing:-0.3, color:"var(--ink)" }}>{item.time.split(" ")[0]}</div>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)" }}>{item.time.split(" ")[1]}</div>
      </div>
      <div style={{ width:1, alignSelf:"stretch", background:"var(--line)" }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:15, letterSpacing:-0.2 }}>{item.name}</div>
        <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2, display:"flex", alignItems:"center", gap:5 }}>
          <Icon name="map-pin" size={13} color="var(--ink-3)" />
          <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.prop}</span>
        </div>
      </div>
      <StatusPill status={item.status} dot={false} />
    </button>
  );
}

// alert row (reused)
function AlertRow({ a, nav, delay = 0 }) {
  const tone = { danger:["var(--danger)","var(--danger-bg)"], warn:["var(--warn)","var(--warn-bg)"], info:["var(--info)","var(--info-bg)"] }[a.type];
  const pid = (HW.properties.find(p => p.name === a.prop) || {}).id;
  return (
    <button onClick={() => pid && nav.push("property", { id:pid })} className="card tap rise"
      style={{ display:"flex", gap:12, padding:"13px 14px", border:"none", textAlign:"left", cursor:"pointer", width:"100%", animationDelay:`${delay}s` }}>
      <IconTile icon={a.icon.replace("ti-","")} bg={tone[1]} color={tone[0]} size={40} r={11} iconSize={20} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
          <span style={{ fontWeight:700, fontSize:14.5 }}>{a.title}</span>
          <span style={{ fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap", fontWeight:600 }}>{a.time.split(" · ")[1] || a.time}</span>
        </div>
        <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:3, lineHeight:1.4 }}>{a.desc}</div>
      </div>
    </button>
  );
}

// ── PROPERTIES LIST ──────────────────────────────────────────
function Properties({ nav }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Needs attention", "Seasonal", "Vacant"];
  const list = HW.properties.filter(p => {
    if (filter === "All") return true;
    if (filter === "Needs attention") return p.status !== "active";
    return p.type === filter;
  });
  return (
    <div className="hw-scroll">
      <AppHeader title="Properties" sub={`${HW.stats.active_properties} under watch`} />
      {/* search */}
      <div style={{ padding:"2px 20px 4px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, background:"var(--surface)", borderRadius:13, padding:"11px 14px", boxShadow:"var(--shadow-sm)" }}>
          <Icon name="search" size={18} color="var(--ink-3)" />
          <span style={{ color:"var(--ink-3)", fontSize:15 }}>Search properties or owners</span>
        </div>
      </div>
      {/* filter chips */}
      <div className="hscroll" style={{ padding:"12px 20px 4px" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flexShrink:0, border:"none", cursor:"pointer", whiteSpace:"nowrap",
            padding:"8px 15px", borderRadius:999, fontSize:13.5, fontWeight:700, fontFamily:"var(--sans)",
            background: filter===f ? "var(--pine)" : "var(--surface)", color: filter===f ? "var(--on-pine)" : "var(--ink-2)",
            boxShadow: filter===f ? "none" : "var(--shadow-sm)", transition:"all .15s" }}>{f}</button>
        ))}
      </div>
      {/* cards */}
      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:14 }}>
        {list.map((p,i) => <PropertyCard key={p.id} p={p} nav={nav} delay={0.05*i} />)}
      </div>
    </div>
  );
}

function PropertyCard({ p, nav, delay = 0 }) {
  return (
    <button onClick={() => nav.push("property", { id:p.id })} className="tap rise"
      style={{ border:"none", padding:0, cursor:"pointer", textAlign:"left", borderRadius:"var(--r)", overflow:"hidden",
        background:"var(--surface)", boxShadow:"var(--shadow)", width:"100%", animationDelay:`${delay}s` }}>
      {/* gradient header */}
      <div style={{ background:p.grad, padding:"15px 16px 14px", color:"#fff", position:"relative", overflow:"hidden" }}>
        <Icon name="home" size={120} style={{ position:"absolute", right:-22, top:-16, opacity:0.1 }} color="#fff" />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, position:"relative" }}>
          <div>
            <div style={{ fontSize:11.5, fontWeight:700, letterSpacing:0.08, textTransform:"uppercase", opacity:0.85 }}>{p.type}</div>
            <div style={{ fontSize:19, fontWeight:800, letterSpacing:-0.3, marginTop:3 }}>{p.name}</div>
          </div>
          <StatusPill status={p.status} dot={false} />
        </div>
      </div>
      {/* body */}
      <div style={{ padding:"13px 16px 15px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7, color:"var(--ink-2)", fontSize:13.5 }}>
          <Icon name="map-pin" size={15} color="var(--ink-3)" />
          <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.address}</span>
        </div>
        <div style={{ display:"flex", gap:18, marginTop:12 }}>
          <Meta icon="repeat" label={p.freq} />
          <Meta icon="clock-check" label={`Last ${p.last}`} />
          <Meta icon="user" label={p.owner.name.split(" ")[1] || p.owner.name} />
        </div>
      </div>
    </button>
  );
}
function Meta({ icon, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:0 }}>
      <Icon name={icon} size={15} color="var(--mint)" />
      <span style={{ fontSize:12.5, fontWeight:600, color:"var(--ink-2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>
    </div>
  );
}

// ── SCHEDULE ─────────────────────────────────────────────────
function Schedule({ nav }) {
  const groups = {};
  HW.schedule.forEach(s => {
    const label = HW.scheduleLabels[s.date] || s.date;
    (groups[label] = groups[label] || []).push(s);
  });
  const days = [
    { d:"15", w:"THU", active:true }, { d:"16", w:"FRI" }, { d:"17", w:"SAT" },
    { d:"18", w:"SUN" }, { d:"19", w:"MON" }, { d:"20", w:"TUE" }, { d:"21", w:"WED" },
  ];
  return (
    <div className="hw-scroll">
      <AppHeader title="Schedule" sub="This week · 5 visits" />
      {/* week strip */}
      <div className="hscroll" style={{ padding:"2px 20px 6px" }}>
        {days.map(day => (
          <div key={day.d} style={{ flexShrink:0, width:46, textAlign:"center", padding:"9px 0", borderRadius:14, cursor:"pointer",
            background: day.active ? "var(--pine)" : "var(--surface)", color: day.active ? "var(--on-pine)" : "var(--ink)",
            boxShadow: day.active ? "none" : "var(--shadow-sm)" }}>
            <div style={{ fontSize:10.5, fontWeight:700, opacity:0.7, letterSpacing:0.06 }}>{day.w}</div>
            <div className="tnum" style={{ fontSize:18, fontWeight:800, marginTop:2 }}>{day.d}</div>
          </div>
        ))}
      </div>
      {Object.entries(groups).map(([label, items], gi) => (
        <div key={label}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"20px 20px 11px" }}>
            <h2 style={{ margin:0, fontSize:15, fontWeight:800, letterSpacing:-0.2 }}>{label}</h2>
            <div style={{ flex:1, height:1, background:"var(--line)" }} />
            <span style={{ fontSize:12.5, color:"var(--ink-3)", fontWeight:700 }}>{items.length} {items.length>1?"visits":"visit"}</span>
          </div>
          <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:10 }}>
            {items.map((s,i) => <ScheduleRow key={s.id} item={s} nav={nav} delay={0.04*i} />)}
          </div>
        </div>
      ))}
      <div style={{ height:10 }} />
    </div>
  );
}

Object.assign(window, { Dashboard, Properties, PropertyCard, Schedule, ScheduleRow, AlertRow });
