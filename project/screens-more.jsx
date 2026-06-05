// ─────────────────────────────────────────────────────────────
// TPC Home Services — inspection, alerts, vendors, more
// ─────────────────────────────────────────────────────────────

// ── LIVE INSPECTION ──────────────────────────────────────────
function Inspection({ schedId, nav, user }) {
  const item = HW.schedule.find(s => s.id === schedId) || HW.schedule[0];
  const prop = HW.properties.find(p => p.name === item.prop) || HW.properties[0];
  const [checked, setChecked] = useState({});
  const [flagged, setFlagged] = useState({});
  const [notes,   setNotes]   = useState("");
  const [done, setDone] = useState(false);
  const role = (user || AUTH.currentUser || {}).role || "operator";

  const total = HW.checklist.length;
  const count = Object.values(checked).filter(Boolean).length;
  const pct = Math.round((count/total)*100);

  // group by category
  const groups = {};
  HW.checklist.forEach(c => { (groups[c.cat] = groups[c.cat] || []).push(c); });

  const toggle = id => setChecked(c => ({ ...c, [id]: !c[id] }));
  const flag = (id, e) => { e.stopPropagation(); setFlagged(f => ({ ...f, [id]: !f[id] })); };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div style={{ background:"var(--surface)", boxShadow:"var(--shadow-sm)", paddingBottom:14, position:"relative", zIndex:5 }}>
        <DrillHeader onBack={nav.back} title={prop.name} sub={item.name}
          right={<Ring pct={pct} />} />
        <div style={{ padding:"2px 20px 0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:7 }}>
            <span style={{ fontSize:13.5, fontWeight:700, color:"var(--ink-2)" }}>
              <span className="tnum" style={{ color:"var(--ink)", fontSize:15 }}>{count}</span> of {total} checks done
            </span>
            {Object.values(flagged).some(Boolean) &&
              <span className="pill pill-danger" style={{ fontSize:11 }}><span className="dot" />{Object.values(flagged).filter(Boolean).length} flagged</span>}
          </div>
          <div className="bar"><span style={{ width:`${pct}%` }} /></div>
        </div>
      </div>

      <div className="hw-scroll" style={{ padding:"6px 20px 120px" }}>
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} style={{ marginTop:18 }}>
            <div className="eyebrow" style={{ marginBottom:9, paddingLeft:2 }}>{cat}</div>
            <div className="card" style={{ overflow:"hidden" }}>
              {items.map((it, i) => (
                <CheckRow key={it.id} item={it} on={!!checked[it.id]} flag={!!flagged[it.id]}
                  onToggle={()=>toggle(it.id)} onFlag={(e)=>flag(it.id,e)} last={i===items.length-1} />
              ))}
            </div>
          </div>
        ))}

        <div className="eyebrow" style={{ margin:"22px 0 9px", paddingLeft:2 }}>Inspection photos</div>
        <div className="hscroll">
          <button className="tap" style={{ flexShrink:0, width:84, height:84, borderRadius:16, border:"1.5px dashed var(--mint)", background:"var(--mint-bg)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer", color:"var(--pine)" }}>
            <Icon name="camera-plus" size={24} color="var(--pine)" />
            <span style={{ fontSize:11, fontWeight:700 }}>Add</span>
          </button>
          {HW.photos.map((ph,i) => (
            <div key={i} style={{ flexShrink:0, width:84, height:84, borderRadius:16, background:"var(--bg-2)", display:"flex", alignItems:"center", justifyContent:"center",
              backgroundImage:"repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(27,38,32,0.03) 8px, rgba(27,38,32,0.03) 16px)" }}>
              <Icon name={ph.icon.replace("ti-","")} size={22} color="var(--ink-3)" />
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{ margin:"22px 0 9px", paddingLeft:2 }}>Visit notes</div>
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)}
            placeholder="Enter notes for this visit…"
            style={{ width:"100%", minHeight:90, padding:"13px 15px", fontSize:14, color:"var(--ink)",
              background:"transparent", border:"none", outline:"none", resize:"vertical",
              fontFamily:"var(--sans)", lineHeight:1.6, boxSizing:"border-box" }} />
        </div>
      </div>

      <div style={{ position:"absolute", left:0, right:0, bottom:0, padding:"14px 20px 30px",
        background:"linear-gradient(to top, var(--bg) 70%, transparent)", zIndex:6 }}>
        <button className="btn btn-primary btn-block" onClick={()=>setDone(true)}
          style={{ padding:"17px", fontSize:16.5, boxShadow:"0 10px 26px rgba(27,67,50,0.3)" }}>
          {count===total ? <><Icon name="circle-check-filled" size={21} color="#fff" /> Complete inspection</> : `Finish inspection · ${count}/${total}`}
        </button>
      </div>

      {done && <CompleteSheet item={item} prop={prop} count={count} total={total} flagged={Object.values(flagged).filter(Boolean).length} notes={notes} nav={nav} />}
    </div>
  );
}

