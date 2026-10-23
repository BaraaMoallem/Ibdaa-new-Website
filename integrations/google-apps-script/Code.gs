/**
 * IBDAA case intake, V8 runtime. Deploy from an IBDAA-owned account.
 * Configuration belongs in Script Properties, NEVER in this file.
 * See GOOGLE_FORMS_SETUP.md. Do not log event bodies or prescription data.
 */
const NEXT_STEPS = []; // Approved IDs only; match src/lib/case-validation.ts.
const QUESTION_TITLES = {
  requestId: "Submission ID", caseReference: "Case reference", submittedAt: "Submission timestamp (UTC)",
  locale: "Language", dentist: "Dentist name", clinic: "Clinic name", phone: "Phone number",
  email: "Email", patientReference: "Anonymized patient reference", age: "Patient age",
  sex: "Patient sex", quantity: "Quantity", nextStep: "Requested next step",
  toothSummary: "Tooth restoration summary", toothConfigurations: "Tooth configurations JSON",
  instructions: "Special instructions", teeth: "Selected teeth (FDI)", acknowledged: "Privacy acknowledgment",
};
const PARAGRAPH_KEYS = ["instructions", "toothSummary", "toothConfigurations"];
const REQUIRED_KEYS = ["requestId", "caseReference", "submittedAt", "locale", "dentist", "phone", "patientReference", "quantity", "teeth", "toothSummary", "toothConfigurations", "acknowledged"];
const LEDGER_HEADERS = ["Submission ID", "Payload hash", "State", "Case reference", "Created UTC", "Form response ID", "Contact hash"];

