import { useState } from "react";
import { caseCopy } from "@/lib/case-copy";
import { applyToothDefaults, caseMaterials, restorationQuantity, toothTextLimits, type ToothErrors, type ToothRestoration } from "@/lib/case-validation";
import type { Locale } from "@/lib/site";

export function ToothRestorations({ locale, teeth, onChange, selectedRows, onSelectRows, errors }: {
  locale: Locale; teeth: ToothRestoration[]; onChange: (teeth: ToothRestoration[]) => void;
  selectedRows: string[]; onSelectRows: (rows: string[]) => void; errors: ToothErrors;
}) {
  const copy = caseCopy[locale];
  const text = copy.toothEditor;
  const [material, setMaterial] = useState("");
  const [otherMaterial, setOtherMaterial] = useState("");
  const [shade, setShade] = useState("");
  const [applyShade, setApplyShade] = useState(false);
  const [status, setStatus] = useState("");
  function update(number: string, key: "material" | keyof typeof toothTextLimits, value: string) {
    onChange(teeth.map(tooth => tooth.toothNumber === number ? {
      ...tooth, [key]: value, ...(key === "material" && value !== "other" ? { otherMaterial: "" } : {}),
    } : tooth));
  }
  const materialOptions = <><option value="">{copy.choose}</option>{caseMaterials.map((value, i) => <option key={value} value={value}>{copy.materials[i]}</option>)}</>;
  if (!teeth.length) return null;
  return <div className="tooth-editor">
    <h3>{text.title}</h3><p className="case-hint">{text.intro}</p>
    <div className="tooth-bulk" role="group" aria-labelledby="bulk-title">
      <div className="tooth-bulk-heading"><h4 id="bulk-title">{text.bulk}</h4><span>{text.selectedRows}: <bdi>{selectedRows.length}</bdi></span></div>
      <label className="tooth-bulk-checkbox"><input id="bulk-select-all" type="checkbox" checked={selectedRows.length === teeth.length} onChange={e => onSelectRows(e.target.checked ? teeth.map(t => t.toothNumber) : [])} />{text.selectAll}</label>
      <div className="case-fields">
        <div className="case-field"><label htmlFor="bulk-material">{text.material}</label><select id="bulk-material" value={material} onChange={e => { setMaterial(e.target.value); setStatus(""); }}>{materialOptions}</select></div>
        {material === "other" && <div className="case-field"><label htmlFor="bulk-other">{text.custom}</label><input id="bulk-other" value={otherMaterial} maxLength={toothTextLimits.otherMaterial} onChange={e => { setOtherMaterial(e.target.value); setStatus(""); }} /></div>}
        <div className="case-field case-wide"><label className="tooth-bulk-checkbox" htmlFor="bulk-apply-shade"><input id="bulk-apply-shade" type="checkbox" checked={applyShade} onChange={e => { setApplyShade(e.target.checked); setStatus(""); }} />{text.applyShade}</label>
          {applyShade && <><label htmlFor="bulk-shade">{text.sharedShade}</label><input id="bulk-shade" value={shade} maxLength={toothTextLimits.shade} onChange={e => { setShade(e.target.value); setStatus(""); }} /><p className="case-hint">{copy.shadeHint}</p></>}
        </div>
      </div>
      <button type="button" className="button button-dark" id="bulk-apply" disabled={!selectedRows.length || !material || (material === "other" && !otherMaterial.trim())}
        onClick={() => { onChange(applyToothDefaults(teeth, selectedRows, material, otherMaterial, applyShade ? shade : undefined)); setStatus(text.applied); }}>{text.apply}</button>
      <p className="case-hint" role="status">{status}</p>
    </div>
    <table className="tooth-config-table" role="table">
      <caption className="sr-only">{text.title}</caption>
      <thead role="rowgroup"><tr role="row">
        <th scope="col" className="tooth-check-cell"><span className="sr-only">{text.selectedRows}</span></th>
        <th scope="col">{text.tooth}</th><th scope="col">{text.material} *</th><th scope="col">{text.shade}</th><th scope="col">{text.notes}</th>
      </tr></thead>
      <tbody role="rowgroup">{teeth.map(tooth => {
        const number = tooth.toothNumber;
        const rowErrors = errors[number] || {};
        function error(field: keyof typeof rowErrors) {
          return rowErrors[field] ? <p className="case-error" id={`tooth-${number}-${field}-error`}>{copy.errors[rowErrors[field]]}</p> : null;
        }
        return <tr key={number} role="row" data-tooth={number}>
          <td role="cell" className="tooth-check-cell"><label className="tooth-row-select"><input type="checkbox" aria-label={`${text.select} ${number}`} checked={selectedRows.includes(number)} onChange={e => onSelectRows(e.target.checked ? [...selectedRows, number] : selectedRows.filter(n => n !== number))} /></label></td>
          <th role="rowheader" scope="row"><span className="tooth-mobile-heading">{text.tooth} </span><bdi>{number}</bdi></th>
          <td role="cell" className="case-field"><label className="tooth-cell-label" htmlFor={`tooth-${number}-material`}>{text.material} <bdi>{number}</bdi> *</label>
            <select id={`tooth-${number}-material`} value={tooth.material} required aria-invalid={!!rowErrors.material} aria-describedby={rowErrors.material ? `tooth-${number}-material-error` : undefined} onChange={e => update(number, "material", e.target.value)}>{materialOptions}</select>{error("material")}
            {tooth.material === "other" && <><label className="tooth-custom-label" htmlFor={`tooth-${number}-otherMaterial`}>{text.custom} *</label><input id={`tooth-${number}-otherMaterial`} required value={tooth.otherMaterial} maxLength={toothTextLimits.otherMaterial} aria-invalid={!!rowErrors.otherMaterial} aria-describedby={rowErrors.otherMaterial ? `tooth-${number}-otherMaterial-error` : undefined} onChange={e => update(number, "otherMaterial", e.target.value)} />{error("otherMaterial")}</>}
          </td>
          <td role="cell" className="case-field"><label className="tooth-cell-label" htmlFor={`tooth-${number}-shade`}>{text.shade} <bdi>{number}</bdi> ({copy.optional})</label><input id={`tooth-${number}-shade`} value={tooth.shade} maxLength={toothTextLimits.shade} aria-invalid={!!rowErrors.shade} aria-describedby={rowErrors.shade ? `tooth-${number}-shade-error` : "tooth-shade-hint"} onChange={e => update(number, "shade", e.target.value)} />{error("shade")}</td>
          <td role="cell" className="case-field"><label className="tooth-cell-label" htmlFor={`tooth-${number}-notes`}>{text.notes} <bdi>{number}</bdi> ({copy.optional})</label><textarea id={`tooth-${number}-notes`} value={tooth.notes} rows={2} maxLength={toothTextLimits.notes} aria-invalid={!!rowErrors.notes} aria-describedby={rowErrors.notes ? `tooth-${number}-notes-error` : undefined} onChange={e => update(number, "notes", e.target.value)} />{error("notes")}</td>
        </tr>;
      })}</tbody>
    </table>
    <p className="case-hint" id="tooth-shade-hint">{copy.shadeHint}</p>
    <p className="tooth-total" aria-live="polite">{text.total}: <strong>{restorationQuantity(teeth)}</strong><small>{text.calculated}</small></p>
  </div>;
}

