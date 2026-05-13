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

const translations = {
  en: {
    guest: "Guest Mode",
    signIn: "Sign In",
    signOut: "Sign Out",
    language: "Language",
    eyebrow: "AI-assisted scam protection",
    headline: "Check suspicious links before you click.",
    subheadline: "Paste any suspicious link, message, email or website below and get an instant scam risk analysis.",
    scannerLabel: "Scan anything suspicious",
    scannerTitle: "Paste a link, message or email",
    scanBtn: "Scan Now",
    ocrLoading: "Reading text... 📸",
    ocrError: "Could not read text. Use a clearer image.",
    emptyInput: "Please paste text or upload an image.",
    scanFailed: "Scan failed. Try again.",
    saveReport: "Report Scam"
  },
  ro: {
    guest: "Mod Vizitator",
    signIn: "Autentificare",
    signOut: "Deconectare",
    language: "Limbă",
    eyebrow: "Protecție anti-scam asistată de AI",
    headline: "Verifică link-urile înainte să dai click.",
    subheadline: "Lipește orice mesaj sau site suspect mai jos pentru o analiză instantanee.",
    scannerLabel: "Scanează orice suspect",
    scannerTitle: "Lipește un link, mesaj sau email",
    scanBtn: "Verifică acum",
    ocrLoading: "Citim textul... 📸",
    ocrError: "Nu am putut citi textul. Încearcă o poză mai clară.",
    emptyInput: "Introdu un text sau încarcă o poză.",
    scanFailed: "Scanarea a eșuat. Încearcă din nou.",
    saveReport: "Raportează ca Scam"
  }
};

let currentLang = localStorage.getItem("scamscouter_lang") || "en";

function t(key) {
  return translations[currentLang][key] || key;
}

window.setLanguage = function (lang) {
  currentLang = lang;
  localStorage.setItem("scamscouter_lang", lang);
  updateUI();
};

function updateUI() {
  const ids = ["eyebrow", "headline", "subheadline", "scannerLabel", "scannerTitle", "scanBtn", "langLabel"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(id === "langLabel" ? "language" : id);
  });
  
  const userBox = document.getElementById("user");
  if (userBox) userBox.textContent = user ? user.email : t("guest");

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
}

// OCR discret
window.processImage = async function(input) {
  if (!input.files || !input.files[0]) return;
  const out = document.getElementById("out");
  out.innerHTML = `<div class="loading">${t("ocrLoading")}</div>`;

  try {
    const Tesseract = await import('https://esm.sh/tesseract.js@5');
    const worker = await Tesseract.createWorker(currentLang === 'ro' ? 'ron' : 'eng');
    const { data: { text } } = await worker.recognize(input.files[0]);
    await worker.terminate();

    if (text && text.trim().length > 3) {
      document.getElementById("input").value = text;
      window.runScan();
    } else {
      out.innerHTML = `<div class="error-box">${t("ocrError")}</div>`;
    }
  } catch (err) {
    out.innerHTML = `<div class="error-box">${t("ocrError")}</div>`;
  }
};

window.runScan = async function () {
  const input = document.getElementById("input");
  if (!input || !input.value.trim()) {
    alert(t("emptyInput"));
    return;
  }

  const out = document.getElementById("out");
  out.innerHTML = '<div class="loading">Analyzing...</div>';

  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.value, language: currentLang })
    });
    const data = await res.json();
    
    out.innerHTML = `
      <div class="result-box">
        <h3 class="result-header">${data.verdict} (${data.score}/100)</h3>
        <p style="white-space: pre-wrap;">${data.result}</p>
      </div>
    `;
  } catch (err) {
    out.innerHTML = `<div class="error-box">${t("scanFailed")}</div>`;
  }
};

window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

onAuthStateChanged(auth, u => { user = u; updateUI(); });
window.addEventListener("scamscouter:includes-ready", updateUI);
document.addEventListener("DOMContentLoaded", updateUI);
