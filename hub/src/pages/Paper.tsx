import { motion } from "motion/react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Callout, Linkify, PageHeader, Provenance } from "../components/ui";
import { content, fileUrl } from "../lib/content";
import { byEquation, bySection, byTable, sectionNumber, type Link } from "../lib/paperLinks";
import type { PaperBlock, Seg } from "../lib/types";

function Runs({ runs }: { runs: Seg[] }) {
  return (
    <>
      {runs.map((s, i) => {
        if (s.m) return <span key={i} className="inline-math" dangerouslySetInnerHTML={{ __html: s.m }} />;
        let node: React.ReactNode = s.t;
        if (s.v === "sup") node = <sup>{node}</sup>;
        if (s.v === "sub") node = <sub>{node}</sub>;
        if (s.i) node = <em>{node}</em>;
        if (s.b) node = <strong>{node}</strong>;
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}

const plain = (runs: Seg[]) => runs.map((s) => s.t ?? "").join("").trim();
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function InResLand({ links }: { links: Link[] }) {
  if (!links.length) return null;
  return (
    <aside className="not-prose my-4 rounded-[14px] border border-[#c9a84c]/50 bg-[#fbf3df] p-3 text-sm text-[#1f1812]" aria-label="In ResLand">
      <p className="font-display text-xs font-bold tracking-[0.16em] text-[#a3420f] uppercase">In ResLand</p>
      <ul className="mt-1 space-y-1.5">
        {links.map((l, i) => (
          <li key={i}>
            <span className="font-semibold">{l.design}</span> · <Linkify text={l.requirements} />
            <span className="block text-xs text-[#5e4b38]">
              Fidelity: <Linkify text={l.fidelity} />
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function Paper() {
  const paper = content.paper;
  const [active, setActive] = useState<string>("");

  const { toc, rendered } = useMemo(() => {
    if (!paper) return { toc: [], rendered: [] as React.ReactNode[] };
    const toc: { id: string; text: string }[] = [];
    const out: React.ReactNode[] = [];
    let h1 = "";
    let list: React.ReactNode[] = [];
    let refs: React.ReactNode[] = [];
    const flush = (k: string) => {
      if (list.length) out.push(<ul key={`ul-${k}`} className="my-3 list-disc space-y-1.5 pl-6 marker:text-[#a3420f]">{list}</ul>);
      list = [];
    };
    paper.blocks.forEach((b: PaperBlock, i) => {
      const k = String(i);
      if (b.type !== "li") flush(k);
      switch (b.type) {
        case "title":
          out.push(
            <h2 key={k} className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
              <Runs runs={b.runs} />
            </h2>,
          );
          break;
        case "authors":
          out.push(<p key={k} className="mt-3 font-semibold"><Runs runs={b.runs} /></p>);
          break;
        case "affil":
          out.push(<p key={k} className="text-sm text-[#5e4b38]"><Runs runs={b.runs} /></p>);
          break;
        case "email":
          break; // contact e-mails are not republished on the hub
        case "abstract":
          out.push(
            <div key={k} className="mt-6 border-l-4 border-[#c9a84c] bg-[#fbf3df] p-4 text-[0.97rem]">
              <Runs runs={b.runs} />
            </div>,
          );
          break;
        case "keywords":
          out.push(<p key={k} className="mt-3 text-sm italic"><Runs runs={b.runs} /></p>);
          break;
        case "h1": {
          const text = plain(b.runs);
          const id = `sec-${slug(text)}`;
          h1 = sectionNumber(text);
          toc.push({ id, text });
          out.push(
            <h2 key={k} id={id} className="mt-10 scroll-mt-24 font-display text-xl font-extrabold tracking-[0.04em] uppercase sm:text-2xl">
              {text}
            </h2>,
          );
          break;
        }
        case "h2": {
          const text = plain(b.runs);
          const key = `${h1}-${sectionNumber(text)}`;
          out.push(
            <h3 key={k} id={`sec-${slug(h1 + "-" + text)}`} className="mt-6 scroll-mt-24 font-display text-lg font-bold">
              {text}
            </h3>,
          );
          out.push(<InResLand key={`${k}-rl`} links={bySection.get(key) ?? []} />);
          break;
        }
        case "p":
          out.push(<p key={k} className="mt-3 leading-[1.75]"><Runs runs={b.runs} /></p>);
          break;
        case "li":
          list.push(<li key={k}><Runs runs={b.runs} /></li>);
          break;
        case "ref":
          refs.push(<li key={k} className="text-sm"><Runs runs={b.runs} /></li>);
          break;
        case "equation":
          out.push(
            <div key={k} className="my-4 flex items-center gap-3">
              <div className="min-w-0 flex-1 overflow-x-auto" dangerouslySetInnerHTML={{ __html: b.math }} />
              {b.number && <span className="shrink-0 text-sm text-[#5e4b38] tabular-nums">({b.number})</span>}
            </div>,
          );
          if (b.number) out.push(<InResLand key={`${k}-rl`} links={(byEquation.get(b.number) ?? []).filter((l, j, a) => a.indexOf(l) === j)} />);
          break;
        case "figure":
          out.push(
            <figure key={k} className="my-6">
              <img src={fileUrl(b.src)} alt={plain(b.caption).slice(0, 160) || "Figure from the paper"} loading="lazy" className="mx-auto max-h-[28rem] w-auto rounded-lg border border-[#dccab0] bg-white" />
              <figcaption className="mt-2 text-sm text-[#5e4b38]">
                <Runs runs={b.caption} /> <Provenance />
              </figcaption>
            </figure>,
          );
          break;
        case "table": {
          const [head, ...body] = b.rows;
          out.push(
            <figure key={k} className="my-6">
              <figcaption className="mb-2 text-center text-sm">
                <span className="font-display font-bold tracking-[0.12em]">{b.label}</span>
                {b.caption && b.caption.length > 0 && (
                  <span className="block text-[#5e4b38]">
                    <Runs runs={b.caption} />
                  </span>
                )}
                <span className="mt-1 inline-block">
                  <Provenance />
                </span>
              </figcaption>
              <div className="overflow-x-auto rounded-[14px] border border-[#dccab0]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[#efe3cd]">
                    <tr>
                      {head.map((c, j) => (
                        <th key={j} scope="col" className="px-2.5 py-2 text-left font-semibold whitespace-nowrap">
                          <Runs runs={c} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {body.map((r, ri) => (
                      <tr key={ri} className="border-t border-[#e6d8bf]">
                        {r.map((c, j) => (
                          <td key={j} className="px-2.5 py-1.5 align-top tabular-nums">
                            <Runs runs={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <InResLand links={byTable.get(b.label ?? "") ?? []} />
            </figure>,
          );
          break;
        }
      }
    });
    flush("end");
    if (refs.length) {
      out.push(
        <ol key="refs" className="mt-3 space-y-1.5 pl-1">
          {refs}
        </ol>,
      );
      refs = [];
    }
    return { toc, rendered: out };
  }, [paper]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [toc]);

  if (!paper) {
    return (
      <PageHeader eyebrow="The paper" title="Paper not found">
        <p>
          Put the paper DOCX in <code>docs/paper/</code> and run <code>python tools/build_all.py</code>.
        </p>
      </PageHeader>
    );
  }

  return (
    <>
      <PageHeader eyebrow="The paper · read alongside the design" title="Residual compensation of DAGE for moving-platform landing">
        <p>
          The research paper ResLand implements, reproduced from <code>{paper.file}</code> with its equations, tables and figures. Gold “In
          ResLand” notes show which module and requirements realise each part, and how faithfully.
        </p>
      </PageHeader>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <Callout tone="paper" title="Everything on this page is Paper-reported">
          All numbers, tables and figures are copied from the paper; none has been reproduced by this project yet. The model is
          phenomenological and simulation-only.
        </Callout>
        <a className="btn-pill btn-gold" href={fileUrl(paper.file)} download>
          Download DOCX
        </a>
      </div>

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Paper sections" className="hidden lg:block">
          <ol className="sticky top-24 space-y-0.5 border-l border-border text-sm">
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(t.id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
                  }}
                  aria-current={active === t.id ? "location" : undefined}
                  className={`-ml-px block border-l-2 py-1 pl-3 transition-colors ${active === t.id ? "border-primary font-semibold text-primary-strong" : "border-transparent text-muted hover:text-text"}`}
                >
                  {t.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="paper-sheet min-w-0 rounded-[18px] p-5 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)] sm:p-10"
          aria-label="Paper"
        >
          <div aria-hidden="true" className="motif -mt-1 mb-6" />
          <div className="mx-auto max-w-[72ch]">{rendered}</div>
          <div aria-hidden="true" className="motif mt-8" />
        </motion.article>
      </div>
    </>
  );
}
