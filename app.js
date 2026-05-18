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
let selectedImageName = "";
let extractedImageText = "";
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
    statusDot: "Live",
    inputPlaceholder: "Paste a suspicious link, message, email, phone number, or website...",
    scanButton: "Scan Now",
    analyzing: "Analyzing scam signals... 🤖",
    emptyInput: "Please paste a suspicious link, message, phone number, or email.",
    loginFailed: "Sign in failed. Please try again.",
    scanFailed: "Scan failed. Please try again.",
    riskScore: "Risk score",
    freeScansLeft: "Free scans left",
    safe: "✅ Looks Safe",
    caution: "⚠️ Use Caution",
    risk: "🚨 High Scam Risk",
    shareResult: "Share Result",
    copyResult: "Copy Result",
    reportSite: "Report this scam",
    copied: "Result copied to clipboard.",
    reportSaved: "Report saved. Thank you for helping improve ScamScouter.",
    reportNeedsScan: "Please run a scan first.",
    loginToReport: "Please sign in before reporting a scam.",
    shareTitle: "ScamScouter Scan Result",
    checkedWith: "Checked with ScamScouter",
    uploadImage: "Choose screenshot/photo",
    removeImage: "Remove image",
    imageReady: "Image ready",
    imageTooLarge: "Image is too large. Please upload an image under 4 MB.",
    ocrLoading: "Reading text from image...",
    ocrDone: "Text extracted from image. You can edit it before scanning.",
    ocrFailed: "Could not read text from this image. Try a clearer screenshot or paste the text manually.",
    upgradeSoon: "Premium plans are coming soon. Contact hello@scamscouter.com for early access."
  },
  ro: {
    guest: "Mod vizitator",
    signIn: "Autentificare",
    signOut: "Deconectare",
    language: "Limbă",
    navAbout: "Despre",
    navPricing: "Prețuri",
    navContact: "Contact",
    navPrivacy: "Confidențialitate",
    eyebrow: "Protecție anti-scam asistată de AI",
    headline: "Verifică linkurile suspecte înainte să dai click.",
    subheadline: "Lipește mai jos orice link, mesaj, email sau site suspect și primește o analiză instant a riscului de scam.",
    scannerLabel: "Scanează orice pare suspect",
    scannerTitle: "Lipește un link, mesaj sau email",
    statusDot: "Activ",
    inputPlaceholder: "Lipește un link, mesaj, email, număr de telefon sau site suspect...",
    scanButton: "Scanează acum",
    analyzing: "Analizăm semnalele de fraudă... 🤖",
    emptyInput: "Te rog lipește un link, mesaj, număr de telefon sau email suspect.",
    loginFailed: "Autentificarea a eșuat. Încearcă din nou.",
    scanFailed: "Scanarea a eșuat. Încearcă din nou.",
    riskScore: "Scor de risc",
    freeScansLeft: "Scanări gratuite rămase",
    safe: "✅ Pare sigur",
    caution: "⚠️ Atenție",
    risk: "🚨 Risc ridicat de scam",
    shareResult: "Distribuie rezultatul",
    copyResult: "Copiază rezultatul",
    reportSite: "Raportează scamul",
    copied: "Rezultatul a fost copiat.",
    reportSaved: "Raport salvat. Mulțumim că ajuți ScamScouter.",
    reportNeedsScan: "Te rog rulează o scanare înainte.",
    loginToReport: "Te rog autentifică-te înainte să raportezi un scam.",
    shareTitle: "Rezultat scanare ScamScouter",
    checkedWith: "Verificat cu ScamScouter",
    uploadImage: "Alege poză/screenshot",
    removeImage: "Șterge poza",
    imageReady: "Poza este pregătită",
    imageTooLarge: "Imaginea este prea mare. Te rog încarcă o imagine sub 4 MB.",
    ocrLoading: "Citesc textul din imagine...",
    ocrDone: "Text extras din imagine. Îl poți corecta înainte de scanare.",
    ocrFailed: "Nu am putut citi textul din imagine. Încearcă un screenshot mai clar sau lipește textul manual.",
    upgradeSoon: "Planurile premium vor fi disponibile în curând. Contact: hello@scamscouter.com"
  }
};

function detectLanguage() {
  const saved = localStorage.getItem("scamscouter_lang");
  if (saved && translations[saved]) return saved;
  const browserLang = navigator.language || navigator.userLanguage || "en";
  return browserLang.toLowerCase().startsWith("ro") ? "ro" : "en";
}

let currentLang = detectLanguage();

function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

function setText(id, key) {
  const el = document.getElementById(id);
  if (el) el.innerText = t(key);
}

