// ─────────────────────────────────────────────────────────────
// TPC Home Services — property detail + live inspection
// ─────────────────────────────────────────────────────────────

// ── Edit Property Info Sheet ──────────────────────────────────
function EditPropertySheet({ prop, overrides, propId, onSave, onClose }) {
  const merged = { ...prop, ...overrides };
  const [name,       setName]      = useState(merged.name           || "");
  const [addr,       setAddr]      = useState(merged.address        || "");
  const [type,       setType]      = useState(merged.type           || "Single Family");
  const [freq,       setFreq]      = useState(merged.freq           || "Monthly");
  const [ownerName,  setOwnerName] = useState(merged.owner?.name    || "");
  const [ownerEmail, setOwnerEmail]= useState(merged.owner?.email   || "");
  const [ownerPhone, setOwnerPhone]= useState(merged.owner?.phone   || "");
  const [busy,       setBusy]      = useState(false);
  const [photoUrl,   setPhotoUrl]  = useState(merged.photoUrl       || "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = React.useRef(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !propId) return;
    setPhotoUploading(true);
    try {
      const url = await FBUTIL.uploadPropertyCoverPhoto(propId, file);
      setPhotoUrl(url);
    } catch(err) {
      console.error("Photo upload failed", err);
    }
    setPhotoUploading(false);
  };

  const TYPES = ["Single Family", "Condo", "Multi-unit", "Vacation", "Business"];
  const FREQS = ["Weekly", "Bi-weekly", "Monthly", "Quarterly"];
  const [customType, setCustomType] = useState(!TYPES.includes(merged.type) ? (merged.type || "") : "");
  const [customFreq, setCustomFreq] = useState(!FREQS.includes(merged.freq) ? (merged.freq || "") : "");

  const inputStyle = {
    width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box",
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const owner = {
      ...(merged.owner || {}),
      name:  ownerName.trim(),
      email: ownerEmail.trim().toLowerCase(),
      phone: ownerPhone.trim(),
    };
    const effectiveType = type === "__custom__" ? customType.trim() || type : type;
    const effectiveFreq = freq === "__other__"  ? customFreq.trim() || freq : freq;
    await onSave({ name, address: addr, type: effectiveType, freq: effectiveFreq, owner, ...(photoUrl && { photoUrl }) });
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"24px 20px max(36px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:16, maxHeight:"90vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>Edit property</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {/* property photo */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:8 }}>Property photo</div>
          <div style={{ position:"relative", height:130, borderRadius:"var(--r-sm)", overflow:"hidden",
            background: photoUrl ? "transparent" : merged.grad || "linear-gradient(135deg,#1B4332,#2C6B5C)",
            cursor:"pointer" }}
            onClick={() => !photoUploading && photoInputRef.current?.click()}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              : <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:6 }}>
                  <Icon name="home" size={48} color="rgba(255,255,255,0.3)" />
                  <span style={{ fontSize:12.5, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>Tap to add photo</span>
                </div>
            }
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.18)",
              display:"flex", alignItems:"center", justifyContent:"center",
              opacity: photoUploading ? 1 : 0, transition:"opacity .2s" }}>
              {photoUploading && <span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>Uploading…</span>}
            </div>
            <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.55)",
              borderRadius:8, padding:"5px 11px", fontSize:12, fontWeight:700, color:"#fff",
              display:"flex", alignItems:"center", gap:5, pointerEvents:"none" }}>
              <Icon name="camera" size={13} color="#fff" />
              {photoUrl ? "Change photo" : "Add photo"}
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display:"none" }}
            onChange={handlePhotoChange} />
        </div>

        {/* property fields */}
        {[
          { label:"Property name", val:name, set:setName, ph:"e.g. Gulf Breeze Villa" },
          { label:"Address",       val:addr, set:setAddr, ph:"123 Main St" },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
            <input value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)} style={inputStyle} />
          </div>
        ))}

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Property type</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ padding:"8px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: type===t ? "var(--pine)" : "var(--bg-2)",
                  color: type===t ? "#fff" : "var(--ink-2)" }}>{t}</button>
            ))}
            <button onClick={() => setType("__custom__")}
              style={{ padding:"8px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
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

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Visit frequency</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {FREQS.map(f => (
              <button key={f} onClick={() => setFreq(f)}
                style={{ padding:"8px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: freq===f ? "var(--pine)" : "var(--bg-2)",
                  color: freq===f ? "#fff" : "var(--ink-2)" }}>{f}</button>
            ))}
            <button onClick={() => setFreq("__other__")}
              style={{ padding:"8px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
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

        {/* homeowner fields */}
        <div style={{ borderTop:"1px solid var(--line)", paddingTop:16, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:13, fontWeight:800, color:"var(--ink-2)", display:"flex", alignItems:"center", gap:7 }}>
            <Icon name="user-heart" size={16} color="var(--pine-2)" /> Homeowner info
          </div>
          {[
            { label:"Owner name",  val:ownerName,  set:setOwnerName,  ph:"Jane Smith",           type:"text" },
            { label:"Email",       val:ownerEmail, set:setOwnerEmail, ph:"jane@example.com",     type:"email" },
            { label:"Phone",       val:ownerPhone, set:setOwnerPhone, ph:"(239) 555-0100",       type:"tel" },
          ].map(f => (
            <div key={f.label}>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
              <input value={f.val} type={f.type} placeholder={f.ph}
                onChange={e => f.set(e.target.value)} style={inputStyle} />
            </div>
          ))}
        </div>

        <button onClick={save} disabled={busy || !name.trim()}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none", marginTop:4,
            background: name.trim() ? "var(--pine)" : "var(--bg-2)",
            color: name.trim() ? "#fff" : "var(--ink-3)",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
            cursor: name.trim() ? "pointer" : "default", opacity: busy ? 0.7 : 1 }}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ── Weather code → label + icon mapping (Open-Meteo WMO codes) ──
const WMO = {
  0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
  45:"Foggy",48:"Icy fog",
  51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",
  61:"Light rain",63:"Rain",65:"Heavy rain",
  71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",
  80:"Rain showers",81:"Rain showers",82:"Violent showers",
  85:"Snow showers",86:"Heavy snow showers",
  95:"Thunderstorm",96:"Thunderstorm w/ hail",99:"Thunderstorm w/ heavy hail",
};
const WMO_ICON = {
  0:"sun",1:"sun",2:"cloud-sun",3:"cloud",
  45:"cloud-fog",48:"cloud-fog",
  51:"cloud-drizzle",53:"cloud-drizzle",55:"cloud-drizzle",
  61:"cloud-rain",63:"cloud-rain",65:"cloud-rain",
  71:"snowflake",73:"snowflake",75:"snowflake",77:"snowflake",
  80:"cloud-rain",81:"cloud-rain",82:"cloud-rain",
  85:"snowflake",86:"snowflake",
  95:"cloud-storm",96:"cloud-storm",99:"cloud-storm",
};

function PropertyWeather({ address }) {
  const [wx,     setWx]     = useState(null);  // { temp, windspeed, code }
  const [alerts, setAlerts] = useState(null);  // [] or null=loading
  const [error,  setError]  = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    // 1. Extract city + state from address, geocode via Open-Meteo (CORS-friendly, no key).
    //    If city lookup fails, fall back to Charlotte County center (TPC service area).
    const extractCityState = (addr) => {
      const parts = addr.split(",").map(s => s.trim()).filter(Boolean);
      let city = null, state = null;
      for (const p of parts) {
        if (/^\d{5}/.test(p)) continue;                    // zip
        if (/^[A-Z]{2}(\s+\d{5})?$/.test(p)) { state = p.slice(0,2); continue; } // "FL" or "FL 33921"
        if (/florida/i.test(p)) { state = "FL"; continue; }
        if (/^\d/.test(p)) continue;                       // street line
        if (!city) city = p;                               // first text-only part = city
      }
      return { city, state: state || "FL" };
    };
    const { city, state } = extractCityState(address);
    const SERVICE_AREA = { lat: 26.93, lon: -82.06 }; // Charlotte County, FL fallback

    const doGeocode = () => {
      if (!city) return Promise.resolve(null);
      const q = `${city}, ${state}`;
      return fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`)
        .then(r => r.json())
        .then(data => {
          // Filter results to US + prefer FL match
          const results = (data?.results || []).filter(r => r.country_code === "US");
          return results.find(r => r.admin1?.toLowerCase().includes("florida")) || results[0] || null;
        });
    };

    doGeocode()
    .then(async loc => {
      if (cancelled) return;
      const lat = loc ? loc.latitude  : SERVICE_AREA.lat;
      const lon = loc ? loc.longitude : SERVICE_AREA.lon;

      // 2. Current weather + NWS alerts in parallel
      const [wxRes, alertRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`).then(r => r.json()),
        fetch(`https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`, {
          headers: { "Accept": "application/geo+json", "User-Agent": "TPC-HomeWatch/2.3 (marty@truexpreferredconstruction.com)" }
        }).then(r => r.json()).catch(() => ({ features: [] })),
      ]);

      if (cancelled) return;
      if (wxRes.current_weather) {
        const cw = wxRes.current_weather;
        setWx({ temp: Math.round(cw.temperature), windspeed: Math.round(cw.windspeed), code: cw.weathercode });
      }
      setAlerts((alertRes.features || []).map(f => f.properties));
    })
    .catch(() => { if (!cancelled) setError(true); });

    return () => { cancelled = true; };
  }, [address]);

  const NWS_SEV_COLOR = { Extreme:"#C0392B", Severe:"#E74C3C", Moderate:"#E67E22", Minor:"#F1C40F" };

  return (
    <div style={{ marginTop:14 }}>
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0 10px" }}>
        <Icon name="cloud" size={16} color="var(--ink-3)" />
        <span style={{ fontSize:12, fontWeight:800, letterSpacing:0.06, textTransform:"uppercase", color:"var(--ink-3)" }}>
          Weather
        </span>
      </div>

      <div className="card" style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>

        {/* Current conditions */}
        {wx === null && !error && (
          <div style={{ color:"var(--ink-3)", fontSize:13.5 }}>Loading weather…</div>
        )}
        {error && (
          <div style={{ color:"var(--ink-3)", fontSize:13.5 }}>Weather unavailable</div>
        )}
        {wx && (
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <Icon name={WMO_ICON[wx.code] || "cloud"} size={36} color="var(--pine)" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:28, fontWeight:800, letterSpacing:-1, lineHeight:1 }}>{wx.temp}°F</div>
              <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:3 }}>
                {WMO[wx.code] || "—"} · Wind {wx.windspeed} mph
              </div>
            </div>
          </div>
        )}

        {/* Severe weather alerts */}
        {alerts !== null && alerts.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ width:"100%", height:1, background:"var(--line)" }} />
            {alerts.map((a, i) => {
              const color = NWS_SEV_COLOR[a.severity] || "#7F8C8D";
              return (
                <div key={i} style={{ borderRadius:"var(--r-sm)", background:"#FDEDEC",
                  border:`1.5px solid ${color}`, padding:"10px 12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <Icon name="alert-triangle" size={15} color={color} />
                    <span style={{ fontWeight:800, fontSize:13.5, color }}>{a.event}</span>
                    <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, color,
                      background:"white", padding:"1px 7px", borderRadius:999 }}>{a.severity}</span>
                  </div>
                  <div style={{ fontSize:12.5, color:"var(--ink-2)", lineHeight:1.45 }}>
                    {a.headline || a.description?.slice(0,140) || ""}
                    {a.description?.length > 140 ? "…" : ""}
                  </div>
                  {a.expires && (
                    <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:5 }}>
                      Expires {new Date(a.expires).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {alerts !== null && alerts.length === 0 && wx && (
          <div style={{ display:"flex", alignItems:"center", gap:6, paddingTop:2 }}>
            <div style={{ width:"100%", height:1, background:"var(--line)", position:"absolute", left:0 }} />
            <div style={{ display:"flex", alignItems:"center", gap:6, width:"100%", borderTop:"1px solid var(--line)", paddingTop:10 }}>
              <Icon name="circle-check" size={15} color="var(--ok)" />
              <span style={{ fontSize:13, color:"var(--ink-3)" }}>No active weather alerts</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROPERTY DETAIL ──────────────────────────────────────────
function PropertyDetail({ id, nav, user }) {
  const seedBase = HW.properties.find(x => x.id === id) || null;
  const [overrides,     setOverrides]     = useState(null);
  const [fsProperty,    setFsProperty]    = useState(null); // full Firestore doc for non-seed properties
  const [sheet,         setSheet]         = useState(false);
  const [editProp,      setEditProp]      = useState(false);
  const [accessEditing, setAccessEditing] = useState(false);
  const [reveal,        setReveal]        = useState(false);
  const [photoGroups,   setPhotoGroups]   = useState(null);
  const [nextVisit,     setNextVisit]     = useState(undefined); // undefined = loading
  const [lastReport,    setLastReport]    = useState(undefined);
  const [accessLog,     setAccessLog]     = useState(null); // null = not yet loaded

  useEffect(() => {
    // Always load overrides and media
    FBUTIL.getPropertyOverrides(String(id)).then(o => setOverrides(o || {}));
    FBUTIL.getPropertyPhotos(String(id)).then(setPhotoGroups);
    FBUTIL.getLastReportForProperty(String(id)).then(r => setLastReport(r || null));
    // For Firestore-only properties (no seed match), load the full property doc
    if (!seedBase) {
      FBUTIL.getProperty(String(id)).then(p => { if (p) setFsProperty(p); });
    }
  }, [id]);

  const recentPhotos = (photoGroups || []).flatMap(g => g.urls).slice(0, 6);

  // Seed properties: merge overrides on top of seed data
  // Firestore-only: use fsProperty as base, merge overrides on top
  const base = seedBase
    ? (overrides ? { ...seedBase, ...overrides, access: { ...(seedBase.access||{}), ...(overrides.access||{}) } } : seedBase)
    : (fsProperty ? { ...fsProperty, ...(overrides||{}), access: { ...(fsProperty.access||{}), ...((overrides||{}).access||{}) } } : null);
  const loading = !base;
  const p    = base || { name:"Loading…", address:"", access:{ lockbox:"", alarm:"", notes:"" }, owner:{ name:"", email:"", phone:"", base:"" } };

  // Load next scheduled visit once we know the property name.
  // Schedule items store date as a label ("Jun 25") not ISO — convert with year-rollover.
  useEffect(() => {
    if (!p.name || p.name === "Loading…") return;
    const today = new Date().toISOString().slice(0, 10);
    const labelToISO = (label) => {
      if (!label) return "";
      const yr = new Date().getFullYear();
      let d = new Date(`${label} ${yr}`);
      if (isNaN(d.getTime())) return "";
      // If more than 60 days in the past, the label refers to next year
      if (d < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) d = new Date(`${label} ${yr + 1}`);
      return d.toISOString().slice(0, 10);
    };
    FBUTIL.listSchedule().then(items => {
      const future = items
        .filter(s => s.prop === p.name && labelToISO(s.date) >= today)
        .sort((a, b) => labelToISO(a.date).localeCompare(labelToISO(b.date)));
      setNextVisit(future[0] || null);
    });
  }, [p.name]);
  const role      = (user || AUTH.currentUser || {}).role || "operator";
  const canSeeAccess = role === "administrator" || role === "operator";
  const isAdmin   = role === "administrator";
  const canManage = role === "administrator" || role === "supervisor";

  const handleReveal = (updater) => {
    setReveal(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next && !prev) {
        FBUTIL.logAccessView(id, p.name);
        if (canManage) FBUTIL.getAccessLog(id).then(setAccessLog);
      }
      return next;
    });
  };

  const contacts = overrides?.contacts || [];
  const saveContacts = async (next) => {
    const updated = { ...overrides, contacts: next };
    await FBUTIL.savePropertyOverrides(id, { contacts: next });
    setOverrides(updated);
  };
  const [confirmRemove,   setConfirmRemove]   = useState(false);
  const [assignOwner,     setAssignOwner]     = useState(false);
  const [assignChecklist, setAssignChecklist] = useState(false);
  const [stormSched,      setStormSched]      = useState(null); // null | "Storm Prep" | "Post-Storm Check"

  const savePropertyInfo = async (data) => {
    const ov = overrides || {};
    const oldFreq = (ov.freq || p.freq || "").toLowerCase().trim();
    const newFreq = (data.freq || "").toLowerCase().trim();
    const oldName = ov.name || p.name;
    const newName = data.name || oldName;
    const updated = { ...ov, ...data };
    await FBUTIL.savePropertyOverrides(String(id), updated);
    setOverrides(updated);
    if (oldFreq && newFreq && oldFreq !== newFreq) {
      await FBUTIL.reschedulePropertyUpcoming(oldName, newName, data.freq);
    }
  };

  if (loading) return (
    <div className="hw-scroll" style={{ background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", color:"var(--ink-3)", padding:"60px 20px" }}>
        <Icon name="home" size={40} color="var(--ink-3)" />
        <div style={{ marginTop:12, fontWeight:600, fontSize:15 }}>Loading property…</div>
      </div>
    </div>
  );

  const menuActions = [
    { icon:"building-estate", label:"Edit property info",    sub:"Name, address, type, frequency", onClick:() => setEditProp(true) },
    { icon:"key",             label:"Edit access & codes",   sub:"Lockbox, alarm, entry notes",    onClick:() => setAccessEditing(true) },
    { icon:"bell-exclamation",label:"Send homeowner alert",  sub:"Notify owner of an issue",       onClick:() => nav.push("sendAlert", { propId: id }) },
    ...(canManage ? [
      { icon:"user-heart",    label:"Assign homeowner",      sub:"Link a homeowner account",       onClick:() => { setSheet(false); setAssignOwner(true); } },
      { icon:"clipboard-list",label:"Assign checklist",      sub:"Choose inspection checklist",    onClick:() => { setSheet(false); setAssignChecklist(true); } },
      { sep: true },
      { icon:"cloud-storm",   label:"Schedule storm prep",   sub:"Add storm prep visit to calendar", onClick:() => { setSheet(false); setStormSched("Storm Prep"); } },
      { icon:"sun",           label:"Schedule post-storm",   sub:"Add post-storm check to calendar", onClick:() => { setSheet(false); setStormSched("Post-Storm Check"); } },
    ] : []),
    ...(isAdmin ? [
      { sep: true },
      { icon:"clipboard-list", label:"Manage checklists",    sub:"Create & edit named checklists", onClick:() => nav.push("adminChecklist") },
    ] : []),
    ...(canManage ? [
      { sep: true },
      { icon:"circle-plus",   label:"Add new property",      sub:"Create another property",        onClick:() => nav.push("adminProperties") },
      { icon:"trash",         label:"Remove this property",  sub:"Permanently delete",             onClick:() => { setSheet(false); setConfirmRemove(true); }, danger:true },
    ] : []),
    { sep: true },
    { icon:"logout", label:"Sign out", onClick:() => AUTH.logout(), danger:true },
  ];

  return (
    <div className="hw-scroll" style={{ background:"var(--bg)" }}>
      <DrillHeader onBack={nav.back}
        right={
          <button onClick={() => setSheet(true)}
            style={{ width:38, height:38, borderRadius:999, border:"none", background:"var(--surface)",
              color:"var(--ink-2)", boxShadow:"var(--shadow-sm)", display:"flex",
              alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="dots" size={20} />
          </button>
        } />

      {/* hero card */}
      <div style={{ margin:"2px 20px 0", borderRadius:"var(--r-lg)", color:"#fff", padding:"18px 20px 20px", position:"relative", overflow:"hidden", boxShadow:"var(--shadow)",
        background: p.photoUrl ? "transparent" : p.grad }}>
        {p.photoUrl && <img src={p.photoUrl} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />}
        {p.photoUrl && <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.18) 100%)" }} />}
        {!p.photoUrl && <Icon name="home" size={190} style={{ position:"absolute", right:-44, top:-10, opacity:0.1 }} color="#fff" />}
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
        {p.alert && (
          <div className="rise" style={{ background:"var(--danger-bg)", border:"1px solid rgba(178,58,46,0.18)", borderRadius:"var(--r)", padding:"15px 16px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, color:"var(--danger)", fontWeight:800, fontSize:14.5 }}>
              <Icon name="alert-triangle-filled" size={19} /> Active alert
            </div>
            <p style={{ margin:"9px 0 13px", fontSize:13.5, color:"#7d3127", lineHeight:1.5 }}>{p.alert}</p>
            <div style={{ display:"flex", gap:9 }}>
              <button className="btn btn-primary" onClick={() => nav.push("sendAlert", { propId: id })}
                style={{ flex:1, background:"var(--danger)", padding:"11px", fontSize:14 }}><Icon name="clipboard-plus" size={17} color="#fff" /> Log issue</button>
              <button className="btn btn-light" style={{ flex:1, padding:"11px", fontSize:14 }} onClick={()=>nav.go("vendors")}><Icon name="tool" size={17} /> Call vendor</button>
            </div>
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={() => nav.push("inspection", { propId: id })} style={{ padding:"16px", fontSize:16.5, boxShadow:"0 8px 22px rgba(27,67,50,0.26)" }}>
          <Icon name="circle-check" size={21} color="#fff" /> Start inspection
        </button>
        <div style={{ display:"flex", gap:10, marginTop:10 }}>
          <button className="btn btn-light" style={{ flex:1, padding:"12px" }}
            onClick={() => { if (p.owner?.phone) window.location.href = `tel:${p.owner.phone}`; }}
            disabled={!p.owner?.phone}>
            <Icon name="phone" size={18} /> Call owner
          </button>
          <button className="btn btn-light" style={{ flex:1, padding:"12px" }}
            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`, "_blank")}
            disabled={!p.address}>
            <Icon name="navigation" size={18} /> Directions
          </button>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:10 }}>
          <button className="btn btn-light" style={{ flex:1, padding:"12px", color:"#E67E22", borderColor:"rgba(230,126,34,0.3)" }}
            onClick={() => nav.push("inspection", { propId: id, visitName: "Storm Prep" })}>
            <Icon name="cloud-storm" size={18} color="#E67E22" /> Storm prep
          </button>
          <button className="btn btn-light" style={{ flex:1, padding:"12px", color:"#2980B9", borderColor:"rgba(41,128,185,0.3)" }}
            onClick={() => nav.push("inspection", { propId: id, visitName: "Post-Storm Check" })}>
            <Icon name="sun" size={18} color="#2980B9" /> Post-storm
          </button>
        </div>

        {canSeeAccess && (
          <Card title="Owner" icon="user-circle">
            <Row k={p.owner.name} v={`Home base · ${p.owner.base}`} stacked />
            <Hr />
            <ActionRow icon="phone" label={p.owner.phone} action="Call" tone="var(--pine-2)" />
            <Hr />
            <ActionRow icon="mail" label={p.owner.email} action="Email" tone="var(--pine-2)" />
          </Card>
        )}

        {canSeeAccess && (
          <AccessCard prop={p} reveal={reveal} setReveal={handleReveal} role={role}
            forceEdit={accessEditing} onEditClose={() => setAccessEditing(false)}
            onSave={async (accessData) => {
              const updated = { ...overrides, access: { ...(overrides?.access||{}), ...accessData } };
              await FBUTIL.savePropertyOverrides(id, updated);
              setOverrides(updated);
            }} />
        )}

        {canSeeAccess && (
          <PropertyContactsCard contacts={contacts} canEdit={canManage} onSave={saveContacts} />
        )}

        <Card title="Service plan" icon="calendar-repeat">
          <Row k="Plan" v={`${p.freq} watch`} />
          <Hr />
          <Row k="Next visit" v={
            nextVisit === undefined ? "Loading…" :
            nextVisit ? `${nextVisit.date} · ${nextVisit.time}` :
            "Not scheduled"
          } />
          <Hr />
          {(() => {
            const total   = lastReport?.allItems?.length || 0;
            const checked = lastReport?.checkedItems?.length || 0;
            const pct     = total > 0 ? Math.round(checked / total * 100) : 0;
            return (
              <div style={{ padding:"13px 0 4px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13.5, marginBottom:8 }}>
                  <span style={{ fontWeight:600, color:"var(--ink-2)" }}>Last inspection</span>
                  <span style={{ fontWeight:800 }}>
                    {lastReport === undefined ? "Loading…" :
                     lastReport === null      ? "No inspection yet" :
                     `${checked} / ${total} complete`}
                  </span>
                </div>
                {lastReport != null && total > 0 && (
                  <div className="bar"><span style={{ width:`${pct}%` }} /></div>
                )}
              </div>
            );
          })()}
        </Card>

        {p.address && <PropertyWeather address={p.address} />}

        {canManage && (
          <AccessLogCard propId={id} log={accessLog} />
        )}

        <Card title="Recent activity" icon="history">
          <div style={{ position:"relative", paddingLeft:4 }}>
            {HW.history.map((h,i) => <TimelineItem key={i} h={h} last={i===HW.history.length-1} />)}
          </div>
        </Card>

        <SectionTitle action="View all" onAction={() => nav.push("photoGallery", { id: id, name: p.name })}
          style={{ padding:0, margin:"22px 0 11px" }}>Latest photos</SectionTitle>
        {photoGroups === null ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ink-3)", fontSize:13 }}>Loading…</div>
        ) : photoGroups.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"var(--ink-3)", fontSize:13 }}>
            No photos yet — they'll appear here after the next inspection.
          </div>
        ) : (() => {
          const g = photoGroups[0];
          const fmtDate = (ts) => { if (!ts) return ""; try { const d = ts.toDate ? ts.toDate() : new Date(ts); if (d.getFullYear() < 2000) return ""; return d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" }); } catch { return ""; } };
          return (
            <button onClick={() => nav.push("photoGallery", { id: id, name: p.name, openGroupId: g.reportId })}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                borderRadius:"var(--r)", border:"none", cursor:"pointer", textAlign:"left",
                fontFamily:"var(--sans)", background:"var(--surface)", boxShadow:"var(--shadow)" }}>
              <div style={{ width:54, height:54, borderRadius:12, flexShrink:0, overflow:"hidden",
                background:"var(--bg-2)", border:"2px solid var(--pine)" }}>
                <img src={g.urls[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)", letterSpacing:-0.2 }}>
                  {fmtDate(g.submittedAt)}
                  <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:"2px 8px",
                    borderRadius:999, background:"var(--pine)", color:"#fff", verticalAlign:"middle" }}>Latest</span>
                </div>
                <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2, fontWeight:600 }}>
                  {g.visitName} · {g.urls.length} photo{g.urls.length !== 1 ? "s" : ""} · {g.submittedBy}
                </div>
              </div>
              <Icon name="chevron-right" size={18} color="var(--ink-3)" />
            </button>
          );
        })()}
        <div style={{ height:14 }} />
      </div>

      {/* Admin / Supervisor quick links */}
      {canManage && (
        <div style={{ padding:"0 20px 24px" }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.08, textTransform:"uppercase",
            color:"var(--ink-3)", marginBottom:10 }}>Management</div>
          <div className="card" style={{ overflow:"hidden" }}>
            {[
              { icon:"calendar-event",  label:"Schedule",          sub:"View & manage visits",              go:() => nav.go("schedule") },
              { icon:"file-report",     label:"Inspection Reports", sub:"Review submitted reports",          go:() => nav.go("operatorReports") },
              { icon:"bell",            label:"Alerts",             sub:"Homeowner alerts",                  go:() => nav.go("alerts") },
              { icon:"building-estate", label:"All Properties",     sub:"Manage property list",              go:() => nav.push("adminProperties") },
              { icon:"clipboard-list",  label:"Checklists",         sub:"Create & edit checklists",         go:() => nav.push("adminChecklist") },
              ...(isAdmin ? [
                { icon:"users",         label:"User Management",    sub:"Supervisors, operators, homeowners", go:() => nav.push("adminHub") },
                { icon:"inbox",         label:"Admin Inbox",        sub:"Messages from homeowners",           go:() => nav.push("adminInbox") },
              ] : []),
              { icon:"tool",            label:"Vendors",            sub:"Service contacts",                  go:() => nav.go("vendors") },
            ].map((item, i, arr) => (
              <button key={item.label} onClick={item.go}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 16px",
                  width:"100%", border:"none", background:"transparent", textAlign:"left",
                  cursor:"pointer", fontFamily:"var(--sans)",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ width:34, height:34, borderRadius:10, background:"var(--bg-2)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={item.icon} size={17} color="var(--pine-2)" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14.5, color:"var(--ink)" }}>{item.label}</div>
                  <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:1 }}>{item.sub}</div>
                </div>
                <Icon name="chevron-right" size={17} color="var(--ink-3)" />
              </button>
            ))}
          </div>
        </div>
      )}

      {sheet && (
        <ActionSheet title={p.name} actions={menuActions} onClose={() => setSheet(false)} />
      )}
      {editProp && (
        <EditPropertySheet prop={base} overrides={overrides||{}} propId={id}
          onSave={savePropertyInfo} onClose={() => setEditProp(false)} />
      )}
      {assignOwner && (
        <AssignHomeownerSheet prop={base} overrides={overrides||{}} propId={id}
          onClose={() => setAssignOwner(false)}
          onAssigned={(ownerData) => {
            setOverrides(prev => ({ ...(prev||{}), ...ownerData }));
            setAssignOwner(false);
          }} />
      )}
      {assignChecklist && (
        <AssignChecklistSheet propId={id} currentChecklistId={overrides?.checklistId || null}
          onClose={() => setAssignChecklist(false)}
          onAssigned={(checklistId) => {
            setOverrides(prev => ({ ...(prev||{}), checklistId }));
            setAssignChecklist(false);
          }} />
      )}
      {confirmRemove && (
        <ConfirmSheet
          message={`Remove "${p.name}"? This cannot be undone.`}
          onConfirm={async () => {
            await FBUTIL.deleteProperty(id);
            setConfirmRemove(false);
            nav.back();
          }}
          onCancel={() => setConfirmRemove(false)}
        />
      )}
      {stormSched && (
        <ScheduleSheet
          defaultProp={p.name}
          defaultType={stormSched}
          onSave={async (item) => {
            const { dateIso, ...data } = item;
            await FBUTIL.createScheduleItem(data);
            setStormSched(null);
          }}
          onClose={() => setStormSched(null)}
        />
      )}
    </div>
  );
}

// ── Assign Homeowner Sheet ───────────────────────────────────
function AssignHomeownerSheet({ prop, overrides, propId, onClose, onAssigned }) {
  const { useState, useEffect } = React;
  const [homeowners, setHomeowners] = useState(null);
  const [search,     setSearch]     = useState("");
  const [busy,       setBusy]       = useState(false);
  const [tab,        setTab]        = useState("list"); // "list" | "invite"
  const [invName,    setInvName]    = useState("");
  const [invEmail,   setInvEmail]   = useState("");
  const [invPhone,   setInvPhone]   = useState("");
  const [invDone,    setInvDone]    = useState(false);
  const [err,        setErr]        = useState("");

  const current = overrides?.homeownerId || prop?.homeownerId;

  useEffect(() => {
    FBUTIL.listUsers().then(all => setHomeowners(all.filter(u => u.role === "homeowner")));
  }, []);

  const filtered = (homeowners || []).filter(u => {
    const q = search.toLowerCase();
    return !q || (u.name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q);
  });

  const assign = async (uid, ownerInfo) => {
    if (!propId) return;
    setBusy(true);
    const data = { homeownerId: uid, owner: ownerInfo };
    await FBUTIL.savePropertyOverrides(String(propId), data);
    setBusy(false);
    onAssigned(data);
  };

  const unassign = async () => {
    if (!propId) return;
    setBusy(true);
    await FBUTIL.savePropertyOverrides(String(propId), { homeownerId: null, owner: null });
    setBusy(false);
    onAssigned({ homeownerId: null, owner: null });
  };

  const sendInvite = async () => {
    if (!invName.trim() || !invEmail.trim()) { setErr("Name and email are required."); return; }
    setErr(""); setBusy(true);
    await FBUTIL.createInvitation({
      name:       invName.trim(),
      email:      invEmail.trim().toLowerCase(),
      phone:      invPhone.trim(),
      role:       "homeowner",
      initials:   invName.trim().slice(0,2).toUpperCase(),
      propertyId: propId || null,
      receiveReports: true,
    });
    setBusy(false);
    setInvDone(true);
  };

  const inputStyle = {
    width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:14.5, fontFamily:"var(--sans)",
    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", flexDirection:"column" }}>
      <div onClick={onClose} style={{ flex:1, background:"rgba(0,0,0,0.38)" }} />
      <div style={{ background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"0 0 env(safe-area-inset-bottom,0)", maxHeight:"88vh", display:"flex", flexDirection:"column" }}>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"18px 20px 14px", borderBottom:"1px solid var(--line)" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:18 }}>Assign homeowner</div>
            <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2 }}>{prop?.name || "This property"}</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:999, border:"none",
            background:"var(--bg-2)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={18} color="var(--ink-2)" />
          </button>
        </div>

        {/* tabs */}
        <div style={{ display:"flex", gap:8, padding:"12px 20px 0" }}>
          {[["list","Select existing"],["invite","Invite new"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ flex:1, padding:"9px", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer",
                fontWeight:700, fontSize:13.5, fontFamily:"var(--sans)",
                background: tab===id ? "var(--pine)" : "var(--bg-2)",
                color: tab===id ? "#fff" : "var(--ink-2)" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"14px 20px 20px" }}>
          {tab === "list" && (
            <>
              {/* current assignment */}
              {current && (() => {
                const hw = (homeowners||[]).find(u => u.id === current);
                return hw ? (
                  <div style={{ padding:"12px 15px", borderRadius:"var(--r)", background:"var(--mint-bg)",
                    marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:38, height:38, borderRadius:999, background:"var(--pine)",
                      color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                      fontWeight:800, fontSize:14, flexShrink:0 }}>{hw.initials||hw.name.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14 }}>{hw.name}</div>
                      <div style={{ fontSize:12, color:"var(--ink-3)" }}>Currently assigned</div>
                    </div>
                    <button onClick={unassign} disabled={busy}
                      style={{ fontSize:12, fontWeight:700, padding:"6px 12px", borderRadius:999, border:"none",
                        background:"var(--danger-bg)", color:"var(--danger)", cursor:"pointer", fontFamily:"var(--sans)" }}>
                      Remove
                    </button>
                  </div>
                ) : null;
              })()}

              {/* search */}
              <input value={search} placeholder="Search homeowners…"
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom:10 }} />

              {homeowners === null && (
                <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-3)" }}>Loading…</div>
              )}

              {homeowners !== null && filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 0", color:"var(--ink-3)" }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>No homeowners found</div>
                  <div style={{ fontSize:13, marginTop:4 }}>Switch to "Invite new" to add one</div>
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtered.map(u => {
                  const isAssigned = u.id === current;
                  return (
                    <button key={u.id} onClick={() => !isAssigned && assign(u.id, { name:u.name, email:u.email, phone:u.phone||"" })}
                      disabled={busy || isAssigned}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 15px",
                        borderRadius:"var(--r)", border: isAssigned ? "2px solid var(--pine)" : "1.5px solid var(--line)",
                        background: isAssigned ? "var(--mint-bg)" : "var(--surface)",
                        cursor: isAssigned ? "default" : "pointer", textAlign:"left", width:"100%",
                        fontFamily:"var(--sans)", opacity: busy ? 0.6 : 1 }}>
                      <div style={{ width:40, height:40, borderRadius:999,
                        background: isAssigned ? "var(--pine)" : "var(--bg-2)",
                        color: isAssigned ? "#fff" : "var(--ink-2)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontWeight:800, fontSize:14, flexShrink:0 }}>{u.initials||u.name.slice(0,2).toUpperCase()}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)" }}>{u.name}</div>
                        <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2 }}>{u.email}</div>
                        {u.phone && <div style={{ fontSize:12, color:"var(--ink-3)" }}>{u.phone}</div>}
                      </div>
                      {isAssigned
                        ? <span className="pill pill-ok" style={{ fontSize:11, flexShrink:0 }}>Assigned</span>
                        : <Icon name="chevron-right" size={18} color="var(--ink-3)" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "invite" && (
            <>
              {invDone ? (
                <div style={{ textAlign:"center", padding:"40px 0" }}>
                  <div style={{ width:60, height:60, borderRadius:999, background:"var(--mint-bg)",
                    display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <Icon name="circle-check-filled" size={32} color="var(--ok)" />
                  </div>
                  <div style={{ fontSize:18, fontWeight:800 }}>Invitation sent!</div>
                  <div style={{ fontSize:14, color:"var(--ink-2)", marginTop:8, lineHeight:1.5 }}>
                    {invName.trim()} can now sign up at the app. They'll be automatically linked to this property when they create their account.
                  </div>
                  <button onClick={onClose}
                    style={{ marginTop:22, padding:"13px 32px", borderRadius:"var(--r-sm)", border:"none",
                      background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
                      fontFamily:"var(--sans)", cursor:"pointer" }}>
                    Done
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r-sm)", padding:"12px 14px",
                    fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>
                    An invitation will be created. When the homeowner signs up, they'll be automatically linked to <strong>{prop?.name || "this property"}</strong>.
                  </div>

                  {[
                    { label:"Full name",    val:invName,  set:setInvName,  ph:"Jane Smith",           type:"text" },
                    { label:"Email",        val:invEmail, set:setInvEmail, ph:"jane@example.com",     type:"email" },
                    { label:"Phone (opt.)", val:invPhone, set:setInvPhone, ph:"(239) 555-0100",       type:"tel" },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:0.08, marginBottom:6 }}>{f.label}</div>
                      <input value={f.val} type={f.type} placeholder={f.ph}
                        onChange={e => f.set(e.target.value)}
                        style={inputStyle} />
                    </div>
                  ))}

                  {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>}

                  <button onClick={sendInvite} disabled={busy}
                    style={{ padding:"15px", borderRadius:"var(--r-sm)", border:"none",
                      background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
                      fontFamily:"var(--sans)", cursor:busy?"wait":"pointer", opacity:busy?0.7:1, marginTop:4 }}>
                    {busy ? "Sending…" : "Send invitation"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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

// ── Photo gallery — date-folder view of all inspection photos ──
function PhotoGallery({ id, name, nav, openGroupId, user }) {
  const [groups,        setGroups]       = useState(null);
  const [open,          setOpen]         = useState(() => openGroupId ? new Set([openGroupId]) : new Set());
  const [viewer,        setViewer]       = useState(null);
  const [menuGroup,     setMenuGroup]    = useState(null);
  const [renaming,      setRenaming]     = useState(null);
  const [renameName,    setRenameName]   = useState('');
  const [deletingGroup, setDeletingGroup]= useState(null);
  const [downloading,   setDownloading]  = useState(false);

  const isAdmin = (user?.role || '') === 'administrator';

  useEffect(() => {
    FBUTIL.getPropertyPhotos(String(id)).then(data => {
      setGroups(data);
      if (!openGroupId && data && data.length > 0) setOpen(new Set([data[0].reportId]));
    });
  }, [id]);

  const fmtDate = (ts) => {
    if (!ts) return "Unknown date";
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); if (d.getFullYear() < 2000) return "Unknown date"; return d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric", year:"numeric" }); }
    catch { return "Unknown date"; }
  };

  const toggleGroup = (reportId) => setOpen(prev => {
    const next = new Set(prev); next.has(reportId) ? next.delete(reportId) : next.add(reportId); return next;
  });

  const doDelete = async (g) => {
    await FBUTIL.deleteReport(g.reportId);
    setGroups(gs => gs.filter(x => x.reportId !== g.reportId));
    setDeletingGroup(null);
  };

  const doRename = async () => {
    const n = renameName.trim(); if (!n) return;
    await FBUTIL.renameVisit(renaming.reportId, n);
    setGroups(gs => gs.map(x => x.reportId === renaming.reportId ? { ...x, visitName: n } : x));
    setRenaming(null);
  };

  const doDownload = async (g) => {
    setDownloading(true);
    try {
      const r = await FBUTIL.getReport(g.reportId);
      if (r && window.downloadReport) window.downloadReport(r, (ts) => {
        try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString(); } catch { return ''; }
      });
    } finally { setDownloading(false); }
  };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Photos" sub={name} />

        <div style={{ padding:"8px 20px 80px" }}>
          {groups === null && (
            <div style={{ textAlign:"center", padding:"60px 0", color:"var(--ink-3)" }}>Loading…</div>
          )}
          {groups !== null && groups.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <div style={{ width:64, height:64, borderRadius:999, background:"var(--mint-bg)",
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <Icon name="photo" size={32} color="var(--pine)" />
              </div>
              <div style={{ fontSize:15, fontWeight:700 }}>No photos yet</div>
              <div style={{ fontSize:13, marginTop:5 }}>Photos appear here after an inspection is submitted</div>
            </div>
          )}

          {(groups || []).map((g, idx) => {
            const isOpen = open.has(g.reportId);
            const isLatest = idx === 0;
            return (
              <div key={g.reportId} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {/* kabob button */}
                  <button onClick={() => setMenuGroup(menuGroup?.reportId === g.reportId ? null : g)}
                    style={{ flexShrink:0, width:32, height:32, borderRadius:999, border:"none",
                      background:"var(--surface)", boxShadow:"var(--shadow-sm)", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name="dots-vertical" size={18} color="var(--ink-2)" />
                  </button>

                  {/* folder row */}
                  <button onClick={() => toggleGroup(g.reportId)}
                    style={{ flex:1, display:"flex", alignItems:"center", gap:14,
                      padding:"14px 16px", borderRadius: isOpen ? "var(--r) var(--r) 0 0" : "var(--r)",
                      border:"none", cursor:"pointer", textAlign:"left", fontFamily:"var(--sans)",
                      background:"var(--surface)", boxShadow:"var(--shadow)",
                      borderBottom: isOpen ? "1px solid var(--line)" : "none" }}>
                    <div style={{ width:54, height:54, borderRadius:12, flexShrink:0, overflow:"hidden",
                      background:"var(--bg-2)", border: isLatest ? "2px solid var(--pine)" : "2px solid var(--line)" }}>
                      <img src={g.urls[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:15, color:"var(--ink)", letterSpacing:-0.2 }}>
                        {fmtDate(g.submittedAt)}
                        {isLatest && <span style={{ marginLeft:8, fontSize:11, fontWeight:700, padding:"2px 8px",
                          borderRadius:999, background:"var(--pine)", color:"#fff", verticalAlign:"middle" }}>Latest</span>}
                      </div>
                      <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2, fontWeight:600 }}>
                        {g.visitName} · {g.urls.length} photo{g.urls.length !== 1 ? "s" : ""} · {g.submittedBy}
                      </div>
                    </div>
                    <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="var(--ink-3)" />
                  </button>
                </div>

                {/* Expanded photo grid */}
                {isOpen && (
                  <div style={{ marginLeft:40, background:"var(--surface)", borderRadius:"0 0 var(--r) var(--r)",
                    boxShadow:"var(--shadow)", padding:"12px 12px 14px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                      {g.urls.map((url, i) => (
                        <div key={i} onClick={() => setViewer(url)}
                          style={{ aspectRatio:"1", borderRadius:12, overflow:"hidden", cursor:"pointer" }}>
                          <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* kabob action sheet */}
      {menuGroup && (
        <div onClick={() => setMenuGroup(null)}
          style={{ position:"fixed", inset:0, zIndex:150, background:"rgba(15,28,63,0.35)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position:"absolute", bottom:0, left:0, right:0, background:"var(--surface)",
              borderRadius:"20px 20px 0 0", padding:"12px 20px max(32px,env(safe-area-inset-bottom))",
              animation:"hw-slide-up .28s cubic-bezier(.22,.61,.36,1) both" }}>
            <div style={{ width:36, height:4, background:"var(--line)", borderRadius:999, margin:"0 auto 18px" }} />
            <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{menuGroup.visitName}</div>
            <div style={{ fontSize:13, color:"var(--ink-3)", marginBottom:18 }}>{fmtDate(menuGroup.submittedAt)} · {menuGroup.urls.length} photos</div>
            {[
              { icon:"pencil",   label:"Rename",          action:() => { setRenaming(menuGroup); setRenameName(menuGroup.visitName); setMenuGroup(null); }, danger:false },
              { icon:"download", label: downloading ? "Preparing…" : "Download report", action:() => { doDownload(menuGroup); setMenuGroup(null); }, danger:false },
              ...(isAdmin ? [{ icon:"trash", label:"Delete", action:() => { setDeletingGroup(menuGroup); setMenuGroup(null); }, danger:true }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 4px",
                  border:"none", borderTop:"1px solid var(--line)", background:"transparent",
                  cursor:"pointer", fontFamily:"var(--sans)", fontSize:16, fontWeight:600, textAlign:"left",
                  color: item.danger ? "var(--danger)" : "var(--ink)" }}>
                <Icon name={item.icon} size={20} color={item.danger ? "var(--danger)" : "var(--ink-2)"} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* rename sheet */}
      {renaming && (
        <div onClick={() => setRenaming(null)}
          style={{ position:"fixed", inset:0, zIndex:150, background:"rgba(15,28,63,0.35)" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ position:"absolute", bottom:0, left:0, right:0, background:"var(--surface)",
              borderRadius:"20px 20px 0 0", padding:"24px 20px max(32px,env(safe-area-inset-bottom))",
              animation:"hw-slide-up .28s cubic-bezier(.22,.61,.36,1) both" }}>
            <div style={{ fontWeight:800, fontSize:17, marginBottom:16 }}>Rename visit</div>
            <input value={renameName} onChange={e => setRenameName(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && doRename()}
              style={{ width:"100%", padding:"13px 15px", fontSize:15, borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", background:"var(--bg)", color:"var(--ink)",
                fontFamily:"var(--sans)", outline:"none", boxSizing:"border-box", marginBottom:14 }} />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setRenaming(null)} className="btn btn-light" style={{ flex:1 }}>Cancel</button>
              <button onClick={doRename} className="btn btn-primary" style={{ flex:2 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {deletingGroup && (
        <ConfirmSheet
          message={`Delete all ${deletingGroup.urls.length} photos from "${deletingGroup.visitName}"? This cannot be undone.`}
          confirmLabel="Yes, delete"
          onConfirm={() => doDelete(deletingGroup)}
          onCancel={() => setDeletingGroup(null)}
        />
      )}

      {/* lightbox */}
      {viewer && (
        <div onClick={() => setViewer(null)}
          style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(10,14,12,0.92)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <img src={viewer} alt="" style={{ maxWidth:"100%", maxHeight:"100%", borderRadius:10, objectFit:"contain" }} />
          <button onClick={() => setViewer(null)}
            style={{ position:"absolute", top:20, right:20, width:38, height:38, borderRadius:999,
              background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="x" size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

// Access card — operators see codes read-only; homeowners/admins can update codes
function AccessCard({ prop: p, reveal, setReveal, role, forceEdit, onEditClose, onSave }) {
  const [editing, setEditing] = useState(false);
  const [lockbox, setLockbox] = useState(p.access.lockbox);
  const [alarm,   setAlarm]   = useState(p.access.alarm);
  const [notes,   setNotesTxt]= useState(p.access.notes);
  const [busy,    setBusy]    = useState(false);

  useEffect(() => { if (forceEdit) setEditing(true); }, [forceEdit]);
  useEffect(() => {
    setLockbox(p.access.lockbox);
    setAlarm(p.access.alarm);
    setNotesTxt(p.access.notes);
  }, [p.access.lockbox, p.access.alarm, p.access.notes]);

  const isHomeowner = role === "homeowner";
  const canEdit = role === "administrator" || role === "operator" || isHomeowner;

  const save = async () => {
    setBusy(true);
    if (onSave) await onSave({ lockbox, alarm, notes });
    else { p.access.lockbox = lockbox; p.access.alarm = alarm; p.access.notes = notes; }
    setBusy(false);
    setEditing(false);
    if (onEditClose) onEditClose();
  };

  const cancel = () => { setEditing(false); if (onEditClose) onEditClose(); };

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
          <button onClick={save} disabled={busy} style={{ flex:2, padding:"12px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--pine)", color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer", opacity:busy?0.7:1 }}>
            {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={cancel} style={{ flex:1, padding:"12px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--bg-2)", color:"var(--ink-2)", fontSize:15, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer" }}>Cancel</button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Access & codes" icon="key" right={
      <div style={{ display:"flex", gap:8 }}>
        {canEdit && (
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

// ── Assign Checklist Sheet ───────────────────────────────────
function AssignChecklistSheet({ propId, currentChecklistId, onClose, onAssigned }) {
  const [lists, setLists] = useState(null);
  const [busy,  setBusy]  = useState(false);

  useEffect(() => { FBUTIL.listChecklists().then(setLists); }, []);

  const assign = async (id) => {
    setBusy(true);
    await FBUTIL.savePropertyOverrides(String(propId), { checklistId: id || null });
    onAssigned(id || null);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.4)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px max(28px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:12, maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>Assign checklist</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer" }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {lists === null && <div style={{ textAlign:"center", padding:"20px 0", color:"var(--ink-3)" }}>Loading…</div>}

        {/* None / use default option */}
        {lists !== null && (
          <div onClick={() => assign(null)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
            borderRadius:"var(--r-sm)", border:`2px solid ${!currentChecklistId ? "var(--pine)" : "var(--line)"}`,
            background: !currentChecklistId ? "var(--mint-bg)" : "var(--bg)", cursor:busy?"default":"pointer" }}>
            <Icon name="star" size={20} color={!currentChecklistId ? "var(--pine)" : "var(--ink-3)"} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14.5 }}>Use default checklist</div>
              <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>Whichever checklist is marked as default</div>
            </div>
            {!currentChecklistId && <Icon name="check" size={18} color="var(--pine)" />}
          </div>
        )}

        {lists?.map(cl => (
          <div key={cl.id} onClick={() => assign(cl.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
            borderRadius:"var(--r-sm)", border:`2px solid ${currentChecklistId===cl.id ? "var(--pine)" : "var(--line)"}`,
            background: currentChecklistId===cl.id ? "var(--mint-bg)" : "var(--bg)", cursor:busy?"default":"pointer" }}>
            <Icon name="clipboard-list" size={20} color={currentChecklistId===cl.id ? "var(--pine)" : "var(--ink-3)"} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14.5 }}>{cl.name}</div>
              <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>
                {(cl.items||[]).length} items{cl.isDefault ? " · Default" : ""}
              </div>
            </div>
            {currentChecklistId===cl.id && <Icon name="check" size={18} color="var(--pine)" />}
          </div>
        ))}

        {lists?.length === 0 && (
          <div style={{ textAlign:"center", padding:"12px 0", color:"var(--ink-3)", fontSize:13.5 }}>
            No named checklists yet. Create one under Manage Checklists in the menu.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Emergency Contacts Card ──────────────────────────────────
function PropertyContactsCard({ contacts, canEdit, onSave }) {
  const [editIdx, setEditIdx] = React.useState(null); // null=closed, -1=new, 0+=edit

  const handleSave = (data, idx) => {
    const next = [...contacts];
    if (idx === -1) next.push({ id: Date.now().toString(), ...data });
    else            next[idx] = { ...next[idx], ...data };
    onSave(next);
    setEditIdx(null);
  };

  const handleDelete = (idx) => {
    onSave(contacts.filter((_, i) => i !== idx));
    setEditIdx(null);
  };

  return (
    <div className="card rise" style={{ padding:"15px 16px", marginTop:14 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:contacts.length ? 10 : 0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Icon name="phone-call" size={18} color="var(--mint)" />
          <h3 style={{ margin:0, fontSize:15, fontWeight:800, letterSpacing:-0.2 }}>Emergency contacts</h3>
        </div>
        {canEdit && (
          <button onClick={() => setEditIdx(-1)}
            style={{ border:"none", background:"var(--mint-bg)", color:"var(--pine)", fontFamily:"var(--sans)",
              fontWeight:700, fontSize:12.5, padding:"6px 11px", borderRadius:999, cursor:"pointer",
              display:"flex", alignItems:"center", gap:5 }}>
            <Icon name="plus" size={14} /> Add
          </button>
        )}
      </div>

      {contacts.length === 0 && (
        <div style={{ textAlign:"center", padding:"10px 0 4px", color:"var(--ink-3)", fontSize:13.5 }}>
          No emergency contacts on file
        </div>
      )}

      {contacts.map((c, i) => (
        <div key={c.id || i}>
          {i > 0 && <div style={{ height:1, background:"var(--line)" }} />}
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:0.06 }}>{c.label}</div>
              <div style={{ fontWeight:700, fontSize:14.5, marginTop:2 }}>{c.name}</div>
              {c.phone && <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:1 }}>{c.phone}</div>}
            </div>
            {c.phone && (
              <a href={`tel:${c.phone}`}
                style={{ width:36, height:36, borderRadius:999, background:"var(--mint-bg)",
                  display:"flex", alignItems:"center", justifyContent:"center", textDecoration:"none", flexShrink:0 }}>
                <Icon name="phone" size={17} color="var(--pine)" />
              </a>
            )}
            {canEdit && (
              <button onClick={() => setEditIdx(i)}
                style={{ width:36, height:36, borderRadius:999, background:"var(--bg-2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  border:"none", cursor:"pointer", flexShrink:0 }}>
                <Icon name="edit" size={15} color="var(--ink-3)" />
              </button>
            )}
          </div>
        </div>
      ))}

      {editIdx !== null && (
        <ContactEditSheet
          contact={editIdx >= 0 ? contacts[editIdx] : null}
          idx={editIdx}
          onSave={handleSave}
          onDelete={editIdx >= 0 ? () => handleDelete(editIdx) : null}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  );
}

function ContactEditSheet({ contact, idx, onSave, onDelete, onClose }) {
  const LABELS = ["Plumber", "Electrician", "HVAC", "HOA", "Locksmith", "Landscaper", "Pest Control", "Pool Service", "Other"];
  const [label, setLabel] = React.useState(contact?.label || LABELS[0]);
  const [name,  setName]  = React.useState(contact?.name  || "");
  const [phone, setPhone] = React.useState(contact?.phone || "");
  const [customLabel, setCustomLabel] = React.useState(!LABELS.includes(contact?.label || "") ? (contact?.label || "") : "");

  const effectiveLabel = label === "Other" ? customLabel.trim() || "Other" : label;

  const inputStyle = {
    width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:200,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"24px 20px max(36px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:14, maxHeight:"90vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{idx === -1 ? "Add contact" : "Edit contact"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Contact type</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {LABELS.map(l => (
              <button key={l} onClick={() => setLabel(l)}
                style={{ padding:"7px 13px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: label===l ? "var(--pine)" : "var(--bg-2)",
                  color: label===l ? "#fff" : "var(--ink-2)" }}>{l}</button>
            ))}
          </div>
          {label === "Other" && (
            <input value={customLabel} placeholder="Enter type…" onChange={e => setCustomLabel(e.target.value)}
              style={{ marginTop:8, ...inputStyle, fontSize:14 }} />
          )}
        </div>

        {[
          { lbl:"Name / company", val:name,  set:setName,  ph:"Joe's Plumbing",  type:"text" },
          { lbl:"Phone",          val:phone, set:setPhone, ph:"(239) 555-0100",  type:"tel" },
        ].map(f => (
          <div key={f.lbl}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.lbl}</div>
            <input value={f.val} type={f.type} placeholder={f.ph}
              onChange={e => f.set(e.target.value)} style={inputStyle} />
          </div>
        ))}

        <button onClick={() => onSave({ label: effectiveLabel, name: name.trim(), phone: phone.trim() }, idx)}
          disabled={!name.trim()}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none", marginTop:4,
            background: name.trim() ? "var(--pine)" : "var(--bg-2)",
            color: name.trim() ? "#fff" : "var(--ink-3)",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
            cursor: name.trim() ? "pointer" : "default" }}>
          {idx === -1 ? "Add contact" : "Save changes"}
        </button>

        {onDelete && (
          <button onClick={onDelete}
            style={{ padding:"12px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--danger-bg)", color:"var(--danger)",
              fontSize:14, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer" }}>
            Remove contact
          </button>
        )}
      </div>
    </div>
  );
}

// ── Access Log Card (admin/supervisor only) ──────────────────
function AccessLogCard({ propId, log }) {
  const [entries, setEntries] = React.useState(null);

  React.useEffect(() => {
    if (!propId) return;
    FBUTIL.getAccessLog(propId).then(setEntries);
  }, [propId]);

  const data = log || entries;

  const fmtTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return "";
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const timeStr = d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
    if (isToday) return `Today ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric" }) + " " + timeStr;
  };

  return (
    <div style={{ marginTop:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 0 10px" }}>
        <Icon name="shield-lock" size={16} color="var(--ink-3)" />
        <span style={{ fontSize:12, fontWeight:800, letterSpacing:0.06, textTransform:"uppercase", color:"var(--ink-3)" }}>
          Access log
        </span>
      </div>
      <div className="card" style={{ padding:"12px 16px" }}>
        {data === null && (
          <div style={{ color:"var(--ink-3)", fontSize:13.5 }}>Loading…</div>
        )}
        {data !== null && data.length === 0 && (
          <div style={{ color:"var(--ink-3)", fontSize:13.5 }}>No codes viewed yet</div>
        )}
        {data !== null && data.map((entry, i) => (
          <div key={entry.id} style={{ display:"flex", alignItems:"center", gap:12,
            padding:"8px 0", borderBottom: i < data.length - 1 ? "1px solid var(--line)" : "none" }}>
            <div style={{ width:30, height:30, borderRadius:999, background:"var(--bg-2)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="user" size={15} color="var(--ink-3)" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{entry.userName}</div>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:1 }}>{fmtTime(entry.at)}</div>
            </div>
            <Icon name="key" size={14} color="var(--ink-3)" />
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PropertyDetail, PropertyWeather, Card, Row, ActionRow, TimelineItem, PhotoSlot, CodeBox, AccessCard, PhotoGallery, PropertyContactsCard, AccessLogCard });
