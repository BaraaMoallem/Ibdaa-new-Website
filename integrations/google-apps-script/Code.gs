/**
 * IBDAA case intake, V8 runtime. Deploy from an IBDAA-owned account.
 * Configuration belongs in Script Properties, NEVER in this file.
 * See GOOGLE_FORMS_SETUP.md. Do not log event bodies or prescription data.
 */
const NEXT_STEPS = []; // Approved IDs only; match src/lib/case-validation.ts.
const ROOT_FOLDER_NAME = "Ibdaa website";

const QUESTION_TITLES = {
  requestId: "Submission ID",
  caseReference: "Case reference",
  submittedAt: "Submission timestamp (UTC)",
  locale: "Language",
  dentist: "Dentist name",
  clinic: "Clinic name",
  phone: "Phone number",
  email: "Email",
  patientReference: "Anonymized patient reference",
  age: "Patient age",
  sex: "Patient sex",
  quantity: "Quantity",
  nextStep: "Requested next step",
  toothSummary: "Tooth restoration summary",
  toothConfigurations: "Tooth configurations JSON",
  instructions: "Special instructions",
  teeth: "Selected teeth (FDI)",
  attachmentsFolder: "Case Drive Folder",
  ticketPdf: "Print Job Ticket (PDF)",
  attachmentNames: "Attached files",
  externalLink: "Cloud link",
  acknowledged: "Privacy acknowledgment",
};

const PARAGRAPH_KEYS = ["instructions", "toothSummary", "toothConfigurations", "attachmentNames"];
const REQUIRED_KEYS = [
  "requestId",
  "caseReference",
  "submittedAt",
  "locale",
  "dentist",
  "phone",
  "patientReference",
  "quantity",
  "teeth",
  "toothSummary",
  "toothConfigurations",
  "acknowledged",
];

const LEDGER_HEADERS = [
  "Submission ID",
  "Payload hash",
  "State",
  "Case reference",
  "Created UTC",
  "Form response ID",
  "Contact hash",
];

function output_(data) {
  return ContentService.createTextOutput(
    JSON.stringify(Object.assign({ version: 1 }, data)),
  ).setMimeType(ContentService.MimeType.JSON);
}

function hmac_(text, secret) {
  return Utilities.computeHmacSha256Signature(
    text,
    secret,
    Utilities.Charset.UTF_8,
  )
    .map((b) => ("0" + ((b + 256) % 256).toString(16)).slice(-2))
    .join("");
}

function equal_(a, b) {
  if (typeof a !== "string" || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++)
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function clean_(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,
      "",
    )
    .trim();
}

function validData_(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  const limits = {
    dentist: 100,
    clinic: 120,
    phone: 32,
    email: 254,
    patientReference: 80,
    instructions: 2000,
    age: 3,
    sex: 20,
    nextStep: 80,
  };
  if (
    Object.keys(limits).some(
      (k) =>
        typeof d[k] !== "string" ||
        d[k].length > limits[k] ||
        d[k] !== clean_(d[k]),
    )
  )
    return false;
  if (!d.dentist || !d.patientReference || !/^\+?[1-9]\d{6,14}$/.test(d.phone))
    return false;
  if (
    d.phone.startsWith("+20") &&
    !/^\+20(?:1[0125]\d{8}|[2-9]\d{7,8})$/.test(d.phone)
  )
    return false;
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return false;
  if (d.age && (!/^\d{1,3}$/.test(d.age) || Number(d.age) > 120)) return false;
  if (!["", "male", "female", "unspecified"].includes(d.sex)) return false;
  if (
    ["restoration", "otherMaterial", "shade", "quantity"].some(
      (key) => key in d,
    )
  )
    return false;
  if (d.nextStep && !NEXT_STEPS.includes(d.nextStep)) return false;
  if (
    d.externalLink &&
    (typeof d.externalLink !== "string" ||
      d.externalLink.length > 500 ||
      d.externalLink !== clean_(d.externalLink))
  )
    return false;

  if (d.attachments !== undefined) {
    if (!Array.isArray(d.attachments) || d.attachments.length > 5) return false;
    let totalSize = 0;
    for (const att of d.attachments) {
      if (!att || typeof att !== "object" || Array.isArray(att)) return false;
      if (
        typeof att.name !== "string" ||
        att.name.length > 150 ||
        !att.name ||
        att.name !== clean_(att.name)
      )
        return false;
      if (typeof att.data !== "string" || !att.data) return false;
      if (typeof att.size !== "number" || att.size <= 0) return false;
      totalSize += att.size;
    }
    if (totalSize > 3.5 * 1024 * 1024) return false;
  }

  if (!Array.isArray(d.teeth) || !d.teeth.length || d.teeth.length > 32)
    return false;
  const seen = new Set();
  for (const tooth of d.teeth) {
    if (
      !tooth ||
      typeof tooth !== "object" ||
      Array.isArray(tooth) ||
      typeof tooth.toothNumber !== "string" ||
      !/^[1-4][1-8]$/.test(tooth.toothNumber) ||
      seen.has(tooth.toothNumber)
    )
      return false;
    seen.add(tooth.toothNumber);
    if (
      !["zirconia", "zircomax", "emax", "veneers", "pfm", "other"].includes(
        tooth.material,
      )
    )
      return false;
    const lengths = { otherMaterial: 120, shade: 60, notes: 300 };
    if (
      Object.keys(lengths).some(
        (key) =>
          typeof tooth[key] !== "string" ||
          tooth[key].length > lengths[key] ||
          tooth[key] !== clean_(tooth[key]),
      )
    )
      return false;
    if (
      tooth.material === "other"
        ? !tooth.otherMaterial
        : tooth.otherMaterial !== ""
    )
      return false;
  }
  return d.acknowledged === true;
}

