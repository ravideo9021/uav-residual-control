import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { spec } from "../lib/content";
import { Dialog } from "./Dialog";
import { Badge, hrefFor } from "./ui";

interface Entry {
  id: string;
  kind: string;
  title: string;
  hay: string;
}

const INDEX: Entry[] = [
  ...spec.fr.map((r) => ({ id: r.id, kind: "Requirement", title: r.text, hay: `${r.category} ${r.design_element}` })),
  ...spec.nfr.map((r) => ({ id: r.id, kind: "Non-functional", title: r.text, hay: r.category })),
  ...spec.tests.map((t) => ({ id: t.id, kind: `Test · ${t.level}`, title: t.title, hay: `${t.expected} ${t.requirements.join(" ")}` })),
  ...spec.modules.map((m) => ({ id: m.id, kind: "Module", title: `${m.name} (${m.package})`, hay: m.responsibilities.join(" ") })),
  ...spec.open_items.map((o) => ({ id: o.id, kind: `Open item · ${o.status}`, title: o.issue, hay: o.proposed_handling })),
  ...spec.diagrams.map((d) => ({ id: d.id, kind: "Diagram", title: d.title, hay: d.section })),
  ...spec.wireframes.map((w) => ({ id: w.id, kind: "Wireframe", title: w.title, hay: w.notes.join(" ") })),
  ...spec.risks.map((r) => ({ id: r.id, kind: "Risk", title: r.risk, hay: r.mitigation })),
].map((e) => ({ ...e, hay: `${e.id} ${e.title} ${e.hay}`.toLowerCase() }));

function search(q: string): Entry[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return INDEX.filter((e) => /^(FR-CFG|M\d|OI-0[1-3])/.test(e.id)).slice(0, 8);
  const scored: [number, Entry][] = [];
  for (const e of INDEX) {
    let score = 0;
    for (const t of terms) {
      const idHit = e.id.toLowerCase().startsWith(t) ? 10 : 0;
      const at = e.hay.indexOf(t);
      if (at < 0 && !idHit) {
        score = -1;
        break;
      }
      score += idHit + (e.title.toLowerCase().includes(t) ? 3 : 1);
    }
    if (score > 0) scored.push([score, e]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 30).map(([, e]) => e);
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const navigate = useNavigate();
  const results = useMemo(() => search(q), [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);
  useEffect(() => setActive(0), [q]);

  const go = (e: Entry | undefined) => {
    if (!e) return;
    const href = hrefFor(e.id);
    onClose();
    if (href) navigate(href);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Search the project" variant="palette" initialFocus={inputRef}>
      <div className="flex items-center gap-2 border-b border-border px-4">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[active]);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
          aria-autocomplete="list"
          aria-label="Search requirements, tests, modules, open items"
          placeholder="Search requirements, tests, modules, open items…"
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded border border-border px-1.5 text-xs text-muted sm:block">Esc</kbd>
      </div>
      <ul id={listId} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
        {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{q}”.</li>}
        {results.map((e, i) => (
          <li
            key={e.id}
            id={`${listId}-${e.id}`}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => go(e)}
            className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 ${i === active ? "bg-primary-soft" : ""}`}
          >
            <span className="mt-0.5 w-20 shrink-0 font-mono text-xs font-semibold text-primary-strong">{e.id}</span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm">{e.title}</span>
              <Badge className="mt-1">{e.kind}</Badge>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-4 py-2 text-xs text-muted">
        <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · {INDEX.length} indexed items
      </p>
    </Dialog>
  );
}
