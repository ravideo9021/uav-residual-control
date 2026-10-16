import type { ReactNode } from "react";
import { Fragment } from "react";
import { Link } from "react-router";
import { ID_RE, expandIds } from "../lib/content";

const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");
export { cx };

/** Route for any spec ID (requirement, test, module, open item, diagram, wireframe, risk). */
export function hrefFor(id: string): string | null {
  if (/^N?FR-/.test(id)) return `/requirements?id=${id}`;
  if (/^(UT|IT|ST|RT|EV)-/.test(id)) return `/tests?id=${id}`;
  if (/^M[1-9]$/.test(id)) return `/modules?id=${id}`;
  if (/^OI-/.test(id) || /^R-\d/.test(id)) return `/open-items?id=${id}`;
  if (/^D-/.test(id)) return `/diagrams?id=${id}`;
  if (/^W-0\d[ab]?$/.test(id)) return `/wireframes?id=${id.length === 4 ? id + (id === "W-03" ? "" : "a") : id}`;
  return null;
}

export function IdChip({ id, title }: { id: string; title?: string }) {
  const href = hrefFor(id);
  const cls =
    "inline-flex items-center rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.75rem] leading-tight text-text whitespace-nowrap";
  if (!href) return <span className={cls}>{id}</span>;
  return (
    <Link to={href} title={title} className={cx(cls, "hover:border-primary hover:text-primary-strong transition-colors")}>
      {id}
    </Link>
  );
}

export function IdList({ ids, empty = "—" }: { ids: string[]; empty?: string }) {
  if (!ids.length) return <span className="text-muted">{empty}</span>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {ids.map((id) => (
        <IdChip key={id} id={id} />
      ))}
    </span>
  );
}

/** Renders free text with every spec ID (and ID range) turned into a link. */
export function Linkify({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(ID_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(text.slice(last, idx));
    const token = m[0];
    const ids = expandIds(token);
    const href = hrefFor(ids[0]);
    parts.push(
      href ? (
        <Link key={idx} to={href} className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
          {token}
        </Link>
      ) : (
        <Fragment key={idx}>{token}</Fragment>
      ),
    );
    last = idx + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

type Tone = "neutral" | "primary" | "paper" | "repro" | "tbc" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  primary: "bg-primary-soft text-primary-strong border-transparent",
  paper: "bg-paper-bg text-paper-fg border-transparent",
  repro: "bg-repro-bg text-repro-fg border-transparent",
  tbc: "bg-tbc-bg text-tbc-fg border-transparent",
  info: "bg-info-bg text-info-fg border-transparent",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Mandatory label on every displayed result number (CLAUDE.md rule 1). */
export function Provenance({ kind = "Paper-reported" }: { kind?: "Paper-reported" | "Reproduced" }) {
  return (
    <Badge tone={kind === "Paper-reported" ? "paper" : "repro"}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3" fill="currentColor">
        {kind === "Paper-reported" ? (
          <path d="M3 1.5h7l3 3v10H3zM10 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <path d="M6.5 11.2 3.3 8l-1 1 4.2 4.2 7.2-7.2-1-1z" />
        )}
      </svg>
      {kind}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone =
    status === "TBC" ? "tbc" : status === "Pass" || status === "Verified" || status === "Closed" ? "repro" : status === "Fail" ? "tbc" : status === "Proposed" || status === "Not executed" ? "neutral" : "info";
  return <Badge tone={tone}>{status}</Badge>;
}

export function PriorityBadge({ p }: { p: string }) {
  return <Badge tone={p === "Must" ? "primary" : p === "Should" ? "info" : "neutral"}>{p}</Badge>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8 sm:mb-10">
      {eyebrow && <p className="eyebrow mb-2 text-sm">{eyebrow}</p>}
      <h1 className="font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-balance uppercase sm:text-5xl">{title}</h1>
      <div aria-hidden="true" className="motif mt-4 w-40" />
      {children && <div className="mt-4 max-w-[68ch] text-[1.05rem] text-muted">{children}</div>}
    </header>
  );
}

export function Card({ children, className, as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "article" | "div" | "li" }) {
  return <As className={cx("min-w-0 rounded-[18px] border border-border bg-surface/90 p-4 shadow-[0_1px_0_rgb(0_0_0/0.03)] sm:p-6", className)}>{children}</As>;
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "paper" | "tbc"; title: string; children: ReactNode }) {
  const t = { info: "border-info-fg/30 bg-info-bg text-info-fg", paper: "border-paper-fg/30 bg-paper-bg text-paper-fg", tbc: "border-tbc-fg/30 bg-tbc-bg text-tbc-fg" }[tone];
  return (
    <aside className={cx("min-w-0 rounded-[18px] border p-4 text-sm sm:p-5", t)}>
      <p className="font-display text-base font-bold tracking-wider uppercase">{title}</p>
      <div className="mt-1 [&_a]:underline">{children}</div>
    </aside>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="font-display text-xs font-bold tracking-[0.14em] text-saffron uppercase">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export const inputCls =
  "min-h-11 w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-muted focus-visible:border-primary";
export const selectCls = "min-h-11 cursor-pointer rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-text";
export const btnCls = "btn-pill btn-ghost";