// Defense for spreadsheet formula injection, including later CSV exports.
function sheetText_(value) {
  const text = String(value || "");
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function getRootFolder_() {
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function buildJobTicketHtml_(v, teeth, files) {
  const toothRows = teeth
    .map(function (t) {
      const mat =
        t.material === "other"
          ? t.otherMaterial || "Other"
          : t.material.toUpperCase();
      return (
        "<tr>" +
        "<td style='padding:8px 12px;border-bottom:1px solid #ddd;font-weight:bold;text-align:center;'>" +
        t.toothNumber +
        "</td>" +
        "<td style='padding:8px 12px;border-bottom:1px solid #ddd;'>" +
        mat +
        "</td>" +
        "<td style='padding:8px 12px;border-bottom:1px solid #ddd;font-weight:600;'>" +
        (t.shade || "—") +
        "</td>" +
        "<td style='padding:8px 12px;border-bottom:1px solid #ddd;'>" +
        (t.notes || "—") +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  const filesHtml =
    files.length > 0
      ? files
          .map(function (f) {
            return "<li style='margin-bottom:4px;'>" + f + "</li>";
          })
          .join("")
      : "<li>None attached directly</li>";

  const cloudLinkHtml =
    v.externalLink && v.externalLink !== "None"
      ? "<p style='margin:6px 0;'><strong>Cloud Link:</strong> <a href='" +
        v.externalLink +
        "'>" +
        v.externalLink +
        "</a></p>"
      : "";

  return (
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Job Ticket - " +
    v.caseReference +
    "</title>" +
    "<style>" +
    "body{font-family:Arial,Helvetica,sans-serif;color:#1a2b38;margin:20px;line-height:1.5;font-size:13px;}" +
    ".header{display:flex;justify-content:space-between;border-bottom:2px solid #005f63;padding-bottom:12px;margin-bottom:18px;}" +
    ".title{font-size:20px;font-weight:bold;color:#005f63;margin:0;}" +
    ".subtitle{font-size:12px;color:#555;margin:2px 0 0;}" +
    ".ref-box{border:2px solid #005f63;background:#f0f8f8;padding:8px 14px;border-radius:4px;text-align:right;}" +
    ".grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px;}" +
    ".card{background:#f8fafb;border:1px solid #d8e2e7;padding:12px 14px;border-radius:4px;}" +
    ".card h3{margin:0 0 8px;font-size:13px;color:#005f63;text-transform:uppercase;border-bottom:1px solid #e1e9ed;padding-bottom:4px;}" +
    ".table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px;}" +
    ".table th{background:#005f63;color:white;padding:8px 12px;text-align:left;font-weight:600;}" +
    ".checklist{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px;}" +
    ".check-item{border:1px dashed #999;padding:6px 8px;border-radius:3px;font-size:11px;background:#fff;}" +
    ".footer{margin-top:24px;border-top:1px solid #ccc;padding-top:10px;font-size:11px;color:#777;display:flex;justify-content:space-between;}" +
    "</style></head><body>" +
    "<div class='header'>" +
    "<div>" +
    "<h1 class='title'>IBDAA DENTAL LABORATORY</h1>" +
    "<div class='subtitle'>مختبر إبداع للأسنان · Digital Case Prescription Slip</div>" +
    "</div>" +
    "<div class='ref-box'>" +
    "<div style='font-size:11px;color:#555;'>Case Reference:</div>" +
    "<div style='font-size:15px;font-weight:bold;color:#005f63;font-family:monospace;'>" +
    v.caseReference +
    "</div>" +
    "<div style='font-size:11px;color:#777;margin-top:2px;'>" +
    v.submittedAt +
    "</div>" +
    "</div></div>" +
    "<div class='grid'>" +
    "<div class='card'>" +
    "<h3>Dentist & Clinic</h3>" +
    "<div><strong>Dentist:</strong> " +
    (v.dentist || "—") +
    "</div>" +
    "<div><strong>Clinic:</strong> " +
    (v.clinic || "—") +
    "</div>" +
    "<div><strong>Phone:</strong> " +
    (v.phone || "—") +
    "</div>" +
    "<div><strong>Email:</strong> " +
    (v.email || "—") +
    "</div>" +
    "</div>" +
    "<div class='card'>" +
    "<h3>Patient & Specifications</h3>" +
    "<div><strong>Patient Ref:</strong> " +
    (v.patientReference || "—") +
    "</div>" +
    "<div><strong>Age / Sex:</strong> " +
    (v.age || "—") +
    " / " +
    (v.sex || "—") +
    "</div>" +
    "<div><strong>Total Units:</strong> " +
    v.quantity +
    " unit(s)</div>" +
    "<div><strong>Requested Step:</strong> " +
    (v.nextStep || "Full Restoration") +
    "</div>" +
    "</div></div>" +
    "<div>" +
    "<h3 style='margin:0;font-size:14px;color:#005f63;'>Configured Restorations (FDI Notation)</h3>" +
    "<table class='table'>" +
    "<thead><tr><th style='width:60px;text-align:center;'>Tooth</th><th>Material</th><th style='width:90px;'>Shade</th><th>Individual Tooth Notes</th></tr></thead>" +
    "<tbody>" +
    toothRows +
    "</tbody>" +
    "</table>" +
    "</div>" +
    (v.instructions
      ? "<div class='card' style='margin-bottom:16px;'><h3>Special Instructions</h3><p style='margin:4px 0;white-space:pre-wrap;'>" +
        v.instructions +
        "</p></div>"
      : "") +
    "<div class='card' style='margin-bottom:16px;'>" +
    "<h3>Files & Attachments</h3>" +
    "<ul style='margin:6px 0 6px 18px;padding:0;font-size:12px;'>" +
    filesHtml +
    "</ul>" +
    cloudLinkHtml +
    (v.attachmentsFolder
      ? "<p style='margin:6px 0;'><strong>Google Drive Folder:</strong> <a href='" +
        v.attachmentsFolder +
        "'>" +
        v.attachmentsFolder +
        "</a></p>"
      : "") +
    "</div>" +
    "<div class='card'>" +
    "<h3>Lab Workflow & Sign-Off</h3>" +
    "<div class='checklist'>" +
    "<div class='check-item'>[ ] Model / Prep</div>" +
    "<div class='check-item'>[ ] CAD Design</div>" +
    "<div class='check-item'>[ ] CAM / 3D Print</div>" +
    "<div class='check-item'>[ ] Sintering</div>" +
    "<div class='check-item'>[ ] Ceramic / Glaze</div>" +
    "<div class='check-item'>[ ] Shade Verification</div>" +
    "<div class='check-item'>[ ] Final QC & Fit</div>" +
    "<div class='check-item'>[ ] Disinfection & Pack</div>" +
    "</div></div>" +
    "<div class='footer'>" +
    "<div>IBDAA Dental Lab · Damas, Cairo, Egypt · Phone: +20 103 027 7027 · damas.ibdaa@gmail.com</div>" +
    "<div>Confidential Medical Prescription</div>" +
    "</div></body></html>"
  );
}

function doPost(e) {
  let requestId = "";
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 10000000)
      return output_({ ok: false, code: "invalid" });
    const envelope = JSON.parse(e.postData.contents);
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty("SHARED_SECRET");
    if (!secret || secret.length < 32)
      return output_({ ok: false, code: "configuration" });
    if (
      envelope.version !== 1 ||
      !Number.isSafeInteger(envelope.sentAt) ||
      Math.abs(Date.now() - envelope.sentAt) > 300000 ||
      typeof envelope.payload !== "string" ||
      envelope.payload.length > 8000000 ||
      !equal_(
        envelope.signature,
        hmac_(envelope.sentAt + "." + envelope.payload, secret),
      )
    )
      return output_({ ok: false, code: "unauthorized" });
    const payload = JSON.parse(envelope.payload);
    if (
      ![2, 3].includes(payload.schemaVersion) ||
      typeof payload.requestId !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
        payload.requestId,
      ) ||
      !["en", "ar"].includes(payload.locale) ||
      !validData_(payload.data)
    )
      return output_({ ok: false, code: "invalid" });
    requestId = payload.requestId;
    const configuredVersion = props.getProperty("FORM_SCHEMA_VERSION");
    if (configuredVersion !== "2" && configuredVersion !== "3")
      return output_({ ok: false, code: "configuration", requestId });
    const hash = hmac_(envelope.payload, secret);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(15000))
      return output_({ ok: false, code: "busy", requestId });
    const form = FormApp.openById(props.getProperty("FORM_ID"));
    const book = SpreadsheetApp.openById(props.getProperty("SHEET_ID"));
    if (form.getDestinationId() !== book.getId())
      throw new Error("destination");
    const ledger = book.getSheetByName("_SubmissionLedger");
    if (!ledger) throw new Error("ledger");
    const items = JSON.parse(props.getProperty("ITEM_IDS") || "{}");

    // Verify required questions exist
    REQUIRED_KEYS.forEach((key) => {
      if (!items[key]) throw new Error("schema");
      const item = form.getItemById(Number(items[key]));
      if (
        !item ||
        (PARAGRAPH_KEYS.includes(key)
          ? item.getType() !== FormApp.ItemType.PARAGRAPH_TEXT
          : item.getType() !== FormApp.ItemType.TEXT)
      )
        throw new Error("schema");
    });

    const rows = ledger.getDataRange().getValues();
    const found = rows.findIndex((row, i) => i > 0 && row[0] === requestId);
    if (found !== -1) {
      const row = rows[found];
      if (row[1] !== hash)
        return output_({ ok: false, code: "conflict", requestId });
      if (row[2] === "submitted" && row[5])
        return output_({
          ok: true,
          requestId,
          reference: row[3],
          responseId: String(row[5]),
        });
      // Recover a successful Form write if execution stopped before the ledger was finalized.
      const since = new Date(new Date(row[4]).getTime() - 60000);
      const idItem = form.getItemById(Number(items.requestId));
      const response = form.getResponses(since).find((r) => {
        const answer = r.getResponseForItem(idItem);
        return answer && answer.getResponse() === requestId;
      });
      if (response && response.getId()) {
        ledger.getRange(found + 1, 3).setValue("submitted");
        ledger.getRange(found + 1, 6).setValue(response.getId());
        SpreadsheetApp.flush();
        return output_({
          ok: true,
          requestId,
          reference: row[3],
          responseId: response.getId(),
        });
      }
      return output_({
        ok: false,
        code: "pending",
        requestId,
        reference: row[3],
      });
    }

    const now = new Date();
    const contactHash = hmac_(payload.data.phone, secret);
    const recent = rows
      .slice(1)
      .filter((row) => new Date(row[4]).getTime() > now.getTime() - 3600000);
    if (
      recent.length >= 200 ||
      recent.filter(
        (row) =>
          row[6] === contactHash &&
          new Date(row[4]).getTime() > now.getTime() - 900000,
      ).length >= 10
    ) {
      return output_({ ok: false, code: "rate", requestId });
    }

    const reference =
      "IBD-" +
      Utilities.formatDate(now, "Africa/Cairo", "yyyyMMdd") +
      "-" +
      Utilities.getUuid().replace(/-/g, "").toLowerCase();

    const teeth = payload.data.teeth
      .slice()
      .sort((a, b) => Number(a.toothNumber) - Number(b.toothNumber))
      .map((t) => ({
        toothNumber: t.toothNumber,
        material: t.material,
        otherMaterial: t.otherMaterial,
        shade: t.shade,
        notes: t.notes,
      }));

    const labels = {
      zirconia: "Zirconia",
      zircomax: "Zircomax",
      emax: "E.max",
      veneers: "Veneers",
      pfm: "PFM",
    };
    const inline = (text) => String(text || "").replace(/[\r\n]+/g, " ↵ ");

    let folderUrl = "";
    let pdfUrl = "";
    const fileSummaries = [];

    // Save attachments & generate PDF Job Ticket inside Google Drive "Ibdaa website" folder
    try {
      const rootFolder = getRootFolder_();
      const folderTitle =
        reference +
        " — " +
        clean_(payload.data.dentist) +
        " — " +
        clean_(payload.data.patientReference);
      const caseFolder = rootFolder.createFolder(folderTitle);
      folderUrl = caseFolder.getUrl();

      if (Array.isArray(payload.data.attachments)) {
        for (const att of payload.data.attachments) {
          if (att && att.name && att.data) {
            const decoded = Utilities.base64Decode(att.data);
            const blob = Utilities.newBlob(
              decoded,
              att.mimeType || "application/octet-stream",
              att.name,
            );
            const savedFile = caseFolder.createFile(blob);
            fileSummaries.push(savedFile.getName() + " (" + savedFile.getUrl() + ")");
          }
        }
      }

      const ticketHtml = buildJobTicketHtml_(
        {
          caseReference: reference,
          submittedAt: now.toISOString(),
          dentist: payload.data.dentist,
          clinic: payload.data.clinic,
          phone: payload.data.phone,
          email: payload.data.email,
          patientReference: payload.data.patientReference,
          age: payload.data.age,
          sex: payload.data.sex,
          quantity: String(teeth.length),
          nextStep: payload.data.nextStep,
          instructions: payload.data.instructions,
          externalLink: payload.data.externalLink,
          attachmentsFolder: folderUrl,
        },
        teeth,
        fileSummaries,
      );

      const pdfBlob = HtmlService.createHtmlOutput(ticketHtml)
        .getAs("application/pdf")
        .setName("JobTicket-" + reference + ".pdf");
      const pdfFile = caseFolder.createFile(pdfBlob);
      pdfUrl = pdfFile.getUrl();
    } catch (driveErr) {
      console.error("Drive attachment/PDF processing: ", driveErr);
    }

    const values = Object.assign({}, payload.data, {
      requestId,
      caseReference: reference,
      submittedAt: now.toISOString(),
      locale: payload.locale,
      quantity: String(teeth.length),
      teeth: teeth.map((t) => t.toothNumber).join(", "),
      toothSummary: teeth
        .map(
          (t) =>
            "Tooth " +
            t.toothNumber +
            " — " +
            (t.material === "other"
              ? "Other: " + inline(t.otherMaterial)
              : labels[t.material]) +
            " — " +
            (t.shade ? inline(t.shade) : "Shade not specified") +
            (t.notes ? " — Notes: " + inline(t.notes) : ""),
        )
        .join("\n"),
      toothConfigurations: JSON.stringify({ schemaVersion: 2, teeth }),
      attachmentsFolder: folderUrl || "Pending / unavailable",
      ticketPdf: pdfUrl || "Pending / unavailable",
      attachmentNames: fileSummaries.length > 0 ? fileSummaries.join("\n") : "None",
      externalLink: payload.data.externalLink || "None",
      acknowledged: "Acknowledged (notice v2)",
    });

    let response = form.createResponse();
    Object.keys(QUESTION_TITLES).forEach((key) => {
      if (!items[key]) return; // Skip questions not yet present in earlier form versions
      const item = form.getItemById(Number(items[key]));
      if (!item) return;
      const value = sheetText_(values[key] || "");
      const isParagraph = PARAGRAPH_KEYS.includes(key);
      const typed = isParagraph
        ? (typeof item.asParagraphTextItem === "function" ? item.asParagraphTextItem() : item)
        : (typeof item.asTextItem === "function" ? item.asTextItem() : item);
      const answer = typed.createResponse(value);
      response = response.withItemResponse(answer);
    });

    ledger.appendRow([
      requestId,
      hash,
      "pending",
      reference,
      now.toISOString(),
      "",
      contactHash,
    ]);
    SpreadsheetApp.flush();
    const rowNumber = ledger.getLastRow();
    response = response.submit();
    if (!response.getId()) throw new Error("unconfirmed");
    ledger.getRange(rowNumber, 3).setValue("submitted");
    ledger.getRange(rowNumber, 6).setValue(response.getId());
    SpreadsheetApp.flush();
    return output_({
      ok: true,
      requestId,
      reference,
      responseId: response.getId(),
      folderUrl,
      pdfUrl,
    });
  } catch (err) {
    console.error("doPost error: ", err && err.stack ? err.stack : err);
    return output_({ ok: false, code: "integration", requestId });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function doGet() {
  return output_({ ok: false, code: "post_required" });
}

/**
 * Run ONCE in the editor for a new installation.
 */
function setupNewForm() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("ITEM_IDS") || props.getProperty("SHEET_ID")) {
    throw new Error(
      "Already configured; delete ITEM_IDS and SHEET_ID from Script Properties first.",
    );
  }
  const form = FormApp.openById(props.getProperty("FORM_ID"));

  const existingItems = form.getItems();
  for (let i = existingItems.length - 1; i >= 0; i--) {
    form.deleteItem(existingItems[i]);
  }

  form.setTitle("IBDAA Dental Lab — Digital prescriptions");
  form.setDescription(
    "Internal case intake. Submit prescriptions through the IBDAA website.",
  );
  form
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(false)
    .setPublishingSummary(false);

  const ids = {};
  Object.keys(QUESTION_TITLES).forEach((key) => {
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
  book
    .insertSheet("Internal workflow")
    .appendRow([
      "Case reference",
      "Office notes",
      "Internal next step",
      "Processing notes",
    ]);

  // Ensure root Drive folder exists
  getRootFolder_();

  props.setProperties({
    SHEET_ID: book.getId(),
    ITEM_IDS: JSON.stringify(ids),
    FORM_SCHEMA_VERSION: "3",
  });
  console.log("Setup completed successfully. Sheet ID: " + book.getId());
}

/**
 * Upgrade helper: adds new attachment and Drive ticket columns to an existing Form/Sheet.
 */
function upgradeFormToV3() {
  const props = PropertiesService.getScriptProperties();
  if (
    !props.getProperty("FORM_ID") ||
    !props.getProperty("SHEET_ID") ||
    !props.getProperty("ITEM_IDS")
  )
    throw new Error("Configure the existing form first.");
  const form = FormApp.openById(props.getProperty("FORM_ID"));
  if (form.getDestinationId() !== props.getProperty("SHEET_ID"))
    throw new Error("Unexpected destination.");
  const ids = JSON.parse(props.getProperty("ITEM_IDS") || "{}");

  Object.keys(QUESTION_TITLES).forEach((key) => {
    const isParagraph = PARAGRAPH_KEYS.includes(key);
    const isRequired = REQUIRED_KEYS.includes(key);
    let item = ids[key] ? form.getItemById(Number(ids[key])) : null;
    if (!item) {
      const created = isParagraph
        ? form.addParagraphTextItem()
        : form.addTextItem();
      created.setTitle(QUESTION_TITLES[key]);
      created.setRequired(isRequired);
      ids[key] = created.getId();
      props.setProperty("ITEM_IDS", JSON.stringify(ids));
      console.log("Created question: " + QUESTION_TITLES[key]);
    } else {
      if (isParagraph) {
        if (typeof item.asParagraphTextItem === "function") {
          item.asParagraphTextItem().setRequired(isRequired);
        } else if (typeof item.setRequired === "function") {
          item.setRequired(isRequired);
        }
      } else {
        if (typeof item.asTextItem === "function") {
          item.asTextItem().setRequired(isRequired);
        } else if (typeof item.setRequired === "function") {
          item.setRequired(isRequired);
        }
      }
    }
  });

  // Ensure Drive folder exists
  getRootFolder_();

  props.setProperty("FORM_SCHEMA_VERSION", "3");
  console.log("Upgraded successfully to schema version 3.");
}
