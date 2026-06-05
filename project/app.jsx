// ─────────────────────────────────────────────────────────────
// TPC Home Services — app shell + navigation
// ─────────────────────────────────────────────────────────────

const SCREENS = {
  dashboard:      (p) => <Dashboard {...p} />,
  properties:     (p) => <Properties {...p} />,
  schedule:       (p) => <Schedule {...p} />,
  alerts:         (p) => <Alerts {...p} />,
  vendors:        (p) => <Vendors {...p} />,
  more:           (p) => <More {...p} />,
  property:       (p) => <PropertyDetail {...p} />,
  inspection:     (p) => <Inspection {...p} />,
  adminUsers:     (p) => <AdminUsers {...p} />,
  adminChecklist: (p) => <AdminChecklist {...p} />,
  adminInbox:     (p) => <AdminInbox {...p} />,
};

const TABS = [
  { id:"dashboard",  icon:"home",              label:"Home" },
  { id:"properties", icon:"building-estate",   label:"Homes" },
  { id:"schedule",   icon:"calendar-event",    label:"Schedule" },
  { id:"alerts",     icon:"bell",              label:"Alerts", badge:HW.stats.alerts_open },
  { id:"more",       icon:"menu-deep",         label:"More" },
];
const TAB_OF = { vendors:"more", adminUsers:"more", adminChecklist:"more", adminInbox:"more" };

// Full-screen screens (no tab bar, no device chrome needed)
const FULL_SCREENS  = new Set(["inspection"]);
// Screens that hide the tab bar but keep the device frame
const NOTAB_SCREENS = new Set(["property","adminUsers","adminChecklist","adminInbox"]);

function App({ user }) {
  const [stack, setStack] = useState([{ name:"dashboard", props:{} }]);
  const depthRef = useRef(1);

  const nav = {
    go:   (name)        => setStack([{ name, props:{} }]),
    push: (name, props={}) => setStack(s => [...s, { name, props }]),
    back: ()            => setStack(s => s.length > 1 ? s.slice(0,-1) : s),
  };

  const cur       = stack[stack.length-1];
  const rootTab   = stack[0].name;
  const activeTab = TAB_OF[cur.name] || cur.name;
  const isFull    = FULL_SCREENS.has(cur.name);
  const showTab   = !isFull && !NOTAB_SCREENS.has(cur.name);

  const pushed = stack.length > depthRef.current;
  depthRef.current = stack.length;
  const animClass = pushed || NOTAB_SCREENS.has(cur.name) || isFull ? "anim-slide" : "anim-fade";

  const screenEl = (SCREENS[cur.name] || SCREENS.dashboard)({ ...cur.props, nav, user, onLogout });

  if (isFull) {
    return <div key={cur.name + stack.length} className="anim-slide" style={{ height:"100%" }}>{screenEl}</div>;
  }

  return (
    <div className="hw-app">
      <div key={cur.name + stack.length} className={animClass}
        style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
        {screenEl}
      </div>
      {showTab && <TabBar active={activeTab} nav={nav} />}
    </div>
  );
}

function TabBar({ active, nav }) {
  return (
    <div style={{ position:"relative", zIndex:9, background:"rgba(252,251,247,0.86)", backdropFilter:"blur(18px) saturate(180%)",
      WebkitBackdropFilter:"blur(18px) saturate(180%)", borderTop:"1px solid var(--line)", paddingBottom:26,
      display:"flex", justifyContent:"space-around", alignItems:"flex-start", paddingTop:9 }}>
      {TABS.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => nav.go(t.id)} style={{ border:"none", background:"transparent", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"2px 10px", flex:1, position:"relative" }}>
            <div style={{ position:"relative" }}>
              <Icon name={t.icon} size={25} color={on ? "var(--pine)" : "var(--ink-3)"} style={{ transition:"color .15s" }} />
              {t.badge ? (
                <span className="tnum" style={{ position:"absolute", top:-5, right:-9, minWidth:16, height:16, padding:"0 4px", borderRadius:999,
                  background:"var(--danger)", color:"#fff", fontSize:10.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 0 0 2px rgba(252,251,247,0.95)" }}>{t.badge}</span>
              ) : null}
            </div>
            <span style={{ fontSize:10.5, fontWeight:on?800:600, color:on ? "var(--pine)" : "var(--ink-3)", letterSpacing:0.01 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── theme tweaks ─────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": ["#1B3A8C", "#2D52C0", "#E8A020", "#FEF3D7"],
  "greeting": "Serif",
  "corners": "Soft"
}/*EDITMODE-END*/;

const THEMES = [
  ["#1B3A8C", "#2D52C0", "#E8A020", "#FEF3D7"], // TPC Navy & Gold
  ["#1B4332", "#2D6A4F", "#52B788", "#DCEFE0"], // Coastal Pine
  ["#26261F", "#4A4A3E", "#B89233", "#EFE9D6"], // Graphite & Gold
  ["#5E2A22", "#9B4A3C", "#D98A6A", "#F5E5DC"], // Terracotta Coast
];
const CORNERS = { Soft:[12,18,26], Rounded:[16,22,30], Sharp:[5,9,13] };

function useFit(W, H, pad) {
  const [s, setS] = useState(1);
  useEffect(() => {
    const fit = () => setS(Math.min(1, (window.innerWidth-pad)/W, (window.innerHeight-pad)/H));
    fit(); window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return s;
}

function Root() {
  const [t, setTweak]   = useTweaks(TWEAK_DEFAULTS);
  const [user, setUser] = useState(null);   // logged-in user or null
  const scale = useFit(402, 874, 28);

  useEffect(() => {
    const r = document.documentElement.style;
    const [pine, p2, mint, mintbg] = t.theme;
    r.setProperty("--pine", pine);
    r.setProperty("--pine-2", p2);
    r.setProperty("--mint", mint);
    r.setProperty("--mint-bg", mintbg);
    r.setProperty("--greet-font", t.greeting === "Serif" ? "var(--serif)" : "var(--sans)");
    const rad = CORNERS[t.corners] || CORNERS.Soft;
    r.setProperty("--r-sm", rad[0]+"px");
    r.setProperty("--r",    rad[1]+"px");
    r.setProperty("--r-lg", rad[2]+"px");
  }, [t]);

  const handleLogin = (u) => setUser(u);
  const handleLogout = () => { AUTH.logout(); setUser(null); };

  // Pick which app shell to show based on role
  const renderApp = () => {
    if (!user) return <LoginScreen onLogin={handleLogin} />;
    if (user.role === "homeowner") return <OwnerApp user={user} onLogout={handleLogout} />;
    return <App user={user} onLogout={handleLogout} />;
  };

  return (
    <React.Fragment>
      <div style={{ transform:`scale(${scale})`, transformOrigin:"center center" }}>
        <IOSDevice>{renderApp()}</IOSDevice>
      </div>
      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Theme" value={t.theme} options={THEMES} onChange={v => setTweak("theme", v)} />
        <TweakSection label="Style" />
        <TweakRadio label="Greeting" value={t.greeting} options={["Serif","Sans"]} onChange={v => setTweak("greeting", v)} />
        <TweakRadio label="Corners" value={t.corners} options={["Soft","Rounded","Sharp"]} onChange={v => setTweak("corners", v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
