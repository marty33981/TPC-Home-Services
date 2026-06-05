// ─────────────────────────────────────────────────────────────
// TPC Home Services — property detail + live inspection
// ─────────────────────────────────────────────────────────────

// ── PROPERTY DETAIL ──────────────────────────────────────────
function PropertyDetail({ id, nav, user }) {
  const p = HW.properties.find(x => x.id === id) || HW.properties[0];
  const [reveal, setReveal] = useState(false);
  const next = HW.schedule.find(s => s.prop === p.name);
  const role = (user || AUTH.currentUser || {}).role || "operator";
  const canSeeAccess = role === "administrator" || role === "operator";

  return (
    <div className="hw-scroll" style={{ background:"var(--bg)" }}>
      <DrillHeader onBack={nav.back}
        right={<button onClick={()=>{}} style={{ width:38, height:38, borderRadius:999, border:"none", background:"var(--surface)", color:"var(--ink-2)", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><Icon name="dots" size={20} /></button>} />

      {/* gradient hero card */}
      <div style={{ margin:"2px 20px 0", borderRadius:"var(--r-lg)", background:p.grad, color:"#fff", padding:"18px 20px 20px", position:"relative", overflow:"hidden", boxShadow:"var(--shadow)" }}>
        <Icon name="home" size={190} style={{ position:"absolute", right:-44, top:-10, opacity:0.1 }} color="#fff" />
        <div style={{ position:"relative" }}>
          <StatusPill status={p.status} dot={false} />
          <h1 style={{ margin:"12px 0 0", fontSize:26, fontWeight:800, letterSpacing:-0.5, lineHeight:1.06 }}>{p.name}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:8, opacity:0.92, fontSize:13.5 }}>
            <Icon name="map-pin" size={15} /><span>{p.address}</span>
          </div>
          <div style={{ display:"flex", gap:22, marginTop:16, paddingTop:15, borderTop:"1px solid rgba(255,255,255,0.18)" }}>
            <HeroMeta k="Type" v={p.type} />
            <HeroMeta k="Frequency" v={p.freq} />
            <HeroMeta k="Last visit" v={p.last} />
          </div>
        </div>
      </div>

      {/* body */}
      <div style={{ background:"var(--bg)", padding:"16px 20px 8px", position:"relative" }}>
        {/* active alert */}
        {p.alert && (
          <div className="rise" style={{ background:"var(--danger-bg)", border:"1px solid rgba(178,58,46,0.18)", borderRadius:"var(--r)", padding:"15px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, color:"var(--danger)", fontWeight:800, fontSize:14.5 }}>
              <Icon name="alert-triangle-filled" size={19} /> Active alert
            </div>
            <p style={{ margin:"9px 0 13px", fontSize:13.5, color:"#7d3127", lineHeight:1.5 }}>{p.alert}</p>
            <div style={{ display:"flex", gap:9 }}>
              <button className="btn btn-primary" style={{ flex:1, background:"var(--danger)", padding:"11px", fontSize:14 }}><Icon name="clipboard-plus" size={17} color="#fff" /> Log issue</button>
              <button className="btn btn-light" style={{ flex:1, padding:"11px", fontSize:14 }} onClick={()=>nav.go("vendors")}><Icon name="tool" size={17} /> Call vendor</button>
            </div>
          </div>
        )}

        {/* primary CTA */}
        <button className="btn btn-primary btn-block" onClick={() => nav.push("inspection", { schedId: next ? next.id : 1 })} style={{ padding:"16px", fontSize:16.5, boxShadow:"0 8px 22px rgba(27,67,50,0.26)" }}>
          <Icon name="circle-check" size={21} color="#fff" /> Start inspection
        </button>
        <div style={{ display:"flex", gap:10, marginTop:10 }}>
          <button className="btn btn-light" style={{ flex:1, padding:"12px" }}><Icon name="phone" size={18} /> Call owner</button>
          <button className="btn btn-light" style={{ flex:1, padding:"12px" }}><Icon name="navigation" size={18} /> Directions</button>
        </div>

        {/* owner card — operators and admins only */}
        {canSeeAccess && (
          <Card title="Owner" icon="user-circle">
            <Row k={p.owner.name} v={`Home base · ${p.owner.base}`} stacked />
            <Hr />
            <ActionRow icon="phone" label={p.owner.phone} action="Call" tone="var(--pine-2)" />
            <Hr />
            <ActionRow icon="mail" label={p.owner.email} action="Email" tone="var(--pine-2)" />
          </Card>
        )}

        {/* access & codes — operators and admins only */}
        {canSeeAccess && (
          <AccessCard prop={p} reveal={reveal} setReveal={setReveal} role={role} />
        )}

        {/* service / next visit */}
        <Card title="Service plan" icon="calendar-repeat">
          <Row k="Plan" v={`${p.freq} watch`} />
          <Hr />
          <Row k="Next visit" v={next ? `${next.date} · ${next.time}` : "Not scheduled"} />
          <Hr />
          <div style={{ padding:"13px 0 4px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13.5, marginBottom:8 }}>
              <span style={{ fontWeight:600, color:"var(--ink-2)" }}>Last inspection</span>
              <span style={{ fontWeight:800 }}>14 / 18 complete</span>
            </div>
            <div className="bar"><span style={{ width:"78%" }} /></div>
          </div>
        </Card>

        {/* history */}
        <Card title="Recent activity" icon="history">
          <div style={{ position:"relative", paddingLeft:4 }}>
            {HW.history.map((h,i) => <TimelineItem key={i} h={h} last={i===HW.history.length-1} />)}
          </div>
        </Card>

        {/* photos */}
        <SectionTitle action="View all" style={{ padding:0, margin:"22px 0 11px" }}>Latest photos</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9 }}>
          {HW.photos.map((ph,i) => <PhotoSlot key={i} ph={ph} />)}
        </div>
        <div style={{ height:14 }} />
      </div>
    </div>
  );
}

function HeroMeta({ k, v }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.06, textTransform:"uppercase", opacity:0.75 }}>{k}</div>
      <div style={{ fontSize:15, fontWeight:800, marginTop:3 }}>{v}</div>
    </div>
  );
}

