// ─────────────────────────────────────────────────────────────
// TPC Home Services — core screens
// ─────────────────────────────────────────────────────────────

function InstallNudge() { return null; }

// ── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ nav, canGoBack, user }) {
  const [activeCount, setActiveCount] = useState(HW.stats.active_properties);
  useEffect(() => {
    FBUTIL.listProperties().then(list => { if (list.length > 0) setActiveCount(list.length); });
  }, []);
  const urgent = null; // no hardcoded urgent banners
  const today = [];
  const stats = HW.stats;
  const statCards = [
    { icon:"home",          v:activeCount,             l:"Active properties", c:"var(--pine)",  bg:"var(--mint-bg)",   go:() => nav.go("properties") },
    { icon:"alert-triangle",v:stats.alerts_open,        l:"Open alerts",       c:"var(--danger)",bg:"var(--danger-bg)", go:() => nav.go("alerts") },
    { icon:"calendar-check",v:stats.visits_this_week,   l:"Visits this week",  c:"var(--info)",  bg:"var(--info-bg)",   go:() => nav.go("schedule") },
    { icon:"file-text",     v:stats.reports_sent,        l:"Reports sent",      c:"var(--warn)",  bg:"var(--warn-bg)",   go:() => nav.go("operatorReports") },
  ];
  return (
    <div className="hw-scroll">
      <AppHeader large={false} onBack={canGoBack ? nav.back : null} />
      {/* greeting */}
      <div style={{ padding:"4px 20px 6px" }} className="anim-fade">
        <div className="eyebrow" style={{ marginBottom:8 }}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        <h1 style={{ margin:0, fontSize:34, fontWeight:500, letterSpacing:-0.5, lineHeight:1.06, fontFamily:"var(--greet-font)" }}>
          {new Date().getHours() < 12 ? "Good morning," : new Date().getHours() < 17 ? "Good afternoon," : "Good evening,"}<br/><span style={{ fontStyle:"italic" }}>{((user || AUTH.currentUser)?.name || HW.brand.operator).split(" ")[0]}</span>
        </h1>
        <p style={{ margin:"10px 0 0", color:"var(--ink-2)", fontSize:15.5, fontWeight:500 }}>
          {activeCount > 0 ? `${activeCount} ${activeCount === 1 ? "property" : "properties"} under watch.` : "No properties on file yet."}
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
          <button key={s.l} onClick={s.go} className="card rise tap"
            style={{ padding:"14px 15px", animationDelay:`${0.04*i}s`, border:"none",
              background:"var(--surface)", textAlign:"left", cursor:"pointer", display:"block", width:"100%" }}>
            <IconTile icon={s.icon} bg={s.bg} color={s.c} size={34} r={10} iconSize={18} />
            <div className="tnum" style={{ fontSize:28, fontWeight:800, letterSpacing:-0.8, marginTop:10, lineHeight:1 }}>{s.v}</div>
            <div style={{ fontSize:12.5, color:"var(--ink-2)", fontWeight:600, marginTop:3 }}>{s.l}</div>
          </button>
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

      {/* Install app nudge */}
      <InstallNudge />
    </div>
  );
}

