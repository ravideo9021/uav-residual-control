import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { spec } from "../lib/content";
import { CommandPalette } from "./CommandPalette";
import { Dialog } from "./Dialog";
import { ThemeToggle } from "./ThemeToggle";
import { cx } from "./ui";

export const NAV = [
  { to: "/", label: "Overview" },
  { to: "/paper", label: "The paper" },
  { to: "/presentation", label: "Presentation" },
  { to: "/requirements", label: "Requirements" },
  { to: "/traceability", label: "Traceability" },
  { to: "/diagrams", label: "Architecture & diagrams" },
  { to: "/modules", label: "Modules" },
  { to: "/tests", label: "Test plan" },
  { to: "/open-items", label: "Open items & risks" },
  { to: "/schedule", label: "Schedule" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/wireframes", label: "Wireframes" },
  { to: "/downloads", label: "Downloads" },
];

function NavList({ onNavigate, layoutKey }: { onNavigate?: () => void; layoutKey: string }) {
  return (
    <ul className="space-y-0.5">
      {NAV.map((n) => (
        <li key={n.to}>
          <NavLink
            to={n.to}
            end={n.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                "relative block rounded-full px-4 py-2 font-display text-[0.95rem] font-bold tracking-[0.08em] uppercase transition-colors",
                isActive ? "text-on-primary" : "text-muted hover:bg-surface-2 hover:text-text",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId={layoutKey}
                    className="absolute inset-0 -z-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">{n.label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.title = `${NAV.find((n) => n.to === location.pathname)?.label ?? "Overview"} · ResLand Hub`;
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#main" className="sr-only-focusable fixed top-2 left-2 z-50 rounded-lg bg-primary px-3 py-2 text-on-primary">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface/80 px-3 py-5 backdrop-blur lg:flex">
        <Brand />
        <nav aria-label="Main" className="mt-6 flex-1 overflow-y-auto">
          <NavList layoutKey="nav-desktop" />
        </nav>
        <div aria-hidden="true" className="motif mx-3 mb-3" />
        <p className="px-3 text-xs text-muted">
          Spec v{spec.meta.version} · {spec.meta.date}
        </p>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-bg/85 px-4 py-2.5 backdrop-blur sm:px-6">
          <button
            type="button"
            className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text lg:hidden"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-auto flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface px-3.5 text-sm text-muted transition-colors hover:border-primary sm:w-72 sm:justify-start lg:ml-0"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="9" r="6" />
              <path d="m14 14 4 4" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Search…</span>
            <span className="sr-only sm:hidden">Search</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 text-xs sm:block">{isMac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 outline-none sm:px-6 sm:py-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted sm:px-6">
          <p>
            {spec.meta.code_name} — {spec.meta.title}. Design stage: no module is implemented and no test has been
            executed. Numbers from the paper are labelled “Paper-reported”; the model is phenomenological and
            simulation-only, not real-flight evidence. Generated from <code>spec/spec.json</code>.
          </p>
        </footer>
      </div>

      <Dialog open={navOpen} onClose={() => setNavOpen(false)} title="Navigation">
        <nav aria-label="Main (mobile)" className="p-3">
          <NavList layoutKey="nav-mobile" onNavigate={() => setNavOpen(false)} />
        </nav>
      </Dialog>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 px-2">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-primary text-on-primary">
        <svg viewBox="0 0 32 32" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 23h20M16 6v10m-5-4 5 4 5-4" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-xl font-extrabold tracking-[0.06em] uppercase">ResLand</span>
        {!compact && <span className="eyebrow block text-[0.65rem]">Project hub</span>}
      </span>
    </NavLink>
  );
}
