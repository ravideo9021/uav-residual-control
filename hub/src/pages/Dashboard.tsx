import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";
import { ZoomView } from "../components/ZoomView";
import { Callout, Card, cx, IdChip, PageHeader } from "../components/ui";
import { fileUrl } from "../lib/content";

const SCREENS = [
  { file: "setup.png", title: "Experiment Setup", wireframe: "W-01a", state: "Valid configuration",
    text: "Presets from configs/, controller and speed pills (extrapolation speeds marked †), read-only Table I constants, TBC badges for open items, field-level validation with allowed ranges." },
  { file: "simulation.png", title: "Simulation View", wireframe: "W-02a", state: "Completion layout (no data)",
    text: "Trial picker, time slider, side view of UAV and platform, four signals with final-approach shading and the gate trace for Res-G." },
  { file: "comparison.png", title: "Controller Comparison", wireframe: "W-03", state: "Completion layout (no data)",
    text: "Controllers in fixed colours on one paired seed; roll, lateral mismatch, altitude and vertical velocity on a shared time axis." },
  { file: "results.png", title: "Results & Analysis", wireframe: "W-04a", state: "Completion layout (no data)",
    text: "Key figures, envelope success with Wilson whiskers, the Table III layout with Paper-reported beside Reproduced columns, paired differences and exports." },
  { file: "results-error.png", title: "Run error", wireframe: "W-04b", state: "Run error",
    text: "What pressing Run shows today: the back end (M1, M6) is a design-stage stub, so no simulation runs and no result is produced." },
];

const LIVE_URL = import.meta.env.VITE_DASHBOARD_URL;

export default function Dashboard() {
  const [i, setI] = useState(0);
  const s = SCREENS[i];
  return (
    <>
      <PageHeader eyebrow="Simulator dashboard · Streamlit" title="The ResLand dashboard">
        <p>
          The four-screen Streamlit app (FR-UI-01..05) shares this hub’s look. The screenshots are of the real app; it shows no
          results yet because the simulator modules are still design-stage stubs.
        </p>
      </PageHeader>

      {LIVE_URL ? (
        <Card className="mb-8 p-0 sm:p-0">
          <iframe src={`${LIVE_URL}?embed=true`} title="ResLand Streamlit dashboard (live)" className="h-[80dvh] w-full rounded-[18px]" loading="lazy" />
        </Card>
      ) : (
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <Callout tone="info" title="Run it locally">
            The dashboard needs a Python server, so it is not part of this static site. From the repository root:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-surface p-3 font-mono text-xs text-text">
              {"uv venv --python 3.12 .venv\nuv pip install -e '.[dev]'\n.venv/bin/streamlit run src/resland/ui/app.py"}
            </pre>
          </Callout>
          <Callout tone="paper" title="Embed a hosted copy">
            Deploy <code>src/resland/ui/app.py</code> (for example on Streamlit Community Cloud), then rebuild this site with
            <code> VITE_DASHBOARD_URL=&lt;app url&gt;</code>; this page then shows the live dashboard instead of screenshots.
          </Callout>
        </div>
      )}

      <div role="tablist" aria-label="Dashboard screen" className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {SCREENS.map((x, k) => (
          <button
            key={x.file}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
            className={cx(
              "min-h-11 shrink-0 cursor-pointer rounded-full border px-4 py-2 font-display text-sm font-bold tracking-[0.08em] uppercase transition-colors",
              k === i ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-muted hover:border-primary hover:text-text",
            )}
          >
            {x.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={s.file} role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="grid gap-4 lg:grid-cols-[1fr_19rem]">
          <div className="h-[62dvh] min-h-80">
            <ZoomView label={`Dashboard screenshot: ${s.title}`}>
              <img src={fileUrl(`design/dashboard/${s.file}`)} alt={`Screenshot of the ResLand dashboard: ${s.title} (${s.state})`} className="max-h-[60dvh] w-auto max-w-full" />
            </ZoomView>
          </div>
          <Card as="div" className="space-y-3 text-sm">
            <h2 className="text-xl font-extrabold uppercase">{s.title}</h2>
            <p className="flex flex-wrap items-center gap-2">
              <IdChip id={s.wireframe} /> <span className="text-muted">{s.state}</span>
            </p>
            <p>{s.text}</p>
            <p className="text-muted">
              Compare with the <Link className="text-primary underline" to={`/wireframes?id=${s.wireframe}`}>wireframe</Link>.
            </p>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
