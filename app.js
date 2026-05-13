import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let user = null;
let lastScan = null;
let lastShareText = "";

const translations = {
  en: {
    guest: "Guest Mode",
    signIn: "Sign In",
    signOut: "Sign Out",
    language: "Language",
    navAbout: "About",
    navPricing: "Pricing",
    navContact: "Contact",
    navPrivacy: "Privacy",
    eyebrow: "AI-assisted scam protection",
    headline: "Check suspicious links before you click.",
    subheadline: "Paste any suspicious link, message, email or website below and get an instant scam risk analysis.",
    scannerLabel: "Scan anything suspicious",
    scannerTitle: "Paste a link, message or email",
    scanBtn: "Check Now",
    card1Title: "Safe Analysis",
    card1Text: "We check domain age and security certificates.",
    card2Title: "Scam Signals",
    card2Text: "We detect keywords used in phishing and frauds.",
    card3Title: "Impersonation",
    card3Text: "We find fake sites pretending to be real brands.",
    emptyInput: "Please paste some text, a link or upload an image first.",
    scanFailed: "Scan failed. Please try again.",
    saveReport: "Report as Scam",
    reportSaved: "Report saved! Thank you for helping the community.",
    ocrLoading: "Reading text from image... 📸",
    ocrError: "Could not read text from this image. Please try a clearer screenshot."
  },
  ro: {
    guest: "Mod Vizitator",
    signIn: "Autentificare",
    signOut: "Deconectare",
    language: "Limbă",
    navAbout: "Despre",
    navPricing: "Prețuri",
    navContact: "Contact",
    navPrivacy: "Confidențialitate",
    eyebrow: "Protecție anti-scam asistată de AI",
    headline: "Verifică link-urile suspecte înainte să dai click.",
    subheadline: "Lipește orice link, mesaj, email sau site suspect mai jos și primești o analiză instantanee a riscului.",
    scannerLabel: "Scanează orice suspect",
    scannerTitle: "Lipește un link, mesaj sau email",
    scanBtn: "Verifică acum",
    card1Title: "Analiză Siguranță",
    card1Text: "Verificăm vechimea domeniului și certificatele de securitate.",
    card2Title: "Semnale de Fraudă",
    card2Text: "Detectăm cuvinte cheie folosite în phishing și înșelătorii.",
    card3Title: "Impersonare",
    card3Text: "Găsim site-uri false care pretind a fi branduri reale.",
    emptyInput: "Vă rugăm să introduceți un text, un link sau să încărcați o poză.",
    scanFailed: "Scanarea a eșuat. Încercați din nou.",
    saveReport: "Raportează ca Scam",
    reportSaved: "Raport salvat! Mulțumim că ajuți comunitatea.",
    ocrLoading: "Citim textul din poză... 📸",
    ocrError: "Nu am putut citi textul din această poză. Încearcă un screenshot mai clar."
  }
};

let currentLang = "en";

function t(key) {
  return translations[currentLang][key] || key;
}

window.setLanguage = function (lang) {
  currentLang = lang;
  localStorage.setItem("scamscouter_lang", lang);
  updateUI();
};

function updateUI() {
  document.getElementById("langLabel").textContent = t("language");
  document.getElementById("eyebrow").textContent = t("eyebrow");
  document.getElementById("headline").textContent = t("headline");
  document.getElementById("subheadline").textContent = t("subheadline");
  document.getElementById("scannerLabel").textContent = t("scannerLabel");
  document.getElementById("scannerTitle").textContent = t("scannerTitle");
  document.getElementById("scanBtn").textContent = t("scanBtn");

  document.getElementById("card1Title").textContent = t("card1Title");
  document.getElementById("card1Text").textContent = t("card1Text");
  document.getElementById("card2Title").textContent = t("card2Title");
  document.getElementById("card2Text").textContent = t("card2Text");
  document.getElementById("card3Title").textContent = t("card3Title");
  document.getElementById("card3Text").textContent = t("card3Text");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
}

