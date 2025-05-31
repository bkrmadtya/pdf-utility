import { PDFDocument } from 'pdf-lib';

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Accepted file types for input element
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  ...SUPPORTED_IMAGE_FORMATS.map(format => format.replace(".", "image/"))
].join(",");

export async function convertImageToPDF(imageFile: File): Promise<Uint8Array> {
  try {
    // Create an image element to load the file
    const img = new Image();
    const imageUrl = URL.createObjectURL(imageFile);

    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Create a canvas with the image dimensions
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Calculate dimensions (max width 2000px)
    const maxWidth = 2000;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = height * ratio;
    }

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Draw image on canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Convert canvas to JPEG with quality 0.8
    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.8);

    // Convert data URL to Uint8Array
    const base64Data = jpegDataUrl.split(',')[1];
    const binaryData = atob(base64Data);
    const jpegBuffer = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      jpegBuffer[i] = binaryData.charCodeAt(i);
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed the JPEG image in the PDF
    const pdfImage = await pdfDoc.embedJpg(jpegBuffer);

    // Create a page with the same dimensions as the image
    const page = pdfDoc.addPage([width, height]);

    // Draw the image on the page
    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: page.getWidth(),
      height: page.getHeight(),
    });

    // Clean up
    URL.revokeObjectURL(imageUrl);

    // Save the PDF with compression
    return await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });
  } catch (error) {
    throw new Error(`Error converting image to PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function isImageFile(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(extension);
} 