function applyLanguage() {
  document.documentElement.lang = currentLang;

  const map = {
    langLabel: "language",
    loginBtn: "signIn",
    logoutBtn: "signOut",
    scanBtn: "scanButton"
  };

  ["langLabel", "loginBtn", "logoutBtn", "eyebrow", "headline", "subheadline", "scannerLabel", "scannerTitle", "statusDot", "scanBtn"].forEach((id) => {
    setText(id, map[id] || id);
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.innerText = t(el.getAttribute("data-i18n"));
  });

  const userBox = document.getElementById("user");
  if (userBox && !user) userBox.innerText = t("guest");

  const input = document.getElementById("input");
  if (input) input.placeholder = t("inputPlaceholder");

  const langSelect = document.getElementById("languageSelect");
  if (langSelect) langSelect.value = currentLang;

  updateImageUploadLanguage();
}

window.setLanguage = function (lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("scamscouter_lang", lang);
  applyLanguage();
};

window.addEventListener("scamscouter:includes-ready", applyLanguage);

onAuthStateChanged(auth, async (u) => {
  user = u;
  const userBox = document.getElementById("user");

  if (u) {
    if (userBox) userBox.innerText = u.email;
    await setDoc(doc(db, "users", u.uid), {
      email: u.email,
      uid: u.uid,
      lastLogin: Date.now(),
      product: "ScamScouter",
      language: currentLang
    }, { merge: true });
  } else {
    if (userBox) userBox.innerText = t("guest");
  }
});

window.login = async function () {
  try {
    const result = await signInWithPopup(auth, provider);
    user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      uid: user.uid,
      createdAt: Date.now(),
      product: "ScamScouter",
      language: currentLang
    }, { merge: true });
  } catch (err) {
    console.error(err);
    alert(t("loginFailed"));
  }
};

window.logout = async function () {
  try {
    await signOut(auth);
    user = null;
    applyLanguage();
  } catch (err) {
    console.error(err);
  }
};

function clearOutput(out) {
  while (out.firstChild) out.removeChild(out.firstChild);
}

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}

function renderError(message) {
  const out = document.getElementById("out");
  if (!out) return;

  clearOutput(out);
  const box = makeEl("div", "result-box");
  box.appendChild(makeEl("div", "result-header result-risk", "Error"));
  box.appendChild(makeEl("p", "", message));
  out.appendChild(box);
}

function renderLoading() {
  const out = document.getElementById("out");
  if (!out) return;
  clearOutput(out);
  out.appendChild(makeEl("div", "loading", t("analyzing")));
}

