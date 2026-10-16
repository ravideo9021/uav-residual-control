"""Source documents -> hub data: the paper (DOCX) and the Evaluation 2 deck (PPTX).

    docs/paper/*.docx                    -> spec/paper.json        (+ docs/paper/figures/fig-N.*)
    docs/presentation/UAV_DAGE_*.pptx    -> spec/presentation.json

The paper is reproduced, not rewritten: text, tables and figure captions are copied verbatim, and Word equations
(OMML) are converted structurally to MathML so the hub can render them without changing them. Everything extracted
from the paper is Paper-reported.
"""
from __future__ import annotations

import json
import re
import zipfile
from html import escape
from pathlib import Path
from xml.etree import ElementTree as ET

from . import DOCS_DIR, ROOT, SPEC_DIR

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
M = "http://schemas.openxmlformats.org/officeDocument/2006/math"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
P = "http://schemas.openxmlformats.org/presentationml/2006/main"
PKG = "http://schemas.openxmlformats.org/package/2006/relationships"


def w(tag):
    return f"{{{W}}}{tag}"


def m(tag):
    return f"{{{M}}}{tag}"


# ------------------------------------------------------------------ OMML -> MathML
_OPS = set("+-−=×·*/,;:()[]{}|<>≤≥≈∈∉∝→←↔∑∏∫∂∇±∓⋅…′″'!%∞⊂⊆∪∩∧∨¬∀∃≠≡∼~^")
_TOKEN = re.compile(r"\d+(?:\.\d+)?|[A-Za-z]+|[Ͱ-Ͽἀ-῿]|\s+|.", re.S)


def _val(el, tag, attr="val", default=None):
    sub = el.find(tag) if el is not None else None
    return sub.get(m(attr), default) if sub is not None else default


def _tokens(text: str, plain: bool) -> str:
    out = []
    for tok in _TOKEN.findall(text):
        if tok.isspace():
            continue
        t = escape(tok)
        if tok[0].isdigit():
            out.append(f"<mn>{t}</mn>")
        elif tok in _OPS or (len(tok) == 1 and not tok.isalpha()):
            out.append(f"<mo>{t}</mo>")
        elif plain or len(tok) > 1:
            out.append(f'<mi mathvariant="normal">{t}</mi>')
        else:
            out.append(f"<mi>{t}</mi>")
    return "".join(out)


def _kids(el) -> str:
    return "".join(omml(c) for c in el) if el is not None else ""


def _row(el) -> str:
    return f"<mrow>{_kids(el)}</mrow>"


