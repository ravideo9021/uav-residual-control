import { motion } from "motion/react";
import { Link } from "react-router";
import { Callout, Card, Linkify, Provenance } from "../components/ui";
import { spec } from "../lib/content";
import type { Para, PaperTable } from "../lib/types";

function Prose({ paras }: { paras: Para[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (list.length) {
      out.push(
        <ul key={`l${k}`} className="my-3 list-disc space-y-1.5 pl-5 marker:text-primary">
          {list.map((t, i) => (
            <li key={i}>
              <Linkify text={t} />
            </li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  paras.forEach((p, i) => {
    if (p.kind === "li") list.push(p.text);
    else {
      flush(i);
      out.push(
        <p key={i} className="mt-3 first:mt-0">
          <Linkify text={p.text} />
        </p>,
      );
    }
  });
  flush(paras.length);
  return <div className="text-[0.95rem] leading-relaxed">{out}</div>;
}

const stats = [
  { n: spec.fr.length, label: "Functional requirements", to: "/requirements" },
  { n: spec.nfr.length, label: "Non-functional requirements", to: "/requirements" },
  { n: spec.modules.length, label: "Modules (M1–M9)", to: "/modules" },
  { n: spec.tests.length, label: "Test cases · all not executed", to: "/tests" },
  { n: spec.open_items.length, label: "Open items (TBC)", to: "/open-items" },
  { n: spec.diagrams.length, label: "Design diagrams", to: "/diagrams" },
];

function PaperRefTable({ name, t }: { name: string; t: PaperTable }) {
  return (
    <details className="group rounded-[18px] border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 text-muted transition-transform group-open:rotate-90" fill="currentColor">
          <path d="M7 5l6 5-6 5z" />
        </svg>
        {name.replace("table", "Paper Table ").replace(/(\d)$/, (d) => ["", "I", "II", "III", "IV", "V"][Number(d)])}
        <Provenance />
        <span className="ml-auto hidden text-xs text-muted sm:inline">{t.file}</span>
      </summary>
      <div className="space-y-2 px-4 pb-4">
        {t.notes.map((n, i) => (
          <p key={i} className="text-xs text-muted">
            {n}
          </p>
        ))}
        <div className="table-wrap max-h-96">
          <table>
            <thead>
              <tr>
                {t.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r, i) => (
                <tr key={i}>
                  {t.columns.map((c) => (
                    <td key={c} data-label={c} className="tabular-nums">
                      {r[c] || "—"}
                    </td>
                  ))}
                  <td data-label="Source">
                    <Provenance />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

export default function Overview() {
  const n = spec.narrative;
  const pr = spec.paper_results;
  return (
    <div className="space-y-10">
      <section aria-labelledby="hero-title" className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-10 pb-8 sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-16">
        <p className="eyebrow text-sm">
          {spec.meta.code_name} · B.Tech CSE final-year project · specification v{spec.meta.version}
        </p>
        <h1 id="hero-title" className="mt-3 max-w-5xl font-display text-4xl leading-[0.98] font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl">
          Landing on a <span className="text-primary">moving platform</span>, with a learned residual and an honest evaluation
        </h1>
        <div aria-hidden="true" className="motif mt-5 w-56" />
        <p className="mt-5 max-w-[68ch] text-lg text-muted">
          {spec.meta.title}. Built by {spec.meta.team.map((t) => t.name).join(", ")} ({spec.meta.institution}); guide {spec.meta.guide}.
          It turns the paper <em>{spec.meta.paper.title}</em> into tested, reproducible software.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/paper" className="btn-pill btn-gold">
            Read the paper
          </Link>
          <Link to="/traceability" className="btn-pill btn-ghost">
            Paper → design → tests
          </Link>
          <Link to="/presentation" className="btn-pill btn-ghost">
            Evaluation 2 deck
          </Link>
          <Link to="/dashboard" className="btn-pill btn-ghost">
            Simulator dashboard
          </Link>
        </div>
      </section>

      <div className="strip -mx-4 overflow-hidden py-2.5 text-sm sm:-mx-6" role="note" aria-label="Method at a glance">
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
          {["100 Hz reduced-order simulation", "Cascaded PID", "Residual MLP 24-64-64-32-2", "State-distance gate", "500-trial Monte Carlo", "Wilson + paired bootstrap"].map((t, i) => (
            <li key={t} className="flex items-center gap-4">
              {i > 0 && <span aria-hidden="true" className="size-1.5 rotate-45 bg-current opacity-70" />}
              {t}
            </li>
          ))}
        </ul>
      </div>

      <Callout tone="paper" title="Scope of claims">
        {spec.meta.callouts.scope_caution.replace(/^Caution\. Scope of claims\.\s*/, "")}
      </Callout>

      <motion.ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}
      >
        {stats.map((s) => (
          <motion.li key={s.label} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
            <Link
              to={s.to}
              className="block h-full rounded-[18px] border border-border bg-surface p-4 transition-colors hover:border-primary"
            >
              <span className="block text-2xl font-bold text-primary-strong tabular-nums">{s.n}</span>
              <span className="text-sm text-muted">{s.label}</span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
      <p className="-mt-6 text-xs text-muted">Counts of specification items (not experimental results).</p>

      <section aria-labelledby="problem" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 id="problem" className="mb-3 text-lg font-semibold">
            Problem
          </h2>
          <Prose paras={n.problem_statement} />
        </Card>
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Summary</h2>
          <Prose paras={n.executive_summary.slice(0, 2)} />
        </Card>
      </section>

      <section aria-labelledby="objectives">
        <h2 id="objectives" className="mb-3 text-xl font-semibold">
          Objectives
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-2 font-semibold">Primary (MVP)</h3>
            <Prose paras={n.objectives_primary} />
          </Card>
          <Card>
            <h3 className="mb-2 font-semibold">Secondary (extensions, after MVP)</h3>
            <Prose paras={n.objectives_secondary} />
          </Card>
        </div>
      </section>

      <section aria-labelledby="scope">
        <h2 id="scope" className="mb-3 text-xl font-semibold">
          Scope
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["In scope", n.scope_in],
              ["Exclusions", n.exclusions],
              ["Assumptions", n.assumptions],
              ["Constraints", n.constraints],
            ] as const
          ).map(([t, p]) => (
            <Card key={t}>
              <h3 className="mb-2 font-semibold">{t}</h3>
              <Prose paras={p} />
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="results">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 id="results" className="text-xl font-semibold">
            Key results reported by the paper
          </h2>
          <Provenance />
        </div>
        <p className="mb-4 max-w-3xl text-sm text-muted">
          Reference values copied from the paper for orientation. They have <strong>not</strong> been reproduced by this
          project; reproduced values will appear beside them, labelled “Reproduced”, once the simulator exists. Source:{" "}
          {pr.source}.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="px-3 py-2 text-left text-sm font-medium">{pr.caption}</caption>
            <thead>
              <tr>
                <th scope="col">Condition</th>
                {pr.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {pr.rows.map((r) => (
                <tr key={r.condition}>
                  <th scope="row" className="font-medium">
                    {r.condition}
                  </th>
                  {pr.columns.map((c) => (
                    <td key={c} data-label={c} className="tabular-nums whitespace-nowrap">
                      {r[c]}
                    </td>
                  ))}
                  <td data-label="Source">
                    <Provenance />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-2 text-sm text-muted">
          {pr.notes.slice(1).map((t, i) => (
            <p key={i}>
              <Provenance /> <Linkify text={t} />
            </p>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {Object.entries(spec.paper_reference).map(([k, t]) => (
            <PaperRefTable key={k} name={k} t={t} />
          ))}
        </div>
      </section>

      <section aria-labelledby="bridge">
        <p className="eyebrow text-sm">Combined view</p>
        <h2 id="bridge" className="mt-1 mb-2 text-2xl font-extrabold uppercase sm:text-3xl">
          From paper to software
        </h2>
        <p className="mb-4 max-w-[68ch] text-muted">
          Each element of the paper, the ResLand design element that realises it, the requirements that pin it down and how faithful
          the reproduction will be. The same links appear inline in <Link className="text-primary underline" to="/paper">the paper reader</Link>.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Paper element</th>
                <th scope="col">Design element</th>
                <th scope="col">Requirements</th>
                <th scope="col">Fidelity</th>
              </tr>
            </thead>
            <tbody>
              {spec.tables.paper_mapping.map((r) => (
                <tr key={r["Paper element"]}>
                  <th scope="row" className="font-medium">
                    {r["Paper element"]}
                  </th>
                  <td data-label="Design element">{r["Design element"]}</td>
                  <td data-label="Requirements">
                    <Linkify text={r["Requirements"]} />
                  </td>
                  <td data-label="Fidelity" className="text-muted">
                    <Linkify text={r["Fidelity status"]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="limits" className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 id="limits" className="mb-2 text-lg font-semibold">
            Limitations inherited from the paper
          </h2>
          <Prose paras={n.paper_limitations} />
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Limitations of the planned system</h2>
          <Prose paras={n.system_limitations} />
        </Card>
      </section>
    </div>
  );
}
