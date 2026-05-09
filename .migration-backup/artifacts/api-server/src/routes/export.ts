import { Router, type IRouter } from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import { z } from "zod";

const router: IRouter = Router();

const ExportPayloadSchema = z.object({
  text: z.string(),
  latex: z.string().optional().default(""),
  title: z.string().optional().default("Scanned Document"),
  provider: z.string().optional().default("OCR"),
});

router.post("/export/pdf", async (req, res) => {
  const parsed = ExportPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const { text, latex, title, provider } = parsed.data;

  try {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    const margin = 50;
    const pageWidth = 595;
    const pageHeight = 842;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 16;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    function ensureSpace(needed: number) {
      if (y - needed < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    }

    function drawText(
      str: string,
      opts: {
        font?: typeof timesRoman;
        size?: number;
        color?: ReturnType<typeof rgb>;
        indent?: number;
      } = {},
    ) {
      const font = opts.font ?? timesRoman;
      const size = opts.size ?? 11;
      const color = opts.color ?? rgb(0.05, 0.05, 0.05);
      const indent = opts.indent ?? 0;
      const maxWidth = contentWidth - indent;

      const words = str.split(" ");
      let line = "";

      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(test, size);
        if (testWidth > maxWidth && line) {
          ensureSpace(lineHeight + 4);
          page.drawText(line, {
            x: margin + indent,
            y,
            size,
            font,
            color,
          });
          y -= lineHeight;
          line = word;
        } else {
          line = test;
        }
      }
      if (line) {
        ensureSpace(lineHeight + 4);
        page.drawText(line, { x: margin + indent, y, size, font, color });
        y -= lineHeight;
      }
    }

    page.drawRectangle({
      x: margin,
      y: pageHeight - margin - 40,
      width: contentWidth,
      height: 40,
      color: rgb(0.04, 0.12, 0.36),
    });

    page.drawText(title, {
      x: margin + 10,
      y: pageHeight - margin - 28,
      size: 16,
      font: timesBold,
      color: rgb(1, 1, 1),
    });

    y = pageHeight - margin - 60;

    const meta = `Scanned with Pinnacle Academic Classes Platform  |  OCR Engine: ${provider}  |  ${new Date().toLocaleDateString("en-IN")}`;
    drawText(meta, { size: 9, color: rgb(0.5, 0.5, 0.5) });
    y -= 8;

    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 14;

    drawText("Extracted Text", { font: timesBold, size: 13, color: rgb(0.04, 0.12, 0.36) });
    y -= 4;

    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trim() === "") {
        y -= lineHeight / 2;
        continue;
      }
      drawText(line, { size: 11 });
    }

    if (latex && latex.trim()) {
      y -= 16;
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
      y -= 14;

      drawText("LaTeX Source (Equations)", { font: timesBold, size: 13, color: rgb(0.04, 0.12, 0.36) });
      y -= 4;

      const latexLines = latex.split("\n");
      for (const ll of latexLines) {
        if (ll.trim() === "") {
          y -= lineHeight / 2;
          continue;
        }
        drawText(ll, { font: courier, size: 10, color: rgb(0.1, 0.35, 0.45), indent: 10 });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    res.status(500).json({ error: message });
  }
});

router.post("/export/docx", async (req, res) => {
  const parsed = ExportPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const { text, latex, title, provider } = parsed.data;

  try {
    const children: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Scanned with Pinnacle Academic Classes Platform | OCR Engine: ${provider} | ${new Date().toLocaleDateString("en-IN")}`,
            size: 18,
            color: "888888",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "Extracted Text",
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({ text: "" }),
    ];

    const textLines = text.split("\n");
    for (const line of textLines) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
        }),
      );
    }

    if (latex && latex.trim()) {
      children.push(new Paragraph({ text: "" }));
      children.push(
        new Paragraph({
          text: "LaTeX Source (Equations)",
          heading: HeadingLevel.HEADING_2,
        }),
      );
      children.push(new Paragraph({ text: "" }));

      const latexLines = latex.split("\n");
      for (const ll of latexLines) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ll,
                size: 20,
                font: "Courier New",
                color: "0D7377",
              }),
            ],
          }),
        );
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "DOCX generation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
