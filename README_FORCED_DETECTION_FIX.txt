# ScamScouter Forced Detection Fix v1.1.1

Upload these files to your repo root:

- api/scan.js
- package.json

Important:
Make sure api/scan.js replaces the file at exactly:
api/scan.js

Do not upload the whole ZIP as a file.
Do not create api/api/scan.js.

After Vercel deploys, scan okrex.org.
The result must show:
ScamScouter Detection Engine v1.1.1

Expected:
okrex.org -> High Risk, score around 95/100.
