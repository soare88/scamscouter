const ENGINE_VERSION = "ScamScouter Detection Engine v1.3 OCR + Phone";

const TRUSTED = [
  "google.com","apple.com","microsoft.com","amazon.com","paypal.com","revolut.com","wise.com",
  "emag.ro","altex.ro","f64.ro","dhl.com","fan-courier.ro","anaf.ro","olx.ro",
  "facebook.com","instagram.com","linkedin.com","github.com","youtube.com","x.com","twitter.com"
];

const BAD = [
  "okrex.org","okrex.com","okred.com","paypal-login-security.xyz","login-paypal-security.xyz",
  "support-paypal-verification.xyz","claim-airdrop-wallet.com","walletconnect-verify.net",
  "metamask-restore.com","binance-reward.com"
];

const RISK_TLD = [".top",".xyz",".click",".shop",".buzz",".live",".monster",".cam",".icu",".quest",".bond",".cyou",".sbs"];
const SHORT = ["bit.ly","tinyurl.com","t.co","goo.gl","cutt.ly","is.gd","ow.ly","rebrand.ly","s.id","lnkd.in"];
const BRANDS = ["paypal","google","apple","microsoft","amazon","dhl","olx","fan","anaf","binance","coinbase","okx","okex","bybit","kucoin","metamask","trustwallet","revolut","wise"];
const CRYPTO = ["crypto","coin","token","wallet","swap","staking","trading","trade","exchange","forex","mining","defi","invest","profit","yield","airdrop","web3","okrex","okred"];
const WORDS = [
  "urgent","verify now","account suspended","blocked account","delivery fee","claim reward","free gift",
  "confirm payment","wallet verification","seed phrase","private key","security code","limited time",
  "guaranteed profit","withdrawal fee","tax payment","unlock funds","click here to verify",
  "cod de verificare","cont blocat","plata colet","taxa livrare","taxă livrare","premiu","castigat",
  "câștigat","confirmă plata","card bancar","date card","profit garantat","taxă retragere","deblochează fonduri",
  "whatsapp","transfer bancar","revolut","iban","curier","colet","livrare"
];

function exactOrSub(domain, root) {
  return domain === root || domain.endsWith("." + root);
}

function getUrls(text) {
  return String(text).match(/https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
}

function getDomain(raw) {
  try {
    const clean = String(raw).replace(/[),.;\]}>]+$/g, "");
    const url = new URL(clean.startsWith("http") ? clean : "https://" + clean);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function labelOf(domain) {
  return domain.split(".")[0] || domain;
}

function getPhones(text) {
  const matches = String(text).match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [];
  return [...new Set(matches.map(p => p.replace(/\s+/g, " ").trim()).filter(p => p.replace(/\D/g, "").length >= 8))];
}

