"use client";

import { useState } from "react";
import { mergePDFs, PDFFileWithPages } from "../utils/pdfMerger";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Home() {
  const [files, setFiles] = useState<PDFFileWithPages[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [pageCounts, setPageCounts] = useState<{ [key: string]: number }>({});
  const [fileSizes, setFileSizes] = useState<{ [key: string]: number }>({});
  const [mergedFileName, setMergedFileName] = useState("merged.pdf");
  const [mergeProgress, setMergeProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");

      if (newFiles.length === 0) {
        toast.error("Please select PDF files only");
        return;
      }

      // Get page counts and file sizes for new files
      const newPageCounts = { ...pageCounts };
      const newFileSizes = { ...fileSizes };

      for (const file of newFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageCount = pdf.getPageCount();
        newPageCounts[file.name] = pageCount;
        newFileSizes[file.name] = file.size;
      }

      setPageCounts(newPageCounts);
      setFileSizes(newFileSizes);

      // Add new files with appropriate page selection
      setFiles((prev) => [
        ...prev,
        ...newFiles.map((file) => {
          const pageCount = newPageCounts[file.name];
          const isSinglePage = pageCount === 1;
          // Select all pages by default
          const selectedPages = Array.from({ length: pageCount }, (_, i) => i);
          return { file, selectedPages, isSinglePage };
        }),
      ]);

      toast.success(`Added ${newFiles.length} PDF file${newFiles.length > 1 ? "s" : ""}`);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    try {
      const mergedPdf = await mergePDFs(files);
      setMergeProgress(100);

      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdf], { type: "application/pdf" });
      setMergedBlob(blob);

      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setMergedPreviewUrl(previewUrl);
      setSelectedFileIndex(null); // Clear any selected file preview

      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to merge PDFs. Please try again.");
    } finally {
      setIsMerging(false);
      setTimeout(() => setMergeProgress(0), 1000);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = mergedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
    }
    toast.success("File removed");
  };

  const previewFile = (file: File) => {
    return URL.createObjectURL(file);
  };

  const togglePageSelection = (fileIndex: number, pageNumber: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = { ...newFiles[fileIndex] };
      const pageCount = pageCounts[file.file.name];

      // Don't allow deselection of single pages
      if (pageCount === 1) {
        return prev;
      }

      const pageIndex = file.selectedPages.indexOf(pageNumber);

      if (pageIndex === -1) {
        // Add page if not selected
        file.selectedPages = [...file.selectedPages, pageNumber].sort((a, b) => a - b);
      } else {
        // Remove page if already selected
        file.selectedPages = file.selectedPages.filter((p) => p !== pageNumber);
      }

      newFiles[fileIndex] = file;
      return newFiles;
    });
  };

  const selectAllPages = (fileIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = { ...newFiles[fileIndex] };
      const totalPages = pageCounts[file.file.name];
      file.selectedPages = Array.from({ length: totalPages }, (_, i) => i);
      newFiles[fileIndex] = file;
      return newFiles;
    });
  };

  const clearPageSelection = (fileIndex: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = { ...newFiles[fileIndex] };
      const pageCount = pageCounts[file.file.name];

      // Don't allow clearing selection for single pages
      if (pageCount === 1) {
        return prev;
      }

      file.selectedPages = [];
      newFiles[fileIndex] = file;
      return newFiles;
    });
  };

  const isSinglePage = (fileName: string) => {
    return pageCounts[fileName] === 1;
  };

  const hasUnselectedMultiPageFiles = () => {
    return files.some((file) => {
      const pageCount = pageCounts[file.file.name];
      return pageCount > 1 && file.selectedPages.length === 0;
    });
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-white">PDF Merger</h1>
            <Badge variant="secondary" className="text-sm">
              Free Online Tool
            </Badge>
          </div>
          <p className="mt-2 text-slate-300">
            Combine multiple PDF files into one document. Select specific pages, preview before
            merging, and download instantly.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>File Selection</CardTitle>
              <CardDescription>
                Select PDF files to merge and choose which pages to include
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Label htmlFor="file-input" className="sr-only">
                  Select PDF files
                </Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              {files.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-foreground">Selected Files:</h2>
                      <Badge variant="outline">
                        {files.length} file{files.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <ul className="space-y-4" role="list">
                      {files.map((fileData, index) => (
                        <li key={index} className="bg-muted/50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {fileData.file.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {formatFileSize(fileSizes[fileData.file.name] || 0)}
                              </Badge>
                              <Button
                                variant="link"
                                onClick={() => setSelectedFileIndex(index)}
                                className="text-sm p-1 h-auto cursor-pointer"
                                title="Preview PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => removeFile(index)}
                              className="text-sm text-destructive hover:text-destructive p-1 h-auto cursor-pointer"
                              title="Remove file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-muted-foreground">Select pages:</span>
                              {!isSinglePage(fileData.file.name) && (
                                <>
                                  <Button
                                    variant="link"
                                    onClick={() => selectAllPages(index)}
                                    className="text-xs cursor-pointer"
                                  >
                                    Select All
                                  </Button>
                                  <Button
                                    variant="link"
                                    onClick={() => clearPageSelection(index)}
                                    className="text-xs text-muted-foreground cursor-pointer"
                                  >
                                    Clear
                                  </Button>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1" role="group">
                              {Array.from(
                                { length: pageCounts[fileData.file.name] || 0 },
                                (_, i) => (
                                  <Button
                                    key={i}
                                    variant={
                                      fileData.selectedPages.includes(i) ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => togglePageSelection(index, i)}
                                    disabled={isSinglePage(fileData.file.name)}
                                    className={`w-8 h-8 text-xs ${
                                      isSinglePage(fileData.file.name)
                                        ? "cursor-not-allowed opacity-75"
                                        : ""
                                    }`}
                                  >
                                    {i + 1}
                                  </Button>
                                )
                              )}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              {isSinglePage(fileData.file.name)
                                ? "Single page document (automatically selected)"
                                : fileData.selectedPages.length === 0
                                ? "No pages selected (will use all pages)"
                                : `${fileData.selectedPages.length} page${
                                    fileData.selectedPages.length === 1 ? "" : "s"
                                  } selected`}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <div className="space-y-4">
                {isMerging && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Merging PDFs...</span>
                      <span className="text-muted-foreground">{mergeProgress}%</span>
                    </div>
                    <Progress value={mergeProgress} className="h-2" />
                  </div>
                )}
                <Button
                  onClick={handleMerge}
                  disabled={files.length < 2 || isMerging || hasUnselectedMultiPageFiles()}
                  className="w-full"
                >
                  {isMerging ? "Merging..." : "Merge PDFs"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Preview your PDF files and the merged result</CardDescription>
                </div>
                {mergedBlob && (
                  <Badge variant="secondary">Size: {formatFileSize(mergedBlob.size)}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {mergedPreviewUrl && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Label htmlFor="merged-filename" className="text-sm font-medium">
                        File name:
                      </Label>
                      <Input
                        id="merged-filename"
                        type="text"
                        value={mergedFileName}
                        onChange={(e) => setMergedFileName(e.target.value)}
                        className="flex-1"
                        placeholder="merged.pdf"
                      />
                    </div>
                    <Button onClick={handleDownload} variant="default">
                      Download Merged PDF
                    </Button>
                  </div>
                  <Separator className="my-4" />
                </>
              )}
              <div className="h-[600px] w-full bg-muted/50 rounded-lg border">
                {selectedFileIndex !== null && files[selectedFileIndex] && (
                  <iframe
                    src={previewFile(files[selectedFileIndex].file)}
                    className="w-full h-full border-0 rounded-lg"
                    title={`Preview of ${files[selectedFileIndex].file.name}`}
                  />
                )}
                {mergedPreviewUrl && selectedFileIndex === null && (
                  <iframe
                    src={mergedPreviewUrl}
                    className="w-full h-full border-0 rounded-lg"
                    title="Preview of merged PDF"
                  />
                )}
                {!selectedFileIndex && !mergedPreviewUrl && (
                  <div className="flex items-center justify-center h-full text-muted-foreground font-medium">
                    Select a file to preview or merge PDFs to see the result
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
