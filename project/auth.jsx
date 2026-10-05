// ─────────────────────────────────────────────────────────────
// TPC HomeWatch — Auth + User Management
// Roles: administrator | operator | homeowner
// Administrator1 (protected:true) cannot be edited by anyone.
// Only administrators can manage users and checklists.
// All reports + homeowner messages route to administrators only.
// ─────────────────────────────────────────────────────────────

// ── Session store (in-memory; resets on reload) ──────────────
window.AUTH = {
  currentUser: null,
  users: HW.users,  // live reference

  login(email, password) {
    const u = this.users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );
    if (u) { this.currentUser = u; return { ok: true, user: u }; }
    return { ok: false, error: "Invalid email or password." };
  },
  logout() { this.currentUser = null; },
  isAdmin() { return this.currentUser?.role === "administrator"; },
  isProtected(id) { return this.users.find(u => u.id === id)?.protected === true; },

  addUser(data) {
    const id = "user-" + Date.now();
    const u = { id, ...data, createdAt: new Date().toISOString().slice(0,10) };
    this.users.push(u);
    return u;
  },
  updateUser(id, data) {
    if (this.isProtected(id)) return { ok:false, error:"Administrator1 cannot be modified." };
    const i = this.users.findIndex(u => u.id === id);
    if (i < 0) return { ok:false, error:"User not found." };
    this.users[i] = { ...this.users[i], ...data };
    return { ok:true };
  },
  deleteUser(id) {
    if (this.isProtected(id)) return { ok:false, error:"Administrator1 cannot be deleted." };
    const i = this.users.findIndex(u => u.id === id);
    if (i < 0) return { ok:false, error:"User not found." };
    this.users.splice(i, 1);
    return { ok:true };
  },

  // Route a homeowner message to admin inbox
  sendToAdmins(msg) {
    HW.adminMessages.push({ ...msg, id: Date.now(), sentAt: new Date().toLocaleTimeString() });
  },
  getAdminMessages() { return HW.adminMessages; },
};

// ── Login Screen ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]   = React.useState("");
  const [pwd,   setPwd]     = React.useState("");
  const [show,  setShow]    = React.useState(false);
  const [err,   setErr]     = React.useState("");
  const [busy,  setBusy]    = React.useState(false);

  const submit = () => {
    setErr("");
    if (!email || !pwd) { setErr("Please enter your email and password."); return; }
    setBusy(true);
    setTimeout(() => {
      const res = AUTH.login(email, pwd);
      setBusy(false);
      if (res.ok) onLogin(res.user);
      else setErr(res.error);
    }, 400);
  };

  return (
    <div style={{ minHeight:"100%", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 24px", background:"var(--bg)" }}>
      <div style={{ marginBottom:28, textAlign:"center" }}>
        <Logo size={54} />
        <div style={{ marginTop:14, fontSize:22, fontWeight:800, letterSpacing:-0.4 }}>TPC HomeWatch</div>
        <div style={{ fontSize:14, color:"var(--ink-3)", fontWeight:600, marginTop:4 }}>Sign in to your account</div>
      </div>

      <div style={{ width:"100%", maxWidth:340, display:"flex", flexDirection:"column", gap:12 }}>
        {/* email */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6, letterSpacing:0.02 }}>Email</div>
          <input
            type="email" value={email} placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==="Enter" && submit()}
            style={{ width:"100%", padding:"12px 14px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
              fontSize:15, fontFamily:"var(--sans)", background:"var(--surface)", color:"var(--ink)",
              outline:"none", boxSizing:"border-box" }} />
        </div>

        {/* password */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:6 }}>Password</div>
          <div style={{ position:"relative" }}>
            <input
              type={show ? "text" : "password"} value={pwd} placeholder="••••••••••"
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key==="Enter" && submit()}
              style={{ width:"100%", padding:"12px 42px 12px 14px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                fontSize:15, fontFamily:"var(--sans)", background:"var(--surface)", color:"var(--ink)",
                outline:"none", boxSizing:"border-box" }} />
            <button onClick={() => setShow(s => !s)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", border:"none",
                background:"transparent", cursor:"pointer", color:"var(--ink-3)", padding:0, display:"flex" }}>
              <Icon name={show ? "eye-off" : "eye"} size={18} />
            </button>
          </div>
        </div>

        {err && (
          <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)",
            padding:"10px 13px", fontSize:13.5, fontWeight:600 }}>{err}</div>
        )}

        <button onClick={submit} disabled={busy}
          style={{ marginTop:4, padding:"14px", borderRadius:"var(--r-sm)", border:"none", cursor:busy?"wait":"pointer",
            background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"var(--sans)",
            opacity:busy?0.7:1, transition:"opacity .15s" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <div style={{ marginTop:32, fontSize:12, color:"var(--ink-3)", fontWeight:500, textAlign:"center" }}>
        TPC HomeWatch · v{HW.version.number}
      </div>
    </div>
  );
}