export function ToothReview({ locale, teeth }: { locale: Locale; teeth: ToothRestoration[] }) {
  const copy = caseCopy[locale];
  return <div className="tooth-review"><h3>{copy.toothEditor.summary}</h3>
    <table className="tooth-review-table" role="table"><caption className="sr-only">{copy.toothEditor.summary}</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col">{copy.toothEditor.tooth}</th><th scope="col">{copy.toothEditor.material}</th><th scope="col">{copy.toothEditor.shade}</th><th scope="col">{copy.toothEditor.notes}</th></tr></thead>
      <tbody role="rowgroup">{teeth.map(tooth => <tr key={tooth.toothNumber} role="row" data-tooth={tooth.toothNumber}>
        <th scope="row" role="rowheader"><span className="tooth-mobile-heading">{copy.toothEditor.tooth} </span><bdi>{tooth.toothNumber}</bdi></th>
        <td role="cell"><span className="tooth-mobile-heading">{copy.toothEditor.material}: </span>{tooth.material === "other" ? tooth.otherMaterial : copy.materials[caseMaterials.indexOf(tooth.material as typeof caseMaterials[number])]}</td>
        <td role="cell"><span className="tooth-mobile-heading">{copy.toothEditor.shade}: </span><bdi>{tooth.shade || copy.toothEditor.notSpecified}</bdi></td>
        <td role="cell"><span className="tooth-mobile-heading">{copy.toothEditor.notes}: </span>{tooth.notes || copy.toothEditor.notSpecified}</td>
      </tr>)}</tbody>
    </table><p className="tooth-total">{copy.toothEditor.total}: <strong>{restorationQuantity(teeth)}</strong><small>{copy.toothEditor.calculated}</small></p>
  </div>;
}
