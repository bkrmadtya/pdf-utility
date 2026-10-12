import { PDFDocument, degrees } from "pdf-lib";

export type PDFFileWithPages = {
  id: string;
  name: string;
  size: string;
  pages: number;
  selectedPages: number[];
  file: File;
  pageRotations: Record<number, number>; // pageNumber -> rotation in degrees (0, 90, 180, 270)
};

export type MergePDFsOptions = {
  uniformWidth?: boolean;
};

export async function mergePDFs(
  pdfFiles: PDFFileWithPages[],
  options: MergePDFsOptions = {}
): Promise<Uint8Array> {
  const { uniformWidth = false } = options;

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

    // First pass: collect all pages and find the target width if uniform width is enabled
    type PageInfo = {
      page: Awaited<ReturnType<typeof mergedPdf.copyPages>>[0];
      originalPageIndex: number;
      rotation: number;
    };
    const allPages: PageInfo[] = [];

    for (const { file, selectedPages, pageRotations } of filesToMerge) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pagesToCopy = selectedPages.length > 0 ? selectedPages : pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, pagesToCopy);

      copiedPages.forEach((page, index) => {
        const originalPageIndex = pagesToCopy[index];
        // User rotation may accumulate beyond 360 (0, 90, ..., 450...) so the
        // preview can animate forward; normalize to 0/90/180/270 for merging.
        const rawRotation = pageRotations?.[originalPageIndex] ?? 0;
        const rotation = ((rawRotation % 360) + 360) % 360;
        allPages.push({ page, originalPageIndex, rotation });
      });
    }

    // If uniform width is enabled, find the most common width or use the first page's width
    let targetWidth: number | null = null;
    if (uniformWidth && allPages.length > 0) {
      // Use the width of the first page as the target
      const firstPage = allPages[0].page;
      const firstRotation = allPages[0].rotation;
      const { width, height } = firstPage.getSize();
      // If first page is rotated 90° or 270°, the effective width is the height
      targetWidth = firstRotation === 90 || firstRotation === 270 ? height : width;
    }

    // Second pass: add pages with rotation and optional scaling
    for (const { page, rotation } of allPages) {
      // Get the current rotation from the copied page
      const currentRotation = page.getRotation().angle;

      // Apply user-specified rotation on top of existing rotation
      // This ensures the page's inherent rotation is preserved and user rotation is added
      const finalRotation = (currentRotation + rotation) % 360;
      page.setRotation(degrees(finalRotation));

      // Apply uniform width scaling if enabled
      if (uniformWidth && targetWidth !== null) {
        const { width, height } = page.getSize();
        // After rotation, effective width changes for 90°/270°
        const effectiveWidth = rotation === 90 || rotation === 270 ? height : width;

        if (Math.abs(effectiveWidth - targetWidth) > 1) {
          // Scale factor to match target width
          const scale = targetWidth / effectiveWidth;
          page.setSize(width * scale, height * scale);
        }
      }

      mergedPdf.addPage(page);
    }

    // Save the merged PDF
    return await mergedPdf.save();
  } catch (error) {
    console.error("Error merging PDFs:", error);
    throw new Error("Failed to merge PDF files");
  }
}
