const PDFDocument = require('pdfkit');
const { resolveUnicodeTtfPath } = require('./pdfFonts');

const ORG_NAME = 'Школа здорового питания';

function formatRuDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return String(value);
  }
}

function formatRuDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('ru-RU');
  } catch {
    return String(value);
  }
}

function formatMoney(value, currency = 'BYN') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(2)} ${currency}`;
}

function paymentStatusRu(status) {
  if (status === 'paid') return 'Оплачено';
  if (status === 'cancelled') return 'Отменён';
  return 'Ожидает оплаты';
}

function beginPdfResponse(res, filename) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"`
  );
  doc.pipe(res);

  const fontPath = resolveUnicodeTtfPath();
  if (fontPath) {
    doc.font(fontPath);
  }

  return doc;
}

function writeReportHeader(doc, { title, subtitle, meta = [] }) {
  doc
    .fontSize(10)
    .fillColor('#5a6478')
    .text(ORG_NAME, { align: 'center' });
  doc.fillColor('#000000');
  doc.fontSize(16).text(title, { align: 'center' });
  if (subtitle) {
    doc.fontSize(11).text(subtitle, { align: 'center' });
  }
  doc.moveDown(0.4);
  doc.fontSize(9);
  meta.forEach((line) => {
    doc.text(line, { align: 'right' });
  });
  doc.moveDown(0.8);
}

function writeSectionTitle(doc, text) {
  doc.fontSize(11).fillColor('#00539f').text(text);
  doc.fillColor('#000000');
  doc.moveDown(0.4);
}

function writeKeyValueBlock(doc, pairs) {
  doc.fontSize(9);
  pairs.forEach(([label, value]) => {
    doc.text(`${label}: ${value ?? '—'}`);
  });
  doc.moveDown(0.6);
}

function writeSimpleTable(doc, { headers, rows, colWidths, footerRow }) {
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const widths =
    colWidths ||
    headers.map(() => pageWidth / Math.max(headers.length, 1));
  const startX = doc.page.margins.left;
  const rowHeight = 20;
  let y = doc.y;

  const drawRow = (cells, options = {}) => {
    const { header = false, footer = false, zebra = false } = options;
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    let x = startX;
    cells.forEach((cell, index) => {
      const width = widths[index] || widths[widths.length - 1];
      let fill = '#ffffff';
      let stroke = '#e7e7e7';
      if (header) {
        fill = '#e8f5ef';
        stroke = '#00be6e';
      } else if (footer) {
        fill = '#eef6ff';
        stroke = '#00539f';
      } else if (zebra) {
        fill = '#fafafa';
      }

      doc.rect(x, y, width, rowHeight).fillAndStroke(fill, stroke);
      doc
        .fillColor('#000000')
        .fontSize(header || footer ? 9 : 8)
        .text(String(cell ?? '—'), x + 4, y + 5, {
          width: width - 8,
          height: rowHeight - 6,
          ellipsis: true,
        });
      x += width;
    });
    y += rowHeight;
  };

  drawRow(headers, { header: true });
  rows.forEach((row, index) => {
    drawRow(row, { zebra: index % 2 === 1 });
  });
  if (footerRow) {
    drawRow(footerRow, { footer: true });
  }

  doc.y = y + 8;
}

module.exports = {
  ORG_NAME,
  PDFDocument,
  beginPdfResponse,
  writeReportHeader,
  writeSectionTitle,
  writeKeyValueBlock,
  writeSimpleTable,
  formatRuDateTime,
  formatRuDate,
  formatMoney,
  paymentStatusRu,
};
