// ─────────────────────────────────────────────────────────────
// TPC Home Services — inspection, alerts, vendors, more
// ─────────────────────────────────────────────────────────────

function daysUntilPasswordExpiry(user) {
  if (!user?.passwordChangedAt) return null;
  const changed = new Date(user.passwordChangedAt);
  if (isNaN(changed)) return null;
  const expires = new Date(changed);
  expires.setDate(expires.getDate() + 90);
  return Math.ceil((expires - Date.now()) / 86400000);
}

// ── LIVE INSPECTION ──────────────────────────────────────────
function Inspection({ propId, schedId, nav, user, visitName: visitNameProp, checklistItems: checklistItemsProp }) {
  const [prop,       setProp]      = useState(null);
  const [schedType,  setSchedType] = useState(null); // type from schedule item when launched via schedId
  const [checklist,  setChecklist] = useState([]);
  const [checked,    setChecked]   = useState({});
  const [flagged,   setFlagged]   = useState({});
  const [notes,     setNotes]     = useState("");
  const [done,      setDone]      = useState(false);
  const [photos,    setPhotos]    = useState([]); // [{url, file}]
  const fileRef          = useRef(null);
  const pendingPhotoItem = useRef(null);
  const role = (user || AUTH.currentUser || {}).role || "operator";

  useEffect(() => {
    const load = async () => {
      try {
        let p = null;
        if (propId) {
          p = await FBUTIL.getProperty(String(propId));
        } else if (schedId) {
          // Launched from schedule row — resolve property via the schedule item's prop name
          const sched = await FBUTIL.getScheduleItem(String(schedId));
          if (sched?.prop) p = await FBUTIL.getPropertyByName(sched.prop);
          if (sched?.type) setSchedType(sched.type);
        }
        if (p) setProp(p);
      } catch(e) {}
    };
    load();
  }, [propId, schedId]);

  // Derive checklist from explicit prop, schedule type, or property default
  const effectiveVisitName = visitNameProp
    || (/storm prep/i.test(schedType) ? "Storm Prep" : /post.?storm/i.test(schedType) ? "Post-Storm Check" : null);

  useEffect(() => {
    if (checklistItemsProp?.length) { setChecklist(checklistItemsProp); return; }
    const isStormPrep  = /storm prep/i.test(schedType) || /storm prep/i.test(visitNameProp || "");
    const isPostStorm  = /post.?storm/i.test(schedType) || /post.?storm/i.test(visitNameProp || "");
    if (isStormPrep) {
      FBUTIL.getChecklist("storm-prep")
        .then(cl => setChecklist(cl?.items?.length ? cl.items : HW.stormPrepChecklist))
        .catch(() => setChecklist(HW.stormPrepChecklist));
      return;
    }
    if (isPostStorm) {
      FBUTIL.getChecklist("post-storm")
        .then(cl => setChecklist(cl?.items?.length ? cl.items : HW.postStormChecklist))
        .catch(() => setChecklist(HW.postStormChecklist));
      return;
    }
    if (!prop) return;
    FBUTIL.getChecklistForProp(prop.id)
      .then(cl => { if (cl?.length) setChecklist(cl); })
      .catch(() => { setChecklist(HW.checklist); });
  }, [prop, schedType, checklistItemsProp, visitNameProp]);

  // IDs of checklist items that require photos
  const photoItemIds = checklist
    .filter(c => /photo/i.test(c.label))
    .map(c => c.id);

  if (!prop) return (
    <div className="hw-app" style={{ background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"var(--ink-3)" }}>
        <Icon name="clipboard-list" size={40} color="var(--ink-3)" />
        <div style={{ marginTop:12, fontWeight:600 }}>Loading inspection…</div>
      </div>
    </div>
  );

  const autoCheckPhotos = (hasPhotos) => {
    setChecked(c => {
      const updated = { ...c };
      photoItemIds.forEach(id => { updated[id] = hasPhotos; });
      return updated;
    });
  };

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      if (pendingPhotoItem.current !== null) {
        setChecked(c => ({ ...c, [pendingPhotoItem.current]: false }));
        pendingPhotoItem.current = null;
      }
      e.target.value = "";
      return;
    }
    const entries = files.map(f => ({ url: URL.createObjectURL(f), file: f }));
    setPhotos(p => {
      const next = [...p, ...entries];
      autoCheckPhotos(true);
      return next;
    });
    pendingPhotoItem.current = null;
    e.target.value = "";
  };

  const removePhoto = (i) => {
    setPhotos(p => {
      URL.revokeObjectURL(p[i].url);
      const next = p.filter((_,idx) => idx !== i);
      if (next.length === 0) autoCheckPhotos(false);
      return next;
    });
  };

  const total = checklist.length;
  const count = Object.values(checked).filter(Boolean).length;
  const pct = total > 0 ? Math.round((count/total)*100) : 0;

  // group by category
  const groups = {};
  checklist.forEach(c => { (groups[c.cat || "General"] = groups[c.cat || "General"] || []).push(c); });

  const toggle = (id) => {
    const isPhotoItem = photoItemIds.includes(id);
    const currentlyChecked = !!checked[id];
    if (isPhotoItem && !currentlyChecked) {
      // Checking a photo item — optimistically check it then open picker
      setChecked(c => ({ ...c, [id]: true }));
      pendingPhotoItem.current = id;
      fileRef.current.click();
    } else {
      setChecked(c => ({ ...c, [id]: !c[id] }));
    }
  };
  const flag = (id, e) => { e.stopPropagation(); setFlagged(f => ({ ...f, [id]: !f[id] })); };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div style={{ background:"var(--surface)", boxShadow:"var(--shadow-sm)", paddingBottom:14, position:"relative", zIndex:5 }}>
        <DrillHeader onBack={nav.back} title={prop.name} sub={effectiveVisitName || "Inspection"}
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
          <input ref={fileRef} type="file" accept="image/*" multiple
            style={{ display:"none" }} onChange={addPhotos} />
          <button className="tap" onClick={() => fileRef.current.click()}
            style={{ flexShrink:0, width:84, height:84, borderRadius:16, border:"1.5px dashed var(--mint)", background:"var(--mint-bg)",
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer", color:"var(--pine)" }}>
            <Icon name="camera-plus" size={24} color="var(--pine)" />
            <span style={{ fontSize:11, fontWeight:700 }}>Add</span>
          </button>
          {photos.map((ph, i) => (
            <div key={i} style={{ flexShrink:0, width:84, height:84, borderRadius:16, overflow:"hidden", position:"relative" }}>
              <img src={ph.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <button onClick={() => removePhoto(i)}
                style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:999,
                  background:"rgba(0,0,0,0.55)", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                <Icon name="x" size={12} color="#fff" />
              </button>
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

      {done && <CompleteSheet item={null} prop={prop} count={count} total={total}
        flagged={Object.values(flagged).filter(Boolean).length}
        allItems={checklist.map(c => c.label)}
        checkedItems={checklist.filter(c => checked[c.id]).map(c => c.label)}
        flaggedItems={checklist.filter(c => flagged[c.id]).map(c => c.label)}
        notes={notes} photoFiles={photos.map(p=>p.file)} nav={nav}
        visitName={effectiveVisitName} />}
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

function CompleteSheet({ item, prop, count, total, flagged, allItems, checkedItems, flaggedItems, notes, photoFiles, nav, visitName: visitNameProp }) {
  const [uploading,       setUploading]       = useState(false);
  const [uploaded,        setUploaded]        = useState(false);
  const [reportId,        setReportId]        = useState(null);
  const [err,             setErr]             = useState("");
  const [supSheet,        setSupSheet]        = useState(false);
  const [reviewers,       setReviewers]       = useState(null);
  const [selectedIds,     setSelectedIds]     = useState(new Set());
  const [assignedSups,    setAssignedSups]    = useState(null);
  const [assigning,       setAssigning]       = useState(false);

  const submit = async () => {
    setUploading(true); setErr("");
    try {
      let photoUrls = [];
      if (photoFiles && photoFiles.length > 0) {
        photoUrls = await FBUTIL.uploadInspectionPhotos(String(prop.id || prop.name), photoFiles);
      }
      const op = AUTH.currentUser || {};
      const id = await FBUTIL.submitReport({
        propId:       String(prop.id || prop.name),
        propName:     prop.name,
        address:      prop.address || "",
        operatorId:   op.uid || op.id || "",
        operatorName: op.name || "Operator",
        date:         new Date().toISOString().slice(0, 10),
        dateStr:      new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" }),
        time:         new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true }),
        visitName:    visitNameProp || item?.name || "",
        checkCount:   count,
        totalCount:   total,
        flagCount:    flagged,
        allItems:     allItems || [],
        checkedItems: checkedItems || [],
        flaggedItems: flaggedItems || [],
        notes,
        photoUrls,
        photoCount: photoFiles ? photoFiles.length : 0,
      });
      setReportId(id);
      setUploaded(true);
    } catch(e) {
      console.error("Submit error:", e);
      setErr("Submit failed: " + (e?.message || e?.code || String(e)));
    }
    setUploading(false);
  };

  const openSupSheet = async () => {
    setSupSheet(true);
    setSelectedIds(new Set());
    if (!reviewers) {
      const list = await FBUTIL.getSupervisorsAndAdmins();
      setReviewers(list);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmAssign = async () => {
    if (selectedIds.size === 0) return;
    if (!reportId) { setErr("No report ID — please re-submit the inspection."); return; }
    setAssigning(true);
    try {
      const chosen = (reviewers || []).filter(r => selectedIds.has(r.id));
      await FBUTIL.assignReportToReviewers(reportId, chosen.map(r => ({ id: r.id, name: r.name || r.email || r.id, role: r.role })));
      setAssignedSups(chosen);
      setSupSheet(false);
    } catch(e) {
      console.error("assignReportToReviewers error:", e);
      setErr("Failed to send: " + (e?.message || e?.code || String(e)));
    }
    setAssigning(false);
  };

  return (
    <div style={{ position:"absolute", inset:0, zIndex:30, display:"flex", flexDirection:"column", justifyContent:"flex-end",
      background:"rgba(20,28,23,0.5)", backdropFilter:"blur(3px)", animation:"hw-fade-in .25s ease both" }}>
      <div style={{ background:"var(--surface)", borderRadius:"28px 28px 0 0", padding:"10px 24px 36px", animation:"hw-slide-up .35s cubic-bezier(.22,.61,.36,1) both" }}>
        <div style={{ width:40, height:5, borderRadius:999, background:"var(--line)", margin:"0 auto 22px" }} />
        <div style={{ width:68, height:68, borderRadius:999, background:"var(--mint-bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", animation:"hw-pop .4s cubic-bezier(.22,1.3,.5,1) both" }}>
          <Icon name={uploaded ? "circle-check-filled" : "send"} size={42} color="var(--mint)" />
        </div>
        <h2 className="serif" style={{ textAlign:"center", margin:"18px 0 6px", fontSize:25, fontWeight:500 }}>
          {uploaded ? "Report sent!" : "Inspection complete"}
        </h2>
        <p style={{ textAlign:"center", margin:0, color:"var(--ink-2)", fontSize:14.5 }}>{prop.name}</p>
        <div style={{ display:"flex", gap:11, margin:"22px 0 24px" }}>
          <SummaryStat v={`${count}/${total}`} l="Checks done" />
          <SummaryStat v={flagged} l="Issues flagged" tone={flagged?"var(--danger)":"var(--ink)"} />
          <SummaryStat v={photoFiles ? photoFiles.length : 0} l="Photos" />
        </div>
        {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13, fontWeight:600, marginBottom:12 }}>{err}</div>}
        {!uploaded ? (
          <button className="btn btn-primary btn-block" onClick={submit} disabled={uploading}
            style={{ padding:"16px", fontSize:16, opacity:uploading?0.7:1 }}>
            {uploading
              ? <><Icon name="loader" size={18} color="#fff" /> {photoFiles?.length ? "Uploading photos…" : "Sending…"}</>
              : <><Icon name="send" size={18} color="#fff" /> Send inspection report</>}
          </button>
        ) : (
          <>
            {assignedSups ? (
              <div style={{ padding:"13px 16px", borderRadius:"var(--r-sm)",
                background:"var(--mint-bg)", border:"1px solid rgba(52,168,83,0.2)", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: assignedSups.length > 1 ? 8 : 0 }}>
                  <Icon name="circle-check" size={18} color="var(--pine)" />
                  <span style={{ fontSize:14, fontWeight:700, color:"var(--pine)" }}>
                    Sent to {assignedSups.length} recipient{assignedSups.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {assignedSups.map(r => (
                  <div key={r.id} style={{ fontSize:13, color:"var(--pine)", paddingLeft:28, marginTop:3 }}>
                    {r.name || r.email} <span style={{ opacity:0.6, fontSize:11 }}>({r.role})</span>
                  </div>
                ))}
              </div>
            ) : (
              <button className="btn btn-light btn-block" onClick={openSupSheet}
                style={{ padding:"14px", fontSize:15, marginBottom:10, fontWeight:700 }}>
                <Icon name="user-share" size={18} color="var(--pine)" /> Send to Supervisor / Admin
              </button>
            )}
            <button className="btn btn-primary btn-block" onClick={nav.back} style={{ padding:"16px", fontSize:16 }}>
              <Icon name="home" size={18} color="#fff" /> Back to dashboard
            </button>
          </>
        )}
        {notes ? <div style={{ margin:"12px 0 0", background:"var(--surface-2)", borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13, color:"var(--ink-2)", lineHeight:1.5 }}><span style={{ fontWeight:700, color:"var(--ink)" }}>Notes: </span>{notes}</div> : null}
        {!uploaded && <button className="btn btn-ghost btn-block" onClick={nav.back} style={{ padding:"12px", marginTop:6, fontSize:15 }}>Cancel</button>}
      </div>

      {/* Reviewer picker sheet */}
      {supSheet && (
        <div onClick={() => setSupSheet(false)}
          style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(15,28,63,0.35)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position:"absolute", bottom:0, left:0, right:0, background:"var(--surface)",
              borderRadius:"20px 20px 0 0", padding:"12px 20px max(32px,env(safe-area-inset-bottom))",
              maxHeight:"80vh", display:"flex", flexDirection:"column",
              animation:"hw-slide-up .28s cubic-bezier(.22,.61,.36,1) both" }}>
            <div style={{ width:36, height:4, background:"var(--line)", borderRadius:999, margin:"0 auto 16px", flexShrink:0 }} />
            <div style={{ fontWeight:800, fontSize:17, marginBottom:4, flexShrink:0 }}>Send Report</div>
            <div style={{ fontSize:13, color:"var(--ink-3)", marginBottom:16, flexShrink:0 }}>Select supervisors and/or admins to notify</div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {!reviewers && <div style={{ padding:"20px 0", textAlign:"center", color:"var(--ink-3)" }}>Loading…</div>}
              {reviewers && reviewers.length === 0 && (
                <div style={{ padding:"20px 0", textAlign:"center", color:"var(--ink-3)", fontSize:14 }}>
                  No supervisors or admins found. Add accounts in User Management.
                </div>
              )}
              {(reviewers || []).map(r => {
                const checked = selectedIds.has(r.id);
                return (
                  <div key={r.id} onClick={() => toggleSelect(r.id)}
                    style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 4px",
                      borderTop:"1px solid var(--line)", cursor:"pointer" }}>
                    <div style={{ width:40, height:40, borderRadius:999, flexShrink:0,
                      background: r.role === "administrator" ? "var(--info-bg)" : "var(--pine)",
                      color: r.role === "administrator" ? "var(--info)" : "#fff",
                      display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15 }}>
                      {(r.name || r.email || "?")[0].toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>{r.name || r.email}</div>
                      <div style={{ fontSize:12, color:"var(--ink-3)" }}>
                        {r.role === "administrator" ? "Admin" : "Supervisor"}
                        {r.email && r.name ? ` · ${r.email}` : ""}
                      </div>
                    </div>
                    <div style={{ width:24, height:24, borderRadius:6, flexShrink:0,
                      background: checked ? "var(--pine)" : "transparent",
                      border: checked ? "2px solid var(--pine)" : "2px solid var(--line)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {checked && <Icon name="check" size={14} color="#fff" />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ paddingTop:12, flexShrink:0 }}>
              <button className="btn btn-primary btn-block" onClick={confirmAssign}
                disabled={assigning || selectedIds.size === 0}
                style={{ padding:"15px", fontSize:15, fontWeight:700,
                  opacity: selectedIds.size === 0 ? 0.5 : 1 }}>
                {assigning
                  ? <><Icon name="loader" size={18} color="#fff" /> Sending…</>
                  : selectedIds.size === 0
                    ? "Select recipients"
                    : `Send to ${selectedIds.size} recipient${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
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
function Alerts({ nav, canGoBack, onAlertsCleared }) {
  const [alerts,        setAlerts]        = React.useState(null);
  const [opAlerts,      setOpAlerts]      = React.useState(null);
  const [confirmClearA, setConfirmClearA] = React.useState(false);
  const [clearing,      setClearing]      = React.useState(false);

  const isAdmin      = AUTH.isAdmin();
  const isSupervisor = AUTH.isSupervisor();
  const canClear     = isAdmin || isSupervisor;
  const canSend      = AUTH.isOperator();

  const SEV_TONE = {
    message:   { color:"#166534", bg:"#DCFCE7", icon:"message-circle" },
    caution:   { color:"#92400E", bg:"#FEF3C7", icon:"alert-triangle" },
    attention: { color:"#9A3412", bg:"#FFEDD5", icon:"alert-octagon"  },
    alert:     { color:"#991B1B", bg:"#FEE2E2", icon:"bell-exclamation" },
  };

  const load = () => {
    FBUTIL.getAllHomeownerAlerts().then(setAlerts).catch(() => setAlerts([]));
    if (canClear) FBUTIL.getAllOperatorAlerts().then(setOpAlerts).catch(() => setOpAlerts([]));
  };
  React.useEffect(() => { load(); }, []);

  const deleteAlert = async (id) => {
    await FBUTIL.deleteHomeownerAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    if (onAlertsCleared) onAlertsCleared();
  };

  const deleteOpAlert = async (id) => {
    await FBUTIL.deleteOperatorAlert(id);
    setOpAlerts(prev => prev.filter(a => a.id !== id));
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric" });
  };

  return (
    <div className="hw-scroll">
      <AppHeader title="Alerts" sub={alerts ? `${alerts.length} total` : "Loading…"}
        onBack={canGoBack ? nav.back : null}
      />

      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:13 }}>
        {alerts === null && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>
        )}
        {alerts !== null && alerts.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
            <Icon name="bell-off" size={40} color="var(--ink-3)" />
            <div style={{ marginTop:12, fontSize:15, fontWeight:600 }}>No alerts</div>
            <div style={{ fontSize:13, marginTop:4 }}>Homeowner alerts you send will appear here</div>
          </div>
        )}
        {(alerts || []).map((a, i) => {
          const tone = SEV_TONE[a.severity] || SEV_TONE.caution;
          return (
            <div key={a.id} className="card rise" style={{ padding:"16px", borderLeft:`4px solid ${tone.color}`, animationDelay:`${0.05*i}s` }}>
              <div style={{ display:"flex", gap:13 }}>
                <IconTile icon={tone.icon} bg={tone.bg} color={tone.color} size={44} r={12} iconSize={22} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start" }}>
                    <span style={{ fontWeight:800, fontSize:15.5, letterSpacing:-0.2 }}>{a.title}</span>
                    <span style={{ fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap", fontWeight:600, flexShrink:0 }}>{fmtDate(a.createdAt)}</span>
                  </div>
                  <p style={{ margin:"5px 0 0", fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>{a.message}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12 }}>
                <span className="pill pill-muted"><Icon name="home" size={13} /> {a.propName || a.propId}</span>
                {a.sentBy && <span className="pill pill-muted"><Icon name="user" size={13} /> {a.sentBy}</span>}
                {a.read && <span style={{ fontSize:11, fontWeight:700, color:"var(--ok)" }}>Read ✓</span>}
                {canClear && <button onClick={() => deleteAlert(a.id)} style={{ marginLeft:"auto", border:"none", background:"none",
                  cursor:"pointer", padding:4, color:"var(--ink-3)" }}>
                  <Icon name="trash" size={16} color="var(--danger)" />
                </button>}
              </div>
            </div>
          );
        })}
      </div>

      {canClear && opAlerts && opAlerts.length > 0 && (
        <div style={{ padding:"0 20px 4px" }}>
          <div style={{ fontSize:12.5, fontWeight:800, color:"var(--ink-3)", letterSpacing:0.5,
            textTransform:"uppercase", marginBottom:10, marginTop:4 }}>Notes from Operators</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {opAlerts.map((a) => (
              <div key={a.id} className="card" style={{ padding:"14px 16px", borderLeft:"4px solid var(--info)" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <Icon name="note" size={18} color="var(--info)" style={{ flexShrink:0, marginTop:2 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontWeight:800, fontSize:14.5 }}>{a.title}</span>
                      <span style={{ fontSize:11.5, color:"var(--ink-3)", whiteSpace:"nowrap", fontWeight:600, flexShrink:0 }}>{fmtDate(a.createdAt)}</span>
                    </div>
                    <p style={{ margin:"4px 0 6px", fontSize:13, color:"var(--ink-2)", lineHeight:1.5 }}>{a.message}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" }}>
                      {a.sentBy && <span className="pill pill-muted"><Icon name="user" size={12} /> {a.sentBy}</span>}
                      {(a.propNames || []).map(n => <span key={n} className="pill pill-muted"><Icon name="home" size={12} /> {n}</span>)}
                      {isAdmin && <button onClick={() => deleteOpAlert(a.id)} style={{ marginLeft:"auto", border:"none", background:"none",
                        cursor:"pointer", padding:4 }}>
                        <Icon name="trash" size={15} color="var(--danger)" />
                      </button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canSend && (
        <button onClick={() => nav.push("sendAlert")}
          style={{ position:"fixed", bottom:90, right:20, zIndex:100,
            width:52, height:52, borderRadius:999, border:"none", cursor:"pointer",
            background:"var(--pine)", color:"#fff", display:"flex", alignItems:"center",
            justifyContent:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.22)" }}>
          <Icon name="plus" size={26} color="#fff" />
        </button>
      )}

    </div>
  );
}

// ── VENDORS ──────────────────────────────────────────────────
function Vendors({ nav, canGoBack }) {
  const isAdmin = AUTH.isOperator(); // admin and supervisor can manage vendors
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
      <AppHeader title="Vendors" sub="Trusted partners" onBack={canGoBack ? nav.back : null}
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

// ── PROFILE EDIT ─────────────────────────────────────────────
function ProfileEdit({ nav, user }) {
  const u    = user || AUTH.currentUser || {};
  const role = u.role || "operator";
  const isOperatorOnly = role === "operator";

  const [name,     setName]     = React.useState(u.name     || "");
  const [email,    setEmail]    = React.useState(u.email    || "");
  const [phone,    setPhone]    = React.useState(u.phone    || "");
  const [initials, setInitials] = React.useState(u.initials || "");
  // admin/supervisor extras
  const [title,    setTitle]    = React.useState(u.title    || "");
  const [address,  setAddress]  = React.useState(u.address  || "");
  const [emergencyName,  setEmergencyName]  = React.useState(u.emergency?.name  || "");
  const [emergencyPhone, setEmergencyPhone] = React.useState(u.emergency?.phone || "");
  const [busy, setBusy]  = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err,  setErr]   = React.useState("");
  // password change
  const [showPwd,    setShowPwd]    = React.useState(false);
  const [curPwd,     setCurPwd]     = React.useState("");
  const [newPwd,     setNewPwd]     = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [pwdSaved,   setPwdSaved]   = React.useState(false);
  const [pwdErr,     setPwdErr]     = React.useState("");

  const save = async () => {
    if (!name.trim() || !email.trim()) { setErr("Name and email are required."); return; }
    setBusy(true); setErr("");
    try {
      const data = {
        name:     name.trim(),
        email:    email.trim(),
        phone:    phone.trim(),
        initials: initials.trim() || name.trim().slice(0,2).toUpperCase(),
        ...(!isOperatorOnly && {
          title:   title.trim(),
          address: address.trim(),
          emergency: { name: emergencyName.trim(), phone: emergencyPhone.trim() },
        }),
      };
      await FBUTIL.updateUserProfile(u.uid, data);
      AUTH.currentUser = { ...AUTH.currentUser, ...data };
      setSaved(true);
      setTimeout(() => { setSaved(false); nav.back(); }, 900);
    } catch(e) {
      setErr("Save failed. Please try again.");
    }
    setBusy(false);
  };

  const changePassword = async () => {
    setPwdErr("");
    if (!curPwd) { setPwdErr("Enter your current password."); return; }
    const vErr = validatePassword(newPwd);
    if (vErr) { setPwdErr(vErr); return; }
    if (newPwd !== confirmPwd) { setPwdErr("Passwords don't match."); return; }
    setBusy(true);
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(fbAuth.currentUser.email, curPwd);
      await fbAuth.currentUser.reauthenticateWithCredential(cred);
      await fbAuth.currentUser.updatePassword(newPwd);
      const today = new Date().toISOString().slice(0, 10);
      if (u.uid) await FBUTIL.updateUserProfile(u.uid, { password: newPwd, passwordChangedAt: today });
      AUTH.currentUser = { ...AUTH.currentUser, passwordChangedAt: today };
      setPwdSaved(true);
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => { setPwdSaved(false); setShowPwd(false); }, 1500);
    } catch(e) {
      const msgs = { "auth/wrong-password":"Current password is incorrect.", "auth/invalid-credential":"Current password is incorrect." };
      setPwdErr(msgs[e.code] || "Password change failed. Try again.");
    }
    setBusy(false);
  };

  const ROLE_LABELS = { administrator:"Administrator", supervisor:"Supervisor", operator:"Operator", homeowner:"Homeowner" };

  const fields = [
    { label:"Full name", value:name,     set:setName,     ph:"Jane Smith" },
    { label:"Email",     value:email,    set:setEmail,    type:"email", ph:"jane@example.com" },
    { label:"Phone",     value:phone,    set:setPhone,    type:"tel",   ph:"(941) 555-0000" },
    { label:"Initials",  value:initials, set:setInitials, ph:"JS" },
    ...(!isOperatorOnly ? [
      { label:"Job title",     value:title,          set:setTitle,          ph:"Field Supervisor" },
      { label:"Address",       value:address,        set:setAddress,        ph:"123 Main St, Sarasota FL" },
      { label:"Contact name",  value:emergencyName,  set:setEmergencyName,  ph:"John Smith" },
      { label:"Contact phone", value:emergencyPhone, set:setEmergencyPhone, type:"tel", ph:"(941) 555-0001" },
    ] : []),
  ];

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll" style={{ padding:"0 0 80px" }}>
        <DrillHeader onBack={nav.back} title="Edit profile" />

        <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* avatar */}
          <div style={{ display:"flex", justifyContent:"center", paddingBottom:4 }}>
            <div style={{ width:72, height:72, borderRadius:999, background:"var(--pine)", color:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:26 }}>
              {(initials || name || "?").slice(0,2).toUpperCase()}
            </div>
          </div>

          {/* role badge — read-only */}
          <div style={{ display:"flex", justifyContent:"center" }}>
            <span style={{ fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:999,
              background:"var(--mint-bg)", color:"var(--pine)" }}>
              {ROLE_LABELS[role] || role}
            </span>
          </div>

          {fields.map((f, i) => (
            <React.Fragment key={f.label}>
              {!isOperatorOnly && i === 4 && (
                <div style={{ borderTop:"1px solid var(--line)", margin:"4px 0" }} />
              )}
              {!isOperatorOnly && i === 6 && (
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:-6 }}>Emergency contact</div>
              )}
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
                <input type={f.type || "text"} value={f.value} placeholder={f.ph} onChange={e => f.set(e.target.value)}
                  style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
              </div>
            </React.Fragment>
          ))}

          {err && (
            <div style={{ background:"var(--danger-bg)", color:"var(--danger)",
              borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13, fontWeight:600 }}>{err}</div>
          )}

          <button onClick={save} disabled={busy || saved}
            style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
              background: saved ? "var(--ok)" : "var(--pine)",
              color:"#fff", fontSize:16, fontWeight:800,
              fontFamily:"var(--sans)", cursor:(busy||saved)?"default":"pointer",
              opacity:(busy&&!saved)?0.7:1, transition:"background .3s" }}>
            {saved ? "Saved ✓" : busy ? "Saving…" : "Save changes"}
          </button>

          {/* ── Change password ── */}
          <div style={{ borderTop:"1px solid var(--line)", marginTop:4 }} />
          {(() => {
            const d = daysUntilPasswordExpiry(u);
            if (d === null || d > 30) return null;
            const danger = d <= 7;
            return (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px",
                borderRadius:"var(--r-sm)", fontSize:12.5, fontWeight:700,
                background: danger ? "var(--danger-bg)" : "var(--warn-bg)",
                color: danger ? "var(--danger)" : "var(--warn)" }}>
                <Icon name="clock" size={14} color={danger ? "var(--danger)" : "var(--warn)"} />
                Password expires in {Math.max(0, d)} day{d !== 1 ? "s" : ""}
              </div>
            );
          })()}
          <button onClick={() => { setShowPwd(v => !v); setPwdErr(""); }}
            style={{ background:"none", border:"none", padding:"4px 0", cursor:"pointer",
              display:"flex", alignItems:"center", gap:8, fontFamily:"var(--sans)",
              fontSize:14, fontWeight:700, color:"var(--pine)" }}>
            <Icon name={showPwd ? "chevron-up" : "lock"} size={16} color="var(--pine)" />
            {showPwd ? "Cancel password change" : "Change password"}
          </button>

          {showPwd && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:12, color:"var(--ink-2)", background:"var(--bg-2)",
                borderRadius:8, padding:"8px 11px", lineHeight:1.65 }}>
                8+ chars · one capital · one number · one symbol: ! @ # $ *
              </div>
              {[
                { label:"Current password", val:curPwd,     set:setCurPwd },
                { label:"New password",     val:newPwd,     set:setNewPwd },
                { label:"Confirm new",      val:confirmPwd, set:setConfirmPwd },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
                  <input type="password" value={f.val} placeholder="••••••••"
                    onChange={e => f.set(e.target.value)}
                    style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                      border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                      background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
                </div>
              ))}
              {pwdErr && (
                <div style={{ background:"var(--danger-bg)", color:"var(--danger)",
                  borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13, fontWeight:600 }}>{pwdErr}</div>
              )}
              <button onClick={changePassword} disabled={busy || pwdSaved}
                style={{ padding:"13px", borderRadius:"var(--r-sm)", border:"none",
                  background: pwdSaved ? "var(--ok)" : "var(--pine-2)",
                  color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)",
                  cursor:(busy||pwdSaved)?"default":"pointer", opacity:busy?0.7:1, transition:"background .3s" }}>
                {pwdSaved ? "Password updated ✓" : busy ? "Updating…" : "Update password"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── DATA MANAGE SHEET ────────────────────────────────────────
function DataManageSheet({ type, onClose }) {
  const [items,    setItems]   = React.useState(null); // null = loading
  const [selected, setSelected]= React.useState(new Set());
  const [busy,     setBusy]    = React.useState(false);
  const [confirm,  setConfirm] = React.useState(false);

  const CONFIG = {
    visits:  { title:"Scheduled visits",   load: () => FBUTIL.listSchedule(),           del: (id) => FBUTIL.deleteScheduleItem(id),     label: (it) => it.name || it.type || "Visit", sub: (it) => it.dateStr || it.date || "" },
    reports: { title:"Inspection reports", load: () => FBUTIL.getReports(),             del: (id) => FBUTIL.deleteReport(id),           label: (it) => it.propName || "Report",       sub: (it) => it.dateStr || it.date || "" },
    alerts:  { title:"Homeowner alerts",   load: () => FBUTIL.getAllHomeownerAlerts(),  del: (id) => FBUTIL.deleteHomeownerAlert(id),   label: (it) => it.title || "Alert",           sub: (it) => it.propName || "" },
  };
  const cfg = CONFIG[type];

  React.useEffect(() => {
    cfg.load().then(list => setItems(list || []));
  }, [type]);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === (items||[]).length) setSelected(new Set());
    else setSelected(new Set((items||[]).map(it => it.id)));
  };

  const doDelete = async () => {
    setBusy(true);
    await Promise.all([...selected].map(id => cfg.del(id).catch(() => {})));
    setItems(prev => (prev||[]).filter(it => !selected.has(it.id)));
    setSelected(new Set());
    setBusy(false);
    setConfirm(false);
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
    } catch { return String(ts).slice(0, 10); }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", flexDirection:"column" }}>
      <div onClick={onClose} style={{ flex:1, background:"rgba(0,0,0,0.38)" }} />
      <div style={{ background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        maxHeight:"88vh", display:"flex", flexDirection:"column",
        paddingBottom:"env(safe-area-inset-bottom,0)" }}>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 20px 12px", borderBottom:"1px solid var(--line)", flexShrink:0 }}>
          <div style={{ fontWeight:800, fontSize:18 }}>{cfg.title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:999, border:"none",
            background:"var(--bg-2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={18} color="var(--ink-2)" />
          </button>
        </div>

        {/* select-all bar */}
        {items && items.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 20px", borderBottom:"1px solid var(--line)", flexShrink:0,
            background:"var(--bg-2)" }}>
            <button onClick={toggleAll} style={{ display:"flex", alignItems:"center", gap:8,
              border:"none", background:"transparent", cursor:"pointer", fontFamily:"var(--sans)",
              fontSize:13, fontWeight:700, color:"var(--ink-2)" }}>
              <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, transition:"all .15s",
                border:`2px solid ${selected.size === items.length ? "var(--pine)" : "var(--line)"}`,
                background: selected.size === items.length ? "var(--pine)" : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selected.size === items.length && <Icon name="check" size={12} color="#fff" />}
              </div>
              {selected.size === items.length ? "Deselect all" : "Select all"}
            </button>
            {selected.size > 0 && (
              <span style={{ fontSize:13, fontWeight:700, color:"var(--pine)" }}>
                {selected.size} selected
              </span>
            )}
          </div>
        )}

        {/* list */}
        <div style={{ overflowY:"auto", flex:1, padding:"8px 0" }}>
          {items === null && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>
          )}
          {items !== null && items.length === 0 && (
            <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--ink-3)" }}>
              <Icon name="circle-check" size={36} color="var(--ink-3)" />
              <div style={{ marginTop:10, fontWeight:600, fontSize:15 }}>Nothing to delete</div>
            </div>
          )}
          {(items||[]).map((it, i) => {
            const on = selected.has(it.id);
            const sub = cfg.sub(it);
            const dateStr = fmtDate(it.createdAt || it.date);
            return (
              <button key={it.id} onClick={() => toggle(it.id)}
                style={{ width:"100%", border:"none", background: on ? "var(--mint-bg)" : "transparent",
                  cursor:"pointer", display:"flex", alignItems:"center", gap:13,
                  padding:"13px 20px", textAlign:"left", fontFamily:"var(--sans)",
                  borderBottom: i < items.length-1 ? "1px solid var(--line)" : "none",
                  transition:"background .12s" }}>
                <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, transition:"all .15s",
                  border:`2px solid ${on ? "var(--pine)" : "var(--line)"}`,
                  background: on ? "var(--pine)" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {on && <Icon name="check" size={13} color="#fff" />}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14.5, color:"var(--ink)",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {cfg.label(it)}
                  </div>
                  <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>
                    {[sub, dateStr].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* footer */}
        <div style={{ padding:"12px 20px 16px", borderTop:"1px solid var(--line)", flexShrink:0 }}>
          {confirm ? (
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirm(false)} disabled={busy}
                style={{ flex:1, padding:"13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                  background:"var(--bg-2)", fontWeight:700, fontSize:15, fontFamily:"var(--sans)", cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={doDelete} disabled={busy}
                style={{ flex:2, padding:"13px", borderRadius:"var(--r-sm)", border:"none",
                  background:"var(--danger)", color:"#fff", fontWeight:800, fontSize:15,
                  fontFamily:"var(--sans)", cursor:busy?"wait":"pointer", opacity:busy?0.7:1 }}>
                {busy ? "Deleting…" : `Delete ${selected.size} item${selected.size!==1?"s":""}`}
              </button>
            </div>
          ) : (
            <button onClick={() => selected.size > 0 && setConfirm(true)}
              disabled={selected.size === 0}
              style={{ width:"100%", padding:"14px", borderRadius:"var(--r-sm)", border:"none",
                background: selected.size > 0 ? "var(--danger)" : "var(--bg-2)",
                color: selected.size > 0 ? "#fff" : "var(--ink-3)",
                fontWeight:800, fontSize:16, fontFamily:"var(--sans)",
                cursor: selected.size > 0 ? "pointer" : "default" }}>
              {selected.size > 0
                ? `Delete ${selected.size} selected item${selected.size!==1?"s":""}`
                : "Select items to delete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MORE ─────────────────────────────────────────────────────
function More({ nav, user, onLogout, canGoBack, onSwitchView, previewRole }) {
  const isAdmin      = AUTH.isAdmin();
  const isSupervisor = AUTH.isSupervisor();
  const isOperator   = AUTH.isOperator();
  const u            = user || AUTH.currentUser;

  const [msgCount,       setMsgCount]       = React.useState(0);
  const [receiveReports, setReceiveReports] = React.useState(u?.receiveReports !== false);
  const [manageSheet,    setManageSheet]    = React.useState(null); // "visits"|"reports"|"alerts"

  React.useEffect(() => {
    if (isOperator) AUTH.getAdminMessages().then(msgs => setMsgCount(msgs.length));
  }, [isOperator]);

  const toggleReceiveReports = async () => {
    const newVal = !receiveReports;
    setReceiveReports(newVal);
    if (u?.uid) {
      await FBUTIL.updateUserProfile(u.uid, { receiveReports: newVal });
      AUTH.currentUser = { ...AUTH.currentUser, receiveReports: newVal };
    }
  };

  const links = [
    { icon:"tools", label:"Vendors", sub:"Trusted partners", go:()=>nav.push("vendors") },
  ];

  const operatorLinks = [
    { icon:"building-estate", label:"Manage Properties",  sub:"Add, edit or remove properties", go:()=>nav.push("adminProperties") },
    { icon:"users",           label:"User Management",    sub:"Supervisors, operators, homeowners", go:()=>nav.push("adminHub") },
    { icon:"clipboard-list",  label:"Edit Checklist",     sub:"Inspection items & notes",       go:()=>nav.push("adminChecklist") },
    { icon:"message-2",       label:"Homeowner Messages", sub: msgCount > 0 ? `${msgCount} message${msgCount>1?"s":""}` : "No new messages", go:()=>nav.push("adminInbox") },
    { icon:"bell-exclamation",label:"Send Alert",         sub:"Notify homeowner",               go:()=>nav.push("sendAlert") },
  ];

  const viewLinks = onSwitchView ? [
    { icon:"hard-hat",  label:"Operator view",  sub:"See the app as your field team does",   go:()=>onSwitchView("operator") },
    { icon:"home-heart",label:"Homeowner view", sub:"See the app as a property owner does",  go:()=>onSwitchView("homeowner") },
  ] : [];

  const roleLabel = isAdmin ? "Administrator" : isSupervisor ? "Supervisor" : "Operator";

  return (
    <div className="hw-scroll">
      <AppHeader title="More" onBack={canGoBack ? nav.back : null} />

      {/* profile card — tap to edit */}
      <button onClick={() => nav.push("profileEdit")} className="tap"
        style={{ width:"calc(100% - 40px)", margin:"2px 20px 0", padding:"16px",
          display:"flex", alignItems:"center", gap:14,
          background:"var(--surface)", borderRadius:"var(--r-md)",
          border:"1px solid var(--line)", boxShadow:"var(--shadow-sm)",
          cursor:"pointer", textAlign:"left" }}>
        <div style={{ width:52, height:52, borderRadius:999, background:"var(--pine)", color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, flexShrink:0 }}>
          {u ? (u.initials || (u.name || "?").slice(0,2)).toUpperCase() : "MR"}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:17 }}>{u ? u.name : HW.brand.operator}</div>
          <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
            {u && <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999,
              background:"var(--mint-bg)", color:"var(--pine)" }}>{roleLabel}</span>}
            {HW.brand.region}
          </div>
        </div>
        <Icon name="chevron-right" size={18} color="var(--ink-3)" />
      </button>

      {/* view selector — admin only */}
      {onSwitchView && (
        <div style={{ padding:"12px 20px 0" }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:"var(--ink-3)",
            textTransform:"uppercase", letterSpacing:0.6, marginBottom:7 }}>Preview as</div>
          <div style={{ display:"flex", background:"var(--bg-2)", borderRadius:10,
            padding:3, border:"1px solid var(--line)", gap:2 }}>
            {[
              { role:"administrator", label:"Administrator", icon:"shield-check" },
              { role:"operator",      label:"Operator",      icon:"hard-hat"     },
              { role:"homeowner",     label:"Homeowner",     icon:"home-heart"   },
            ].map(opt => {
              const active = (previewRole || "administrator") === opt.role;
              return (
                <button key={opt.role} onClick={() => onSwitchView(opt.role)}
                  style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                    gap:3, padding:"8px 4px", border:"none", cursor:"pointer",
                    fontFamily:"var(--sans)", borderRadius:8, transition:"all .15s",
                    background: active ? "var(--surface)" : "transparent",
                    color: active ? "var(--pine)" : "var(--ink-3)",
                    boxShadow: active ? "var(--shadow-sm)" : "none" }}>
                  <Icon name={opt.icon} size={16} color={active ? "var(--pine)" : "var(--ink-3)"} />
                  <span style={{ fontSize:10, fontWeight: active ? 800 : 600, letterSpacing:0.1 }}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* receive reports toggle — shown to all operators */}
      {isOperator && (
        <div style={{ padding:"10px 20px 0" }}>
          <button onClick={toggleReceiveReports}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", width:"100%",
              background:"var(--surface)", borderRadius:"var(--r-sm)", border:"1px solid var(--line)",
              cursor:"pointer", textAlign:"left", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, transition:"all .2s",
              border:`2px solid ${receiveReports ? "var(--mint)" : "var(--line)"}`,
              background: receiveReports ? "var(--mint)" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {receiveReports && <Icon name="check" size={14} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>Receive operator reports</div>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:1 }}>
                {receiveReports ? "Email + text when operators submit" : "Currently off"}
              </div>
            </div>
          </button>
        </div>
      )}

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

      {/* supervisor / administrator section */}
      {isOperator && (
        <>
          <div className="eyebrow" style={{ margin:"22px 20px 8px" }}>
            <Icon name="shield-check" size={13} color="var(--pine)" style={{ verticalAlign:-1, marginRight:5 }} />
            {roleLabel}
          </div>
          <div className="card rise" style={{ margin:"0 20px", overflow:"hidden", animationDelay:"0.08s" }}>
            {operatorLinks.map((l,i) => (
              <button key={l.label} onClick={l.go} className="tap" style={{ width:"100%", border:"none", background:"transparent", cursor:"pointer",
                display:"flex", alignItems:"center", gap:13, padding:"14px 16px",
                borderBottom: i===operatorLinks.length-1?"none":"1px solid var(--line)", textAlign:"left" }}>
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

      {viewLinks.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin:"22px 20px 8px" }}>
            <Icon name="eye" size={13} color="var(--pine)" style={{ verticalAlign:-1, marginRight:5 }} />
            Switch view
          </div>
          <div className="card rise" style={{ margin:"0 20px", overflow:"hidden", animationDelay:"0.12s" }}>
            {viewLinks.map((l,i) => (
              <button key={l.label} onClick={l.go} className="tap" style={{ width:"100%", border:"none", background:"transparent", cursor:"pointer",
                display:"flex", alignItems:"center", gap:13, padding:"14px 16px",
                borderBottom: i===viewLinks.length-1?"none":"1px solid var(--line)", textAlign:"left" }}>
                <IconTile icon={l.icon} bg="var(--bg-2)" color="var(--ink-2)" size={36} r={10} iconSize={19} />
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

      {isAdmin && (
        <>
          <div className="eyebrow" style={{ margin:"22px 20px 8px" }}>
            <Icon name="alert-triangle" size={13} color="var(--danger)" style={{ verticalAlign:-1, marginRight:5 }} />
            Data Management
          </div>
          <div className="card rise" style={{ margin:"0 20px", overflow:"hidden" }}>
            {[
              { key:"visits",  icon:"calendar-event", label:"Scheduled visits",   sub:"Select visits to remove" },
              { key:"reports", icon:"file-report",    label:"Inspection reports", sub:"Select reports to delete" },
              { key:"alerts",  icon:"bell",           label:"Homeowner alerts",   sub:"Select alerts to remove" },
            ].map((item, i, arr) => (
              <button key={item.key} onClick={() => setManageSheet(item.key)}
                style={{ width:"100%", border:"none", background:"transparent", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:13, padding:"14px 16px", textAlign:"left",
                  borderBottom: i < arr.length-1 ? "1px solid var(--line)" : "none",
                  fontFamily:"var(--sans)" }}>
                <IconTile icon={item.icon} bg="var(--danger-bg)" color="var(--danger)" size={36} r={10} iconSize={18} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{item.label}</div>
                  <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>{item.sub}</div>
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

      {manageSheet && (
        <DataManageSheet type={manageSheet} onClose={() => setManageSheet(null)} />
      )}
      <div style={{ textAlign:"center", padding:"18px 18px 8px", fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>
        TPC Home Services · v{HW.version.number}
        <div style={{ fontSize:11, fontWeight:500, marginTop:2, color:"var(--ink-3)" }}>Build {HW.version.build} · {HW.version.date}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Inspection, Alerts, Vendors, More, ProfileEdit });
