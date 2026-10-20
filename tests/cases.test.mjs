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
const { validateCase, emptyCase } = modules["case-validation"];
const { handleCaseSubmission } = modules["case-backend"];
const sample = { ...emptyCase, dentist: "Test Dentist", phone: "01030277027", patientReference: "TEST-1042", restoration: "zirconia", teeth: [21, 11], acknowledged: true };
const secret = "test-only-secret-".repeat(4);

test("validation: Arabic digits, Egyptian/international numbers and sorted FDI teeth", () => {
  const result = validateCase({ ...sample, phone: "٠١٠٣٠٢٧٧٠٢٧", age: "٤٢", quantity: "٢" });
  assert.equal(result.valid, true);
  assert.equal(result.data.phone, "+201030277027");
  assert.equal(result.data.age, "42");
  assert.deepEqual(result.data.teeth, [11, 21]);
  assert.equal(validateCase({ ...sample, phone: "+44 (20) 7946 0958" }).valid, true);
});
test("validation: malformed, required, ranges, enums, consent and text limits", () => {
  assert.equal(validateCase(null).valid, false);
  for (const change of [
    { dentist: "" }, { phone: "123" }, { phone: "+201330277027" }, { email: "bad@" },
    { patientReference: " " }, { age: "-1" }, { age: "121" }, { age: "2.5" },
    { quantity: "0" }, { quantity: "2.5" }, { quantity: "1000" }, { sex: "invalid" },
    { restoration: "brand-invented" }, { restoration: "other", otherMaterial: "" },
    { teeth: [] }, { teeth: [19] }, { teeth: [11, 11] }, { teeth: ["11"] },
    { instructions: "a".repeat(2001) }, { dentist: 42 }, { nextStep: "unapproved" },
    { acknowledged: "true" },
  ]) assert.equal(validateCase({ ...sample, ...change }).valid, false, JSON.stringify(change));
  assert.equal(validateCase({ ...sample, restoration: "other", otherMaterial: "Discuss with lab" }).valid, true);
  assert.equal(validateCase({ ...sample, dentist: "  Test\u202e\u0000  " }).data.dentist, "Test");
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
    assert.equal((await handleCaseSubmission(request(sample, { body: "x".repeat(20001) }))).status, 400);
    process.env.GOOGLE_CASE_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
    process.env.GOOGLE_CASE_SHARED_SECRET = secret;
    globalThis.fetch = async () => new Response("<html>Google login required</html>");
    assert.equal((await handleCaseSubmission(request())).status, 502);
    globalThis.fetch = async (_url, options) => {
      const envelope = JSON.parse(options.body);
      assert.equal(envelope.signature, createHmac("sha256", secret).update(`${envelope.sentAt}.${envelope.payload}`).digest("hex"));
      const payload = JSON.parse(envelope.payload);
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
      getType: () => id === ids.instructions ? "paragraph" : "text",
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
        getResponseForItem() { return { getResponse: () => answers.find(a => a.id === ids.requestId).value }; },
      };
      return response;
    },
  };
  const props = { SHARED_SECRET: secret, FORM_ID: "form", SHEET_ID: "sheet", ITEM_IDS: JSON.stringify(ids) };
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
    const payload = JSON.stringify({ requestId, locale: "en", data });
    const sentAt = Date.now();
    return { version: 1, sentAt, payload, signature: createHmac("sha256", secret).update(`${sentAt}.${payload}`).digest("hex") };
  }
  return {
    post: e => context.doPost({ postData: { contents: JSON.stringify(e) } }), envelope, rows, responses,
    failFinalize: value => { failFinalization = value; }, failSubmit: value => { failSubmit = value; },
  };
}
test("Apps Script: rejects bad signatures and independently validates data", () => {
  const g = googleHarness();
  assert.equal(g.post({ ...g.envelope(randomUUID()), signature: "bad" }).code, "unauthorized");
  assert.equal(g.post(g.envelope(randomUUID(), { ...validateCase(sample).data, teeth: [99] })).code, "invalid");
  assert.equal(g.rows.length, 1);
});
test("Apps Script: same key returns same receipt; changed data is rejected; no duplicate response", () => {
  const g = googleHarness(); const id = randomUUID(); const envelope = g.envelope(id);
  const first = g.post(envelope); const second = g.post(envelope);
  assert.equal(first.ok, true);
  assert.equal(first.reference, second.reference);
  assert.equal(g.responses.length, 1);
  assert.equal(g.rows.length, 2);
  assert.equal(g.post(g.envelope(id, { ...validateCase(sample).data, shade: "A2" })).code, "conflict");
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
