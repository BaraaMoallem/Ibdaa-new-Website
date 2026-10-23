import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const modules = {};
for (const name of ["case-validation", "case-backend"]) {
  const source = readFileSync(`src/lib/${name}.ts`, "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const run = vm.runInThisContext(`(function(exports, require) { ${output}\n})`);
  run(exports, id => id === "./case-validation" ? modules["case-validation"] : require(id));
  modules[name] = exports;
}
const { validateCase, emptyCase, newTooth, reconcileTeeth, applyToothDefaults, restorationQuantity } = modules["case-validation"];
const { handleCaseSubmission } = modules["case-backend"];
const sample = { ...emptyCase, dentist: "Test Dentist", phone: "01030277027", patientReference: "TEST-1042", teeth: [
  { ...newTooth("21"), material: "zirconia", shade: "A1", notes: "Keep this note with tooth 21" },
  { ...newTooth("11"), material: "emax", shade: "BL1", notes: "Keep this note with tooth 11" },
], acknowledged: true };
const secret = "test-only-secret-".repeat(4);

test("validation: Arabic digits, Egyptian/international numbers and sorted FDI teeth", () => {
  const result = validateCase({ ...sample, phone: "٠١٠٣٠٢٧٧٠٢٧", age: "٤٢" });
  assert.equal(result.valid, true);
  assert.equal(result.data.phone, "+201030277027");
  assert.equal(result.data.age, "42");
  assert.deepEqual(result.data.teeth.map(t => t.toothNumber), ["11", "21"]);
  assert.equal(result.data.teeth[0].material, "emax");
  assert.equal(result.data.teeth[1].shade, "A1");
  assert.equal(validateCase({ ...sample, phone: "+44 (20) 7946 0958" }).valid, true);
});
test("validation: malformed, required, ranges, enums, consent and text limits", () => {
  assert.equal(validateCase(null).valid, false);
  for (const change of [
    { dentist: "" }, { phone: "123" }, { phone: "+201330277027" }, { email: "bad@" },
    { patientReference: " " }, { age: "-1" }, { age: "121" }, { age: "2.5" },
    { quantity: "2" }, { restoration: "emax" }, { sex: "invalid" },
    { teeth: [] }, { teeth: [19] }, { teeth: [11, 11] }, { teeth: ["11"] },
    { teeth: [{ ...sample.teeth[0], toothNumber: "19" }] },
    { teeth: [{ ...sample.teeth[0], toothNumber: 21 }] },
    { teeth: [sample.teeth[0], sample.teeth[0]] },
    { teeth: [{ ...newTooth("11") }] },
    { teeth: [{ ...newTooth("11"), material: "unknown" }] },
    { teeth: [{ ...newTooth("11"), material: "other" }] },
    { teeth: [{ ...sample.teeth[0], shade: "a".repeat(61) }] },
    { teeth: [{ ...sample.teeth[0], notes: "a".repeat(301) }] },
    { teeth: [{ ...sample.teeth[0], notes: {} }] },
    { instructions: "a".repeat(2001) }, { dentist: 42 }, { nextStep: "unapproved" },
    { acknowledged: "true" },
  ]) assert.equal(validateCase({ ...sample, ...change }).valid, false, JSON.stringify(change));
  assert.equal(validateCase({ ...sample, teeth: [{ ...newTooth("11"), material: "other", otherMaterial: "Discuss with lab" }] }).valid, true);
  assert.equal(validateCase({ ...sample, teeth: [{ toothNumber: "11", material: "emax" }] }).valid, true, "Optional tooth fields may be omitted and normalize to empty strings");
  assert.equal(validateCase({ ...sample, teeth: [newTooth("11")] }).toothErrors["11"].material, "required");
  assert.equal(validateCase({ ...sample, dentist: "  Test\u202e\u0000  " }).data.dentist, "Test");
});
test("per-tooth edits and bulk defaults preserve other teeth, shades and notes; removal discards settings", () => {
  const original = structuredClone(sample.teeth);
  const edited = applyToothDefaults(original, ["11"], "veneers", "", undefined);
  assert.equal(edited.find(t => t.toothNumber === "21").material, "zirconia");
  assert.equal(edited.find(t => t.toothNumber === "11").shade, "BL1");
  assert.deepEqual(original, sample.teeth, "Do not mutate existing state");
  const shared = applyToothDefaults(original, ["11", "21"], "emax", "", "B1");
  assert.equal(shared.every(t => t.material === "emax" && t.shade === "B1"), true);
  assert.equal(shared.find(t => t.toothNumber === "21").notes, original[0].notes);
  assert.equal(applyToothDefaults(shared, ["11"], "other", "Custom", "").find(t => t.toothNumber === "11").shade, "");
  const removed = reconcileTeeth(shared, [21]);
  const readded = reconcileTeeth(removed, [11, 21]);
  assert.deepEqual(readded[0], newTooth("11"));
  assert.equal(readded[1].material, "emax");
  assert.equal(restorationQuantity(removed), 1);
  assert.equal(restorationQuantity(readded), 2);
});
test("a fully configured 32-tooth Arabic prescription fits the bounded request", () => {
  const teeth = [1, 2, 3, 4].flatMap(q => Array.from({ length: 8 }, (_, i) => ({ ...newTooth(String(q * 10 + i + 1)), material: "other", otherMaterial: "م".repeat(120), shade: "ش".repeat(60), notes: "ن".repeat(300) })));
  const data = { ...sample, teeth, instructions: "ن".repeat(2000) };
  assert.equal(validateCase(data).valid, true);
  assert.ok(Buffer.byteLength(JSON.stringify({ requestId: randomUUID(), locale: "ar", data })) < 80000);
});

function request(data = sample, overrides = {}) {
  return new Request("http://localhost:3000/api/cases", {
    method: "POST", headers: { origin: "http://localhost:3000", "content-type": "application/json" },
    body: JSON.stringify({ requestId: randomUUID(), locale: "en", data }), ...overrides,
  });
}
test("API: rejects unsafe requests, fails closed and requires a real-shaped confirmed receipt", async () => {
  const saved = { ...process.env }; const originalFetch = globalThis.fetch;
  try {
    process.env.CASE_ALLOWED_ORIGIN = "http://localhost:3000";
    process.env.NODE_ENV = "test";
    delete process.env.GOOGLE_CASE_SCRIPT_URL;
    assert.equal((await handleCaseSubmission(request())).status, 503);
    assert.equal((await handleCaseSubmission(request(sample, { headers: { origin: "https://evil.example", "content-type": "application/json" } }))).status, 403);
    assert.equal((await handleCaseSubmission(request({ ...sample, teeth: [] }))).status, 422);
    assert.equal((await handleCaseSubmission(request(sample, { body: "{" }))).status, 400);
    assert.equal((await handleCaseSubmission(request(sample, { body: "x".repeat(80001) }))).status, 400);
    process.env.GOOGLE_CASE_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
    process.env.GOOGLE_CASE_SHARED_SECRET = secret;
    globalThis.fetch = async () => new Response("<html>Google login required</html>");
    assert.equal((await handleCaseSubmission(request())).status, 502);
    globalThis.fetch = async (_url, options) => {
      const envelope = JSON.parse(options.body);
      assert.equal(envelope.signature, createHmac("sha256", secret).update(`${envelope.sentAt}.${envelope.payload}`).digest("hex"));
      const payload = JSON.parse(envelope.payload);
      assert.equal(payload.schemaVersion, 2);
      assert.equal(payload.data.teeth[0].toothNumber, "11");
      assert.equal(payload.data.teeth[0].material, "emax");
      assert.equal(payload.data.teeth[0].shade, "BL1");
      return Response.json({ version: 1, ok: true, requestId: payload.requestId, reference: "IBD-20261020-" + "a".repeat(32) });
    };
    assert.equal((await handleCaseSubmission(request())).status, 502, "No response ID must not confirm success");
    globalThis.fetch = async (_url, options) => {
      const payload = JSON.parse(JSON.parse(options.body).payload);
      return Response.json({ version: 1, ok: true, requestId: payload.requestId, reference: "IBD-20261020-" + "a".repeat(32), responseId: "test-double-form-response" });
    };
    assert.equal((await (await handleCaseSubmission(request())).json()).ok, true);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});

// Local Forms/Sheets doubles exercise algorithmic guarantees, NOT live Google connectivity.
function googleHarness() {
  const rows = [["id", "hash", "state", "reference", "time", "responseId", "contactHash"]];
  const responses = [];
  let failFinalization = false;
  let failSubmit = false;
  const source = readFileSync("integrations/google-apps-script/Code.gs", "utf8");
  const titles = Object.keys(vm.runInNewContext(`(${source.match(/const QUESTION_TITLES = (\{[\s\S]*?\n\});/)[1]})`));
  const ids = Object.fromEntries(titles.map((key, index) => [key, index + 1]));
  function item(id) {
    return {
      id,
      getType: () => [ids.instructions, ids.toothSummary, ids.toothConfigurations].includes(id) ? "paragraph" : "text",
      asParagraphTextItem: () => item(id), asTextItem: () => item(id),
      createResponse: value => ({ id, value }),
    };
  }
  const form = {
    getDestinationId: () => "sheet",
    getItemById: item,
    getResponses: () => responses,
    createResponse() {
      const answers = [];
      const response = {
        withItemResponse(answer) { answers.push(answer); return response; },
        submit() { if (failSubmit) throw Error("uncertain"); responses.push(response); return response; },
        getId: () => "response-" + responses.indexOf(response),
        answers,
        getResponseForItem: question => ({ getResponse: () => answers.find(a => a.id === question.id).value }),
      };
      return response;
    },
  };
  const props = { SHARED_SECRET: secret, FORM_ID: "form", SHEET_ID: "sheet", ITEM_IDS: JSON.stringify(ids), FORM_SCHEMA_VERSION: "2" };
  const context = vm.createContext({
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props[key] }) },
    Utilities: {
      Charset: { UTF_8: "utf8" }, computeHmacSha256Signature: (text, key) => [...createHmac("sha256", key).update(text).digest()],
      getUuid: randomUUID, formatDate: () => "20261020",
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, hasLock: () => true, releaseLock() {} }) },
    FormApp: { openById: () => form, ItemType: { TEXT: "text", PARAGRAPH_TEXT: "paragraph" } },
    SpreadsheetApp: {
      flush() {}, openById: () => ({
        getId: () => "sheet",
        getSheetByName: () => ({
          getDataRange: () => ({ getValues: () => rows }), getLastRow: () => rows.length,
          appendRow: row => rows.push(row),
          getRange: (row, col) => ({ setValue(value) { if (failFinalization) throw Error("write"); rows[row - 1][col - 1] = value; } }),
        }),
      }),
    },
  });
  vm.runInContext(source, context);
  function envelope(requestId, data = validateCase(sample).data) {
    const payload = JSON.stringify({ schemaVersion: 2, requestId, locale: "en", data });
    const sentAt = Date.now();
    return { version: 1, sentAt, payload, signature: createHmac("sha256", secret).update(`${sentAt}.${payload}`).digest("hex") };
  }
  return {
    post: e => context.doPost({ postData: { contents: JSON.stringify(e) } }), envelope, rows, responses, ids,
    failFinalize: value => { failFinalization = value; }, failSubmit: value => { failSubmit = value; },
  };
}
test("Apps Script: rejects bad signatures and independently validates data", () => {
  const g = googleHarness();
  assert.equal(g.post({ ...g.envelope(randomUUID()), signature: "bad" }).code, "unauthorized");
  assert.equal(g.post(g.envelope(randomUUID(), { ...validateCase(sample).data, teeth: [99] })).code, "invalid");
  for (const teeth of [
    [newTooth("11")], [sample.teeth[0], sample.teeth[0]], [{ ...sample.teeth[0], toothNumber: "49" }],
    [{ ...newTooth("11"), material: "other" }], [{ ...sample.teeth[0], notes: "a".repeat(301) }],
  ]) assert.equal(g.post(g.envelope(randomUUID(), { ...validateCase(sample).data, teeth })).code, "invalid");
  assert.equal(g.rows.length, 1);
});
test("Apps Script: same key returns same receipt; changed data is rejected; no duplicate response", () => {
  const g = googleHarness(); const id = randomUUID(); const envelope = g.envelope(id);
  const first = g.post(envelope); const second = g.post(envelope);
  assert.equal(first.ok, true);
  assert.equal(first.reference, second.reference);
  assert.equal(g.responses.length, 1);
  assert.equal(g.rows.length, 2);
  const changed = validateCase(sample).data;
  changed.teeth[0].shade = "A2";
  assert.equal(g.post(g.envelope(id, changed)).code, "conflict");
});
test("Apps Script: Form fields preserve mixed materials, shades and notes as summary AND JSON; quantity is derived", () => {
  const g = googleHarness();
  const data = validateCase(sample).data;
  data.teeth.push({ ...newTooth("12"), material: "other", otherMaterial: "Custom material", shade: "B1", notes: "فقط لهذا السن\nline 2" });
  assert.equal(g.post(g.envelope(randomUUID(), data)).ok, true);
  const answer = key => g.responses[0].answers.find(a => a.id === g.ids[key]).value;
  assert.equal(answer("quantity"), "3");
  const structured = JSON.parse(answer("toothConfigurations"));
  assert.equal(structured.schemaVersion, 2);
  assert.deepEqual(structured.teeth.map(t => [t.toothNumber, t.material, t.shade]), [["11", "emax", "BL1"], ["12", "other", "B1"], ["21", "zirconia", "A1"]]);
  assert.equal(structured.teeth[1].otherMaterial, "Custom material");
  assert.equal(structured.teeth[1].notes, data.teeth[2].notes);
  assert.match(answer("toothSummary"), /Tooth 11 — E.max — BL1/);
  assert.match(answer("toothSummary"), /Tooth 21 — Zirconia — A1 — Notes: Keep this note with tooth 21/);
  assert.match(answer("toothSummary"), /Tooth 12 — Other: Custom material — B1/);
});
test("Apps Script: recovers a Form write after ledger failure without resubmitting", () => {
  const g = googleHarness(); const envelope = g.envelope(randomUUID());
  g.failFinalize(true);
  assert.equal(g.post(envelope).ok, false);
  g.failFinalize(false);
  assert.equal(g.post(envelope).ok, true);
  assert.equal(g.responses.length, 1);
});
test("Apps Script: uncertain write stays pending; durable contact limit blocks new cases", () => {
  const g = googleHarness(); const envelope = g.envelope(randomUUID());
  g.failSubmit(true); g.post(envelope); g.failSubmit(false);
  assert.equal(g.post(envelope).code, "pending");
  assert.equal(g.responses.length, 0);
  for (let i = 0; i < 9; i++) assert.equal(g.post(g.envelope(randomUUID())).ok, true);
  assert.equal(g.post(g.envelope(randomUUID())).code, "rate");
});
