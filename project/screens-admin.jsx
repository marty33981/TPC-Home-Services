// ─────────────────────────────────────────────────────────────
// TPC Home Services — Administrator role management screens
// AdminHub · AdminSupervisors · AdminOperators · AdminHomeowners
// ─────────────────────────────────────────────────────────────

// NWS county codes for the TPC service area
const NWS_COUNTIES = "FLC015,FLC071,FLC115"; // Charlotte, Lee, Sarasota

// Severity display config
const NWS_SEV = {
  Extreme:  { color:"#C0392B", bg:"#FDEDEC", label:"Extreme"  },
  Severe:   { color:"#E74C3C", bg:"#FDEDEC", label:"Severe"   },
  Moderate: { color:"#E67E22", bg:"#FEF9E7", label:"Moderate" },
  Minor:    { color:"#F1C40F", bg:"#FEFDF0", label:"Minor"    },
  Unknown:  { color:"#7F8C8D", bg:"#F2F3F4", label:"Unknown"  },
};

function WeatherAlertSheet({ onClose }) {
  const [loading,  setLoading]  = React.useState(true);
  const [alerts,   setAlerts]   = React.useState([]);
  const [error,    setError]    = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [sending,  setSending]  = React.useState(false);
  const [sent,     setSent]     = React.useState(false);

  React.useEffect(() => {
    fetch(`https://api.weather.gov/alerts/active?zone=${NWS_COUNTIES}`, {
      headers: { "Accept": "application/geo+json", "User-Agent": "TPC-HomeWatch/2.3 (marty@truexpreferredconstruction.com)" }
    })
      .then(r => r.json())
      .then(data => {
        const items = (data.features || []).map(f => f.properties);
        setAlerts(items);
        if (items.length > 0) setSelected(items[0]);
        setLoading(false);
      })
      .catch(e => { setError("Could not reach weather service."); setLoading(false); });
  }, []);

  const sendToAll = async () => {
    if (!selected) return;
    setSending(true);
    const props = await FBUTIL.listProperties();
    const sender = AUTH.currentUser;
    const sevKey = selected.severity in NWS_SEV ? selected.severity : "Unknown";
    await Promise.all(props.map(p =>
      FBUTIL.createHomeownerAlert({
        propId:     p.id,
        propName:   p.name,
        severity:   sevKey === "Extreme" || sevKey === "Severe" ? "urgent" : "caution",
        title:      selected.headline || selected.event || "Severe Weather Alert",
        message:    selected.description
                      ? selected.description.slice(0, 600) + (selected.description.length > 600 ? "…" : "")
                      : selected.event,
        sentBy:     sender?.name || "Admin",
        sentByRole: sender?.role || "admin",
        source:     "NWS",
      })
    ));
    // Also send a push notification to all subscribed devices
    const pushHeading = "⚠️ " + (selected.event || "Severe Weather Alert");
    const pushBody    = (selected.headline || selected.description || selected.event || "").slice(0, 250);
    await window.PUSH?.send(pushHeading, pushBody);

    setSending(false);
    setSent(true);
  };

  const sev = selected ? (NWS_SEV[selected.severity] || NWS_SEV.Unknown) : null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.38)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480,
        background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"24px 20px max(36px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:14, maxHeight:"85vh", overflowY:"auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>Weather Alerts</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:-8 }}>
          Charlotte · Lee · Sarasota Counties · NWS
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-3)" }}>Checking weather…</div>
        )}

        {error && (
          <div style={{ padding:"16px", borderRadius:"var(--r-sm)", background:"var(--danger-bg)",
            color:"var(--danger)", fontSize:14, fontWeight:600 }}>{error}</div>
        )}

        {!loading && !error && alerts.length === 0 && (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <Icon name="circle-check" size={40} color="var(--ok)" />
            <div style={{ marginTop:12, fontWeight:700, fontSize:15 }}>No active alerts</div>
            <div style={{ color:"var(--ink-3)", fontSize:13.5, marginTop:4 }}>All clear for the service area.</div>
          </div>
        )}

        {!loading && alerts.length > 0 && !sent && (
          <>
            {alerts.length > 1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)" }}>
                  {alerts.length} active alert{alerts.length > 1 ? "s" : ""}
                </div>
                {alerts.map((a, i) => {
                  const s = NWS_SEV[a.severity] || NWS_SEV.Unknown;
                  return (
                    <button key={i} onClick={() => setSelected(a)}
                      style={{ padding:"10px 13px", borderRadius:"var(--r-sm)", border:"none", textAlign:"left",
                        background: selected === a ? s.bg : "var(--bg-2)",
                        outline: selected === a ? `2px solid ${s.color}` : "none",
                        cursor:"pointer", fontFamily:"var(--sans)" }}>
                      <div style={{ fontWeight:700, fontSize:13.5, color: s.color }}>{a.event}</div>
                      <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>{a.areaDesc}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {selected && (() => {
              const s = NWS_SEV[selected.severity] || NWS_SEV.Unknown;
              return (
                <div style={{ padding:"14px", borderRadius:"var(--r-sm)", background:s.bg, border:`1.5px solid ${s.color}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <Icon name="alert-triangle" size={18} color={s.color} />
                    <span style={{ fontWeight:800, fontSize:15, color:s.color }}>{selected.event}</span>
                    <span style={{ marginLeft:"auto", fontSize:11.5, fontWeight:700, color:s.color,
                      background:"white", padding:"2px 8px", borderRadius:999 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:6 }}>
                    {selected.headline}
                  </div>
                  <div style={{ fontSize:12.5, color:"var(--ink-2)", lineHeight:1.5, maxHeight:120, overflowY:"auto" }}>
                    {(selected.description || "").slice(0, 400)}{selected.description?.length > 400 ? "…" : ""}
                  </div>
                  {selected.effective && (
                    <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:8 }}>
                      Issued: {new Date(selected.effective).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}
                      {selected.expires ? ` · Expires: ${new Date(selected.expires).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" })}` : ""}
                    </div>
                  )}
                </div>
              );
            })()}

            <button onClick={sendToAll} disabled={sending}
              style={{ padding:"15px", borderRadius:"var(--r-sm)", border:"none",
                background: sending ? "var(--ink-3)" : "var(--danger)",
                color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)",
                cursor: sending ? "default" : "pointer", display:"flex",
                alignItems:"center", justifyContent:"center", gap:8 }}>
              <Icon name="bell-exclamation" size={18} color="#fff" />
              {sending ? "Sending…" : "Send alert to all homeowners"}
            </button>
          </>
        )}

        {sent && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <Icon name="circle-check" size={40} color="var(--ok)" />
            <div style={{ marginTop:12, fontWeight:800, fontSize:16 }}>Alert sent</div>
            <div style={{ color:"var(--ink-3)", fontSize:13.5, marginTop:4 }}>
              All homeowners have been notified.
            </div>
            <button onClick={onClose} style={{ marginTop:20, padding:"13px 30px",
              borderRadius:"var(--r-sm)", border:"none", background:"var(--pine)",
              color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared role-specific user management screen (internal)
function RoleUserScreen({ nav, title, role, maxCount, icon, accentColor, accentBg }) {
  const [users,         setUsers]         = React.useState([]);
  const [invites,       setInvites]       = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);
  const [modal,         setModal]         = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [err,           setErr]           = React.useState("");

  const load = async () => {
    setLoading(true);
    const [all, inv] = await Promise.all([FBUTIL.listUsers(), FBUTIL.listInvitations()]);
    setUsers(all.filter(u => u.role === role));
    const existingEmails = new Set(all.map(u => u.email?.toLowerCase()).filter(Boolean));
    setInvites(inv.filter(i => i.role === role && !existingEmails.has(i.email?.toLowerCase())));
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  const count = users.length;
  const atCap = maxCount && count >= maxCount;

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title={title}
          sub={maxCount ? `${count} / ${maxCount}` : `${count} active`}
          right={
            <button
              onClick={() => { if (!atCap) { setErr(""); setModal("add"); } }}
              style={{ width:36, height:36, borderRadius:999, border:"none",
                background: atCap ? "var(--bg-2)" : "var(--pine)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor: atCap ? "not-allowed" : "pointer", opacity: atCap ? 0.5 : 1 }}>
              <Icon name="plus" size={20} color={atCap ? "var(--ink-3)" : "#fff"} />
            </button>
          } />

        {maxCount && !loading && (
          <div style={{ padding:"2px 20px 10px" }}>
            <div style={{ height:4, borderRadius:999, background:"var(--line)", overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:999, transition:"width .4s ease",
                width:`${Math.min(100,(count/maxCount)*100)}%`,
                background: atCap ? "var(--danger)" : accentColor }} />
            </div>
            <div style={{ fontSize:12, fontWeight:600, marginTop:4,
              color: atCap ? "var(--danger)" : "var(--ink-3)" }}>
              {atCap ? `Maximum ${maxCount} reached` : `${maxCount - count} slot${maxCount-count===1?"":"s"} remaining`}
            </div>
          </div>
        )}

        <div style={{ padding:"4px 20px 80px", display:"flex", flexDirection:"column", gap:10 }}>
          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>
          )}

          {!loading && invites.length > 0 && (
            <>
              <div className="eyebrow" style={{ paddingLeft:2, marginTop:4 }}>Awaiting sign-up</div>
              {invites.map(inv => (
                <div key={inv.id} className="card" style={{ padding:"14px 16px",
                  display:"flex", alignItems:"center", gap:12,
                  borderLeft:"3px solid var(--warn)", background:"var(--warn-bg)" }}>
                  <div style={{ width:42, height:42, borderRadius:999, background:"var(--warn)",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name="mail" size={19} color="#fff" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{inv.name}</div>
                    <div style={{ fontSize:12.5, color:"var(--ink-2)", marginTop:1,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inv.email}</div>
                  </div>
                  <button onClick={async () => { await FBUTIL.deleteInvitation(inv.email); load(); }}
                    title="Cancel invitation"
                    style={{ width:34, height:34, borderRadius:10, border:"none",
                      background:"var(--danger-bg)", color:"var(--danger)",
                      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Icon name="x" size={17} />
                  </button>
                </div>
              ))}
              {users.length > 0 && <div className="eyebrow" style={{ paddingLeft:2, marginTop:4 }}>Active</div>}
            </>
          )}

          {!loading && users.length === 0 && invites.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <div style={{ width:64, height:64, borderRadius:999, background:accentBg,
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <Icon name={icon} size={32} color={accentColor} />
              </div>
              <div style={{ fontSize:15, fontWeight:700 }}>No {title.toLowerCase()} yet</div>
              <div style={{ fontSize:13, marginTop:5 }}>Tap + to invite the first one</div>
            </div>
          )}

          {!loading && users.map(u => (
            <div key={u.id} className="card rise" style={{ padding:"14px 16px",
              display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:42, height:42, borderRadius:999, background:accentBg,
                color:accentColor, display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:800, fontSize:14, flexShrink:0 }}>
                {(u.initials || (u.name||"?").slice(0,2)).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, display:"flex", alignItems:"center", gap:6 }}>
                  {u.name}
                  {u.protected && <Icon name="shield-check" size={13} color="var(--pine)" />}
                </div>
                <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                {u.phone && (
                  <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>
                    <Icon name="phone" size={11} /> {u.phone}
                  </div>
                )}
                {u.receiveReports && role === "supervisor" && (
                  <span style={{ display:"inline-block", marginTop:4, fontSize:11, fontWeight:700,
                    padding:"2px 8px", borderRadius:999,
                    background:"var(--info-bg)", color:"var(--info)" }}>
                    Reports on
                  </span>
                )}
              </div>
              {!u.protected && (
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button onClick={() => { setErr(""); setModal(u); }}
                    style={{ width:34, height:34, borderRadius:10, border:"none",
                      background:"var(--info-bg)", color:"var(--info)",
                      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Icon name="edit" size={17} />
                  </button>
                  <button onClick={() => setConfirmDelete(u.id)}
                    style={{ width:34, height:34, borderRadius:10, border:"none",
                      background:"var(--danger-bg)", color:"var(--danger)",
                      display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmSheet
          message={`Remove ${(users.find(u => u.id === confirmDelete)||{}).name || "this user"}?`}
          onConfirm={async () => {
            const res = await AUTH.deleteUser(confirmDelete);
            if (res.ok) { setConfirmDelete(null); load(); }
            else { setErr(res.error); setConfirmDelete(null); }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {err && (
        <div style={{ position:"fixed", bottom:80, left:20, right:20, maxWidth:440, margin:"0 auto",
          background:"var(--danger)", color:"#fff", borderRadius:"var(--r-sm)", padding:"12px 16px",
          fontSize:13.5, fontWeight:600, zIndex:200,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {err}
          <button onClick={() => setErr("")}
            style={{ border:"none", background:"transparent", color:"#fff", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={18} color="#fff" />
          </button>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          roles={[role]}
          onSave={async (data) => {
            setErr("");
            const res = modal === "add"
              ? await AUTH.addUser({ ...data, role })
              : await AUTH.updateUser(modal.id, data);
            if (!res.ok) { setErr(res.error); return; }
            load(); setModal(null);
          }}
          onClose={() => { setModal(null); setErr(""); }}
          err={err}
        />
      )}
    </div>
  );
}

// ── Admin: Administrators ─────────────────────────────────────
function AdminAdministrators({ nav }) {
  return <RoleUserScreen nav={nav} title="Administrators" role="administrator" maxCount={3}
    icon="shield-check" accentColor="#7B3FA0" accentBg="#F3E8FA" />;
}

// ── Admin: Supervisors ────────────────────────────────────────
function AdminSupervisors({ nav }) {
  return <RoleUserScreen nav={nav} title="Supervisors" role="supervisor" maxCount={5}
    icon="user-shield" accentColor="var(--pine)" accentBg="var(--mint-bg)" />;
}

// ── Admin: Operators ──────────────────────────────────────────
function AdminOperators({ nav }) {
  return <RoleUserScreen nav={nav} title="Operators" role="operator" maxCount={5}
    icon="tools" accentColor="var(--info)" accentBg="var(--info-bg)" />;
}

// ── Admin: Homeowners ─────────────────────────────────────────
function AdminHomeowners({ nav }) {
  return <RoleUserScreen nav={nav} title="Homeowners" role="homeowner" maxCount={null}
    icon="home" accentColor="var(--ok)" accentBg="var(--ok-bg)" />;
}

// ── Admin: Hub ────────────────────────────────────────────────
function AdminHub({ nav }) {
  const [counts,       setCounts]       = React.useState(null);
  const [weatherSheet, setWeatherSheet] = React.useState(false);

  React.useEffect(() => {
    FBUTIL.listUsers().then(all => {
      setCounts({
        administrator: all.filter(u => u.role === "administrator").length,
        supervisor: all.filter(u => u.role === "supervisor").length,
        operator:   all.filter(u => u.role === "operator").length,
        homeowner:  all.filter(u => u.role === "homeowner").length,
      });
    });
  }, []);

  const sections = [
    { role:"administrator", title:"Administrators", icon:"shield-check", color:"#7B3FA0", bg:"#F3E8FA", max:3, screen:"adminAdministrators", desc:"Full system access — add with care" },
    { role:"supervisor", title:"Supervisors",  icon:"user-shield", color:"var(--pine)", bg:"var(--mint-bg)", max:5,    screen:"adminSupervisors", desc:"Manage access and report notifications" },
    { role:"operator",   title:"Operators",    icon:"tools",       color:"var(--info)", bg:"var(--info-bg)", max:5,    screen:"adminOperators",   desc:"Field team doing property inspections" },
    { role:"homeowner",  title:"Homeowners",   icon:"home",        color:"var(--ok)",   bg:"var(--ok-bg)",   max:null, screen:"adminHomeowners",  desc:"Property owners with view-only access" },
  ];

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="User Management" sub="Administrator" />
        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:12 }}>
          {sections.map(s => {
            const count = counts ? counts[s.role] : null;
            const atCap = s.max && count >= s.max;
            return (
              <button key={s.role} onClick={() => nav.push(s.screen)}
                className="card tap rise"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"16px",
                  border:"none", cursor:"pointer", textAlign:"left", width:"100%" }}>
                <div style={{ width:50, height:50, borderRadius:14, background:s.bg,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={s.icon} size={25} color={s.color} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:3 }}>
                    <span style={{ fontWeight:800, fontSize:16 }}>{s.title}</span>
                    {count !== null && (
                      <span style={{ fontSize:12, fontWeight:700, padding:"2px 8px", borderRadius:999,
                        background: atCap ? "var(--danger-bg)" : s.bg,
                        color: atCap ? "var(--danger)" : s.color }}>
                        {s.max ? `${count}/${s.max}` : count}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:13, color:"var(--ink-3)", marginBottom: s.max ? 7 : 0 }}>{s.desc}</div>
                  {s.max && count !== null && (
                    <div style={{ height:3, borderRadius:999, background:"var(--line)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:999, transition:"width .5s ease",
                        width:`${Math.min(100,(count/s.max)*100)}%`,
                        background: atCap ? "var(--danger)" : s.color }} />
                    </div>
                  )}
                </div>
                <Icon name="chevron-right" size={20} color="var(--ink-3)" />
              </button>
            );
          })}

          {/* Weather alert button */}
          <button onClick={() => setWeatherSheet(true)}
            className="card tap rise"
            style={{ display:"flex", alignItems:"center", gap:14, padding:"16px",
              border:"none", cursor:"pointer", textAlign:"left", width:"100%" }}>
            <div style={{ width:50, height:50, borderRadius:14, background:"#FDEDEC",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="storm" size={25} color="#C0392B" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:16, marginBottom:3 }}>Weather Alerts</div>
              <div style={{ fontSize:13, color:"var(--ink-3)" }}>Check NWS and notify all homeowners</div>
            </div>
            <Icon name="chevron-right" size={20} color="var(--ink-3)" />
          </button>
        </div>
      </div>
      {weatherSheet && <WeatherAlertSheet onClose={() => setWeatherSheet(false)} />}
    </div>
  );
}

// ── Property modal (add / edit) ───────────────────────────────
const PROP_GRADS = [
  "linear-gradient(135deg,#1B3A2D 0%,#2C6B5C 100%)",
  "linear-gradient(135deg,#1B2A5C 0%,#2D4A9C 100%)",
  "linear-gradient(135deg,#5C1B2A 0%,#9C2D45 100%)",
  "linear-gradient(135deg,#3A2A1B 0%,#7B5B3A 100%)",
  "linear-gradient(135deg,#1B4A5C 0%,#2D7B9C 100%)",
];
const PROP_TYPES  = ["Single Family","Condo","Multi-unit","Vacation","Business"];
const PROP_FREQS  = ["Weekly","Bi-weekly","Monthly","Quarterly"];
const PROP_STATUS = ["active","vacant","alert"];

function PropertyModal({ property, homeowners, onSave, onClose }) {
  const isEdit = !!property;
  const [name,       setName]       = React.useState(property?.name            || "");
  const [addr,       setAddr]       = React.useState(property?.address         || "");
  const [type,       setType]       = React.useState(property?.type            || "Single Family");
  const [customType, setCustomType] = React.useState(!PROP_TYPES.includes(property?.type) ? (property?.type || "") : "");
  const [freq,       setFreq]       = React.useState(property?.freq            || "Monthly");
  const [customFreq, setCustomFreq] = React.useState(!PROP_FREQS.includes(property?.freq) ? (property?.freq || "") : "");
  const [status,     setStatus]     = React.useState(property?.status          || "active");
  const [customStatus,setCustomStatus]=React.useState(!PROP_STATUS.includes(property?.status) ? (property?.status || "") : "");
  const [grad,       setGrad]       = React.useState(property?.grad            || PROP_GRADS[0]);
  const [ownerId,    setOwnerId]    = React.useState(property?.homeownerId     || "");
  const [lockbox,    setLockbox]    = React.useState(property?.access?.lockbox || "");
  const [alarm,      setAlarm]      = React.useState(property?.access?.alarm   || "");
  const [accNotes,   setAccNotes]   = React.useState(property?.access?.notes   || "");
  const [busy,       setBusy]       = React.useState(false);

  const effectiveType   = type === "__custom__"   ? customType.trim()   : type;
  const effectiveFreq   = freq === "__other__"    ? customFreq.trim()   : freq;
  const effectiveStatus = status === "__other__"  ? customStatus.trim() : status;

  const owner = homeowners.find(h => h.id === ownerId) || null;

  const save = async () => {
    if (!name.trim() || !addr.trim()) return;
    setBusy(true);
    await onSave({
      name: name.trim(), address: addr.trim(), type: effectiveType || type, freq: effectiveFreq || freq, status: effectiveStatus || status, grad,
      homeownerId: ownerId || null,
      owner: owner
        ? { name:owner.name, email:owner.email, phone:owner.phone||"", base:addr.trim() }
        : (property?.owner || { name:"Unassigned", email:"", phone:"", base:addr.trim() }),
      access: { lockbox, alarm, notes: accNotes },
    });
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        maxHeight:"92vh", overflowY:"auto",
        padding:"24px 20px max(36px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:16 }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{isEdit ? "Edit property" : "Add property"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {[
          { label:"Property name", val:name, set:setName, ph:"e.g. Gulf Breeze Villa" },
          { label:"Address",       val:addr, set:setAddr, ph:"123 Beach Rd, Sarasota FL" },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
            <input value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}

        {/* Property type */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Property type</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {PROP_TYPES.map(o => (
              <button key={o} onClick={() => setType(o)}
                style={{ padding:"7px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: type===o ? "var(--pine)" : "var(--bg-2)",
                  color: type===o ? "#fff" : "var(--ink-2)" }}>{o}</button>
            ))}
            <button onClick={() => setType("__custom__")}
              style={{ padding:"7px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                background: type==="__custom__" ? "var(--pine)" : "transparent",
                color: type==="__custom__" ? "#fff" : "var(--ink-3)" }}>Custom…</button>
          </div>
          {type === "__custom__" && (
            <input value={customType} placeholder="Enter property type…" onChange={e => setCustomType(e.target.value)}
              style={{ marginTop:8, width:"100%", padding:"9px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          )}
        </div>

        {/* Visit frequency */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Visit frequency</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {PROP_FREQS.map(o => (
              <button key={o} onClick={() => setFreq(o)}
                style={{ padding:"7px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: freq===o ? "var(--pine)" : "var(--bg-2)",
                  color: freq===o ? "#fff" : "var(--ink-2)" }}>{o}</button>
            ))}
            <button onClick={() => setFreq("__other__")}
              style={{ padding:"7px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                background: freq==="__other__" ? "var(--pine)" : "transparent",
                color: freq==="__other__" ? "#fff" : "var(--ink-3)" }}>Other…</button>
          </div>
          {freq === "__other__" && (
            <input value={customFreq} placeholder="e.g. Every 6 weeks…" onChange={e => setCustomFreq(e.target.value)}
              style={{ marginTop:8, width:"100%", padding:"9px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          )}
        </div>

        {/* Status */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Status</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {PROP_STATUS.map(o => (
              <button key={o} onClick={() => setStatus(o)}
                style={{ padding:"7px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: status===o ? "var(--pine)" : "var(--bg-2)",
                  color: status===o ? "#fff" : "var(--ink-2)",
                  textTransform:"capitalize" }}>{o}</button>
            ))}
            <button onClick={() => setStatus("__other__")}
              style={{ padding:"7px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                background: status==="__other__" ? "var(--pine)" : "transparent",
                color: status==="__other__" ? "#fff" : "var(--ink-3)" }}>Other…</button>
          </div>
          {status === "__other__" && (
            <input value={customStatus} placeholder="e.g. Under renovation…" onChange={e => setCustomStatus(e.target.value)}
              style={{ marginTop:8, width:"100%", padding:"9px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          )}
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:8 }}>Card color</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            {PROP_GRADS.map((g, i) => (
              <button key={i} onClick={() => setGrad(g)}
                style={{ flex:1, minWidth:30, height:36, borderRadius:10, border:"none", cursor:"pointer",
                  background:g, boxShadow: grad===g ? "0 0 0 2.5px var(--pine), 0 0 0 4px #fff" : "none",
                  transition:"box-shadow .15s" }} />
            ))}
            <label title="Custom color" style={{ position:"relative", flexShrink:0, cursor:"pointer" }}>
              <div style={{ width:36, height:36, borderRadius:10, border:"1.5px dashed var(--line)",
                background: !PROP_GRADS.includes(grad) ? grad : "var(--bg-2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: !PROP_GRADS.includes(grad) ? "0 0 0 2.5px var(--pine), 0 0 0 4px #fff" : "none",
                transition:"box-shadow .15s" }}>
                <Icon name="palette" size={16} color={!PROP_GRADS.includes(grad) ? "#fff" : "var(--ink-3)"} />
              </div>
              <input type="color" defaultValue="#1B4332"
                onChange={e => setGrad(`linear-gradient(135deg,${e.target.value}cc,${e.target.value})`)}
                style={{ position:"absolute", opacity:0, width:0, height:0, pointerEvents:"none" }} />
            </label>
          </div>
          {!PROP_GRADS.includes(grad) && (
            <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:6 }}>Custom color selected — tap the palette to change</div>
          )}
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Homeowner (optional)</div>
          <select value={ownerId} onChange={e => setOwnerId(e.target.value)}
            style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
              border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
              background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }}>
            <option value="">— Unassigned —</option>
            {homeowners.map(h => <option key={h.id} value={h.id}>{h.name} ({h.email})</option>)}
          </select>
        </div>

        <div style={{ background:"var(--bg-2)", borderRadius:"var(--r-sm)", padding:"14px" }}>
          <div className="eyebrow" style={{ marginBottom:12 }}>Access & codes</div>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            {[{label:"Lockbox code",val:lockbox,set:setLockbox},{label:"Alarm code",val:alarm,set:setAlarm}].map(f=>(
              <div key={f.label} style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
                <input value={f.val} onChange={e=>f.set(e.target.value)}
                  style={{ width:"100%", padding:"9px 11px", borderRadius:"var(--r-sm)",
                    border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
                    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Entry notes</div>
          <textarea value={accNotes} onChange={e=>setAccNotes(e.target.value)} rows={2}
            placeholder="Gate code, parking instructions, etc."
            style={{ width:"100%", padding:"9px 11px", borderRadius:"var(--r-sm)",
              border:"1.5px solid var(--line)", fontSize:14, fontFamily:"var(--sans)",
              background:"var(--bg)", color:"var(--ink)", outline:"none", resize:"vertical",
              lineHeight:1.5, boxSizing:"border-box" }} />
        </div>

        <button onClick={save} disabled={busy || !name.trim() || !addr.trim()}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            background: name.trim()&&addr.trim() ? "var(--pine)" : "var(--bg-2)",
            color: name.trim()&&addr.trim() ? "#fff" : "var(--ink-3)",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
            cursor: name.trim()&&addr.trim() ? "pointer" : "default",
            opacity:busy?0.7:1 }}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Add property"}
        </button>
      </div>
    </div>
  );
}

// ── Admin: Properties ─────────────────────────────────────────
function AdminProperties({ nav }) {
  const [properties,    setProperties]    = React.useState([]);
  const [homeowners,    setHomeowners]    = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);
  const [modal,         setModal]         = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const load = async () => {
    setLoading(true);
    const [props, users] = await Promise.all([FBUTIL.listProperties(), FBUTIL.listUsers()]);
    setProperties(props);
    setHomeowners(users.filter(u => u.role === "homeowner"));
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Properties"
          sub={loading ? "Loading…" : `${properties.length} managed`}
          right={
            <button onClick={() => setModal("add")}
              style={{ width:36, height:36, borderRadius:999, border:"none",
                background:"var(--pine)", display:"flex", alignItems:"center",
                justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:12 }}>
          {loading && <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>}

          {!loading && properties.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <div style={{ width:64, height:64, borderRadius:999, background:"var(--mint-bg)",
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <Icon name="building-estate" size={32} color="var(--pine)" />
              </div>
              <div style={{ fontSize:15, fontWeight:700 }}>No properties yet</div>
              <div style={{ fontSize:13, marginTop:5 }}>Tap + to add the first one</div>
            </div>
          )}

          {properties.map(p => (
            <div key={p.id} className="card rise" style={{ overflow:"hidden" }}>
              <button onClick={() => nav.push("property", { id:p.id })}
                style={{ width:"100%", border:"none", padding:0, cursor:"pointer", textAlign:"left", background:"transparent" }}>
                <div style={{ background:p.grad||"var(--pine)", padding:"14px 16px 13px",
                  color:"#fff", position:"relative", overflow:"hidden" }}>
                  <Icon name="home" size={90} style={{ position:"absolute", right:-12, top:-8, opacity:0.1 }} color="#fff" />
                  <div style={{ position:"relative" }}>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase",
                      letterSpacing:0.08, opacity:0.8 }}>{p.type}</div>
                    <div style={{ fontSize:18, fontWeight:800, letterSpacing:-0.3, marginTop:2 }}>{p.name}</div>
                    <div style={{ fontSize:12.5, opacity:0.85, marginTop:3 }}>{p.address}</div>
                  </div>
                </div>
                <div style={{ padding:"11px 16px 12px", display:"flex", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:999,
                    background:"var(--mint-bg)", color:"var(--pine)" }}>{p.freq}</span>
                  <span style={{ fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:999,
                    background: p.status==="active" ? "var(--ok-bg)" : p.status==="alert" ? "var(--danger-bg)" : "var(--warn-bg)",
                    color: p.status==="active" ? "var(--ok)" : p.status==="alert" ? "var(--danger)" : "var(--warn)" }}>
                    {p.status || "active"}
                  </span>
                  {p.owner?.name && p.owner.name !== "Unassigned" && (
                    <span style={{ fontSize:12, fontWeight:600, color:"var(--ink-3)",
                      display:"flex", alignItems:"center", gap:4 }}>
                      <Icon name="user" size={11} /> {p.owner.name}
                    </span>
                  )}
                </div>
              </button>
              <div style={{ display:"flex", borderTop:"1px solid var(--line)" }}>
                <button onClick={() => setModal(p)}
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                    gap:6, padding:"11px", border:"none", background:"transparent",
                    cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--info)" }}>
                  <Icon name="edit" size={15} color="var(--info)" /> Edit
                </button>
                <div style={{ width:1, background:"var(--line)" }} />
                <button onClick={() => setConfirmDelete(p)}
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                    gap:6, padding:"11px", border:"none", background:"transparent",
                    cursor:"pointer", fontSize:13, fontWeight:700, color:"var(--danger)" }}>
                  <Icon name="trash" size={15} color="var(--danger)" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmSheet
          message={`Remove "${confirmDelete.name}"? This cannot be undone.`}
          onConfirm={async () => {
            await FBUTIL.deleteProperty(confirmDelete.id);
            setConfirmDelete(null);
            load();
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal && (
        <PropertyModal
          property={modal === "add" ? null : modal}
          homeowners={homeowners}
          onSave={async (data) => {
            if (modal === "add") {
              await FBUTIL.createProperty(data);
            } else {
              const oldFreq = (modal.freq || "").toLowerCase().trim();
              const newFreq = (data.freq || "").toLowerCase().trim();
              await FBUTIL.updateProperty(modal.id, data);
              if (oldFreq && newFreq && oldFreq !== newFreq) {
                await FBUTIL.reschedulePropertyUpcoming(modal.name, data.name, data.freq);
              }
            }
            load();
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

Object.assign(window, { AdminHub, AdminAdministrators, AdminSupervisors, AdminOperators, AdminHomeowners, AdminProperties });
