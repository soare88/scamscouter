export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
  }

  try {
    const text = String((req.body && req.body.text) || "").trim();
    const language = String((req.body && req.body.language) || "en").toLowerCase();

    if (!text) {
      return res.status(400).json({ ok: false, error: "No text provided." });
    }

    const lower = text.toLowerCase();
    const signals = [];
    let score = 15;

    const trusted = [
      "google.com", "apple.com", "microsoft.com", "amazon.com", "paypal.com",
      "revolut.com", "wise.com", "emag.ro", "altex.ro", "dhl.com",
      "fan-courier.ro", "anaf.ro", "olx.ro"
    ];

    const riskyTlds = [".top", ".xyz", ".click", ".shop", ".buzz", ".live", ".monster", ".cam", ".icu"];
    const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "cutt.ly", "is.gd", "ow.ly"];
    const scamWords = [
      "urgent", "verify now", "account suspended", "blocked account", "delivery fee",
      "claim reward", "free gift", "confirm payment", "wallet verification",
      "seed phrase", "private key", "security code", "cod de verificare",
      "cont blocat", "plata colet", "taxa livrare", "premiu", "castigat",
      "câștigat", "confirmă plata", "card bancar", "date card"
    ];

    function extractUrls(input) {
      return input.match(/https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
    }

    function domainFromUrl(raw) {
      try {
        const clean = raw.replace(/[),.;]+$/g, "");
        const url = new URL(clean.startsWith("http") ? clean : "https://" + clean);
        return url.hostname.replace(/^www\./, "").toLowerCase();
      } catch (e) {
        return "";
      }
    }

    const urls = extractUrls(text);
    const domains = urls.map(domainFromUrl).filter(Boolean);
    const mainDomain = domains[0] || null;

    if (!urls.length && text.length > 25) {
      score += 8;
      signals.push("Message text was analyzed without a clear URL.");
    }

    for (const domain of domains) {
      if (trusted.includes(domain)) {
        score -= 18;
        signals.push("Trusted domain detected: " + domain);
      }

      if (riskyTlds.some((tld) => domain.endsWith(tld))) {
        score += 22;
        signals.push("Higher-risk domain extension detected: " + domain);
      }

      if (shorteners.includes(domain)) {
        score += 18;
        signals.push("URL shortener detected: " + domain);
      }

      for (const safeDomain of trusted) {
        const brand = safeDomain.split(".")[0];
        if (domain.includes(brand) && domain !== safeDomain && !domain.endsWith("." + safeDomain)) {
          score += 28;
          signals.push("Possible brand impersonation: " + domain + " may imitate " + safeDomain);
        }
      }
    }

    for (const word of scamWords) {
      if (lower.includes(word)) {
        score += 8;
        signals.push('Suspicious phrase detected: "' + word + '"');
      }
    }

    if (lower.includes("http://")) {
      score += 10;
      signals.push("Non-HTTPS link detected.");
    }

    if (
      lower.includes("password") ||
      lower.includes("parola") ||
      lower.includes("card") ||
      lower.includes("cod") ||
      lower.includes("security code")
    ) {
      score += 10;
      signals.push("Message may ask for sensitive information.");
    }

    score = Math.max(0, Math.min(100, score));

    let verdict = "Safe";
    if (score >= 60) verdict = "High Risk";
    else if (score >= 30) verdict = "Suspicious";

    const isRo = language.startsWith("ro");
    const list = signals.length ? signals.map((s) => "- " + s).join("\\n") : (isRo ? "- Nu au fost detectate semnale majore automat." : "- No major automated red flags detected.");

    const result = isRo
      ? `Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
- Domain analysis: ${mainDomain ? "checked" : "no domain detected"}
- URL structure: checked
- Suspicious phrases: ${signals.length ? "found" : "not obvious"}
- ScamScouter rules: checked

Semnale detectate:
${list}

Explicație:
ScamScouter a analizat linkul sau mesajul introdus folosind reguli anti-scam, structură URL, cuvinte suspecte și semnale de imitare brand.

Sfaturi:
Nu introduce parole, date de card sau coduri de verificare pe linkuri suspecte. Dacă mesajul cere plată urgentă, verifică manual compania prin site-ul oficial.`
      : `Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
- Domain analysis: ${mainDomain ? "checked" : "no domain detected"}
- URL structure: checked
- Suspicious phrases: ${signals.length ? "found" : "not obvious"}
- ScamScouter rules: checked

Detected signals:
${list}

Explanation:
ScamScouter analyzed the submitted link or message using anti-scam rules, URL structure, suspicious wording and brand impersonation signals.

Safety advice:
Do not enter passwords, card numbers or verification codes on suspicious links. If the message asks for urgent payment, verify the company through its official website.`;

    return res.status(200).json({
      ok: true,
      verdict,
      score,
      result,
      remaining: "unlimited",
      domain: mainDomain,
      signals
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return res.status(500).json({ ok: false, error: "Scan failed on server. Please try again." });
  }
}
