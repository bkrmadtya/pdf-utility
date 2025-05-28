import { PDFDocument } from 'pdf-lib';

export async function mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
  try {
    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Process each PDF file
    for (const file of pdfFiles) {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const pdf = await PDFDocument.load(arrayBuffer);

      // Copy all pages from the current PDF to the merged PDF
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    // Save the merged PDF
    return await mergedPdf.save();
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw new Error('Failed to merge PDF files');
  }
} 