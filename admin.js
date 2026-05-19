import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const ADMIN_EMAILS = [
  "hello@scamscouter.com",
  "contact@scamscouter.com",
  "support@scamscouter.com"
];

const firebaseConfig = {
  apiKey: "AIzaSyAF14JSdD3vPLfgRzm7rYNvP_0o1hJ0p8Q",
  authDomain: "scamio.firebaseapp.com",
  projectId: "scamio",
  storageBucket: "scamio.firebasestorage.app",
  messagingSenderId: "216169578111",
  appId: "1:216169578111:web:37d634e6d794ec8bfe094a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const statusEl = document.getElementById("adminStatus");
const reportsEl = document.getElementById("adminReports");
const loginBtn = document.getElementById("adminLoginBtn");

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function escapeHtml(value) {
  return String(value || "").replace(/[<>&"]/g, (ch) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;"
  }[ch]));
}

function isAdmin(user) {
  return !!user && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(String(user.email || "").toLowerCase());
}

async function loadPendingReports(user) {
  if (!isAdmin(user)) {
    setStatus(`Access denied for ${user?.email || "unknown user"}. Add your email to ADMIN_EMAILS in admin.js.`);
    return;
  }

  setStatus("Loading pending reports...");

  try {
    const q = query(
      collection(db, "scamReports"),
      where("approved", "==", false),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      setStatus("No pending reports.");
      reportsEl.innerHTML = "";
      return;
    }

    reportsEl.innerHTML = "";
    setStatus(`${snap.size} pending reports found.`);

    snap.forEach((item) => {
      const report = item.data();
      const card = document.createElement("article");
      card.className = "admin-report-card";

      const input = escapeHtml(report.input || "").slice(0, 700);
      const notes = escapeHtml(report.notes || "");
      const title = escapeHtml(report.domain || report.reportType || "Report");

      card.innerHTML = `
        <div class="admin-report-header">
          <h2>${title}</h2>
          <span>${escapeHtml(report.verdict || "Unknown")} • ${escapeHtml(report.score ?? "unknown")}/100</span>
        </div>
        <p><strong>Type:</strong> ${escapeHtml(report.reportType || "unknown")} • <strong>Platform:</strong> ${escapeHtml(report.platform || "unknown")}</p>
        <p><strong>Email:</strong> ${escapeHtml(report.reporterEmail || "unknown")}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        <pre>${input}</pre>
        <div class="admin-actions">
          <button class="approve-btn">Approve public</button>
          <button class="reject-btn">Mark reviewed / reject</button>
        </div>
      `;

      card.querySelector(".approve-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "scamReports", item.id), {
          approved: true,
          reviewed: true,
          reviewedBy: user.email,
          reviewedAt: serverTimestamp()
        });
        card.remove();
      });

      card.querySelector(".reject-btn").addEventListener("click", async () => {
        await updateDoc(doc(db, "scamReports", item.id), {
          approved: false,
          reviewed: true,
          reviewedBy: user.email,
          reviewedAt: serverTimestamp()
        });
        card.remove();
      });

      reportsEl.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    setStatus("Could not load reports. You may need a Firestore index or stricter Firebase rules.");
  }
}

loginBtn?.addEventListener("click", async () => {
  await signInWithPopup(auth, provider);
});

onAuthStateChanged(auth, (user) => {
  if (user) loadPendingReports(user);
});
