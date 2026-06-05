// ─────────────────────────────────────────────────────────────
// TPC Home Services — HOMEOWNER app (client-facing, peace-of-mind)
// One remote owner (James Anderson) watching Gulf Breeze Villa.
// ─────────────────────────────────────────────────────────────

const OWNER = { name:"James Anderson", first:"James", initials:"JA", base:"Chicago, IL" };
const OPROP = HW.properties[0]; // Gulf Breeze Villa

// visit history (owner-facing)
const VISITS = [
  { id:1, date:"May 15", dow:"Thursday", year:"2025", label:"Weekly inspection", inspector:"Maria Reyes", status:"flag",     photos:3, clear:9, total:10, summary:"Possible kitchen leak found — water shut off as a precaution." },
  { id:2, date:"May 8",  dow:"Thursday", year:"2025", label:"Weekly inspection", inspector:"Maria Reyes", status:"clear",    photos:5, clear:10, total:10, summary:"Everything secure. All systems normal." },
  { id:3, date:"May 1",  dow:"Thursday", year:"2025", label:"Storm check",       inspector:"Maria Reyes", status:"resolved", photos:4, clear:9, total:10, summary:"Minor lanai screen tear from wind — repaired May 4." },
  { id:4, date:"Apr 24", dow:"Thursday", year:"2025", label:"Weekly inspection", inspector:"Maria Reyes", status:"clear",    photos:6, clear:10, total:10, summary:"All clear. Photos sent." },
];
const VSTATUS = { clear:{cls:"pill-ok",label:"All clear"}, flag:{cls:"pill-warn",label:"1 finding"}, resolved:{cls:"pill-info",label:"Resolved"} };

// ── shared owner chrome ──────────────────────────────────────
function OwnerAvatar({ size=34 }) {
  return <div style={{ width:size, height:size, borderRadius:999, background:"var(--pine)", color:"var(--on-pine)",
    display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*0.38, letterSpacing:0.3, boxShadow:"var(--shadow-sm)" }}>{OWNER.initials}</div>;
}

function OwnerTopBar({ right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"52px 20px 0" }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <Logo size={24} />
        <div>
          <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:0.12, color:"var(--ink-3)", textTransform:"uppercase" }}>Watched by TPC</div>
          <div style={{ fontSize:13.5, fontWeight:800, letterSpacing:-0.2, marginTop:-1 }}>{OPROP.name}</div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>{right}<OwnerAvatar /></div>
    </div>
  );
}

// "your home" stylized photo placeholder w/ overlay
function HomePhoto({ tag="Front exterior", date, height=200, r="var(--r-lg)" }) {
  return (
    <div style={{ position:"relative", height, borderRadius:r, overflow:"hidden", background:OPROP.grad, boxShadow:"var(--shadow)" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 11px, transparent 11px, transparent 22px)" }} />
      <Icon name="home" size={150} style={{ position:"absolute", right:-26, bottom:-26, opacity:0.16 }} color="#fff" />
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.42), transparent 55%)" }} />
      <div style={{ position:"absolute", left:14, top:14, display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.92)", borderRadius:999, padding:"5px 11px 5px 8px", backdropFilter:"blur(6px)" }}>
        <span style={{ width:8, height:8, borderRadius:999, background:"var(--ok)" }} />
        <span style={{ fontSize:12, fontWeight:800, color:"var(--ink)" }}>Secured</span>
      </div>
      <div style={{ position:"absolute", left:16, bottom:13, color:"#fff" }}>
        <div style={{ fontSize:11.5, fontWeight:700, fontFamily:"ui-monospace, monospace", opacity:0.85 }}>{tag}</div>
        {date && <div style={{ fontSize:13.5, fontWeight:700, marginTop:1 }}>Captured {date}</div>}
      </div>
    </div>
  );
}

