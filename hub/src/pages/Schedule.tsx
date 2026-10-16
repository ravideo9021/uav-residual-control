import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Badge, Card, cx, Field, IdChip, Linkify, PageHeader } from "../components/ui";
import { spec } from "../lib/content";
import type { Phase } from "../lib/types";

const DAY = 86_400_000;
const t = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const phases = spec.schedule.filter((p) => p.start && p.end);
const min = Math.min(...phases.map((p) => t(p.start)));
const max = Math.max(...phases.map((p) => t(p.end))) + DAY;
const pct = (ms: number) => ((ms - min) / (max - min)) * 100;
const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const months: { label: string; at: number }[] = [];
for (let d = new Date(min); d.getTime() < max; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (first >= min) months.push({ label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), at: pct(first) });
}

const KIND_STYLE: Record<Phase["kind"], string> = {
  phase: "bg-primary-strong",
  sprint: "bg-primary",
  buffer: "bg-[repeating-linear-gradient(45deg,var(--muted)_0_6px,transparent_6px_12px)] border border-muted",
};

export default function Schedule() {
  const [sel, setSel] = useState<string>(phases[1]?.id ?? phases[0].id);
  const now = Date.now();
  const today = now >= min && now <= max ? pct(now) : null;
  const current = spec.schedule.find((p) => p.id === sel)!;

  return (
    <>
      <PageHeader eyebrow="Schedule" title="Sprints and milestones (proposed)">
        <p>
          {fmt(spec.schedule[0].start)} to {fmt(spec.schedule[spec.schedule.length - 1].end)}. Dates are proposals to be confirmed with the
          guide; the examination buffer B1 is TBC. Select a bar for its deliverables and exit criterion.
        </p>
      </PageHeader>

      <Card className="mb-6">
        <div className="relative">
          {/* month grid + labels */}
          <div className="relative mb-6 ml-0 h-5 sm:ml-28" aria-hidden="true">
            {months.map((m) => (
              <span key={m.label} className="absolute -translate-x-1/2 text-[0.7rem] whitespace-nowrap text-muted sm:text-xs" style={{ left: `${m.at}%` }}>
                {m.label}
              </span>
            ))}
            {today !== null && (
              <span className="absolute top-5 -translate-x-1/2 rounded bg-tbc-bg px-1 text-[0.65rem] font-semibold text-tbc-fg" style={{ left: `${today}%` }}>
                today
              </span>
            )}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 left-0 sm:left-28" aria-hidden="true">
              {months.map((m) => (
                <span key={m.label} className="absolute inset-y-0 border-l border-dashed border-border" style={{ left: `${m.at}%` }} />
              ))}
              {today !== null && <span className="absolute inset-y-0 border-l-2 border-tbc-fg" style={{ left: `${today}%` }} />}
            </div>

            <ol className="relative space-y-1.5" aria-label="Phases">
              {phases.map((p, i) => {
                const left = pct(t(p.start));
                const width = pct(t(p.end) + DAY) - left;
                return (
                  <li key={p.id} className="grid items-center gap-1 sm:grid-cols-[7rem_1fr]">
                    <span className="relative w-fit max-w-full truncate rounded bg-surface pr-1 text-xs sm:w-auto sm:pr-2">
                      <span className="font-mono font-semibold">{p.id}</span> <span className="text-muted">{p.content}</span>
                    </span>
                    <div className="relative h-7">
                      <motion.button
                        type="button"
                        onClick={() => setSel(p.id)}
                        aria-pressed={sel === p.id}
                        aria-label={`${p.id} ${p.content}, ${fmt(p.start)} to ${fmt(p.end)}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.03, duration: 0.35, ease: "easeOut" }}
                        style={{ left: `${left}%`, width: `${width}%`, originX: 0 }}
                        className={cx(
                          "absolute inset-y-0 rounded-md text-left text-[0.7rem] font-semibold whitespace-nowrap text-on-primary transition-shadow hover:shadow-md",
                          KIND_STYLE[p.kind],
                          sel === p.id && "ring-2 ring-[var(--focus)] ring-offset-2 ring-offset-[var(--surface)]",
                        )}
                      >
                        <span aria-hidden="true" className={cx("hidden px-1.5 sm:inline", p.kind === "buffer" && "rounded bg-surface px-1 text-text")}>{p.id}</span>
                      </motion.button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <ol className="relative mt-4 h-14 sm:ml-28" aria-label="Milestones">
              {spec.milestones.map((m, i) => (
                <li key={m.id} className="absolute flex -translate-x-1/2 flex-col items-center" style={{ left: `${pct(t(m.date))}%`, top: i % 2 ? 28 : 0 }}>
                  <span aria-hidden="true" className="size-3 rotate-45 bg-paper-fg" />
                  <span className="mt-0.5 text-[0.7rem] whitespace-nowrap">
                    <span className="sr-only">{fmt(m.date)}: </span>
                    {m.title}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-primary" /> Sprint
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded bg-primary-strong" /> Phase
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={cx("h-2.5 w-5 rounded", KIND_STYLE.buffer)} /> Buffer
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rotate-45 bg-paper-fg" /> Milestone
          </span>
        </p>
      </Card>

      <AnimatePresence mode="wait">
        <motion.div aria-live="polite" key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <Card>
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                <span className="font-mono">{current.id}</span> {current.content}
              </h2>
              <Badge>{current.weeks}</Badge>
            </header>
            <dl className="grid gap-4 md:grid-cols-3">
              <Field label="Deliverables">
                <Linkify text={current.deliverables} />
              </Field>
              <Field label="Exit criterion">
                <Linkify text={current.exit_criterion} />
              </Field>
              <Field label="Depends on">
                {current.depends_on.length ? (
                  <span className="flex gap-1">
                    {current.depends_on.map((d) => (
                      <button key={d} type="button" onClick={() => setSel(d)} className="rounded-md border border-border px-1.5 font-mono text-xs hover:border-primary">
                        {d}
                      </button>
                    ))}
                  </span>
                ) : (
                  "—"
                )}
              </Field>
            </dl>
          </Card>
        </motion.div>
      </AnimatePresence>

      <h2 className="mt-10 mb-3 text-xl font-semibold">Milestones</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {spec.milestones.map((m) => (
          <li key={m.id}>
            <Card className="h-full">
              <p className="text-sm text-muted">{fmt(m.date)}</p>
              <p className="font-semibold">{m.title}</p>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Test IDs in exit criteria link to the test plan, e.g. <IdChip id="UT-01" />.
      </p>
    </>
  );
}
