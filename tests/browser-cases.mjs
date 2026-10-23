// Local browser QA via a dedicated headless Chrome at localhost:9222.
// Only synthetic data. API calls are intercepted for UI state tests, not Google E2E.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
const baseUrl = process.env.CASE_TEST_ORIGIN || "http://localhost:3000";

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
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
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
    for (const width of [320, 390, 768, 1440]) {
      await call("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: width === 390 });
      await call("Page.navigate", { url: `${baseUrl}/${locale === "ar" ? "ar/" : ""}send-case` });
      await waitFor(() => evaluate(`document.readyState === 'complete' && !!document.getElementById('dentist')`));
      assert.equal(await evaluate("document.documentElement.lang"), locale);
      assert.equal(await evaluate("document.documentElement.dir"), locale === "ar" ? "rtl" : "ltr");
      assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `overflow at ${locale}/${width}`);
      assert.equal(await evaluate("document.querySelectorAll('.tooth-number').length"), 32);
      assert.equal(await evaluate("[...document.querySelectorAll('.tooth-number')].every(el => el.getBoundingClientRect().width >= 44 && el.getBoundingClientRect().height >= 44)"), true);
      if (width < 768) await waitFor(() => evaluate("document.querySelector('.tooth-chart-viewport').scrollLeft > 0"));
      const chart = await evaluate(`(() => {
        const viewport = document.querySelector('.tooth-chart-viewport');
        const rows = [...document.querySelectorAll('.tooth-arch')].map(row => [...row.querySelectorAll('button')].map(button => ({
          tooth: Number(button.dataset.tooth), x: button.getBoundingClientRect().x, y: button.getBoundingClientRect().y,
          label: button.getAttribute('aria-label'), pressed: button.getAttribute('aria-pressed')
        })));
        return { rows, direction: getComputedStyle(viewport).direction, overflow: viewport.scrollWidth > viewport.clientWidth, scroll: viewport.scrollLeft };
      })()`);
      assert.equal(chart.direction, "ltr", "Keep the anatomical arrangement in Arabic");
      assert.deepEqual(chart.rows.map(row=>row.map(t=>t.tooth)), [[18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],[48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38]]);
      for (const row of chart.rows) {
        assert.equal(new Set(row.map(t=>t.y)).size, 1, "Each arch stays on one horizontal line");
        assert.ok(row.every((tooth,index)=>index===0 || tooth.x > row[index-1].x), "Visual order must match FDI order");
        assert.ok(row.every(t=>t.label && t.pressed === 'false'));
      }
      if (width < 768) {
        assert.equal(chart.overflow, true);
        assert.ok(chart.scroll > 0, "Start the mobile view at the midline");
        const reach = await evaluate(`(() => {
          const el=document.querySelector('.tooth-chart-viewport');
          const original=el.scrollLeft;
          el.scrollLeft=0;
          const first=document.querySelector('.tooth-number[data-tooth="18"]').getBoundingClientRect();
          const left=first.left >= el.getBoundingClientRect().left;
          el.scrollLeft=el.scrollWidth;
          const last=document.querySelector('.tooth-number[data-tooth="28"]').getBoundingClientRect();
          const right=last.right <= el.getBoundingClientRect().right;
          el.scrollLeft=original;
          return {left,right};
        })()`);
        assert.deepEqual(reach, { left:true, right:true }, "Scrolling must reveal both ends without clipped numbers");
      }
      await screenshot(`${locale}-${width}-top`);
      await evaluate("document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('teeth').scrollIntoView({block:'center', behavior:'instant'})");
      await screenshot(`${locale}-${width}-teeth`);
    await click(".case-form button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.case-alert')"));
    assert.equal(await evaluate("document.getElementById('dentist').getAttribute('aria-invalid')"), "true");
    for (const [id, value] of Object.entries({ dentist: "QA Dentist", phone: "+201030277027", patientReference: "SYNTHETIC-QA-1042" })) await fill(id, value);
    for (const tooth of [11, 12, 21, 22, 31, 41]) await click(`.tooth-number[data-tooth="${tooth}"]`);
    assert.equal(await evaluate("document.querySelectorAll('.tooth-number[aria-pressed=true]').length"), 6);
    if (width < 768) {
      const previousScroll = await evaluate("(() => { const el=document.querySelector('.tooth-chart-viewport'); const position=el.scrollLeft; el.scrollLeft=0; return position; })()");
      await click('.tooth-number[data-tooth="18"]');
      await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
      assert.equal(await evaluate("document.querySelector('.tooth-chart-viewport').scrollLeft"), 0, "Selection must preserve the dentist's scroll position");
      await click('.tooth-number[data-tooth="18"]');
      await evaluate(`document.querySelector('.tooth-chart-viewport').scrollLeft=${previousScroll}`);
    }
    await evaluate("document.getElementById('teeth').scrollIntoView({block:'center',behavior:'instant'})");
    await screenshot(`${locale}-${width}-teeth-selected`);
    assert.equal(await evaluate("document.querySelectorAll('.tooth-config-table tbody tr').length"), 6);
    assert.equal(await evaluate("!!document.getElementById('quantity') || !!document.getElementById('restoration')"), false);
    await click("#acknowledged");
    await click(".case-form button[type=submit]");
    assert.equal(await evaluate("document.getElementById('tooth-11-material').getAttribute('aria-invalid')"), "true");
    await click("#bulk-select-all");
    await fill("bulk-material", "emax");
    await click("#bulk-apply-shade");
    await fill("bulk-shade", "BL1");
    await click("#bulk-apply");
    assert.equal(await evaluate("[...document.querySelectorAll('.tooth-config-table select')].every(el=>el.value==='emax')"), true);
    assert.equal(await evaluate("[...document.querySelectorAll('.tooth-config-table input[id$=shade]')].every(el=>el.value==='BL1')"), true);
    await click("#bulk-select-all");
    for (const tooth of [11, 12]) await click(`.tooth-config-table tr[data-tooth="${tooth}"] input[type=checkbox]`);
    await click("#bulk-apply-shade");
    await fill("bulk-material", "zircomax");
    await click("#bulk-apply");
    assert.equal(await evaluate("document.getElementById('tooth-11-material').value"), "zircomax");
    assert.equal(await evaluate("document.getElementById('tooth-21-material').value"), "emax");
    assert.equal(await evaluate("document.getElementById('tooth-11-shade').value"), "BL1");
    await fill("bulk-material", "emax"); await click("#bulk-apply");
    await fill("tooth-21-material", "zirconia"); await fill("tooth-21-shade", "A1");
    await fill("tooth-21-notes", "Only tooth 21 — ملاحظة لهذا السن");
    await fill("tooth-22-material", "veneers"); await fill("tooth-22-shade", "B1");
    await fill("tooth-31-material", "other");
    await click(".case-form button[type=submit]");
    assert.equal(await evaluate("document.getElementById('tooth-31-otherMaterial').getAttribute('aria-invalid')"), "true");
    await fill("tooth-31-otherMaterial", "Discuss with lab");
    await fill("tooth-41-material", "pfm");
    // Removal discards active configuration, and a new selection starts blank.
    await click('.tooth-number[data-tooth="12"]');
    assert.equal(await evaluate("document.getElementById('tooth-12-material') === null"), true);
    assert.equal(await evaluate("document.querySelectorAll('.tooth-config-table tbody tr').length"), 5);
    await click('.tooth-number[data-tooth="12"]');
    assert.equal(await evaluate("document.getElementById('tooth-12-material').value"), "");
    assert.equal(await evaluate("document.getElementById('tooth-11-material').value"), "emax");
    await fill("tooth-12-material", "emax"); await fill("tooth-12-shade", "BL1");
    // Native keyboard control remains available on the chart.
    await click('.tooth-number[data-tooth="21"]');
    await evaluate(`document.querySelector('.tooth-number[data-tooth="21"]').focus()`);
    await call("Input.dispatchKeyEvent", { type: "keyDown", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    await call("Input.dispatchKeyEvent", { type: "keyUp", key: " ", code: "Space", windowsVirtualKeyCode: 32 });
    assert.equal(await evaluate("document.querySelector('.tooth-summary').textContent.includes('11, 12, 21, 22, 31, 41')"), true);
    assert.equal(await evaluate("document.getElementById('tooth-21-material').value"), "");
    await fill("tooth-21-material", "zirconia"); await fill("tooth-21-shade", "A1");
    await fill("tooth-21-notes", "Only tooth 21 — ملاحظة لهذا السن");
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `configured overflow at ${locale}/${width}`);
    await evaluate("document.querySelector('.tooth-editor').scrollIntoView({block:'start',behavior:'instant'})");
    await screenshot(`${locale}-${width}-configured`);
    await click(".case-form button[type=submit]");
    await waitFor(() => evaluate("!!document.querySelector('.case-review')"));
    assert.equal(await evaluate("document.querySelectorAll('.tooth-review-table tbody tr').length"), 6);
    assert.equal(await evaluate("document.querySelector('.tooth-review-table tr[data-tooth=\"21\"]').textContent.includes('A1')"), true);
    assert.equal(await evaluate("document.querySelector('.tooth-review-table tr[data-tooth=\"21\"]').textContent.includes('Only tooth 21')"), true);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true);
    await call("Fetch.enable", { patterns: [{ urlPattern: "*/api/cases", requestStage: "Request" }] });
    events.length = 0;
    await click(".case-actions .button-accent");
    await waitFor(() => events.some(e => e.method === "Fetch.requestPaused"));
    assert.equal(await evaluate("document.querySelector('.case-actions .button-accent').disabled"), true);
    const first = events.find(e => e.method === "Fetch.requestPaused").params;
    const submitted = JSON.parse(first.request.postData).data;
    assert.equal("quantity" in submitted || "restoration" in submitted, false);
    assert.deepEqual(submitted.teeth.map(t=>[t.toothNumber,t.material,t.shade]), [["11","emax","BL1"],["12","emax","BL1"],["21","zirconia","A1"],["22","veneers","B1"],["31","other","BL1"],["41","pfm","BL1"]]);
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
    assert.equal(await evaluate("document.querySelectorAll('.tooth-number[aria-pressed=true]').length"), 0);
    await call("Fetch.disable");
    }
  }
  assert.deepEqual(errors, []);
  console.log("Browser QA passed: EN/AR at 320/390/768/1440px; anatomical two-row FDI order, 44px targets, full-chart scrolling, per-tooth materials/shades/notes, bulk editing, removal/reselection, keyboard selection, review and retry identity; no overflow or hydration exceptions. Submission UI used local doubles; NOT Google E2E.");
} finally {
  await call("Page.close").catch(() => {});
  socket.close();
}