function Card({ title, icon, right, children }) {
  return (
    <div className="card rise" style={{ padding:"15px 16px", marginTop:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {icon && <Icon name={icon} size={18} color="var(--mint)" />}
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, letterSpacing:-0.2 }}>{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, stacked }) {
  if (stacked) return (
    <div style={{ padding:"4px 0 8px" }}>
      <div style={{ fontWeight:800, fontSize:15.5 }}>{k}</div>
      <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2 }}>{v}</div>
    </div>
  );
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", fontSize:14.5 }}>
      <span style={{ color:"var(--ink-2)", fontWeight:600 }}>{k}</span>
      <span style={{ fontWeight:700 }}>{v}</span>
    </div>
  );
}

function ActionRow({ icon, label, action, tone }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 0" }}>
      <Icon name={icon} size={18} color="var(--ink-3)" />
      <span style={{ flex:1, fontSize:14.5, fontWeight:600 }}>{label}</span>
      <span style={{ color:tone, fontWeight:800, fontSize:13.5 }}>{action}</span>
    </div>
  );
}

function CodeBox({ label, code, reveal }) {
  return (
    <div style={{ flex:1, background:"var(--surface-2)", borderRadius:12, padding:"11px 13px", border:"1px solid var(--line)" }}>
      <div className="eyebrow" style={{ fontSize:10.5 }}>{label}</div>
      <div className="tnum" style={{ fontSize:21, fontWeight:800, letterSpacing:reveal?2:3, marginTop:4, fontFamily:"var(--sans)" }}>
        {reveal ? code : "••••"}
      </div>
    </div>
  );
}

function TimelineItem({ h, last }) {
  const c = { danger:"var(--danger)", warn:"var(--warn)", "":"var(--mint)" }[h.dot] || "var(--mint)";
  return (
    <div style={{ display:"flex", gap:13, paddingBottom:last?0:16 }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:3 }}>
        <div style={{ width:11, height:11, borderRadius:999, background:c, boxShadow:`0 0 0 3px ${c}22`, flexShrink:0 }} />
        {!last && <div style={{ width:2, flex:1, background:"var(--line)", marginTop:4 }} />}
      </div>
      <div style={{ flex:1, paddingBottom:2 }}>
        <div style={{ fontWeight:700, fontSize:14.5 }}>{h.title}</div>
        <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2, lineHeight:1.45 }}>{h.desc}</div>
        <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:4, fontWeight:600 }}>{h.time}</div>
      </div>
    </div>
  );
}

