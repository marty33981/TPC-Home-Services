// ─────────────────────────────────────────────────────────────
// TPC Home Services — Auth (Firebase Email/Password)
// Roles: administrator | operator | homeowner
// User accounts live in Firebase Auth; profiles in Firestore users/{uid}
// ─────────────────────────────────────────────────────────────

// ── AUTH helper (user management backed by Firestore) ────────
window.AUTH = {
  currentUser: null,   // set by Root's onAuthStateChanged listener

  isAdmin()      { return this.currentUser?.role === "administrator"; },
  isSupervisor() { return this.currentUser?.role === "supervisor"; },
  isOperator()   { return this.isAdmin() || this.isSupervisor(); },

  logout() { return fbAuth.signOut(); },

  async addUser(data) {
    // Creates an invitation in Firestore. The user will sign up themselves
    // using the Create Account flow on the login screen.
    const targetRole = data.role || "operator";

    if (targetRole === "administrator" && !this.isAdmin())
      return { ok: false, error: "Only the administrator can add administrators." };

    if (targetRole === "supervisor" && !this.isAdmin())
      return { ok: false, error: "Only the administrator can add supervisors." };

    const all = await FBUTIL.listUsers();
    if (targetRole === "supervisor" && all.filter(u => u.role === "supervisor").length >= 5)
      return { ok: false, error: "Maximum 5 supervisors allowed." };
    if (targetRole === "operator" && all.filter(u => u.role === "operator").length >= 5)
      return { ok: false, error: "Maximum 5 operators allowed." };

    // Check if already invited or already has an account
    const existing = await FBUTIL.getInvitation(data.email);
    if (existing)
      return { ok: false, error: "An invitation already exists for that email." };

    await FBUTIL.createInvitation({
      name:           data.name,
      email:          data.email,
      role:           targetRole,
      initials:       data.initials || data.name.slice(0, 2).toUpperCase(),
      phone:          data.phone || "",
      receiveReports: (targetRole === "supervisor") ? (data.receiveReports !== false) : false,
      invitedBy:      this.currentUser?.uid || "",
    });
    return { ok: true };
  },

  async updateUser(uid, data) {
    const target = await FBUTIL.getUserProfile(uid);

    if (target?.protected)
      return { ok: false, error: "The primary administrator account cannot be modified." };

    if (target?.role === "administrator" && !this.isAdmin())
      return { ok: false, error: "Only the administrator can modify administrator accounts." };

    // Supervisors cannot edit other supervisors
    if (this.isSupervisor() && target?.role === "supervisor")
      return { ok: false, error: "Supervisors cannot modify other supervisors." };

    if (data.role === "administrator" && !this.isAdmin())
      return { ok: false, error: "Cannot assign the administrator role." };

    // Only administrator can change to/from supervisor role
    const roleChanging = data.role && target?.role !== data.role;
    if (roleChanging && (data.role === "supervisor" || target?.role === "supervisor") && !this.isAdmin())
      return { ok: false, error: "Only the administrator can change supervisor roles." };

    if (roleChanging) {
      const all = await FBUTIL.listUsers();
      if (data.role === "supervisor" && all.filter(u => u.role === "supervisor").length >= 5)
        return { ok: false, error: "Maximum 5 supervisors allowed." };
      if (data.role === "operator" && all.filter(u => u.role === "operator").length >= 5)
        return { ok: false, error: "Maximum 5 operators allowed." };
    }

    const update = {};
    if (data.name           !== undefined) update.name           = data.name;
    if (data.role           !== undefined) update.role           = data.role;
    if (data.initials       !== undefined) update.initials       = data.initials;
    if (data.phone          !== undefined) update.phone          = data.phone;
    if (data.receiveReports !== undefined) update.receiveReports = data.receiveReports;
    await FBUTIL.updateUserProfile(uid, update);
    return { ok: true };
  },

  async deleteUser(uid) {
    const target = await FBUTIL.getUserProfile(uid);

    if (target?.protected)
      return { ok: false, error: "The primary administrator account cannot be deleted." };

    if (target?.role === "administrator" && !this.isAdmin())
      return { ok: false, error: "Only the administrator can delete administrator accounts." };

    // Supervisors cannot delete other supervisors
    if (this.isSupervisor() && target?.role === "supervisor")
      return { ok: false, error: "Supervisors cannot remove other supervisors." };

    await FBUTIL.deleteUserProfile(uid);
    return { ok: true };
  },

  sendToAdmins(msg) { FBUTIL.sendAdminMessage(msg); },
  async getAdminMessages() { return FBUTIL.getAdminMessages(); },
};

// ── Translate Firebase error codes to friendly messages ──────
function fbAuthError(code) {
  const map = {
    "auth/user-not-found":        "No account found for that email.",
    "auth/wrong-password":        "Incorrect password.",
    "auth/invalid-email":         "Please enter a valid email address.",
    "auth/too-many-requests":     "Too many attempts. Please try again later.",
    "auth/user-disabled":         "This account has been disabled.",
    "auth/invalid-credential":    "Invalid email or password.",
    "auth/network-request-failed":"Network error. Check your connection.",
  };
  return map[code] || "Sign-in failed. Please try again.";
}

// ── Login Screen ─────────────────────────────────────────────
function LoginScreen() {
  const [email,       setEmail]       = React.useState("");
  const [pwd,         setPwd]         = React.useState("");
  const [show,        setShow]        = React.useState(false);
  const [err,         setErr]         = React.useState("");
  const [busy,        setBusy]        = React.useState(false);
  const [showSignUp,  setShowSignUp]  = React.useState(false);

  if (showSignUp) return <SignUpScreen onBack={() => setShowSignUp(false)} />;

  const submit = async () => {
    setErr("");
    if (!email || !pwd) { setErr("Please enter your email and password."); return; }
    setBusy(true);
    try {
      await fbAuth.signInWithEmailAndPassword(email.trim(), pwd);
      // Root's onAuthStateChanged handles the rest
    } catch (e) {
      setErr(fbAuthError(e.code));
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px", background:"var(--bg)" }}>
      <div style={{ marginBottom:28, textAlign:"center" }}>
        <Logo size={54} />
        <div style={{ marginTop:14, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>TPC Home Services</div>
        <div style={{ fontSize:14, color:"var(--ink-3)", fontWeight:600, marginTop:4 }}>Sign in to your account</div>
      </div>

      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Email</div>
          <input type="email" value={email} placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width:"100%", padding:"12px 14px", borderRadius:"var(--r-sm)",
              border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
              background:"var(--surface)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
        </div>

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Password</div>
          <div style={{ position:"relative" }}>
            <input type={show ? "text" : "password"} value={pwd} placeholder="••••••••••"
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ width:"100%", padding:"12px 42px 12px 14px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--surface)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
            <button onClick={() => setShow(s => !s)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                border:"none", background:"transparent", cursor:"pointer", color:"var(--ink-3)",
                padding:0, display:"flex" }}>
              <Icon name={show ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>

        {err && (
          <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)",
            padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>
        )}

        <button onClick={submit} disabled={busy}
          style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            cursor:busy ? "wait" : "pointer", background:"var(--pine)", color:"#fff",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
            opacity:busy ? 0.7 : 1, transition:"opacity .15s" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <button onClick={() => setShowSignUp(true)}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
            background:"transparent", color:"var(--ink-2)", fontSize:15, fontWeight:700,
            fontFamily:"var(--sans)", cursor:"pointer" }}>
          Create your account
        </button>
      </div>

      <div style={{ marginTop:32, fontSize:12, color:"var(--ink-3)", fontWeight:500, textAlign:"center" }}>
        TPC Home Services · v{HW.version.number}
      </div>
    </div>
  );
}