// ── OWNER HOME (peace of mind) ───────────────────────────────
function OwnerHome({ nav }) {
  const next = HW.schedule.find(s => s.prop === OPROP.name && s.status==="scheduled") || HW.schedule[4];
  return (
    <div className="hw-scroll">
      <OwnerTopBar right={
        <button onClick={()=>nav.go("updates")} aria-label="Updates" style={{ position:"relative", width:34, height:34, borderRadius:999, border:"none", background:"var(--surface)", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Icon name="bell" size={18} color="var(--ink-2)" />
          <span style={{ position:"absolute", top:-3, right:-3, width:15, height:15, borderRadius:999, background:"var(--warn)", color:"#fff", fontSize:9.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 2px var(--bg)" }}>1</span>
        </button>} />

      {/* greeting */}
      <div style={{ padding:"16px 20px 4px" }} className="anim-fade">
        <h1 style={{ margin:0, fontSize:30, fontWeight:500, letterSpacing:-0.5, lineHeight:1.06, fontFamily:"var(--greet-font)" }}>
          Good morning, <span style={{ fontStyle:"italic" }}>{OWNER.first}</span>
        </h1>
        <p style={{ margin:"8px 0 0", color:"var(--ink-2)", fontSize:15, fontWeight:500 }}>Your home was checked 4 days ago. Here's the latest.</p>
      </div>

      {/* hero photo */}
      <div style={{ padding:"16px 20px 0" }} className="rise">
        <HomePhoto tag="Front exterior" date="May 15" />
      </div>

      {/* attention — handled item */}
      <div className="rise" style={{ margin:"14px 20px 0", background:"var(--warn-bg)", border:"1px solid rgba(188,122,30,0.22)", borderRadius:"var(--r)", padding:"15px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"var(--warn)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="shield-check" size={19} color="#fff" /></div>
          <div>
            <div style={{ fontSize:14.5, fontWeight:800, color:"#8a5a16" }}>We caught something for you</div>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--warn)" }}>In progress · we'll keep you posted</div>
          </div>
        </div>
        <p style={{ margin:"0 0 12px", fontSize:13.5, color:"#7a5418", lineHeight:1.5 }}>
          During Thursday's visit, Maria found a possible leak under the kitchen sink and <b>shut off the water as a precaution</b>. AquaFix Plumbing is scheduled for May 16.
        </p>
        <button onClick={()=>nav.go("updates")} className="btn" style={{ width:"100%", background:"var(--warn)", color:"#fff", padding:"12px", fontSize:14.5 }}>
          <Icon name="timeline" size={17} color="#fff" /> Follow this update
        </button>
      </div>

      {/* next visit */}
      <SectionTitle>Next visit</SectionTitle>
      <div style={{ padding:"0 20px" }}>
        <div className="card rise" style={{ padding:"15px 16px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:54, textAlign:"center", flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--mint)", letterSpacing:0.04 }}>{next.month}</div>
            <div className="tnum" style={{ fontSize:26, fontWeight:800, letterSpacing:-1, lineHeight:1 }}>{next.day}</div>
          </div>
          <div style={{ width:1, alignSelf:"stretch", background:"var(--line)" }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:15.5 }}>{next.name}</div>
            <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2 }}>{next.time} · with Maria</div>
          </div>
          <Icon name="calendar-check" size={22} color="var(--mint)" />
        </div>
      </div>

      {/* last report */}
      <SectionTitle action="Full report" onAction={()=>nav.push("report",{id:1})}>Last inspection</SectionTitle>
      <div style={{ padding:"0 20px 8px" }}>
        <button onClick={()=>nav.push("report",{id:1})} className="card tap rise" style={{ width:"100%", border:"none", textAlign:"left", cursor:"pointer", padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:13 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.1, color:"var(--ink-3)", textTransform:"uppercase" }}>Thursday, May 15</div>
              <div style={{ fontSize:17, fontWeight:800, letterSpacing:-0.3, marginTop:2 }}>9 of 10 areas clear</div>
            </div>
            <Ring pct={90} />
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {[["Exterior","ok"],["Security","ok"],["Climate","ok"],["Pool","ok"],["Water","flag"]].map(([k,s]) => (
              <span key={k} className={`pill ${s==="flag"?"pill-warn":"pill-ok"}`} style={{ fontSize:11.5 }}>
                <Icon name={s==="flag"?"alert-triangle":"check"} size={12} /> {k}
              </span>
            ))}
          </div>
        </button>
      </div>

      {/* contact */}
      <div style={{ padding:"4px 20px 10px" }}>
        <button onClick={()=>nav.push("messageAdmin")} className="btn btn-light btn-block" style={{ padding:"14px" }}><Icon name="message-2" size={18} color="var(--pine-2)" /> Message your watch team</button>
      </div>
    </div>
  );
}

// ── OWNER VISITS ─────────────────────────────────────────────
function OwnerVisits({ nav }) {
  return (
    <div className="hw-scroll">
      <OwnerTopBar />
      <div style={{ padding:"18px 20px 4px" }}>
        <div className="eyebrow" style={{ marginBottom:6 }}>Every visit, documented</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>Visit history</h1>
      </div>
      <div style={{ padding:"14px 20px 8px", display:"flex", flexDirection:"column", gap:12 }}>
        {VISITS.map((v,i) => {
          const st = VSTATUS[v.status];
          return (
            <button key={v.id} onClick={()=>nav.push("report",{id:v.id})} className="card tap rise" style={{ width:"100%", border:"none", textAlign:"left", cursor:"pointer", overflow:"hidden", animationDelay:`${0.05*i}s`, padding:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:13, padding:"15px 16px" }}>
                <div style={{ width:50, height:50, borderRadius:14, background:OPROP.grad, flexShrink:0, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon name="home" size={24} color="rgba(255,255,255,0.92)" />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontWeight:800, fontSize:15.5 }}>{v.date}</span>
                    <span className={`pill ${st.cls}`} style={{ fontSize:11 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:3, lineHeight:1.4 }}>{v.summary}</div>
                  <div style={{ fontSize:11.5, color:"var(--ink-3)", marginTop:5, fontWeight:600, display:"flex", gap:12 }}>
                    <span><Icon name="photo" size={12} /> {v.photos} photos</span>
                    <span><Icon name="user" size={12} /> {v.inspector.split(" ")[0]}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size={18} color="var(--ink-3)" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── OWNER REPORT DETAIL ──────────────────────────────────────
function OwnerReport({ id, nav }) {
  const v = VISITS.find(x => x.id === id) || VISITS[0];
  const groups = {};
  HW.checklist.forEach(c => { (groups[c.cat]=groups[c.cat]||[]).push(c); });
  const flaggedId = v.status === "clear" ? -1 : 5; // "No water leaks or moisture"

  return (
    <div className="hw-scroll" style={{ background:"var(--bg)" }}>
      <DrillHeader onBack={nav.back} sub={`${v.dow}, ${v.year}`} title={`${v.label} · ${v.date}`}
        right={<button style={{ width:38, height:38, borderRadius:999, border:"none", background:"var(--surface)", color:"var(--pine-2)", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><Icon name="download" size={19} /></button>} />

      {/* summary banner */}
      <div style={{ padding:"2px 20px 0" }}>
        <div className="rise" style={{ borderRadius:"var(--r-lg)", padding:"18px 18px 20px", background: v.status==="clear" ? "var(--pine)" : "linear-gradient(135deg,#1B4332,#2D6A4F)", color:"#fff", position:"relative", overflow:"hidden" }}>
          <Icon name="shield-check" size={150} style={{ position:"absolute", right:-30, top:-20, opacity:0.12 }} color="#fff" />
          <div style={{ position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Icon name="circle-check-filled" size={22} color="var(--mint)" />
              <span style={{ fontSize:13, fontWeight:800, letterSpacing:0.02 }}>{v.clear} of {v.total} areas secure</span>
            </div>
            <h2 className="serif" style={{ margin:"12px 0 0", fontSize:23, fontWeight:500, lineHeight:1.15 }}>
              {v.status==="clear" ? "Your home is safe and secure." : "We secured your home and flagged one item."}
            </h2>
            <div style={{ display:"flex", gap:22, marginTop:18, paddingTop:15, borderTop:"1px solid rgba(255,255,255,0.18)" }}>
              <HeroMeta k="Inspector" v={v.inspector.split(" ")[0]} />
              <HeroMeta k="Duration" v="~90 min" />
              <HeroMeta k="Photos" v={v.photos} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 20px 8px" }}>
        {/* photos */}
        <div className="eyebrow" style={{ marginBottom:10 }}>Photos from this visit</div>
        <div className="hscroll" style={{ marginBottom:6 }}>
          {HW.photos.concat(HW.photos).slice(0, v.photos).map((ph,i) => (
            <div key={i} style={{ flexShrink:0, width:130, height:96, borderRadius:14, background:OPROP.grad, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 9px, transparent 9px, transparent 18px)" }} />
              <div style={{ position:"relative", padding:"8px 10px", fontSize:10.5, fontWeight:700, color:"#fff", fontFamily:"ui-monospace,monospace", textShadow:"0 1px 2px rgba(0,0,0,0.3)" }}>{ph.tag}</div>
            </div>
          ))}
        </div>

        {/* checklist */}
        <div className="eyebrow" style={{ margin:"20px 0 10px" }}>Inspection checklist</div>
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom:13 }}>
            <div style={{ fontSize:12.5, fontWeight:800, color:"var(--ink-2)", marginBottom:7, paddingLeft:2 }}>{cat}</div>
            <div className="card" style={{ overflow:"hidden" }}>
              {items.map((it,i) => {
                const flag = it.id === flaggedId;
                return (
                  <div key={it.id} style={{ display:"flex", alignItems:"center", gap:11, padding:"12px 15px", borderBottom: i===items.length-1?"none":"1px solid var(--line)" }}>
                    <div style={{ width:22, height:22, borderRadius:7, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: flag?"var(--warn-bg)":"var(--mint-bg)" }}>
                      <Icon name={flag?"alert-triangle-filled":"check"} size={flag?13:14} color={flag?"var(--warn)":"var(--ok)"} />
                    </div>
                    <span style={{ flex:1, fontSize:14, fontWeight:600, color: flag?"#8a5a16":"var(--ink)" }}>{it.label}</span>
                    {flag && <span className="pill pill-warn" style={{ fontSize:10.5 }}>Flagged</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* inspector note */}
        <div className="eyebrow" style={{ margin:"20px 0 10px" }}>Note from Maria</div>
        <div className="card" style={{ padding:"15px 16px", display:"flex", gap:12 }}>
          <OwnerAvatarTeam />
          <div style={{ flex:1 }}>
            <p style={{ margin:0, fontSize:13.5, color:"var(--ink-2)", lineHeight:1.55, fontStyle:"italic" }}>
              {v.status==="clear" ? "“All systems normal this week — A/C running well, pool clear, no moisture anywhere. Home's in great shape.”"
              : "“Found a small amount of water under the kitchen sink. I shut the main off to be safe and booked AquaFix for tomorrow morning. Nothing else of concern — I'll send an update once it's fixed.”"}
            </p>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", marginTop:8 }}>Maria Reyes · Lead Inspector</div>
          </div>
        </div>
        <div style={{ height:12 }} />
      </div>
    </div>
  );
}

function OwnerAvatarTeam({ size=38 }) {
  return <div style={{ width:size, height:size, borderRadius:999, background:"var(--mint-bg)", color:"var(--pine)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 }}>MR</div>;
}

// ── OWNER UPDATES ────────────────────────────────────────────
function OwnerUpdates({ nav }) {
  const steps = [
    { icon:"droplet", tone:"warn",   title:"Possible leak detected", time:"May 15 · 9:32 AM", desc:"Maria found moisture under the kitchen sink during the weekly inspection.", done:true },
    { icon:"hand-stop", tone:"warn", title:"Water shut off", time:"May 15 · 9:40 AM", desc:"Main valve closed as a precaution to prevent any further water damage.", done:true },
    { icon:"calendar-plus", tone:"info", title:"Plumber scheduled", time:"May 15 · 11:05 AM", desc:"AquaFix Plumbing booked for May 16, 8:00 AM. We'll be on-site to let them in.", done:true },
    { icon:"tool", tone:"muted", title:"Repair visit", time:"Tomorrow · May 16", desc:"AquaFix will diagnose and repair. You'll get a photo update when complete.", done:false },
  ];
  return (
    <div className="hw-scroll">
      <OwnerTopBar />
      <div style={{ padding:"18px 20px 4px" }}>
        <div className="eyebrow" style={{ marginBottom:6 }}>What we're handling</div>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>Updates</h1>
      </div>

      {/* active issue card */}
      <div style={{ padding:"16px 20px 0" }}>
        <div className="card rise" style={{ overflow:"hidden" }}>
          <div style={{ background:"var(--warn-bg)", padding:"15px 16px", display:"flex", alignItems:"center", gap:11, borderBottom:"1px solid rgba(188,122,30,0.18)" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--warn)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon name="droplet" size={21} color="#fff" /></div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15.5, color:"#8a5a16" }}>Kitchen water intrusion</div>
              <div style={{ fontSize:12.5, color:"var(--warn)", fontWeight:700, marginTop:1 }}>In progress · opened May 15</div>
            </div>
          </div>
          <div style={{ padding:"18px 16px 6px" }}>
            {steps.map((s,i) => (
              <div key={i} style={{ display:"flex", gap:13, paddingBottom: i===steps.length-1?6:18 }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div style={{ width:32, height:32, borderRadius:999, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                    background: s.done ? (s.tone==="info"?"var(--info-bg)":"var(--mint-bg)") : "var(--bg-2)",
                    border: s.done?"none":"1.5px dashed var(--ink-3)" }}>
                    <Icon name={s.done?(i<2?"check":s.icon):s.icon} size={16} color={s.done?(s.tone==="info"?"var(--info)":"var(--ok)"):"var(--ink-3)"} />
                  </div>
                  {i<steps.length-1 && <div style={{ width:2, flex:1, minHeight:24, background:"var(--line)", marginTop:3 }} />}
                </div>
                <div style={{ flex:1, paddingBottom:2 }}>
                  <div style={{ fontWeight:800, fontSize:14.5, color: s.done?"var(--ink)":"var(--ink-2)" }}>{s.title}</div>
                  <div style={{ fontSize:11.5, color:"var(--ink-3)", fontWeight:700, margin:"2px 0 4px" }}>{s.time}</div>
                  <div style={{ fontSize:13, color:"var(--ink-2)", lineHeight:1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 20px 0", display:"flex", gap:10 }}>
        <button className="btn btn-primary" style={{ flex:1, padding:"13px", fontSize:14.5 }}><Icon name="check" size={17} color="#fff" /> Approve work</button>
        <button onClick={()=>nav.push("messageAdmin")} className="btn btn-light" style={{ flex:1, padding:"13px", fontSize:14.5 }}><Icon name="message-2" size={17} color="var(--pine-2)" /> Ask a question</button>
      </div>

      <SectionTitle>Earlier</SectionTitle>
      <div style={{ padding:"0 20px 10px" }}>
        <div className="card" style={{ padding:"14px 16px", display:"flex", gap:12, alignItems:"center" }}>
          <IconTile icon="circle-check" bg="var(--ok-bg)" color="var(--ok)" size={38} r={11} iconSize={20} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>Lanai screen repaired</div>
            <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1 }}>Resolved May 4</div>
          </div>
          <span className="pill pill-ok" style={{ fontSize:11 }}>Closed</span>
        </div>
      </div>
    </div>
  );
}

// ── OWNER ACCOUNT ────────────────────────────────────────────
function OwnerAccount({ nav }) {
  const prop = OPROP;
  return (
    <div className="hw-scroll">
      <OwnerTopBar />
      <div style={{ padding:"18px 20px 4px" }}>
        <h1 style={{ margin:0, fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>Account</h1>
      </div>

      {/* plan */}
      <div style={{ padding:"14px 20px 0" }}>
        <div className="card rise" style={{ padding:"16px", background:"var(--pine)", color:"var(--on-pine)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:11.5, fontWeight:700, opacity:0.8, letterSpacing:0.06, textTransform:"uppercase" }}>Your plan</div>
              <div style={{ fontSize:21, fontWeight:800, letterSpacing:-0.4, marginTop:4 }}>Weekly Watch</div>
            </div>
            <span className="pill" style={{ background:"rgba(255,255,255,0.16)", color:"#fff", fontSize:11.5 }}><span className="dot" style={{ background:"var(--mint)" }} /> Active</span>
          </div>
          <div style={{ display:"flex", gap:24, marginTop:16, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.18)" }}>
            <div><div style={{ fontSize:11, opacity:0.75, fontWeight:700 }}>VISITS / MO</div><div className="tnum" style={{ fontSize:18, fontWeight:800, marginTop:2 }}>4</div></div>
            <div><div style={{ fontSize:11, opacity:0.75, fontWeight:700 }}>MEMBER SINCE</div><div style={{ fontSize:18, fontWeight:800, marginTop:2 }}>Jan 2024</div></div>
            <div><div style={{ fontSize:11, opacity:0.75, fontWeight:700 }}>COVERAGE</div><div style={{ fontSize:18, fontWeight:800, marginTop:2 }}>Year-round</div></div>
          </div>
        </div>
      </div>

      {/* watch team */}
      <SectionTitle>Your watch team</SectionTitle>
      <div style={{ padding:"0 20px" }}>
        <div className="card rise" style={{ padding:"15px 16px", display:"flex", alignItems:"center", gap:13 }}>
          <OwnerAvatarTeam size={46} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:16 }}>Maria Reyes</div>
            <div style={{ fontSize:12.5, color:"var(--ink-2)", marginTop:1 }}>Lead Inspector · TPC Naples</div>
          </div>
          <button aria-label="Call" style={{ width:42, height:42, borderRadius:999, border:"none", background:"var(--mint-bg)", color:"var(--pine)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginRight:2 }}><Icon name="phone" size={19} /></button>
          <button aria-label="Message" style={{ width:42, height:42, borderRadius:999, border:"none", background:"var(--mint-bg)", color:"var(--pine)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><Icon name="message-2" size={19} /></button>
        </div>
      </div>

      {/* home details */}
      <SectionTitle>Your home</SectionTitle>
      <div style={{ padding:"0 20px" }}>
        <div className="card" style={{ overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", gap:11, padding:"13px 16px", borderBottom:"1px solid var(--line)" }}>
            <IconTile icon="map-pin" bg="var(--bg-2)" color="var(--pine-2)" size={36} r={10} iconSize={19} />
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14.5 }}>{OPROP.address}</div><div style={{ fontSize:12, color:"var(--ink-3)" }}>{OPROP.type} home · {OPROP.freq} watch</div></div>
          </div>
          <button onClick={()=>nav.push("accessEdit")} style={{ display:"flex", alignItems:"center", gap:11, padding:"13px 16px", borderBottom:"1px solid var(--line)", width:"100%", border:"none", background:"transparent", textAlign:"left", cursor:"pointer" }}>
            <IconTile icon="key" bg="var(--mint-bg)" color="var(--pine)" size={36} r={10} iconSize={19} />
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14.5 }}>Access on file</div><div style={{ fontSize:12, color:"var(--ink-3)" }}>Tap to update lockbox & alarm codes</div></div>
            <Icon name="chevron-right" size={18} color="var(--ink-3)" />
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:11, padding:"13px 16px" }}>
            <IconTile icon="bell" bg="var(--bg-2)" color="var(--pine-2)" size={36} r={10} iconSize={19} />
            <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14.5 }}>Notifications</div><div style={{ fontSize:12, color:"var(--ink-3)" }}>Texts after every visit · on</div></div>
            <span style={{ color:"var(--pine-2)", fontWeight:800, fontSize:13 }}>Edit</span>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 20px" }}>
        <button className="btn btn-light btn-block" style={{ padding:"14px" }}><Icon name="help-circle" size={18} color="var(--pine-2)" /> Help & support</button>
      </div>
      <div style={{ textAlign:"center", padding:"0 0 16px", fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>{HW.version ? `TPC Home Services · v${HW.version.number}` : "TPC Home Services"}</div>
    </div>
  );
}

// ── OWNER APP SHELL ──────────────────────────────────────────
const OWNER_SCREENS = {
  home:         (p) => <OwnerHome {...p} />,
  visits:       (p) => <OwnerVisits {...p} />,
  updates:      (p) => <OwnerUpdates {...p} />,
  account:      (p) => <OwnerAccount {...p} />,
  report:       (p) => <OwnerReport {...p} />,
  accessEdit:   (p) => <OwnerAccessEdit {...p} />,
  messageAdmin: (p) => <OwnerMessageAdmin {...p} />,
};
const OWNER_TABS = [
  { id:"home",    icon:"home",        label:"Home" },
  { id:"visits",  icon:"photo",       label:"Visits" },
  { id:"updates", icon:"bell",        label:"Updates", badge:1 },
  { id:"account", icon:"user-circle", label:"Account" },
];

function OwnerApp({ user, onLogout }) {
  const [stack, setStack] = useState([{ name:"home", props:{} }]);
  const depthRef = useRef(1);
  const nav = {
    go:(name)=>setStack([{name,props:{}}]),
    push:(name,props={})=>setStack(s=>[...s,{name,props}]),
    back:()=>setStack(s=>s.length>1?s.slice(0,-1):s),
    sendToAdmin:(text) => {
      AUTH.sendToAdmins({ from: user ? user.name : OWNER.name, text, property: OPROP.name });
    },
  };
  const cur = stack[stack.length-1];
  const showTab = !["report"].includes(cur.name);
  const pushed = stack.length > depthRef.current;
  depthRef.current = stack.length;
  const animClass = pushed || cur.name==="report" ? "anim-slide" : "anim-fade";
  const screenEl = (OWNER_SCREENS[cur.name] || OWNER_SCREENS.home)({ ...cur.props, nav, user, onLogout });

  return (
    <div className="hw-app">
      <div key={cur.name+stack.length} className={animClass} style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
        {screenEl}
      </div>
      {showTab && (
        <div style={{ position:"relative", zIndex:9, background:"rgba(252,251,247,0.86)", backdropFilter:"blur(18px) saturate(180%)", WebkitBackdropFilter:"blur(18px) saturate(180%)", borderTop:"1px solid var(--line)", paddingBottom:26, display:"flex", justifyContent:"space-around", alignItems:"flex-start", paddingTop:9 }}>
          {OWNER_TABS.map(t => {
            const on = stack[0].name === t.id;
            return (
              <button key={t.id} onClick={()=>nav.go(t.id)} style={{ border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"2px 10px", flex:1 }}>
                <div style={{ position:"relative" }}>
                  <Icon name={t.icon} size={25} color={on?"var(--pine)":"var(--ink-3)"} />
                  {t.badge ? <span className="tnum" style={{ position:"absolute", top:-5, right:-9, minWidth:16, height:16, padding:"0 4px", borderRadius:999, background:"var(--warn)", color:"#fff", fontSize:10.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 0 2px rgba(252,251,247,0.95)" }}>{t.badge}</span> : null}
                </div>
                <span style={{ fontSize:10.5, fontWeight:on?800:600, color:on?"var(--pine)":"var(--ink-3)" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Homeowner access code editor
function OwnerAccessEdit({ nav }) {
  const prop = OPROP;
  const [lockbox, setLockbox] = useState(prop.access.lockbox);
  const [alarm,   setAlarm]   = useState(prop.access.alarm);
  const [notes,   setNotesTxt]= useState(prop.access.notes);
  const [saved,   setSaved]   = useState(false);

  const save = () => {
    prop.access.lockbox = lockbox;
    prop.access.alarm   = alarm;
    prop.access.notes   = notes;
    setSaved(true);
    setTimeout(nav.back, 1200);
  };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Update Access Codes" sub={prop.name} />
        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r)", padding:"13px 15px", display:"flex", gap:11, alignItems:"flex-start" }}>
            <Icon name="shield-lock" size={20} color="var(--pine)" style={{ flexShrink:0, marginTop:1 }} />
            <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>
              <span style={{ fontWeight:700, color:"var(--ink)" }}>Secure update.</span> Updated codes are encrypted and only visible to authorized TPC operators and administrators.
            </div>
          </div>

          {[
            { label:"Lockbox code", val:lockbox, set:setLockbox, ph:"e.g. 7742" },
            { label:"Alarm code",   val:alarm,   set:setAlarm,   ph:"e.g. 4411#" },
          ].map(f => (
            <div key={f.label} className="card" style={{ padding:"14px 16px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", letterSpacing:0.08, textTransform:"uppercase", marginBottom:8 }}>{f.label}</div>
              <input value={f.val} placeholder={f.ph} onChange={e=>f.set(e.target.value)}
                style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                  fontSize:18, fontFamily:"ui-monospace, monospace", background:"var(--bg)", color:"var(--ink)",
                  outline:"none", boxSizing:"border-box", letterSpacing:2 }} />
            </div>
          ))}

          <div className="card" style={{ padding:"14px 16px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", letterSpacing:0.08, textTransform:"uppercase", marginBottom:8 }}>Access notes</div>
            <textarea value={notes} onChange={e=>setNotesTxt(e.target.value)}
              placeholder="e.g. Pool equipment in back shed (key on ring)."
              style={{ width:"100%", minHeight:80, padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                fontSize:14, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }} />
          </div>

          {saved ? (
            <div style={{ padding:"16px", borderRadius:"var(--r-sm)", background:"var(--ok-bg)", color:"var(--ok)",
              fontWeight:800, fontSize:15, textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <Icon name="circle-check-filled" size={20} color="var(--ok)" /> Codes updated successfully
            </div>
          ) : (
            <button onClick={save} style={{ padding:"16px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>
              Save updated codes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerMessageAdmin({ nav }) {
  const [text, setText] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const send = () => {
    if (!text.trim()) return;
    const u = AUTH.currentUser;
    AUTH.sendToAdmins({ from: u ? u.name : OWNER.name, text: text.trim(), property: OPROP.name });
    setSent(true);
  };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Message TPC" sub={OPROP.name} />
        <div style={{ padding:"8px 20px 40px", display:"flex", flexDirection:"column", gap:14 }}>
          {sent ? (
            <div style={{ marginTop:40, textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
              <div style={{ width:72, height:72, borderRadius:999, background:"var(--ok-bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon name="circle-check-filled" size={44} color="var(--ok)" />
              </div>
              <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.3 }}>Message sent</div>
              <div style={{ fontSize:14.5, color:"var(--ink-2)", lineHeight:1.5, maxWidth:260 }}>Your message has been delivered to the TPC team. We'll be in touch shortly.</div>
              <button onClick={nav.back} className="btn btn-primary" style={{ marginTop:8, padding:"13px 32px" }}>Done</button>
            </div>
          ) : (
            <>
              <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r)", padding:"13px 15px", display:"flex", gap:11, alignItems:"flex-start" }}>
                <Icon name="shield-check" size={20} color="var(--pine)" style={{ flexShrink:0, marginTop:1 }} />
                <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>Messages go directly to TPC administrators and are not shared with third parties.</div>
              </div>
              <div className="card" style={{ padding:"14px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--ink-3)", letterSpacing:0.08, textTransform:"uppercase", marginBottom:8 }}>Your message</div>
                <textarea value={text} onChange={e=>setText(e.target.value)}
                  placeholder="Type your message or question here…"
                  autoFocus
                  style={{ width:"100%", minHeight:120, padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                    fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                    outline:"none", resize:"none", boxSizing:"border-box", lineHeight:1.6 }} />
              </div>
              <button onClick={send} disabled={!text.trim()}
                style={{ padding:"15px", borderRadius:"var(--r-sm)", border:"none",
                  background: text.trim() ? "var(--pine)" : "var(--bg-2)",
                  color: text.trim() ? "#fff" : "var(--ink-3)",
                  fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor: text.trim() ? "pointer" : "default",
                  transition:"all .15s" }}>
                <Icon name="send" size={18} color={text.trim() ? "#fff" : "var(--ink-3)"} style={{ marginRight:8, verticalAlign:-3 }} />
                Send message
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OwnerApp });
