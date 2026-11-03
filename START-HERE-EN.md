# BurDA on Supabase
Project: BurDA (opveixqksyrgxlskjrqx). Firebase credentials do not transfer.

1. In Authentication → Users → Add user → Create new user, create the office manager's account with the designated email and their chosen password. Only auto-confirm an email whose ownership you have verified.
2. On the designated manager's first verified office request, the server consumes the private administrator reservation and creates their profile. All other accounts need an explicit profile. In public.users, id references the Auth UUID; name, job_title, role and active determine the profile. Roles: admin, reviewer, viewer, ambassador.
3. Create staff identities in Authentication, then assign profiles from Platform administration. Link ambassadors to an active ambassador record. Never store passwords in public.users.
4. Publish GitHub Pages from main, /(root). Set Authentication → URL Configuration → Site URL to the published site and allow the password-reset redirect ending in /BurDA/?recover=1.
5. Test the manager and a read-only account before entering official records. Legacy Firebase data and accounts are not automatically imported. The private evidence bucket is accessible only via the authorized office function.