def omml(el) -> str:  # noqa: C901 - one branch per OMML construct
    tag = el.tag
    if tag == m("r"):
        rpr = el.find(m("rPr"))
        plain = _val(rpr, m("sty")) == "p" or (rpr is not None and rpr.find(m("nor")) is not None)
        text = "".join(t.text or "" for t in el.iter(m("t")))
        if not text:
            text = "".join(t.text or "" for t in el.iter(w("t")))
            return f"<mtext>{escape(text)}</mtext>" if text else ""
        return _tokens(text, plain)
    if tag == w("r"):
        text = "".join(t.text or "" for t in el.iter(w("t")))
        return f"<mtext>{escape(text)}</mtext>" if text.strip() else ""
    if tag == m("f"):
        if _val(el.find(m("fPr")), m("type")) == "lin":
            return f"<mrow>{_row(el.find(m('num')))}<mo>/</mo>{_row(el.find(m('den')))}</mrow>"
        return f"<mfrac>{_row(el.find(m('num')))}{_row(el.find(m('den')))}</mfrac>"
    if tag == m("sSub"):
        return f"<msub>{_row(el.find(m('e')))}{_row(el.find(m('sub')))}</msub>"
    if tag == m("sSup"):
        return f"<msup>{_row(el.find(m('e')))}{_row(el.find(m('sup')))}</msup>"
    if tag == m("sSubSup"):
        return f"<msubsup>{_row(el.find(m('e')))}{_row(el.find(m('sub')))}{_row(el.find(m('sup')))}</msubsup>"
    if tag == m("sPre"):
        return (f"<mmultiscripts>{_row(el.find(m('e')))}<mprescripts/>{_row(el.find(m('sub')))}"
                f"{_row(el.find(m('sup')))}</mmultiscripts>")
    if tag == m("rad"):
        hide = _val(el.find(m("radPr")), m("degHide")) in ("1", "on", "true")
        deg = el.find(m("deg"))
        if hide or deg is None or not len(deg):
            return f"<msqrt>{_kids(el.find(m('e')))}</msqrt>"
        return f"<mroot>{_row(el.find(m('e')))}{_row(deg)}</mroot>"
    if tag == m("d"):
        pr = el.find(m("dPr"))
        beg = _val(pr, m("begChr"), default="(")
        end = _val(pr, m("endChr"), default=")")
        sep = _val(pr, m("sepChr"), default=",")
        parts = [_row(e) for e in el.findall(m("e"))]
        inner = f"<mo>{escape(sep)}</mo>".join(parts)
        open_ = f'<mo fence="true">{escape(beg)}</mo>' if beg else ""
        close = f'<mo fence="true">{escape(end)}</mo>' if end else ""
        return f"<mrow>{open_}{inner}{close}</mrow>"
    if tag == m("nary"):
        pr = el.find(m("naryPr"))
        op = f'<mo largeop="true">{escape(_val(pr, m("chr"), default="∫"))}</mo>'
        sub, sup = el.find(m("sub")), el.find(m("sup"))
        has_sub, has_sup = sub is not None and len(sub), sup is not None and len(sup)
        under = _val(pr, m("limLoc"), default="subSup") == "undOvr"
        if has_sub and has_sup:
            t = "munderover" if under else "msubsup"
            base = f"<{t}>{op}{_row(sub)}{_row(sup)}</{t}>"
        elif has_sub:
            base = f"<{'munder' if under else 'msub'}>{op}{_row(sub)}</{'munder' if under else 'msub'}>"
        elif has_sup:
            base = f"<{'mover' if under else 'msup'}>{op}{_row(sup)}</{'mover' if under else 'msup'}>"
        else:
            base = op
        return f"<mrow>{base}{_row(el.find(m('e')))}</mrow>"
    if tag == m("acc"):
        ch = _val(el.find(m("accPr")), m("chr"), default="̂")
        return f'<mover accent="true">{_row(el.find(m("e")))}<mo>{escape(ch)}</mo></mover>'
    if tag == m("bar"):
        top = _val(el.find(m("barPr")), m("pos"), default="bot") == "top"
        t = "mover" if top else "munder"
        return f'<{t} accent="true">{_row(el.find(m("e")))}<mo>{"‾" if top else "_"}</mo></{t}>'
    if tag == m("groupChr"):
        pr = el.find(m("groupChrPr"))
        ch, top = _val(pr, m("chr"), default="⏟"), _val(pr, m("pos"), default="bot") == "top"
        t = "mover" if top else "munder"
        return f"<{t}>{_row(el.find(m('e')))}<mo>{escape(ch)}</mo></{t}>"
    if tag == m("func"):
        return f"<mrow>{_row(el.find(m('fName')))}<mo>&#x2061;</mo>{_row(el.find(m('e')))}</mrow>"
    if tag == m("limLow"):
        return f"<munder>{_row(el.find(m('e')))}{_row(el.find(m('lim')))}</munder>"
    if tag == m("limUpp"):
        return f"<mover>{_row(el.find(m('e')))}{_row(el.find(m('lim')))}</mover>"
    if tag == m("eqArr"):
        return "<mtable>" + "".join(f"<mtr><mtd>{_row(e)}</mtd></mtr>" for e in el.findall(m("e"))) + "</mtable>"
    if tag == m("m"):
        rows = "".join("<mtr>" + "".join(f"<mtd>{_row(e)}</mtd>" for e in mr.findall(m("e"))) + "</mtr>"
                       for mr in el.findall(m("mr")))
        return f"<mtable>{rows}</mtable>"
    if tag in (m("e"), m("num"), m("den"), m("sub"), m("sup"), m("deg"), m("lim"), m("fName"), m("box"),
               m("borderBox"), m("phant"), m("oMath")):
        inner = el.find(m("e")) if tag in (m("box"), m("borderBox"), m("phant")) else el
        return _row(inner)
    if tag.endswith("Pr") or tag == m("ctrlPr"):
        return ""
    return _kids(el)


def math_xml(o_math, display=False) -> str:
    attr = ' display="block"' if display else ""
    return f'<math xmlns="http://www.w3.org/1998/Math/MathML"{attr}>{_kids(o_math)}</math>'


# ------------------------------------------------------------------ DOCX walker
def _pstyle(p) -> str:
    ppr = p.find(w("pPr"))
    st = ppr.find(w("pStyle")) if ppr is not None else None
    return st.get(w("val")) if st is not None else ""