function CheckRow({ item, on, flag, onToggle, onFlag, last }) {
  return (
    <div onClick={onToggle} className="tap" style={{ display:"flex", alignItems:"center", gap:13, padding:"14px 15px", cursor:"pointer",
      borderBottom: last ? "none" : "1px solid var(--line)", background: on ? "var(--surface-2)" : "transparent", transition:"background .2s" }}>
      <Checkbox on={on} />
      <span style={{ flex:1, fontSize:14.5, fontWeight:600, color: on ? "var(--ink-3)" : "var(--ink)", textDecoration: on ? "line-through" : "none", transition:"color .2s" }}>{item.label}</span>
      <button onClick={onFlag} aria-label="Flag issue" style={{ border:"none", background:"transparent", cursor:"pointer", padding:4, display:"flex", flexShrink:0 }}>
        <Icon name={flag ? "flag-filled" : "flag"} size={18} color={flag ? "var(--danger)" : "var(--ink-3)"} />
      </button>
    </div>
  );
}

function Checkbox({ on }) {
  return (
    <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, position:"relative",
      background: on ? "var(--mint)" : "transparent", border: on ? "2px solid var(--mint)" : "2px solid var(--line)", transition:"all .2s" }}>
      <svg width="26" height="26" viewBox="0 0 26 26" style={{ position:"absolute", inset:-2 }}>
        <path d="M7 13.5l3.8 3.8L19 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="22" style={{ strokeDashoffset: on ? 0 : 22, transition:"stroke-dashoffset .3s ease .05s" }} />
      </svg>
    </div>
  );
}

function Ring({ pct }) {
  const r = 16, c = 2*Math.PI*r;
  return (
    <div style={{ width:42, height:42, position:"relative", flexShrink:0 }}>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="4" />
        <circle cx="21" cy="21" r={r} fill="none" stroke="var(--mint)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} transform="rotate(-90 21 21)" style={{ transition:"stroke-dashoffset .5s ease" }} />
      </svg>
      <span className="tnum" style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11.5, fontWeight:800 }}>{pct}%</span>
    </div>
  );
}

function CompleteSheet({ item, prop, count, total, flagged, notes, nav }) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", flexDirection:"column", justifyContent:"flex-end",
      background:"rgba(20,28,23,0.5)", backdropFilter:"blur(3px)", animation:"hw-fade-in .25s ease both" }} onClick={nav.back}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"var(--surface)", borderRadius:"28px 28px 0 0", padding:"10px 24px 36px", animation:"hw-slide-up .35s cubic-bezier(.22,.61,.36,1) both" }}>
        <div style={{ width:40, height:5, borderRadius:999, background:"var(--line)", margin:"0 auto 22px" }} />
        <div style={{ width:68, height:68, borderRadius:999, background:"var(--mint-bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"hw-pop .4s cubic-bezier(.22,1.3,.5,1) both" }}>
          <Icon name="circle-check-filled" size={42} color="var(--mint)" />
        </div>
        <h2 className="serif" style={{ textAlign:"center", margin:"18px 0 6px", fontSize:25, fontWeight:500 }}>Inspection complete</h2>
        <p style={{ textAlign:"center", margin:0, color:"var(--ink-2)", fontSize:14.5 }}>{item.name} · {prop.name}</p>
        <div style={{ display:"flex", gap:11, margin:"22px 0 24px" }}>
          <SummaryStat v={`${count}/${total}`} l="Checks done" />
          <SummaryStat v={flagged} l="Issues flagged" tone={flagged?"var(--danger)":"var(--ink)"} />
          <SummaryStat v={HW.photos.length} l="Photos" />
        </div>
        <button className="btn btn-primary btn-block" onClick={nav.back} style={{ padding:"16px", fontSize:16 }}>
          <Icon name="send" size={18} color="#fff" /> Send report to administrator
        </button>
        {notes ? <div style={{ margin:"12px 0 0", background:"var(--surface-2)", borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13, color:"var(--ink-2)", lineHeight:1.5 }}><span style={{ fontWeight:700, color:"var(--ink)" }}>Notes: </span>{notes}</div> : null}
        <button className="btn btn-ghost btn-block" onClick={nav.back} style={{ padding:"12px", marginTop:6, fontSize:15 }}>Back to dashboard</button>
      </div>
    </div>
  );
}
function SummaryStat({ v, l, tone="var(--ink)" }) {
  return (
    <div style={{ flex:1, background:"var(--surface-2)", borderRadius:14, padding:"13px 8px", textAlign:"center", border:"1px solid var(--line)" }}>
      <div className="tnum" style={{ fontSize:22, fontWeight:800, color:tone, letterSpacing:-0.5 }}>{v}</div>
      <div style={{ fontSize:11.5, color:"var(--ink-2)", fontWeight:600, marginTop:2 }}>{l}</div>
    </div>
  );
}

