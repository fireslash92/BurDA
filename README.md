# BurDA | Buraimi Digital Ambassadors
Arabic staff dashboard for the Buraimi Governorate Office. Supabase Auth handles email/password; public.users stores each person's name, job title and role under their Auth UUID. Office records are relational PostgreSQL tables in the private burda schema. The office Edge Function verifies the user's token, reads their current profile and applies the office workflow; evidence uses a private Storage bucket.

[دليل التشغيل](START-HERE-AR.md) · [English setup](START-HERE-EN.md)

The repository root is the built GitHub Pages site. To rebuild, install root npm dependencies, run node build.mjs and copy dist/ to the repository root. Database and function source live in supabase/.