// Funcția de procesare IMAGINE (OCR)
window.processImage = async function(input) {
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  const out = document.getElementById("out");
  out.innerHTML = `<div class="loading">${t("ocrLoading")}</div>`;

  try {
    // Încărcăm dinamic Tesseract.js
    const Tesseract = await import('https://esm.sh/tesseract.js@5');
    const worker = await Tesseract.createWorker(currentLang === 'ro' ? 'ron' : 'eng');
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    if (!text || text.trim().length < 3) {
      out.innerHTML = `<div class="error-box">${t("ocrError")}</div>`;
      return;
    }

    // Punem textul în textarea și rulăm scanarea
    document.getElementById("input").value = text;
    window.runScan();
    
  } catch (err) {
    console.error("OCR Error:", err);
    out.innerHTML = `<div class="error-box">${t("ocrError")}</div>`;
  }
};

window.login = () => signInWithPopup(auth, provider).catch(console.error);
window.logout = () => signOut(auth).catch(console.error);

onAuthStateChanged(auth, (u) => {
  user = u;
  const userDiv = document.getElementById("user");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    userDiv.textContent = user.displayName || user.email;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
  } else {
    userDiv.textContent = t("guest");
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
  }
});

function renderLoading() {
  const out = document.getElementById("out");
  out.innerHTML = '<div class="loading">Analyzing for scams...</div>';
}

function renderError(msg) {
  const out = document.getElementById("out");
  out.innerHTML = `<div class="error-box">${msg}</div>`;
}

function renderResult(data) {
  const out = document.getElementById("out");
  const scoreClass = data.score > 60 ? "score-high" : data.score > 30 ? "score-mid" : "score-low";

  out.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <h3>Analysis Result</h3>
        <span class="score-badge ${scoreClass}">${data.score}/100</span>
      </div>
      <div class="verdict">${data.verdict}</div>
      <pre class="result-text">${data.result}</pre>
      <div class="result-actions">
        <button onclick="window.saveReport()" class="report-btn">${t("saveReport")}</button>
      </div>
    </div>
  `;
}

window.saveReport = async function () {
  if (!user) {
    alert("Please sign in to save a report.");
    return;
  }
  if (!lastScan) return;

  try {
    await addDoc(collection(db, "scamReports"), {
      text: lastScan.input,
      domain: lastScan.domain,
      verdict: lastScan.verdict,
      score: lastScan.score,
      signals: lastScan.signals || [],
      reporterUid: user.uid,
      reporterEmail: user.email,
      approved: false,
      product: "ScamScouter",
      createdAt: serverTimestamp()
    });

    alert(t("reportSaved"));
  } catch (err) {
    console.error(err);
    alert("Could not save report. Please try again.");
  }
};

window.runScan = async function () {
  const input = document.getElementById("input");
  if (!input) return;

  const text = input.value;
  if (!text.trim()) {
    alert(t("emptyInput"));
    return;
  }

  renderLoading();

  try {
    const headers = { "Content-Type": "application/json" };
    if (user) {
      headers.Authorization = `Bearer ${await user.getIdToken()}`;
    }

    const response = await fetch("/api/scan", {
      method: "POST",
      headers,
      body: JSON.stringify({ text, language: currentLang })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      renderError(data.error || t("scanFailed"));
      return;
    }

    lastScan = {
      input: text,
      domain: data.domain || null,
      verdict: data.verdict,
      score: data.score,
      result: data.result || "",
      signals: data.signals || []
    };

    renderResult(data);
  } catch (err) {
    console.error(err);
    renderError(t("scanFailed"));
  }
};

// Initialize language from storage
const savedLang = localStorage.getItem("scamscouter_lang");
if (savedLang) currentLang = savedLang;
updateUI();

window.addEventListener("scamscouter:includes-ready", () => {
  const select = document.getElementById("languageSelect");
  if (select) select.value = currentLang;
  updateUI();
});
