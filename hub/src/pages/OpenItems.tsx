import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Badge, Callout, Card, cx, IdList, PageHeader, StatusBadge } from "../components/ui";
import { expandIds, ID_RE, requirements, spec } from "../lib/content";

const STATUSES = ["TBC", "In discussion", "Confirmed", "Closed"];
const LEVEL_TONE = { High: "tbc", Medium: "paper", Low: "neutral" } as const;

/** Requirements whose text, acceptance or source mention an open item. */
const refsTo = (oi: string) =>
  requirements
    .filter((r) =>
      [...`${r.text} ${r.acceptance} ${r.source ?? ""} ${r.design_element}`.matchAll(ID_RE)].some((m) => expandIds(m[0]).includes(oi)),
    )
    .map((r) => r.id);

export default function OpenItems() {
  const [params] = useSearchParams();
  const focus = params.get("id");
  const [status, setStatus] = useState("all");
  const items = useMemo(() => spec.open_items.filter((o) => status === "all" || o.status === status), [status]);

  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ block: "center" });
  }, [focus]);

  return (
    <>
      <PageHeader eyebrow="Open items & risks" title={`${spec.open_items.length} open items to confirm with the guide`}>
        <p>Details that are missing or ambiguous in the paper. Items stay TBC until the team confirms them.</p>
      </PageHeader>

      <Callout tone="info" title="How to update a status">
        Status, owner and resolution live in <code>spec/spec_data.py</code> (<code>OPEN_ITEMS</code>). Allowed statuses: {STATUSES.join(", ")}.
        Edit there and run <code>python tools/build_all.py</code>; this page, the CSV and the workbooks update together. Nothing is
        stored in the browser.
      </Callout>

      <div className="my-5 flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
        {["all", ...STATUSES].map((s) => {
          const n = s === "all" ? spec.open_items.length : spec.open_items.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm",
                status === s ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-muted hover:text-text",
              )}
            >
              {s === "all" ? "All" : s} <span className="tabular-nums opacity-80">{n}</span>
            </button>
          );
        })}
      </div>

      <motion.ol className="space-y-3" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.02 } } }}>
        {items.map((o) => {
          const refs = refsTo(o.id);
          return (
            <motion.li key={o.id} id={o.id} className="scroll-mt-24" variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
              <Card as="article" className={cx(focus === o.id && "ring-2 ring-[var(--focus)]")}>
                <header className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="font-mono font-semibold">{o.id}</h2>
                  <StatusBadge status={o.status} />
                  {o.owner && <Badge>Owner: {o.owner}</Badge>}
                  {o.updated && <span className="text-xs text-muted">updated {o.updated}</span>}
                </header>
                <p className="text-sm">{o.issue}</p>
                <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Impact</dt>
                    <dd className="mt-0.5">{o.impact}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Proposed handling</dt>
                    <dd className="mt-0.5">{o.proposed_handling}</dd>
                  </div>
                  {o.resolution && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Resolution</dt>
                      <dd className="mt-0.5">{o.resolution}</dd>
                    </div>
                  )}
                  {refs.length > 0 && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Referenced by</dt>
                      <dd className="mt-1">
                        <IdList ids={refs} />
                      </dd>
                    </div>
                  )}
                </dl>
              </Card>
            </motion.li>
          );
        })}
      </motion.ol>

      <h2 className="mt-12 mb-4 text-xl font-semibold" id="risks">
        Risks ({spec.risks.length})
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Risk</th>
              <th scope="col">Likelihood</th>
              <th scope="col">Impact</th>
              <th scope="col">Mitigation</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {spec.risks.map((r) => (
              <tr key={r.id} id={r.id} className={cx("scroll-mt-24", focus === r.id && "bg-primary-soft")}>
                <th scope="row" className="font-mono font-semibold whitespace-nowrap">
                  {r.id}
                </th>
                <td data-label="Risk">{r.risk}</td>
                <td data-label="Likelihood">
                  <Badge tone={LEVEL_TONE[r.likelihood as keyof typeof LEVEL_TONE] ?? "neutral"}>{r.likelihood}</Badge>
                </td>
                <td data-label="Impact">
                  <Badge tone={LEVEL_TONE[r.impact as keyof typeof LEVEL_TONE] ?? "neutral"}>{r.impact}</Badge>
                </td>
                <td data-label="Mitigation">{r.mitigation}</td>
                <td data-label="Owner" className="whitespace-nowrap">
                  {r.owner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
