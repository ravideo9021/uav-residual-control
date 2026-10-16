import type { ReactNode } from "react";
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";

function Controls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  const btn = "grid size-9 place-items-center rounded-lg border border-border bg-surface text-text shadow-sm hover:border-primary";
  return (
    <div className="absolute top-3 right-3 z-10 flex gap-1.5">
      <button type="button" className={btn} onClick={() => zoomIn()} aria-label="Zoom in">
        <span aria-hidden="true" className="text-lg leading-none">+</span>
      </button>
      <button type="button" className={btn} onClick={() => zoomOut()} aria-label="Zoom out">
        <span aria-hidden="true" className="text-lg leading-none">−</span>
      </button>
      <button type="button" className={btn} onClick={() => resetTransform()} aria-label="Reset zoom">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 10a6 6 0 1 0 2-4.5M4 3v3h3" />
        </svg>
      </button>
    </div>
  );
}

/** Pan (drag), zoom (wheel, pinch, buttons) and keyboard-reachable controls around any content. */
export function ZoomView({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="relative h-full min-h-[50dvh] overflow-hidden rounded-lg border border-border bg-white" role="group" aria-label={`${label} (drag to pan, scroll or pinch to zoom)`}>
      <TransformWrapper minScale={0.5} maxScale={8} centerOnInit wheel={{ step: 0.15 }}>
        <Controls />
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", justifyContent: "center" }}>
          {children}
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
