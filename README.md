# ScamScouter Core Detection v1.3 OCR + Phone

This is the next major product update after index stabilization.

Included:
- Browser OCR for screenshots/photos using Tesseract.js
- No Gemini cost for Free image checks
- One image upload button: Choose screenshot/photo / Alege poză/screenshot
- OCR text is extracted in the user's browser and inserted into the scan box
- Phone number detection in api/scan.js
- Email detection in api/scan.js
- Small stable API file
- Official www indexing preserved:
  https://www.scamscouter.com/
- sitemap.xml and robots.txt stay on www
- Header logo SVG and favicon included

Important:
1. Upload all files directly into the root of your GitHub repo.
2. Do not upload the ZIP itself.
3. Do not upload the parent folder.
4. Keep api/scan.js exactly inside api/scan.js.
5. If analytics.html contains G-XXXXXXXXXX, replace it with your real Google Analytics Measurement ID.
6. After Vercel deploys, hard refresh with Ctrl + Shift + R.

Test:
- Open https://www.scamscouter.com/api/scan
  It should show: ScamScouter Detection Engine v1.3 OCR + Phone
- Upload a screenshot from your phone.
- The extracted text should appear in the text box.
- Press Scan Now.
