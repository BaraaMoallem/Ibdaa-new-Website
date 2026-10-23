# IBDAA digital case intake — setup and operating guide

## Status

The website, backend and Apps Script source are implemented. **No live Google Form response or Sheet row has been verified yet.** An IBDAA owner must complete the setup below. Missing configuration fails closed; the website never substitutes a demo success.

Flow: `/send-case` or `/ar/send-case` → same-origin `POST /api/cases` → signed HTTPS request to Apps Script → `FormApp.createResponse().withItemResponse(...).submit()` → Google's linked response spreadsheet.

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

Run `setupNewForm` from the editor and authorize the requested Forms/Sheets permissions as the owner. This one-time helper:

1. Adds all questions with stable IDs.
2. Creates a spreadsheet named “IBDAA Dental Lab — Cases”.
3. Links the Form to that spreadsheet using the supported Forms service.
4. Creates `_SubmissionLedger` and `Internal workflow` tabs.
5. Saves `SHEET_ID` and the `ITEM_IDS` mapping in Script Properties.

It refuses to run against a nonempty or already configured Form. If setup fails partway through, inspect the created resources before retrying; do not delete production questions or run setup on a live Form.

## 3. Review the required questions and Sheet

The setup creates these exact question titles. They are **Short answer**, except “Special instructions”, “Tooth restoration summary” and “Tooth configurations JSON”, which are **Paragraph**. Typed controls and dropdowns live on the website; both backends validate their values independently.

- Submission ID; Case reference; Submission timestamp (UTC); Language.
- Dentist name; Clinic name; Phone number; Email.
- Anonymized patient reference; Patient age; Patient sex.
- Quantity (computed from configured teeth; no independent quantity input).
- Tooth restoration summary; Tooth configurations JSON.
- Requested next step; Special instructions; Selected teeth (FDI).
- Privacy acknowledgment.

Submission ID, reference, timestamp, language, dentist, phone, patient reference, quantity, selected teeth, both structured restoration fields, and acknowledgment are required. The other questions are optional. The helper stores `FORM_SCHEMA_VERSION=2` in Script Properties.

### Per-tooth storage and quantity

Each selected tooth has its own material, optional custom material name, shade and notes. The Form stores the association together in **two dedicated fields**, never as unrelated material/shade lists:

```text
Tooth 11 — E.max — BL1
Tooth 12 — E.max — BL1
Tooth 21 — Zirconia — A1 — Notes: Instructions for tooth 21
Tooth 22 — Veneers — B1
```

The JSON field contains the same canonical, numerically sorted records, for example:

```json
{"schemaVersion":2,"teeth":[{"toothNumber":"11","material":"emax","otherMaterial":"","shade":"BL1","notes":""},{"toothNumber":"21","material":"zirconia","otherMaterial":"","shade":"A1","notes":"Instructions for tooth 21"}]}
```

JSON preserves multiline notes exactly; the readable summary renders line breaks within a field as `↵` to keep one tooth per line. Both fields must appear as corresponding columns in the linked response Sheet. Material IDs are stable English identifiers, while the website labels are localized. A custom material uses `material: "other"` plus `otherMaterial`.

The client never supplies an authoritative quantity. Apps Script derives `Quantity` from the validated array length. The v2 schema permits exactly one restoration record per permanent tooth; duplicate FDI numbers and old case-wide material/shade/quantity fields are rejected. Notes are limited to 300 characters per tooth, shades to 60, and custom material names to 120. Future multiple-unit or appliance workflows require an explicit schema extension and coordinated validation, UI and integration changes.

### Upgrade an existing Google Form from the first implementation

If you have already run the previous setup, **do not run `setupNewForm` again**:

