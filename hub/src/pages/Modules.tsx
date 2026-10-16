import { motion } from "motion/react";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { Card, cx, Field, IdList, PageHeader } from "../components/ui";
import { modulesOf, requirements, spec } from "../lib/content";

export default function Modules() {
  const [params] = useSearchParams();
  const focus = params.get("id");
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView({ block: "start" });
  }, [focus]);

  return (
    <>
      <PageHeader eyebrow="Modules" title="Nine modules, one layered package">
        <p>
          Package <code>resland</code> under <code>src/resland/</code>. The import-linter contract enforces the layers (UI →
          experiments → evaluation/visualisation → residual model → gating/controllers → simulator → config).
        </p>
      </PageHeader>
      <motion.ul className="grid grid-cols-1 gap-4 lg:grid-cols-2" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        {spec.modules.map((m) => {
          const reqs = requirements.filter((r) => modulesOf(r).includes(m.id) || m.requirements.includes(r.id)).map((r) => r.id);
          return (
            <motion.li key={m.id} id={m.id} className="min-w-0 scroll-mt-20" variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
              <Card as="article" className={cx("h-full", focus === m.id && "ring-2 ring-[var(--focus)]")}>
                <header className="mb-3 flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft font-mono font-bold text-primary-strong">{m.id}</span>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{m.name}</h2>
                    <code className="text-xs text-muted">{m.package}</code>
                  </div>
                </header>
                <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Responsibilities</h3>
                <ul className="mt-1 mb-3 list-disc space-y-1 pl-5 text-sm marker:text-primary">
                  {m.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Public interface</h3>
                <pre className="mt-1 mb-3 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs leading-relaxed">{m.interface.join("\n")}</pre>
                <details className="group mb-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">Inputs, outputs, dependencies and errors</summary>
                  <dl className="mt-3 grid gap-3">
                    <Field label="Inputs">{m.inputs}</Field>
                    <Field label="Outputs">{m.outputs}</Field>
                    <Field label="Dependencies">{m.dependencies}</Field>
                    <Field label="Error conditions">
                      <ul className="list-disc space-y-1 pl-5">
                        {m.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </Field>
                  </dl>
                </details>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Field label={`Requirements (${reqs.length})`}>
                    <IdList ids={reqs} />
                  </Field>
                  <Field label={`Tests (${m.tests.length})`}>
                    <IdList ids={m.tests} />
                  </Field>
                </dl>
              </Card>
            </motion.li>
          );
        })}
      </motion.ul>
    </>
  );
}
