import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  AlignmentType, 
  HeadingLevel, 
  BorderStyle, 
  WidthType,
  ShadingType,
  VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';

interface ExportData {
  className: string;
  dailyScores: Record<string, number>;
  totalScore: string;
  weekdayAvg: string;
  journalScore: number;
  goodGradesCount: number;
  bonusPoints: number;
  violations: string[];
}

export const generateWeeklyReport = async (data: ExportData) => {
  const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24 }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "BÁO CÁO TỔNG KẾT THI ĐUA TUẦN", bold: true, size: 32 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [
            new TextRun({ text: `Lớp: ${data.className}`, bold: true }),
            new TextRun({ text: " | ", bold: false }),
            new TextRun({ text: `Tuần: ${new Date().toLocaleDateString('vi-VN')}`, italics: true })
          ]
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "1. Thống kê điểm số", bold: true })]
        }),

        new Table({
          columnWidths: [4680, 4680],
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tiêu chí", bold: true })] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Kết quả", bold: true })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph("Trung bình Nề nếp")] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`${data.weekdayAvg}đ`)] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph("Điểm Sổ đầu bài")] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`${data.journalScore}đ`)] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: cellBorders, children: [new Paragraph("Điểm thưởng (Học tập)")] }),
                new TableCell({ borders: cellBorders, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(`+${data.bonusPoints}đ`)] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ 
                  borders: cellBorders, 
                  shading: { fill: "E6F3FF", type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: "TỔNG ĐIỂM THI ĐUA", bold: true })] })] 
                }),
                new TableCell({ 
                  borders: cellBorders,
                  shading: { fill: "E6F3FF", type: ShadingType.CLEAR },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${data.totalScore}đ`, bold: true, size: 28 })] })] 
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "2. Chi tiết vi phạm trong tuần", bold: true })]
        }),
        ...data.violations.map(v => new Paragraph({
          children: [
            new TextRun({ text: "• ", bold: true }),
            new TextRun(v)
          ],
          spacing: { before: 100 }
        })),
        data.violations.length === 0 ? new Paragraph({ children: [new TextRun({ text: "Không có vi phạm nào được ghi nhận.", italics: true })] }) : new Paragraph({ children: [] }),

        new Paragraph({ spacing: { before: 800 } }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  border: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Người lập báo cáo", bold: true })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true, size: 20 })]
                    })
                  ]
                }),
                new TableCell({
                  border: { top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, left: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL } },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Xác nhận của Nhà trường", bold: true })]
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "(Ký và đóng dấu)", italics: true, size: 20 })]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Bao_cao_thi_dua_${data.className}_${new Date().toISOString().split('T')[0]}.docx`);
};
