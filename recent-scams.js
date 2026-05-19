import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAF14JSdD3vPLfgRzm7rYNvP_0o1hJ0p8Q",
  authDomain: "scamio.firebaseapp.com",
  projectId: "scamio",
  storageBucket: "scamio.firebasestorage.app",
  messagingSenderId: "216169578111",
  appId: "1:216169578111:web:37d634e6d794ec8bfe094a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function safeText(value, fallback = "") {
  return String(value || fallback).replace(/[<>&"]/g, (ch) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;"
  }[ch]));
}

function summarizeInput(input) {
  const text = String(input || "").replace(/\s+/g, " ").trim();
  if (!text) return "No message preview available.";
  return text.length > 220 ? text.slice(0, 220) + "..." : text;
}

function reportTitle(report) {
  if (report.reportType === "website" && report.domain) return `Suspicious website: ${report.domain}`;
  if (report.reportType === "email") return "Suspicious email report";
  if (report.reportType === "message") return "Suspicious message report";
  return "Reported scam pattern";
}

async function loadReports() {
  const list = document.getElementById("recentScamsList");
  if (!list) return;

  try {
    const q = query(
      collection(db, "scamReports"),
      where("approved", "==", true),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = `<div class="result-box"><strong>No approved reports yet.</strong><p>Approved community reports will appear here after moderation.</p></div>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach((doc) => {
      const report = doc.data();
      const card = document.createElement("article");
      card.className = "recent-scam-card";

      const score = report.score ?? "unknown";
      const verdict = report.verdict || "Unknown";
      const platform = report.platform || "unknown";
      const type = report.reportType || "message";

      card.innerHTML = `
        <div class="recent-scam-top">
          <h2>${safeText(reportTitle(report))}</h2>
          <span>${safeText(verdict)} • ${safeText(score)}/100</span>
        </div>
        <p>${safeText(summarizeInput(report.input))}</p>
        <div class="recent-scam-meta">
          <span>Type: ${safeText(type)}</span>
          <span>Platform: ${safeText(platform)}</span>
          ${report.domain ? `<span>Domain: ${safeText(report.domain)}</span>` : ""}
        </div>
      `;

      list.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = `<div class="result-box"><strong>Reports could not be loaded.</strong><p>This may require a Firestore index or security rule adjustment.</p></div>`;
  }
}

loadReports();
