const ENGINE_VERSION = "ScamScouter Detection Engine v1.2 Image Upload";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      version: ENGINE_VERSION,
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const text = String((req.body && req.body.text) || "").trim();
    const language = String((req.body && req.body.language) || "en").toLowerCase();
    const image = req.body && req.body.image ? req.body.image : null;

    if (!text && !image) {
      return res.status(400).json({
        ok: false,
        version: ENGINE_VERSION,
        error: "No text or image provided."
      });
    }


    let imageAnalysis = "";
    let imageExtractedText = "";

    if (image && image.base64 && image.mimeType && process.env.GEMINI_API_KEY) {
      try {
        const isRoImage = language.startsWith("ro");
        const imagePrompt = isRoImage
          ? "Analizează această poză/screenshot pentru semne de scam, phishing, linkuri suspecte, mesaje false, plăți, crypto, curier, bancă sau marketplace. Extrage textul vizibil important. Răspunde scurt în română cu: Text observat, Semnale de risc, Recomandare."
          : "Analyze this photo/screenshot for scam, phishing, suspicious links, fake messages, payments, crypto, delivery, banking or marketplace fraud. Extract the important visible text. Reply briefly in English with: Observed text, Risk signals, Recommendation.";

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: imagePrompt },
                    {
                      inline_data: {
                        mime_type: image.mimeType,
                        data: image.base64
                      }
                    }
                  ]
                }
              ]
            })
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          imageAnalysis =
            geminiData &&
            geminiData.candidates &&
            geminiData.candidates[0] &&
            geminiData.candidates[0].content &&
            geminiData.candidates[0].content.parts &&
            geminiData.candidates[0].content.parts[0] &&
            geminiData.candidates[0].content.parts[0].text
              ? geminiData.candidates[0].content.parts[0].text
              : "";

          imageExtractedText = imageAnalysis;
        }
      } catch (e) {
        imageAnalysis = "";
        imageExtractedText = "";
      }
    }

    const combinedText = [text, imageExtractedText].filter(Boolean).join("\n\n");
    const lower = combinedText.toLowerCase();

    const signals = [];
    let score = 20;

    let hasUnknownDomain = false;
    let hasTrustedDomain = false;
    let hasKnownRisk = false;
    let hasCryptoRisk = false;
    let hasBrandImpersonation = false;

    const trustedDomains = [
      "google.com",
      "apple.com",
      "microsoft.com",
      "amazon.com",
      "paypal.com",
      "revolut.com",
      "wise.com",
      "emag.ro",
      "altex.ro",
      "f64.ro",
      "dhl.com",
      "fan-courier.ro",
      "anaf.ro",
      "olx.ro",
      "facebook.com",
      "instagram.com",
      "linkedin.com",
      "github.com",
      "youtube.com",
      "x.com",
      "twitter.com"
    ];

    const knownHighRiskDomains = [
      "okrex.org",
      "okrex.com",
      "okred.com",
      "paypal-login-security.xyz",
      "login-paypal-security.xyz",
      "support-paypal-verification.xyz",
      "claim-airdrop-wallet.com",
      "walletconnect-verify.net",
      "metamask-restore.com",
      "binance-reward.com"
    ];

    const riskyTlds = [
      ".top",
      ".xyz",
      ".click",
      ".shop",
      ".buzz",
      ".live",
      ".monster",
      ".cam",
      ".icu",
      ".quest",
      ".mom",
      ".bond",
      ".cyou",
      ".rest",
      ".sbs"
    ];

    const shorteners = [
      "bit.ly",
      "tinyurl.com",
      "t.co",
      "goo.gl",
      "cutt.ly",
      "is.gd",
      "ow.ly",
      "rebrand.ly",
      "s.id",
      "lnkd.in"
    ];

    const protectedBrands = [
      "paypal",
      "google",
      "apple",
      "microsoft",
      "amazon",
      "dhl",
      "olx",
      "fan",
      "anaf",
      "binance",
      "coinbase",
      "kraken",
      "okx",
      "okex",
      "bybit",
      "kucoin",
      "metamask",
      "trustwallet",
      "revolut",
      "wise"
    ];

    const cryptoWords = [
      "crypto",
      "coin",
      "token",
      "wallet",
      "swap",
      "staking",
      "stake",
      "trading",
      "trade",
      "exchange",
      "forex",
      "mining",
      "defi",
      "invest",
      "profit",
      "yield",
      "airdrop",
      "web3",
      "okrex",
      "okred"
    ];

    const scamPhrases = [
      "urgent",
      "verify now",
      "account suspended",
      "blocked account",
      "delivery fee",
      "claim reward",
      "free gift",
      "confirm payment",
      "wallet verification",
      "seed phrase",
      "private key",
      "security code",
      "limited time",
      "guaranteed profit",
      "guaranteed return",
      "withdrawal fee",
      "tax payment",
      "unlock funds",
      "click here to verify",
      "your account will be closed",
      "cod de verificare",
      "cont blocat",
      "plata colet",
      "taxa livrare",
      "taxă livrare",
      "premiu",
      "castigat",
      "câștigat",
      "confirmă plata",
      "card bancar",
      "date card",
      "profit garantat",
      "taxă retragere",
      "deblochează fonduri",
      "contul va fi inchis",
      "contul va fi închis"
    ];

    function addSignal(message, weight) {
      signals.push(message);
      score += weight;
    }

    function extractUrls(input) {
      return input.match(/https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi) || [];
    }

    function domainFromUrl(raw) {
      try {
        const clean = raw.replace(/[),.;\]}>]+$/g, "");
        const url = new URL(clean.startsWith("http") ? clean : "https://" + clean);
        return url.hostname.replace(/^www\./, "").toLowerCase();
      } catch (e) {
        return "";
      }
    }

    function isSubdomainOrExact(domain, root) {
      return domain === root || domain.endsWith("." + root);
    }

    function domainLabel(domain) {
      return domain.split(".")[0] || domain;
    }

    const urls = extractUrls(combinedText);
    const domains = [...new Set(urls.map(domainFromUrl).filter(Boolean))];
    const mainDomain = domains[0] || null;

    if (!urls.length && combinedText.length > 25) {
      addSignal("Message text was analyzed without a clear URL. Treat unknown messages with caution.", 12);
    }

    for (const domain of domains) {
      const label = domainLabel(domain);
      const isTrusted = trustedDomains.some((safe) => isSubdomainOrExact(domain, safe));

      if (isTrusted) {
        hasTrustedDomain = true;
        score -= 30;
        signals.push("Trusted official domain detected: " + domain);
      } else {
        hasUnknownDomain = true;
        addSignal("Unknown or unverified domain. ScamScouter does not mark unknown domains as fully safe: " + domain, 25);
      }

      if (knownHighRiskDomains.some((bad) => isSubdomainOrExact(domain, bad))) {
        hasKnownRisk = true;
        addSignal("Known high-risk or reported suspicious domain detected: " + domain, 90);
      }

      if (riskyTlds.some((tld) => domain.endsWith(tld))) {
        addSignal("Higher-risk domain extension detected: " + domain, 24);
      }

      if (shorteners.some((short) => isSubdomainOrExact(domain, short))) {
        addSignal("URL shortener detected. Destination may be hidden: " + domain, 24);
      }

      for (const brand of protectedBrands) {
        const trustedBrandDomain = trustedDomains.some((safe) => isSubdomainOrExact(domain, safe) && domain.includes(brand));

        if (label.includes(brand) && !trustedBrandDomain) {
          hasBrandImpersonation = true;
          addSignal("Possible brand impersonation or clone pattern detected: " + brand, 35);
        }
      }

      for (const word of cryptoWords) {
        if ((label.includes(word) || domain.includes(word)) && !isTrusted) {
          hasCryptoRisk = true;
          addSignal("Crypto / investment / trading related domain pattern detected: " + word, 35);
          break;
        }
      }

      if (label.length <= 5 && !isTrusted) {
        addSignal("Short unknown domain name. Manual verification recommended.", 10);
      }

      if (/\d{2,}/.test(label) && !isTrusted) {
        addSignal("Numbers detected in unknown domain label.", 10);
      }
    }

    if (image && image.base64) {
      signals.push("Image/screenshot uploaded and analyzed.");
      if (!process.env.GEMINI_API_KEY) {
        addSignal("Image upload received, but AI image analysis is not enabled on the server.", 5);
      }
      if (imageAnalysis) {
        addSignal("AI image analysis completed. Review extracted text and risk signals below.", 10);
      }
    }

    for (const phrase of scamPhrases) {
      if (lower.includes(phrase)) {
        addSignal('Suspicious phrase detected: "' + phrase + '"', 12);
      }
    }

    if (lower.includes("http://")) {
      addSignal("Non-HTTPS link detected.", 12);
    }

    if (
      lower.includes("password") ||
      lower.includes("parola") ||
      lower.includes("card") ||
      lower.includes("cod") ||
      lower.includes("security code") ||
      lower.includes("seed phrase") ||
      lower.includes("private key")
    ) {
      addSignal("Message may ask for sensitive information.", 18);
    }

    // Strict safety policy.
    // Unknown domains cannot be Safe.
    // Known high risk domains are High Risk.
    if (hasUnknownDomain && score < 40) score = 40;
    if (hasCryptoRisk && score < 70) score = 70;
    if (hasBrandImpersonation && score < 75) score = 75;
    if (hasKnownRisk && score < 95) score = 95;

    if (
      hasTrustedDomain &&
      !hasUnknownDomain &&
      !hasKnownRisk &&
      !hasCryptoRisk &&
      !hasBrandImpersonation &&
      signals.length <= 1
    ) {
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

    const isRo = language.startsWith("ro");

    const signalList = signals.length
      ? signals.map((s) => "- " + s).join("\n")
      : (isRo ? "- Nu au fost detectate semnale majore automat." : "- No major automated red flags detected.");

    const checksList = [
      mainDomain ? "Domain analysis: checked" : "Domain analysis: no domain detected",
      "Unknown domain policy: checked",
      "Known high-risk list: checked",
      "Crypto / investment patterns: checked",
      "Brand impersonation patterns: checked",
      "URL structure: checked",
      "ScamScouter engine: " + ENGINE_VERSION
    ].map((s) => "- " + s).join("\n");

    const result = isRo
      ? `${ENGINE_VERSION}

Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
${checksList}

Semnale detectate:
${signalList}

Explicație:
ScamScouter nu marchează domeniile necunoscute ca fiind complet sigure. Domeniile necunoscute primesc cel puțin Atenție. Domeniile crypto/investment/trading sau cele raportate primesc risc ridicat.

Sfaturi:
Nu introduce parole, date de card, coduri de verificare, seed phrase sau private key. Dacă site-ul promite profit, trading, crypto exchange sau cere taxe pentru retragere, tratează-l ca risc ridicat până este verificat din surse oficiale.`
      : `${ENGINE_VERSION}

Verdict: ${verdict}
Risk score: ${score}/100

Security checks:
${checksList}

Detected signals:
${signalList}

Explanation:
ScamScouter does not mark unknown domains as fully safe. Unknown domains receive at least Use Caution. Crypto/investment/trading patterns and reported suspicious domains receive a higher risk score.

Safety advice:
Do not enter passwords, card numbers, verification codes, seed phrases or private keys. If a site promises profit, trading, crypto exchange access, or asks for withdrawal fees, treat it as high risk until verified through official sources.`;

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
    return res.status(500).json({
      ok: false,
      version: ENGINE_VERSION,
      error: "Scan failed on server. Please try again."
    });
  }
}
