// ─────────────────────────────────────────────────────────────
// TPC Home Services — seed data
// Users, properties and messages are managed via Firebase Auth + Firestore
// ─────────────────────────────────────────────────────────────
window.HW = {
  version: { number: "2.4.61", build: "20261105", date: "November 5, 2026" },
  brand: { name: "TPC Home Services", short: "TPC", operator: "Marty Montgomery", initials: "MM",
           region: "Boca Grande, Charlotte & Sarasota Counties" },

  stats: {
    active_properties: 0, alerts_open: 0, visits_this_week: 0, reports_sent: 0,
  },

  properties: [],

  schedule: [],
  scheduleLabels: {},

  alerts: [],

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

  stormPrepChecklist: [
    { id:"s1",  label:"Close & latch all storm shutters",              cat:"Exterior" },
    { id:"s2",  label:"Bring in / secure outdoor furniture & decor",   cat:"Exterior" },
    { id:"s3",  label:"Clear gutters, downspouts & drains",            cat:"Exterior" },
    { id:"s4",  label:"Secure or remove exterior signage",             cat:"Exterior" },
    { id:"s5",  label:"Inspect roof & fascia for loose sections",      cat:"Roof" },
    { id:"s6",  label:"Turn off pool pump & pool equipment",           cat:"Pool" },
    { id:"s7",  label:"Check generator fuel & test start",             cat:"Systems" },
    { id:"s8",  label:"Locate & confirm water main shutoff",           cat:"Systems" },
    { id:"s9",  label:"Check propane / gas valves are off",            cat:"Systems" },
    { id:"s10", label:"Pre-storm exterior photos taken",               cat:"Documentation" },
  ],

  postStormChecklist: [
    { id:"p1",  label:"Exterior perimeter walk — storm damage",        cat:"Exterior" },
    { id:"p2",  label:"Roof & fascia — missing sections or debris",    cat:"Roof" },
    { id:"p3",  label:"Windows & door seals — no cracks or water entry", cat:"Exterior" },
    { id:"p4",  label:"Pool area — debris cleared, equipment intact",  cat:"Pool" },
    { id:"p5",  label:"No water intrusion or interior flooding",       cat:"Interior" },
    { id:"p6",  label:"No downed tree or fence damage",               cat:"Exterior" },
    { id:"p7",  label:"HVAC & electrical — power restored & running",  cat:"Systems" },
    { id:"p8",  label:"Generator stored / fuel topped off",            cat:"Systems" },
    { id:"p9",  label:"Open storm shutters & restore outdoor items",   cat:"Exterior" },
    { id:"p10", label:"Post-storm exterior photos taken",              cat:"Documentation" },
  ],

  history: [],

  photos: [],

  // Users and messages are managed via Firebase Auth + Firestore
};