class Paper:
    def __init__(self, path: Path, fig_dir: Path):
        self.zip = zipfile.ZipFile(path)
        self.doc = ET.fromstring(self.zip.read("word/document.xml"))
        rels = ET.fromstring(self.zip.read("word/_rels/document.xml.rels"))
        self.rels = {r.get("Id"): r.get("Target") for r in rels}
        self.fig_dir = fig_dir
        self.fig_n = 0

    def image(self, el) -> str | None:
        blip = el.find(f".//{{{A}}}blip")
        if blip is None:
            return None
        target = self.rels.get(blip.get(f"{{{R}}}embed"))
        if not target:
            return None
        self.fig_n += 1
        ext = Path(target).suffix.lower()
        out = self.fig_dir / f"fig-{self.fig_n}{ext}"
        out.write_bytes(self.zip.read("word/" + target.lstrip("/")))
        return str(out.relative_to(ROOT))

    def runs(self, p) -> list[dict]:
        """Inline content: text segments (with b/i/sup/sub) and inline MathML."""
        segs: list[dict] = []

        def run(r):
            rpr = r.find(w("rPr"))
            fmt = {}
            if rpr is not None:
                if rpr.find(w("b")) is not None and rpr.find(w("b")).get(w("val"), "1") not in ("0", "false"):
                    fmt["b"] = True
                if rpr.find(w("i")) is not None and rpr.find(w("i")).get(w("val"), "1") not in ("0", "false"):
                    fmt["i"] = True
                va = rpr.find(w("vertAlign"))
                if va is not None and va.get(w("val")) in ("superscript", "subscript"):
                    fmt["v"] = "sup" if va.get(w("val")) == "superscript" else "sub"
            text = ""
            for c in r:
                if c.tag == w("t"):
                    text += c.text or ""
                elif c.tag == w("tab"):
                    text += "\t"
                elif c.tag in (w("br"), w("cr")):
                    text += "\n"
            if text:
                if segs and "t" in segs[-1] and {k: v for k, v in segs[-1].items() if k != "t"} == fmt:
                    segs[-1]["t"] += text
                else:
                    segs.append({"t": text, **fmt})

        def walk(node):
            for c in node:
                if c.tag == w("r"):
                    run(c)
                elif c.tag == m("oMath"):
                    segs.append({"m": math_xml(c)})
                elif c.tag == m("oMathPara"):
                    for om in c.iter(m("oMath")):
                        segs.append({"m": math_xml(om, display=True)})
                elif c.tag in (w("hyperlink"), w("smartTag"), w("ins"), w("fldSimple")):
                    walk(c)
        walk(p)
        return segs

    @staticmethod
    def plain(segs) -> str:
        return "".join(s.get("t", "") for s in segs).strip()

    def cell_runs(self, tc) -> list[dict]:
        out: list[dict] = []
        for i, p in enumerate(tc.findall(w("p"))):
            if i:
                out.append({"t": "\n"})
            out.extend(self.runs(p))
        return out

    def table(self, tbl) -> dict:
        rows = []
        for tr in tbl.findall(w("tr")):
            rows.append([self.cell_runs(tc) for tc in tr.findall(w("tc"))])
        return {"type": "table", "rows": rows}

    def blocks(self) -> list[dict]:
        out: list[dict] = []
        body = self.doc.find(w("body"))
        pending_title: dict | None = None
        for el in body:
            if el.tag == w("p"):
                st = _pstyle(el)
                if el.find(f".//{w('drawing')}") is not None:
                    src = self.image(el)
                    if src:
                        out.append({"type": "figure", "src": src, "caption": []})
                    continue
                segs = self.runs(el)
                text = self.plain(segs)
                if st == "FigCaption" and out and out[-1]["type"] == "figure":
                    out[-1]["caption"] = segs
                    continue
                if st == "Equation":
                    block = '<math display="block" '
                    maths = [s["m"] if 'display="block"' in s["m"] else s["m"].replace("<math ", block, 1)
                             for s in segs if "m" in s]
                    num = re.search(r"\((\d+)\)", text)
                    out.append({"type": "equation", "math": "".join(maths), "number": num.group(1) if num else ""})
                    continue
                if not text and not any("m" in s for s in segs):
                    continue
                if st == "TableTitle":
                    pending_title = {"label": text, "caption": []}
                    continue
                if st == "TableCaption2" and pending_title is not None:
                    pending_title["caption"] = segs
                    continue
                kind = {"PaperTitle": "title", "Authors": "authors", "Affil": "affil", "Email": "email",
                        "AbstractIEEE": "abstract", "Keywords": "keywords", "H1": "h1", "H2": "h2",
                        "Compact": "li", "RefIEEE": "ref"}.get(st, "p")
                out.append({"type": kind, "runs": segs})
            elif el.tag == w("tbl"):
                cells = el.findall(f"{w('tr')}/{w('tc')}")
                nested = cells[0].find(w("tbl")) if len(cells) == 1 else None
                if len(cells) == 1 and el.find(f".//{w('drawing')}") is not None:
                    # Fig. 1: a one-cell layout table holding an image and its caption
                    src = self.image(el)
                    cap = [s for p in cells[0].findall(w("p")) for s in self.runs(p)]
                    out.append({"type": "figure", "src": src, "caption": cap})
                elif nested is not None:
                    # Table III: one-cell wrapper with title, caption and the real table
                    paras = [self.runs(p) for p in cells[0].findall(w("p"))]
                    texts = [self.plain(s) for s in paras]
                    t = self.table(nested)
                    t["label"] = texts[0] if texts else ""
                    t["caption"] = paras[1] if len(paras) > 1 else []
                    out.append(t)
                else:
                    t = self.table(el)
                    if pending_title:
                        t.update(pending_title)
                        pending_title = None
                    out.append(t)
        return out


