import { spec } from "./content";
import type { Row } from "./types";

/**
 * Joins the paper to the design: the specification's "paper element -> design element -> requirements" table
 * (spec Section 7.2) is indexed by the paper sections, equations and tables each row cites.
 */
export interface Link {
  design: string;
  requirements: string;
  fidelity: string;
  element: string;
}

const rows: Row[] = spec.tables.paper_mapping ?? [];
const toLink = (r: Row): Link => ({
  element: r["Paper element"],
  design: r["Design element"],
  requirements: r["Requirements"],
  fidelity: r["Fidelity status"],
});

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const romanToInt = (s: string) => ROMAN.indexOf(s);

export const bySection = new Map<string, Link[]>();
export const byEquation = new Map<string, Link[]>();
export const byTable = new Map<string, Link[]>();

function add(map: Map<string, Link[]>, key: string, l: Link) {
  const list = map.get(key) ?? [];
  if (!list.includes(l)) list.push(l);
  map.set(key, list);
}

for (const r of rows) {
  const l = toLink(r);
  const el = r["Paper element"];
  // "Sec. V-A", "Sec. VI-A, VI-C", "Sec. V-B, V-D"
  for (const sec of el.match(/Sec\.[^)]*/g) ?? []) {
    for (const m of sec.matchAll(/\b([IVX]+)-([A-H])\b/g)) add(bySection, `${m[1]}-${m[2]}`, l);
  }
  // "Eq. (6)", "Eqs. (9)-(10)", "Eqs. (12)-(13)"
  for (const m of el.matchAll(/Eqs?\.\s*\((\d+)\)(?:\s*-\s*\((\d+)\))?/g)) {
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = a; i <= b; i++) add(byEquation, String(i), l);
  }
  // "Table I", "Tables III-V"
  for (const m of el.matchAll(/Tables?\s+([IVX]+)(?:-([IVX]+))?/g)) {
    const a = romanToInt(m[1]);
    const b = m[2] ? romanToInt(m[2]) : a;
    for (let i = a; i <= b; i++) add(byTable, `TABLE ${ROMAN[i]}`, l);
  }
}

/** "I. Introduction" -> "I"; "A. Scope" -> "A" */
export const sectionNumber = (heading: string) => heading.match(/^([IVX]+|[A-H])\./)?.[1] ?? "";
