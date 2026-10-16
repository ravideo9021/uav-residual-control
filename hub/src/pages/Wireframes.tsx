import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "react-router";
import { ZoomView } from "../components/ZoomView";
import { btnCls, Card, cx, Field, IdList, Linkify, PageHeader } from "../components/ui";
import { expandIds, fileUrl, spec } from "../lib/content";

export default function Wireframes() {
  const [params, setParams] = useSearchParams();
  const w = spec.wireframes.find((x) => x.id === params.get("id")) ?? spec.wireframes[0];
  const screen = spec.screens.find((s) => s.id === w.screen);
  const supports = w.supports.flatMap(expandIds);

  return (
    <>
      <PageHeader eyebrow="Wireframes" title="Streamlit dashboard wireframes">
        <p>
          Four screens and their states (W-01a…W-04b). These are the design for the simulator UI, not screenshots of a running app.
        </p>
      </PageHeader>

      <div role="tablist" aria-label="Wireframe frame" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {spec.wireframes.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={x.id === w.id}
            onClick={() => setParams({ id: x.id })}
            className={cx(
              "shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              x.id === w.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary",
            )}
          >
            <span className="block font-mono font-semibold">{x.id}</span>
            <span className="block max-w-40 truncate text-xs text-muted">{x.title.split(" - ")[1] ?? x.title}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={w.id}
          role="tabpanel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid gap-4 lg:grid-cols-[1fr_20rem]"
        >
          <div className="h-[60dvh] min-h-80">
            <ZoomView label={`${w.id} ${w.title}`}>
              <img src={fileUrl(`design/wireframes/${w.image}`)} alt={`Wireframe ${w.id}: ${w.title}`} className="max-h-[58dvh] w-auto max-w-full" />
            </ZoomView>
          </div>
          <Card as="div" className="space-y-4 text-sm">
            <div>
              <h2 className="font-semibold">
                <span className="font-mono">{w.id}</span> · {w.title}
              </h2>
            </div>
            <dl className="space-y-4">
              <Field label="Supports">
                <IdList ids={supports} />
              </Field>
            {w.notes.length > 0 && (
              <Field label="Annotations">
                <ul className="list-disc space-y-1 pl-5">
                  {w.notes.map((n, i) => (
                    <li key={i}>
                      <Linkify text={n} />
                    </li>
                  ))}
                </ul>
              </Field>
            )}
            </dl>
            {screen && (
              <>
                <h3 className="border-t border-border pt-4 font-semibold">
                  Screen {screen.id} · {screen.name}
                </h3>
                <dl className="space-y-4">
                  <Field label="Purpose">{screen.purpose}</Field>
                  <Field label="Design rationale">{screen.design_decisions}</Field>
                  <Field label="States shown">{screen.states}</Field>
                </dl>
              </>
            )}
            <a className={btnCls} href={fileUrl("design/wireframes/ResLand_Dashboard_Wireframes.html")} target="_blank" rel="noreferrer">
              Open the HTML wireframes
            </a>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
