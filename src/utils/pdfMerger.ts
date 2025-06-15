import { PDFDocument } from "pdf-lib";

export type PDFFileWithPages = {
  id: string;
  name: string;
  size: string;
  pages: number;
  selectedPages: number[];
  file: File;
};

export async function mergePDFs(pdfFiles: PDFFileWithPages[]): Promise<Uint8Array> {
  try {
    // Filter out files with no pages selected (except single-page files)
    const filesToMerge = pdfFiles.filter(({ selectedPages, pages }) => {
      return pages === 1 || selectedPages.length > 0;
    });

    if (filesToMerge.length === 0) {
      throw new Error("No files to merge");
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Process each PDF file
    for (const { file, selectedPages } of filesToMerge) {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const pdf = await PDFDocument.load(arrayBuffer);

      // If no pages are selected, use all pages
      const pagesToCopy = selectedPages.length > 0 ? selectedPages : pdf.getPageIndices();

      // Copy selected pages from the current PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pagesToCopy);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    return await mergedPdf.save();
  } catch (error) {
    console.error("Error merging PDFs:", error);
    throw new Error("Failed to merge PDF files");
  }
}
