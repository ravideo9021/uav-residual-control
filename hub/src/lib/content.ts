import raw from "virtual:resland-content";
import type { Content, Module, OpenItem, Requirement, TestCase } from "./types";

export const content = raw as Content;
export const spec = content.spec;

export const requirements: Requirement[] = [...spec.fr, ...spec.nfr];
export const reqById = new Map(requirements.map((r) => [r.id, r]));
export const testById = new Map<string, TestCase>(spec.tests.map((t) => [t.id, t]));
export const moduleById = new Map<string, Module>(spec.modules.map((m) => [m.id, m]));
export const oiById = new Map<string, OpenItem>(spec.open_items.map((o) => [o.id, o]));
export const diagramById = new Map(spec.diagrams.map((d) => [d.id, d]));

export const TEST_LEVELS = ["Unit", "Integration", "System", "Regression", "Experimental validation"] as const;

/** URL of a repository file published by the content plugin (relative so it works under any base path). */
export const fileUrl = (repoPath: string) => `./files/${repoPath.split("/").map(encodeURIComponent).join("/")}`;

/** Modules a requirement maps to ("M1, M6" or "All"). */
export function modulesOf(r: Requirement): string[] {
  const raw = (r.module ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (raw.includes("All")) return spec.modules.map((m) => m.id);
  if (raw.length) return raw;
  // NFRs carry no module column: derive from the modules that list them.
  return spec.modules.filter((m) => m.requirements.includes(r.id)).map((m) => m.id);
}

/** Expand "FR-CFG-01..04", "UT-01..UT-08", "FR-MC-01/02" into explicit IDs. */
export function expandIds(token: string): string[] {
  const m = token.trim().match(/^([A-Z]+(?:-[A-Z]+)?-)(\d+)(?:\.\.|\/)(?:\1)?(\d+)$/);
  if (!m) return [token.trim()];
  const [, prefix, a, b] = m;
  const out: string[] = [];
  for (let i = Number(a); i <= Number(b); i++) out.push(prefix + String(i).padStart(a.length, "0"));
  return out;
}

export const ID_RE =
  /\b(?:N?FR-[A-Z]+-\d{2}(?:(?:\.\.|\/)(?:N?FR-[A-Z]+-)?\d{2})?|(?:UT|IT|ST|RT|EV)-\d{2}(?:\.\.(?:(?:UT|IT|ST|RT|EV)-)?\d{2})?|OI-\d{2}(?:\.\.(?:OI-)?\d{2})?|D-\d{2}[a-c]?|W-0[1-4][ab]?|M[1-9]\b|R-\d{2})/g;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