def extract_paper() -> dict | None:
    docs = sorted((DOCS_DIR / "paper").glob("*.docx"))
    if not docs:
        return None
    fig_dir = DOCS_DIR / "paper" / "figures"
    fig_dir.mkdir(exist_ok=True)
    for old in fig_dir.glob("fig-*"):
        old.unlink()
    paper = Paper(docs[0], fig_dir)
    blocks = paper.blocks()
    return {"provenance": "Paper-reported", "file": str(docs[0].relative_to(ROOT)), "blocks": blocks}


# ------------------------------------------------------------------ PPTX
def _ptext(p_el) -> tuple[str, int, int]:
    text = "".join(t.text or "" for t in p_el.iter(f"{{{A}}}t"))
    ppr = p_el.find(f"{{{A}}}pPr")
    lvl = int(ppr.get("lvl", "0")) if ppr is not None else 0
    sizes = [int(r.get("sz")) for r in p_el.iter(f"{{{A}}}rPr") if r.get("sz")]
    return text, lvl, max(sizes) if sizes else 0


def extract_presentation() -> dict | None:
    decks = sorted((DOCS_DIR / "presentation").glob("UAV_DAGE_*.pptx"))
    if not decks:
        return None
    z = zipfile.ZipFile(decks[0])
    pres = ET.fromstring(z.read("ppt/presentation.xml"))
    rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("ppt/_rels/presentation.xml.rels"))}
    slides = []
    for i, sid in enumerate(pres.iter(f"{{{P}}}sldId"), start=1):
        target = rels[sid.get(f"{{{R}}}id")]
        path = "ppt/" + target.lstrip("/").removeprefix("ppt/")
        root = ET.fromstring(z.read(path))
        shapes = []
        for sp in root.iter(f"{{{P}}}sp"):
            off = sp.find(f".//{{{A}}}off")
            y = int(off.get("y")) if off is not None else 0
            x = int(off.get("x")) if off is not None else 0
            paras = [_ptext(p) for p in sp.iter(f"{{{A}}}p")]
            paras = [p for p in paras if p[0].strip()]
            if paras:
                shapes.append((y, x, paras))
        tables = []
        for tbl in root.iter(f"{{{A}}}tbl"):
            tables.append([["".join(t.text or "" for t in tc.iter(f"{{{A}}}t")) for tc in tr.iter(f"{{{A}}}tc")]
                           for tr in tbl.iter(f"{{{A}}}tr")])
        shapes.sort()
        shapes = [s for s in shapes if not (len(s[2]) == 1 and s[2][0][0].strip().isdigit())]  # page numbers
        title, items = "", []
        if shapes:
            best = max(shapes, key=lambda s: max(p[2] for p in s[2]))
            title = " ".join(p[0] for p in best[2]).strip()
            for s in shapes:
                if s is best:
                    continue
                items.append([{"text": p[0], "level": p[1]} for p in s[2]])
        notes = ""
        rel_path = f"ppt/slides/_rels/{Path(path).name}.rels"
        if rel_path in z.namelist():
            for r in ET.fromstring(z.read(rel_path)):
                if r.get("Type", "").endswith("/notesSlide"):
                    npath = "ppt/" + r.get("Target").replace("../", "")
                    nroot = ET.fromstring(z.read(npath))
                    for sp in nroot.iter(f"{{{P}}}sp"):
                        ph = sp.find(f".//{{{P}}}ph")
                        if ph is not None and ph.get("type") == "body":
                            notes = "\n".join(_ptext(p)[0] for p in sp.iter(f"{{{A}}}p")).strip()
        slides.append({"n": i, "title": title, "groups": items, "tables": tables, "notes": notes})
    return {"file": str(decks[0].relative_to(ROOT)), "slides": slides}


def write_sources() -> list[str]:
    written = []
    for name, data in (("paper", extract_paper()), ("presentation", extract_presentation())):
        if data is None:
            continue
        path = SPEC_DIR / f"{name}.json"
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        written.append(str(path.relative_to(ROOT)))
    return written