// ── ALERTS ───────────────────────────────────────────────────
function Alerts({ nav }) {
  const [f, setF] = useState("All");
  const filters = [["All",null],["Critical","danger"],["Warnings","warn"],["Info","info"]];
  const list = HW.alerts.filter(a => f==="All" || a.type === filters.find(x=>x[0]===f)[1]);
  const tones = { danger:["var(--danger)","var(--danger-bg)"], warn:["var(--warn)","var(--warn-bg)"], info:["var(--info)","var(--info-bg)"] };
  return (
    <div className="hw-scroll">
      <AppHeader title="Alerts" sub={`${HW.alerts.length} open`} />
      <div className="hscroll" style={{ padding:"2px 20px 6px" }}>
        {filters.map(([label]) => (
          <button key={label} onClick={()=>setF(label)} style={{ flexShrink:0, border:"none", cursor:"pointer", whiteSpace:"nowrap", padding:"8px 15px", borderRadius:999,
            fontSize:13.5, fontWeight:700, fontFamily:"var(--sans)", background: f===label?"var(--pine)":"var(--surface)", color: f===label?"var(--on-pine)":"var(--ink-2)", boxShadow: f===label?"none":"var(--shadow-sm)" }}>{label}</button>
        ))}
      </div>
      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:13 }}>
        {list.map((a,i) => {
          const tone = tones[a.type];
          const pid = (HW.properties.find(p=>p.name===a.prop)||{}).id;
          return (
            <div key={a.id} className="card rise" style={{ padding:"16px", borderLeft:`4px solid ${tone[0]}`, animationDelay:`${0.05*i}s` }}>
              <div style={{ display:"flex", gap:13 }}>
                <IconTile icon={a.icon.replace("ti-","")} bg={tone[1]} color={tone[0]} size={44} r={12} iconSize={22} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"baseline" }}>
                    <span style={{ fontWeight:800, fontSize:16, letterSpacing:-0.2 }}>{a.title}</span>
                    <span style={{ fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap", fontWeight:600 }}>{a.time}</span>
                  </div>
                  <p style={{ margin:"5px 0 0", fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>{a.desc}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:13 }}>
                <span className="pill pill-muted"><Icon name="home" size={13} /> {a.prop}</span>
                <div style={{ flex:1 }} />
                <button onClick={()=>pid&&nav.push("property",{id:pid})} style={{ border:"none", background:"var(--bg-2)", color:"var(--pine-2)", fontFamily:"var(--sans)", fontWeight:800, fontSize:13, padding:"8px 14px", borderRadius:999, cursor:"pointer", whiteSpace:"nowrap" }}>View property</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VENDORS ──────────────────────────────────────────────────
function Vendors({ nav }) {
  const isAdmin = AUTH.isAdmin();
  const [vendors, setVendors]       = useState([...HW.vendors]);
  const [editing, setEditing]       = useState(null);
  const [draft,   setDraft]         = useState({});
  const [confirmDeleteV, setConfirmDeleteV] = useState(null);

  const saveDraft = () => {
    if (!draft.name || !draft.cat) return;
    if (editing === "new") {
      const v = { id: Date.now(), avail:"available", rating:5.0, icon:"ti-tool", color:"var(--info)", bg:"var(--info-bg)", ...draft };
      HW.vendors.push(v);
    } else {
      const i = HW.vendors.findIndex(x => x.id === editing.id);
      if (i >= 0) HW.vendors[i] = { ...HW.vendors[i], ...draft };
    }
    setVendors([...HW.vendors]);
    setEditing(null);
  };

  const delVendor = (id) => setConfirmDeleteV(id);
  const doDelVendor = (id) => {
    const i = HW.vendors.findIndex(x => x.id === id);
    if (i >= 0) HW.vendors.splice(i, 1);
    setVendors([...HW.vendors]);
    setConfirmDeleteV(null);
  };

  return (
    <div className="hw-scroll">
      <AppHeader title="Vendors" sub="Trusted partners"
        right={isAdmin && (
          <button onClick={()=>{ setDraft({ name:"", cat:"", phone:"" }); setEditing("new"); }}
            style={{ width:34, height:34, borderRadius:999, border:"none", background:"var(--pine)", color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginRight:8 }}>
            <Icon name="plus" size={18} color="#fff" />
          </button>
        )} />
      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:12 }}>
        {vendors.map((v,i) => (
          <div key={v.id} className="card rise" style={{ padding:"15px 16px", display:"flex", alignItems:"center", gap:14, animationDelay:`${0.05*i}s` }}>
            <IconTile icon={v.icon.replace("ti-","")} bg={v.bg} color={v.color} size={48} r={14} iconSize={24} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:16, letterSpacing:-0.2 }}>{v.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginTop:4 }}>
                <span style={{ fontSize:12.5, color:"var(--ink-2)", fontWeight:600 }}>{v.cat}</span>
                <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12.5, fontWeight:700 }}><Icon name="star-filled" size={13} color="#E0A93C" /> {v.rating}</span>
                <StatusPill status={v.avail} dot={true} />
              </div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {isAdmin && (
                <button onClick={()=>{ setDraft({ name:v.name, cat:v.cat, phone:v.phone, rating:v.rating, avail:v.avail }); setEditing(v); }}
                  style={{ width:36, height:36, borderRadius:10, border:"none", background:"var(--info-bg)", color:"var(--info)",
                    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Icon name="edit" size={17} />
                </button>
              )}
              {isAdmin && (
                <button onClick={()=>setConfirmDeleteV(v.id)}
                  style={{ width:36, height:36, borderRadius:10, border:"none", background:"var(--danger-bg)", color:"var(--danger)",
                    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Icon name="trash" size={17} />
                </button>
              )}
              <button aria-label="Call" style={{ width:44, height:44, borderRadius:999, border:"none", background:"var(--mint-bg)", color:"var(--pine)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                <Icon name="phone" size={21} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteV && (
        <ConfirmSheet
          message={`Remove ${(HW.vendors.find(x=>x.id===confirmDeleteV)||{}).name || "this vendor"}?`}
          onConfirm={()=>doDelVendor(confirmDeleteV)}
          onCancel={()=>setConfirmDeleteV(null)}
        />
      )}

      {editing !== null && (
        <div style={{ position:"absolute", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99, display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px", display:"flex", flexDirection:"column", gap:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>{editing==="new" ? "Add vendor" : "Edit vendor"}</div>
              <button onClick={()=>setEditing(null)} style={{ border:"none", background:"none", cursor:"pointer" }}><Icon name="x" size={22} color="var(--ink-2)" /></button>
            </div>
            {[
              { label:"Company name", key:"name", ph:"AquaFix Plumbing" },
              { label:"Category", key:"cat", ph:"Plumbing" },
              { label:"Phone", key:"phone", ph:"(239) 555-0000" },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
                <input value={draft[f.key]||""} placeholder={f.ph} onChange={e=>setDraft(d=>({...d,[f.key]:e.target.value}))}
                  style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                    fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
            <div style={{ display:"flex", gap:9 }}>
              {["available","busy"].map(s => (
                <button key={s} onClick={()=>setDraft(d=>({...d,avail:s}))}
                  style={{ flex:1, padding:"9px", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                    background: draft.avail===s ? "var(--pine)" : "var(--bg-2)",
                    color: draft.avail===s ? "#fff" : "var(--ink-2)" }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={saveDraft} style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>
              {editing==="new" ? "Add vendor" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MORE ─────────────────────────────────────────────────────
function More({ nav, user, onLogout }) {
  const isAdmin = AUTH.isAdmin();
  const msgCount = AUTH.getAdminMessages().length;

  const links = [
    { icon:"tools",       label:"Vendors",       sub:"4 partners",           go:()=>nav.go("vendors") },
    { icon:"file-text",   label:"Reports",        sub:"Owner-ready summaries" },
    { icon:"bell",        label:"Notifications" },
    { icon:"settings",    label:"Settings" },
  ];

  const adminLinks = [
    { icon:"users",        label:"User Management",   sub:"Add or edit users",         go:()=>nav.push("adminUsers") },
    { icon:"clipboard-list",label:"Edit Checklist",   sub:"Inspection items",           go:()=>nav.push("adminChecklist") },
    { icon:"message-2",   label:"Homeowner Messages", sub: msgCount > 0 ? `${msgCount} message${msgCount>1?"s":""}` : "No new messages", go:()=>nav.push("adminInbox") },
  ];

  const u = user || AUTH.currentUser;

  return (
    <div className="hw-scroll">
      <AppHeader title="More" />

      <div className="card rise" style={{ margin:"2px 20px 0", padding:"16px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:999, background:"var(--pine)", color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18 }}>
          {u ? (u.initials || u.name.slice(0,2)).toUpperCase() : "MR"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:17 }}>{u ? u.name : HW.brand.operator}</div>
          <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
            {u && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999,
              background: u.role==="administrator" ? "var(--mint-bg)" : "var(--info-bg)",
              color: u.role==="administrator" ? "var(--pine)" : "var(--info)" }}>
              {u.role.charAt(0).toUpperCase()+u.role.slice(1)}
            </span>}
            {HW.brand.region}
          </div>
        </div>
      </div>

      <div className="card rise" style={{ margin:"16px 20px 0", overflow:"hidden", animationDelay:"0.05s" }}>
        {links.map((l,i) => (
          <button key={l.label} onClick={l.go} className="tap" style={{ width:"100%", border:"none", background:"transparent", cursor:"pointer",
            display:"flex", alignItems:"center", gap:13, padding:"14px 16px",
            borderBottom: i===links.length-1?"none":"1px solid var(--line)", textAlign:"left" }}>
            <IconTile icon={l.icon} bg="var(--bg-2)" color="var(--pine-2)" size={36} r={10} iconSize={19} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15 }}>{l.label}</div>
              {l.sub && <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>{l.sub}</div>}
            </div>
            <Icon name="chevron-right" size={18} color="var(--ink-3)" />
          </button>
        ))}
      </div>

      {isAdmin && (
        <>
          <div className="eyebrow" style={{ margin:"22px 20px 8px" }}>
            <Icon name="shield-check" size={13} color="var(--pine)" style={{ verticalAlign:-1, marginRight:5 }} />
            Administrator
          </div>
          <div className="card rise" style={{ margin:"0 20px", overflow:"hidden", animationDelay:"0.08s" }}>
            {adminLinks.map((l,i) => (
              <button key={l.label} onClick={l.go} className="tap" style={{ width:"100%", border:"none", background:"transparent", cursor:"pointer",
                display:"flex", alignItems:"center", gap:13, padding:"14px 16px",
                borderBottom: i===adminLinks.length-1?"none":"1px solid var(--line)", textAlign:"left" }}>
                <IconTile icon={l.icon} bg="var(--mint-bg)" color="var(--pine)" size={36} r={10} iconSize={19} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{l.label}</div>
                  {l.sub && <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>{l.sub}</div>}
                </div>
                <Icon name="chevron-right" size={18} color="var(--ink-3)" />
              </button>
            ))}
          </div>
        </>
      )}

      <button onClick={onLogout} className="btn btn-light btn-block"
        style={{ margin:"16px 20px 0", width:"calc(100% - 40px)", color:"var(--danger)", padding:"14px" }}>
        <Icon name="logout" size={18} color="var(--danger)" /> Sign out
      </button>
      <div style={{ textAlign:"center", padding:"18px 18px 8px", fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>
        TPC Home Services · v{HW.version.number}
        <div style={{ fontSize:11, fontWeight:500, marginTop:2, color:"var(--ink-3)" }}>Build {HW.version.build} · {HW.version.date}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Inspection, Alerts, Vendors, More });
