const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.reportCreatedTrigger = onDocumentCreated("reports/{reportId}", async (event) => {
  const report = event.data.data();
  const db = getFirestore();
  const messaging = getMessaging();

  const propName     = report.propName     || "property";
  const operatorName = report.operatorName || "Operator";
  const visitName    = report.visitName    || "inspection";

  const usersSnap = await db.collection("users").get();
  const tokens = [];
  const batch  = db.batch();

  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    if (["administrator","supervisor","operator"].includes(data.role)) {
      if (data.fcmToken) tokens.push(data.fcmToken);
      batch.update(doc.ref, { unreadReports: FieldValue.increment(1) });
    }
  });

  await batch.commit();
  if (tokens.length === 0) return null;

  const result = await messaging.sendEachForMulticast({
    notification: {
      title: `New Report — ${propName}`,
      body:  `${operatorName} submitted ${visitName}.`,
    },
    data: { type: "report", propName },
    tokens,
    webpush: {
      notification: {
        icon:    "/icons/icon-192.png",
        badge:   "/icons/icon-96.png",
        vibrate: [200, 100, 200],
        requireInteraction: false,
      },
      fcmOptions: { link: "/" },
    },
    apns: {
      payload: { aps: { sound: "default" } },
    },
  });

  // Remove invalid tokens
  const invalid = new Set();
  result.responses.forEach((r, i) => {
    if (!r.success) {
      const c = r.error?.code || "";
      if (c.includes("invalid-registration-token") || c.includes("not-registered")) {
        invalid.add(tokens[i]);
      }
    }
  });
  if (invalid.size > 0) {
    const clean = db.batch();
    usersSnap.docs.forEach(doc => {
      if (invalid.has(doc.data().fcmToken)) clean.update(doc.ref, { fcmToken: FieldValue.delete() });
    });
    await clean.commit();
  }
  return null;
});

exports.alertCreatedTrigger = onDocumentCreated("{collection}/{alertId}", async (event) => {
  const col = event.params.collection;
  if (col !== "homeownerAlerts" && col !== "operatorAlerts") return null;

  const db        = getFirestore();
  const messaging = getMessaging();
  const alert     = event.data.data();

  const title = col === "homeownerAlerts"
    ? `Alert — ${alert.propName || "property"}`
    : `Operator Alert — ${alert.propName || "property"}`;
  const body = alert.message || alert.body || "A new alert was issued.";

  const usersSnap = await db.collection("users").get();
  const tokens = [];
  const batch  = db.batch();

  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    if (["administrator","supervisor","operator"].includes(data.role)) {
      if (data.fcmToken) tokens.push(data.fcmToken);
      batch.update(doc.ref, { unreadAlerts: FieldValue.increment(1) });
    }
  });

  await batch.commit();
  if (tokens.length === 0) return null;

  await messaging.sendEachForMulticast({
    notification: { title, body },
    data: { type: col },
    tokens,
    webpush: {
      notification: {
        icon:    "/icons/icon-192.png",
        badge:   "/icons/icon-96.png",
        vibrate: [200, 100, 200],
      },
      fcmOptions: { link: "/" },
    },
    apns: { payload: { aps: { sound: "default" } } },
  });

  return null;
});

// Fires when a report is assigned to specific reviewers
exports.reportAssignedTrigger = onDocumentUpdated("reports/{reportId}", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  // Only run when sentToSupervisor flips to true
  if (before.sentToSupervisor || !after.sentToSupervisor) return null;

  const reviewers = after.reviewers || [];
  if (reviewers.length === 0) return null;

  const db        = getFirestore();
  const messaging = getMessaging();

  const propName     = after.propName     || "property";
  const operatorName = after.operatorName || "Operator";
  const visitName    = after.visitName    || "inspection";

  const tokens = [];
  const batch  = db.batch();

  for (const reviewer of reviewers) {
    const userDoc = await db.collection("users").doc(reviewer.id).get();
    if (!userDoc.exists) continue;
    const data = userDoc.data();
    if (data.fcmToken) tokens.push(data.fcmToken);
    batch.update(userDoc.ref, { unreadReports: FieldValue.increment(1) });
  }

  await batch.commit();
  if (tokens.length === 0) return null;

  await messaging.sendEachForMulticast({
    notification: {
      title: `Report assigned — ${propName}`,
      body:  `${operatorName} sent you the ${visitName} report.`,
    },
    data: { type: "report_assigned", propName },
    tokens,
    webpush: {
      notification: { icon: "/icons/icon-192.png", badge: "/icons/icon-96.png" },
      fcmOptions: { link: "/" },
    },
    apns: { payload: { aps: { sound: "default" } } },
  });

  return null;
});
