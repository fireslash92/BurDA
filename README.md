# Buraimi Digital Ambassadors
Arabic RTL performance dashboard for the Governor's Office. The root opens a staff login. The dashboard requires a verified Firebase email/password account and office membership. It uses a role-checked Cloud Function, Firestore and private evidence files in Cloud Storage.

See [دليل تفعيل Firebase](START-HERE-AR.md) before using the office register. Publishing GitHub files does not deploy Firebase services. The Firebase web configuration is public; the backend requires verified identities and explicit membership. Analytics is not initialized.

The root contains the built site. Edit src/ and public/, install the root npm dependencies, then run node build.mjs and copy dist/ to the repository root. The functions/ directory contains a standalone Node 22 backend. Its bundled service.mjs is compiled from service.ts and domain.ts using esbuild (bundle, platform=node, format=esm, external:zod and ./transaction.mjs). Run node --test backend.test.mjs inside functions/ after installing its dependencies.

Designed for a small office: the transaction adapter materializes the office collections for validation in memory and persists changed rows atomically. Reads grow with the office dataset; measure Firestore reads and latency before scaling up.