function renderResult(data) {
  const out = document.getElementById("out");
  if (!out) return;

  clearOutput(out);

  let score = Number(data.score);
  if (!Number.isFinite(score)) score = 50;
  score = Math.max(0, Math.min(100, score));

  let status = data.riskLevel || "warning";
  let label = t("caution");

  if (status === "safe" || score <= 29) {
    status = "safe";
    label = t("safe");
  } else if (status === "risk" || score >= 60) {
    status = "risk";
    label = t("risk");
  } else {
    status = "warning";
    label = t("caution");
  }

  const input = document.getElementById("input");
  if (input) {
    input.classList.remove("safe-box", "risk-box", "warning-box");
    input.classList.add(status === "safe" ? "safe-box" : status === "risk" ? "risk-box" : "warning-box");
  }

  lastShareText = `${label}\n${t("riskScore")}: ${score}/100\n\n${data.result || ""}`;

  const box = makeEl("div", "result-box");
  box.appendChild(makeEl("div", `result-header result-${status}`, label));

  const meter = makeEl("div", "risk-meter");
  const fill = makeEl("div", `risk-fill ${status}`);
  fill.style.width = `${score}%`;
  meter.appendChild(fill);
  box.appendChild(meter);

  const scoreP = makeEl("p");
  scoreP.appendChild(makeEl("strong", "", `${t("riskScore")}: `));
  scoreP.appendChild(document.createTextNode(`${score}/100`));
  box.appendChild(scoreP);

  const resultText = makeEl("div");
  resultText.style.whiteSpace = "pre-wrap";
  resultText.textContent = data.result || "";
  box.appendChild(resultText);

  const remaining = makeEl("p");
  remaining.appendChild(makeEl("strong", "", `${t("freeScansLeft")}: `));
  remaining.appendChild(document.createTextNode(String(data.remaining ?? "unlimited")));
  box.appendChild(remaining);

  const actions = makeEl("div", "result-actions");

  const shareBtn = makeEl("button", "", t("shareResult"));
  shareBtn.onclick = window.shareResult;

  const copyBtn = makeEl("button", "", t("copyResult"));
  copyBtn.onclick = window.copyResult;

  const reportBtn = makeEl("button", "", t("reportSite"));
  reportBtn.onclick = window.reportScam;

  actions.appendChild(shareBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(reportBtn);

  box.appendChild(actions);
  out.appendChild(box);
}

window.shareResult = async function () {
  const out = document.getElementById("out");
  const text = lastShareText || out?.innerText || "I checked a suspicious link with ScamScouter.";
  const shareText = `${text}\n\n${t("checkedWith")}: https://www.scamscouter.com`;

  try {
    if (navigator.share) {
      await navigator.share({ title: t("shareTitle"), text: shareText, url: "https://www.scamscouter.com" });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert(t("copied"));
    }
  } catch (err) {
    console.error(err);
  }
};

window.copyResult = async function () {
  const out = document.getElementById("out");
  const text = lastShareText || out?.innerText || "";
  const copyText = `${text}\n\n${t("checkedWith")}: https://www.scamscouter.com`;

  try {
    await navigator.clipboard.writeText(copyText);
    alert(t("copied"));
  } catch (err) {
    console.error(err);
  }
};

window.reportScam = async function () {
  if (!lastScan) {
    alert(t("reportNeedsScan"));
    return;
  }

  if (!user) {
    alert(t("loginToReport"));
    await window.login();
    if (!user) return;
  }

  try {
    await addDoc(collection(db, "scamReports"), {
      input: lastScan.input,
      domain: lastScan.domain || null,
      verdict: lastScan.verdict,
      score: lastScan.score,
      result: lastScan.result,
      signals: lastScan.signals || [],
      source: extractedImageText ? "ocr_image_or_text" : "text",
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

function updateImageUploadLanguage() {
  const label = document.querySelector(".image-upload-label");
  const removeBtn = document.getElementById("removeImageBtn");
  const status = document.getElementById("imageUploadStatus");

  if (label) label.textContent = t("uploadImage");
  if (removeBtn) removeBtn.textContent = t("removeImage");

  if (status && selectedImageName && !status.dataset.locked) {
    status.textContent = `${t("imageReady")}: ${selectedImageName}`;
  }
}

function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const existing = document.querySelector('script[data-scamscouter-ocr="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Tesseract));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.dataset.scamscouterOcr = "true";
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function runBrowserOCR(file, status) {
  status.dataset.locked = "true";
  status.textContent = t("ocrLoading");

  const Tesseract = await loadTesseract();

  const result = await Tesseract.recognize(file, "eng+ron", {
    logger: (m) => {
      if (m && m.status && typeof m.progress === "number") {
        const pct = Math.round(m.progress * 100);
        if (m.status.includes("recognizing")) {
          status.textContent = `${t("ocrLoading")} ${pct}%`;
        }
      }
    }
  });

  const text = (result && result.data && result.data.text ? result.data.text : "").trim();
  status.dataset.locked = "";

  return text;
}

function ensureImageUploadUI() {
  const input = document.getElementById("input");
  if (!input) return;

  if (document.getElementById("imageUploadBox")) {
    updateImageUploadLanguage();
    return;
  }

  const box = document.createElement("div");
  box.id = "imageUploadBox";
  box.className = "image-upload-box";

  const label = document.createElement("label");
  label.className = "image-upload-label";
  label.setAttribute("for", "imageInput");
  label.textContent = t("uploadImage");

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "imageInput";
  fileInput.accept = "image/*";
  fileInput.className = "image-upload-input";
  fileInput.removeAttribute("capture");

  const status = document.createElement("div");
  status.id = "imageUploadStatus";
  status.className = "image-upload-status";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.id = "removeImageBtn";
  removeBtn.className = "image-remove-btn";
  removeBtn.textContent = t("removeImage");
  removeBtn.style.display = "none";

  const clearImage = () => {
    selectedImageName = "";
    extractedImageText = "";
    fileInput.value = "";
    status.textContent = "";
    status.dataset.locked = "";
    removeBtn.style.display = "none";
  };

  removeBtn.onclick = clearImage;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert(t("imageTooLarge"));
      fileInput.value = "";
      return;
    }

    selectedImageName = file.name || "uploaded-image";
    removeBtn.style.display = "inline-flex";

    try {
      const text = await runBrowserOCR(file, status);
      extractedImageText = text;

      if (!text) {
        status.textContent = t("ocrFailed");
        return;
      }

      const prefix = currentLang === "ro" ? "[Text extras din imagine]" : "[Text extracted from image]";
      const existing = input.value.trim();
      input.value = existing ? `${existing}\n\n${prefix}\n${text}` : `${prefix}\n${text}`;
      status.textContent = `${t("ocrDone")} (${selectedImageName})`;
    } catch (err) {
      console.error(err);
      status.textContent = t("ocrFailed");
    }
  });

  box.appendChild(label);
  box.appendChild(fileInput);
  box.appendChild(status);
  box.appendChild(removeBtn);

  input.parentNode.insertBefore(box, input);
  updateImageUploadLanguage();
}

document.addEventListener("DOMContentLoaded", ensureImageUploadUI);
window.addEventListener("scamscouter:includes-ready", ensureImageUploadUI);

window.runScan = async function () {
  const input = document.getElementById("input");
  if (!input) return;

  const text = input.value.trim();

  if (!text) {
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

window.upgrade = function () {
  alert(t("upgradeSoon"));
};

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage();
  ensureImageUploadUI();
});

applyLanguage();
ensureImageUploadUI();
