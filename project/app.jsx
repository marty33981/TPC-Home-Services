// ─────────────────────────────────────────────────────────────
// TPC Home Services — app shell + navigation (Firebase Auth)
// ─────────────────────────────────────────────────────────────

function playReportTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1108, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.14;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.26, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.start(t); osc.stop(t + 0.36);
    });
  } catch(e) {}
}

const SCREENS = {
  dashboard:           (p) => <Dashboard {...p} />,
  properties:          (p) => <Properties {...p} />,
  schedule:            (p) => <Schedule {...p} />,
  alerts:              (p) => <Alerts {...p} />,
  vendors:             (p) => <Vendors {...p} />,
  more:                (p) => <More {...p} />,
  property:            (p) => <PropertyDetail {...p} />,
  inspection:          (p) => <Inspection {...p} />,
  adminUsers:          (p) => <AdminUsers {...p} />,
  adminChecklist:      (p) => <AdminChecklist {...p} />,
  adminInbox:          (p) => <AdminInbox {...p} />,
  operatorReports:     (p) => <OperatorReports {...p} />,
  sendAlert:           (p) => <SendAlert {...p} />,
  adminHub:            (p) => <AdminHub {...p} />,
  adminAdministrators: (p) => <AdminAdministrators {...p} />,
  adminSupervisors:    (p) => <AdminSupervisors {...p} />,
  adminOperators:      (p) => <AdminOperators {...p} />,
  adminHomeowners:     (p) => <AdminHomeowners {...p} />,
  adminProperties:     (p) => <AdminProperties {...p} />,
  profileEdit:         (p) => <ProfileEdit {...p} />,
  photoGallery:        (p) => <PhotoGallery {...p} />,
};

const TABS = [
  { id:"dashboard",  icon:"layout-dashboard", label:"Dashboard" },
  { id:"properties", icon:"home",             label:"Homes" },
  { id:"schedule",   icon:"calendar-event",   label:"Schedule" },
  { id:"alerts",     icon:"bell",             label:"Alerts" },
  { id:"more",       icon:"menu-deep",        label:"More" },
];
const TAB_OF = {
  vendors:"more", adminUsers:"more", adminChecklist:"more", adminInbox:"more",
  operatorReports:"more", sendAlert:"more", adminHub:"more", adminAdministrators:"more",
  adminSupervisors:"more", adminOperators:"more", adminHomeowners:"more",
  adminProperties:"more", profileEdit:"more", photoGallery:"properties",
};

const FULL_SCREENS  = new Set(["inspection"]);
const NOTAB_SCREENS = new Set([
  "property","adminUsers","adminChecklist","adminInbox","sendAlert",
  "adminHub","adminAdministrators","adminSupervisors","adminOperators","adminHomeowners",
  "adminProperties","profileEdit","photoGallery",
]);

