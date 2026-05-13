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
  out.innerHTML = '<div class="loading" style="color:var(--blue2);font-weight:700;">Scanning image... 📸</div>';

  try {
    const Tesseract = await import('https://esm.sh/tesseract.js@5');
    const worker = await Tesseract.createWorker(currentLang === 'ro' ? 'ron' : 'eng');
    const { data: { text } } = await worker.recognize(input.files[0]);
    await worker.terminate();

    if (text && text.trim().length > 3) {
      document.getElementById("input").value = text;
      window.runScan();
    } else {
      out.innerHTML = '<div style="color:var(--red);padding:10px;">Image text not detected clearly.</div>';
    }
  } catch (err) {
    out.innerHTML = '<div style="color:var(--red);padding:10px;">OCR Error. Please try copy-pasting text.</div>';
  }
};

window.runScan = async function () {
  const input = document.getElementById("input");
  if (!input || !input.value.trim()) return;

  const out = document.getElementById("out");
  out.innerHTML = '<div class="loading" style="color:var(--blue2);font-weight:700;">Analyzing signals... 🤖</div>';

  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.value, language: currentLang })
    });
    const data = await res.json();
    
    out.innerHTML = `
      <div class="result-box">
        <h3 class="result-${data.riskLevel}" style="margin-bottom:8px;">${data.verdict} (${data.score}/100)</h3>
        <p style="color: var(--muted); font-size: 14px; line-height:1.5;">${data.result.replace(/\n/g, '<br>')}</p>
      </div>
    `;
  } catch (err) {
    out.innerHTML = '<div style="color:var(--red);padding:10px;">Scan failed. Check your internet or API status.</div>';
  }
};

onAuthStateChanged(auth, u => { user = u; });
window.login = () => signInWithPopup(auth, provider);
window.logout = () => signOut(auth);
