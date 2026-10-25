"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { caseCopy } from "@/lib/case-copy";
import { emptyCase, reconcileTeeth, requestedNextSteps, textLimits, validateCase, type CaseData, type CaseErrors, type ToothErrors } from "@/lib/case-validation";
import { routes, whatsappUrl, type Locale } from "@/lib/site";
import { ToothSelector } from "./ToothSelector";
import { ToothRestorations, ToothReview } from "./ToothRestorations";
import "./case-form.css";

export function CaseForm({ locale }: { locale: Locale }) {
  const copy = caseCopy[locale];
  const [data, setData] = useState<CaseData>({ ...emptyCase, teeth: [] });
  const [errors, setErrors] = useState<CaseErrors>({});
  const [toothErrors, setToothErrors] = useState<ToothErrors>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [step, setStep] = useState<"edit" | "review" | "success">("edit");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [reference, setReference] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const requestId = useRef("");
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const focusHeading = () => requestAnimationFrame(() => heading.current?.focus());
  const update = <K extends keyof CaseData>(key: K, value: CaseData[K]) => {
    setData(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
    if (key === "teeth") setToothErrors({});
  };
  function review(event: FormEvent) {
    event.preventDefault();
    const result = validateCase(data);
    setErrors(result.errors);
    setToothErrors(result.toothErrors);
    if (!result.valid) { requestAnimationFrame(() => errorSummary.current?.focus()); return; }
    setData(result.data); setStep("review"); setFailure(""); focusHeading();
  }
  async function submit() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setFailure("");
    try {
      requestId.current ||= crypto.randomUUID();
      // A retry retains the key and frozen prescription. No case data is persisted in browser storage.
      setUncertain(true);
      const response = await fetch("/api/cases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestId.current, locale, data }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (response.ok && result.ok === true && /^IBD-\d{8}-[a-f0-9]{32}$/.test(result.reference)) {
        setReference(result.reference);
        setSubmittedAt(new Date().toLocaleString(locale === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" }));
        setStep("success"); setUncertain(false); focusHeading();
      } else {
        // Only explicit pre-submission rejections allow editing. Unknown outcomes must retain the same key.
        if (result.safeToEdit === true) setUncertain(false);
        setFailure(result.code === "rate" ? copy.rate : result.code === "unavailable" ? copy.unavailable : result.code === "pending" ? copy.pending : copy.failed);
        if (typeof result.reference === "string" && /^IBD-\d{8}-[a-f0-9]{32}$/.test(result.reference)) setReference(result.reference);
      }
    } catch { setFailure(copy.failed); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function another() {
    setData({ ...emptyCase, dentist: data.dentist, clinic: data.clinic, phone: data.phone, email: data.email, teeth: [] });
    setErrors({}); setToothErrors({}); setSelectedRows([]); setFailure(""); setReference(""); setSubmittedAt(""); requestId.current = ""; setUncertain(false); setStep("edit"); focusHeading();
  }
  function field(key: keyof typeof textLimits | "age", options: { type?: string; required?: boolean; hint?: string; autoComplete?: string; wide?: boolean } = {}) {
    const error = errors[key];
    const limit = key in textLimits ? textLimits[key as keyof typeof textLimits] : undefined;
    const description = [options.hint ? `${key}-hint` : "", error ? `${key}-error` : ""].filter(Boolean).join(" ");
    return <div className={`case-field ${options.wide ? "case-wide" : ""}`}>
      <label htmlFor={key}>{copy.labels[key]} {options.required ? <span aria-hidden="true">*</span> : <small>({copy.optional})</small>}</label>
      {key === "instructions" ? <textarea id={key} value={data[key]} maxLength={limit} rows={4} aria-describedby={description || undefined}
        aria-invalid={!!error} onChange={e => update(key, e.target.value)} /> :
        <input id={key} name={key} type={options.type || "text"} value={data[key]} required={options.required} maxLength={limit}
          autoComplete={options.autoComplete || "off"} min={key === "age" ? 0 : undefined}
          max={key === "age" ? 120 : undefined} step={options.type === "number" ? 1 : undefined}
          inputMode={options.type === "number" ? "numeric" : undefined} dir={["phone", "email"].includes(key) ? "ltr" : undefined}
          aria-invalid={!!error} aria-describedby={description || undefined} onChange={e => update(key, e.target.value)} />}
      {options.hint && <p className="case-hint" id={`${key}-hint`}>{options.hint}</p>}
      {error && <p className="case-error" id={`${key}-error`}>{copy.errors[error]}</p>}
    </div>;
  }
  function select(key: "sex" | "nextStep", choices: { value: string; label: string }[], required = false) {
    return <div className="case-field">
      <label htmlFor={key}>{copy.labels[key]} {required ? <span aria-hidden="true">*</span> : <small>({copy.optional})</small>}</label>
      <select id={key} value={data[key]} required={required} onChange={e => update(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined}>
        <option value="">{copy.choose}</option>{choices.map(choice => <option value={choice.value} key={choice.value}>{choice.label}</option>)}
      </select>
      {errors[key] && <p className="case-error" id={`${key}-error`}>{copy.errors[errors[key]]}</p>}
    </div>;
  }
  function section(index: number, children: ReactNode) {
    return <fieldset className="case-section"><legend><span aria-hidden="true">0{index + 1}</span>{copy.sections[index]}</legend>
      <p className="case-section-note">{copy.sectionNotes[index]}</p>{children}</fieldset>;
  }
  const summary = Object.entries(data).filter(([key, value]) => !["acknowledged", "teeth"].includes(key) && value !== "");
  return <section className="case-area"><div className="container case-container">
    <ol className="case-progress" aria-label={locale === "ar" ? "مراحل الإرسال" : "Submission steps"}>
      {copy.steps.map((label, index) => <li key={label} aria-current={index === (step === "edit" ? 0 : step === "review" ? 1 : 2) ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}
    </ol>
    {step === "success" ? <div className="case-confirmation">
      <div className="case-confirmation-banner no-print">
        <span className="case-success-icon" aria-hidden="true">✓</span>
        <h2 tabIndex={-1} ref={heading}>{copy.received}</h2>
        <p>{copy.successBody}</p>
      </div>

      <div className="case-receipt" id="case-receipt">
        <div className="case-receipt-header">
          <div>
            <h3 className="case-receipt-lab">{locale === "ar" ? "مختبر إبداع للأسنان" : "IBDAA Dental Lab"}</h3>
            <p className="case-receipt-title">{copy.receiptTitle}</p>
          </div>
          <div className="case-receipt-meta">
            <div><span className="case-receipt-label">{copy.reference}:</span> <strong dir="ltr">{reference}</strong></div>
            {submittedAt && <div><span className="case-receipt-label">{copy.submittedOn}:</span> <time>{submittedAt}</time></div>}
          </div>
        </div>

        <div className="case-receipt-body">
          <dl className="case-summary">
            {summary.map(([key, value]) => {
              let display = String(value);
              if (key === "sex") display = copy.sex[["male", "female", "unspecified"].indexOf(data.sex)];
              if (key === "nextStep") display = requestedNextSteps.find(s => s.id === value)?.[locale] || display;
              return <div key={key}><dt>{copy.labels[key as keyof typeof copy.labels]}</dt><dd dir="auto">{display}</dd></div>;
            })}
          </dl>
          <ToothReview locale={locale} teeth={data.teeth} />
        </div>

        <div className="case-receipt-footer">
          <p>{locale === "ar" ? "مختبر إبداع للأسنان · هاتف: 201030277027+ · damas.ibdaa@gmail.com" : "IBDAA Dental Lab · Tel: +20 103 027 7027 · damas.ibdaa@gmail.com"}</p>
        </div>
      </div>

      <div className="case-actions no-print">
        <button type="button" className="button button-accent case-print-button" onClick={() => window.print()}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginInlineEnd: 8, verticalAlign: "middle" }}>
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          {copy.print}
        </button>
        <button type="button" className="button button-outline" onClick={another}>{copy.another}</button>
        <Link href={routes[locale].home} className="button button-outline">{copy.home}</Link>
      </div>
      <p className="case-hint no-print">{copy.reuse}</p>
    </div> : step === "review" ? <div className="case-review" aria-busy={busy}>
      <h2 tabIndex={-1} ref={heading}>{copy.reviewTitle}</h2><p>{copy.reviewBody}</p>
      <dl className="case-summary">{summary.map(([key, value]) => {
        let display = String(value);
        if (key === "sex") display = copy.sex[["male", "female", "unspecified"].indexOf(data.sex)];
        if (key === "nextStep") display = requestedNextSteps.find(s => s.id === value)?.[locale] || display;
        return <div key={key}><dt>{copy.labels[key as keyof typeof copy.labels]}</dt><dd dir="auto">{display}</dd></div>;
      })}</dl>
      <ToothReview locale={locale} teeth={data.teeth} />
      {failure && <div className="case-alert" role="alert"><p>{failure}</p>{reference && <p className="case-reference"><bdi>{reference}</bdi></p>}</div>}
      {uncertain && <p className="case-hint">{copy.locked}</p>}
      <div className="case-actions">
        <button type="button" className="button button-accent" disabled={busy} onClick={submit}>{busy && <span className="case-spinner" aria-hidden="true" />}{busy ? copy.sending : uncertain ? copy.retry : copy.send}</button>
        <button type="button" className="button button-outline" disabled={busy || uncertain} onClick={() => { setStep("edit"); requestId.current = ""; focusHeading(); }}>{copy.edit}</button>
      </div><p role="status" className="sr-only">{busy ? copy.sending : ""}</p>
    </div> : <form className="case-form" method="post" action="/api/cases" noValidate onSubmit={review}>
      <h2 className="sr-only" ref={heading} tabIndex={-1}>{copy.steps[0]}</h2>
      <p className="case-required">{copy.required}</p>
      {Object.values(errors).some(Boolean) && <div className="case-alert" role="alert" tabIndex={-1} ref={errorSummary}>
        <p>{copy.errorTitle}</p><ul>{Object.entries(errors).filter(([, error]) => error).map(([key, error]) => <li key={key}><a href={`#${key}`}>{copy.labels[key as keyof typeof copy.labels]}: {copy.errors[error!]}</a></li>)}</ul>
      </div>}
      {section(0, <div className="case-fields">
        {field("dentist", { required: true, autoComplete: "name" })}{field("clinic", { autoComplete: "organization" })}
        {field("phone", { type: "tel", required: true, autoComplete: "tel", hint: copy.phoneHint })}{field("email", { type: "email", autoComplete: "email" })}
      </div>)}
      {section(1, <div className="case-fields">
        {field("patientReference", { required: true, hint: copy.referenceHint, wide: true })}
        {field("age", { type: "number" })}{select("sex", ["male", "female", "unspecified"].map((value, i) => ({ value, label: copy.sex[i] })))}
      </div>)}
      {section(2, <>
        <ToothSelector locale={locale} selected={data.teeth.map(t => Number(t.toothNumber))} onChange={numbers => {
          update("teeth", reconcileTeeth(data.teeth, numbers));
          setSelectedRows(current => current.filter(number => numbers.includes(Number(number))));
        }} error={errors.teeth ? copy.errors[errors.teeth] : undefined} />
        <ToothRestorations locale={locale} teeth={data.teeth} onChange={teeth => update("teeth", teeth)} selectedRows={selectedRows} onSelectRows={setSelectedRows} errors={toothErrors} />
      </>)}
      {section(3, <div className="case-fields">
        {requestedNextSteps.length > 0 && select("nextStep", requestedNextSteps.map(s => ({ value: s.id, label: s[locale] })))}
        {field("instructions", { hint: copy.instructionsHint, wide: true })}
      </div>)}
      <div className="case-privacy"><h3>{copy.privacyTitle}</h3><p>{copy.privacy}</p>
        <label className="case-acknowledgment"><input id="acknowledged" type="checkbox" required checked={data.acknowledged} onChange={e => update("acknowledged", e.target.checked)} aria-invalid={!!errors.acknowledged} aria-describedby={errors.acknowledged ? "ack-error" : undefined} /><span>{copy.acknowledge}</span></label>
        {errors.acknowledged && <p id="ack-error" className="case-error">{copy.errors.acknowledged}</p>}
      </div>
      <div className="case-actions"><button className="button button-accent" type="submit">{copy.review}<span aria-hidden="true">↗</span></button></div>
    </form>}
    <aside className="case-help"><span>{copy.help}</span><a className="text-link" href={whatsappUrl(locale)} target="_blank" rel="noopener noreferrer">{copy.whatsapp} ↗</a></aside>
  </div></section>;
}
