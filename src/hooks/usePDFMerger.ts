import { useState, useCallback } from "react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { formatFileSize } from "@/utils/format";
import { generateRandomId } from "@/utils/generateRandomId";
import { mergePDFs, PDFFileWithPages } from "@/utils/pdfMerger";
import { convertImageToPDF, isImageFile } from "@/utils/imageConverter";

type MergedFile = {
  previewUrl: string;
} & PDFFileWithPages;

const DEFAULT_MERGED_FILE: MergedFile = {
  file: new File([], ""),
  previewUrl: "",
  name: "",
  size: "",
  pages: 0,
  id: "",
  selectedPages: [],
  pageRotations: {},
};

const scrollIntoView = (
  selector: string,
  option: ScrollIntoViewOptions = {
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  }
) => {
  setTimeout(() => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView(option);
    }
  }, 100);
};

export const usePDFMerger = () => {
  const [files, setFiles] = useState<PDFFileWithPages[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedFile, setMergedFile] = useState(DEFAULT_MERGED_FILE);
  const [uniformWidth, setUniformWidth] = useState(true);

  const removeFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    setMergedFile(DEFAULT_MERGED_FILE);
  }, []);

  const clearAllFiles = () => {
    setFiles([]);
    setMergedFile(DEFAULT_MERGED_FILE);
  };

  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles?.length === 0) {
      toast.error("Please select PDF or image files to merge.");
      return;
    }

    const newFiles: PDFFileWithPages[] = [];
    await Promise.allSettled(
      Array.from(selectedFiles).map(async (file) => {
        let pdf: PDFDocument;
        let arrayBuffer: ArrayBuffer;

        if (isImageFile(file)) {
          // Convert image to PDF
          const pdfBytes = await convertImageToPDF(file);
          arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
          new Uint8Array(arrayBuffer).set(pdfBytes);
          pdf = await PDFDocument.load(arrayBuffer);
        } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          // Handle PDF file
          arrayBuffer = await file.arrayBuffer();
          pdf = await PDFDocument.load(arrayBuffer);
        } else {
          toast.error(`Unsupported file type: ${file.name}`);
          return;
        }

        const newFile: PDFFileWithPages = {
          file: new File([arrayBuffer], file.name.replace(/\.[^/.]+$/, ".pdf"), {
            type: "application/pdf",
          }),
          id: generateRandomId(),
          name: file.name,
          pages: pdf.getPageCount(),
          selectedPages: pdf.getPageIndices(),
          size: formatFileSize(arrayBuffer.byteLength),
          pageRotations: {}, // User-applied rotations start at 0; inherent rotation is preserved in the PDF
        };

        newFiles.push(newFile);
      })
    );

    if (newFiles.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setMergedFile(DEFAULT_MERGED_FILE);
      toast.success(`Added ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`);
      scrollIntoView("#merge-button");
    }
  };

  const handleMerge = async () => {
    setIsProcessing(true);

    try {
      const mergedPdf = await mergePDFs(files, { uniformWidth });
      const pdf = await PDFDocument.load(mergedPdf);

      const blob = new Blob([mergedPdf], { type: "application/pdf" });
      const file = new File([blob], "merged.pdf", { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);
      setMergedFile({
        file,
        previewUrl,
        name: "merged",
        size: formatFileSize(blob.size),
        pages: pdf.getPageCount(),
        id: generateRandomId(),
        selectedPages: pdf.getPageIndices(),
        pageRotations: {},
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to merge PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
      scrollIntoView("#merged-pdf-preview", {
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  const handleDownload = () => {
    if (!mergedFile.previewUrl) return;

    const link = document.createElement("a");
    link.href = mergedFile.previewUrl;
    const fileName = mergedFile.name ?? "merged";
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(mergedFile.previewUrl);
    toast.success("PDF downloaded successfully!");
  };

  const handlePageSelectionChange = useCallback((fileId: string, selectedPages: number[]) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.id === fileId ? { ...file, selectedPages } : file))
    );
  }, []);

  const reorderFiles = useCallback((activeId: string, overId: string) => {
    setFiles((prevFiles) => {
      const oldIndex = prevFiles.findIndex((file) => file.id === activeId);
      const newIndex = prevFiles.findIndex((file) => file.id === overId);

      if (oldIndex === -1 || newIndex === -1) return prevFiles;

      const reordered = [...prevFiles];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      return reordered;
    });
  }, []);

  const rotatePage = useCallback((fileId: string, pageNumber: number) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => {
        if (file.id !== fileId) return file;
        const currentRotation = file.pageRotations[pageNumber] ?? 0;
        // Keep accumulating (0, 90, 180, 270, 360, 450...) so the CSS transform
        // always animates forward. Consumers normalize with % 360 where needed.
        const newRotation = currentRotation + 90;
        return {
          ...file,
          pageRotations: {
            ...file.pageRotations,
            [pageNumber]: newRotation,
          },
        };
      })
    );
  }, []);

  const toggleUniformWidth = useCallback(() => {
    setUniformWidth((prev) => !prev);
  }, []);

  return {
    files,
    isProcessing,
    mergedFile,
    uniformWidth,
    removeFile,
    clearAllFiles,
    handleFileSelection,
    handleMerge,
    handleDownload,
    setMergedFile,
    handlePageSelectionChange,
    reorderFiles,
    rotatePage,
    toggleUniformWidth,
  };
};
