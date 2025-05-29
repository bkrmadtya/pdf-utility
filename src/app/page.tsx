"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import { Upload, FileText, X, Download, RotateCcw } from "lucide-react";

import { formatFileSize } from "@/utils/format";
import { generateRandomId } from "@/utils/generateRandomId";
import { mergePDFs, PDFFileWithPages } from "@/utils/pdfMerger";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_MERGED_FILE = {
  blob: new Blob(),
  previewUrl: "",
  name: "",
  size: "",
  pages: 0,
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

export default function Component() {
  const [files, setFiles] = useState<PDFFileWithPages[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mergedFile, setMergedFile] = useState(DEFAULT_MERGED_FILE);

  const removeFile = (id: string) => {
    setFiles((prevFiles) => (prevFiles || []).filter((file) => file.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setMergedFile(DEFAULT_MERGED_FILE);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);

    try {
      const mergedPdf = await mergePDFs(files);

      const pdf = await PDFDocument.load(mergedPdf);

      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdf], { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);
      setMergedFile({
        blob,
        previewUrl,
        name: "merged",
        size: formatFileSize(blob.size),
        pages: pdf.getPageCount(),
      });

      // toast.success("PDFs merged successfully!");
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
    setFiles((prevFiles) => [...(prevFiles || []), ...newFiles]);
    setMergedFile(DEFAULT_MERGED_FILE); // resetting merged file's preview

    toast.success(`Added ${newFiles.length} PDF file${newFiles.length > 1 ? "s" : ""}`);

    scrollIntoView("#merge-button");
  };

  const handleDownload = () => {
    if (!mergedFile) return;

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

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    handleFileSelection(droppedFiles);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 sm:pt-30 space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 text-balance">PDF Merger</h1>
          <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
            Free Tool
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto text-pretty">
          Combine multiple PDF files into one document. Select pages, preview, and download
          instantly.
        </p>
      </header>

      {/* File Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer border-zinc-800 hover:border-zinc-700 bg-zinc-900/80",
          { "border-blue-500 bg-blue-950/40": isDragOver }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <CardContent className="p-4 sm:p-8">
          <div className="text-center space-y-3 sm:space-y-4">
            <div
              className={cn(
                "size-12 sm:size-16 mx-auto rounded-full flex items-center justify-center transition-colors bg-zinc-800",
                { "bg-blue-800": isDragOver }
              )}
            >
              <Upload
                className={cn("size-6 sm:size-8 transition-colors text-blue-400", {
                  "text-blue-300": isDragOver,
                })}
              />
            </div>
            <div>
              <Button
                size="lg"
                className="mb-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
              >
                Choose PDF Files
              </Button>
              <p className="text-sm text-zinc-400">
                {isDragOver ? "Drop your PDF files here" : "or drag and drop your files here"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Supports multiple PDF files</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files && files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-100">
              Selected Files ({files?.length || 0})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFiles}
              className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
            >
              <X className="size-4 me-2" />
              Clear All
            </Button>
          </div>

          <div className="space-y-3">
            {(files || []).map((file) => (
              <Card key={file.id} className="overflow-hidden bg-zinc-900/80 border-zinc-800">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* File Icon */}
                    <div className="size-10 sm:size-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="size-5 sm:size-6 text-red-400" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-zinc-100 truncate text-sm sm:text-base">
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-zinc-400">
                            <span>{file.size}</span>
                            <span>
                              {file.pages} page{file.pages > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800 -mt-1 -mr-1"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      {/* Page Selection */}
                      <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm text-zinc-400">Pages:</span>
                        <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                          {file.selectedPages.length === file.pages
                            ? "All"
                            : file.selectedPages.join(", ")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-zinc-800"
                        >
                          Select Pages
                        </Button>
                      </div>
                    </div>

                    {/* Preview Thumbnail */}
                    <div className="w-12 sm:w-16 h-16 sm:h-20 bg-zinc-800 border border-zinc-700 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                      <div className="w-8 sm:w-12 h-12 sm:h-16 bg-zinc-700 rounded flex items-center justify-center">
                        <FileText className="size-4 sm:size-6 text-zinc-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Merge Button */}
          <div className="flex justify-center pt-4">
            <Button
              id="merge-button"
              size="lg"
              onClick={handleMerge}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="size-4 me-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Merge PDFs"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Result Section */}

      {mergedFile?.previewUrl && (
        <>
          <h3 id="merged-pdf-preview" className="text-white font-bold text-center">
            Merged Document
          </h3>

          <div className="space-y-4">
            {/* File Info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-green-100 border border-green-600 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="size-14 bg-green-200 rounded-lg flex items-center justify-center">
                  <FileText className="size-6 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 font-semibold">
                    <Input
                      defaultValue={mergedFile?.name || "merged-document.pdf"}
                      onChange={(e) => setMergedFile((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-7 text-xs sm:text-sm text-zinc-800 font-medium bg-white/90 focus-visible:ring-1 focus-visible:ring-green-600  border-none px-2 shadow-none max-w-fit"
                    />
                    <span className="text-xs sm:text-sm font-medium text-green-800  flex-shrink-0">
                      .pdf
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-800">
                    {mergedFile?.size} <span className="mx-1">•</span> {mergedFile.pages} page
                    {mergedFile.pages > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="max-w-32 ml-auto sm:mx-0 px-8 bg-black hover:bg-black/80"
                type="button"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            {/* PDF Preview */}
            <iframe
              src={mergedFile.previewUrl}
              className="w-full h-[400px] sm:h-[600px] border-0 rounded-lg"
              title="Preview of merged PDF"
            />
          </div>
        </>
      )}
    </div>
  );
}
