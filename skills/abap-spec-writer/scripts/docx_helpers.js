// 規格書 docx 的共用輔助函式。用法：
//   const h = require("<此 skill 路徑>/scripts/docx_helpers.js");
//   const children = [ ...封面段落, h.H1("1. 文件資訊", { cover: true }), h.makeTable(...), ... ];
//   const doc = new h.Document({ sections: [{ children }] });
//   require("fs").writeFileSync("<程式名>_規格書.docx", await h.Packer.toBuffer(doc));
// 需要先 npm install docx。實際欄寬依內容調整。

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign,
} = require("docx");

const FONT = "Microsoft JhengHei";

function P(text, opts = {}) {
  const { bold, italic, size, color, alignment, spacingAfter = 120, spacingBefore = 0 } = opts;
  return new Paragraph({
    alignment, spacing: { after: spacingAfter, before: spacingBefore },
    children: [new TextRun({ text, bold, italics: italic, size, color, font: FONT })],
  });
}
// cover: true 用在封面後的第一個 H1（「1. 文件資訊」），這是全文唯一的強制換頁
function H1(text, { cover = false } = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, keepNext: true, pageBreakBefore: cover,
    children: [new TextRun({ text, bold: true, font: FONT, size: 30 })],
  });
}
function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 140 }, keepNext: true,
    children: [new TextRun({ text, bold: true, font: FONT, size: 25 })],
  });
}
function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: "•  " + text, font: FONT, size: 21 })],
  });
}
function cell(text, opts = {}) {
  const { width, bold, shade, align = AlignmentType.LEFT, size = 20 } = opts;
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: shade ? { type: ShadingType.CLEAR, color: "auto", fill: shade } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: Array.isArray(text)
      ? text.map((t) => new Paragraph({ alignment: align, children: [new TextRun({ text: t, bold, font: FONT, size })] }))
      : [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, font: FONT, size })] })],
  });
}
function headerRow(cols, widths) {
  return new TableRow({
    tableHeader: true, cantSplit: true,
    children: cols.map((c, i) => cell(c, { width: widths[i], bold: true, shade: "D9D9D9", align: AlignmentType.CENTER })),
  });
}
function dataRow(cols, widths, opts = {}) {
  return new TableRow({ cantSplit: true, children: cols.map((c, i) => cell(c, { width: widths[i], shade: opts.shade })) });
}
function makeTable(widths, header, rows) {
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
    },
    rows: [headerRow(header, widths), ...rows.map((r, idx) => dataRow(r, widths, { shade: idx % 2 === 1 ? "F5F5F5" : undefined }))],
  });
}

// 核心規則框（md 的 blockquote）：醒目底色、整框不准切開
function ruleBox(lines) {
  return lines.map((t, i) => new Paragraph({
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "FFF2CC" },
    keepLines: true, keepNext: i < lines.length - 1, spacing: { after: 120 },
    children: [new TextRun({ text: t, bold: i === 0, font: FONT, size: 21 })],
  }));
}

module.exports = {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign,
  FONT, P, H1, H2, bullet, cell, headerRow, dataRow, makeTable, ruleBox,
};
