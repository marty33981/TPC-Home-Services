// ─────────────────────────────────────────────────────────────
// TPC Home Services — seed data (ported from app.py)
// ─────────────────────────────────────────────────────────────
window.HW = {
  version: { number: "1.2.0", build: "20260601", date: "June 1, 2026" },
  brand: { name: "TPC Home Services", short: "TPC", operator: "Maria Reyes", initials: "MR",
           region: "Naples · Bonita Springs · Sarasota" },

  stats: {
    active_properties: 12, alerts_open: 3, visits_this_week: 5, reports_sent: 14,
  },

  properties: [
    { id:1, name:"Gulf Breeze Villa", address:"4821 Bayside Dr, Naples FL 34102",
      type:"Seasonal", status:"alert", freq:"Weekly", last:"May 12",
      grad:"linear-gradient(135deg,#1B4332,#52B788)",
      owner:{ name:"James Anderson", phone:"(312) 555-0182", email:"janderson@email.com", base:"Chicago, IL" },
      access:{ lockbox:"7742", alarm:"4411#", notes:"Pool equipment in back shed (key on ring). Alert neighbor Bob Marsh (239) 555-0199 if extended work." },
      alert:"Water intrusion under kitchen sink — detected during routine inspection May 15. Possible slow pipe leak. Shut-off valve turned off as a precaution." },
    { id:2, name:"Pelican Bay Estate", address:"702 Pelican Way, Naples FL 34108",
      type:"Vacant", status:"due", freq:"Weekly", last:"May 8",
      grad:"linear-gradient(135deg,#1D6FA4,#56A8DA)",
      owner:{ name:"Robert Thornton", phone:"(773) 555-0291", email:"rthorn@email.com", base:"Detroit, MI" },
      access:{ lockbox:"3391", alarm:"8822#", notes:"Side entrance key in lockbox. Notify property manager if pool pump is off." } },
    { id:3, name:"Harbor Lights Cottage", address:"318 Marina Blvd, Bonita Springs FL 34134",
      type:"Seasonal", status:"active", freq:"Bi-weekly", last:"May 14",
      grad:"linear-gradient(135deg,#7B4F12,#D4956A)",
      owner:{ name:"Linda Chen", phone:"(415) 555-0044", email:"lchen@email.com", base:"San Francisco, CA" },
      access:{ lockbox:"5519", alarm:"1234#", notes:"Dog door on back porch — keep closed. Alarm panel is in hallway closet." } },
    { id:4, name:"Sunridge Manor", address:"1204 Palmetto Dr, Sarasota FL 34231",
      type:"Vacant", status:"active", freq:"Monthly", last:"May 13",
      grad:"linear-gradient(135deg,#3D2B6B,#7C5CBF)",
      owner:{ name:"Maya Kapoor", phone:"(212) 555-0377", email:"mkapoor@email.com", base:"New York, NY" },
      access:{ lockbox:"8847", alarm:"5566#", notes:"Front gate code: 2211. Landscaper visits every Tuesday." } },
  ],

  schedule: [
    { id:1, date:"May 15", day:"15", month:"MAY", time:"9:00 AM",  dur:"~90 min", name:"Weekly Inspection",   prop:"Pelican Bay Estate",    status:"due" },
    { id:2, date:"May 15", day:"15", month:"MAY", time:"2:00 PM",  dur:"~45 min", name:"Storm Check",         prop:"Gulf Breeze Villa",     status:"urgent" },
    { id:3, date:"May 15", day:"15", month:"MAY", time:"4:30 PM",  dur:"~60 min", name:"Move-in Prep Check",  prop:"Harbor Lights Cottage", status:"ready" },
    { id:4, date:"May 16", day:"16", month:"MAY", time:"10:00 AM", dur:"~60 min", name:"Bi-weekly Inspection",prop:"Sunridge Manor",        status:"scheduled" },
    { id:5, date:"May 19", day:"19", month:"MAY", time:"11:00 AM", dur:"~45 min", name:"AC System Check",     prop:"Gulf Breeze Villa",     status:"scheduled" },
  ],
  scheduleLabels: { "May 15":"Thursday, May 15", "May 16":"Friday, May 16", "May 19":"Monday, May 19" },

  alerts: [
    { id:1, type:"danger", icon:"ti-droplet",      title:"Water intrusion",     desc:"Possible leak under kitchen sink at Gulf Breeze Villa. Shut-off valve turned off.", time:"May 15 · 9:32 AM", prop:"Gulf Breeze Villa" },
    { id:2, type:"warn",   icon:"ti-cloud-storm",  title:"Storm warning active",desc:"Tropical disturbance advisory in effect for Collier County. Schedule post-storm checks.", time:"May 15 · 7:00 AM", prop:"Pelican Bay Estate" },
    { id:3, type:"info",   icon:"ti-file-text",    title:"Report pending",      desc:"Sunridge Manor's May inspection report hasn't been sent to the owner yet.", time:"May 14", prop:"Sunridge Manor" },
  ],

  vendors: [
    { id:1, name:"AquaFix Plumbing",     cat:"Plumbing",   phone:"(239) 555-0134", avail:"available", rating:4.9, icon:"ti-droplet", color:"var(--info)",  bg:"var(--info-bg)" },
    { id:2, name:"Bright Wire Electric", cat:"Electrical", phone:"(239) 555-0198", avail:"available", rating:4.7, icon:"ti-bolt",    color:"var(--warn)",  bg:"var(--warn-bg)" },
    { id:3, name:"CoolZone HVAC",        cat:"HVAC",       phone:"(239) 555-0277", avail:"busy",      rating:4.8, icon:"ti-wind",    color:"var(--ok)",    bg:"var(--ok-bg)" },
    { id:4, name:"SecureNest Locksmith", cat:"Security",   phone:"(239) 555-0312", avail:"available", rating:4.6, icon:"ti-lock",    color:"#8B3DB8",      bg:"#F3E8F8" },
  ],

  checklist: [
    { id:1,  label:"Exterior perimeter walk",            cat:"Exterior" },
    { id:2,  label:"All doors & windows locked",         cat:"Exterior" },
    { id:3,  label:"No signs of intrusion or vandalism", cat:"Security" },
    { id:4,  label:"A/C set & running properly",         cat:"Systems" },
    { id:5,  label:"No water leaks or moisture",         cat:"Interior" },
    { id:6,  label:"Electrical panel check",             cat:"Systems" },
    { id:7,  label:"Pool water level & clarity",         cat:"Pool" },
    { id:8,  label:"Mail & packages collected",          cat:"Exterior" },
    { id:9,  label:"Smoke & CO detectors test",          cat:"Safety" },
    { id:10, label:"Exterior photos taken",              cat:"Documentation" },
  ],

  history: [
    { dot:"danger", title:"Water intrusion found",       desc:"Leak under kitchen sink. Shut-off engaged. Plumber dispatched.", time:"May 15, 2025 · 9:32 AM" },
    { dot:"",       title:"Weekly inspection completed", desc:"18-point checklist, all secure. Report sent to owner.",          time:"May 8, 2025" },
    { dot:"warn",   title:"Lanai screen damage",         desc:"Minor tear from wind. Vendor quote requested.",                  time:"May 1, 2025" },
    { dot:"",       title:"Weekly inspection completed", desc:"All systems normal. Photos taken and report sent.",              time:"Apr 24, 2025" },
  ],

  photos: [
    { tag:"Front exterior", icon:"ti-home" },
    { tag:"Kitchen leak",   icon:"ti-droplet" },
    { tag:"Pool area",      icon:"ti-pool" },
  ],

  // ── Auth / Users ────────────────────────────────────────────
  // Administrator1 (index 0) is protected — cannot be edited or deleted by anyone.
  users: [
    {
      id: "admin-1",
      role: "administrator",
      protected: true,                        // Administrator1 — immutable
      name: "Marty",
      email: "Marty@truexpreferredconstruction.com",
      password: "2025Truex$Pref",
      initials: "MT",
      createdAt: "2026-06-01",
    },
  ],

  // Inbox: messages from homeowners always route to administrators
  adminMessages: [],
};
