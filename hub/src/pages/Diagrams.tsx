import { motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { useSearchParams } from "react-router";
import { Dialog } from "../components/Dialog";
import { ZoomView } from "../components/ZoomView";
import { Badge, btnCls, cx, IdList, PageHeader } from "../components/ui";
import { content, diagramById, fileUrl, requirements, spec } from "../lib/content";
import type { Diagram } from "../lib/types";

const isDark = () => {
  const m = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.content;
  return m === "dark" || (m !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
};

function MermaidLive({ source, id }: { source: string; id: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  useEffect(() => {
    let alive = true;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: isDark() ? "dark" : "default" });
        const { svg } = await mermaid.render(`m${uid}${id.replace(/\W/g, "")}`, source);
        if (alive) setSvg(svg);
      })
      .catch((e: unknown) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [source, id, uid]);
  if (error) return <p className="p-4 text-sm text-tbc-fg">Mermaid could not render this source: {error}</p>;
  if (!svg) return <p className="p-4 text-sm text-muted">Rendering Mermaid source…</p>;
  return <div className="flex h-full w-full items-center justify-center bg-surface p-4 [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Viewer({ d }: { d: Diagram }) {
  const [mode, setMode] = useState<"rendered" | "live">("rendered");
  const linked = requirements.filter((r) => r.diagrams.includes(d.id)).map((r) => r.id);
  const mmd = d.mermaid[0];
  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div role="tablist" aria-label="View" className="inline-flex w-fit rounded-lg border border-border p-0.5">
          {(
            [
              ["rendered", "Rendered figure"],
              ["live", "Live Mermaid"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={mode === v}
              disabled={v === "live" && !mmd}
              onClick={() => setMode(v)}
              className={cx("rounded-md px-3 py-1.5 text-sm", mode === v ? "bg-primary text-on-primary" : "text-muted hover:text-text")}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          <ZoomView label={`${d.id} ${d.title}`}>
            {mode === "rendered" ? (
              <img src={fileUrl(`diagrams/rendered/${d.rendered}.svg`)} alt={`${d.id}: ${d.title}`} className="max-h-[70dvh] w-auto max-w-full" />
            ) : (
              <MermaidLive source={content.mermaid[mmd]} id={d.id} />
            )}
          </ZoomView>
        </div>
      </div>
      <aside className="space-y-4 text-sm lg:w-72 lg:overflow-y-auto">
        <div>
          <p className="text-muted">Specification {d.section}</p>
          <p className="mt-1">{d.sources_note}</p>
        </div>
        <div>
          <h3 className="mb-1.5 font-semibold">Sources</h3>
          <ul className="space-y-1">
            {d.drawio.map((f) => (
              <li key={f}>
                <a className="text-primary underline underline-offset-2" href={fileUrl(`diagrams/drawio/${f}`)} download>
                  {f}
                </a>{" "}
                <Badge>draw.io</Badge>
              </li>
            ))}
            {d.mermaid.map((f) => (
              <li key={f}>
                <a className="text-primary underline underline-offset-2" href={fileUrl(`diagrams/mermaid/${f}`)} download>
                  {f}
                </a>{" "}
                <Badge>Mermaid</Badge>
              </li>
            ))}
            <li>
              <a className="text-primary underline underline-offset-2" href={fileUrl(`diagrams/rendered/${d.rendered}.svg`)} target="_blank" rel="noreferrer">
                {d.rendered}.svg
              </a>{" "}
              <Badge>rendered</Badge>
            </li>
          </ul>
          {d.drawio.length === 0 && <p className="mt-1 text-xs text-muted">No draw.io source: this diagram exists as Mermaid only.</p>}
        </div>
        <div>
          <h3 className="mb-1.5 font-semibold">Linked requirements ({linked.length})</h3>
          <IdList ids={linked} empty="Not referenced by a requirement's diagram column" />
        </div>
      </aside>
    </div>
  );
}

export default function Diagrams() {
  const [params, setParams] = useSearchParams();
  const current = diagramById.get(params.get("id") ?? "") ?? null;
  return (
    <>
      <PageHeader eyebrow="Architecture & diagrams" title={`${spec.diagrams.length} design diagrams`}>
        <p>
          Rendered figures from the specification, with zoom and pan, a live Mermaid rendering of each source, and links to the
          editable <code>.drawio</code> and <code>.mmd</code> files in <code>diagrams/</code>.
        </p>
      </PageHeader>
      <motion.ul
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.03 } } }}
      >
        {spec.diagrams.map((d) => (
          <motion.li key={d.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
            <button
              type="button"
              onClick={() => setParams({ id: d.id })}
              className="group block h-full w-full overflow-hidden rounded-[18px] border border-border bg-surface text-left transition-colors hover:border-primary"
            >
              <span className="block aspect-[16/10] overflow-hidden bg-white p-2">
                <img
                  src={fileUrl(`diagrams/rendered/${d.rendered}.svg`)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="block border-t border-border p-3">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-primary-strong">{d.id}</span>
                  <span className="text-xs text-muted">{d.section}</span>
                </span>
                <span className="mt-0.5 block text-sm font-medium">{d.title}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </motion.ul>
      <Dialog
        open={!!current}
        onClose={() => setParams({})}
        variant="center"
        title={
          current && (
            <span>
              <span className="font-mono">{current.id}</span> {current.title}
            </span>
          )
        }
        headerExtra={
          current && (
            <a className={cx(btnCls, "hidden py-1 sm:inline-flex")} href={fileUrl(`diagrams/rendered/${current.rendered}.svg`)} download>
              SVG
            </a>
          )
        }
      >
        {current && <Viewer key={current.id} d={current} />}
      </Dialog>
    </>
  );
}
