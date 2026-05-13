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
let currentLang = localStorage.getItem("scamscouter_lang") || "en";

window.processImage = async function(input) {
  if (!input.files || !input.files[0]) return;
  const out = document.getElementById("out");
  out.innerHTML = '<div class="loading">Reading text from image... 📸</div>';

  try {
    const Tesseract = await import('https://esm.sh/tesseract.js@5');
    const worker = await Tesseract.createWorker(currentLang === 'ro' ? 'ron' : 'eng');
    const { data: { text } } = await worker.recognize(input.files[0]);
    await worker.terminate();

    if (text && text.trim().length > 3) {
      document.getElementById("input").value = text;
      window.runScan();
    } else {
      out.innerHTML = '<div class="error-box" style="color:var(--red);">Image text could not be read clearly.</div>';
    }
  } catch (err) {
    out.innerHTML = '<div class="error-box" style="color:var(--red);">Error processing image.</div>';
  }
};

window.runScan = async function () {
  const input = document.getElementById("input");
  if (!input || !input.value.trim()) return;

  const out = document.getElementById("out");
  out.innerHTML = '<div class="loading">Analyzing scan signals... 🤖</div>';

  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.value, language: currentLang })
    });
    const data = await res.json();
    
    // Fallbacks if data properties are missing
    const score = data.score !== undefined ? data.score : 50;
    const verdict = data.verdict || "Warning";
    let riskClass = "warning";
    if (score >= 60) riskClass = "risk";
    else if (score <= 29) riskClass = "safe";

    out.innerHTML = `
      <div class="result-box">
        <h3 class="result-header result-${riskClass}" style="margin-bottom:12px;">${verdict} (${score}/100)</h3>
        <p style="white-space: pre-wrap; line-height: 1.6; color: var(--muted);">${data.result || "Scan completed."}</p>
      </div>
    `;
  } catch (err) {
    out.innerHTML = '<div class="error-box" style="color:var(--red);">Scan failed. Please try again.</div>';
  }
};

onAuthStateChanged(auth, u => { 
    user = u; 
    const userDiv = document.getElementById("user");
    if(userDiv) {
        userDiv.textContent = u ? u.email : (currentLang === 'ro' ? "Mod Vizitator" : "Guest Mode");
    }
});
window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);

window.setLanguage = function (lang) {
  currentLang = lang;
  localStorage.setItem("scamscouter_lang", lang);
  location.reload(); // Quick refresh to apply translations naturally
};
