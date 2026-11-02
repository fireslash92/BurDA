# Buraimi Digital Ambassadors — GitHub Pages demo

This package is a standalone demo of the Arabic performance dashboard.
It is ready for manual upload. No server, ChatGPT account or build command is required to publish the included files.

## Manual upload

1. Extract Buraimi-Ambassadors-GitHub-Pages-v1.zip.
2. Upload the extracted contents to the root of your GitHub repository. index.html must be at the root, beside assets, fonts and styles.css. Do not upload the ZIP itself or put the files inside another folder.
3. In the repository open Settings → Pages.
4. Select Deploy from a branch, then main and /(root), and Save.
5. Open the published URL shown by GitHub Pages.

GitHub Free supports Pages from public repositories. Pages from a private repository requires an eligible paid plan. The published demo is publicly viewable. It contains synthetic data only.
Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## What works now

- Arabic RTL dashboard, ambassador profiles and period/region/organization filters.
- Simulated achievement forms, review and approval, indicators, targets and roles.
- CSV export and a browser print layout for saving a PDF.
- All assets are local; no CDN or external API is required.
- Relative paths allow the app to run under a repository subfolder.

## Firebase is a later step

This is DEMO-ONLY. Changes are held in memory and disappear when the page is reloaded.
There is no real authentication, shared database or actual evidence-file upload in this package.
The mock roles do not provide access control and must not be used for official records.

When you have created the Firebase project, we will connect Firebase Authentication, Firestore and file storage, implement the permissions and deploy/test their rules.
firebase-config.example.json is a configuration reference only. Filling it alone does not activate integration.
Do not upload service-account private keys or real ambassador records to GitHub.

## Source and rebuilding

The prebuilt files are at the top level. Editable source is in src, and source assets are in public.
To rebuild after a code change, use Node.js 22 or later, run npm install, then npm run check and npm run build. The output is in dist; copy its contents to the repository root when publishing manually.
The previous full server-based source remains a separate archive; this package replaces it for the manual Pages publishing step.
