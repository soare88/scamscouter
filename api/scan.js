const ENGINE_VERSION = "ScamScouter Detection Engine v1.2 Image Upload";

const TRUSTED = [
  "google.com","apple.com","microsoft.com","amazon.com","paypal.com","revolut.com","wise.com",
  "emag.ro","altex.ro","f64.ro","dhl.com","fan-courier.ro","anaf.ro","olx.ro",
  "facebook.com","instagram.com","linkedin.com","github.com","youtube.com","x.com","twitter.com"
];

const KNOWN_RISK = [
  "okrex.org","okrex.com","okred.com","paypal-login-security.xyz","login-paypal-security.xyz",
  "support-paypal-verification.xyz","claim-airdrop-wallet.com","walletconnect-verify.net",
  "metamask-restore.com","binance-reward.com"
];

const RISKY_TLDS = [".top",".xyz",".click",".shop",".buzz",".live",".monster",".cam",".icu",".quest",".mom",".bond",".cyou",".rest",".sbs"];
const SHORTENERS = ["bit.ly","tinyurl.com","t.co","goo.gl","cutt.ly","is.gd","ow.ly","rebrand.ly","s.id","lnkd.in"];

const BRANDS = ["paypal","google","apple","microsoft","amazon","dhl","olx","fan","anaf","binance","coinbase","kraken","okx","okex","bybit","kucoin","metamask","trustwallet","revolut","wise"];

const CRYPTO = ["crypto","coin","token","wallet","swap","staking","stake","trading","trade","exchange","forex","mining","defi","invest","profit","yield","airdrop","web3","okrex","okred"];

const PHRASES = [
  "urgent","verify now","account suspended","blocked account","delivery fee","claim reward","free gift",
  "confirm payment","wallet verification","seed phrase","private key","security code","limited time",
  "guaranteed profit","guaranteed return","withdrawal fee","tax payment","unlock funds","click here to verify",
  "your account will be closed","cod de verificare","cont blocat","plata colet","taxa livrare","taxă livrare",
  "premiu","castigat","câștigat","confirmă plata","card bancar","date card","profit garantat","taxă retragere",
  "deblochează fonduri","contul va fi inchis","contul va fi închis"
];

function exactOrSub(domain, root) {
  return domain === root || domain.endsWith("." + root);
}

function urlsFrom(text) {
  return text.match(/https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
}

function domainFrom(raw) {
  try {
    const clean = String(raw).replace(/[),.;\]}>]+$/g, "");
    const url = new URL(clean.startsWith("http") ? clean : "https://" + clean);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function domainLabel(domain) {
  return domain.split(".")[0] || domain;
}

