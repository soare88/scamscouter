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
    homeTitle: "ScamScouter - Check Suspicious Links, Messages & Scam Websites",
    homeDescription: "Use ScamScouter to check suspicious links, scam messages, phishing emails and fake websites before you click.",
    scannerProof: "Free beta • No signup required • Instant results",
    statFreeTitle: "Free",
    statFreeText: "No signup required",
    statInstantTitle: "Instant",
    statInstantText: "Fast risk analysis",
    statAiTitle: "AI",
    statAiText: "Scam pattern checks",
    scoreAria: "Example trust score",
    checkingExample: "Checking example",
    trustScore: "Trust Score",
    verySafe: "Very Safe",
    sslCertificate: "SSL Certificate",
    valid: "Valid",
    blacklistStatus: "Blacklist Status",
    clean: "Clean",
    domainSignals: "Domain Signals",
    checked: "Checked",
    scamPatterns: "Scam Patterns",
    analyzed: "Analyzed",
    featureAiTitle: "AI Scam Detection",
    featureAiText: "ScamScouter analyzes suspicious patterns in links, emails, messages and websites to help you avoid scams.",
    featureScoreTitle: "Instant Risk Score",
    featureScoreText: "Get a simple verdict, risk score, red flags and practical safety advice in seconds.",
    featureClickTitle: "Check Before You Click",
    featureClickText: "Useful for phishing links, fake stores, marketplace scams, delivery scams and suspicious emails.",
    popularChecksTitle: "Popular scam checks",
    popularChecksText: "Quick access to common scam checks in English and Romanian.",
    premiumComingSoon: "Premium coming soon",
    builtTitle: "Built for quick decisions",
    builtText: "ScamScouter helps you slow down before clicking a suspicious link, entering card details, paying a fake delivery fee, replying to a fake buyer or trusting an unexpected email.",
    inputPlaceholder: "Paste a suspicious link, message, email, or website...",
    scanButton: "Scan Now",
    analyzing: "Analyzing scam signals... 🤖",
    emptyInput: "Please paste a suspicious link, message, or email.",
    loginFailed: "Sign in failed. Please try again.",
    scanFailed: "Scan failed. Please try again.",
    riskScore: "Risk score",
    freeScansLeft: "Free scans left",
    safe: "✅ Looks Safe",
    caution: "⚠️ Use Caution",
    risk: "🚨 High Scam Risk",
    shareResult: "Share Result",
    copyResult: "Copy Result",
    mainReason: "Main reason",
    recommendedAction: "Recommended action",
    confidence: "Confidence",
    confidenceLow: "Low",
    confidenceMedium: "Medium",
    confidenceHigh: "High",
    actionSafe: "Still verify payment or login requests through official channels.",
    actionWarning: "Do not enter card details, passwords or verification codes until you verify the source.",
    actionRisk: "Do not click, pay, reply or enter personal details. Verify only through official channels.",
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
    reportTitle: "Report this scam",
    reportType: "What are you reporting?",
    reportPlatform: "Where did you receive it?",
    reportNotes: "Extra details",
    reportTypeWebsite: "Website / link",
    reportTypeEmail: "Email address",
    reportTypeMessage: "Message / screenshot text",
    reportPlatformWebsite: "Website",
    reportPlatformSms: "SMS",
    reportPlatformWhatsapp: "WhatsApp",
    reportPlatformEmail: "Email",
    reportPlatformMarketplace: "Marketplace / OLX",
    reportPlatformSocial: "Social media",
    reportPlatformOther: "Other",
    reportNotesPlaceholder: "Add details such as what the scammer asked for, amount, company name, or anything suspicious...",
    submitReport: "Submit report",
    cancelReport: "Cancel",
    reportSaving: "Saving report...",
    reportClose: "Close",
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
    homeTitle: "ScamScouter - Verifică linkuri, mesaje și site-uri suspecte",
    homeDescription: "Folosește ScamScouter pentru a verifica linkuri suspecte, mesaje scam, emailuri phishing și site-uri false înainte să dai click.",
    scannerProof: "Beta gratuit • Fără cont obligatoriu • Rezultate rapide",
    statFreeTitle: "Gratuit",
    statFreeText: "Fără cont obligatoriu",
    statInstantTitle: "Instant",
    statInstantText: "Analiză rapidă de risc",
    statAiTitle: "AI",
    statAiText: "Verificare semnale scam",
    scoreAria: "Exemplu scor de încredere",
    checkingExample: "Exemplu verificare",
    trustScore: "Scor de încredere",
    verySafe: "Foarte sigur",
    sslCertificate: "Certificat SSL",
    valid: "Valid",
    blacklistStatus: "Status blacklist",
    clean: "Curat",
    domainSignals: "Semnale domeniu",
    checked: "Verificat",
    scamPatterns: "Tipare scam",
    analyzed: "Analizate",
    featureAiTitle: "Detectare scam asistată de AI",
    featureAiText: "ScamScouter analizează tipare suspecte în linkuri, emailuri, mesaje și site-uri pentru a te ajuta să eviți fraudele.",
    featureScoreTitle: "Scor de risc instant",
    featureScoreText: "Primești verdict simplu, scor de risc, semnale importante și sfaturi practice în câteva secunde.",
    featureClickTitle: "Verifică înainte să dai click",
    featureClickText: "Util pentru linkuri phishing, magazine false, scamuri marketplace, curier fals și emailuri suspecte.",
    popularChecksTitle: "Verificări populare",
    popularChecksText: "Acces rapid la verificări comune pentru scamuri în engleză și română.",
    premiumComingSoon: "Premium în curând",
    builtTitle: "Creat pentru decizii rapide",
    builtText: "ScamScouter te ajută să încetinești înainte să dai click pe un link suspect, să introduci date de card, să plătești o taxă falsă de livrare, să răspunzi unui cumpărător fals sau să ai încredere într-un email neașteptat.",
    inputPlaceholder: "Lipește un link, mesaj, email sau site suspect...",
    scanButton: "Scanează acum",
    analyzing: "Analizăm semnalele de fraudă... 🤖",
    emptyInput: "Te rog lipește un link, mesaj sau email suspect.",
    loginFailed: "Autentificarea a eșuat. Încearcă din nou.",
    scanFailed: "Scanarea a eșuat. Încearcă din nou.",
    riskScore: "Scor de risc",
    freeScansLeft: "Scanări gratuite rămase",
    safe: "✅ Pare sigur",
    caution: "⚠️ Atenție",
    risk: "🚨 Risc ridicat de scam",
    shareResult: "Distribuie rezultatul",
    copyResult: "Copiază rezultatul",
    mainReason: "Motiv principal",
    recommendedAction: "Acțiune recomandată",
    confidence: "Încredere",
    confidenceLow: "Scăzută",
    confidenceMedium: "Medie",
    confidenceHigh: "Ridicată",
    actionSafe: "Verifică totuși cererile de plată sau autentificare prin canale oficiale.",
    actionWarning: "Nu introduce date de card, parole sau coduri până nu verifici sursa.",
    actionRisk: "Nu da click, nu plăti, nu răspunde și nu introduce date personale. Verifică doar prin surse oficiale.",
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
    reportTitle: "Raportează scamul",
    reportType: "Ce raportezi?",
    reportPlatform: "Unde ai primit mesajul?",
    reportNotes: "Detalii suplimentare",
    reportTypeWebsite: "Website / link",
    reportTypeEmail: "Adresă email",
    reportTypeMessage: "Mesaj / text din screenshot",
    reportPlatformWebsite: "Website",
    reportPlatformSms: "SMS",
    reportPlatformWhatsapp: "WhatsApp",
    reportPlatformEmail: "Email",
    reportPlatformMarketplace: "Marketplace / OLX",
    reportPlatformSocial: "Rețele sociale",
    reportPlatformOther: "Altceva",
    reportNotesPlaceholder: "Adaugă detalii: ce a cerut scammerul, suma, numele firmei, linkul sau orice pare suspect...",
    submitReport: "Trimite raportul",
    cancelReport: "Anulează",
    reportSaving: "Se salvează raportul...",
    reportClose: "Închide",
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

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
  });

  if (location.pathname === "/" || location.pathname.endsWith("/index.html")) {
    document.title = t("homeTitle");
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", t("homeDescription"));
  }

  const userBox = document.getElementById("user");
  if (userBox && !user) userBox.innerText = t("guest");

  const input = document.getElementById("input");
  if (input) input.placeholder = t("inputPlaceholder");

  const langSelect = document.getElementById("languageSelect");
  if (langSelect) langSelect.value = currentLang;

  updateImageUploadLanguage();
  updateReportModalLanguage();
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