// schedule row (reused on dashboard + schedule)
function ScheduleRow({ item, nav, delay = 0, onEdit, onDelete, conflict = false }) {
  return (
    <div className="card rise" style={{ display:"flex", alignItems:"center", gap:0, animationDelay:`${delay}s`, overflow:"hidden",
      outline: conflict ? "2px solid var(--warn)" : "none" }}>
      <button onClick={() => nav.push("inspection", { schedId:item.id })} className="tap"
        style={{ flex:1, display:"flex", alignItems:"center", gap:13, padding:"13px 14px", border:"none", textAlign:"left", cursor:"pointer", background:"transparent" }}>
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
          {conflict && (
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
              <Icon name="alert-triangle" size={12} color="var(--warn)" />
              <span style={{ fontSize:11.5, fontWeight:700, color:"var(--warn)" }}>Scheduling conflict</span>
            </div>
          )}
        </div>
        {item.date
          ? <span style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", whiteSpace:"nowrap", flexShrink:0 }}>{item.date}</span>
          : <StatusPill status={item.status} dot={false} />}
      </button>
      {(onEdit || onDelete) && (
        <div style={{ display:"flex", gap:0, borderLeft:"1px solid var(--line)", flexShrink:0 }}>
          {onEdit && (
            <button onClick={onEdit}
              style={{ width:40, height:"100%", minHeight:60, border:"none", background:"transparent",
                color:"var(--info)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="edit" size={16} />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete}
              style={{ width:40, height:"100%", minHeight:60, border:"none", background:"transparent",
                color:"var(--danger)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                borderLeft: onEdit ? "1px solid var(--line)" : "none" }}>
              <Icon name="trash" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
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
function Properties({ nav, canGoBack, user }) {
  const [filter,     setFilter]     = useState("All");
  const [fsProps,    setFsProps]    = useState(null); // null = loading
  const filters = ["All", "Needs attention", "Seasonal", "Vacant"];

  const role = (user || AUTH.currentUser || {}).role || "operator";
  const canManage = role === "administrator" || role === "supervisor";

  useEffect(() => {
    FBUTIL.listProperties().then(list => setFsProps(list));
  }, []);

  const allProps = fsProps && fsProps.length > 0 ? fsProps : HW.properties;

  const list = allProps.filter(p => {
    if (filter === "All") return true;
    if (filter === "Needs attention") return p.status !== "active";
    return p.type === filter;
  });

  return (
    <div className="hw-scroll">
      <AppHeader title="Properties" sub={`${allProps.length} under watch`}
        onBack={canGoBack ? nav.back : null}
        right={canManage
          ? <button onClick={() => nav.push("adminProperties")}
              style={{ width:34, height:34, borderRadius:999, border:"none",
                background:"var(--pine)", display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={19} color="#fff" />
            </button>
          : null} />
      <div style={{ padding:"2px 20px 4px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, background:"var(--surface)",
          borderRadius:13, padding:"11px 14px", boxShadow:"var(--shadow-sm)" }}>
          <Icon name="search" size={18} color="var(--ink-3)" />
          <span style={{ color:"var(--ink-3)", fontSize:15 }}>Search properties or owners</span>
        </div>
      </div>
      <div className="hscroll" style={{ padding:"12px 20px 4px" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flexShrink:0, border:"none",
            cursor:"pointer", whiteSpace:"nowrap", padding:"8px 15px", borderRadius:999,
            fontSize:13.5, fontWeight:700, fontFamily:"var(--sans)",
            background: filter===f ? "var(--pine)" : "var(--surface)",
            color: filter===f ? "var(--on-pine)" : "var(--ink-2)",
            boxShadow: filter===f ? "none" : "var(--shadow-sm)", transition:"all .15s" }}>{f}</button>
        ))}
      </div>
      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:14 }}>
        {fsProps === null
          ? <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-3)" }}>Loading…</div>
          : list.map((p,i) => <PropertyCard key={p.id} p={p} nav={nav} delay={0.05*i} />)
        }
      </div>
    </div>
  );
}

function PropertyCard({ p, nav, delay = 0 }) {
  return (
    <button onClick={() => nav.push("property", { id:p.id })} className="tap rise"
      style={{ border:"none", padding:0, cursor:"pointer", textAlign:"left", borderRadius:"var(--r)", overflow:"hidden",
        background:"var(--surface)", boxShadow:"var(--shadow)", width:"100%", animationDelay:`${delay}s` }}>
      {/* photo/gradient header */}
      <div style={{ background: p.photoUrl ? "transparent" : p.grad, padding:"15px 16px 14px", color:"#fff", position:"relative", overflow:"hidden" }}>
        {p.photoUrl && <img src={p.photoUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />}
        {p.photoUrl && <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 100%)" }} />}
        {!p.photoUrl && <Icon name="home" size={120} style={{ position:"absolute", right:-22, top:-16, opacity:0.1 }} color="#fff" />}
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

// Parse a "Jun 17" date label to a Date object, guessing the year.
// Dates more than 180 days in the past are assumed to be next year.
function parseDateLabel(label) {
  if (!label) return null;
  const yr = new Date().getFullYear();
  let d = new Date(`${label} ${yr}`);
  if (isNaN(d.getTime())) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  if ((now - d) > 180 * 86400000) d.setFullYear(yr + 1);
  return d;
}

// Return the Monday of the week containing d.
function weekMonday(d) {
  const m = new Date(d);
  const dow = m.getDay();
  m.setDate(m.getDate() - (dow === 0 ? 6 : dow - 1));
  return m;
}

// ── SCHEDULE ─────────────────────────────────────────────────
function Schedule({ nav, user, canGoBack }) {
  const [fsSchedule, setFsSchedule] = useState(null); // null = loading
  const [addSheet, setAddSheet] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [daySheet, setDaySheet] = useState(null); // selected day object, or null
  const [expandedMonths, setExpandedMonths] = useState(new Set()); // empty = all collapsed
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());

  const toggleMonth = key => setExpandedMonths(s => { const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n; });
  const toggleWeek  = key => setCollapsedWeeks(s => { const n=new Set(s); n.has(key)?n.delete(key):n.add(key); return n; });

  const loadSchedule = () => FBUTIL.listSchedule().then(list => setFsSchedule(list));
  useEffect(() => { loadSchedule(); }, []);

  const loading  = fsSchedule === null;
  const schedule = loading ? [] : (fsSchedule.length > 0 ? fsSchedule : HW.schedule);
  const [filterDay, setFilterDay] = useState(null); // day object — when set, list shows only that date
  const isAdmin = AUTH.isOperator(); // admin and supervisor can edit schedule

  const groups = {};
  schedule.forEach(s => {
    const label = HW.scheduleLabels[s.date] || s.date;
    (groups[label] = groups[label] || []).push(s);
  });

  const visibleGroups = filterDay
    ? { [filterDay.label]: schedule.filter(s => s.date === filterDay.label) }
    : groups;

  // Rolling 7-day strip, paged a week at a time, bounded to ±6 months from today
  const MAX_DAYS = 183;
  const [weekOffset, setWeekOffset] = useState(0); // in units of weeks
  const todayIso = React.useMemo(() => new Date().toISOString().slice(0,10), []);

  const days = React.useMemo(() => {
    const arr = [];
    // Start on Sunday of the current week
    const sun = new Date(); sun.setHours(0,0,0,0);
    sun.setDate(sun.getDate() - sun.getDay()); // back to Sunday
    sun.setDate(sun.getDate() + weekOffset * 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(sun); d.setDate(sun.getDate() + i);
      const iso = d.toISOString().slice(0,10);
      arr.push({
        iso,
        label: d.toLocaleDateString("en-US", { month:"short", day:"numeric" }),
        d:     String(d.getDate()),
        w:     d.toLocaleDateString("en-US", { weekday:"short" }).toUpperCase(),
        active: iso === todayIso,
      });
    }
    return arr;
  }, [weekOffset]);

  const monthLabel = new Date(days[0].iso + "T00:00:00").toLocaleDateString("en-US", { month:"long", year:"numeric" });
  const canPageBack = weekOffset * 7 > -MAX_DAYS;
  const canPageFwd  = weekOffset * 7 < MAX_DAYS - 6;

  // Color a day chip by how soon/overdue its scheduled visits are
  const todayDate = React.useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const dayStatusColor = (day) => {
    const items = schedule.filter(s => s.date === day.label);
    if (items.length === 0) return null;
    if (items.every(s => s.status === "completed")) return { bg:"#D9DADC", fg:"#5B5F66" }; // complete — light gray
    const diffDays = Math.round((new Date(day.iso + "T00:00:00") - todayDate) / 86400000);
    if (diffDays < 0)  return { bg:"var(--danger)", fg:"#fff" };     // overdue — red
    if (diffDays <= 3) return { bg:"#F2994A", fg:"#fff" };           // within 3 days — orange
    return { bg:"#F2C94C", fg:"#3A2E05" };                           // more than 3 days out — yellow
  };

  const saveItem = async (data) => {
    const { dateIso, ...fsData } = data; // strip dateIso — not stored in Firestore
    if (editItem) {
      await FBUTIL.updateScheduleItem(editItem.id, fsData);
    } else {
      // Build all occurrences from today up to 1 year from the initial date
      const todayIso = new Date().toISOString().slice(0, 10);
      const cutoff = new Date(dateIso + "T00:00:00");
      cutoff.setFullYear(cutoff.getFullYear() + 1);
      const allItems = [];
      // Only include the initial date if it's today or in the future
      if (dateIso >= todayIso) allItems.push({ status:"scheduled", ...fsData });
      let curIso = dateIso;
      while (true) {
        const nextIso = nextRecurringISO(curIso, data.type);
        if (!nextIso) break;
        if (new Date(nextIso + "T00:00:00") > cutoff) break;
        if (nextIso >= todayIso) {
          allItems.push({ status:"scheduled", ...fsData, date: isoToDateLabel(nextIso) });
        }
        curIso = nextIso;
      }
      await FBUTIL.batchCreateScheduleItems(allItems);
    }
    await loadSchedule();
    setAddSheet(false); setEditItem(null);
  };

  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState(null);

  const deleteItem = (item) => {
    // item may be passed as a full object (from ScheduleRow/DaySheet) or just an id string
    if (typeof item === "string" || typeof item === "number") {
      // legacy: id only — no series prompt, just delete
      FBUTIL.deleteScheduleItem(item).then(loadSchedule);
    } else {
      setConfirmDeleteItem(item);
    }
  };

  const confirmDeleteSingle = async () => {
    await FBUTIL.deleteScheduleItem(confirmDeleteItem.id);
    setConfirmDeleteItem(null);
    await loadSchedule();
  };

  const confirmDeleteUpcoming = async () => {
    await FBUTIL.deleteScheduleItemsUpcoming(confirmDeleteItem);
    setConfirmDeleteItem(null);
    await loadSchedule();
  };

  return (
    <div className="hw-scroll">
      <AppHeader title="Schedule" sub={`This week · ${schedule.length} visits`} onBack={canGoBack ? nav.back : null}
        right={isAdmin && (
          <button onClick={() => setAddSheet(true)}
            style={{ width:34, height:34, borderRadius:999, border:"none", background:"var(--pine)",
              color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="plus" size={19} color="#fff" />
          </button>
        )} />
      {/* week strip */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"2px 20px 8px" }}>
        <button onClick={() => canPageBack && setWeekOffset(w => w - 1)} disabled={!canPageBack}
          style={{ width:30, height:30, borderRadius:999, border:"none", background:"transparent",
            cursor: canPageBack ? "pointer" : "default", opacity: canPageBack ? 1 : 0.3,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="chevron-left" size={18} color="var(--ink-2)" />
        </button>
        <span style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)" }}>{monthLabel}</span>
        <button onClick={() => canPageFwd && setWeekOffset(w => w + 1)} disabled={!canPageFwd}
          style={{ width:30, height:30, borderRadius:999, border:"none", background:"transparent",
            cursor: canPageFwd ? "pointer" : "default", opacity: canPageFwd ? 1 : 0.3,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="chevron-right" size={18} color="var(--ink-2)" />
        </button>
      </div>
      <div style={{ display:"flex", justifyContent:"center", padding:"2px 20px 6px", gap:8 }}>
        {days.map(day => {
          const statusColor = dayStatusColor(day);
          const bg = statusColor ? statusColor.bg : (day.active ? "var(--pine)" : "var(--surface)");
          const fg = statusColor ? statusColor.fg : (day.active ? "var(--on-pine)" : "var(--ink)");
          return (
            <button key={day.iso} onClick={() => setDaySheet(day)} className="tap"
              style={{ flexShrink:0, width:46, textAlign:"center", padding:"9px 0", borderRadius:14,
                border: day.active ? "2px solid var(--pine)" : "none", cursor:"pointer", fontFamily:"var(--sans)",
                background:bg, color:fg,
                boxShadow: (statusColor || day.active) ? "none" : "var(--shadow-sm)" }}>
              <div style={{ fontSize:10.5, fontWeight:700, opacity:0.7, letterSpacing:0.06 }}>{day.w}</div>
              <div className="tnum" style={{ fontSize:18, fontWeight:800, marginTop:2 }}>{day.d}</div>
            </button>
          );
        })}
      </div>
      {loading && (
        <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-3)" }}>Loading…</div>
      )}

      {filterDay && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 20px 0" }}>
          <span className="pill pill-muted" style={{ fontSize:12 }}>
            Showing {filterDay.w}, {filterDay.label}
          </span>
          <button onClick={() => setFilterDay(null)}
            style={{ border:"none", background:"none", cursor:"pointer", padding:2,
              display:"flex", alignItems:"center", color:"var(--ink-3)", fontSize:12, fontWeight:700,
              fontFamily:"var(--sans)", gap:3 }}>
            <Icon name="x" size={13} /> Clear
          </button>
        </div>
      )}

      {(() => {
        // Detect conflicts: items sharing the same date + time
        const slotCounts = {};
        schedule.forEach(s => {
          if (s.date && s.time) {
            const key = `${s.date}|${s.time}`;
            slotCounts[key] = (slotCounts[key] || 0) + 1;
          }
        });
        const conflictIds = new Set(
          schedule.filter(s => s.date && s.time && slotCounts[`${s.date}|${s.time}`] > 1).map(s => s.id)
        );

        // When a day filter is active, show flat list for that day only
        if (filterDay) {
          const items = schedule.filter(s => s.date === filterDay.label);
          return (
            <div style={{ padding:"0 20px", display:"flex", flexDirection:"column", gap:10, marginTop:10 }}>
              {items.length === 0
                ? <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ink-3)", fontSize:13.5 }}>No visits on this day.</div>
                : items.map((s,i) => (
                    <ScheduleRow key={s.id} item={s} nav={nav} delay={0}
                      conflict={conflictIds.has(s.id)}
                      onEdit={isAdmin ? () => setEditItem(s) : null}
                      onDelete={isAdmin ? () => deleteItem(s) : null} />
                  ))}
            </div>
          );
        }

        // Build month → week → items hierarchy
        const todayISO = new Date().toISOString().slice(0, 10);
        const monthMap = {};
        schedule.filter(s => {
          const d = parseDateLabel(s.date);
          if (!d) return false;
          return d.toISOString().slice(0, 10) >= todayISO; // today and future only
        }).forEach(s => {
          const d = parseDateLabel(s.date);
          if (!d) return;
          const mKey  = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
          const mLbl  = d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
          const wDate = weekMonday(d);
          const wKey  = wDate.toISOString().slice(0,10);
          const wLbl  = `Week of ${wDate.toLocaleDateString('en-US', { month:'short', day:'numeric' })}`;
          if (!monthMap[mKey]) monthMap[mKey] = { label:mLbl, weeks:{} };
          if (!monthMap[mKey].weeks[wKey]) monthMap[mKey].weeks[wKey] = { label:wLbl, items:[] };
          monthMap[mKey].weeks[wKey].items.push(s);
        });

        const sortedMonths = Object.entries(monthMap).sort(([a],[b]) => a.localeCompare(b));

        if (sortedMonths.length === 0 && !loading) {
          return <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--ink-3)", fontSize:13.5 }}>No visits scheduled.</div>;
        }

        return sortedMonths.map(([mKey, { label:mLbl, weeks }]) => {
          const mCollapsed = !expandedMonths.has(mKey);
          const sortedWeeks = Object.entries(weeks).sort(([a],[b]) => a.localeCompare(b));
          const total = sortedWeeks.reduce((n,[,w]) => n + w.items.length, 0);

          return (
            <div key={mKey} style={{ marginBottom:4 }}>
              {/* Month header */}
              <button onClick={() => toggleMonth(mKey)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                  padding:"16px 20px 10px", border:"none", background:"transparent",
                  cursor:"pointer", textAlign:"left", fontFamily:"var(--sans)" }}>
                <h2 style={{ margin:0, fontSize:16, fontWeight:800, letterSpacing:-0.3, color:"var(--ink)", flex:1 }}>{mLbl}</h2>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)" }}>{total} visit{total!==1?"s":""}</span>
                <Icon name={mCollapsed ? "chevron-right" : "chevron-down"} size={17} color="var(--ink-3)" />
              </button>

              {!mCollapsed && sortedWeeks.map(([wKey, { label:wLbl, items }]) => {
                const wCollapsed = collapsedWeeks.has(wKey);
                return (
                  <div key={wKey} style={{ marginBottom:2 }}>
                    {/* Week header */}
                    <button onClick={() => toggleWeek(wKey)}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:8,
                        padding:"7px 20px 7px 32px", border:"none", background:"var(--bg-2)",
                        cursor:"pointer", textAlign:"left", fontFamily:"var(--sans)" }}>
                      <Icon name="calendar-week" size={14} color="var(--ink-3)" />
                      <span style={{ flex:1, fontSize:13, fontWeight:700, color:"var(--ink-2)" }}>{wLbl}</span>
                      <span style={{ fontSize:11.5, fontWeight:700, color:"var(--ink-3)" }}>{items.length} visit{items.length!==1?"s":""}</span>
                      <Icon name={wCollapsed ? "chevron-right" : "chevron-down"} size={15} color="var(--ink-3)" />
                    </button>

                    {!wCollapsed && (
                      <div style={{ padding:"8px 20px 10px", display:"flex", flexDirection:"column", gap:10 }}>
                        {items.map((s,i) => (
                          <ScheduleRow key={s.id} item={s} nav={nav} delay={0}
                            conflict={conflictIds.has(s.id)}
                            onEdit={isAdmin ? () => setEditItem(s) : null}
                            onDelete={isAdmin ? () => deleteItem(s) : null} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        });
      })()}
      <div style={{ height:10 }} />

      {daySheet && (
        <DaySheet
          day={daySheet}
          items={schedule.filter(s => s.date === daySheet.label)}
          isAdmin={isAdmin}
          onClose={() => setDaySheet(null)}
          onAdd={() => { setAddSheet(true); setDaySheet(null); }}
          onEdit={(s) => { setEditItem(s); setDaySheet(null); }}
          onDelete={deleteItem}
          onViewItems={() => { setFilterDay(daySheet); setDaySheet(null); }}
        />
      )}

      {(addSheet || editItem) && (
        <ScheduleSheet
          item={editItem}
          defaultDate={daySheet?.iso}
          onSave={saveItem}
          onClose={() => { setAddSheet(false); setEditItem(null); }}
        />
      )}

      {confirmDeleteItem && (
        <div onClick={() => setConfirmDeleteItem(null)}
          style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.38)", zIndex:120,
            display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:"100%", maxWidth:480, background:"var(--surface)",
              borderRadius:"var(--r-lg) var(--r-lg) 0 0",
              padding:"24px 20px max(32px,env(safe-area-inset-bottom))" }}>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>Delete visit</div>
            <div style={{ fontSize:13.5, color:"var(--ink-2)", marginBottom:20 }}>
              {confirmDeleteItem.name} · {confirmDeleteItem.date} · {confirmDeleteItem.time}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={confirmDeleteSingle}
                style={{ padding:"14px 18px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--danger)",
                  background:"var(--danger-bg)", color:"var(--danger)", fontSize:15, fontWeight:700,
                  fontFamily:"var(--sans)", cursor:"pointer", textAlign:"left" }}>
                Delete this visit only
              </button>
              <button onClick={confirmDeleteUpcoming}
                style={{ padding:"14px 18px", borderRadius:"var(--r-sm)", border:"none",
                  background:"var(--danger)", color:"#fff", fontSize:15, fontWeight:700,
                  fontFamily:"var(--sans)", cursor:"pointer", textAlign:"left" }}>
                Delete all upcoming from this event
              </button>
              <button onClick={() => setConfirmDeleteItem(null)}
                style={{ padding:"12px", borderRadius:"var(--r-sm)", border:"none",
                  background:"var(--bg-2)", color:"var(--ink-2)", fontSize:14.5, fontWeight:700,
                  fontFamily:"var(--sans)", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Bottom sheet listing visits for a tapped calendar day, with edit/delete + add-new
function DaySheet({ day, items, isAdmin, onClose, onAdd, onEdit, onDelete, onViewItems }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px max(28px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:14, maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800 }}>{day.w}, {day.label}</div>
            <div style={{ fontSize:12.5, color:"var(--ink-3)", fontWeight:600, marginTop:1 }}>
              {items.length} visit{items.length===1?"":"s"} scheduled
            </div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {items.length === 0 && (
          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ink-3)", fontSize:13.5 }}>
            No visits scheduled for this day.
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {items.map(s => (
            <div key={s.id} className="card" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>
              <div style={{ width:48, flexShrink:0, textAlign:"center" }}>
                <div className="tnum" style={{ fontSize:14, fontWeight:800 }}>{s.time.split(" ")[0]}</div>
                <div style={{ fontSize:10.5, fontWeight:700, color:"var(--ink-3)" }}>{s.time.split(" ")[1]}</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14.5 }}>{s.name}</div>
                <div style={{ fontSize:12.5, color:"var(--ink-2)", marginTop:1 }}>{s.prop}</div>
              </div>
              {isAdmin && (
                <div style={{ display:"flex", gap:4 }}>
                  <button onClick={() => onEdit(s)}
                    style={{ width:32, height:32, borderRadius:9, border:"none", background:"var(--info-bg)",
                      color:"var(--info)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name="edit" size={15} />
                  </button>
                  <button onClick={() => { onClose(); onDelete(s); }}
                    style={{ width:32, height:32, borderRadius:9, border:"none", background:"var(--danger-bg)",
                      color:"var(--danger)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <button onClick={onViewItems}
            style={{ padding:"13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
              background:"var(--bg)", color:"var(--ink)", fontSize:14.5, fontWeight:700,
              fontFamily:"var(--sans)", cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", gap:8 }}>
            <Icon name="list" size={17} color="var(--ink-2)" /> View scheduled items
          </button>
        )}

        {isAdmin && (
          <button onClick={onAdd}
            style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--pine)", color:"#fff", fontSize:15, fontWeight:800,
              fontFamily:"var(--sans)", cursor:"pointer", display:"flex", alignItems:"center",
              justifyContent:"center", gap:8 }}>
            <Icon name="plus" size={18} color="#fff" /> Add visit on {day.label}
          </button>
        )}
      </div>
    </div>
  );
}

// Existing schedule data stores date as a short label ("May 15") and time as a
// 12-hour string ("9:00 AM") for display — convert to/from native input formats.
function to24Hour(t12) {
  const m = (t12 || "").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return "09:00";
  let [, h, min, ap] = m;
  h = parseInt(h, 10);
  if (/pm/i.test(ap) && h !== 12) h += 12;
  if (/am/i.test(ap) && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${min}`;
}
function to12Hour(t24) {
  if (!t24) return "";
  const [h, min] = t24.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2,"0")} ${ap}`;
}
function dateLabelToISO(label) {
  if (!label) return "";
  const d = new Date(`${label} ${new Date().getFullYear()}`);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0,10);
}

// Returns the next recurrence ISO date based on visit type name, or null if no pattern matches.
// If the result lands on Sat (6) or Sun (0), advances to the following Monday.
function nextRecurringISO(currentIso, typeName) {
  const t = (typeName || "").toLowerCase();
  let days = null;
  if (/year|annual/i.test(t))      days = 365;
  else if (/monthly|month/i.test(t)) days = 28;
  else if (/bi.?week/i.test(t))    days = 14;
  else if (/weekly|week/i.test(t)) days = 7;
  if (!days || !currentIso) return null;
  const d = new Date(currentIso + "T00:00:00");
  d.setDate(d.getDate() + days);
  // Advance to Monday if weekend
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat → Mon
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  return d.toISOString().slice(0, 10);
}
function isoToDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

function ScheduleSheet({ item, defaultDate, defaultProp, defaultType, onSave, onClose }) {
  const [fsProps, setFsProps] = useState([]);
  useEffect(() => {
    FBUTIL.listProperties().then(list => {
      setFsProps(list.map(p => p.name));
      if (!item?.prop && !defaultProp && list.length > 0) setProp(p => p || list[0].name);
    });
  }, []);
  const PROPS = fsProps;
  const [prop,   setProp]   = useState(item?.prop   || defaultProp || "");
  const [type,   setType]   = useState(item?.type   || defaultType || "Weekly inspection");
  const todayStr = new Date().toISOString().slice(0, 10);
  const initDate = dateLabelToISO(item?.date) || defaultDate || "";
  const [date,   setDate]   = useState(initDate >= todayStr ? initDate : (item ? initDate : todayStr));
  const [time,   setTime]   = useState(to24Hour(item?.time));
  const [assign, setAssign] = useState(item?.assignee || "");
  const isEdit = !!item;

  const save = () => {
    if (!date || !prop || !type.trim()) return;
    onSave({ prop, type: type.trim(), name: type.trim(),
      date: isoToDateLabel(date), dateIso: date,   // keep raw ISO for recurrence math
      time: to12Hour(time), assignee: assign,
      desc: `${type.trim()} — ${prop}`,
      icon: type.toLowerCase().includes("storm") ? "ti-storm" : "ti-home" });
  };

  const TYPES = ["Weekly inspection", "Bi-weekly inspection", "Monthly inspection", "Storm Prep", "Post-Storm Check", "Move-in check", "Move-out check"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px",
        display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{isEdit ? "Edit visit" : "Add visit"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Property</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {PROPS.map(p => (
              <button key={p} onClick={() => setProp(p)}
                style={{ padding:"7px 13px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:12.5, fontWeight:700, fontFamily:"var(--sans)",
                  background: prop===p ? "var(--pine)" : "var(--bg-2)",
                  color: prop===p ? "#fff" : "var(--ink-2)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Visit type</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:10 }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ padding:"7px 13px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:12.5, fontWeight:700, fontFamily:"var(--sans)",
                  background: type===t ? "var(--pine)" : "var(--bg-2)",
                  color: type===t ? "#fff" : "var(--ink-2)" }}>
                {t}
              </button>
            ))}
          </div>
          <input type="text" value={type} placeholder="Or type a custom visit name…"
            onChange={e => setType(e.target.value)}
            style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
              border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
              background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:5 }}>
            This becomes the visit's title on the schedule.
          </div>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Date</div>
            <input type="date" value={date} min={todayStr}
              onChange={e => setDate(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Time</div>
            <input type="time" value={time}
              onChange={e => setTime(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Assigned to (optional)</div>
          <input type="text" value={assign} placeholder="Inspector name"
            onChange={e => setAssign(e.target.value)}
            style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
              border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
              background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
        </div>

        <button onClick={save} disabled={!date || !prop || !type.trim()}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            background: date && prop && type.trim() ? "var(--pine)" : "var(--bg-2)",
            color: date && prop && type.trim() ? "#fff" : "var(--ink-3)",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor: date && prop && type.trim() ? "pointer" : "default" }}>
          {isEdit ? "Save changes" : "Add visit"}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, Properties, PropertyCard, Schedule, ScheduleRow, ScheduleSheet, AlertRow });
