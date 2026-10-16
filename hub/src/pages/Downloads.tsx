import { Badge, Card, PageHeader } from "../components/ui";
import { content, fileUrl, formatBytes, spec } from "../lib/content";

const LABELS: Record<string, string> = {
  "Project_Design_Specification_UAV_Residual_Control.pdf": "Project Design Specification (PDF)",
  "Project_Design_Specification_UAV_Residual_Control.docx": "Project Design Specification (editable DOCX)",
  "UAV_DAGE_Residual_Control_Evaluation2.pptx": "Evaluation 2 presentation",
  "DAGE_Residual_Compensation_UAV_Moving_Platform_Landing.docx": "Research paper",
};

const GROUPS: { title: string; note?: string; match: (p: string) => boolean }[] = [
  { title: "Research paper", note: "The paper ResLand implements. Also readable on the Paper page.", match: (p) => /^docs\/paper\/[^/]+\.docx$/.test(p) },
  { title: "Presentation", note: "Evaluation 2 deck. Also browsable on the Presentation page.", match: (p) => /^docs\/presentation\/[^/]+\.pptx$/.test(p) },
  { title: "Specification", note: "Project Design Specification v0.9 (fixed document).", match: (p) => /^docs\/Project_Design/.test(p) },
];

export default function Downloads() {
  return (
    <>
      <PageHeader eyebrow="Downloads" title="Documents">
        <p>
          Version {spec.meta.version} ({spec.meta.date}). Diagram sources are on the{" "}
          <a className="text-primary underline" href="#/diagrams">
            diagrams page
          </a>
          .
        </p>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const files = content.files.filter((f) => g.match(f.path));
          return (
            <Card key={g.title}>
              <h2 className="text-lg font-semibold">{g.title}</h2>
              {g.note && <p className="mb-3 text-sm text-muted">{g.note}</p>}
              <ul className="mt-2 divide-y divide-border">
                {files.map((f) => {
                  const name = f.path.split("/").pop()!;
                  const ext = name.split(".").pop()!.toUpperCase();
                  return (
                    <li key={f.path} className="flex items-center gap-3 py-2.5">
                      <Badge tone="primary" className="w-14 justify-center">
                        {ext}
                      </Badge>
                      <span className="min-w-0 flex-1">
                        <a href={fileUrl(f.path)} download={ext !== "PDF" && ext !== "HTML" ? name : undefined} target={ext === "PDF" || ext === "HTML" ? "_blank" : undefined} rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                          {LABELS[name] ?? name}
                        </a>
                        <span className="block truncate text-xs text-muted">{f.path}</span>
                      </span>
                      <span className="text-xs whitespace-nowrap text-muted tabular-nums">{formatBytes(f.bytes)}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
