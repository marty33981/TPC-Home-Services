// ─────────────────────────────────────────────────────────────
// TPC Home Services — shared UI primitives
// ─────────────────────────────────────────────────────────────
const { useState, useEffect, useRef } = React;

// Tabler icon
function Icon({ name, size = 20, color, style = {}, className = "" }) {
  return <i className={`ti ti-${name} ${className}`} style={{ fontSize: size, color, lineHeight: 1, ...style }} />;
}

// status → pill style + label
const STATUS = {
  alert:     { cls:"pill-danger", label:"Needs attention" },
  due:       { cls:"pill-warn",   label:"Due" },
  active:    { cls:"pill-ok",     label:"All clear" },
  urgent:    { cls:"pill-danger", label:"Urgent" },
  ready:     { cls:"pill-info",   label:"Ready" },
  scheduled: { cls:"pill-muted",  label:"Scheduled" },
  pending:   { cls:"pill-warn",   label:"Pending" },
  available: { cls:"pill-ok",     label:"Available" },
  busy:      { cls:"pill-muted",  label:"Busy" },
};
function StatusPill({ status, label, dot = true }) {
  const s = STATUS[status] || STATUS.scheduled;
  return (
    <span className={`pill ${s.cls}`}>
      {dot && <span className="dot" />}{label || s.label}
    </span>
  );
}

// app top header (sticky) — wordmark + avatar
function AppHeader({ title, sub, avatar = true, large = true, right }) {
  return (
    <div style={{ padding:"52px 20px 12px", background:"var(--bg)", position:"sticky", top:0, zIndex:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", minHeight:40 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <Logo size={26} />
          <span style={{ fontWeight:800, fontSize:16, letterSpacing:-0.2 }}>{HW.brand.short}<span style={{ color:"var(--ink-3)", fontWeight:600 }}> Home Services</span></span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {right}
          {avatar && <Avatar />}
        </div>
      </div>
      {large && title && (
        <div style={{ marginTop:14 }}>
          {sub && <div className="eyebrow" style={{ marginBottom:6 }}>{sub}</div>}
          <h1 style={{ margin:0, fontSize:30, fontWeight:800, letterSpacing:-0.6, lineHeight:1.05 }}>{title}</h1>
        </div>
      )}
    </div>
  );
}

function Avatar({ size = 34 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:999, background:"var(--pine)", color:"var(--on-pine)",
      display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:size*0.4,
      letterSpacing:0.3, boxShadow:"var(--shadow-sm)" }}>{HW.brand.initials}</div>
  );
}

// TPC mark — gold arch + building/house silhouette
function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="22" fill="var(--pine)"/>
      <path d="M 10,70 A 40,40 0 0,1 90,70" stroke="var(--mint)" strokeWidth="5.5" fill="none" strokeLinecap="round"/>
      <polyline points="28,70 28,42 32,42 32,28 44,28 44,42 48,42 48,70" fill="none" stroke="var(--on-pine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="38" y1="28" x2="38" y2="42" stroke="var(--on-pine)" strokeWidth="3" strokeLinecap="round"/>
      <polyline points="44,70 44,54 56,42 68,54 68,70" fill="none" stroke="var(--on-pine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="64" y1="47" x2="64" y2="42" stroke="var(--on-pine)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// section header with optional action
function SectionTitle({ children, action, onAction, style = {} }) {
  return (
    <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", padding:"0 20px", margin:"22px 0 11px", ...style }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:800, letterSpacing:-0.3 }}>{children}</h2>
      {action && <button className="btn-ghost" onClick={onAction} style={{ background:"none", border:"none", fontFamily:"var(--sans)", fontWeight:700, fontSize:14, color:"var(--pine-2)", cursor:"pointer", padding:0 }}>{action}</button>}
    </div>
  );
}

// rounded icon tile
function IconTile({ icon, bg = "var(--mint-bg)", color = "var(--pine)", size = 40, r = 12, iconSize }) {
  return (
    <div className="iconbox" style={{ width:size, height:size, borderRadius:r, background:bg }}>
      <Icon name={icon} size={iconSize || size*0.5} color={color} />
    </div>
  );
}

// soft divider
function Hr() { return <div style={{ height:1, background:"var(--line)", margin:"0" }} />; }

// back header for drill-in screens (static; sits below the status bar)
function DrillHeader({ title, sub, onBack, tint = "var(--ink)", bg = "transparent", right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"52px 16px 10px", background:bg, position:"relative", zIndex:8 }}>
      <button onClick={onBack} aria-label="Back" style={{ width:38, height:38, borderRadius:999, border:"none", cursor:"pointer",
        background:"var(--surface)", color:"var(--ink)", boxShadow:"var(--shadow-sm)",
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name="chevron-left" size={22} />
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        {sub && <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.04, color:"var(--ink-3)", textTransform:"uppercase" }}>{sub}</div>}
        {title && <div style={{ fontSize:17, fontWeight:800, color:tint, letterSpacing:-0.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</div>}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { Icon, StatusPill, AppHeader, Avatar, Logo, SectionTitle, IconTile, Hr, DrillHeader, STATUS });