// ── Sign Up Screen (invite-gated) ────────────────────────────
function SignUpScreen({ onBack }) {
  const [email,    setEmail]    = React.useState("");
  const [pwd,      setPwd]      = React.useState("");
  const [confirm,  setConfirm]  = React.useState("");
  const [showPwd,  setShowPwd]  = React.useState(false);
  const [step,     setStep]     = React.useState("email"); // "email" | "password" | "done"
  const [invite,   setInvite]   = React.useState(null);
  const [err,      setErr]      = React.useState("");
  const [busy,     setBusy]     = React.useState(false);

  const ROLE_LABELS = { supervisor:"Supervisor", operator:"Operator", homeowner:"Homeowner" };

  const checkEmail = async () => {
    if (!email.trim()) { setErr("Please enter your email."); return; }
    setBusy(true); setErr("");
    const inv = await FBUTIL.getInvitation(email.trim());
    if (!inv) {
      setErr("No invitation found for that email. If you already have an account, sign in and update your password in account settings.");
    } else {
      setInvite(inv);
      setStep("password");
    }
    setBusy(false);
  };

  const createAccount = async () => {
    const vErr = validatePassword(pwd);
    if (vErr)            { setErr(vErr); return; }
    if (pwd !== confirm) { setErr("Passwords don't match."); return; }
    setBusy(true); setErr("");
    try {
      const cred = await fbAuth.createUserWithEmailAndPassword(email.trim(), pwd);
      const uid  = cred.user.uid;
      const today = new Date().toISOString().slice(0, 10);
      await FBUTIL.createUserProfile(uid, {
        name:              invite.name,
        email:             email.trim().toLowerCase(),
        role:              invite.role,
        initials:          invite.initials || invite.name.slice(0,2).toUpperCase(),
        phone:             invite.phone || "",
        receiveReports:    invite.receiveReports || false,
        protected:         false,
        password:          pwd,
        passwordChangedAt: today,
      });
      await FBUTIL.deleteInvitation(email.trim());
      if (invite.propertyId) {
        await FBUTIL.savePropertyOverrides(String(invite.propertyId), {
          homeownerId: uid,
          owner: { name: invite.name, email: email.trim().toLowerCase(), phone: invite.phone || "" },
        });
      }
      sessionStorage.setItem("tpc_just_signed_up", "1");
    } catch (e) {
      const map = {
        "auth/email-already-in-use": "You already have an account. Please sign in — you can update your password in account settings.",
        "auth/weak-password":        "Password must be at least 8 characters.",
        "auth/invalid-email":        "Please enter a valid email address.",
      };
      setErr(map[e.code] || "Could not create account. Please try again.");
      setBusy(false);
    }
  };

  const inputStyle = {
    width:"100%", padding:"12px 14px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
    background:"var(--surface)", color:"var(--ink)", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px", background:"var(--bg)" }}>

      <button onClick={onBack}
        style={{ position:"absolute", top:52, left:20, border:"none", background:"transparent",
          cursor:"pointer", display:"flex", alignItems:"center", gap:6,
          fontSize:14, fontWeight:700, color:"var(--ink-2)", padding:0 }}>
        <Icon name="arrow-left" size={18} color="var(--ink-2)" /> Back
      </button>

      <div style={{ marginBottom:28, textAlign:"center" }}>
        <Logo size={54} />
        <div style={{ marginTop:14, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>TPC Home Services</div>
        <div style={{ fontSize:14, color:"var(--ink-3)", fontWeight:600, marginTop:4 }}>
          {step === "email" ? "Create your account" : `Welcome, ${invite?.name?.split(" ")[0]}!`}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>

        {step === "email" && (
          <>
            <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r-sm)",
              padding:"11px 13px", fontSize:13, color:"var(--ink-2)", lineHeight:1.5,
              display:"flex", gap:9, alignItems:"flex-start" }}>
              <Icon name="info-circle" size={16} color="var(--pine)" style={{ flexShrink:0, marginTop:1 }} />
              Your TPC administrator must invite you before you can create an account.
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Email address</div>
              <input type="email" value={email} placeholder="you@example.com"
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && checkEmail()}
                style={inputStyle} />
            </div>
            {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)",
              borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>}
            <button onClick={checkEmail} disabled={busy}
              style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none",
                cursor:busy?"wait":"pointer", background:"var(--pine)", color:"#fff",
                fontSize:16, fontWeight:800, fontFamily:"var(--sans)", opacity:busy?0.7:1 }}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </>
        )}

        {step === "password" && invite && (
          <>
            <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r-sm)", padding:"13px 14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--pine)" }}>Your invitation</div>
              <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:4, lineHeight:1.5 }}>
                <b>{invite.name}</b> · {ROLE_LABELS[invite.role] || invite.role}
              </div>
            </div>
            <div style={{ background:"var(--info-bg)", borderRadius:"var(--r-sm)", padding:"10px 13px",
              fontSize:12.5, color:"var(--ink-2)", lineHeight:1.65 }}>
              8+ characters · one capital letter · one number · one symbol: ! @ # $ *
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Choose a password</div>
              <div style={{ position:"relative" }}>
                <input type={showPwd ? "text" : "password"} value={pwd}
                  placeholder="At least 8 characters"
                  onChange={e => setPwd(e.target.value)}
                  style={{ ...inputStyle, paddingRight:42 }} />
                <button onClick={() => setShowPwd(s => !s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                    border:"none", background:"transparent", cursor:"pointer", color:"var(--ink-3)", padding:0 }}>
                  <Icon name={showPwd ? "eye-off" : "eye"} size={18} />
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Confirm password</div>
              <input type="password" value={confirm} placeholder="Re-enter password"
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createAccount()}
                style={inputStyle} />
            </div>
            {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)",
              borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>}
            <button onClick={createAccount} disabled={busy}
              style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none",
                cursor:busy?"wait":"pointer", background:"var(--pine)", color:"#fff",
                fontSize:16, fontWeight:800, fontFamily:"var(--sans)", opacity:busy?0.7:1 }}>
              {busy ? "Creating account…" : "Create account"}
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop:32, fontSize:12, color:"var(--ink-3)", fontWeight:500, textAlign:"center" }}>
        TPC Home Services · v{HW.version.number}
      </div>
    </div>
  );
}

