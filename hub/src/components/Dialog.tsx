import { AnimatePresence, motion, type TargetAndTransition } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { cx } from "./ui";

type Variant = "side" | "center" | "palette";

const MOTION: Record<Variant, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
  side: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  center: { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } },
  palette: { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } },
};

const PANEL: Record<Variant, string> = {
  side: "fixed inset-y-0 right-0 flex h-dvh w-full max-w-xl flex-col border-l border-border bg-surface shadow-2xl",
  center: "fixed inset-2 flex flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-2xl sm:inset-6",
  palette: "fixed inset-x-2 top-[8vh] mx-auto flex max-h-[75dvh] max-w-2xl flex-col overflow-hidden rounded-[18px] border border-border bg-surface shadow-2xl",
};

/**
 * Native modal <dialog> (focus trap, Esc, inert page) with a Motion slide/fade.
 * The dialog stays open until the exit animation finishes, then closes.
 */
export function Dialog({
  open,
  onClose,
  title,
  variant = "side",
  children,
  headerExtra,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  variant?: Variant;
  children: ReactNode;
  headerExtra?: ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) {
      d.showModal();
      initialFocus?.current?.focus();
    }
  }, [open, initialFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="h-dvh w-dvw"
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open && (
          <motion.div
            key="panel"
            {...MOTION[variant]}
            transition={{ type: "tween", duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className={PANEL[variant]}
          >
            {variant !== "palette" && (
              <div className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5">
                <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold">
                  {title}
                </h2>
                {headerExtra}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text"
                  aria-label="Close"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
            {variant === "palette" && (
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
            )}
            <div className={cx("min-h-0 flex-1", variant !== "center" && "overflow-y-auto")}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}