function getEmails(text) {
  const matches = String(text).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, version: ENGINE_VERSION, error: "Method not allowed. Use POST." });
  }

  try {
    const text = String((req.body && req.body.text) || "").trim();
    const language = String((req.body && req.body.language) || "en").toLowerCase();
    const isRo = language.startsWith("ro");

    if (!text) {
      return res.status(400).json({ ok: false, version: ENGINE_VERSION, error: "No text provided." });
    }

    const lower = text.toLowerCase();
    const domains = [...new Set(getUrls(text).map(getDomain).filter(Boolean))];
    const phones = getPhones(text);
    const emails = getEmails(text);

    let score = 20;
    let trusted = false;
    let unknown = false;
    let knownRisk = false;
    let crypto = false;
    let brandRisk = false;
    const signals = [];

    function add(msg, points) {
      signals.push(msg);
      score += points;
    }

    if (phones.length) {
      add("Phone number detected: " + phones.join(", "), 8);
      if (/(whatsapp|sms|curier|colet|livrare|payment|plata|plată|transfer|revolut|iban|taxa|taxă|card|cod)/i.test(text)) {
        add("Phone number appears in a payment/delivery/account context. Verify before contacting or paying.", 18);
      }
    }

    if (emails.length) {
      add("Email address detected: " + emails.join(", "), 6);
      if (/(paypal|support|security|verify|account|cont|plata|payment|bank|banca)/i.test(text)) {
        add("Email appears in an account/payment/security context. Check sender carefully.", 14);
      }
    }

    if (!domains.length && text.length > 25) {
      add("Message content analyzed without a clear URL. Treat unknown messages with caution.", 12);
    }

    for (const domain of domains) {
      const label = labelOf(domain);
      const isTrusted = TRUSTED.some(d => exactOrSub(domain, d));

      if (isTrusted) {
        trusted = true;
        score -= 30;
        signals.push("Trusted official domain detected: " + domain);
      } else {
        unknown = true;
        add("Unknown or unverified domain. Unknown domains are not marked fully safe: " + domain, 25);
      }

      if (BAD.some(d => exactOrSub(domain, d))) {
        knownRisk = true;
        add("Known high-risk or reported suspicious domain detected: " + domain, 90);
      }

      if (RISK_TLD.some(tld => domain.endsWith(tld))) add("Higher-risk domain extension detected: " + domain, 24);
      if (SHORT.some(s => exactOrSub(domain, s))) add("URL shortener detected. Destination may be hidden: " + domain, 24);

      for (const brand of BRANDS) {
        const official = TRUSTED.some(d => exactOrSub(domain, d) && domain.includes(brand));
        if (label.includes(brand) && !official) {
          brandRisk = true;
          add("Possible brand impersonation detected: " + brand, 35);
        }
      }

      for (const word of CRYPTO) {
        if ((label.includes(word) || domain.includes(word)) && !isTrusted) {
          crypto = true;
          add("Crypto / investment / trading pattern detected: " + word, 35);
          break;
        }
      }

      if (label.length <= 5 && !isTrusted) add("Short unknown domain name. Manual verification recommended.", 10);
      if (/\d{2,}/.test(label) && !isTrusted) add("Numbers detected in unknown domain label.", 10);
    }

    for (const word of WORDS) {
      if (lower.includes(word)) add('Suspicious phrase detected: "' + word + '"', 12);
    }

    if (lower.includes("http://")) add("Non-HTTPS link detected.", 12);
    if (["password","parola","card","cod","security code","seed phrase","private key","otp"].some(w => lower.includes(w))) {
      add("Message may ask for sensitive information.", 18);
    }

    if (unknown && score < 40) score = 40;
    if (phones.length && score < 30) score = 30;
    if (emails.length && score < 28) score = 28;
    if (crypto && score < 70) score = 70;
    if (brandRisk && score < 75) score = 75;
    if (knownRisk && score < 95) score = 95;

    if (trusted && !unknown && !knownRisk && !crypto && !brandRisk && !phones.length && signals.length <= 1) {
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
      : isRo ? "- Nu au fost detectate semnale majore automat." : "- No major automated red flags detected.";

    const checks = [
      domains[0] ? "Domain analysis: checked" : "Domain analysis: no domain detected",
      phones.length ? "Phone number analysis: checked" : "Phone number analysis: no number detected",
      emails.length ? "Email analysis: checked" : "Email analysis: no email detected",
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
${checks}

Semnale detectate:
${signalList}

Explicație:
ScamScouter analizează linkuri, domenii, mesaje, emailuri și numere de telefon. Domeniile necunoscute primesc cel puțin Atenție. Numerele de telefon din contexte de plată, curier, cont sau coduri trebuie verificate manual.

Sfaturi:
Nu introduce parole, date de card, coduri de verificare, seed phrase sau private key. Nu suna și nu plăti către numere necunoscute fără verificare din surse oficiale.`
      : `${ENGINE_VERSION}

Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
${checks}

Detected signals:
${signalList}

Explanation:
ScamScouter analyzes suspicious links, domains, messages, emails and phone numbers. Unknown domains receive at least Use Caution. Phone numbers in payment, delivery, account or code-verification contexts should be manually verified.

Safety advice:
Do not enter passwords, card numbers, verification codes, seed phrases or private keys. Do not call or pay unknown numbers without verifying through official sources.`;

    return res.status(200).json({
      ok: true,
      version: ENGINE_VERSION,
      verdict,
      riskLevel,
      score,
      result,
      remaining: "unlimited",
      domain: domains[0] || null,
      phones,
      emails,
      signals,
      checks
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return res.status(500).json({ ok: false, version: ENGINE_VERSION, error: "Scan failed on server. Please try again." });
  }
}
