const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/v6/pdf/generate
 * Body example:
 * {
 *   "filename": "invoice-123",
 *   "title": "Invoice",
 *   "company": { "name": "Acme Ltd", "address": "123 St", "phone": "12345" },
 *   "customer": { "name": "John Doe", "address": "456 Ave" },
 *   "fields": [ { "label": "Ref No", "value": "INV-001" }, { "label": "Date", "value": "2025-11-03" } ],
 *   "items": [ { "desc": "Item A", "qty": 2, "rate": 100.00 }, { "desc": "Item B", "qty": 1, "rate": 50.00 } ],
 *   "footer": "Thank you for your business",
 *   "saveTo": "tmp/invoice-123.pdf" // optional: server path to save copy
 * }
 */
exports.generatePdf = async (req, res) => {
  try {
    const data = req.body || {};
    const filename = (data.filename || 'document') + '.pdf';

    // create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // set response headers for inline PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // optionally save a copy on server
    let fileStream;
    if (data.saveTo) {
      const savePath = path.isAbsolute(data.saveTo) ? data.saveTo : path.join(process.cwd(), data.saveTo);
      // ensure dir exists
      fs.mkdirSync(path.dirname(savePath), { recursive: true });
      fileStream = fs.createWriteStream(savePath);
      doc.pipe(fileStream);
    }

    // pipe to response (always)
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(18).text(data.title || 'Document', { align: 'left' });
    doc.moveDown(0.25);

    // company block (left) and fields block (right)
    const startY = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const leftWidth = Math.floor(pageWidth * 0.6);
    const rightX = doc.page.margins.left + leftWidth + 10;

    // company
    if (data.company) {
      doc.fontSize(10).text(data.company.name || '', { width: leftWidth });
      if (data.company.address) doc.text(data.company.address);
      if (data.company.phone) doc.text(`Phone: ${data.company.phone}`);
      doc.moveTo(doc.x, startY + 0).moveDown(0.5);
    }

    // fields on right (Ref No, Date etc.)
    if (Array.isArray(data.fields) && data.fields.length) {
      let curY = startY;
      doc.fontSize(10);
      data.fields.forEach(f => {
        doc.text(`${f.label || ''}:`, rightX, curY, { continued: true, width: pageWidth - leftWidth - 10 });
        doc.text(` ${f.value || ''}`, { align: 'left' });
        curY = doc.y;
      });
      doc.moveDown(0.5);
    }

    doc.moveDown(0.5);

    // --- Bill To / Customer ---
    if (data.customer) {
      doc.fontSize(11).text('Bill To:', { underline: true });
      doc.fontSize(10).text(data.customer.name || '');
      if (data.customer.address) doc.text(data.customer.address);
      doc.moveDown(0.5);
    }

    // --- Items Table ---
    if (Array.isArray(data.items) && data.items.length) {
      // table header
      const tableTop = doc.y + 5;
      const colWidths = {
        desc: Math.floor(pageWidth * 0.55),
        qty: Math.floor(pageWidth * 0.15),
        rate: Math.floor(pageWidth * 0.15),
        amount: Math.floor(pageWidth * 0.15)
      };

      const colX = {
        desc: doc.page.margins.left,
        qty: doc.page.margins.left + colWidths.desc,
        rate: doc.page.margins.left + colWidths.desc + colWidths.qty,
        amount: doc.page.margins.left + colWidths.desc + colWidths.qty + colWidths.rate
      };

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', colX.desc, tableTop, { width: colWidths.desc });
      doc.text('Qty', colX.qty, tableTop, { width: colWidths.qty, align: 'right' });
      doc.text('Rate', colX.rate, tableTop, { width: colWidths.rate, align: 'right' });
      doc.text('Amount', colX.amount, tableTop, { width: colWidths.amount, align: 'right' });

      doc.moveDown(0.5);
      doc.font('Helvetica');

      let y = tableTop + 20;
      let total = 0;

      data.items.forEach(item => {
        const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
        total += amount;

        // pagination check
        if (y > doc.page.height - doc.page.margins.bottom - 80) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        doc.fontSize(10).text(item.desc || '', colX.desc, y, { width: colWidths.desc });
        doc.text(item.qty != null ? String(item.qty) : '', colX.qty, y, { width: colWidths.qty, align: 'right' });
        doc.text(item.rate != null ? (Number(item.rate).toFixed(2)) : '', colX.rate, y, { width: colWidths.rate, align: 'right' });
        doc.text(amount.toFixed(2), colX.amount, y, { width: colWidths.amount, align: 'right' });

        y += 18;
      });

      // totals
      doc.font('Helvetica-Bold');
      const totalsY = y + 10;
      doc.text('Total', colX.rate, totalsY, { width: colWidths.rate, align: 'right' });
      doc.text(total.toFixed(2), colX.amount, totalsY, { width: colWidths.amount, align: 'right' });

      doc.moveDown(2);
    }

    // --- Footer ---
    if (data.footer) {
      doc.moveDown(2);
      doc.fontSize(10).text(data.footer, { align: 'center' });
    }

    // finalize PDF
    doc.end();

    // if saving to file, wait for file stream finish before ending response (optional)
    if (fileStream) {
      fileStream.on('finish', () => {
        // nothing to do - response already streamed
      });
      fileStream.on('error', (err) => {
        // log but don't break response stream
        console.error('Failed to save PDF:', err);
      });
    }
  } catch (err) {
    // avoid sending html if headers already sent
    if (res.headersSent) {
      console.error('PDF generation error after headers sent:', err);
      return;
    }
    return res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
};