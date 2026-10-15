/**
 * Zero-dependency PDF 1.4 generator for the resume compiler.
 *
 * Emits a pure-ASCII PDF (Helvetica/Courier base-14 fonts, no font embedding,
 * no external requests) built from structured ResumeData. Byte offsets are the
 * string length because every emitted character is in the ASCII range — the
 * smoke test in the repo verifies each xref entry points at its object.
 *
 * Single source of truth for resume content lives in `resumeData.ts`.
 */

export interface ResumeContact {
  label: string;
  value: string;
}

export interface ResumeSkillGroup {
  group: string;
  items: string[];
}

export interface ResumeWorkItem {
  name: string;
  period: string;
  desc: string[];
  tags: string;
}

export interface ResumeStat {
  value: string;
  label: string;
}

export interface ResumeData {
  name: string;
  role: string;
  status: string;
  contact: ResumeContact[];
  profile: string[];
  skills: ResumeSkillGroup[];
  work: ResumeWorkItem[];
  stats: ResumeStat[];
}

/* ---------- page + palette (blueprint tokens) ---------- */

const W = 595;
const H = 842;
const M = 46;

const INK = "0.043 0.059 0.098";
const ORANGE = "1 0.271 0";
const BODY = "0.29 0.322 0.38";
const MUTED = "0.463 0.494 0.549";
const PAPER = "0.949 0.957 0.953";
const RULE = "0.84 0.855 0.867";

/* Courier metrics (exactly 0.6em advance) make chip/label widths computable */
const COURIER = 0.6;

const ASCII_MAP: Record<string, string> = {
  "\u2013": "-",
  "\u2014": "-",
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2026": "...",
  "\u00B7": "-",
  "\u00D7": "x",
  "\u2022": "-",
  "\u00A9": "(c)",
  "\u00AE": "(R)",
  "\u2192": "->",
  "\u2190": "<-",
  "\u00A0": " ",
  "\u2011": "-",
  "\u2010": "-",
  "\u00B0": " deg",
};

function ascii(s: string): string {
  return s.replace(/[^\u0020-\u007E]/g, (c) => ASCII_MAP[c] ?? "?");
}

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function text(
  x: number,
  y: number,
  size: number,
  font: string,
  color: string,
  content: string,
  tracking = 0
): string {
  return `BT /${font} ${size} Tf ${tracking} Tc ${color} rg 1 0 0 1 ${x} ${y} Tm (${esc(ascii(content))}) Tj ET`;
}

function rect(x: number, y: number, w: number, h: number, color: string): string {
  return `${color} rg ${x} ${y} ${w} ${h} re f`;
}

function hline(x: number, y: number, w: number, color: string, weight = 0.75): string {
  return `${weight} w ${color} RG ${x} ${y} m ${x + w} ${y} l S`;
}

function courierWidth(str: string, size: number, tracking = 0): number {
  return str.length * (COURIER * size + tracking);
}

function dateStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/* ---------- layout ---------- */

