// ─────────────────────────────────────────────────────────────
// TPC Home Services — app shell + navigation (Firebase Auth)
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
  operatorReports:(p) => <OperatorReports {...p} />,
  sendAlert:      (p) => <SendAlert {...p} />,
};

const TABS = [
  { id:"dashboard",  icon:"layout-dashboard", label:"Dashboard" },
  { id:"properties", icon:"home",             label:"Homes" },
  { id:"schedule",   icon:"calendar-event",   label:"Schedule" },
  { id:"alerts",     icon:"bell",             label:"Alerts" },
  { id:"more",       icon:"menu-deep",        label:"More" },
];
const TAB_OF = { vendors:"more", adminUsers:"more", adminChecklist:"more", adminInbox:"more", operatorReports:"more", sendAlert:"more" };

const FULL_SCREENS  = new Set(["inspection"]);
const NOTAB_SCREENS = new Set(["property","adminUsers","adminChecklist","adminInbox","sendAlert"]);

function App({ user, onLogout }) {
  const [stack,      setStack]      = useState([{ name:"dashboard", props:{} }]);
  const [alertCount, setAlertCount] = useState(0);
  const depthRef = useRef(1);

  const refreshAlertCount = React.useCallback(() => {
    if (typeof FBUTIL !== "undefined") {
      FBUTIL.getAllHomeownerAlerts().then(list => setAlertCount(list.length)).catch(() => {});
    }
  }, []);

  useEffect(() => { refreshAlertCount(); }, []);

  const nav = {
    go:   (name)           => setStack([{ name, props:{} }]),
    push: (name, props={}) => setStack(s => [...s, { name, props }]),
    back: ()               => setStack(s => s.length > 1 ? s.slice(0,-1) : s),
  };

  const cur       = stack[stack.length-1];
  const activeTab = TAB_OF[cur.name] || cur.name;
  const isFull    = FULL_SCREENS.has(cur.name);
  const showTab   = !isFull && !NOTAB_SCREENS.has(cur.name);

  const pushed = stack.length > depthRef.current;
  depthRef.current = stack.length;
  const animClass = pushed || NOTAB_SCREENS.has(cur.name) || isFull ? "anim-slide" : "anim-fade";

  const screenEl = (SCREENS[cur.name] || SCREENS.dashboard)({
    ...cur.props, nav, user, onLogout,
    canGoBack: stack.length > 1,
    onAlertsCleared: refreshAlertCount,
  });

  if (isFull) {
    return <div key={cur.name + stack.length} className="anim-slide hw-full">{screenEl}</div>;
  }

  return (
    <div className="hw-app">
      <div key={cur.name + stack.length} className={animClass}
        style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
        {screenEl}
      </div>
      {showTab && <TabBar active={activeTab} nav={nav} alertCount={alertCount} />}
    </div>
  );
}

function TabBar({ active, nav, alertCount = 0 }) {
  const tabs = TABS.map(t => t.id === "alerts" ? { ...t, badge: alertCount } : t);
  return (
    <div style={{ position:"relative", zIndex:9, background:"rgba(252,251,247,0.92)",
      backdropFilter:"blur(18px) saturate(180%)", WebkitBackdropFilter:"blur(18px) saturate(180%)",
      borderTop:"1px solid var(--line)", paddingBottom:"max(16px, env(safe-area-inset-bottom))",
      display:"flex", justifyContent:"space-around", alignItems:"flex-start", paddingTop:9 }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => nav.go(t.id)} style={{ border:"none", background:"transparent",
            cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            padding:"2px 10px", flex:1, position:"relative" }}>
            <div style={{ position:"relative" }}>
              <Icon name={t.icon} size={25} color={on ? "var(--pine)" : "var(--ink-3)"} style={{ transition:"color .15s" }} />
              {t.badge ? (
                <span className="tnum" style={{ position:"absolute", top:-5, right:-9, minWidth:16, height:16,
                  padding:"0 4px", borderRadius:999, background:"var(--danger)", color:"#fff",
                  fontSize:10.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center",
                  boxShadow:"0 0 0 2px rgba(252,251,247,0.95)" }}>{t.badge}</span>
              ) : null}
            </div>
            <span style={{ fontSize:10.5, fontWeight:on?800:600, color:on ? "var(--pine)" : "var(--ink-3)",
              letterSpacing:0.01 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--bg)", flexDirection:"column", gap:14 }}>
      <Logo size={48} />
      <div style={{ fontSize:13, color:"var(--ink-3)", fontWeight:600 }}>Loading…</div>
    </div>
  );
}

function Root() {
  // undefined = checking auth, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = fbAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        try {
          let profile = await FBUTIL.getUserProfile(fbUser.uid);
          if (!profile) {
            profile = {
              name:      fbUser.displayName || fbUser.email.split("@")[0],
              email:     fbUser.email,
              role:      "operator",
              initials:  (fbUser.displayName || fbUser.email).slice(0, 2).toUpperCase(),
              protected: false,
            };
            await FBUTIL.createUserProfile(fbUser.uid, profile);
          }
          const displayName = profile.name || fbUser.displayName || fbUser.email.split("@")[0] || "User";
          const fullUser = {
            id:       fbUser.uid,
            uid:      fbUser.uid,
            email:    fbUser.email,
            ...profile,
            name:     displayName,
            initials: profile.initials || displayName.slice(0, 2).toUpperCase(),
          };
          AUTH.currentUser = fullUser;
          setUser(fullUser);
        } catch (e) {
          console.error("Auth profile error:", e);
          AUTH.currentUser = null;
          await fbAuth.signOut();
          setUser(null);
        }
      } else {
        AUTH.currentUser = null;
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const handleLogout = () => AUTH.logout();

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <LoginScreen />;
  if (user.role === "homeowner") return <OwnerApp user={user} onLogout={handleLogout} />;
  return <App user={user} onLogout={handleLogout} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