function output_(data) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ version: 1 }, data))).setMimeType(ContentService.MimeType.JSON);
}
function hmac_(text, secret) {
  return Utilities.computeHmacSha256Signature(text, secret, Utilities.Charset.UTF_8).map(b => ("0" + ((b + 256) % 256).toString(16)).slice(-2)).join("");
}
function equal_(a, b) {
  if (typeof a !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
function clean_(value) {
  return value.normalize("NFC").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim();
}
function validData_(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  const limits = { dentist: 100, clinic: 120, phone: 32, email: 254, patientReference: 80, instructions: 2000, age: 3, sex: 20, nextStep: 80 };
  if (Object.keys(limits).some(k => typeof d[k] !== "string" || d[k].length > limits[k] || d[k] !== clean_(d[k]))) return false;
  if (!d.dentist || !d.patientReference || !/^\+?[1-9]\d{6,14}$/.test(d.phone)) return false;
  if (d.phone.startsWith("+20") && !/^\+20(?:1[0125]\d{8}|[2-9]\d{7,8})$/.test(d.phone)) return false;
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return false;
  if (d.age && (!/^\d{1,3}$/.test(d.age) || Number(d.age) > 120)) return false;
  if (!["", "male", "female", "unspecified"].includes(d.sex)) return false;
  if (["restoration", "otherMaterial", "shade", "quantity"].some(key => key in d)) return false;
  if (d.nextStep && !NEXT_STEPS.includes(d.nextStep)) return false;
  if (!Array.isArray(d.teeth) || !d.teeth.length || d.teeth.length > 32) return false;
  const seen = new Set();
  for (const tooth of d.teeth) {
    if (!tooth || typeof tooth !== "object" || Array.isArray(tooth) || typeof tooth.toothNumber !== "string" || !/^[1-4][1-8]$/.test(tooth.toothNumber) || seen.has(tooth.toothNumber)) return false;
    seen.add(tooth.toothNumber);
    if (!["zirconia", "zircomax", "emax", "veneers", "pfm", "other"].includes(tooth.material)) return false;
    const lengths = { otherMaterial: 120, shade: 60, notes: 300 };
    if (Object.keys(lengths).some(key => typeof tooth[key] !== "string" || tooth[key].length > lengths[key] || tooth[key] !== clean_(tooth[key]))) return false;
    if (tooth.material === "other" ? !tooth.otherMaterial : tooth.otherMaterial !== "") return false;
  }
  return d.acknowledged === true;
}
// Defense for spreadsheet formula injection, including later CSV exports.
function sheetText_(value) {
  const text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function doPost(e) {
  let requestId = "";
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 120000) return output_({ ok: false, code: "invalid" });
    const envelope = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty("SHARED_SECRET");
    if (!secret || secret.length < 32) return output_({ ok: false, code: "configuration" });
    if (envelope.version !== 1 || !Number.isSafeInteger(envelope.sentAt) || Math.abs(Date.now() - envelope.sentAt) > 300000 ||
      typeof envelope.payload !== "string" || envelope.payload.length > 80000 ||
      !equal_(envelope.signature, hmac_(envelope.sentAt + "." + envelope.payload, secret))) return output_({ ok: false, code: "unauthorized" });
    const payload = JSON.parse(envelope.payload);
    if (payload.schemaVersion !== 2 || typeof payload.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(payload.requestId) ||
      !["en", "ar"].includes(payload.locale) || !validData_(payload.data)) return output_({ ok: false, code: "invalid" });
    requestId = payload.requestId;
    if (props.getProperty("FORM_SCHEMA_VERSION") !== "2") return output_({ ok: false, code: "configuration", requestId });
    const hash = hmac_(envelope.payload, secret);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return output_({ ok: false, code: "busy", requestId });
    const form = FormApp.openById(props.getProperty("FORM_ID"));
    const book = SpreadsheetApp.openById(props.getProperty("SHEET_ID"));
    if (form.getDestinationId() !== book.getId()) throw new Error("destination");
    const ledger = book.getSheetByName("_SubmissionLedger");
    if (!ledger) throw new Error("ledger");
    const items = JSON.parse(props.getProperty("ITEM_IDS") || "{}");
    // Verify the schema before reserving a submission. Never silently skip a missing question.
    Object.keys(QUESTION_TITLES).forEach(key => {
      const item = form.getItemById(Number(items[key]));
      if (!item || (PARAGRAPH_KEYS.includes(key) ? item.getType() !== FormApp.ItemType.PARAGRAPH_TEXT : item.getType() !== FormApp.ItemType.TEXT)) throw new Error("schema");
    });
    const rows = ledger.getDataRange().getValues();
    const found = rows.findIndex((row, i) => i > 0 && row[0] === requestId);
    if (found !== -1) {
      const row = rows[found];
      if (row[1] !== hash) return output_({ ok: false, code: "conflict", requestId });
      if (row[2] === "submitted" && row[5]) return output_({ ok: true, requestId, reference: row[3], responseId: String(row[5]) });
      // Recover a successful Form write if execution stopped before the ledger was finalized.
      const since = new Date(new Date(row[4]).getTime() - 60000);
      const idItem = form.getItemById(Number(items.requestId));
      const response = form.getResponses(since).find(r => {
        const answer = r.getResponseForItem(idItem);
        return answer && answer.getResponse() === requestId;
      });
      if (response && response.getId()) {
        ledger.getRange(found + 1, 3).setValue("submitted");
        ledger.getRange(found + 1, 6).setValue(response.getId());
        SpreadsheetApp.flush();
        return output_({ ok: true, requestId, reference: row[3], responseId: response.getId() });
      }
      // Fail closed: a pending write may have reached Google. Do not submit another automatically.
      return output_({ ok: false, code: "pending", requestId, reference: row[3] });
    }
    const now = new Date();
    const contactHash = hmac_(payload.data.phone, secret);
    const recent = rows.slice(1).filter(row => new Date(row[4]).getTime() > now.getTime() - 3600000);
    // Durable limits survive concurrent executions and Next.js serverless instances.
    if (recent.length >= 200 || recent.filter(row => row[6] === contactHash && new Date(row[4]).getTime() > now.getTime() - 900000).length >= 10) {
      return output_({ ok: false, code: "rate", requestId });
    }
    const reference = "IBD-" + Utilities.formatDate(now, "Africa/Cairo", "yyyyMMdd") + "-" + Utilities.getUuid().replace(/-/g, "").toLowerCase();
    // Canonical, whole objects preserve the material/shade/notes association.
    const teeth = payload.data.teeth.slice().sort((a, b) => Number(a.toothNumber) - Number(b.toothNumber)).map(t => ({
      toothNumber: t.toothNumber, material: t.material, otherMaterial: t.otherMaterial, shade: t.shade, notes: t.notes,
    }));
    const labels = { zirconia: "Zirconia", zircomax: "Zircomax", emax: "E.max", veneers: "Veneers", pfm: "PFM" };
    const inline = text => text.replace(/[\r\n]+/g, " ↵ ");
    const values = Object.assign({}, payload.data, {
      requestId, caseReference: reference, submittedAt: now.toISOString(), locale: payload.locale,
      quantity: String(teeth.length), teeth: teeth.map(t => t.toothNumber).join(", "),
      toothSummary: teeth.map(t => "Tooth " + t.toothNumber + " — " + (t.material === "other" ? "Other: " + inline(t.otherMaterial) : labels[t.material]) + " — " + (t.shade ? inline(t.shade) : "Shade not specified") + (t.notes ? " — Notes: " + inline(t.notes) : "")).join("\n"),
      toothConfigurations: JSON.stringify({ schemaVersion: 2, teeth }), acknowledged: "Acknowledged (notice v1)",
    });
    let response = form.createResponse();
    Object.keys(QUESTION_TITLES).forEach(key => {
      const item = form.getItemById(Number(items[key]));
      const value = sheetText_(values[key]);
      const answer = PARAGRAPH_KEYS.includes(key) ? item.asParagraphTextItem().createResponse(value) : item.asTextItem().createResponse(value);
      response = response.withItemResponse(answer);
    });
    ledger.appendRow([requestId, hash, "pending", reference, now.toISOString(), "", contactHash]);
    SpreadsheetApp.flush(); // Reservation is durable BEFORE calling Forms.
    const rowNumber = ledger.getLastRow();
    response = response.submit();
    if (!response.getId()) throw new Error("unconfirmed");
    ledger.getRange(rowNumber, 3).setValue("submitted");
    ledger.getRange(rowNumber, 6).setValue(response.getId());
    SpreadsheetApp.flush();
    return output_({ ok: true, requestId, reference, responseId: response.getId() });
  } catch {
    return output_({ ok: false, code: "integration", requestId });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
function doGet() {
  return output_({ ok: false, code: "post_required" }); // No case lookup or personal data endpoint.
}

/**
 * Run ONCE in the editor, after creating an empty Google Form and setting FORM_ID.
 * Creates the required questions and a linked spreadsheet owned by the executing account.
 * Refuses to modify a form that already has questions or a destination.
 */
function setupNewForm() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("ITEM_IDS") || props.getProperty("SHEET_ID")) {
    throw new Error("Already configured; delete ITEM_IDS and SHEET_ID from Script Properties first.");
  }
  const form = FormApp.openById(props.getProperty("FORM_ID"));
  
  // Clean out any existing items if any were left behind
  const existingItems = form.getItems();
  for (let i = existingItems.length - 1; i >= 0; i--) {
    form.deleteItem(existingItems[i]);
  }

  form.setTitle("IBDAA Dental Lab — Digital prescriptions");
  form.setDescription("Internal case intake. Submit prescriptions through the IBDAA website.");
  form.setCollectEmail(false)
      .setLimitOneResponsePerUser(false)
      .setAllowResponseEdits(false)
      .setPublishingSummary(false);

  const ids = {};
  Object.keys(QUESTION_TITLES).forEach(key => {
    const title = QUESTION_TITLES[key];
    const isParagraph = PARAGRAPH_KEYS.includes(key);
    const item = isParagraph ? form.addParagraphTextItem() : form.addTextItem();
    item.setTitle(title);
    item.setRequired(REQUIRED_KEYS.includes(key));
    ids[key] = item.getId();
    console.log("Created question: " + title + " (ID: " + item.getId() + ")");
  });

  const book = SpreadsheetApp.create("IBDAA Dental Lab — Cases");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, book.getId());
  book.insertSheet("_SubmissionLedger").appendRow(LEDGER_HEADERS);
  book.insertSheet("Internal workflow").appendRow(["Case reference", "Office notes", "Internal next step", "Processing notes"]);

  props.setProperties({
    SHEET_ID: book.getId(),
    ITEM_IDS: JSON.stringify(ids),
    FORM_SCHEMA_VERSION: "2"
  });
  console.log("Setup completed successfully. Sheet ID: " + book.getId());
}

