import { caseCopy } from "@/lib/case-copy";
import type { Locale } from "@/lib/site";

// Patient's right appears at the viewer's left, including on the Arabic page.
const quadrants = [
  [18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38],
];
export function ToothSelector({ locale, selected, onChange, error }: {
  locale: Locale; selected: number[]; onChange: (teeth: number[]) => void; error?: string;
}) {
  const copy = caseCopy[locale];
  return <div id="teeth" tabIndex={-1}>
    <p id="tooth-instructions" className="case-hint">{copy.toothInstructions}</p>
    <div className="tooth-legend"><span><i />{copy.unselected}</span><span><i className="is-selected" />{copy.selected}</span></div>
    <div className="tooth-chart" dir="ltr" aria-describedby={`tooth-instructions${error ? " teeth-error" : ""}`}>
      {quadrants.map((teeth, index) => <fieldset className="tooth-quadrant" key={index}>
        <legend dir={locale === "ar" ? "rtl" : "ltr"}>{copy.quadrant[index]}</legend>
        <div className="tooth-row">
          {teeth.map(tooth => <label key={tooth} className="tooth-control">
            <input type="checkbox" checked={selected.includes(tooth)} aria-label={`${copy.quadrant[index]} — ${copy.tooth} ${tooth}`}
              onChange={() => onChange(selected.includes(tooth) ? selected.filter(t => t !== tooth) : [...selected, tooth].sort((a, b) => a - b))} />
            <span><svg aria-hidden="true" viewBox="0 0 24 28"><path d="M5 3Q8 1 12 4Q16 1 19 3Q23 7 20 13L17 24Q15 28 13 18Q12 15 11 18Q9 28 7 24L4 13Q1 7 5 3Z" /></svg>{tooth}</span>
          </label>)}
        </div>
      </fieldset>)}
    </div>
    {error && <p id="teeth-error" className="case-error">{error}</p>}
    <p className="tooth-summary" aria-live="polite">{copy.labels.teeth}: <bdi>{selected.length ? selected.join(", ") : copy.none}</bdi></p>
  </div>;
}
