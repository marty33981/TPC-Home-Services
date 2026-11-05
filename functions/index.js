const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const APP_URL  = "https://tpc-homewatch.web.app";
const ICON_192 = `${APP_URL}/icons/icon-192.png`;
const ICON_96  = `${APP_URL}/icons/icon-96.png`;

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
    data: { type: "report", propName, unreadCount: "1" },
    tokens,
    android: {
      notification: {
        icon:      "ic_stat_notify",
        color:     "#1B3A8C",
        sound:     "default",
        channelId: "tpc_reports",
        imageUrl:  ICON_192,
      },
    },
    webpush: {
      notification: {
        icon:    ICON_192,
        badge:   ICON_96,
        image:   ICON_192,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: [{ action: "view", title: "View Report" }],
      },
      fcmOptions: { link: `${APP_URL}/?screen=operatorReports` },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          "mutable-content": 1,
        },
      },
      fcmOptions: { imageUrl: ICON_192 },
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
    data: { type: col, unreadCount: "1" },
    tokens,
    android: {
      notification: {
        icon:      "ic_stat_notify",
        color:     "#1B3A8C",
        sound:     "default",
        channelId: "tpc_alerts",
        imageUrl:  ICON_192,
      },
    },
    webpush: {
      notification: {
        icon:    ICON_192,
        badge:   ICON_96,
        image:   ICON_192,
        vibrate: [200, 100, 200],
        actions: [{ action: "view", title: "View Alert" }],
      },
      fcmOptions: { link: `${APP_URL}/?screen=alerts` },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          "mutable-content": 1,
        },
      },
      fcmOptions: { imageUrl: ICON_192 },
    },
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

  // Client already incremented unreadReports synchronously; only collect tokens here
  const tokens = [];

  for (const reviewer of reviewers) {
    const userDoc = await db.collection("users").doc(reviewer.id).get();
    if (!userDoc.exists) continue;
    const data = userDoc.data();
    if (data.fcmToken) tokens.push(data.fcmToken);
  }

  if (tokens.length === 0) return null;

  await messaging.sendEachForMulticast({
    notification: {
      title: `Report assigned — ${propName}`,
      body:  `${operatorName} sent you the ${visitName} report.`,
    },
    data: { type: "report_assigned", propName, unreadCount: "1" },
    tokens,
    android: {
      notification: {
        icon:      "ic_stat_notify",
        color:     "#1B3A8C",
        sound:     "default",
        channelId: "tpc_reports",
        imageUrl:  ICON_192,
      },
    },
    webpush: {
      notification: {
        icon:    ICON_192,
        badge:   ICON_96,
        image:   ICON_192,
        vibrate: [200, 100, 200],
        actions: [{ action: "view", title: "View Report" }],
      },
      fcmOptions: { link: `${APP_URL}/?screen=operatorReports` },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          "mutable-content": 1,
        },
      },
      fcmOptions: { imageUrl: ICON_192 },
    },
  });

  return null;
});
