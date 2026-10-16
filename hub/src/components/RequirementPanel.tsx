import { Link } from "react-router";
import { diagramById, fileUrl, modulesOf, moduleById, spec, testById } from "../lib/content";
import type { Requirement } from "../lib/types";
import { Dialog } from "./Dialog";
import { Badge, Field, IdChip, Linkify, PriorityBadge, StatusBadge } from "./ui";
import { expandIds } from "../lib/content";

export function RequirementPanel({ req, onClose }: { req: Requirement | null; onClose: () => void }) {
  return (
    <Dialog
      open={!!req}
      onClose={onClose}
      title={
        req && (
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{req.id}</span>
            <PriorityBadge p={req.priority} />
            <StatusBadge status={req.status} />
          </span>
        )
      }
    >
      {req && <Body req={req} />}
    </Dialog>
  );
}

function Body({ req }: { req: Requirement }) {
  const mods = modulesOf(req);
  const diagramRefs = req.diagrams.flatMap(expandIds);
  const wireframeRefs = diagramRefs.filter((d) => d.startsWith("W-"));
  const diagrams = diagramRefs.map((d) => diagramById.get(d)).filter((d) => !!d);
  return (
    <div className="space-y-6 p-4 sm:p-5">
      <div>
        <p className="mb-1 text-sm text-muted">{req.category}</p>
        <p className="text-base leading-relaxed">
          <Linkify text={req.text} />
        </p>
      </div>

      <section className="rounded-lg border border-border bg-surface-2 p-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Acceptance criterion</h3>
        <p className="mt-1 text-sm">
          <Linkify text={req.acceptance} />
        </p>
        <p className="mt-2 text-xs text-muted">Verification: {req.verification}</p>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Design element">
          <code className="font-mono text-[0.8rem]">{req.design_element}</code>
        </Field>
        <Field label="Implementation">
          <code className="font-mono text-[0.8rem] break-all">{req.impl_path || "—"}</code>
        </Field>
        <Field label="Modules">
          <span className="flex flex-wrap gap-1">
            {mods.map((m) => (
              <IdChip key={m} id={m} title={moduleById.get(m)?.name} />
            ))}
          </span>
        </Field>
        {req.input && <Field label="Input">{req.input}</Field>}
        {req.output && <Field label="Expected output">{req.output}</Field>}
        <Field label="Rationale">{req.rationale}</Field>
        <Field label="Source">{req.source ?? req.target_status}</Field>
      </dl>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Tests ({req.tests.length})</h3>
        <ul className="space-y-1.5">
          {req.tests.map((t) => {
            const tc = testById.get(t);
            return (
              <li key={t} className="flex items-start gap-2 text-sm">
                <IdChip id={t} />
                <span className="min-w-0 flex-1">{tc?.title}</span>
                {tc && <StatusBadge status={tc.status} />}
              </li>
            );
          })}
        </ul>
      </section>

      {(diagrams.length > 0 || wireframeRefs.length > 0) && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Diagrams and wireframes</h3>
          <ul className="grid grid-cols-2 gap-2">
            {diagrams.map((d) => (
              <li key={d.id}>
                <Link to={`/diagrams?id=${d.id}`} className="block rounded-lg border border-border p-2 hover:border-primary">
                  <img
                    src={fileUrl(`diagrams/rendered/${d.rendered}.svg`)}
                    alt=""
                    loading="lazy"
                    className="h-24 w-full rounded bg-white object-contain"
                  />
                  <span className="mt-1 block text-xs">
                    <span className="font-mono font-semibold">{d.id}</span> {d.title}
                  </span>
                </Link>
              </li>
            ))}
            {wireframeRefs.map((w) => (
              <li key={w} className="flex items-center gap-2 text-sm">
                <IdChip id={w} /> <Badge>Wireframe</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">
        Defined in <code>spec/spec_data.py</code> · {spec.meta.identifier} v{spec.meta.version}
      </p>
    </div>
  );
}
