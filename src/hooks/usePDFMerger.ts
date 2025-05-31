import { useState } from "react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { formatFileSize } from "@/utils/format";
import { generateRandomId } from "@/utils/generateRandomId";
import { mergePDFs, PDFFileWithPages } from "@/utils/pdfMerger";


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

export function usePDFMerger() {
  const [files, setFiles] = useState<PDFFileWithPages[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedFile, setMergedFile] = useState(DEFAULT_MERGED_FILE);

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
    setMergedFile(DEFAULT_MERGED_FILE);
  };

  const clearAllFiles = () => {
    setFiles([]);
    setMergedFile(DEFAULT_MERGED_FILE);
  };

  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles?.length === 0) {
      toast.error("Please select PDF files to merge.");
      return;
    }

    const filteredValidFiles = Array.from(selectedFiles).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (filteredValidFiles.length === 0) {
      toast.error("No valid PDF files selected. Please select PDF files only.");
      return;
    }

    const areAllFilesValid = filteredValidFiles.length === selectedFiles.length;
    if (!areAllFilesValid) {
      toast.error("Invalid file type detected. Please select PDF files only.");
    }

    const newFiles: PDFFileWithPages[] = [];
    await Promise.allSettled(
      Array.from(selectedFiles).map(async (file) => {
        const pdf = await PDFDocument.load(await file.arrayBuffer());
        const pages = pdf.getPageCount();

        const newFile: PDFFileWithPages = {
          file,
          id: generateRandomId(),
          name: file.name,
          pages: pdf.getPageCount(),
          selectedPages: pages ? pdf.getPageIndices() : [],
          size: formatFileSize(file.size),
        };

        newFiles.push(newFile);
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setMergedFile(DEFAULT_MERGED_FILE);

    toast.success(`Added ${newFiles.length} PDF file${newFiles.length > 1 ? "s" : ""}`);
    scrollIntoView("#merge-button");
  };

  const handleMerge = async () => {
    setIsProcessing(true);

    try {
      const mergedPdf = await mergePDFs(files);
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

  const handlePageSelectionChange = (fileId: string, selectedPages: number[]) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId ? { ...file, selectedPages } : file
      )
    );
  };

  return {
    files,
    isProcessing,
    mergedFile,
    removeFile,
    clearAllFiles,
    handleFileSelection,
    handleMerge,
    handleDownload,
    setMergedFile,
    handlePageSelectionChange,
  };
} 