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

      {/* hurricane watch banner */}
      {HW.hurricaneWatch && HW.hurricaneWatch.active && (
        <div className="rise" style={{ margin:"14px 20px 0" }}>
          <button onClick={() => nav.go("properties")} className="tap" style={{ width:"100%", textAlign:"left", border:"none",
            background:"linear-gradient(135deg,#7A2800,#C45200)", color:"#fff", borderRadius:"var(--r)", padding:"13px 16px",
            cursor:"pointer", display:"flex", alignItems:"center", gap:12, boxShadow:"0 6px 20px rgba(196,82,0,0.35)" }}>
            <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="hurricane" size={22} color="#fff" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:14.5 }}>{HW.hurricaneWatch.name} · Hurricane Watch</div>
              <div style={{ fontSize:12.5, opacity:0.85, marginTop:2 }}>
                {HW.stats.hurricane_watch} properties at risk · {HW.hurricaneWatch.wind} winds · ETA {HW.hurricaneWatch.eta}
              </div>
            </div>
            <Icon name="chevron-right" size={20} color="rgba(255,255,255,0.9)" />
          </button>
        </div>
      )}

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

// ── HURRICANE MANAGE SHEET ───────────────────────────────────
function HurricaneManageSheet({ hurricanePropIds, onToggle, onClose }) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:20, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      {/* backdrop */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(15,28,63,0.45)", backdropFilter:"blur(3px)" }} />
      {/* sheet */}
      <div style={{ position:"relative", background:"var(--bg)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"0 0 34px", maxHeight:"72%", display:"flex", flexDirection:"column",
        animation:"hw-slide-up .3s cubic-bezier(.22,.61,.36,1) both" }}>
        {/* handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
          <div style={{ width:36, height:4, borderRadius:999, background:"var(--line)" }} />
        </div>
        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 20px 14px" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, letterSpacing:-0.3 }}>Hurricane Watch</div>
            <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2 }}>Tap to add or remove properties</div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"var(--bg-2)", borderRadius:999, width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="x" size={17} color="var(--ink-2)" />
          </button>
        </div>
        <Hr />
        {/* property list */}
        <div style={{ overflowY:"auto", padding:"8px 20px 0" }}>
          {HW.properties.map(p => {
            const on = hurricanePropIds.has(p.id);
            return (
              <button key={p.id} onClick={() => onToggle(p.id)} className="tap"
                style={{ display:"flex", alignItems:"center", gap:13, width:"100%", padding:"13px 0",
                  border:"none", background:"transparent", cursor:"pointer", textAlign:"left",
                  borderBottom:"1px solid var(--line)" }}>
                {/* toggle */}
                <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  background: on ? "#C45200" : "var(--bg-2)", transition:"background .15s" }}>
                  {on
                    ? <Icon name="hurricane" size={16} color="#fff" />
                    : <Icon name="plus" size={16} color="var(--ink-3)" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14.5, letterSpacing:-0.2 }}>{p.name}</div>
                  <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>{p.address.split(",")[0]}</div>
                </div>
                <StatusPill status={p.status} dot={false} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── HURRICANE WATCH SECTION ───────────────────────────────────
function HurricaneWatchSection({ nav, hurricanePropIds, onManage }) {
  const hw = HW.hurricaneWatch;
  if (!hw || !hw.active) return null;
  const props = HW.properties.filter(p => hurricanePropIds.has(p.id));
  return (
    <div style={{ margin:"16px 20px 0" }} className="rise">
      {/* storm banner */}
      <div style={{ background:"linear-gradient(135deg,#7A2800,#C45200)", borderRadius:"var(--r) var(--r) 0 0",
        padding:"14px 16px 12px", color:"#fff", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon name="hurricane" size={26} color="#fff" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:10.5, fontWeight:800, letterSpacing:0.12, textTransform:"uppercase", opacity:0.8 }}>
            Hurricane Watch Active · {hw.counties.join(", ")} Counties
          </div>
          <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.3, marginTop:2 }}>{hw.name}</div>
          <div style={{ fontSize:12.5, opacity:0.85, marginTop:2, display:"flex", gap:14 }}>
            <span>💨 {hw.wind}</span>
            <span>⏱ ETA {hw.eta}</span>
          </div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, opacity:0.7, textAlign:"right", flexShrink:0, lineHeight:1.4 }}>
          Updated<br/>{hw.updated}
        </div>
      </div>
      {/* affected properties */}
      <div style={{ background:"#FFF0E0", borderRadius:"0 0 var(--r) var(--r)", padding:"10px 14px 12px", borderTop:"1px solid rgba(196,82,0,0.2)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:11.5, fontWeight:800, color:"#C45200", letterSpacing:0.06, textTransform:"uppercase" }}>
            {props.length} {props.length === 1 ? "property" : "properties"} under watch
          </div>
          <button onClick={onManage} style={{ display:"flex", alignItems:"center", gap:5, border:"none", cursor:"pointer",
            background:"rgba(196,82,0,0.12)", borderRadius:999, padding:"5px 10px 5px 8px" }}>
            <Icon name="adjustments-horizontal" size={13} color="#C45200" />
            <span style={{ fontSize:12, fontWeight:800, color:"#C45200" }}>Manage</span>
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {props.length === 0 && (
            <button onClick={onManage} className="tap" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:"12px", borderRadius:12, background:"rgba(196,82,0,0.08)", border:"1.5px dashed rgba(196,82,0,0.3)",
              cursor:"pointer", width:"100%" }}>
              <Icon name="plus" size={16} color="#C45200" />
              <span style={{ fontSize:13.5, fontWeight:700, color:"#C45200" }}>Add properties to watch</span>
            </button>
          )}
          {props.map(p => (
            <button key={p.id} onClick={() => nav.push("property", { id:p.id })} className="tap"
              style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:12,
                background:"#fff", border:"1.5px solid rgba(196,82,0,0.2)", boxShadow:"0 1px 4px rgba(196,82,0,0.08)",
                cursor:"pointer", textAlign:"left", width:"100%" }}>
              <Icon name="hurricane" size={20} color="#C45200" style={{ flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14, color:"var(--ink)", letterSpacing:-0.2 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#C45200", fontWeight:600, marginTop:1 }}>{p.address.split(",")[1]?.trim()}</div>
              </div>
              <StatusPill status={p.status} dot={false} />
              <Icon name="chevron-right" size={17} color="rgba(196,82,0,0.5)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PROPERTIES LIST ──────────────────────────────────────────
function Properties({ nav }) {
  const [filter, setFilter] = useState("All");
  const [showManage, setShowManage] = useState(false);
  const [hurricanePropIds, setHurricanePropIds] = useState(
    () => new Set(HW.properties.filter(p => p.hurricane).map(p => p.id))
  );
  const toggleHurricane = (id) => setHurricanePropIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const filters = ["All", "Hurricane Watch", "Needs attention", "Seasonal", "Vacant"];
  const hurricaneActive = HW.hurricaneWatch && HW.hurricaneWatch.active;
  const list = HW.properties.filter(p => {
    if (filter === "Hurricane Watch") return hurricanePropIds.has(p.id);
    if (filter === "All") return true;
    if (filter === "Needs attention") return p.status !== "active";
    return p.type === filter;
  });
  return (
    <div style={{ position:"relative", height:"100%", display:"flex", flexDirection:"column" }}>
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
          {filters.map(f => {
            const isHurricane = f === "Hurricane Watch";
            const active = filter === f;
            const count = isHurricane ? hurricanePropIds.size : 0;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ flexShrink:0, border:"none", cursor:"pointer", whiteSpace:"nowrap",
                padding:"8px 15px", borderRadius:999, fontSize:13.5, fontWeight:700, fontFamily:"var(--sans)",
                background: active ? (isHurricane ? "#C45200" : "var(--pine)") : (isHurricane ? "#FFF0E0" : "var(--surface)"),
                color: active ? "#fff" : (isHurricane ? "#C45200" : "var(--ink-2)"),
                boxShadow: active ? "none" : "var(--shadow-sm)", transition:"all .15s",
                display:"flex", alignItems:"center", gap:5 }}>
                {isHurricane && <Icon name="hurricane" size={14} color={active ? "#fff" : "#C45200"} />}
                {f}
                {isHurricane && count > 0 && (
                  <span style={{ background: active ? "rgba(255,255,255,0.25)" : "rgba(196,82,0,0.15)",
                    borderRadius:999, padding:"1px 6px", fontSize:12 }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
        {/* hurricane watch section — shown on All view */}
        {filter === "All" && hurricaneActive && (
          <HurricaneWatchSection nav={nav} hurricanePropIds={hurricanePropIds} onManage={() => setShowManage(true)} />
        )}
        {/* manage button on Hurricane Watch filter view */}
        {filter === "Hurricane Watch" && (
          <div style={{ padding:"10px 20px 0", display:"flex", justifyContent:"flex-end" }}>
            <button onClick={() => setShowManage(true)} style={{ display:"flex", alignItems:"center", gap:6, border:"none", cursor:"pointer",
              background:"#FFF0E0", borderRadius:999, padding:"7px 14px 7px 10px" }}>
              <Icon name="adjustments-horizontal" size={15} color="#C45200" />
              <span style={{ fontSize:13, fontWeight:800, color:"#C45200" }}>Manage</span>
            </button>
          </div>
        )}
        {/* cards */}
        <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:14 }}>
          {list.map((p,i) => (
            <PropertyCard key={p.id} p={p} nav={nav} delay={0.05*i} isHurricane={hurricanePropIds.has(p.id)} />
          ))}
        </div>
      </div>
      {showManage && (
        <HurricaneManageSheet
          hurricanePropIds={hurricanePropIds}
          onToggle={toggleHurricane}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}

function PropertyCard({ p, nav, delay = 0, isHurricane = false }) {
  return (
    <button onClick={() => nav.push("property", { id:p.id })} className="tap rise"
      style={{ border:"none", padding:0, cursor:"pointer", textAlign:"left", borderRadius:"var(--r)", overflow:"hidden",
        background:"var(--surface)", boxShadow:"var(--shadow)", width:"100%", animationDelay:`${delay}s` }}>
      {/* gradient header */}
      <div style={{ background:p.grad, padding:"15px 16px 14px", color:"#fff", position:"relative", overflow:"hidden" }}>
        <Icon name="home" size={120} style={{ position:"absolute", right:-22, top:-16, opacity:0.1 }} color="#fff" />
        {isHurricane && (
          <div style={{ position:"absolute", top:10, right:10, display:"flex", alignItems:"center", gap:5,
            background:"rgba(196,82,0,0.92)", borderRadius:999, padding:"4px 9px 4px 7px", backdropFilter:"blur(4px)" }}>
            <Icon name="hurricane" size={13} color="#fff" />
            <span style={{ fontSize:11, fontWeight:800, color:"#fff", letterSpacing:0.04 }}>Hurricane Watch</span>
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, position:"relative" }}>
          <div>
            <div style={{ fontSize:11.5, fontWeight:700, letterSpacing:0.08, textTransform:"uppercase", opacity:0.85 }}>{p.type}</div>
            <div style={{ fontSize:19, fontWeight:800, letterSpacing:-0.3, marginTop:3 }}>{p.name}</div>
          </div>
          {!isHurricane && <StatusPill status={p.status} dot={false} />}
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
