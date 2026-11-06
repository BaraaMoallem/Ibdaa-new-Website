# IBDAA digital case intake — setup and operating guide

## Status

The website, backend, and Apps Script source are implemented with support for direct dental file uploads (STL, PLY, OBJ, ZIP, PDF, JPG, PNG), Google Drive folder organization (`Ibdaa website`), and automated 1-click printable Job Ticket PDF generation.

Flow: `/send-case` or `/ar/send-case` → same-origin `POST /api/cases` → signed HTTPS request to Apps Script → saves attachments and creates PDF in Google Drive folder `Ibdaa website` → `FormApp.createResponse().withItemResponse(...).submit()` → Google's linked response spreadsheet with direct links to download attachments and print the job ticket.

The confirmation means Google Forms returned a response ID. It does **not** mean the laboratory accepted the case, started work, or that Google has already finished synchronizing the Sheet. Verify the linked Sheet separately during commissioning.

## 1. Prepare an IBDAA-owned account

Use an organization-controlled Google account with MFA and recovery arrangements. Decide which staff can access case information. Do not use a developer's personal account for production. Use synthetic data during setup.

Create a **blank Google Form** at [Google Forms](https://forms.google.com). Delete its initial untitled question, so there are no questions. Do not link a spreadsheet yet. Copy the Form ID from its **editor** URL:

`https://docs.google.com/forms/d/FORM_ID/edit`

The ID is not the public `/d/e/...` responder ID.

## 2. Open Apps Script and add the source

At [Apps Script](https://script.google.com), create a standalone project owned by IBDAA. Name it “IBDAA case intake”. Paste the entire contents of [Code.gs](integrations/google-apps-script/Code.gs) into `Code.gs`. Use the V8 runtime.

In **Project Settings → Script properties**, add:

- `FORM_ID`: the editor Form ID.
- `SHARED_SECRET`: a unique cryptographically random value, at least 32 bytes. Generate it in a password manager or locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Save it securely; do not paste it into Git, source files, chat, or screenshots.

Run `setupNewForm` from the editor and authorize the requested Forms/Sheets/Drive permissions as the owner. This one-time helper:

1. Adds all questions with stable IDs.
2. Creates a spreadsheet named “IBDAA Dental Lab — Cases”.
3. Links the Form to that spreadsheet using the supported Forms service.
4. Creates `_SubmissionLedger` and `Internal workflow` tabs.
5. Initializes the `"Ibdaa website"` root folder in Google Drive.
6. Saves `SHEET_ID` and the `ITEM_IDS` mapping in Script Properties (`FORM_SCHEMA_VERSION=3`).

It refuses to run against a nonempty or already configured Form. If setup fails partway through, inspect the created resources before retrying; do not delete production questions or run setup on a live Form.

## 3. Review the required questions and Sheet

The setup creates these question titles:

- Submission ID; Case reference; Submission timestamp (UTC); Language.
- Dentist name; Clinic name; Phone number; Email.
- Anonymized patient reference; Patient age; Patient sex.
- Quantity (computed from configured teeth; no independent quantity input).
- Tooth restoration summary; Tooth configurations JSON.
- Requested next step; Special instructions; Selected teeth (FDI).
- Case Drive Folder; Print Job Ticket (PDF); Attached files; Cloud link.
- Privacy acknowledgment.

Submission ID, reference, timestamp, language, dentist, phone, patient reference, quantity, selected teeth, both structured restoration fields, and acknowledgment are required. The file, cloud link, and Drive links are populated automatically.

### File Attachments & Google Drive Storage

- When a doctor attaches files (e.g. 3D intraoral scans `.stl`/`.ply`/`.zip`, clinical photos, or prescription PDFs), Apps Script creates a subfolder inside Google Drive's **`Ibdaa website`** folder named:
  `[Case Reference] — [Dentist Name] — [Patient Reference]`
- Uploaded files are saved into this subfolder.
- A dental-lab-standard **Printable Job Ticket PDF** is automatically compiled and saved in that subfolder.
- The linked Google Sheet receives two direct, clickable columns:
  - **`Case Drive Folder`**: Click to open/download all files from Google Drive.
  - **`Print Job Ticket (PDF)`**: Click to open the ready-to-print 1-page PDF job ticket (`Ctrl + P`).

### Upgrade an existing Google Form (from Schema v1 or v2)

If you have already run an earlier setup, **do not run `setupNewForm` again**:

1. Replace `Code.gs` in your Apps Script project with the updated source from [integrations/google-apps-script/Code.gs](integrations/google-apps-script/Code.gs).
2. In the Apps Script editor, run **`upgradeFormToV3`** and authorize any additional Google Drive permissions.
3. It will safely add the new questions (`Case Drive Folder`, `Print Job Ticket (PDF)`, `Attached files`, `Cloud link`), create the `"Ibdaa website"` Drive folder, and bump `FORM_SCHEMA_VERSION` to `3`.
4. Deploy a **new Apps Script version**: **Deploy → Manage deployments → Edit → New version → Deploy**.

### Internal office fields

`Internal workflow` has Case reference, Office notes, Internal next step, Processing notes. Staff enter the received reference here and maintain internal information separately from dentist answers.

## 4. Deploy the web app

In Apps Script choose **Deploy → New deployment → Web app**:

- Execute as: **Me** (the IBDAA owner who authorized Forms/Sheets/Drive access).
- Who has access: **Anyone**, including users without a Google login.
- Deploy and copy the HTTPS `/exec` URL.

The endpoint is publicly reachable, but every write must have a valid timestamped HMAC signed with the server-only secret.

After changing Apps Script code, use **Manage deployments → Edit → New version → Deploy**. Saving editor changes alone does not update `/exec`.

## 5. Configure Next.js / Vercel

Copy `.env.example` to `.env.local` for local development. Set:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-real-domain.example
CASE_ALLOWED_ORIGIN=http://localhost:3000
GOOGLE_CASE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_CASE_SHARED_SECRET=YOUR_RANDOM_SECRET
```

The last value must exactly match `SHARED_SECRET` in Script Properties. None of the `GOOGLE_CASE_*` variables may have a `NEXT_PUBLIC_` prefix.

## 6. Testing

Run automated tests:
```bash
npm run test:cases
```
All 11 tests check per-tooth validation, file attachments, external cloud links, Google Drive subfolder creation, and automated PDF job ticket generation using local test doubles.