1. Temporarily pause online intake (for example, remove `GOOGLE_CASE_SCRIPT_URL` from the website environment and redeploy so it reports unavailable). Resolve any pending old submissions before changing the website/deployment, because v1 case-wide payloads are not accepted by v2. Keep the existing ledger and responses.
2. Replace `Code.gs` with the updated source while retaining the existing `FORM_ID`, `SHEET_ID`, `ITEM_IDS` and `SHARED_SECRET` properties.
3. Run **`upgradePerToothForm`** in the editor as the owner. It adds the two new Paragraph questions and mappings and sets `FORM_SCHEMA_VERSION` to `2`.
4. The helper makes the old Restoration type, Other material and Shade / color questions optional. It leaves their historical responses and Sheet columns intact; new submissions do not fill these obsolete case-wide fields.
5. Verify the new questions and linked Sheet columns, deploy a **new Apps Script version**, then deploy the updated website with the integration URL restored. Keep the Form response destination unchanged.
6. Submit a synthetic mixed-material case and verify both new fields in the Form **and** linked Sheet before considering the upgrade complete.

The helper can be rerun to finish an interrupted upgrade. It does not delete historical questions or responses. Do not manually rename/reorder ledger columns or overwrite `ITEM_IDS` with guessed IDs.

In the Form's **Responses** tab, open the linked spreadsheet and confirm the response tab exists. The setup already links it. If linking manually, use **Responses → Link to Sheets**, select the intended spreadsheet, set `SHEET_ID`, and create the ledger headers exactly as specified in `LEDGER_HEADERS` in the script. Do not change item types or replace questions without updating `ITEM_IDS`.

Keep “Limit to 1 response” OFF; Google documents that it prevents script submissions when enabled. Turn off response editing, respondent email collection, and respondent access to summaries. Do not add uploads, quizzes, required login/email collection, extra required questions or Google-side validation without retesting script submission. If your Form UI requires publishing/accepting responses, configure it and verify submission with synthetic data. Do not share a respondent URL with dentists; use the website.

Keep the Form, response Sheet, ledger and script editor access restricted to authorized IBDAA staff. The web-app access setting below does not make these files public. The Form's respondent access settings are separate: do not publish response summaries or expose case information. Form responses created outside the integration will not have a matching ledger entry and should not be treated as verified website submissions.

### Internal office fields

`Internal workflow` has Case reference, Office notes, Internal next step, Processing notes. Staff enter the received reference here and maintain internal information separately from dentist answers. You may add optional internal columns to this tab. Do not insert/delete/reorder ledger columns or sort its ranges while the integration is writing. No staff dashboard is included.

### Requested next step

No workflow options have been invented. The website hides this optional selector until IBDAA approves choices. Add `{ id, en, ar }` choices to `requestedNextSteps` in `src/lib/case-validation.ts` and exactly matching IDs to `NEXT_STEPS` in `Code.gs`. Redeploy both. The Google question already exists.

## 4. Deploy the web app

In Apps Script choose **Deploy → New deployment → Web app**:

- Execute as: **Me** (the IBDAA owner who authorized Forms/Sheets access).
- Who has access: **Anyone**, including users without a Google login.
- Deploy and copy the HTTPS `/exec` URL.

“Anyone with a Google account”, organization-only access and “execute as user accessing” are not interchangeable with anonymous backend access. The Next.js server has no Google browser session. If organizational policy disallows anonymous Apps Script web apps, **this deployment architecture is blocked**. Do not weaken file sharing or pretend it works. Have the Workspace administrator approve an appropriate deployment, or design an authenticated Google-hosted relay with IAM/OAuth separately.

The endpoint is publicly reachable, but every write must have a valid timestamped HMAC signed with the server-only secret. A normal browser GET only returns `post_required`. This is not a health check proving Forms access. Never put the secret in a URL.

After changing Apps Script code, use **Manage deployments → Edit → New version → Deploy**. Saving editor changes alone does not update `/exec`. Keep only the needed deployment active; retire old deployments when rotating credentials.

## 5. Configure Next.js / Vercel

