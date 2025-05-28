"use client";

import { useState, useRef } from "react";
import { mergePDFs, PDFFileWithPages } from "../utils/pdfMerger";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PDFFileItem from "@/components/PDFFileItem";
import MergedPDFPreview from "@/components/MergedPDFPreview";

// Dynamically import the client-only worker configuration
import("../lib/pdfjs-worker-client");

export default function Home() {
  const [files, setFiles] = useState<PDFFileWithPages[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState<string | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [pageCounts, setPageCounts] = useState<{ [key: string]: number }>({});
  const mergedFileNameRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");

      if (newFiles.length === 0) {
        toast.error("Please select PDF files only");
        return;
      }

      // Get page counts for new files
      const newPageCounts = { ...pageCounts };

      for (const file of newFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageCount = pdf.getPageCount();
        newPageCounts[file.name] = pageCount;
      }

      setPageCounts(newPageCounts);

      // Add new files with appropriate page selection
      setFiles((prev) => [
        ...prev,
        ...newFiles.map((file) => {
          const pageCount = newPageCounts[file.name];
          const isSinglePage = pageCount === 1;
          // Select all pages by default
          const selectedPages = Array.from({ length: pageCount }, (_, i) => i);
          return {
            file,
            selectedPages,
            isSinglePage,
            fileSize: file.size,
          };
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

    try {
      const mergedPdf = await mergePDFs(files);

      // Create a blob from the merged PDF
      const blob = new Blob([mergedPdf], { type: "application/pdf" });
      setMergedBlob(blob);

      // Create preview URL
      const previewUrl = URL.createObjectURL(blob);
      setMergedPreviewUrl(previewUrl);

      toast.success("PDFs merged successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to merge PDFs. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement("a");
      link.href = url;
      const fileName = mergedFileNameRef?.current?.value ?? "merged.pdf";
      link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    toast.success("File removed");
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
                  <ul className="space-y-6" role="list">
                    {files.map((fileData, index) => (
                      <PDFFileItem
                        key={index}
                        fileData={fileData}
                        index={index}
                        pageCount={pageCounts[fileData.file.name]}
                        fileSize={fileData.fileSize}
                        isSinglePage={isSinglePage(fileData.file.name)}
                        onRemove={removeFile}
                        onTogglePageSelection={togglePageSelection}
                        onSelectAllPages={selectAllPages}
                        onClearPageSelection={clearPageSelection}
                      />
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging || hasUnselectedMultiPageFiles()}
              className="w-full"
            >
              {isMerging ? "Merging..." : "Merge PDFs"}
            </Button>
          </CardContent>
        </Card>

        {mergedPreviewUrl && (
          <MergedPDFPreview
            mergedPreviewUrl={mergedPreviewUrl}
            mergedBlob={mergedBlob}
            mergedFileNameRef={mergedFileNameRef}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}
