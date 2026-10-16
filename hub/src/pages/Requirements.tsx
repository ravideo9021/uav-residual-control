import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { DataTable, type Features } from "../components/DataTable";
import { RequirementPanel } from "../components/RequirementPanel";
import { IdList, inputCls, PageHeader, PriorityBadge, selectCls } from "../components/ui";
import { modulesOf, reqById, requirements, spec } from "../lib/content";
import type { Requirement } from "../lib/types";

const h = createColumnHelper<Features, Requirement>();
const columns = h.columns([
  h.accessor("id", {
    header: "ID",
    sortFn: "alphanumeric",
    cell: (c) => (
      <button type="button" className="font-mono text-[0.8rem] font-semibold whitespace-nowrap text-primary underline-offset-2 hover:underline">
        {c.getValue()}
      </button>
    ),
  }),
  h.accessor("text", { header: "Requirement", enableSorting: false, cell: (c) => <span className="line-clamp-3 min-w-56">{c.getValue()}</span> }),
  h.accessor("group", { header: "Group", cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span> }),
  h.accessor("priority", { header: "Priority", cell: (c) => <PriorityBadge p={c.getValue()} /> }),
  h.accessor((r) => modulesOf(r).join(", "), { id: "module", header: "Module", cell: (c) => <IdList ids={modulesOf(c.row.original).slice(0, 3)} /> }),
  h.accessor("verification", { header: "Verification" }),
  h.accessor((r) => r.tests.length, { id: "tests", header: "Tests", cell: (c) => <IdList ids={c.row.original.tests} /> }),
]);

const GROUPS = [...new Set(requirements.map((r) => r.group))];
const VERIFICATIONS = [...new Set(requirements.flatMap((r) => r.verification.split(/,\s*/)))].sort();

export default function Requirements() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [group, setGroup] = useState("all");
  const [priority, setPriority] = useState("all");
  const [module, setModule] = useState("all");
  const [verification, setVerification] = useState("all");

  const selected = reqById.get(params.get("id") ?? "") ?? null;
  const open = (r: Requirement) => setParams({ id: r.id });

  const rows = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    return requirements.filter((r) => {
      if (kind !== "all" && (kind === "FR") !== r.id.startsWith("FR-")) return false;
      if (group !== "all" && r.group !== group) return false;
      if (priority !== "all" && r.priority !== priority) return false;
      if (module !== "all" && !modulesOf(r).includes(module)) return false;
      if (verification !== "all" && !r.verification.includes(verification)) return false;
      const hay = `${r.id} ${r.text} ${r.category} ${r.design_element} ${r.acceptance} ${r.tests.join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [q, kind, group, priority, module, verification]);

  const reset = () => {
    setQ("");
    setKind("all");
    setGroup("all");
    setPriority("all");
    setModule("all");
    setVerification("all");
  };

  return (
    <>
      <PageHeader eyebrow="Requirements explorer" title={`${spec.fr.length} functional and ${spec.nfr.length} non-functional requirements`}>
        <p>Search and filter the catalogue; select a requirement to see its acceptance criterion, design element, diagrams and tests.</p>
      </PageHeader>

      <form role="search" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(5,1fr)]" onSubmit={(e) => e.preventDefault()}>
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search requirements</span>
          <input className={inputCls} type="search" placeholder="Search text, ID, design element…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select label="Type" value={kind} onChange={setKind} options={[["all", "FR + NFR"], ["FR", "Functional"], ["NFR", "Non-functional"]]} />
        <Select label="Group" value={group} onChange={setGroup} options={[["all", "All groups"], ...GROUPS.map((g) => [g, g] as [string, string])]} />
        <Select label="Priority" value={priority} onChange={setPriority} options={[["all", "Any priority"], ["Must", "Must"], ["Should", "Should"], ["Could", "Could"]]} />
        <Select label="Module" value={module} onChange={setModule} options={[["all", "Any module"], ...spec.modules.map((m) => [m.id, `${m.id} ${m.name}`] as [string, string])]} />
        <Select label="Verification" value={verification} onChange={setVerification} options={[["all", "Any verification"], ...VERIFICATIONS.map((v) => [v, v] as [string, string])]} />
      </form>
      <div className="mb-3 flex items-center gap-3 text-sm text-muted" aria-live="polite">
        <span>
          {rows.length} of {requirements.length} requirements
        </span>
        {rows.length !== requirements.length && (
          <button type="button" onClick={reset} className="text-primary underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>

      <DataTable data={rows} columns={columns} caption="Requirements" rowKey={(r) => r.id} onActivate={open} activeKey={selected?.id} />

      <RequirementPanel
        req={selected}
        onClose={() => {
          params.delete("id");
          setParams(params);
        }}
      />
    </>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select className={`${selectCls} w-full`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