// ── Force Password Change (shown when password has expired) ──
function ForcePasswordChange({ user, onDone }) {
  const [curPwd,     setCurPwd]     = React.useState("");
  const [newPwd,     setNewPwd]     = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [busy,       setBusy]       = React.useState(false);
  const [err,        setErr]        = React.useState("");

  const submit = async () => {
    setErr("");
    if (!curPwd) { setErr("Enter your current password."); return; }
    const vErr = validatePassword(newPwd);
    if (vErr) { setErr(vErr); return; }
    if (newPwd !== confirmPwd) { setErr("Passwords don't match."); return; }
    setBusy(true);
    try {
      const cred = firebase.auth.EmailAuthProvider.credential(fbAuth.currentUser.email, curPwd);
      await fbAuth.currentUser.reauthenticateWithCredential(cred);
      await fbAuth.currentUser.updatePassword(newPwd);
      const today = new Date().toISOString().slice(0, 10);
      if (user?.uid) await FBUTIL.updateUserProfile(user.uid, { password: newPwd, passwordChangedAt: today });
      AUTH.currentUser = { ...AUTH.currentUser, passwordChangedAt: today };
      onDone();
    } catch(e) {
      const msgs = { "auth/wrong-password":"Current password is incorrect.", "auth/invalid-credential":"Current password is incorrect." };
      setErr(msgs[e.code] || "Password change failed. Please try again.");
    }
    setBusy(false);
  };

  const inp = { width:"100%", padding:"12px 14px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
    background:"var(--surface)", color:"var(--ink)", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px", background:"var(--bg)" }}>
      <div style={{ marginBottom:24, textAlign:"center" }}>
        <Logo size={54} />
        <div style={{ marginTop:14, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>Password Expired</div>
        <div style={{ fontSize:14, color:"var(--ink-3)", fontWeight:600, marginTop:6, maxWidth:300, lineHeight:1.5 }}>
          Your password has expired after 120 days. Please set a new password to continue.
        </div>
      </div>
      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ background:"var(--info-bg)", borderRadius:"var(--r-sm)", padding:"11px 13px",
          fontSize:12.5, color:"var(--ink-2)", lineHeight:1.65 }}>
          8+ characters · one capital letter · one number · one symbol: ! @ # $ *
        </div>
        {[
          { label:"Current password", val:curPwd,     set:setCurPwd },
          { label:"New password",     val:newPwd,     set:setNewPwd },
          { label:"Confirm new",      val:confirmPwd, set:setConfirmPwd },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>{f.label}</div>
            <input type="password" value={f.val} placeholder="••••••••"
              onChange={e => f.set(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={inp} />
          </div>
        ))}
        {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)",
          borderRadius:"var(--r-sm)", padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>}
        <button onClick={submit} disabled={busy}
          style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            cursor:busy?"wait":"pointer", background:"var(--pine)", color:"#fff",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)", opacity:busy?0.7:1 }}>
          {busy ? "Updating…" : "Set new password"}
        </button>
        <button onClick={() => { AUTH.logout(); }}
          style={{ padding:"11px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
            background:"transparent", color:"var(--ink-2)", fontSize:14, fontWeight:700,
            fontFamily:"var(--sans)", cursor:"pointer" }}>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Admin: User Management ────────────────────────────────────
function AdminUsers({ nav }) {
  const [users,         setUsers]         = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);
  const [modal,         setModal]         = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [err,           setErr]           = React.useState("");

  const [invites, setInvites] = React.useState([]);

  const refresh = async () => {
    setLoading(true);
    const [u, inv] = await Promise.all([FBUTIL.listUsers(), FBUTIL.listInvitations()]);
    setUsers(u);
    const existingEmails = new Set(u.map(x => x.email?.toLowerCase()).filter(Boolean));
    setInvites(inv.filter(i => !existingEmails.has(i.email?.toLowerCase())));
    setLoading(false);
  };
  React.useEffect(() => { refresh(); }, []);

  const isAdmin      = AUTH.isAdmin();
  const isSupervisor = AUTH.isSupervisor();

  // Admin sees supervisors + operators + homeowners (plus protected admin as read-only)
  // Supervisor sees operators + homeowners only
  const visibleUsers = users.filter(u => {
    if (u.protected)   return isAdmin;
    if (isAdmin)       return u.role !== "administrator";
    return u.role === "operator" || u.role === "homeowner";
  });

  // Role options for add/edit
  const ROLES = isAdmin ? ["supervisor", "operator", "homeowner"] : ["operator", "homeowner"];

  const roleColor = { supervisor:"var(--pine)", administrator:"var(--pine)", operator:"var(--info)", homeowner:"var(--ok)" };
  const roleBg    = { supervisor:"var(--mint-bg)", administrator:"var(--mint-bg)", operator:"var(--info-bg)", homeowner:"var(--ok-bg)" };

  const supervisorCount = users.filter(u => u.role === "supervisor").length;
  const operatorCount   = users.filter(u => u.role === "operator").length;

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="User Management"
          sub={isAdmin ? "Administrator" : "Supervisor"}
          right={
            <button onClick={() => setModal("add")}
              style={{ width:36, height:36, borderRadius:999, border:"none", background:"var(--pine)",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        {/* capacity pills */}
        {!loading && (
          <div style={{ display:"flex", gap:8, padding:"4px 20px 8px" }}>
            {isAdmin && (
              <span style={{ fontSize:12, fontWeight:700, padding:"5px 11px", borderRadius:999,
                background: supervisorCount >= 5 ? "var(--danger-bg)" : "var(--mint-bg)",
                color: supervisorCount >= 5 ? "var(--danger)" : "var(--pine)" }}>
                Supervisors {supervisorCount}/5
              </span>
            )}
            <span style={{ fontSize:12, fontWeight:700, padding:"5px 11px", borderRadius:999,
              background: operatorCount >= 5 ? "var(--danger-bg)" : "var(--info-bg)",
              color: operatorCount >= 5 ? "var(--danger)" : "var(--info)" }}>
              Operators {operatorCount}/5
            </span>
          </div>
        )}

        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:10 }}>
          {loading && <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>}

          {/* Pending invitations */}
          {!loading && invites.length > 0 && (
            <>
              <div className="eyebrow" style={{ paddingLeft:2, marginTop:4 }}>Pending invitations</div>
              {invites.map(inv => (
                <div key={inv.id} className="card" style={{ padding:"14px 16px", display:"flex",
                  alignItems:"center", gap:12, background:"var(--info-bg)",
                  border:"1.5px dashed var(--info)" }}>
                  <div style={{ width:40, height:40, borderRadius:999, background:"var(--info)",
                    color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon name="mail" size={19} color="#fff" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{inv.name}</div>
                    <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{inv.email}</div>
                    <div style={{ display:"flex", gap:6, marginTop:5 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:999,
                        background:roleBg[inv.role]||"var(--bg-2)", color:roleColor[inv.role]||"var(--ink-2)" }}>
                        {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button onClick={async () => {
                    await FBUTIL.deleteInvitation(inv.email);
                    refresh();
                  }} style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"var(--danger-bg)", color:"var(--danger)",
                    display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
              <div className="eyebrow" style={{ paddingLeft:2, marginTop:4 }}>Active users</div>
            </>
          )}

          {!loading && (() => {
            const renderUser = u => (
              <div key={u.id} className="card" style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:999, background:"var(--pine)", color:"#fff",
                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 }}>
                  {(u.initials || u.name.slice(0,2)).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>{u.name}</span>
                    {u.protected && <Icon name="shield-check" size={14} color="var(--pine)" />}
                  </div>
                  <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1, overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:5 }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:999,
                      background:roleBg[u.role]||"var(--bg-2)", color:roleColor[u.role]||"var(--ink-2)" }}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                    {u.receiveReports && (u.role === "supervisor" || u.role === "administrator") && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:999,
                        background:"var(--info-bg)", color:"var(--info)" }}>
                        Reports on
                      </span>
                    )}
                  </div>
                </div>
                {!u.protected && !(isSupervisor && u.role === "supervisor") && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setModal(u)}
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
            );

            const sections = isAdmin
              ? [
                  { label:"Administrators", icon:"shield-check", color:"var(--pine)",   bg:"var(--mint-bg)",  roles:["administrator"] },
                  { label:"Supervisors",    icon:"eye",          color:"var(--ok)",     bg:"var(--ok-bg)",   roles:["supervisor"] },
                  { label:"Operators",      icon:"tool",         color:"var(--info)",   bg:"var(--info-bg)", roles:["operator"] },
                  { label:"Homeowners",     icon:"home",         color:"var(--warn)",   bg:"var(--warn-bg)", roles:["homeowner"] },
                ]
              : [
                  { label:"Operators",  icon:"tool", color:"var(--info)", bg:"var(--info-bg)", roles:["operator"] },
                  { label:"Homeowners", icon:"home", color:"var(--warn)", bg:"var(--warn-bg)", roles:["homeowner"] },
                ];

            return sections.map(sec => {
              const group = visibleUsers.filter(u => sec.roles.includes(u.role));
              if (group.length === 0) return null;
              return (
                <React.Fragment key={sec.label}>
                  <div className="eyebrow" style={{ paddingLeft:2, marginTop:8, display:"flex", alignItems:"center", gap:5 }}>
                    <Icon name={sec.icon} size={12} color={sec.color} />
                    {sec.label} ({group.length})
                  </div>
                  {group.map(renderUser)}
                </React.Fragment>
              );
            });
          })()}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmSheet
          message={`Remove ${(users.find(u => u.id === confirmDelete)||{}).name || "this user"}?`}
          onConfirm={async () => {
            const res = await AUTH.deleteUser(confirmDelete);
            if (res.ok) { setConfirmDelete(null); refresh(); }
            else { setErr(res.error); setConfirmDelete(null); }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {err !== "" && !modal && (
        <div style={{ position:"fixed", bottom:20, left:20, right:20, maxWidth:440, margin:"0 auto",
          background:"var(--danger)", color:"#fff", borderRadius:"var(--r-sm)", padding:"12px 16px",
          fontSize:13.5, fontWeight:600, zIndex:200, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {err}
          <button onClick={() => setErr("")} style={{ border:"none", background:"transparent", color:"#fff", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={18} color="#fff" />
          </button>
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          roles={ROLES}
          onSave={async (data) => {
            setErr("");
            const res = modal === "add"
              ? await AUTH.addUser(data)
              : await AUTH.updateUser(modal.id, data);
            if (!res.ok) { setErr(res.error); return; }
            refresh(); setModal(null);
          }}
          onClose={() => { setModal(null); setErr(""); }}
          err={err}
        />
      )}
    </div>
  );
}

function UserModal({ user, roles, onSave, onClose, err }) {
  const [name,           setName]           = React.useState(user?.name     || "");
  const [email,          setEmail]          = React.useState(user?.email    || "");
  const [role,           setRole]           = React.useState(user?.role     || roles[0] || "operator");
  const [initials,       setInitials]       = React.useState(user?.initials || "");
  const [phone,          setPhone]          = React.useState(user?.phone    || "");
  const [receiveReports, setReceiveReports] = React.useState(user?.receiveReports !== false);
  const [busy,           setBusy]           = React.useState(false);
  const [showStoredPwd,  setShowStoredPwd]  = React.useState(false);
  const isEdit    = !!user;
  const callerIsAdmin = AUTH.currentUser?.email === "marty@truexpreferredconstruction.com";

  const showReportsToggle = role === "supervisor" || role === "administrator";

  const save = async () => {
    if (!name || !email) return;
    setBusy(true);
    await onSave({ name, email, role, initials: initials || name.slice(0,2).toUpperCase(), phone, receiveReports });
    setBusy(false);
  };

  const ROLE_LABELS = { administrator:"Administrator", supervisor:"Supervisor", operator:"Operator", homeowner:"Homeowner" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px",
        display:"flex", flexDirection:"column", gap:14, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{isEdit ? "Edit user" : "Add user"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {[
          { label:"Full name",               val:name,     set:setName,     type:"text",  ph:"Jane Smith" },
          { label:"Email",                    val:email,    set:setEmail,    type:"email", ph:"jane@example.com" },
          { label:"Initials (optional)",      val:initials, set:setInitials, type:"text",  ph:"JS" },
          { label:"Phone (for SMS reports)",  val:phone,    set:setPhone,    type:"tel",   ph:"(941) 555-0000" },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
            <input type={f.type} value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}

        {isEdit && callerIsAdmin && (
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Password on file</div>
            <div style={{ display:"flex", alignItems:"center", gap:8,
              background:"var(--bg-2)", borderRadius:"var(--r-sm)", padding:"10px 13px",
              border:"1.5px solid var(--line)" }}>
              <span style={{ flex:1, fontSize:15, fontFamily:"var(--sans)", color:"var(--ink)", letterSpacing: showStoredPwd ? 0 : 3 }}>
                {user.password ? (showStoredPwd ? user.password : "••••••••") : <span style={{ color:"var(--ink-3)", fontSize:13, letterSpacing:0 }}>Not on file</span>}
              </span>
              {user.password && (
                <button onClick={() => setShowStoredPwd(v => !v)}
                  style={{ border:"none", background:"none", cursor:"pointer", padding:2, color:"var(--ink-3)", display:"flex" }}>
                  <Icon name={showStoredPwd ? "eye-off" : "eye"} size={18} color="var(--ink-3)" />
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Role</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {roles.map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{ flex:1, minWidth:80, padding:"9px 0", borderRadius:"var(--r-sm)", border:"none",
                  cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: role===r ? "var(--pine)" : "var(--bg-2)",
                  color: role===r ? "#fff" : "var(--ink-2)", transition:"all .15s" }}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {showReportsToggle && (
          <button onClick={() => setReceiveReports(r => !r)}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
              background:"var(--bg-2)", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer", textAlign:"left", width:"100%" }}>
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, transition:"all .2s",
              border:`2px solid ${receiveReports ? "var(--mint)" : "var(--line)"}`,
              background: receiveReports ? "var(--mint)" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {receiveReports && <Icon name="check" size={14} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--ink)" }}>Receive operator reports</div>
              <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:1 }}>Email + text when an operator submits a report</div>
            </div>
          </button>
        )}

        {!isEdit && (
          <div style={{ background:"var(--mint-bg)", color:"var(--pine)", borderRadius:"var(--r-sm)",
            padding:"10px 13px", fontSize:13, fontWeight:600, lineHeight:1.5,
            display:"flex", gap:9, alignItems:"flex-start" }}>
            <Icon name="mail" size={16} color="var(--pine)" style={{ flexShrink:0, marginTop:1 }} />
            An invitation will be created. The user signs up themselves on the login screen using this email.
          </div>
        )}

        {err && (
          <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)",
            padding:"9px 13px", fontSize:13, fontWeight:600 }}>{err}</div>
        )}

        <button onClick={save} disabled={busy}
          style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
            fontFamily:"var(--sans)", cursor:busy?"wait":"pointer", opacity:busy?0.7:1 }}>
          {isEdit ? "Save changes" : "Add user"}
        </button>
      </div>
    </div>
  );
}

// ── Admin: Inspection Checklist ───────────────────────────────
// ── Item editor sheet (shared by AdminChecklist drill-in) ─────
function ChecklistItemSheet({ item, cats, onSave, onClose }) {
  const [label, setLabel] = React.useState(item?.label || "");
  const [cat,   setCat]   = React.useState(item?.cat   || cats[0] || "");
  const [note,  setNote]  = React.useState(item?.note  || "");
  const [newCat, setNewCat] = React.useState("");
  const allCats = cats.includes("Other") ? cats : [...cats, "Other"];

  const save = () => {
    const chosenCat = cat === "__new__" ? newCat.trim() : cat;
    if (!label.trim() || !chosenCat) return;
    onSave({ id: item?.id || Date.now(), label: label.trim(), cat: chosenCat, note: note.trim() });
  };

  const inp = { width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
    border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
    background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px",
        display:"flex", flexDirection:"column", gap:14, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{item ? "Edit item" : "Add item"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer" }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Item label</div>
          <input value={label} placeholder="e.g. Check roof gutters" onChange={e => setLabel(e.target.value)} style={inp} />
        </div>
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Category</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom: cat==="__new__" ? 8 : 0 }}>
            {allCats.map(c => (
              <button key={c} onClick={() => setCat(c)}
                style={{ padding:"8px 14px", borderRadius:999, border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: cat===c ? "var(--pine)" : "var(--bg-2)",
                  color: cat===c ? "#fff" : "var(--ink-2)" }}>{c}</button>
            ))}
            <button onClick={() => setCat("__new__")}
              style={{ padding:"8px 14px", borderRadius:999, border:"1.5px dashed var(--line)", cursor:"pointer",
                fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                background: cat==="__new__" ? "var(--pine)" : "transparent",
                color: cat==="__new__" ? "#fff" : "var(--ink-3)" }}>+ New category</button>
          </div>
          {cat === "__new__" && (
            <input value={newCat} placeholder="Category name…" onChange={e => setNewCat(e.target.value)} style={inp} />
          )}
        </div>
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Notes (optional)</div>
          <textarea value={note} placeholder="Context or instructions for operators…"
            onChange={e => setNote(e.target.value)} rows={3}
            style={{ ...inp, resize:"vertical", lineHeight:1.5 }} />
        </div>
        <button onClick={save} style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
          background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
          fontFamily:"var(--sans)", cursor:"pointer" }}>
          {item ? "Save changes" : "Add item"}
        </button>
      </div>
    </div>
  );
}

// ── Checklist item list (drill-in for a single named checklist) ──
function ChecklistEditor({ checklist, nav, onUpdated }) {
  const [items,      setItems]      = React.useState(checklist.items || []);
  const [editing,    setEditing]    = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [renaming,   setRenaming]   = React.useState(false);
  const [nameVal,    setNameVal]    = React.useState(checklist.name);
  const [busy,       setBusy]       = React.useState(false);
  const [allLists,   setAllLists]   = React.useState(null); // loaded lazily for copy dropdown
  const [copyMsg,    setCopyMsg]    = React.useState("");

  const cats = [...new Set(items.map(c => c.cat).filter(Boolean))];

  const persist = async (newItems) => {
    setItems(newItems);
    await FBUTIL.updateChecklist(checklist.id, { items: newItems });
    if (onUpdated) onUpdated();
  };

  const saveItem = async (item) => {
    const idx = items.findIndex(c => c.id === item.id);
    const updated = idx >= 0
      ? items.map((c, i) => i === idx ? item : c)
      : [...items, item];
    await persist(updated);
    setEditing(null);
  };

  const deleteItem = async (id) => {
    await persist(items.filter(c => c.id !== id));
    setConfirmDel(null);
  };

  const saveName = async () => {
    if (!nameVal.trim()) return;
    setBusy(true);
    await FBUTIL.updateChecklist(checklist.id, { name: nameVal.trim() });
    if (onUpdated) onUpdated();
    setBusy(false);
    setRenaming(false);
  };

  const setDefault = async () => {
    setBusy(true);
    await FBUTIL.setDefaultChecklist(checklist.id);
    if (onUpdated) onUpdated();
    setBusy(false);
  };

  const groups = {};
  items.forEach(c => { (groups[c.cat || "Uncategorized"] = groups[c.cat || "Uncategorized"] || []).push(c); });

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back}
          title={checklist.name}
          sub={`${items.length} items${checklist.isDefault ? " · Default checklist" : ""}`}
          right={
            <button onClick={() => setEditing("new")}
              style={{ width:36, height:36, borderRadius:999, border:"none", background:"var(--pine)",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        {/* Checklist actions */}
        <div style={{ padding:"0 20px 12px", display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <button onClick={() => setRenaming(true)}
            style={{ padding:"7px 14px", borderRadius:999, border:"1.5px solid var(--line)", background:"var(--bg)",
              fontSize:13, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer", color:"var(--ink)" }}>
            <Icon name="edit" size={13} style={{ verticalAlign:-2, marginRight:5 }} />Rename
          </button>
          {!checklist.isDefault && (
            <button onClick={setDefault} disabled={busy}
              style={{ padding:"7px 14px", borderRadius:999, border:"1.5px solid var(--pine)", background:"var(--bg)",
                fontSize:13, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer", color:"var(--pine)" }}>
              <Icon name="star" size={13} style={{ verticalAlign:-2, marginRight:5 }} />Set as default
            </button>
          )}
          {checklist.isDefault && (
            <span style={{ padding:"7px 14px", borderRadius:999, background:"var(--mint-bg)",
              fontSize:13, fontWeight:700, color:"var(--pine)" }}>
              <Icon name="star-filled" size={13} style={{ verticalAlign:-2, marginRight:5 }} />Default checklist
            </span>
          )}
          {/* Copy from another checklist */}
          <select
            onFocus={() => { if (!allLists) FBUTIL.listChecklists().then(setAllLists); }}
            onChange={async e => {
              const srcId = e.target.value;
              e.target.value = "";
              if (!srcId) return;
              setBusy(true);
              const src = await FBUTIL.getChecklist(srcId);
              if (!src?.items?.length) { setBusy(false); return; }
              const existingLabels = new Set(items.map(c => c.label.toLowerCase()));
              const toAdd = src.items
                .filter(c => !existingLabels.has(c.label.toLowerCase()))
                .map(c => ({ ...c, id: Date.now() + Math.random() }));
              if (toAdd.length > 0) {
                await persist([...items, ...toAdd]);
                setCopyMsg(`Copied ${toAdd.length} item${toAdd.length===1?"":"s"} from "${src.name}"`);
              } else {
                setCopyMsg(`All items from "${src.name}" already exist here`);
              }
              setTimeout(() => setCopyMsg(""), 3500);
              setBusy(false);
            }}
            style={{ padding:"7px 14px", borderRadius:999, border:"1.5px solid var(--line)",
              background:"var(--bg)", color:"var(--ink-2)", fontSize:13, fontWeight:700,
              fontFamily:"var(--sans)", cursor:"pointer", outline:"none" }}>
            <option value="">Copy items from…</option>
            {(allLists || [])
              .filter(cl => cl.id !== checklist.id)
              .map(cl => <option key={cl.id} value={cl.id}>{cl.name} ({(cl.items||[]).length} items)</option>)}
          </select>
          {copyMsg && (
            <span style={{ fontSize:12.5, color:"var(--pine)", fontWeight:700 }}>
              <Icon name="check" size={13} style={{ verticalAlign:-2, marginRight:4 }} />{copyMsg}
            </span>
          )}
        </div>

        <div style={{ padding:"0 20px 80px" }}>
          {items.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)", fontSize:14 }}>
              No items yet. Tap + to add the first one.
            </div>
          )}
          {Object.entries(groups).map(([cat, its]) => (
            <div key={cat} style={{ marginBottom:20 }}>
              <div className="eyebrow" style={{ marginBottom:8, paddingLeft:2 }}>{cat}</div>
              <div className="card" style={{ overflow:"hidden" }}>
                {its.map((it, i) => (
                  <div key={it.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px",
                    borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                    <Icon name="grip-vertical" size={16} color="var(--ink-3)" />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14.5, fontWeight:600 }}>{it.label}</div>
                      {it.note && <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:1, lineHeight:1.4 }}>{it.note}</div>}
                    </div>
                    <button onClick={() => setEditing(it)}
                      style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--info-bg)",
                        color:"var(--info)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button onClick={() => setConfirmDel(it.id)}
                      style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--danger-bg)",
                        color:"var(--danger)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing !== null && (
        <ChecklistItemSheet
          item={editing === "new" ? null : editing}
          cats={cats}
          onSave={saveItem}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDel && (
        <ConfirmSheet message="Remove this item?" confirmLabel="Remove"
          onConfirm={() => deleteItem(confirmDel)} onCancel={() => setConfirmDel(null)} />
      )}

      {renaming && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
            borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px",
            display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>Rename checklist</div>
              <button onClick={() => setRenaming(false)} style={{ border:"none", background:"none", cursor:"pointer" }}>
                <Icon name="x" size={22} color="var(--ink-2)" />
              </button>
            </div>
            <input value={nameVal} onChange={e => setNameVal(e.target.value)} placeholder="Checklist name"
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
            <button onClick={saveName} disabled={busy}
              style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
                background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
                fontFamily:"var(--sans)", cursor:"pointer", opacity:busy?0.7:1 }}>
              Save name
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Checklists — top-level list of named checklists ──────
function AdminChecklist({ nav }) {
  const [lists,    setLists]    = React.useState(null);
  const [selected, setSelected] = React.useState(null); // checklist object being drilled into
  const [creating, setCreating] = React.useState(false);
  const [newName,  setNewName]  = React.useState("");
  const [confirmDelList, setConfirmDelList] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const load = () => FBUTIL.listChecklists().then(setLists);
  React.useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const id = await FBUTIL.createChecklist({ name: newName.trim(), isDefault: lists?.length === 0 });
    await load();
    setCreating(false); setNewName(""); setBusy(false);
  };

  const deleteList = async (id) => {
    await FBUTIL.deleteChecklist(id);
    await load();
    setConfirmDelList(null);
  };

  if (selected) {
    return (
      <ChecklistEditor
        checklist={selected}
        nav={{ back: async () => { await load(); setSelected(null); } }}
        onUpdated={() => FBUTIL.getChecklist(selected.id).then(cl => { if (cl) setSelected(cl); })}
      />
    );
  }

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Inspection Checklists" sub="Named, per-property checklists"
          right={
            <button onClick={() => setCreating(true)}
              style={{ width:36, height:36, borderRadius:999, border:"none", background:"var(--pine)",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        <div style={{ padding:"8px 20px 80px" }}>
          {lists === null && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>
          )}
          {lists?.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)", fontSize:14 }}>
              No checklists yet. Tap + to create the first one.
            </div>
          )}
          {lists?.map(cl => (
            <div key={cl.id} className="card" onClick={() => setSelected(cl)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 16px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"var(--mint-bg)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name="clipboard-list" size={22} color="var(--pine)" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{cl.name}</div>
                <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2 }}>
                  {(cl.items || []).length} items
                  {cl.isDefault && <span style={{ marginLeft:8, color:"var(--pine)", fontWeight:700 }}>· Default</span>}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setConfirmDelList(cl.id); }}
                style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--danger-bg)",
                  color:"var(--danger)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Icon name="trash" size={15} />
              </button>
              <Icon name="chevron-right" size={18} color="var(--ink-3)" />
            </div>
          ))}
        </div>
      </div>

      {creating && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
          display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
            borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 40px",
            display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>New checklist</div>
              <button onClick={() => setCreating(false)} style={{ border:"none", background:"none", cursor:"pointer" }}>
                <Icon name="x" size={22} color="var(--ink-2)" />
              </button>
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Standard Weekly, Storm Check…"
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
            <div style={{ fontSize:12.5, color:"var(--ink-3)" }}>
              After creating, tap the checklist to add items.
              {lists?.length === 0 && " This will be set as the default checklist automatically."}
            </div>
            <button onClick={create} disabled={busy}
              style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
                background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800,
                fontFamily:"var(--sans)", cursor:"pointer", opacity:busy?0.7:1 }}>
              Create checklist
            </button>
          </div>
        </div>
      )}

      {confirmDelList && (
        <ConfirmSheet message="Delete this checklist? Items will be permanently removed."
          confirmLabel="Delete" onConfirm={() => deleteList(confirmDelList)}
          onCancel={() => setConfirmDelList(null)} />
      )}
    </div>
  );
}

