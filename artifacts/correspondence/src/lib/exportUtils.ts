import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

export async function exportTableToPDF(tableRef: HTMLElement, fileName: string, title: string) {
  const canvas = await html2canvas(tableRef, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;

  pdf.setFontSize(14);
  pdf.text(title, pageWidth / 2, margin + 5, { align: "center" });
  pdf.text(new Date().toLocaleDateString("ar-EG"), pageWidth - margin, margin + 5, { align: "right" });

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let yPos = margin + 12;
  if (imgHeight + yPos > pageHeight - margin) {
    const scaledHeight = pageHeight - yPos - margin;
    pdf.addImage(imgData, "PNG", margin, yPos, imgWidth, scaledHeight);
  } else {
    pdf.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight);
  }

  pdf.save(`${fileName}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportTableToExcel<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
  fileName: string,
  sheetName = "البيانات"
) {
  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach(({ key, header }) => {
      obj[header] = row[key] ?? "-";
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}-${new Date().toISOString().split("T")[0]}.xlsx`);
}
