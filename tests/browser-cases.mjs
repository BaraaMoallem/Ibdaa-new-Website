// Local browser QA via a dedicated headless Chrome at localhost:9222.
// Only synthetic data. API calls are intercepted for UI state tests, not Google E2E.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

const target = await (await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const events = [];
const errors = [];
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) waiter.reject(Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  } else {
    events.push(message);
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      const text = message.params.args.map(arg => arg.value || arg.description || "").join(" ");
      if (/hydration|hydrated|server rendered/i.test(text)) errors.push(text);
    }
  }
});
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.text + JSON.stringify(result.exceptionDetails.exception));
  return result.result.value;
}
async function waitFor(predicate) {
  const start = Date.now();
  while (Date.now() - start < 20000) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error("Browser check timed out");
}
async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function fill(id, value) {
  await evaluate(`(() => {
    const el = document.getElementById(${JSON.stringify(id)});
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles:true }));
  })()`);
}
async function screenshot(name) {
  const result = await call("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  writeFileSync(`.qa/${name}.png`, Buffer.from(result.data, "base64"));
}
mkdirSync(".qa", { recursive: true });
try {
  await call("Page.enable"); await call("Runtime.enable");
  for (const locale of ["en", "ar"]) {
    for (const width of [390, 768, 1440]) {
      await call("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
      await call("Page.navigate", { url: `http://localhost:3000/${locale === "ar" ? "ar/" : ""}send-case` });
      await waitFor(() => evaluate(`document.readyState === 'complete' && !!document.getElementById('dentist')`));
      assert.equal(await evaluate("document.documentElement.lang"), locale);
      assert.equal(await evaluate("document.documentElement.dir"), locale === "ar" ? "rtl" : "ltr");
      assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `overflow at ${locale}/${width}`);
      assert.equal(await evaluate("document.querySelectorAll('.tooth-control input').length"), 32);
      assert.equal(await evaluate("[...document.querySelectorAll('.tooth-control')].every(el => el.getBoundingClientRect().width >= 44 && el.getBoundingClientRect().height >= 44)"), true);
      await screenshot(`${locale}-${width}-top`);
      await evaluate("document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('teeth').scrollIntoView({block:'center', behavior:'instant'})");
      await screenshot(`${locale}-${width}-teeth`);
    }
    await click(".case-form button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.case-alert')"));
    assert.equal(await evaluate("document.getElementById('dentist').getAttribute('aria-invalid')"), "true");
    for (const [id, value] of Object.entries({ dentist: "QA Dentist", phone: "+201030277027", patientReference: "SYNTHETIC-QA-1042", restoration: "other" })) await fill(id, value);
    await waitFor(() => evaluate("!!document.getElementById('otherMaterial')"));
    await fill("otherMaterial", "Discuss with laboratory");
    await click('.tooth-control input[aria-label$=" 11"]');
    await click('.tooth-control input[aria-label$=" 21"]');
    await click('.tooth-control input[aria-label$=" 21"]');
    await evaluate(`document.querySelector('.tooth-control input[aria-label$=" 21"]').focus()`);
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    assert.equal(await evaluate("document.querySelector('.tooth-summary').textContent.includes('11, 21')"), true);
    await click("#acknowledged");
    await click(".case-form button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.case-review')"));
    assert.equal(await evaluate("document.querySelector('.case-summary').textContent.includes('11, 21')"), true);
    await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/cases", requestStage: "Request" }] });
    events.length = 0;
    await click(".case-actions .button-accent");
    await waitFor(() => events.some(e => e.method === "Fetch.requestPaused"));
    assert.equal(await evaluate("document.querySelector('.case-actions .button-accent').disabled"), true);
    const first = events.find(e => e.method === "Fetch.requestPaused").params;
    await call("Fetch.fulfillRequest", { requestId: first.requestId, responseCode: 502, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify({ ok: false, code: "integration", safeToEdit: false })).toString("base64") });
    await waitFor(() => evaluate("!!document.querySelector('.case-alert') && !document.querySelector('.case-actions .button-accent').disabled"));
    assert.equal(await evaluate("document.querySelector('.case-actions .button-outline').disabled"), true, "Uncertain receipt freezes edits");
    events.length = 0;
    await click(".case-actions .button-accent");
    await waitFor(() => events.some(e => e.method === "Fetch.requestPaused"));
    const retry = events.find(e => e.method === "Fetch.requestPaused").params;
    assert.equal(first.request.postData, retry.request.postData, "Retry must preserve key and data");
    await call("Fetch.fulfillRequest", { requestId: retry.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body: Buffer.from(JSON.stringify({ ok: true, reference: "IBD-20261020-" + "a".repeat(32) })).toString("base64") });
    await waitFor(() => evaluate("!!document.querySelector('.case-confirmation')"));
    await click(".case-confirmation button");
    await waitFor(() => evaluate("!!document.getElementById('dentist')"));
    assert.equal(await evaluate("document.getElementById('dentist').value"), "QA Dentist");
    assert.equal(await evaluate("document.getElementById('patientReference').value"), "");
    assert.equal(await evaluate("document.querySelectorAll('.tooth-control input:checked').length"), 0);
    await call("Fetch.disable");
  }
  assert.deepEqual(errors, []);
  console.log("Browser QA passed: EN/AR, 390/768/1440px, no overflow, 32 touch targets, keyboard toggling, validation, review, loading, retry identity, confirmation UI, contact reuse, no hydration exceptions. Submission UI used local doubles; NOT Google E2E.");
} finally {
  await call("Page.close").catch(() => {});
  socket.close();
}