function PreviewBanner({ role, onExit }) {
  const labels = { operator:"Operator", homeowner:"Homeowner" };
  return (
    <div style={{ background:"var(--pine)", color:"#fff", padding:"8px 20px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      fontSize:12.5, fontWeight:700, flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <Icon name="eye" size={14} color="rgba(255,255,255,0.75)" />
        Previewing as {labels[role] || role}
      </div>
      <button onClick={onExit} style={{ background:"rgba(255,255,255,0.2)", border:"none",
        color:"#fff", padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700,
        cursor:"pointer", fontFamily:"var(--sans)" }}>
        Exit
      </button>
    </div>
  );
}

function App({ user, onLogout }) {
  const [stack,      setStack]      = useState([{ name:"dashboard", props:{} }]);
  const [alertCount,      setAlertCount]      = useState(0);
  const [viewAs,          setViewAs]          = useState(null); // null = real role
  const [reportCount,     setReportCount]     = useState(0);
  const [alertBadgeCount, setAlertBadgeCount] = useState(0);
  const depthRef    = useRef(1);
  const prevReportRef = useRef(null);

  const effectiveUser = viewAs ? { ...user, role: viewAs } : user;

  const refreshAlertCount = React.useCallback(() => {
    if (typeof FBUTIL !== "undefined") {
      FBUTIL.getAllHomeownerAlerts().then(list => setAlertCount(list.length)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    refreshAlertCount();
    if (!user?.uid) return;
    FBUTIL.requestPushPermission(user.uid).catch(() => {});
    const unsub = db.collection("users").doc(user.uid).onSnapshot(snap => {
      const data    = snap.data() || {};
      const reports = data.unreadReports || 0;
      const alerts  = data.unreadAlerts  || 0;
      const total   = reports + alerts;

      setReportCount(reports);
      setAlertBadgeCount(alerts);

      if ("setAppBadge" in navigator) {
        total > 0 ? navigator.setAppBadge(total) : navigator.clearAppBadge();
      }

      if (prevReportRef.current !== null && reports > prevReportRef.current) {
        playReportTone();
      }
      prevReportRef.current = reports;
    }, () => {});
    return unsub;
  }, [user?.uid]);

  const handleSwitchView = React.useCallback((role) => {
    const next = (role === user.role) ? null : role;
    AUTH.currentUser = next ? { ...user, role: next } : user;
    setViewAs(next);
    setStack([{ name:"dashboard", props:{} }]);
    depthRef.current = 1;
  }, [user.role]);

  const nav = {
    go: (name) => {
      if (name === "operatorReports" && user?.uid) FBUTIL.markReportsRead(user.uid).catch(() => {});
      if (name === "alerts"          && user?.uid) FBUTIL.markAlertsRead(user.uid).catch(() => {});
      setStack([{ name, props:{} }]);
    },
    push: (name, props={}) => {
      if (name === "operatorReports" && user?.uid) FBUTIL.markReportsRead(user.uid).catch(() => {});
      if (name === "alerts"          && user?.uid) FBUTIL.markAlertsRead(user.uid).catch(() => {});
      setStack(s => [...s, { name, props }]);
    },
    back: () => setStack(s => s.length > 1 ? s.slice(0,-1) : s),
  };

  // Homeowner preview — render OwnerApp with banner
  if (viewAs === "homeowner") {
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
        <PreviewBanner role="homeowner" onExit={() => handleSwitchView(null)} />
        {/* position:relative + absolute inner gives .hw-app a proper height:100% containing block */}
        <div style={{ position:"relative", flex:1, minHeight:0 }}>
          <div style={{ position:"absolute", inset:0 }}>
            <OwnerApp user={effectiveUser} onLogout={onLogout} />
          </div>
        </div>
      </div>
    );
  }

  const cur       = stack[stack.length-1];
  const activeTab = TAB_OF[cur.name] || cur.name;
  const isFull    = FULL_SCREENS.has(cur.name);
  const showTab   = !isFull && !NOTAB_SCREENS.has(cur.name);

  const pushed = stack.length > depthRef.current;
  depthRef.current = stack.length;
  const animClass = pushed || NOTAB_SCREENS.has(cur.name) || isFull ? "anim-slide" : "anim-fade";

  const screenEl = (SCREENS[cur.name] || SCREENS.dashboard)({
    ...cur.props, nav, user: effectiveUser, onLogout,
    canGoBack: stack.length > 1,
    onAlertsCleared: refreshAlertCount,
    onSwitchView: handleSwitchView,
    previewRole: viewAs,
  });

  if (isFull) {
    return <div key={cur.name + stack.length} className="anim-slide hw-full">{screenEl}</div>;
  }

  return (
    <div className="hw-app">
      {viewAs && <PreviewBanner role={viewAs} onExit={() => handleSwitchView(null)} />}
      <div key={cur.name + stack.length} className={animClass}
        style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
        {screenEl}
      </div>
      {showTab && <TabBar active={activeTab} nav={nav} alertCount={alertCount} reportCount={reportCount} alertBadgeCount={alertBadgeCount} />}
    </div>
  );
}

function TabBar({ active, nav, alertCount = 0, reportCount = 0, alertBadgeCount = 0 }) {
  const tabs = TABS.map(t => {
    if (t.id === "alerts" && alertBadgeCount > 0) return { ...t, badge: alertBadgeCount };
    if (t.id === "alerts") return { ...t, badge: alertCount };
    if (t.id === "more"   && reportCount > 0)    return { ...t, badge: reportCount };
    return t;
  });
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
          const email = (fbUser.email || "").toLowerCase();
          if (!profile) {
            let role = "operator";
            let isProtected = false;
            let name = fbUser.displayName || fbUser.email.split("@")[0];
            if (email === "marty@truexpreferredconstruction.com") {
              role = "administrator"; isProtected = true; name = "Marty Truex";
            } else if (email === "gina@truexpreferredconstruction.com") {
              role = "supervisor"; name = "Gina";
            }
            profile = {
              name, email: fbUser.email, role,
              initials: name.slice(0, 2).toUpperCase(),
              protected: isProtected,
            };
            await FBUTIL.createUserProfile(fbUser.uid, profile);
          } else {
            // Enforce correct roles for known accounts — fixes existing profiles with wrong role
            if (email === "marty@truexpreferredconstruction.com" && profile.role !== "administrator") {
              await FBUTIL.updateUserProfile(fbUser.uid, { role: "administrator", protected: true });
              profile = { ...profile, role: "administrator", protected: true };
            } else if (email === "gina@truexpreferredconstruction.com" && profile.role !== "supervisor") {
              await FBUTIL.updateUserProfile(fbUser.uid, { role: "supervisor" });
              profile = { ...profile, role: "supervisor" };
            }
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
