// ─────────────────────────────────────────────────────────────
// TPC HomeWatch — Firebase initialisation
// Exposes: window.fbAuth, window.db, window.FBUTIL
// ─────────────────────────────────────────────────────────────

firebase.initializeApp(HW_CONFIG.firebase);

window.fbAuth    = firebase.auth();
window.db        = firebase.firestore();
window.fbStorage = firebase.storage();

// Tie the sign-in session to the browser tab/window — closing it signs the user out,
// NONE persistence: auth state lives only in memory — cleared on refresh or tab close.
// Users must sign in fresh every time they open the app.
fbAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);

// Firestore helper utilities
window.FBUTIL = {

  // ── User profiles (stored in users/{uid}) ────────────────

  async getUserProfile(uid) {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async listUsers() {
    const snap = await db.collection('users').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createUserProfile(uid, data) {
    await db.collection('users').doc(uid).set({
      ...data,
      createdAt: data.createdAt || new Date().toISOString().slice(0, 10),
    });
  },

  async updateUserProfile(uid, data) {
    await db.collection('users').doc(uid).update(data);
  },

  async deleteUserProfile(uid) {
    await db.collection('users').doc(uid).delete();
  },

  // ── Admin messages ───────────────────────────────────────

  async sendAdminMessage(msg) {
    await db.collection('adminMessages').add({
      ...msg,
      sentAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  async getAdminMessages() {
    const snap = await db.collection('adminMessages')
      .orderBy('sentAt', 'desc').limit(100).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Operator reports ─────────────────────────────────────

  async submitReport(data) {
    const ref = await db.collection('reports').add({
      ...data,
      postedToHomeowner: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async getReports(opts = {}) {
    const snap = await db.collection('reports')
      .orderBy('createdAt', 'desc').limit(50).get();
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (opts.excludeDismissed) docs = docs.filter(r => !r.dismissedBySupervisor);
    return docs;
  },

  async getLastReportForProperty(propId) {
    const snap = await db.collection('reports')
      .where('propId', '==', propId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async deleteReport(id) {
    await db.collection('reports').doc(id).delete();
  },

  async dismissReportForSupervisor(id) {
    await db.collection('reports').doc(id).update({ dismissedBySupervisor: true });
  },

  async postReportToHomeowner(reportId) {
    await db.collection('reports').doc(reportId).update({
      postedToHomeowner: true,
      postedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  async getPostedReports(propId) {
    const snap = await db.collection('reports')
      .where('propId', '==', propId)
      .where('postedToHomeowner', '==', true)
      .orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Property photo gallery (sourced from inspection reports) ─

  async getPropertyPhotos(propId) {
    const snap = await db.collection('reports')
      .where('propId', '==', propId)
      .orderBy('createdAt', 'desc').limit(50).get();
    const groups = [];
    snap.docs.forEach(d => {
      const r = d.data();
      if (r.photoUrls && r.photoUrls.length > 0) {
        groups.push({
          reportId:    d.id,
          visitName:   r.visitName || "Inspection",
          submittedBy: r.submittedBy || "Operator",
          submittedAt: r.submittedAt || null,
          urls:        r.photoUrls,
        });
      }
    });
    return groups;
  },

  // ── Invitations (pending accounts, no Firebase Auth yet) ────

  async createInvitation(data) {
    const key = data.email.toLowerCase().trim();
    await db.collection('invitations').doc(key).set({
      ...data,
      email: key,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  async getInvitation(email) {
    const key = email.toLowerCase().trim();
    const snap = await db.collection('invitations').doc(key).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async deleteInvitation(email) {
    const key = email.toLowerCase().trim();
    await db.collection('invitations').doc(key).delete();
  },

  async listInvitations() {
    const snap = await db.collection('invitations').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Properties ───────────────────────────────────────────────

  async listProperties() {
    const snap = await db.collection('properties').orderBy('name').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getPropertiesForHomeowner(uid) {
    const snap = await db.collection('properties').where('homeownerId', '==', uid).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getProperty(id) {
    const snap = await db.collection('properties').doc(String(id)).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async getPropertyByName(name) {
    const snap = await db.collection('properties').where('name', '==', name).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  async getScheduleItem(id) {
    const snap = await db.collection('schedule').doc(String(id)).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async createProperty(data) {
    const ref = await db.collection('properties').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async updateProperty(id, data) {
    await db.collection('properties').doc(String(id)).set(
      { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  },

  async deleteProperty(id) {
    await db.collection('properties').doc(String(id)).delete();
  },

  // Legacy aliases used by screens-detail.jsx
  async getPropertyOverrides(id) {
    const snap = await db.collection('properties').doc(String(id)).get();
    return snap.exists ? snap.data() : null;
  },
  async savePropertyOverrides(id, data) {
    await db.collection('properties').doc(String(id)).set(data, { merge: true });
  },

  // ── Schedule (visits) ─────────────────────────────────────────

  async listSchedule() {
    const snap = await db.collection('schedule').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async createScheduleItem(data) {
    const ref = await db.collection('schedule').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async batchCreateScheduleItems(items) {
    // Firestore batch limit is 500; chunk if needed
    const chunk = 490;
    for (let i = 0; i < items.length; i += chunk) {
      const batch = db.batch();
      items.slice(i, i + chunk).forEach(data => {
        const ref = db.collection('schedule').doc();
        batch.set(ref, { ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
      await batch.commit();
    }
  },

  async updateScheduleItem(id, data) {
    await db.collection('schedule').doc(String(id)).set(
      { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  },

  async deleteScheduleItem(id) {
    await db.collection('schedule').doc(String(id)).delete();
  },

  // Delete all items in the same recurring series on or after the given item's date.
  // Series match: same prop + type + time + assignee.
  async deleteScheduleItemsUpcoming(item) {
    const snap = await db.collection('schedule').get();
    const labelToISO = (label) => {
      if (!label) return "";
      const yr = new Date().getFullYear();
      let d = new Date(`${label} ${yr}`);
      if (isNaN(d.getTime())) return "";
      if (d < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) d = new Date(`${label} ${yr + 1}`);
      return d.toISOString().slice(0, 10);
    };
    const itemISO = labelToISO(item.date);
    const toDelete = snap.docs.filter(d => {
      const s = d.data();
      return s.prop === item.prop && s.type === item.type &&
             s.time === item.time && s.assignee === item.assignee &&
             labelToISO(s.date) >= itemISO;
    });
    const chunks = [];
    for (let i = 0; i < toDelete.length; i += 500) chunks.push(toDelete.slice(i, i + 500));
    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  },

  // Reschedule all upcoming visits for a property when its frequency changes.
  // Deletes future items (matched by old prop name), then regenerates from today
  // for 1 year using the new frequency, preserving time and assignee.
  async reschedulePropertyUpcoming(oldPropName, newPropName, newFreq) {
    const freqToDays = (f) => {
      const t = (f || "").toLowerCase();
      if (/year|annual/i.test(t))   return 365;
      if (/quarter/i.test(t))       return 91;
      if (/monthly|month/i.test(t)) return 28;
      if (/bi.?week/i.test(t))      return 14;
      if (/weekly|week/i.test(t))   return 7;
      return null;
    };
    const intervalDays = freqToDays(newFreq);
    if (!intervalDays) return;

    const labelToISO = (label) => {
      if (!label) return "";
      const yr = new Date().getFullYear();
      let d = new Date(`${label} ${yr}`);
      if (isNaN(d.getTime())) return "";
      if (d < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) d = new Date(`${label} ${yr + 1}`);
      return d.toISOString().slice(0, 10);
    };
    const isoToLabel = (iso) => {
      const d = new Date(iso + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const advanceWeekday = (iso) => {
      const d = new Date(iso + "T00:00:00");
      d.setDate(d.getDate() + intervalDays);
      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    };

    const snap = await db.collection('schedule').get();
    const todayISO = new Date().toISOString().slice(0, 10);

    // Find upcoming items for this property (by old name) to delete + sample time/assignee
    const upcoming = snap.docs
      .map(d => ({ _ref: d.ref, ...d.data() }))
      .filter(s => s.prop === oldPropName && labelToISO(s.date) >= todayISO)
      .sort((a, b) => labelToISO(a.date).localeCompare(labelToISO(b.date)));

    const sample   = upcoming[0];
    const time     = sample?.time     || "9:00 AM";
    const assignee = sample?.assignee || "";

    // Build type label from freq (e.g. "Bi-weekly" → "Bi-weekly inspection")
    const cap = newFreq.charAt(0).toUpperCase() + newFreq.slice(1);
    const typeName = /inspection|check|storm/i.test(cap) ? cap : `${cap} inspection`;

    // Delete upcoming items in batches
    if (upcoming.length > 0) {
      for (let i = 0; i < upcoming.length; i += 500) {
        const batch = db.batch();
        upcoming.slice(i, i + 500).forEach(s => batch.delete(s._ref));
        await batch.commit();
      }
    }

    // Generate new items from today for 1 year
    const cutoff = new Date(todayISO);
    cutoff.setFullYear(cutoff.getFullYear() + 1);
    const newItems = [];
    let cur = todayISO;
    // Advance first occurrence to next weekday if today is weekend
    { const d = new Date(cur + "T00:00:00");
      if (d.getDay() === 6) d.setDate(d.getDate() + 2);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      cur = d.toISOString().slice(0, 10); }

    while (new Date(cur) <= cutoff) {
      newItems.push({
        prop: newPropName, type: typeName, name: typeName,
        date: isoToLabel(cur), time, assignee,
        status: "scheduled", desc: `${typeName} — ${newPropName}`,
        icon: "ti-home",
      });
      const next = advanceWeekday(cur);
      if (next === cur) break; // safety guard
      cur = next;
    }

    for (let i = 0; i < newItems.length; i += 490) {
      const batch = db.batch();
      newItems.slice(i, i + 490).forEach(item =>
        batch.set(db.collection('schedule').doc(), {
          ...item, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      );
      await batch.commit();
    }
  },

  // ── Photo storage ────────────────────────────────────────

  async uploadPropertyCoverPhoto(propId, file) {
    const ref = fbStorage.ref(`properties/${propId}/cover`);
    await ref.put(file);
    const url = await ref.getDownloadURL();
    await db.collection('properties').doc(String(propId)).set(
      { photoUrl: url, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    return url;
  },

  async uploadInspectionPhotos(propId, files) {
    const date  = new Date().toISOString().slice(0, 10);
    const uploads = files.map(async (file) => {
      const name = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const ref  = fbStorage.ref(`inspections/${propId}/${date}/${name}`);
      await ref.put(file);
      return await ref.getDownloadURL();
    });
    return Promise.all(uploads);
  },

  async getInspectionPhotos(propId) {
    const date = new Date().toISOString().slice(0, 10);
    const ref  = fbStorage.ref(`inspections/${propId}/${date}`);
    try {
      const result = await ref.listAll();
      return Promise.all(result.items.map(item => item.getDownloadURL()));
    } catch {
      return [];
    }
  },

  // ── Bulk admin actions ──────────────────────────────────────

  async _deleteCollection(name) {
    const snap = await db.collection(name).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length > 0) await batch.commit();
  },

  async clearAllScheduleAndReports() {
    await this._deleteCollection('schedule');
    await this._deleteCollection('reports');
  },

  async clearAllVisits()  { await this._deleteCollection('schedule'); },
  async clearAllReports() { await this._deleteCollection('reports'); },

  // ── Homeowner alerts ─────────────────────────────────────
  // Admin/supervisor view: get ALL alerts across all properties
  async getAllHomeownerAlerts() {
    const snap = await db.collection('homeownerAlerts')
      .orderBy('createdAt', 'desc').limit(200).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async clearAllHomeownerAlerts() {
    const snap = await db.collection('homeownerAlerts').get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length > 0) await batch.commit();
  },

  // ── Reports (admin delete / supervisor dismiss) ───────────

  async createHomeownerAlert(data) {
    const ref = await db.collection('homeownerAlerts').add({
      ...data,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  },

  async getHomeownerAlerts(propId) {
    const snap = await db.collection('homeownerAlerts')
      .where('propId', '==', propId)
      .orderBy('createdAt', 'desc').limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async markAlertRead(alertId) {
    await db.collection('homeownerAlerts').doc(alertId).update({ read: true });
  },

  async deleteHomeownerAlert(id) {
    await db.collection('homeownerAlerts').doc(id).delete();
  },

  // ── Access log ───────────────────────────────────────────────

  async logAccessView(propId, propName) {
    const op = AUTH.currentUser || {};
    await db.collection('accessLog').add({
      propId:   String(propId),
      propName,
      userId:   op.uid || op.id || "",
      userName: op.name || "Unknown",
      at: firebase.firestore.FieldValue.serverTimestamp(),
    });
  },

  async getAccessLog(propId, limit = 8) {
    const snap = await db.collection('accessLog')
      .where('propId', '==', String(propId))
      .orderBy('at', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Named checklists ─────────────────────────────────────────

  async listChecklists() {
    const snap = await db.collection('checklists').orderBy('name').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getChecklist(id) {
    const snap = await db.collection('checklists').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },

  async createChecklist(data) {
    const ref = await db.collection('checklists').add({ items: [], ...data });
    return ref.id;
  },

  async updateChecklist(id, data) {
    await db.collection('checklists').doc(id).update(data);
  },

  async deleteChecklist(id) {
    await db.collection('checklists').doc(id).delete();
  },

  async setDefaultChecklist(id) {
    // Clear isDefault on all, then set on the chosen one
    const snap = await db.collection('checklists').where('isDefault', '==', true).get();
    const batch = db.batch();
    snap.docs.forEach(d => { if (d.id !== id) batch.update(d.ref, { isDefault: false }); });
    batch.update(db.collection('checklists').doc(id), { isDefault: true });
    await batch.commit();
  },

  // Returns items array for a property: property's checklist → default checklist → HW.checklist fallback
  async getChecklistForProp(propId) {
    try {
      const prop = await this.getProperty(String(propId));
      const checklistId = prop?.checklistId;
      if (checklistId) {
        const cl = await this.getChecklist(checklistId);
        if (cl?.items?.length > 0) return cl.items;
      }
      // Fall back to default checklist
      const snap = await db.collection('checklists').where('isDefault', '==', true).limit(1).get();
      if (!snap.empty) {
        const items = snap.docs[0].data().items || [];
        if (items.length > 0) return items;
      }
    } catch(e) {}
    return HW.checklist; // last resort: seed data
  },
};