function PhotoSlot({ ph }) {
  return (
    <div style={{ aspectRatio:"1", borderRadius:14, background:"var(--bg-2)", border:"1px dashed var(--line)", position:"relative", overflow:"hidden",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6,
      backgroundImage:"repeating-linear-gradient(135deg, transparent, transparent 9px, rgba(27,38,32,0.025) 9px, rgba(27,38,32,0.025) 18px)" }}>
      <Icon name={ph.icon.replace("ti-","")} size={24} color="var(--ink-3)" />
      <span style={{ fontSize:10, fontWeight:700, color:"var(--ink-3)", fontFamily:"ui-monospace, monospace", textAlign:"center", padding:"0 4px" }}>{ph.tag}</span>
    </div>
  );
}

// Access card — operators see codes read-only; homeowners can update codes
function AccessCard({ prop: p, reveal, setReveal, role }) {
  const [editing, setEditing] = useState(false);
  const [lockbox, setLockbox] = useState(p.access.lockbox);
  const [alarm,   setAlarm]   = useState(p.access.alarm);
  const [notes,   setNotesTxt]= useState(p.access.notes);
  const isHomeowner = role === "homeowner";

  const save = () => {
    p.access.lockbox = lockbox;
    p.access.alarm   = alarm;
    p.access.notes   = notes;
    setEditing(false);
  };

  if (editing) {
    return (
      <Card title="Access & codes" icon="key">
        {[
          { label:"Lockbox code", val:lockbox, set:setLockbox },
          { label:"Alarm code",   val:alarm,   set:setAlarm   },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:11 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
            <input value={f.val} onChange={e=>f.set(e.target.value)}
              style={{ width:"100%", padding:"10px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                outline:"none", boxSizing:"border-box", fontVariantNumeric:"tabular-nums" }} />
          </div>
        ))}
        <div style={{ marginBottom:13 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Access notes</div>
          <textarea value={notes} onChange={e=>setNotesTxt(e.target.value)}
            style={{ width:"100%", minHeight:72, padding:"10px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
              fontSize:14, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
              outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.5 }} />
        </div>
        <div style={{ display:"flex", gap:9 }}>
          <button onClick={save} style={{ flex:2, padding:"12px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--pine)", color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>Save</button>
          <button onClick={()=>setEditing(false)} style={{ flex:1, padding:"12px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--bg-2)", color:"var(--ink-2)", fontSize:15, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer" }}>Cancel</button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Access & codes" icon="key" right={
      <div style={{ display:"flex", gap:8 }}>
        {isHomeowner && (
          <button onClick={()=>setEditing(true)}
            style={{ border:"none", background:"var(--mint-bg)", color:"var(--pine)", fontFamily:"var(--sans)", fontWeight:700, fontSize:12.5, padding:"6px 11px", borderRadius:999, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="edit" size={14} /> Update
          </button>
        )}
        <button onClick={()=>setReveal(r=>!r)} style={{ border:"none", background:"var(--bg-2)", color:"var(--ink-2)", fontFamily:"var(--sans)", fontWeight:700, fontSize:12.5, padding:"6px 11px", borderRadius:999, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
          <Icon name={reveal?"eye-off":"eye"} size={15} /> {reveal?"Hide":"Reveal"}
        </button>
      </div>}>
      <div style={{ display:"flex", gap:11, marginBottom:13 }}>
        <CodeBox label="Lockbox" code={p.access.lockbox} reveal={reveal} />
        <CodeBox label="Alarm"   code={p.access.alarm}   reveal={reveal} />
      </div>
      <div style={{ background:"var(--surface-2)", borderRadius:12, padding:"11px 13px", fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>
        <span style={{ fontWeight:700, color:"var(--ink)" }}>Notes · </span>{p.access.notes}
      </div>
    </Card>
  );
}

Object.assign(window, { PropertyDetail, Card, Row, ActionRow, TimelineItem, PhotoSlot, CodeBox, AccessCard });
