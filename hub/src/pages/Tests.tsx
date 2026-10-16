import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { DataTable, type Features } from "../components/DataTable";
import { Dialog } from "../components/Dialog";
import { Badge, Callout, Card, cx, Field, IdList, PageHeader, StatusBadge } from "../components/ui";
import { spec, TEST_LEVELS, testById } from "../lib/content";
import type { TestCase } from "../lib/types";

const h = createColumnHelper<Features, TestCase>();
const columns = h.columns([
  h.accessor("id", {
    header: "ID",
    sortFn: "alphanumeric",
    cell: (c) => (
      <button type="button" className="font-mono text-[0.8rem] font-semibold text-primary underline-offset-2 hover:underline">
        {c.getValue()}
      </button>
    ),
  }),
  h.accessor("title", { header: "Title", cell: (c) => <span className="min-w-48">{c.getValue()}</span> }),
  h.accessor("type", {
    header: "Type",
    cell: (c) => <Badge tone={c.getValue() === "Software correctness" ? "info" : "paper"}>{c.getValue()}</Badge>,
  }),
  h.accessor((t) => t.requirements.join(" "), { id: "reqs", header: "Requirements", enableSorting: false, cell: (c) => <IdList ids={c.row.original.requirements.filter((r) => /^N?FR-/.test(r))} /> }),
  h.accessor("status", { header: "Status", cell: (c) => <StatusBadge status={c.getValue()} /> }),
]);

export default function Tests() {
  const [params, setParams] = useSearchParams();
  const level = params.get("level") ?? "all";
  const selected = testById.get(params.get("id") ?? "") ?? null;
  const rows = useMemo(() => spec.tests.filter((t) => level === "all" || t.level === level), [level]);
  const executed = spec.tests.filter((t) => t.status !== "Not executed").length;

  const set = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) v === null ? p.delete(k) : p.set(k, v);
    setParams(p);
  };

  return (
    <>
      <PageHeader eyebrow="Test plan" title={`${spec.tests.length} test cases · ${executed} executed`}>
        <p>Status is maintained in <code>spec/spec_data.py</code> and only changes when a test is actually run.</p>
      </PageHeader>

      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Callout tone="info" title="Software correctness (UT, IT, ST, RT)">
          Deterministic pass/fail checks of the code: equations, interfaces, statistics, dashboard states, regressions. Run in CI or at
          sprint end.
        </Callout>
        <Callout tone="paper" title="Experimental validation (EV)">
          Measures how closely ResLand reproduces the paper’s Paper-reported results. A deviation is investigated against the open
          items; it is reported in a fidelity report, not counted as a software failure.
        </Callout>
      </div>

      <div role="tablist" aria-label="Test level" className="mb-4 flex flex-wrap gap-1.5">
        {["all", ...TEST_LEVELS].map((lv) => {
          const n = lv === "all" ? spec.tests.length : spec.tests.filter((t) => t.level === lv).length;
          return (
            <button
              key={lv}
              type="button"
              role="tab"
              aria-selected={level === lv}
              onClick={() => set({ level: lv === "all" ? null : lv })}
              className={cx(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                level === lv ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-muted hover:text-text",
              )}
            >
              {lv === "all" ? "All" : lv} <span className="tabular-nums opacity-80">{n}</span>
            </button>
          );
        })}
      </div>

      <DataTable data={rows} columns={columns} caption="Test cases" rowKey={(t) => t.id} onActivate={(t) => set({ id: t.id })} activeKey={selected?.id} />

      <Card className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Strategy by level</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {Object.keys(spec.test_strategy[0]).map((k) => (
                  <th key={k} scope="col">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spec.test_strategy.map((s) => (
                <tr key={s.Level}>
                  {Object.entries(s).map(([k, v], i) =>
                    i === 0 ? (
                      <th key={k} scope="row" className="font-medium whitespace-nowrap">
                        {v}
                      </th>
                    ) : (
                      <td key={k} data-label={k}>
                        {v}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog
        open={!!selected}
        onClose={() => set({ id: null })}
        title={
          selected && (
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{selected.id}</span> {selected.title}
            </span>
          )
        }
      >
        {selected && (
          <div className="space-y-5 p-4 sm:p-5">
            <p className="flex flex-wrap gap-2">
              <Badge>{selected.level}</Badge>
              <Badge tone={selected.type === "Software correctness" ? "info" : "paper"}>{selected.type}</Badge>
              <StatusBadge status={selected.status} />
            </p>
            <dl className="grid gap-4">
              <Field label="Verifies">
                <IdList ids={selected.requirements} />
              </Field>
              <Field label="Preconditions">{selected.preconditions}</Field>
              <Field label="Steps">{selected.steps}</Field>
              <Field label="Expected result">{selected.expected}</Field>
              <Field label="Pass / fail criterion">{selected.pass_criterion}</Field>
              <Field label="Execution">
                {selected.status === "Not executed" ? (
                  <span className="text-muted">Not executed yet — no result is claimed.</span>
                ) : (
                  <span>
                    {selected.status} by {selected.executed_by} on {selected.date}: {selected.actual}
                  </span>
                )}
              </Field>
            </dl>
          </div>
        )}
      </Dialog>
    </>
  );
}
