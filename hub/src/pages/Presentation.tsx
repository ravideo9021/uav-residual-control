import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Callout, cx, PageHeader, Provenance } from "../components/ui";
import { content, fileUrl } from "../lib/content";
import type { Slide } from "../lib/types";

const hasNumbers = (s: Slide) => s.tables.some((t) => t.slice(1).some((r) => r.some((c) => /\d+(\.\d+)?%/.test(c))));

function SlideView({ s, total }: { s: Slide; total: number }) {
  const [first, ...rest] = s.groups;
  const isTitle = s.n === 1;
  return (
    <div className="flex h-full flex-col">
      <div aria-hidden="true" className="motif" />
      <div className="flex min-h-[23rem] flex-1 flex-col gap-4 p-5 sm:p-8">
        <div className="flex items-start gap-3">
          <h2 className={cx("font-display font-extrabold text-balance uppercase", isTitle ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>{s.title}</h2>
          {hasNumbers(s) && (
            <span className="ml-auto shrink-0">
              <Provenance />
            </span>
          )}
        </div>
        {[first, ...rest].filter(Boolean).map((g, gi) => (
          <ul key={gi} className={cx("space-y-1.5", isTitle && gi === 0 && "font-display text-xl font-bold")}>
            {g.map((p, pi) => (
              <li key={pi} className={cx("flex gap-2", p.level > 0 && "ml-6 text-sm")}>
                {!isTitle && g.length > 1 && <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rotate-45 bg-saffron" />}
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        ))}
        {s.tables.map((t, ti) => (
          <div key={ti} className="table-wrap">
            <table>
              <thead>
                <tr>
                  {t[0].map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.slice(1).map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} data-label={t[0][ci]} className="tabular-nums">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="border-t border-border px-5 py-2 text-right text-xs text-muted tabular-nums">
        {s.n} / {total}
      </p>
    </div>
  );
}

export default function Presentation() {
  const deck = content.presentation;
  const [params, setParams] = useSearchParams();
  const n = Math.min(Math.max(Number(params.get("slide") ?? 1), 1), deck?.slides.length ?? 1);
  const railRef = useRef<HTMLOListElement>(null);
  const go = (k: number) => setParams({ slide: String(k) }, { replace: true });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!deck || (e.target as HTMLElement).closest("input, select, textarea, dialog")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(Math.min(n + 1, deck.slides.length));
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(Math.max(n - 1, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => {
    // Scroll only the rail (scrollIntoView would also scroll the page)
    const rail = railRef.current;
    const item = rail?.querySelector<HTMLElement>(`[data-n="${n}"]`);
    if (rail && item) {
      const r = rail.getBoundingClientRect();
      const b = item.getBoundingClientRect();
      if (b.top < r.top || b.bottom > r.bottom) rail.scrollTop += b.top - r.top - 8;
      if (b.left < r.left || b.right > r.right) rail.scrollLeft += b.left - r.left - 8;
    }
  }, [n]);

  if (!deck) return <PageHeader title="Presentation not found" />;
  const s = deck.slides[n - 1];

  return (
    <>
      <PageHeader eyebrow="Presentation · Evaluation 2" title="The deck, slide by slide">
        <p>
          Text and tables extracted from <code>{deck.file}</code>. Use the arrow keys or the slide list to move through it.
        </p>
      </PageHeader>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <Callout tone="paper" title="Result numbers on the slides are Paper-reported">
          Percentages on the slides are copied from the paper (Tables III–IV). Plans on the slides (for example later flight tests) are
          outside the current specification’s scope.
        </Callout>
        <div className="flex flex-wrap gap-2">
          <a className="btn-pill btn-gold" href={fileUrl(deck.file)} download>
            Download PPTX
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <ol ref={railRef} aria-label="Slides" className="flex gap-2 overflow-x-auto pb-1 lg:max-h-[70dvh] lg:flex-col lg:overflow-y-auto lg:pb-0">
          {deck.slides.map((x) => (
            <li key={x.n} data-n={x.n} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => go(x.n)}
                aria-current={x.n === n ? "true" : undefined}
                className={cx(
                  "flex min-h-11 w-44 cursor-pointer items-start gap-2 rounded-[14px] border px-3 py-2 text-left text-sm transition-colors lg:w-full",
                  x.n === n ? "border-primary bg-primary-soft text-primary-strong" : "border-border bg-surface hover:border-primary",
                )}
              >
                <span className="font-display font-bold tabular-nums">{String(x.n).padStart(2, "0")}</span>
                <span className="line-clamp-2">{x.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <div>
          <div className="min-h-[26rem] overflow-hidden rounded-[18px] border border-border bg-surface">
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={s.n}
                aria-label={`Slide ${s.n}: ${s.title}`}
                aria-live="polite"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <SlideView s={s} total={deck.slides.length} />
              </motion.section>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button type="button" className="btn-pill btn-ghost" onClick={() => go(Math.max(n - 1, 1))} disabled={n === 1}>
              ← Previous
            </button>
            <span className="text-sm text-muted tabular-nums">
              Slide {n} of {deck.slides.length}
            </span>
            <button type="button" className="btn-pill btn-gold" onClick={() => go(Math.min(n + 1, deck.slides.length))} disabled={n === deck.slides.length}>
              Next →
            </button>
          </div>
          {s.notes && (
            <details className="mt-4 rounded-[14px] border border-border bg-surface p-4">
              <summary className="cursor-pointer font-display font-bold tracking-wider uppercase">Speaker notes</summary>
              <p className="mt-2 whitespace-pre-line text-sm">{s.notes}</p>
            </details>
          )}
        </div>
      </div>
    </>
  );
}
