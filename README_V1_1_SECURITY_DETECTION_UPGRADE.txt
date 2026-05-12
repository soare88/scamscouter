# ScamScouter v1.1 Security & Detection Upgrade

Upload these files to the root of your GitHub repository:

- app.js
- package.json
- api/scan.js

What this update does:
1. Makes the scanner stricter:
   - known trusted domains can be safe
   - unknown domains become Use Caution
   - crypto / investment / exchange domains become higher risk
   - known suspicious domains become High Risk

2. Adds safer result rendering:
   - scan result text is inserted with textContent instead of raw innerHTML
   - this reduces risk from suspicious user-submitted content

3. Adds report functionality:
   - after a scan, users can click "Report this site"
   - reports are saved in Firestore collection: scamReports
   - reports are saved with approved: false for moderation

4. Keeps SEO/design stable:
   - no URL changes
   - no sitemap changes
   - no homepage redesign

Test after deployment:
- google.com should be safe
- www.olx.ro should be safe
- okrex.org should be high risk
- paypal-login-security.xyz should be high risk
- random-new-domain.com should be Use Caution, not Safe
