import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

interface ResumeSection {
  type: "name" | "heading" | "subheading" | "text" | "bullet" | "divider" | "blank";
  content?: string;
}

/**
 * Parse plain-text resume into structured sections
 */
function parseResume(text: string): ResumeSection[] {
  const lines = text.split("\n");
  const sections: ResumeSection[] = [];
  let isFirstNonEmpty = true;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      sections.push({ type: "blank" });
      continue;
    }

    // First non-empty line = name
    if (isFirstNonEmpty) {
      sections.push({ type: "name", content: line });
      isFirstNonEmpty = false;
      continue;
    }

    // Lines that look like section headings (all caps, or ending with colon, or short + bold-looking)
    const isHeading =
      /^[A-Z\u4e00-\u9fff]{2,}[：:\s]*$/.test(line) || // All caps or CJK chars ending with colon
      /^#{1,3}\s/.test(line) || // Markdown headings
      /^[\u4e00-\u9fff]{2,6}[：:]?\s*$/.test(line) || // Short Chinese heading
      /^(教育背景|工作经历|项目经验|专业技能|个人简介|自我评价|荣誉奖项|语言能力|证书|联系方式|求职意向|实习经历|社会实践|技能特长|个人信息|基本信息)[：:]?\s*$/i.test(line);

    if (isHeading) {
      sections.push({ type: "heading", content: line.replace(/^#{1,3}\s/, "").replace(/[：:]\s*$/, "") });
      continue;
    }

    // Bullet points
    if (/^[-•·▪◆★●]\s/.test(line) || /^\d+[.)]\s/.test(line)) {
      sections.push({ type: "bullet", content: line.replace(/^[-•·▪◆★●]\s/, "").replace(/^\d+[.)]\s/, "") });
      continue;
    }

    // Regular text
    sections.push({ type: "text", content: line });
  }

  return sections;
}

/**
 * Export resume as formatted Word document
 */
export async function exportToWord(content: string, jobTitle: string, style: string) {
  const sections = parseResume(content);
  const children: Paragraph[] = [];

  for (const section of sections) {
    switch (section.type) {
      case "name":
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: section.content || "",
                bold: true,
                size: 36, // 18pt
                font: "Microsoft YaHei",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "2D5F2D", space: 8 },
            },
            children: [new TextRun({ text: " ", size: 4 })],
          })
        );
        break;

      case "heading":
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 280, after: 120 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC", space: 4 },
            },
            children: [
              new TextRun({
                text: section.content || "",
                bold: true,
                size: 26, // 13pt
                font: "Microsoft YaHei",
                color: "2D5F2D",
              }),
            ],
          })
        );
        break;

      case "subheading":
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [
              new TextRun({
                text: section.content || "",
                bold: true,
                size: 22,
                font: "Microsoft YaHei",
              }),
            ],
          })
        );
        break;

      case "bullet":
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            indent: { left: 480, hanging: 240 },
            children: [
              new TextRun({ text: "• ", font: "Microsoft YaHei", size: 20 }),
              new TextRun({
                text: section.content || "",
                size: 20,
                font: "Microsoft YaHei",
              }),
            ],
          })
        );
        break;

      case "blank":
        children.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        break;

      default:
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: section.content || "",
                size: 20, // 10pt
                font: "Microsoft YaHei",
              }),
            ],
          })
        );
    }
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Microsoft YaHei", size: 20 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `优化简历_${jobTitle}_${style}.docx`);
}

/**
 * Export resume as formatted PDF
 */
export function exportToPDF(content: string, jobTitle: string, style: string) {
  const sections = parseResume(content);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Load Chinese font support
  pdf.setFont("helvetica");

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - marginBottom) {
      pdf.addPage();
      y = marginTop;
    }
  };

  // Helper: wrap text and draw
  const drawWrappedText = (text: string, x: number, fontSize: number, maxWidth: number, lineHeight: number, options?: { bold?: boolean; color?: number[] }) => {
    pdf.setFontSize(fontSize);
    if (options?.bold) pdf.setFont("helvetica", "bold");
    else pdf.setFont("helvetica", "normal");
    if (options?.color) pdf.setTextColor(options.color[0], options.color[1], options.color[2]);
    else pdf.setTextColor(30, 30, 30);

    const lines = pdf.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      checkPageBreak(lineHeight);
      pdf.text(line, x, y);
      y += lineHeight;
    }
  };

  for (const section of sections) {
    switch (section.type) {
      case "name":
        checkPageBreak(16);
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 30, 30);
        pdf.text(section.content || "", pageWidth / 2, y, { align: "center" });
        y += 10;
        // Divider line
        pdf.setDrawColor(45, 95, 45);
        pdf.setLineWidth(0.5);
        pdf.line(marginLeft, y, pageWidth - marginRight, y);
        y += 8;
        break;

      case "heading":
        checkPageBreak(14);
        y += 4;
        pdf.setFontSize(13);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(45, 95, 45);
        pdf.text(section.content || "", marginLeft, y);
        y += 2;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(marginLeft, y, pageWidth - marginRight, y);
        y += 6;
        break;

      case "bullet":
        drawWrappedText(`• ${section.content || ""}`, marginLeft + 4, 10, contentWidth - 8, 5);
        y += 1;
        break;

      case "blank":
        y += 3;
        break;

      default:
        drawWrappedText(section.content || "", marginLeft, 10, contentWidth, 5);
        y += 1;
    }
  }

  pdf.save(`优化简历_${jobTitle}_${style}.pdf`);
}
