import { PDFDocument } from 'pdf-lib';

export interface PDFFileWithPages {
  file: File;
  selectedPages: number[];
  isSinglePage: boolean;
  fileSize: number;
}

export async function mergePDFs(pdfFiles: PDFFileWithPages[]): Promise<Uint8Array> {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Filter out files with no pages selected (except single-page files)
    const filesToMerge = pdfFiles.filter(({ selectedPages, isSinglePage }) => {
      return isSinglePage || selectedPages.length > 0;
    });

    // Process each PDF file
    for (const { file, selectedPages } of filesToMerge) {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const pdf = await PDFDocument.load(arrayBuffer);

      // If no pages are selected, use all pages
      const pagesToCopy = selectedPages.length > 0
        ? selectedPages
        : pdf.getPageIndices();

      // Copy selected pages from the current PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pagesToCopy);
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    return await mergedPdf.save();
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw new Error('Failed to merge PDF files');
  }
} 