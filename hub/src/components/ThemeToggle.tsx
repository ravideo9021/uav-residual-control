import { useEffect, useState } from "react";

/**
 * Two-state colour-scheme toggle: "system" (no stored value) or an override opposite to the system preference.
 * The override lives in <meta name="color-scheme"> (mapped to CSS color-scheme in index.css) and localStorage.
 */
const KEY = "color-scheme";
const meta = () => document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
const systemDark = () => matchMedia("(prefers-color-scheme: dark)").matches;

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function apply(value: string | null) {
  const m = meta();
  if (m) m.content = value ?? "light dark";
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: theme still applied for this page */
  }
}

export function ThemeToggle() {
  const [stored, setStored] = useState<string | null>(read);
  const [sysDark, setSysDark] = useState(systemDark);
  const renderedDark = stored ? stored === "dark" : sysDark;

  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => setSysDark(mq.matches);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        setStored(e.newValue);
        const m = meta();
        if (m) m.content = e.newValue ?? "light dark";
      }
    };
    mq.addEventListener("change", onMq);
    window.addEventListener("storage", onStorage);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = () => {
    const target = renderedDark ? "light" : "dark";
    // Matching the system preference means "undo my override": store nothing.
    const next = (target === "dark") === systemDark() ? null : target;
    apply(next);
    setStored(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-text"
      aria-label={renderedDark ? "Switch to light theme" : "Switch to dark theme"}
      title={renderedDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {renderedDark ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
        </svg>
      )}
    </button>
  );
}
