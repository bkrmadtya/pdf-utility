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

const DEFAULT_MERGED_FILE = {
  blob: new Blob(),
  previewUrl: "",
  name: "",
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

  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsProcessing(true);

    try {
      const mergedPdf = await mergePDFs(files);

      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdf], { type: "application/pdf" });
      const previewUrl = URL.createObjectURL(blob);
      setMergedFile({ blob, previewUrl, name: `merged-${new Date().toISOString()}.pdf` });

      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to merge PDFs. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles?.length === 0) {
      toast.error("Please select PDF files only");
      return;
    }
    const newFiles: PDFFileWithPages[] = [];

    await Promise.allSettled(
      Array.from(selectedFiles).map(async (file) => {
        // Validate file type
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
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
        }
      })
    );
    setFiles((prevFiles) => [...(prevFiles || []), ...newFiles]);
    setMergedFile(DEFAULT_MERGED_FILE); // resetting merged file's preview

    toast.success(`Added ${newFiles.length} PDF file${newFiles.length > 1 ? "s" : ""}`);
  };

  const handleDownload = () => {
    if (!mergedFile) return;

    const link = document.createElement("a");
    link.href = mergedFile.previewUrl;
    const fileName = mergedFile.name ?? "merged.pdf";
    link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
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
    <div className="max-w-4xl mx-auto py-40 space-y-8">
      {/* Header */}
      <header className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-100 text-balance">PDF Merger</h1>
          <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
            Free Tool
          </Badge>
        </div>
        <p className="text-zinc-400 max-w-2xl mx-auto text-pretty">
          Combine multiple PDF files into one document. Select pages, preview, and download
          instantly.
        </p>
      </header>

      {/* File Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver
            ? "border-blue-500 bg-blue-950/20"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div
              className={`size-16 mx-auto rounded-full flex items-center justify-center transition-colors ${
                isDragOver ? "bg-blue-800" : "bg-zinc-800"
              }`}
            >
              <Upload
                className={`size-8 transition-colors ${
                  isDragOver ? "text-blue-300" : "text-blue-400"
                }`}
              />
            </div>
            <div>
              <Button
                size="lg"
                className="mb-2 bg-blue-600 hover:bg-blue-700"
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
            <h2 className="text-xl font-semibold text-zinc-100">
              Selected Files ({files?.length || 0})
            </h2>
          </div>

          <div className="space-y-3">
            {(files || []).map((file) => (
              <Card key={file.id} className="overflow-hidden bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* File Icon */}
                    <div className="size-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="size-6 text-red-400" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-zinc-100 truncate">{file.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
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
                          className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>

                      {/* Page Selection */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-zinc-400">Pages:</span>
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
                    <div className="w-16 h-20 bg-zinc-800 border border-zinc-700 rounded shadow-sm flex items-center justify-center flex-shrink-0">
                      <div className="w-12 h-16 bg-zinc-700 rounded flex items-center justify-center">
                        <FileText className="size-6 text-zinc-500" />
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
              size="lg"
              onClick={handleMerge}
              disabled={isProcessing}
              className="px-8 bg-blue-600 hover:bg-blue-700"
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

      {/* Merged PDF Preview */}
      {mergedFile?.previewUrl && (
        <>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-100">Merged PDF Preview</h2>

            {/* File Name Input */}
            <div className="flex items-center gap-3 max-w-md">
              <label className="text-sm font-medium text-zinc-300 whitespace-nowrap">
                File name:
              </label>
              <Input
                value={mergedFile?.name}
                onChange={(e) => setMergedFile((prev) => ({ ...prev, name: e.target.value }))}
                className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 focus-visible:ring-blue-500 focus-visible:border-blue-500"
              />
              <Button
                className="whitespace-nowrap bg-blue-600 hover:bg-blue-700"
                onClick={handleDownload}
              >
                <Download className="size-4 me-2" />
                Download
              </Button>
            </div>

            {/* PDF Preview */}
            <iframe
              src={mergedFile.previewUrl}
              className="w-full h-[600px] border-0 rounded-lg"
              title="Preview of merged PDF"
            />
          </div>
        </>
      )}
    </div>
  );
}
