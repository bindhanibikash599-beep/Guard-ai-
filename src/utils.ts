/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";

export const downloadReportAsPdf = (title: string, originalInput: string, formattedOutput: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("GUARD ENGLISH AI", 20, 22);
  
  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Write Professional English Reports in Seconds", 20, 28);
  
  doc.setLineWidth(0.8);
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.line(20, 32, 190, 32);
  
  // Metadata Table
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("REPORT INFO", 20, 42);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Category: ${title}`, 20, 48);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 20, 53);
  doc.text("Lead developer: Bikash Bindhani", 20, 58);
  
  doc.setLineWidth(0.3);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(20, 63, 190, 63);
  
  // Original Message Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("ORIGINAL LOG / INPUT MESSAGE:", 20, 72);
  
  doc.setFont("Helvetica", "oblique");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  const origSplit = doc.splitTextToSize(originalInput || "[No written notes provided - form-based input]", 170);
  doc.text(origSplit, 20, 78);
  
  const origHeight = Math.max(15, origSplit.length * 5);
  const outputY = 78 + origHeight + 12;
  
  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.line(20, outputY - 6, 190, outputY - 6);
  
  // Official Formatted Output
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("OFFICIAL REPORT SUITE (PROFESSIONAL ENGLISH):", 20, outputY);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  
  const formattedSplit = doc.splitTextToSize(formattedOutput || "", 170);
  doc.text(formattedSplit, 20, outputY + 8);
  
  // Footer on bottom of first page
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(20, pageHeight - 20, 190, pageHeight - 20);
  
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("This report is digitally certified by Guard English AI core language module.", 20, pageHeight - 14);
  doc.text("Follow the developer on Instagram: @__noirvex1", 20, pageHeight - 9);
  
  // Save out PDF
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
  doc.save(`guard_english_${cleanTitle}_report.pdf`);
};
