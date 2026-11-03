# BurDA activation guide: Buraimi Governorate Office

This guide connects the office dashboard to Firebase project `buraimidta`. The sign-in page uses email and password. There is no guest access. Creating a login establishes a user's identity; office membership determines what that user can do.

## 1. Enable email and password sign-in

Open the [Firebase console](https://console.firebase.google.com/project/buraimidta/authentication/providers). Under **Authentication → Sign-in method**, enable **Email/Password**. Under **Authentication → Settings → Authorized domains**, add `fireslash92.github.io` (the hostname only).

## 2. Prepare the database and file storage

Create the default **Cloud Firestore** database in production mode. Set up **Cloud Storage** with the bucket `buraimidta.firebasestorage.app`. Choose a data location suitable for the office and review billing requirements for Functions and Storage before enabling them.

## 3. Identify the office administrator and publish the sign-in page

In **Authentication → Users**, select the manager's existing account or choose **Add user** to create one with a real email address and password. Copy its **User UID**. This is the identifier you will use during deployment; the email address is not a substitute.

In the [GitHub repository](https://github.com/fireslash92/BurDA), open **Settings → Pages**. Choose **Deploy from a branch**, then **main** and **/(root)**, and save. Open the published URL displayed by GitHub. Publishing the page does not deploy the Firebase backend.

## 4. Deploy the office backend

From the repository root, using a current Node.js 22 release and the Firebase CLI, run:

```sh
firebase login
cd functions
npm install
node --test backend.test.mjs
cd ..
firebase deploy --only functions:office --project buraimidta
```

When prompted for `BURDA_OWNER_UID`, enter the administrator's **User UID** from step 3. The backend runs in `us-central1`. If you change the region, update the service URL in `src/lib/cloud.ts`, rebuild the frontend and publish the updated files.

## 5. Deploy and check access rules

If this Firebase project is dedicated to BurDA, review the included rules and deploy them:

```sh
firebase deploy --only firestore:rules,storage --project buraimidta
```

If other apps share the project, merge the BurDA rules into the existing rules before deployment. Check that no broader rule grants direct access to `burdaOffice` or `burda-evidence`. The office backend checks identity and role before it reads or writes records. Test that a signed-in nonmember cannot read office data.

## 6. Sign in and add staff

Sign in with the manager's email and the password set in Firebase Authentication. If prompted, select **إرسال رابط التأكيد** (Send verification link), open the link in your email, then select **أكّدت بريدي، متابعة** (I verified my email, continue). On the first successful dashboard load, the backend creates the manager's membership with the `admin` role.

For each staff member, create their login in **Firebase Authentication → Users**. Then, in BurDA, open **إدارة المنصة** (Platform administration) and add the same email, display name and role. For an ambassador, create an ambassador profile and link it to the member. Passwords belong only in Firebase Authentication, never in Firestore. Test with a second account and a sample attachment before entering office records.

**If you already added your email but cannot sign in:** If the password is rejected, use **نسيت كلمة المرور؟** (Forgot password?) on the sign-in page. If you reach email verification, your credentials were accepted. If you verify the email but the dashboard still does not open, check the backend deployment and confirm that `BURDA_OWNER_UID` matches the UID of the account you used.

[Arabic version](START-HERE-AR.md)
