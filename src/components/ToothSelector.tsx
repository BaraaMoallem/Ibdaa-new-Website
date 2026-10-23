import { useEffect, useRef } from "react";
import { caseCopy } from "@/lib/case-copy";
import type { Locale } from "@/lib/site";

// Patient's right appears at the viewer's left, including on the Arabic page.
const arches = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];
export function ToothSelector({ locale, selected, onChange, error }: {
  locale: Locale; selected: number[]; onChange: (teeth: number[]) => void; error?: string;
}) {
  const copy = caseCopy[locale];
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    // Narrow screens start at the anatomical midline; both arches scroll together.
    const container = element.parentElement;
    if (!container) return;
    let previousWidth = 0;
    const center = () => {
      if (container.clientWidth === previousWidth) return;
      previousWidth = container.clientWidth;
      // Show complete 44px targets at rest, with equal numbers on either side.
      const pairs = Math.min(8, Math.max(1, Math.floor((container.clientWidth - 8) / 88)));
      element.style.width = `${pairs * 88 + 8}px`;
      element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2;
    };
    center();
    const observer = new ResizeObserver(center);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  return <div id="teeth" tabIndex={-1}>
    <p id="tooth-instructions" className="case-hint">{copy.toothInstructions}</p>
    <p id="tooth-scroll-hint" className="case-hint tooth-scroll-hint">{copy.toothScrollHint}</p>
    <div ref={viewport} className="tooth-chart-viewport" dir="ltr" tabIndex={0} role="region" aria-label={copy.toothChartLabel} aria-describedby={`tooth-instructions tooth-scroll-hint${error ? " teeth-error" : ""}`}>
      <div className="tooth-chart">
        <div className="tooth-arch-labels" aria-hidden="true"><span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.quadrant[0]}</span><span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.quadrant[1]}</span></div>
        {arches.map((teeth, arch) => <div className="tooth-arch" role="group" aria-label={copy.toothArches[arch]} key={arch}>
          {teeth.map((tooth, index) => <button key={tooth} type="button" className="tooth-number" data-tooth={tooth}
            style={{ gridColumn: index + 1 }}
            aria-label={`${copy.quadrant[arch * 2 + (index < 8 ? 0 : 1)]} — ${copy.tooth} ${tooth}`}
            aria-pressed={selected.includes(tooth)}
            onClick={() => onChange(selected.includes(tooth) ? selected.filter(t => t !== tooth) : [...selected, tooth].sort((a, b) => a - b))}>
            <span>{tooth}</span>
          </button>)}
        </div>)}
        <div className="tooth-arch-labels" aria-hidden="true"><span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.quadrant[2]}</span><span dir={locale === "ar" ? "rtl" : "ltr"}>{copy.quadrant[3]}</span></div>
      </div>
    </div>
    {error && <p id="teeth-error" className="case-error">{error}</p>}
    <p className="tooth-summary" aria-live="polite">{copy.labels.teeth}: <bdi>{selected.length ? selected.join(", ") : copy.none}</bdi></p>
  </div>;
}