async function analyzeImage(image, language) {
  if (!image || !image.base64 || !image.mimeType) return "";
  if (!process.env.GEMINI_API_KEY) return "";

  const isRo = String(language).toLowerCase().startsWith("ro");
  const prompt = isRo
    ? "Citește această poză/screenshot și analizează dacă mesajul este scam/phishing. Extrage textul important, linkurile, cererile de plată, coduri, date card, crypto sau curier. Răspunde scurt în română cu: Text observat, Semnale de risc, Recomandare."
    : "Read this photo/screenshot and analyze if the message is scam/phishing. Extract important text, links, payment requests, codes, card data, crypto or delivery claims. Reply briefly in English with: Observed text, Risk signals, Recommendation.";

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: image.mimeType, data: image.base64 } }
          ]
        }]
      })
    });

    if (!r.ok) return "";
    const j = await r.json();
    return j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, version: ENGINE_VERSION, error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body || {};
    const text = String(body.text || "").trim();
    const language = String(body.language || "en").toLowerCase();
    const image = body.image || null;

    if (!text && !image) {
      return res.status(400).json({ ok: false, version: ENGINE_VERSION, error: "No text or image provided." });
    }

    const isRo = language.startsWith("ro");
    const imageAnalysis = await analyzeImage(image, language);
    const combined = [text, imageAnalysis].filter(Boolean).join("\n\n");
    const lower = combined.toLowerCase();

    let score = 20;
    const signals = [];
    let hasTrusted = false;
    let hasUnknown = false;
    let hasKnownRisk = false;
    let hasCrypto = false;
    let hasBrand = false;

    const add = (msg, weight) => {
      signals.push(msg);
      score += weight;
    };

    const domains = [...new Set(urlsFrom(combined).map(domainFrom).filter(Boolean))];
    const mainDomain = domains[0] || null;

    if (image) {
      signals.push(imageAnalysis ? "Image/screenshot uploaded and analyzed." : "Image uploaded. AI image reading unavailable or returned no text.");
      if (!process.env.GEMINI_API_KEY) add("Image analysis requires GEMINI_API_KEY on the server.", 5);
      if (imageAnalysis) add("AI found readable content in the uploaded image.", 10);
    }

    if (!domains.length && combined.length > 25) {
      add("Message content analyzed without a clear URL. Treat unknown messages with caution.", 12);
    }

    for (const domain of domains) {
      const label = domainLabel(domain);
      const trusted = TRUSTED.some(d => exactOrSub(domain, d));

      if (trusted) {
        hasTrusted = true;
        score -= 30;
        signals.push("Trusted official domain detected: " + domain);
      } else {
        hasUnknown = true;
        add("Unknown or unverified domain. ScamScouter does not mark unknown domains as fully safe: " + domain, 25);
      }

      if (KNOWN_RISK.some(d => exactOrSub(domain, d))) {
        hasKnownRisk = true;
        add("Known high-risk or reported suspicious domain detected: " + domain, 90);
      }

      if (RISKY_TLDS.some(t => domain.endsWith(t))) add("Higher-risk domain extension detected: " + domain, 24);
      if (SHORTENERS.some(s => exactOrSub(domain, s))) add("URL shortener detected. Destination may be hidden: " + domain, 24);

      for (const brand of BRANDS) {
        const official = TRUSTED.some(d => exactOrSub(domain, d) && domain.includes(brand));
        if (label.includes(brand) && !official) {
          hasBrand = true;
          add("Possible brand impersonation or clone pattern detected: " + brand, 35);
        }
      }

      for (const word of CRYPTO) {
        if ((label.includes(word) || domain.includes(word)) && !trusted) {
          hasCrypto = true;
          add("Crypto / investment / trading related pattern detected: " + word, 35);
          break;
        }
      }

      if (label.length <= 5 && !trusted) add("Short unknown domain name. Manual verification recommended.", 10);
      if (/\d{2,}/.test(label) && !trusted) add("Numbers detected in unknown domain label.", 10);
    }

    for (const phrase of PHRASES) {
      if (lower.includes(phrase)) add(`Suspicious phrase detected: "${phrase}"`, 12);
    }

    if (lower.includes("http://")) add("Non-HTTPS link detected.", 12);

    if (["password","parola","card","cod","security code","seed phrase","private key"].some(w => lower.includes(w))) {
      add("Message may ask for sensitive information.", 18);
    }

    if (hasUnknown && score < 40) score = 40;
    if (hasCrypto && score < 70) score = 70;
    if (hasBrand && score < 75) score = 75;
    if (hasKnownRisk && score < 95) score = 95;

    if (hasTrusted && !hasUnknown && !hasKnownRisk && !hasCrypto && !hasBrand && signals.length <= 1) {
      score = Math.min(score, 18);
    }

    score = Math.max(0, Math.min(100, score));

    let verdict = "Safe";
    let riskLevel = "safe";
    if (score >= 60) {
      verdict = "High Risk";
      riskLevel = "risk";
    } else if (score >= 30) {
      verdict = "Suspicious";
      riskLevel = "warning";
    }

    const signalList = signals.length
      ? signals.map(s => "- " + s).join("\n")
      : (isRo ? "- Nu au fost detectate semnale majore automat." : "- No major automated red flags detected.");

    const checksList = [
      mainDomain ? "Domain analysis: checked" : "Domain analysis: no domain detected",
      "Image / screenshot analysis: " + (image ? "checked" : "not provided"),
      "Unknown domain policy: checked",
      "Known high-risk list: checked",
      "Crypto / investment patterns: checked",
      "Brand impersonation patterns: checked",
      "URL structure: checked",
      "ScamScouter engine: " + ENGINE_VERSION
    ].map(s => "- " + s).join("\n");

    const result = isRo
      ? `${ENGINE_VERSION}

Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
${checksList}

Semnale detectate:
${signalList}

Analiză imagine:
${imageAnalysis || "Nu există analiză de imagine disponibilă."}

Explicație:
ScamScouter analizează textul, linkurile și pozele/screenshoturile încărcate. Domeniile necunoscute primesc cel puțin Atenție. Domeniile crypto/investment/trading sau cele raportate primesc risc ridicat.

Sfaturi:
Nu introduce parole, date de card, coduri de verificare, seed phrase sau private key. Dacă mesajul cere plată, taxă de retragere sau promite profit, verifică din surse oficiale.`
      : `${ENGINE_VERSION}

Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
${checksList}

Detected signals:
${signalList}

Image analysis:
${imageAnalysis || "No image analysis available."}

Explanation:
ScamScouter analyzes submitted text, links and uploaded photos/screenshots. Unknown domains receive at least Use Caution. Crypto/investment/trading patterns and reported suspicious domains receive a higher risk score.

Safety advice:
Do not enter passwords, card numbers, verification codes, seed phrases or private keys. If the message asks for payment, withdrawal fees or promises profit, verify through official sources.`;

    return res.status(200).json({
      ok: true,
      version: ENGINE_VERSION,
      verdict,
      riskLevel,
      score,
      result,
      remaining: "unlimited",
      domain: mainDomain,
      signals,
      imageAnalysis,
      checks: checksList
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return res.status(500).json({ ok: false, version: ENGINE_VERSION, error: "Scan failed on server. Please try again." });
  }
}
