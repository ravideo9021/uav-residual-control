/**
 * Vite plugin: exposes the repository's single source of truth to the hub at build time.
 *
 *   import content from "virtual:resland-content"
 *     -> { spec: <spec/spec.json>, mermaid: { "D-01_system_context.mmd": "..." }, files: [...] }
 *
 * Also exposes spec/paper.json and spec/presentation.json (the paper and the deck, extracted from docs/).
 * Repository files (docs/, diagrams/, design/wireframes/) are served under /files/ in dev and copied to
 * dist/files/ on build. Nothing is hand-copied into the hub.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:resland-content";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/** Repo-relative roots published under /files/. */
const PUBLISHED = ["docs", "diagrams/drawio", "diagrams/mermaid", "diagrams/rendered", "design/wireframes", "design/dashboard"];
const EXCLUDE = [/(^|\/)\.DS_Store$/, /^diagrams\/rendered\/mermaid\//, /^docs\/generated\//];

function walk(root: string, rel: string): string[] {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs
    .readdirSync(abs)
    .sort()
    .flatMap((name) => walk(root, path.posix.join(rel, name)));
}

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".csv": "text/csv; charset=utf-8",
  ".mmd": "text/plain; charset=utf-8",
  ".drawio": "application/xml",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export default function reslandContent(repoRoot: string): Plugin {
  const specPath = path.join(repoRoot, "spec", "spec.json");
  const listFiles = () =>
    PUBLISHED.flatMap((p) => walk(repoRoot, p)).filter((f) => !EXCLUDE.some((re) => re.test(f)));

  return {
    name: "resland-content",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      if (!fs.existsSync(specPath)) {
        this.error("spec/spec.json not found: run `python tools/build_all.py` in the repository root first");
      }
      this.addWatchFile(specPath);
      const mermaidDir = path.join(repoRoot, "diagrams", "mermaid");
      const mermaid = Object.fromEntries(
        fs
          .readdirSync(mermaidDir)
          .filter((f) => f.endsWith(".mmd"))
          .sort()
          .map((f) => {
            this.addWatchFile(path.join(mermaidDir, f));
            return [f, fs.readFileSync(path.join(mermaidDir, f), "utf8")];
          }),
      );
      const files = listFiles().map((rel) => ({ path: rel, bytes: fs.statSync(path.join(repoRoot, rel)).size }));
      const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
      // Paper (DOCX) and Evaluation 2 deck (PPTX), extracted by tools/build_all.py; optional.
      const optional = (name: string) => {
        const p = path.join(repoRoot, "spec", name);
        if (!fs.existsSync(p)) return null;
        this.addWatchFile(p);
        return JSON.parse(fs.readFileSync(p, "utf8"));
      };
      const paper = optional("paper.json");
      const presentation = optional("presentation.json");
      return `export default ${JSON.stringify({ spec, mermaid, files, paper, presentation })};`;
    },
    configureServer(server) {
      const allowed = new Set(listFiles());
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? "").split("?")[0]);
        const m = url.match(/\/files\/(.+)$/);
        if (!m || !allowed.has(m[1])) return next();
        res.setHeader("Content-Type", MIME[path.extname(m[1])] ?? "application/octet-stream");
        fs.createReadStream(path.join(repoRoot, m[1])).pipe(res);
      });
    },
    generateBundle() {
      for (const rel of listFiles()) {
        this.emitFile({ type: "asset", fileName: `files/${rel}`, source: fs.readFileSync(path.join(repoRoot, rel)) });
      }
    },
  };
}