/** Upgrade an existing v1 form without deleting responses, questions or Sheet columns.
 * Resolve any pending v1 submissions first. Run in the editor, then deploy a new version.
 */
function upgradePerToothForm() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty("FORM_ID") || !props.getProperty("SHEET_ID") || !props.getProperty("ITEM_IDS")) throw new Error("Configure the existing form first.");
  const form = FormApp.openById(props.getProperty("FORM_ID"));
  if (form.getDestinationId() !== props.getProperty("SHEET_ID")) throw new Error("Unexpected destination.");
  const ids = JSON.parse(props.getProperty("ITEM_IDS"));
  ["restoration", "otherMaterial", "shade"].forEach(key => {
    if (ids[key]) form.getItemById(Number(ids[key])).asTextItem().setRequired(false);
  });
  Object.keys(QUESTION_TITLES).forEach(key => {
    let item = ids[key] ? form.getItemById(Number(ids[key])) : null;
    if (!item) {
      item = PARAGRAPH_KEYS.includes(key) ? form.addParagraphTextItem() : form.addTextItem();
      item.setTitle(QUESTION_TITLES[key]);
      ids[key] = item.getId();
      props.setProperty("ITEM_IDS", JSON.stringify(ids)); // Safe to rerun after a partial upgrade.
    }
    if (PARAGRAPH_KEYS.includes(key)) item.asParagraphTextItem().setRequired(REQUIRED_KEYS.includes(key));
    else item.asTextItem().setRequired(REQUIRED_KEYS.includes(key));
  });
  props.setProperty("FORM_SCHEMA_VERSION", "2");
}
