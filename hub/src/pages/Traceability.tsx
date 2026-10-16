import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Badge, Card, cx, IdChip, Linkify, PageHeader, PriorityBadge, selectCls } from "../components/ui";
import { modulesOf, moduleById, reqById, requirements, spec, TEST_LEVELS, testById } from "../lib/content";

const GROUPS = [...new Set(requirements.map((r) => r.group))];
const LEVEL_SHORT: Record<string, string> = { Unit: "UT", Integration: "IT", System: "ST", Regression: "RT", "Experimental validation": "EV" };

type Axis = "module" | "level";

function cellReqs(group: string, axis: Axis, col: string) {
  return requirements.filter(
    (r) =>
      r.group === group &&
      (axis === "module" ? modulesOf(r).includes(col) : r.tests.some((t) => testById.get(t)?.level === col)),
  );
}

export default function Traceability() {
  const [axis, setAxis] = useState<Axis>("module");
  const [sel, setSel] = useState<{ group: string; col: string } | null>(null);
  const [params, setParams] = useSearchParams();
  const pathId = params.get("req") ?? "FR-GATE-01";
  const cols = axis === "module" ? spec.modules.map((m) => m.id) : [...TEST_LEVELS];

  const matrix = useMemo(
    () => GROUPS.map((g) => cols.map((c) => cellReqs(g, axis, c).length)),
    [axis],
  );
  const max = Math.max(1, ...matrix.flat());
  const selected = sel ? cellReqs(sel.group, axis, sel.col) : [];
  const untested = requirements.filter((r) => !r.tests.length).length;

  return (
    <>
      <PageHeader eyebrow="Traceability" title="Requirement → module → test">
        <p>
          Every requirement maps to a design element, a module and at least one test ({requirements.length - untested} of {requirements.length}{" "}
          covered). The matrix counts requirements per cell; select a cell to list them.
        </p>
      </PageHeader>

      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Coverage matrix</h2>
          <div role="radiogroup" aria-label="Matrix columns" className="ml-auto inline-flex rounded-lg border border-border p-0.5">
            {(
              [
                ["module", "Groups × modules"],
                ["level", "Groups × test levels"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={axis === v}
                onClick={() => {
                  setAxis(v);
                  setSel(null);
                }}
                className={cx("rounded-md px-3 py-1.5 text-sm", axis === v ? "bg-primary text-on-primary" : "text-muted hover:text-text")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5 text-sm">
            <caption className="sr-only">
              Number of requirements per group and {axis === "module" ? "module" : "test level"}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 bg-surface px-2 py-1 text-left font-semibold">
                  Group
                </th>
                {cols.map((c) => (
                  <th key={c} scope="col" className="px-1 py-1 text-center font-mono text-xs font-semibold" title={axis === "module" ? moduleById.get(c)?.name : c}>
                    {axis === "module" ? c : LEVEL_SHORT[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g, gi) => (
                <tr key={g}>
                  <th scope="row" className="sticky left-0 bg-surface px-2 py-0.5 text-left font-mono text-xs font-medium whitespace-nowrap">
                    {g}
                  </th>
                  {cols.map((c, ci) => {
                    const n = matrix[gi][ci];
                    const active = sel?.group === g && sel.col === c;
                    return (
                      <td key={c} className="p-0">
                        {n ? (
                          <button
                            type="button"
                            onClick={() => setSel(active ? null : { group: g, col: c })}
                            aria-pressed={active}
                            aria-label={`${g} × ${c}: ${n} requirement${n > 1 ? "s" : ""}`}
                            className={cx(
                              "grid h-8 w-full min-w-9 place-items-center rounded font-semibold tabular-nums transition-transform hover:scale-105",
                              active && "ring-2 ring-[var(--focus)]",
                            )}
                            style={{
                              background: `color-mix(in oklab, var(--primary) ${18 + (n / max) * 70}%, var(--surface))`,
                              color: n / max > 0.45 ? "var(--on-primary)" : "var(--text)",
                            }}
                          >
                            {n}
                          </button>
                        ) : (
                          <span className="grid h-8 min-w-9 place-items-center rounded bg-surface-2 text-xs text-muted" aria-label="none">
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {axis === "level" && (
          <p className="mt-2 text-xs text-muted">UT unit · IT integration · ST system · RT regression · EV experimental validation</p>
        )}
        <AnimatePresence initial={false}>
          {sel && (
            <motion.div
              key={`${sel.group}-${sel.col}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-border pt-4" aria-live="polite">
                <h3 className="mb-2 font-semibold">
                  {sel.group} × {axis === "module" ? `${sel.col} ${moduleById.get(sel.col)?.name}` : sel.col}: {selected.length}
                </h3>
                <ul className="space-y-1.5">
                  {selected.map((r) => (
                    <li key={r.id} className="flex gap-2 text-sm">
                      <IdChip id={r.id} />
                      <button type="button" className="text-left hover:text-primary" onClick={() => setParams({ req: r.id })}>
                        <span className="line-clamp-1">{r.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <PathView id={pathId} onChange={(id) => setParams({ req: id })} />
    </>
  );
}

function PathView({ id, onChange }: { id: string; onChange: (id: string) => void }) {
  const r = reqById.get(id) ?? requirements[0];
  const mods = modulesOf(r);
  const tests = r.tests.map((t) => testById.get(t)).filter((t) => !!t);
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Path view</h2>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted">Requirement</span>
          <select className={cx(selectCls, "max-w-[60vw] font-mono")} value={r.id} onChange={(e) => onChange(e.target.value)}>
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {requirements
                  .filter((x) => x.group === g)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.id}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <motion.ol key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3 md:grid-cols-[1.2fr_auto_1fr_auto_1.2fr] md:items-start">
        <li className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Requirement</p>
          <p className="flex items-center gap-2">
            <Link to={`/requirements?id=${r.id}`} className="font-mono font-semibold text-primary underline-offset-2 hover:underline">
              {r.id}
            </Link>
            <PriorityBadge p={r.priority} />
          </p>
          <p className="mt-1 text-sm">
            <Linkify text={r.text} />
          </p>
          <p className="mt-2 text-xs text-muted">
            Design element: <code>{r.design_element}</code>
          </p>
        </li>
        <Arrow />
        <li className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Modules</p>
          <ul className="space-y-1.5">
            {mods.map((m) => (
              <li key={m} className="flex items-center gap-2 text-sm">
                <IdChip id={m} />
                {moduleById.get(m)?.name}
              </li>
            ))}
          </ul>
          {r.diagrams.length > 0 && (
            <p className="mt-2 flex flex-wrap gap-1 text-xs text-muted">
              Diagrams: {r.diagrams.map((d) => <IdChip key={d} id={d} />)}
            </p>
          )}
        </li>
        <Arrow />
        <li className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Tests</p>
          <ul className="space-y-1.5">
            {tests.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-sm">
                <IdChip id={t.id} />
                <span className="min-w-0 flex-1">{t.title}</span>
                <Badge>{t.status}</Badge>
              </li>
            ))}
          </ul>
        </li>
      </motion.ol>
    </Card>
  );
}

function Arrow() {
  return (
    <li aria-hidden="true" className="grid place-items-center text-muted md:pt-10">
      <svg viewBox="0 0 24 24" className="size-5 rotate-90 md:rotate-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12h15m-5-5 5 5-5 5" />
      </svg>
    </li>
  );
}
