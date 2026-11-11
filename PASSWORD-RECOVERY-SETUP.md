# Password recovery for BurDA

Production address: https://fireslash92.github.io/BurDA/

In Supabase project `BurDA`, open **Authentication → URL Configuration**:

- **Site URL**: `https://fireslash92.github.io/BurDA/`
- **Redirect URLs**: add the exact URL `https://fireslash92.github.io/BurDA/?recover=1`
- Save both sections. Preserve unrelated allowed URLs. Do not add a broad wildcard.

In **Authentication → Emails → Reset password**, retain a link using `{{ .ConfirmationURL }}`. If the template is customized, ensure it does not hardcode localhost or discard the requested redirect.

Request a new recovery email after saving configuration. Previous, expired or already-used links cannot be repaired by a frontend change. Do not forward a recovery link or token to support.

The app keeps password recovery separate from the dashboard, validates confirmation, offers show/hide, shows success, and offers a new link when recovery fails. The client explicitly targets the production URL. Source and prebuilt root assets must be published together for GitHub Pages.

Verification: `npm ci`, `npm run check`, `npm run build`, `node tests/recovery.mjs`. The tests mock Auth and do not send emails or change real users' passwords. Complete one end-to-end test using a fresh email link and a designated user account before considering the configuration verified.