function buildContent(data: ResumeData): string {
  const ops: string[] = [];
  const today = new Date();
  const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const contentWidth = W - M * 2;

  let y = H;

  /* top industrial bar */
  ops.push(rect(0, y - 9, W, 9, ORANGE));
  y -= 9;

  /* header */
  y -= 52;
  ops.push(text(M, y, 25, "F2", INK, data.name));
  const nameW = data.name.length * 0.55 * 25;
  const chipLabel = ascii(data.status).toUpperCase();
  const chipW = courierWidth(chipLabel, 8) + 16;
  const chipX = Math.max(M + nameW + 16, W - M - chipW);
  ops.push(rect(chipX, y - 3, chipW, 16, PAPER));
  ops.push(text(chipX + 8, y + 2, 8, "F4", INK, chipLabel));

  y -= 22;
  ops.push(text(M, y, 10.5, "F1", ORANGE, data.role.toUpperCase(), 1.6));

  y -= 18;
  ops.push(
    text(M, y, 8.5, "F3", MUTED, data.contact.map((c) => c.value).join("   //   "))
  );

  y -= 16;
  ops.push(hline(M, y, contentWidth, RULE, 1));

  /* section label helper */
  const section = (num: string, label: string, at: number): number => {
    const full = `[ ${num} ]  ${label}`;
    const wLabel = courierWidth(full, 8.5, 1.2);
    ops.push(text(M, at, 8.5, "F4", ORANGE, full, 1.2));
    ops.push(hline(M + wLabel + 12, at + 2.5, contentWidth - wLabel - 12, RULE, 0.75));
    return at - 8;
  };

  /* 01 PROFILE */
  y -= 30;
  y = section("01", "PROFILE", y);
  y -= 12;
  for (const line of data.profile) {
    ops.push(text(M, y, 9.5, "F1", BODY, line));
    y -= 13;
  }
  y -= 8;

  /* stats band */
  const bandX = M - 10;
  const bandW = contentWidth + 20;
  ops.push(rect(bandX, y - 34, bandW, 42, PAPER));
  ops.push(rect(bandX, y - 34, 3, 42, ORANGE));
  const colW = bandW / data.stats.length;
  data.stats.forEach((s, i) => {
    const sx = bandX + 14 + i * colW;
    ops.push(text(sx, y - 8, 15, "F2", i % 2 === 0 ? ORANGE : INK, s.value));
    ops.push(text(sx, y - 24, 6.5, "F3", MUTED, s.label.toUpperCase(), 0.4));
  });
  y -= 56;

  /* 02 CORE SKILLS */
  y = section("02", "CORE SKILLS", y);
  y -= 16;
  for (const g of data.skills) {
    ops.push(text(M, y, 8, "F4", INK, g.group.toUpperCase(), 0.8));
    let cx = M;
    let cy = y - 17;
    for (const item of g.items) {
      const cw = courierWidth(item, 7.5) + 12;
      if (cx + cw > W - M) {
        cx = M;
        cy -= 16;
      }
      ops.push(rect(cx, cy - 3, cw, 13, PAPER));
      ops.push(text(cx + 6, cy, 7.5, "F3", INK, item));
      cx += cw + 5;
    }
    y = cy - 16;
  }
  y -= 12;
  for (const item of data.work) {
    ops.push(text(M, y, 10.5, "F2", INK, item.name));
    const periodW = courierWidth(item.period, 7.5);
    ops.push(text(W - M - periodW, y - 1, 7.5, "F3", MUTED, item.period));
    y -= 13;
    for (const line of item.desc) {
      ops.push(text(M, y, 9, "F1", BODY, line));
      y -= 12;
    }
    y -= 2;
    ops.push(text(M, y, 7.5, "F4", ORANGE, item.tags, 0.6));
    y -= 22;
  }

  /* footer */
  const footY = 58;
  ops.push(hline(M, footY + 14, contentWidth, RULE, 1));
  ops.push(rect(M, footY + 14, 60, 2, ORANGE));
  ops.push(
    text(
      M,
      footY,
      7,
      "F3",
      MUTED,
      `GENERATED ${isoDate} // BLUEPRINT RESUME COMPILER v2.4.1 // CLIENT-SIDE PDF`
    )
  );
  const pageTag = "PAGE 1/1";
  ops.push(
    text(W - M - courierWidth(pageTag, 7), footY, 7, "F3", MUTED, pageTag)
  );

  return ops.join("\n");
}

/* ---------- assembly ---------- */

export function buildResumePdfBytes(data: ResumeData): string {
  const stream = buildContent(data);
  const today = new Date();

  const objects: string[] = [];
  const push = (body: string) => objects.push(body);

  push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  push(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`);
  push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> /Contents 4 0 R >>\nendobj\n`
  );
  push(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
  push(`5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);
  push(`6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);
  push(`7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>\nendobj\n`);
  push(`8 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>\nendobj\n`);
  push(
    `9 0 obj\n<< /Title (${esc(ascii(`${data.name} - Resume`))}) /Author (${esc(ascii(data.name))}) /Subject (${esc(ascii(data.role))}) /Producer (Blueprint Resume Compiler v2.4.1) /CreationDate (D:${dateStamp(today)}) >>\nendobj\n`
  );

  let out = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(out.length);
    out += obj;
  }

  const xrefOffset = out.length;
  const count = objects.length + 1;
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${count} /Root 1 0 R /Info 9 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return out;
}

export function buildResumePdfBlob(data: ResumeData): Blob {
  return new Blob([buildResumePdfBytes(data)], { type: "application/pdf" });
}

export function resumeFileName(data: ResumeData): string {
  return `${ascii(data.name).replace(/[^A-Za-z0-9]+/g, "_")}_Resume.pdf`;
}