// ── Admin: Message Inbox ──────────────────────────────────────
function AdminInbox({ nav }) {
  const [msgs,    setMsgs]    = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [tab,     setTab]     = React.useState("inspection"); // "inspection" | "homeowner"

  const isSupervisor = AUTH.isSupervisor();
  const isAdmin      = AUTH.isAdmin();

  React.useEffect(() => {
    AUTH.getAdminMessages().then(m => { setMsgs(m); setLoading(false); });
  }, []);

  const inspMsgs  = msgs.filter(m => m.type === "inspection");
  const ownerMsgs = msgs.filter(m => m.type !== "inspection");

  const visibleMsgs   = tab === "inspection" ? inspMsgs : ownerMsgs;
  const emptyLabel    = tab === "inspection" ? "No inspection reports yet" : "No homeowner messages yet";
  const emptySub      = tab === "inspection" ? "Completed inspections will appear here" : "Messages from homeowners will appear here";

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Inbox"
          sub={isSupervisor ? "Supervisor" : "Administrators"} />

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:8, padding:"4px 20px 8px" }}>
          {[
            { key:"inspection", label:"Inspection Reports", badge: inspMsgs.length },
            ...(isAdmin ? [{ key:"homeowner", label:"Homeowner Messages", badge: ownerMsgs.length }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"9px 12px", borderRadius:"var(--r-sm)", border:"none",
                fontFamily:"var(--sans)", fontSize:13, fontWeight:700, cursor:"pointer", transition:"all .15s",
                background: tab === t.key ? "var(--pine)" : "var(--surface)",
                color: tab === t.key ? "#fff" : "var(--ink-2)",
                boxShadow: tab === t.key ? "none" : "var(--shadow-sm)" }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ marginLeft:6, background: tab === t.key ? "rgba(255,255,255,0.3)" : "var(--pine)",
                  color: tab === t.key ? "#fff" : "#fff", borderRadius:999, padding:"1px 7px",
                  fontSize:11, fontWeight:800 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:10 }}>
          {loading && <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>}
          {!loading && visibleMsgs.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <Icon name="inbox" size={40} color="var(--ink-3)" />
              <div style={{ marginTop:12, fontSize:15, fontWeight:600 }}>{emptyLabel}</div>
              <div style={{ fontSize:13, marginTop:4 }}>{emptySub}</div>
            </div>
          )}
          {visibleMsgs.map(m => (
            <div key={m.id} className="card" style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:14.5 }}>{m.from}</span>
                  {m.type === "inspection" && (
                    <span style={{ fontSize:11, fontWeight:700, background:"var(--mint-bg)", color:"var(--pine)",
                      borderRadius:999, padding:"2px 8px" }}>Inspection</span>
                  )}
                </div>
                <span style={{ fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>
                  {m.sentAt?.toDate ? m.sentAt.toDate().toLocaleString() : m.sentAt}
                </span>
              </div>
              <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>{m.text}</div>
              {m.property && (
                <div style={{ marginTop:8, fontSize:12, color:"var(--ink-3)", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                  <Icon name="home" size={13} /> {m.property}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmSheet({ message, onConfirm, onCancel, confirmLabel = "Remove" }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.35)", zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 36px" }}>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:20, color:"var(--ink)" }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"13px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--bg-2)", color:"var(--ink-2)", fontSize:15, fontWeight:700,
            fontFamily:"var(--sans)", cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"13px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--danger)", color:"#fff", fontSize:15, fontWeight:800,
            fontFamily:"var(--sans)", cursor:"pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Operator Reports ─────────────────────────────────────────
function OperatorReports({ nav, canGoBack, user }) {
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [posting, setPosting] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null); // report id

  const role = (user || AUTH.currentUser || {}).role || "operator";
  const isAdmin = role === "administrator";
  const isSupervisor = role === "supervisor";

  const load = async () => {
    setLoading(true);
    setReports(await FBUTIL.getReports(isSupervisor ? { excludeDismissed: true } : {}));
    setLoading(false);
  };
  React.useEffect(() => { load(); }, []);

  const postToHomeowner = async (r) => {
    setPosting(r.id);
    await FBUTIL.postReportToHomeowner(r.id);
    await load();
    setPosting(null);
  };

  const doDelete = async (id) => {
    await FBUTIL.deleteReport(id);
    setConfirmDelete(null);
    setPreview(null);
    await load();
  };

  const doArchive = async (id) => {
    await FBUTIL.dismissReportForSupervisor(id);
    setPreview(null);
    await load();
  };

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <AppHeader title="Reports"
          sub={isAdmin ? "All reports — tap to preview or delete" : "Tap to preview · archive when done"}
          onBack={canGoBack ? nav.back : null} />
        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:12 }}>
          {loading && <div style={{ textAlign:"center", padding:"40px 0", color:"var(--ink-3)" }}>Loading…</div>}
          {!loading && reports.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <Icon name="file-text" size={40} color="var(--ink-3)" />
              <div style={{ marginTop:12, fontSize:15, fontWeight:600 }}>No reports yet</div>
              <div style={{ fontSize:13, marginTop:4 }}>Operator inspection reports will appear here</div>
            </div>
          )}
          {reports.map(r => (
            <div key={r.id} className="card rise"
              style={{ background:"var(--surface)", width:"100%",
                borderLeft: r.postedToHomeowner ? "4px solid var(--ok)" : "4px solid var(--line)",
                overflow:"hidden", animationDelay:`${0.04*reports.indexOf(r)}s` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15.5 }}>{r.propName}</div>
                  <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:2 }}>
                    {r.operatorName} · {fmtDate(r.createdAt)}
                  </div>
                </div>
                {r.postedToHomeowner && (
                  <span style={{ fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:999,
                    background:"var(--ok-bg)", color:"var(--ok)", whiteSpace:"nowrap" }}>
                    <Icon name="check" size={12} /> Posted
                  </span>
                )}
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                  background:"var(--mint-bg)", color:"var(--pine)" }}>
                  {r.checkCount}/{r.totalCount} checks
                </span>
                {r.flagCount > 0 && (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                    background:"var(--danger-bg)", color:"var(--danger)" }}>
                    {r.flagCount} flagged
                  </span>
                )}
                {r.photoUrls?.length > 0 && (
                  <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:999,
                    background:"var(--info-bg)", color:"var(--info)" }}>
                    {r.photoUrls.length} photos
                  </span>
                )}
              </div>
              {r.notes && (
                <div style={{ marginTop:10, fontSize:13, color:"var(--ink-2)", lineHeight:1.5,
                  background:"var(--bg-2)", borderRadius:"var(--r-sm)", padding:"9px 12px" }}>
                  <span style={{ fontWeight:700, color:"var(--ink)" }}>Notes: </span>{r.notes}
                </div>
              )}
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                <button onClick={() => setPreview(r)}
                  style={{ flex:1, border:"none", background:"transparent", cursor:"pointer", padding:0,
                    fontSize:12.5, fontWeight:700, color:"var(--pine)", display:"flex", alignItems:"center", gap:5, textAlign:"left" }}>
                  <Icon name="eye" size={14} /> Preview
                </button>
                {isSupervisor && (
                  <button onClick={() => doArchive(r.id)}
                    style={{ padding:"5px 11px", borderRadius:999, border:"none", cursor:"pointer",
                      fontSize:12, fontWeight:700, fontFamily:"var(--sans)",
                      background:"var(--bg-2)", color:"var(--ink-2)",
                      display:"flex", alignItems:"center", gap:4 }}>
                    <Icon name="archive" size={13} /> Archive
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => setConfirmDelete(r.id)}
                    style={{ padding:"5px 11px", borderRadius:999, border:"none", cursor:"pointer",
                      fontSize:12, fontWeight:700, fontFamily:"var(--sans)",
                      background:"var(--danger-bg)", color:"var(--danger)",
                      display:"flex", alignItems:"center", gap:4 }}>
                    <Icon name="trash" size={13} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <ReportPreviewSheet
          report={preview}
          posting={posting === preview.id}
          fmtDate={fmtDate}
          isAdmin={isAdmin}
          isSupervisor={isSupervisor}
          onClose={() => setPreview(null)}
          onPost={async () => { await postToHomeowner(preview); setPreview(null); }}
          onArchive={() => doArchive(preview.id)}
          onDelete={() => { setConfirmDelete(preview.id); setPreview(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmSheet
          message="Permanently delete this report? This cannot be undone."
          confirmLabel="Yes, delete"
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function ReportPhotoGrid({ urls }) {
  const [lightboxUrl, setLightboxUrl] = useState(null);
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom:7 }}>Photos ({urls.length})</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {urls.map((url, i) => (
          <div key={i} onClick={() => setLightboxUrl(url)} style={{ aspectRatio:"1", borderRadius:12, overflow:"hidden", cursor:"zoom-in" }}>
            <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ))}
      </div>
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)}
          style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(10,14,12,0.92)",
            display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <img src={lightboxUrl} alt="" style={{ maxWidth:"100%", maxHeight:"100%", borderRadius:10, objectFit:"contain" }} />
          <button onClick={() => setLightboxUrl(null)}
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

function downloadReport(r, fmtDate) {
  const all = r.allItems?.length > 0 ? r.allItems : (r.checkedItems || []);
  const checkedSet = new Set(r.checkedItems || []);
  const flaggedSet = new Set(r.flaggedItems || []);
  const date = r.dateStr || fmtDate(r.createdAt);

  const checklistHtml = all.map(label => {
    const checked = checkedSet.has(label);
    const flagged = flaggedSet.has(label);
    const icon = flagged ? "⚑" : checked ? "✓" : "○";
    const color = flagged ? "#c0392b" : checked ? "#1B4332" : "#888";
    return `<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">
      <span style="font-size:15px;color:${color};flex-shrink:0;">${icon}</span>
      <span style="color:${color};font-weight:${flagged?700:400};">${label}${flagged ? " <em style='font-size:12px;'>(flagged)</em>" : ""}</span>
    </div>`;
  }).join("");

  const photosHtml = r.photoUrls?.length > 0
    ? `<h3 style="margin:24px 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#555;">Photos (${r.photoUrls.length})</h3>
       <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
         ${r.photoUrls.map(u => `<img src="${u}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;" />`).join("")}
       </div>` : "";

  const notesHtml = r.notes
    ? `<h3 style="margin:24px 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#555;">Visit Notes</h3>
       <div style="background:#f7f7f7;border-radius:8px;padding:14px;font-size:14px;line-height:1.6;">${r.notes}</div>` : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Inspection Report — ${r.propName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 680px; margin: 0 auto; padding: 32px 20px; color: #1a1a2e; }
  .header { border-bottom: 3px solid #1B4332; padding-bottom: 18px; margin-bottom: 24px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-right:6px; }
  .ok { background:#d1fae5; color:#1B4332; }
  .warn { background:#fee2e2; color:#c0392b; }
  h2 { margin:0 0 4px; font-size:22px; }
  h3 { font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#555; margin:24px 0 10px; }
  .meta { font-size:13px; color:#555; margin-top:6px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1B4332;margin-bottom:8px;">TPC HomeWatch — Inspection Report</div>
  <h2>${r.propName}</h2>
  ${r.address ? `<div class="meta">${r.address}</div>` : ""}
  <div class="meta" style="margin-top:10px;">
    <strong>Inspector:</strong> ${r.operatorName || "Operator"} &nbsp;·&nbsp;
    <strong>Date:</strong> ${date}
  </div>
  <div style="margin-top:14px;">
    <span class="badge ok">${r.checkCount}/${r.totalCount} checks complete</span>
    <span class="badge ${r.flagCount > 0 ? "warn" : "ok"}">${r.flagCount > 0 ? `${r.flagCount} issue${r.flagCount===1?"":"s"} flagged` : "No issues found"}</span>
  </div>
</div>

${all.length > 0 ? `<h3>Checklist (${r.checkCount ?? checkedSet.size}/${r.totalCount ?? all.length})</h3><div>${checklistHtml}</div>` : ""}
${notesHtml}
${photosHtml}
<div style="margin-top:40px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:14px;">Generated by TPC HomeWatch · ${new Date().toLocaleDateString()}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TPC-Report-${r.propName?.replace(/\s+/g,"-")}-${date?.replace(/\//g,"-") || "report"}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// Full preview of a report — what the homeowner will see — before posting
function ReportPreviewSheet({ report: r, posting, fmtDate, isAdmin, isSupervisor, onClose, onPost, onArchive, onDelete }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,28,63,0.4)", zIndex:99,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:"var(--surface)",
        borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px max(28px,env(safe-area-inset-bottom))",
        display:"flex", flexDirection:"column", gap:16, maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom:4 }}>Inspection Report</div>
            <div style={{ fontSize:19, fontWeight:800 }}>{r.propName}</div>
            {r.address && <div style={{ fontSize:13, color:"var(--ink-2)", marginTop:2 }}>{r.address}</div>}
          </div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)" }}>
            <Icon name="user" size={13} style={{ verticalAlign:-2, marginRight:4 }} />{r.operatorName || "Operator"}
          </span>
          <span style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)" }}>
            <Icon name="calendar" size={13} style={{ verticalAlign:-2, marginRight:4 }} />{r.dateStr || fmtDate(r.createdAt)}
          </span>
        </div>

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <span style={{ fontSize:12.5, fontWeight:700, padding:"5px 12px", borderRadius:999,
            background:"var(--mint-bg)", color:"var(--pine)" }}>
            {r.checkCount}/{r.totalCount} checklist items completed
          </span>
          <span style={{ fontSize:12.5, fontWeight:700, padding:"5px 12px", borderRadius:999,
            background: r.flagCount > 0 ? "var(--danger-bg)" : "var(--ok-bg)",
            color: r.flagCount > 0 ? "var(--danger)" : "var(--ok)" }}>
            {r.flagCount > 0 ? `${r.flagCount} issue${r.flagCount===1?"":"s"} flagged` : "No issues found"}
          </span>
        </div>

        {(r.allItems?.length > 0 || r.checkedItems?.length > 0) && (() => {
          // Older reports only stored which items were checked/flagged, not the
          // full checklist — fall back to listing just the checked ones in that case.
          const all = r.allItems?.length > 0 ? r.allItems : (r.checkedItems || []);
          const checkedSet = new Set(r.checkedItems || []);
          const flaggedSet = new Set(r.flaggedItems || []);
          return (
            <div>
              <div className="eyebrow" style={{ marginBottom:7 }}>
                Checklist items ({r.checkCount ?? checkedSet.size}/{r.totalCount ?? all.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {all.map((label, i) => {
                  const isChecked = checkedSet.has(label);
                  const isFlagged = flaggedSet.has(label);
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13.5,
                      color: isFlagged ? "var(--danger)" : isChecked ? "var(--ink)" : "var(--ink-3)",
                      fontWeight: isFlagged ? 600 : 400 }}>
                      <Icon name={isFlagged ? "flag-filled" : isChecked ? "circle-check-filled" : "circle-dashed"}
                        size={15} color={isFlagged ? "var(--danger)" : isChecked ? "var(--ok)" : "var(--ink-3)"}
                        style={{ flexShrink:0 }} />
                      <span>{label}</span>
                      {isFlagged && <span style={{ fontSize:11, fontWeight:700 }}>· flagged</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {r.notes && (
          <div>
            <div className="eyebrow" style={{ marginBottom:7 }}>Visit notes</div>
            <div style={{ fontSize:14, color:"var(--ink)", lineHeight:1.6,
              background:"var(--bg-2)", borderRadius:"var(--r-sm)", padding:"12px 14px" }}>{r.notes}</div>
          </div>
        )}

        {r.photoUrls?.length > 0 && <ReportPhotoGrid urls={r.photoUrls} />}

        <button onClick={() => downloadReport(r, fmtDate)}
          style={{ padding:"12px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
            background:"var(--bg)", color:"var(--ink)", fontSize:14, fontWeight:700,
            fontFamily:"var(--sans)", cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          <Icon name="download" size={16} color="var(--ink)" /> Download report
        </button>

        {r.postedToHomeowner ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:"14px", borderRadius:"var(--r-sm)", background:"var(--ok-bg)", color:"var(--ok)",
            fontWeight:800, fontSize:14.5 }}>
            <Icon name="check" size={17} /> Already posted to homeowner
          </div>
        ) : (
          <button onClick={onPost} disabled={posting}
            style={{ padding:"15px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--pine)", color:"#fff", fontSize:15.5, fontWeight:800,
              fontFamily:"var(--sans)", cursor:"pointer", opacity:posting?0.7:1,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <Icon name="send" size={17} color="#fff" /> {posting ? "Posting…" : "Post to homeowner"}
          </button>
        )}
        {isSupervisor && (
          <button onClick={onArchive}
            style={{ padding:"12px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
              background:"var(--bg)", color:"var(--ink-2)", fontSize:14, fontWeight:700,
              fontFamily:"var(--sans)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginTop:8 }}>
            <Icon name="archive" size={16} color="var(--ink-2)" /> Archive (hide from my view)
          </button>
        )}
        {isAdmin && (
          <button onClick={onDelete}
            style={{ padding:"12px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--danger)",
              background:"var(--danger-bg)", color:"var(--danger)", fontSize:14, fontWeight:700,
              fontFamily:"var(--sans)", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginTop:8 }}>
            <Icon name="trash" size={16} color="var(--danger)" /> Delete permanently
          </button>
        )}
      </div>
    </div>
  );
}

// ── Send Homeowner Alert ─────────────────────────────────────
function SendAlert({ nav, propId: initialPropId }) {
  const SEV = [
    { key:"caution",   label:"Caution",            color:"#92400E", bg:"#FEF3C7", border:"#F59E0B", icon:"alert-triangle" },
    { key:"attention", label:"Attention Required",  color:"#9A3412", bg:"#FFEDD5", border:"#EA580C", icon:"alert-octagon" },
    { key:"alert",     label:"Alert",               color:"#991B1B", bg:"#FEE2E2", border:"#EF4444", icon:"bell-exclamation" },
  ];

  const [fsProps,   setFsProps]   = React.useState(null); // null = loading
  React.useEffect(() => { FBUTIL.listProperties().then(setFsProps); }, []);
  const PROPS = fsProps && fsProps.length > 0 ? fsProps : HW.properties;

  const [propId,    setPropId]    = React.useState(initialPropId || PROPS[0]?.id);
  const [severity,  setSeverity]  = React.useState("caution");
  const [title,     setTitle]     = React.useState("");
  const [message,   setMessage]   = React.useState("");
  const [busy,      setBusy]      = React.useState(false);
  const [sent,      setSent]      = React.useState(false);

  React.useEffect(() => {
    if (initialPropId && PROPS.some(p => p.id === initialPropId)) setPropId(initialPropId);
  }, [fsProps]);

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    const prop = PROPS.find(p => p.id === propId) || PROPS[0];
    const sender = AUTH.currentUser;
    await FBUTIL.createHomeownerAlert({
      propId:    prop.id,
      propName:  prop.name,
      severity,
      title:     title.trim(),
      message:   message.trim(),
      sentBy:    sender?.name || "",
      sentByRole: sender?.role || "",
    });
    setBusy(false);
    setSent(true);
  };

  const sev = SEV.find(s => s.key === severity);

  if (sent) return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Send Alert" />
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", gap:16 }}>
          <div style={{ width:72, height:72, borderRadius:999, background:"var(--ok-bg)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon name="circle-check-filled" size={44} color="var(--ok)" />
          </div>
          <div style={{ fontSize:20, fontWeight:800 }}>Alert sent</div>
          <div style={{ fontSize:14.5, color:"var(--ink-2)", textAlign:"center", lineHeight:1.5, maxWidth:280 }}>
            The homeowner will see this alert in their Updates screen.
          </div>
          <button onClick={nav.back} className="btn btn-primary" style={{ marginTop:8, padding:"13px 32px" }}>Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Send Alert" sub="Notify homeowner" />
        <div style={{ padding:"8px 20px 60px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* property selector */}
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:8 }}>Property</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {PROPS.map(p => (
                <button key={p.id} onClick={() => setPropId(p.id)}
                  style={{ padding:"8px 14px", borderRadius:999, border:"none", cursor:"pointer",
                    fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                    background: propId===p.id ? "var(--pine)" : "var(--bg-2)",
                    color: propId===p.id ? "#fff" : "var(--ink-2)" }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* severity selector */}
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:8 }}>Severity</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SEV.map(s => (
                <button key={s.key} onClick={() => setSeverity(s.key)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px",
                    borderRadius:"var(--r-sm)", border:`2px solid ${severity===s.key ? s.border : "var(--line)"}`,
                    background: severity===s.key ? s.bg : "var(--surface)",
                    cursor:"pointer", textAlign:"left", transition:"all .15s", fontFamily:"var(--sans)" }}>
                  <Icon name={s.icon} size={22} color={s.color} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14.5, fontWeight:800, color:s.color }}>{s.label}</div>
                  </div>
                  {severity === s.key && <Icon name="check" size={18} color={s.color} />}
                </button>
              ))}
            </div>
          </div>

          {/* alert preview */}
          {sev && (
            <div style={{ padding:"13px 15px", borderRadius:"var(--r-sm)",
              background:sev.bg, border:`1.5px solid ${sev.border}`,
              display:"flex", gap:10, alignItems:"flex-start" }}>
              <Icon name={sev.icon} size={20} color={sev.color} style={{ flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:13, color:sev.color, fontWeight:700 }}>
                This will appear as a {sev.label.toLowerCase()} alert in the homeowner's Updates screen.
              </div>
            </div>
          )}

          {/* title */}
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Alert title</div>
            <input value={title} placeholder="e.g. Storm damage detected"
              onChange={e => setTitle(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", boxSizing:"border-box" }} />
          </div>

          {/* message */}
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Message</div>
            <textarea value={message} placeholder="Describe the situation and any actions taken…"
              onChange={e => setMessage(e.target.value)} rows={4}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)",
                border:"1.5px solid var(--line)", fontSize:15, fontFamily:"var(--sans)",
                background:"var(--bg)", color:"var(--ink)", outline:"none", resize:"vertical",
                lineHeight:1.6, boxSizing:"border-box" }} />
          </div>

          <button onClick={send} disabled={busy || !title.trim() || !message.trim()}
            style={{ padding:"15px", borderRadius:"var(--r-sm)", border:"none",
              background: title.trim() && message.trim() ? "var(--pine)" : "var(--bg-2)",
              color: title.trim() && message.trim() ? "#fff" : "var(--ink-3)",
              fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
              cursor: title.trim() && message.trim() ? "pointer" : "default",
              opacity: busy ? 0.7 : 1 }}>
            {busy ? "Sending…" : "Send alert to homeowner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Install / Add to Home Screen prompt (shown once after signup) ─
function InstallScreen({ onContinue }) {
  const isIOS     = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px", background:"var(--bg)" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <Logo size={54} />
        <div style={{ marginTop:14, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>Account created!</div>
        <div style={{ fontSize:14, color:"var(--ink-3)", fontWeight:600, marginTop:4 }}>Add the app to your home screen</div>
      </div>

      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>

        {/* iOS instructions */}
        {isIOS && (
          <div style={{ background:"var(--surface)", borderRadius:"var(--r)", padding:"18px 16px",
            boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontWeight:800, fontSize:15 }}>Install on iPhone / iPad</div>
            {[
              { icon:"upload",      text:'Tap the Share button at the bottom of Safari' },
              { icon:"plus-square", text:'Scroll down and tap "Add to Home Screen"' },
              { icon:"home",        text:'Tap "Add" — the app icon will appear on your home screen' },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"var(--mint-bg)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={s.icon} size={17} color="var(--pine)" />
                </div>
                <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5, paddingTop:6 }}>{s.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Android instructions */}
        {isAndroid && (
          <div style={{ background:"var(--surface)", borderRadius:"var(--r)", padding:"18px 16px",
            boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontWeight:800, fontSize:15 }}>Install on Android</div>
            {[
              { icon:"dots-vertical", text:'Tap the menu (⋮) in the top-right of Chrome' },
              { icon:"plus-square",   text:'Tap "Add to Home screen"' },
              { icon:"home",          text:'Tap "Add" — the app icon appears on your home screen' },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"var(--mint-bg)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={s.icon} size={17} color="var(--pine)" />
                </div>
                <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5, paddingTop:6 }}>{s.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop / generic fallback */}
        {!isIOS && !isAndroid && (
          <div style={{ background:"var(--surface)", borderRadius:"var(--r)", padding:"18px 16px",
            boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ fontWeight:800, fontSize:15 }}>Install the app</div>
            {[
              { icon:"device-mobile", text:'Open this page on your iPhone or Android phone' },
              { icon:"plus-square",   text:'Use your browser menu to "Add to Home Screen"' },
              { icon:"home",          text:'The app icon will appear on your home screen for quick access' },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"var(--mint-bg)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon name={s.icon} size={17} color="var(--pine)" />
                </div>
                <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5, paddingTop:6 }}>{s.text}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background:"var(--mint-bg)", borderRadius:"var(--r-sm)", padding:"11px 13px",
          fontSize:13, color:"var(--ink-2)", lineHeight:1.5, display:"flex", gap:9, alignItems:"flex-start" }}>
          <Icon name="info-circle" size={16} color="var(--pine)" style={{ flexShrink:0, marginTop:1 }} />
          The app works offline and loads instantly from your home screen — no App Store needed.
        </div>

        <button onClick={onContinue}
          style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none",
            cursor:"pointer", background:"var(--pine)", color:"#fff",
            fontSize:16, fontWeight:800, fontFamily:"var(--sans)" }}>
          Continue to app →
        </button>
      </div>

      <div style={{ marginTop:32, fontSize:12, color:"var(--ink-3)", fontWeight:500, textAlign:"center" }}>
        TPC Home Services · v{HW.version.number}
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, AdminUsers, AdminChecklist, AdminInbox, UserModal, AUTH, ConfirmSheet, OperatorReports, SendAlert, InstallScreen, downloadReport });