Copy `.env.example` to `.env.local` for local development (already Git-ignored). Set:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-real-domain.example
CASE_ALLOWED_ORIGIN=http://localhost:3000
GOOGLE_CASE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_CASE_SHARED_SECRET=YOUR_RANDOM_SECRET
```

The last value must exactly match `SHARED_SECRET` in Script Properties. **None of the `GOOGLE_CASE_*` variables may have a `NEXT_PUBLIC_` prefix.** Restart the local server after changes.

In Vercel's project environment settings, set the same variables, but set `CASE_ALLOWED_ORIGIN` to the exact public **HTTPS** origin (no path). Use separate Google resources, secrets and origin for staging. Redeploy. HTTPS origin configuration is mandatory in production, including `next start`; for a local production-build smoke test, use HTTPS or expect submission to fail closed.

The Node route allows 60 seconds and uses a 35-second upstream timeout. Ensure your hosting plan supports that duration. Google ContentService redirects responses to `script.googleusercontent.com`; the backend follows redirects. Google login pages, HTML errors, non-JSON responses, timeouts and missing response IDs are failures, even when HTTP status is 200.

## 6. Security and retry behavior

- The browser sends only to the same-origin API. No Google credentials or payloads are exposed in URLs.
- The API enforces JSON, a streaming 80 KB body limit (supporting all 32 teeth including Arabic notes), exact origin, field limits, enum/range validation and consent. Production origin must be HTTPS.
- Apps Script checks the HMAC, a five-minute freshness window, schema and all field rules independently. Signatures are in the JSON body because Apps Script's documented request event does not offer a general arbitrary-header authentication interface.
- Both layers remove/reject control characters. React renders text without HTML injection. The integration prefixes formula-leading text before it reaches Forms/Sheets to reduce spreadsheet/CSV formula injection.
- A per-process throttle rejects excessive API attempts. This is **not** a distributed edge limiter. The locked ledger additionally enforces 10 new cases per normalized contact number per 15 minutes and 200 globally per hour. Existing retries are checked before these Google-side limits.
- Before launch, enable hosting firewall rate rules for `/api/cases` and review traffic. The signed public Apps Script endpoint can still consume execution quotas under direct attack before authentication finishes. A public form cannot authenticate dentists without an additional identity mechanism; no accounts/CAPTCHA are included.
- No payload logging is implemented. Do not enable request-body logging, session replay, form analytics or third-party tracking on these pages. Review hosting and Google audit/log settings.
- The browser uses one UUID per submission and freezes the reviewed prescription once transmission begins. Retries reuse that UUID. There is no browser persistent storage. Contact reuse for another case stays in React memory only.
- Apps Script holds a script lock and writes a durable pending ledger reservation before Forms submission. Same ID + same payload returns the original receipt. Changed content with the same ID is rejected.
- If Forms saved a response but ledger finalization failed, a retry recovers the existing response by its Submission ID. If a pending record has no confirmed response, it returns “receipt uncertain” instead of writing a possible duplicate. Google Forms and Sheets do not provide an atomic transaction across these operations; this is intentionally conservative.
- Deduplication applies to the retained submission ID, not identical cases independently entered in another tab or after a refresh. Do not refresh/start another case after an uncertain result; retry in the same tab or contact the lab.
- Case references are generated in Apps Script: Cairo date plus a full random UUID, e.g. `IBD-20261020-<32 hexadecimal characters>`. The timestamp is generated by Google, never trusted from the browser.
- Do not delete ledger entries while retries may still be needed. Secret rotation changes keyed fingerprints; rotate during a controlled window after resolving pending submissions, and document how old receipts remain available.

### Resolve an uncertain submission

An authorized operator should locate the reference in `_SubmissionLedger`, then search the Form's responses for its Submission ID. If found, retrying the original request finalizes its receipt. If absent, allow time for the original execution to finish and investigate Google execution status. Only after confirming there was no Form response should an operator arrange a new submission. Do not blindly delete a pending row or retry `submit()` manually.

## 7. Test the complete workflow

1. Run `npm.cmd install` if needed, then `npm.cmd run dev`.
2. Open `/send-case`. Use a clearly synthetic reference such as `TEST-CL-1042`, test contact details controlled by IBDAA, no real patient information.
3. Select teeth 11, 12, 21, 22. Select their rows, bulk-apply E.max and BL1, then individually change 21 to Zirconia/A1 and 22 to Veneers/B1. Add a note for tooth 21. Confirm other rows stay unchanged. Remove/reselect a tooth: its previous configuration must be gone. Quantity must match the current tooth count.
4. Try missing required fields, invalid age, no teeth, a tooth without a material, “Other” without its custom material, and an unchecked acknowledgment. All should be rejected with inline errors. Test bulk editing with and without the shared-shade checkbox; a checked blank shade explicitly clears only selected rows' shades.
5. Submit a valid test case. The button must disable while sending. A genuine successful result shows an `IBD-...` reference.
6. In the **Google Form Responses** tab, verify an actual response with that reference and Submission ID.
7. In the **linked response Sheet**, verify one new row, normalized contact, FDI list, derived quantity and timestamp. Check **Tooth restoration summary** and parse **Tooth configurations JSON**: tooth 11 must remain E.max/BL1, tooth 21 Zirconia/A1 with its own note, and tooth 22 Veneers/B1. Confirm `_SubmissionLedger` has one matching `submitted` entry and Form response ID. Sheet synchronization can lag the Form. Do not treat a test-double response as proof of this verification.
8. In developer tools, replay the **same API POST body** from the same origin. Expect the same reference and no additional Form response/Sheet row. Change its data without changing the ID: expect rejection and no new response.
9. Temporarily test an incorrect secret or deployment URL in staging. The UI must show failure, preserve the prescription, and never confirm receipt. Restore config and retry the same submission.
10. Test Arabic `/ar/send-case`, phone/tablet/desktop, Tab/Space tooth selection, loading state, “Other” behavior, review/edit and contact reuse. Numeric chart orientation stays anatomical in both languages.
11. Remove synthetic test records from both Form and Sheet according to your test cleanup policy; do not delete real ledger records.

`npm.cmd run test:cases` checks validation, backend rejection/confirmation logic, and the Apps Script's signed submission, recovery and duplicate behavior using local test doubles. **Those tests are not evidence of a working Google deployment.** Only steps 5–7 above establish live end-to-end success.

For repeatable browser checks, run a dedicated headless Chrome with remote debugging on port 9222 and an isolated profile, then `node tests/browser-cases.mjs` while the app runs on port 3000. It checks both languages at 390, 768 and 1440 px, keyboard tooth selection, independent tooth edits, bulk editing, required custom materials, removal/reselection, review associations and submission UI states. It intercepts API requests with explicit test doubles and saves screenshots under ignored `.qa/`. Never expose the Chrome debugging port publicly.

If port 3000 is in use, start Next.js on a free port and set `CASE_TEST_ORIGIN` to that local origin when running the browser checks.

## 8. Privacy and operations before production

Have the business owner and qualified privacy/legal advisers review the intended use in Egypt and any other applicable jurisdiction. Google integration is **not** a claim of healthcare-law compliance.

Required decisions include: lawful basis/authority for dentist submissions; the final public privacy notice and data-controller contact; Google/hosting contracts and data transfers; account/access reviews and MFA; permitted case information; retention periods and secure deletion across Form responses, response Sheet, ledger, backups and exports; incident response; and staff handling/training.

The ledger contains keyed hashes and references, which still need controlled access and retention. The response Sheet contains contact and case information. Sheet hiding/protection is not a substitute for file-level access control. Keep internal workflow notes minimal too.

Monitor quotas, pending reservations, linked-Sheet sync and deployment ownership. Apps Script quotas can change and exceptions interrupt execution. The ledger scan is suitable for modest intake; archive according to a reviewed retention plan and migrate to indexed durable storage if case volume grows. Do not silently discard deduplication history.

## Official implementation references

- [Apps Script web apps and execution identity](https://developers.google.com/apps-script/guides/web)
- [ContentService redirects](https://developers.google.com/apps-script/guides/content)
- [Supported FormResponse submission](https://developers.google.com/apps-script/reference/forms/form-response)
- [Form configuration and spreadsheet destination](https://developers.google.com/apps-script/reference/forms/form)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Google Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)