// ── Admin: User Management Screen ────────────────────────────
function AdminUsers({ nav }) {
  const [users, setUsers]       = React.useState([...AUTH.users]);
  const [modal, setModal]       = React.useState(null);
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [err,   setErr]         = React.useState("");

  const refresh = () => setUsers([...AUTH.users]);

  const ROLES = ["administrator", "operator", "homeowner"];
  const roleColor = { administrator:"var(--pine)", operator:"var(--info)", homeowner:"var(--ok)" };
  const roleBg    = { administrator:"var(--mint-bg)", operator:"var(--info-bg)", homeowner:"var(--ok-bg)" };

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="User Management" sub="Administrators only"
          right={
            <button onClick={() => setModal("add")}
              style={{ width:36, height:36, borderRadius:999, border:"none", background:"var(--pine)",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:10 }}>
          {users.map(u => (
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
                <div style={{ fontSize:12.5, color:"var(--ink-3)", marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                <span style={{ display:"inline-block", marginTop:5, fontSize:11, fontWeight:700, padding:"3px 9px",
                  borderRadius:999, background:roleBg[u.role], color:roleColor[u.role] }}>
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </div>
              {!u.protected && (
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setModal(u)} style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"var(--info-bg)", color:"var(--info)", display:"flex", alignItems:"center",
                    justifyContent:"center", cursor:"pointer" }}><Icon name="edit" size={17} /></button>
                  <button onClick={() => setConfirmDelete(u.id)} style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"var(--danger-bg)", color:"var(--danger)", display:"flex", alignItems:"center",
                    justifyContent:"center", cursor:"pointer" }}><Icon name="trash" size={17} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <ConfirmSheet
          message={`Remove ${(AUTH.users.find(u=>u.id===confirmDelete)||{}).name || "this user"}?`}
          onConfirm={()=>{ AUTH.deleteUser(confirmDelete); refresh(); setConfirmDelete(null); }}
          onCancel={()=>setConfirmDelete(null)}
        />
      )}

      {/* Add / Edit modal */}
      {modal && (
        <UserModal
          user={modal === "add" ? null : modal}
          roles={ROLES}
          onSave={(data) => {
            setErr("");
            if (modal === "add") {
              AUTH.addUser(data);
            } else {
              const res = AUTH.updateUser(modal.id, data);
              if (!res.ok) { setErr(res.error); return; }
            }
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
  const [name,     setName]     = React.useState(user?.name     || "");
  const [email,    setEmail]    = React.useState(user?.email    || "");
  const [pwd,      setPwd]      = React.useState("");
  const [role,     setRole]     = React.useState(user?.role     || "operator");
  const [initials, setInitials] = React.useState(user?.initials || "");
  const [showPwd,  setShowPwd]  = React.useState(false);
  const isEdit = !!user;

  const save = () => {
    if (!name || !email) return;
    const data = { name, email, role, initials: initials || name.slice(0,2).toUpperCase() };
    if (!isEdit || pwd) data.password = pwd || user.password;
    if (!isEdit && !pwd) return; // require password for new users
    onSave(data);
  };

  const ROLE_LABELS = { administrator:"Administrator", operator:"Operator", homeowner:"Homeowner" };

  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
      display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
        padding:"24px 20px 40px", display:"flex", flexDirection:"column", gap:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <div style={{ fontSize:18, fontWeight:800 }}>{isEdit ? "Edit user" : "Add user"}</div>
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", padding:4 }}>
            <Icon name="x" size={22} color="var(--ink-2)" />
          </button>
        </div>

        {[
          { label:"Full name", val:name, set:setName, type:"text", ph:"Jane Smith" },
          { label:"Email", val:email, set:setEmail, type:"email", ph:"jane@example.com" },
          { label:"Initials (optional)", val:initials, set:setInitials, type:"text", ph:"JS" },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>{f.label}</div>
            <input type={f.type} value={f.val} placeholder={f.ph} onChange={e => f.set(e.target.value)}
              style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                outline:"none", boxSizing:"border-box" }} />
          </div>
        ))}

        {/* password */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>
            {isEdit ? "New password (leave blank to keep)" : "Password"}
          </div>
          <div style={{ position:"relative" }}>
            <input type={showPwd ? "text" : "password"} value={pwd} placeholder={isEdit ? "••••••••" : "Required"}
              onChange={e => setPwd(e.target.value)}
              style={{ width:"100%", padding:"11px 40px 11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                outline:"none", boxSizing:"border-box" }} />
            <button onClick={() => setShowPwd(s=>!s)} style={{ position:"absolute", right:11, top:"50%",
              transform:"translateY(-50%)", border:"none", background:"transparent", cursor:"pointer" }}>
              <Icon name={showPwd?"eye-off":"eye"} size={17} color="var(--ink-3)" />
            </button>
          </div>
        </div>

        {/* role selector */}
        <div>
          <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Role</div>
          <div style={{ display:"flex", gap:8 }}>
            {roles.map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{ flex:1, padding:"9px 0", borderRadius:"var(--r-sm)", border:"none", cursor:"pointer",
                  fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                  background: role===r ? "var(--pine)" : "var(--bg-2)",
                  color: role===r ? "#fff" : "var(--ink-2)", transition:"all .15s" }}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        {err && <div style={{ background:"var(--danger-bg)", color:"var(--danger)", borderRadius:"var(--r-sm)",
          padding:"9px 13px", fontSize:13, fontWeight:600 }}>{err}</div>}

        <button onClick={save} style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
          background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>
          {isEdit ? "Save changes" : "Add user"}
        </button>
      </div>
    </div>
  );
}

// ── Admin: Checklist Management Screen ───────────────────────
function AdminChecklist({ nav }) {
  const [items,    setItems]   = React.useState([...HW.checklist]);
  const [editing,  setEditing] = React.useState(null);
  const [draft,    setDraft]   = React.useState({ label:"", cat:"" });
  const [confirmDeleteItem, setConfirmDeleteItem] = React.useState(null);
  const CATS = [...new Set(HW.checklist.map(c => c.cat)), "Other"];

  const save = () => {
    if (!draft.label || !draft.cat) return;
    if (editing === "new") {
      const item = { id: Date.now(), label: draft.label, cat: draft.cat };
      HW.checklist.push(item);
      setItems([...HW.checklist]);
    } else {
      const i = HW.checklist.findIndex(c => c.id === editing);
      if (i >= 0) HW.checklist[i] = { ...HW.checklist[i], ...draft };
      setItems([...HW.checklist]);
    }
    setEditing(null); setDraft({ label:"", cat:"" });
  };

  const del = (id) => {
    setConfirmDeleteItem(id);
  };
  const doDelete = (id) => {
    const i = HW.checklist.findIndex(c => c.id === id);
    if (i >= 0) HW.checklist.splice(i, 1);
    setItems([...HW.checklist]);
    setConfirmDeleteItem(null);
  };

  const groups = {};
  items.forEach(c => { (groups[c.cat] = groups[c.cat] || []).push(c); });

  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Inspection Checklist" sub="Administrators only"
          right={
            <button onClick={() => { setDraft({ label:"", cat: CATS[0] }); setEditing("new"); }}
              style={{ width:36, height:36, borderRadius:999, border:"none", background:"var(--pine)",
                color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Icon name="plus" size={20} color="#fff" />
            </button>
          } />

        <div style={{ padding:"8px 20px 80px" }}>
          {Object.entries(groups).map(([cat, its]) => (
            <div key={cat} style={{ marginBottom:20 }}>
              <div className="eyebrow" style={{ marginBottom:8, paddingLeft:2 }}>{cat}</div>
              <div className="card" style={{ overflow:"hidden" }}>
                {its.map((it, i) => (
                  <div key={it.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 14px",
                    borderTop: i > 0 ? "1px solid var(--line)" : "none" }}>
                    <Icon name="grip-vertical" size={16} color="var(--ink-3)" />
                    <span style={{ flex:1, fontSize:14.5, fontWeight:600 }}>{it.label}</span>
                    <button onClick={() => { setDraft({ label:it.label, cat:it.cat }); setEditing(it.id); }}
                      style={{ width:30, height:30, borderRadius:8, border:"none", background:"var(--info-bg)",
                        color:"var(--info)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      <Icon name="edit" size={15} />
                    </button>
                    <button onClick={() => del(it.id)}
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

      {confirmDeleteItem && (
        <ConfirmSheet
          message="Remove this checklist item?"
          onConfirm={()=>doDelete(confirmDeleteItem)}
          onCancel={()=>setConfirmDeleteItem(null)}
        />
      )}

      {/* add/edit modal */}
      {editing !== null && (
        <div style={{ position:"absolute", inset:0, background:"rgba(15,28,63,0.35)", zIndex:99,
          display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0",
            padding:"24px 20px 40px", display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ fontSize:18, fontWeight:800 }}>{editing==="new" ? "Add checklist item" : "Edit item"}</div>
              <button onClick={() => setEditing(null)} style={{ border:"none", background:"none", cursor:"pointer" }}>
                <Icon name="x" size={22} color="var(--ink-2)" />
              </button>
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:5 }}>Item label</div>
              <input value={draft.label} placeholder="e.g. Check roof gutters"
                onChange={e => setDraft(d => ({...d, label:e.target.value}))}
                style={{ width:"100%", padding:"11px 13px", borderRadius:"var(--r-sm)", border:"1.5px solid var(--line)",
                  fontSize:15, fontFamily:"var(--sans)", background:"var(--bg)", color:"var(--ink)",
                  outline:"none", boxSizing:"border-box" }} />
            </div>
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:"var(--ink-2)", marginBottom:7 }}>Category</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {CATS.map(c => (
                  <button key={c} onClick={() => setDraft(d => ({...d, cat:c}))}
                    style={{ padding:"8px 14px", borderRadius:999, border:"none", cursor:"pointer",
                      fontSize:13, fontWeight:700, fontFamily:"var(--sans)",
                      background: draft.cat===c ? "var(--pine)" : "var(--bg-2)",
                      color: draft.cat===c ? "#fff" : "var(--ink-2)" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={save} style={{ padding:"14px", borderRadius:"var(--r-sm)", border:"none",
              background:"var(--pine)", color:"#fff", fontSize:16, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>
              {editing==="new" ? "Add item" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin: Message Inbox (homeowner messages) ────────────────
function AdminInbox({ nav }) {
  const msgs = AUTH.getAdminMessages();
  return (
    <div className="hw-app" style={{ background:"var(--bg)" }}>
      <div className="hw-scroll">
        <DrillHeader onBack={nav.back} title="Homeowner Messages" sub="Administrators only" />
        <div style={{ padding:"8px 20px 80px", display:"flex", flexDirection:"column", gap:10 }}>
          {msgs.length === 0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--ink-3)" }}>
              <Icon name="inbox" size={40} color="var(--ink-3)" />
              <div style={{ marginTop:12, fontSize:15, fontWeight:600 }}>No messages yet</div>
              <div style={{ fontSize:13, marginTop:4 }}>Homeowner messages will appear here</div>
            </div>
          )}
          {msgs.map(m => (
            <div key={m.id} className="card" style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontWeight:700, fontSize:14.5 }}>{m.from}</span>
                <span style={{ fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>{m.sentAt}</span>
              </div>
              <div style={{ fontSize:13.5, color:"var(--ink-2)", lineHeight:1.5 }}>{m.text}</div>
              {m.property && <div style={{ marginTop:8, fontSize:12, color:"var(--ink-3)", fontWeight:600 }}>
                <Icon name="home" size={13} /> {m.property}
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmSheet({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"absolute", inset:0, background:"rgba(15,28,63,0.35)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", background:"var(--surface)", borderRadius:"var(--r-lg) var(--r-lg) 0 0", padding:"24px 20px 36px" }}>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:20, color:"var(--ink)" }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"13px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--bg-2)", color:"var(--ink-2)", fontSize:15, fontWeight:700, fontFamily:"var(--sans)", cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"13px", borderRadius:"var(--r-sm)", border:"none",
            background:"var(--danger)", color:"#fff", fontSize:15, fontWeight:800, fontFamily:"var(--sans)", cursor:"pointer" }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, AdminUsers, AdminChecklist, AdminInbox, UserModal, AUTH, ConfirmSheet });