function getResultMainReason(data) {
  const signals = Array.isArray(data.signals) ? data.signals : [];
  if (!signals.length) return data.riskLevel === "safe" ? "No major automated red flags detected." : "Multiple risk signals detected.";
  const important = signals.find((s) =>
    /known high-risk|brand impersonation|crypto|unknown|shortener|payment|delivery|contact details|sensitive/i.test(s)
  );
  return important || signals[0];
}

function getRecommendedAction(status) {
  if (status === "safe") return t("actionSafe");
  if (status === "risk") return t("actionRisk");
  return t("actionWarning");
}

function getConfidence(score, signals) {
  const count = Array.isArray(signals) ? signals.length : 0;
  if (score >= 75 || score <= 20 || count >= 4) return t("confidenceHigh");
  if (score >= 40 || count >= 2) return t("confidenceMedium");
  return t("confidenceLow");
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

  const detailGrid = makeEl("div", "professional-result-grid");

  const reasonCard = makeEl("div", "professional-result-card");
  reasonCard.appendChild(makeEl("span", "", t("mainReason")));
  reasonCard.appendChild(makeEl("strong", "", getResultMainReason(data)));

  const actionCard = makeEl("div", "professional-result-card");
  actionCard.appendChild(makeEl("span", "", t("recommendedAction")));
  actionCard.appendChild(makeEl("strong", "", getRecommendedAction(status)));

  const confidenceCard = makeEl("div", "professional-result-card");
  confidenceCard.appendChild(makeEl("span", "", t("confidence")));
  confidenceCard.appendChild(makeEl("strong", "", getConfidence(score, data.signals)));

  detailGrid.appendChild(reasonCard);
  detailGrid.appendChild(actionCard);
  detailGrid.appendChild(confidenceCard);
  box.appendChild(detailGrid);

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


function inferReportType(scan) {
  if (!scan) return "message";
  if (scan.emails && scan.emails.length) return "email";
  if (scan.domain) return "website";
  return "message";
}

function inferReportPlatform(scan) {
  const text = String((scan && scan.input) || "").toLowerCase();
  if (text.includes("whatsapp")) return "whatsapp";
  if (text.includes("sms") || text.includes("mesaj")) return "sms";
  if (text.includes("olx") || text.includes("marketplace")) return "marketplace";
  if (text.includes("@")) return "email";
  if (text.includes("facebook") || text.includes("instagram") || text.includes("tiktok")) return "social";
  if (scan && scan.domain) return "website";
  return "other";
}

function ensureReportModal() {
  let modal = document.getElementById("reportModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "reportModal";
  modal.className = "report-modal";
  modal.style.display = "none";

  modal.innerHTML = `
    <div class="report-modal-backdrop" data-report-close="true"></div>
    <div class="report-modal-card" role="dialog" aria-modal="true" aria-labelledby="reportModalTitle">
      <div class="report-modal-header">
        <h2 id="reportModalTitle"></h2>
        <button type="button" class="report-modal-x" data-report-close="true">×</button>
      </div>
      <div class="report-modal-body">
        <label class="report-label" for="reportType"></label>
        <select id="reportType" class="report-select">
          <option value="website"></option>
          <option value="email"></option>
          <option value="message"></option>
        </select>

        <label class="report-label" for="reportPlatform"></label>
        <select id="reportPlatform" class="report-select">
          <option value="website"></option>
          <option value="sms"></option>
          <option value="whatsapp"></option>
          <option value="email"></option>
          <option value="marketplace"></option>
          <option value="social"></option>
          <option value="other"></option>
        </select>

        <label class="report-label" for="reportNotes"></label>
        <textarea id="reportNotes" class="report-notes" rows="4"></textarea>

        <div id="reportSummary" class="report-summary"></div>
        <div id="reportStatus" class="report-status"></div>
      </div>
      <div class="report-modal-actions">
        <button type="button" class="report-cancel" data-report-close="true"></button>
        <button type="button" class="report-submit" id="submitReportBtn"></button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelectorAll("[data-report-close]").forEach((btn) => btn.addEventListener("click", closeReportModal));
  document.getElementById("submitReportBtn").addEventListener("click", submitScamReport);
  return modal;
}

function updateReportModalLanguage() {
  const modal = document.getElementById("reportModal");
  if (!modal) return;

  const set = (selector, value) => {
    const el = modal.querySelector(selector);
    if (el) el.textContent = value;
  };

  set("#reportModalTitle", t("reportTitle"));
  set('label[for="reportType"]', t("reportType"));
  set('label[for="reportPlatform"]', t("reportPlatform"));
  set('label[for="reportNotes"]', t("reportNotes"));
  set(".report-cancel", t("cancelReport"));
  set("#submitReportBtn", t("submitReport"));

  const notes = modal.querySelector("#reportNotes");
  if (notes) notes.placeholder = t("reportNotesPlaceholder");

  const type = modal.querySelector("#reportType");
  if (type) {
    type.querySelector('option[value="website"]').textContent = t("reportTypeWebsite");
    type.querySelector('option[value="email"]').textContent = t("reportTypeEmail");
    type.querySelector('option[value="message"]').textContent = t("reportTypeMessage");
  }

  const platform = modal.querySelector("#reportPlatform");
  if (platform) {
    platform.querySelector('option[value="website"]').textContent = t("reportPlatformWebsite");
    platform.querySelector('option[value="sms"]').textContent = t("reportPlatformSms");
    platform.querySelector('option[value="whatsapp"]').textContent = t("reportPlatformWhatsapp");
    platform.querySelector('option[value="email"]').textContent = t("reportPlatformEmail");
    platform.querySelector('option[value="marketplace"]').textContent = t("reportPlatformMarketplace");
    platform.querySelector('option[value="social"]').textContent = t("reportPlatformSocial");
    platform.querySelector('option[value="other"]').textContent = t("reportPlatformOther");
  }
}

function openReportModal() {
  const modal = ensureReportModal();
  updateReportModalLanguage();

  const type = document.getElementById("reportType");
  const platform = document.getElementById("reportPlatform");
  const notes = document.getElementById("reportNotes");
  const status = document.getElementById("reportStatus");
  const summary = document.getElementById("reportSummary");

  if (type) type.value = inferReportType(lastScan);
  if (platform) platform.value = inferReportPlatform(lastScan);
  if (notes) notes.value = "";
  if (status) status.textContent = "";

  if (summary && lastScan) {
    const parts = [];
    if (lastScan.domain) parts.push(`Domain: ${lastScan.domain}`);
    if (lastScan.emails && lastScan.emails.length) parts.push(`Email: ${lastScan.emails.join(", ")}`);
    parts.push(`Verdict: ${lastScan.verdict || "unknown"}`);
    parts.push(`Score: ${lastScan.score ?? "unknown"}/100`);
    summary.textContent = parts.join(" • ");
  }

  modal.style.display = "flex";
  document.body.classList.add("report-modal-open");
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (modal) modal.style.display = "none";
  document.body.classList.remove("report-modal-open");
}

async function submitScamReport() {
  if (!lastScan) {
    alert(t("reportNeedsScan"));
    return;
  }

  if (!user) {
    alert(t("loginToReport"));
    await window.login();
    if (!user) return;
  }

  const submitBtn = document.getElementById("submitReportBtn");
  const status = document.getElementById("reportStatus");
  const reportType = document.getElementById("reportType")?.value || inferReportType(lastScan);
  const platform = document.getElementById("reportPlatform")?.value || inferReportPlatform(lastScan);
  const notes = document.getElementById("reportNotes")?.value || "";

  try {
    if (submitBtn) submitBtn.disabled = true;
    if (status) status.textContent = t("reportSaving");

    await addDoc(collection(db, "scamReports"), {
      reportType,
      platform,
      notes: notes.trim(),
      input: lastScan.input,
      domain: lastScan.domain || null,
      emails: lastScan.emails || [],
      verdict: lastScan.verdict || null,
      riskLevel: lastScan.riskLevel || null,
      score: lastScan.score ?? null,
      result: lastScan.result || "",
      signals: lastScan.signals || [],
      language: currentLang,
      source: extractedImageText ? "ocr_image_or_text" : "text",
      approved: false,
      reviewed: false,
      product: "ScamScouter",
      reporterUid: user.uid,
      reporterEmail: user.email,
      createdAt: serverTimestamp()
    });

    if (status) status.textContent = t("reportSaved");
    setTimeout(closeReportModal, 900);
  } catch (err) {
    console.error(err);
    if (status) status.textContent = "Could not save report. Please try again.";
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

window.reportScam = async function () {
  if (!lastScan) {
    alert(t("reportNeedsScan"));
    return;
  }
  openReportModal();
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
      emails: data.emails || [],
      verdict: data.verdict,
      riskLevel: data.riskLevel,
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
