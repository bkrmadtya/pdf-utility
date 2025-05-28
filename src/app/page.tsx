"use client";

import { useState } from "react";
import { mergePDFs, PDFFileWithPages } from "../utils/pdfMerger";
import { PDFDocument } from "pdf-lib";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");

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
      setSelectedFileIndex(null); // Clear any selected file preview
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsMerging(false);
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
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (selectedFileIndex === index) {
      setSelectedFileIndex(null);
    }
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
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">PDF Merger</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-700
                  cursor-pointer"
              />
            </div>

            {files.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Selected Files:</h2>
                <ul className="space-y-4">
                  {files.map((fileData, index) => (
                    <li key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">
                            {fileData.file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(fileSizes[fileData.file.name] || 0)})
                          </span>
                          <button
                            onClick={() => setSelectedFileIndex(index)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Preview
                          </button>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Select pages:</span>
                          {!isSinglePage(fileData.file.name) && (
                            <>
                              <button
                                onClick={() => selectAllPages(index)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                Select All
                              </button>
                              <button
                                onClick={() => clearPageSelection(index)}
                                className="text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from({ length: pageCounts[fileData.file.name] || 0 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => togglePageSelection(index, i)}
                              className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                                fileData.selectedPages.includes(i)
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              } ${
                                isSinglePage(fileData.file.name)
                                  ? "cursor-not-allowed opacity-75"
                                  : ""
                              }`}
                              disabled={isSinglePage(fileData.file.name)}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
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
            )}

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging || hasUnselectedMultiPageFiles()}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                files.length < 2 || isMerging || hasUnselectedMultiPageFiles()
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              }`}
            >
              {isMerging ? "Merging..." : "Merge PDFs"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
                {mergedBlob && (
                  <span className="text-sm text-gray-500">
                    Size: {formatFileSize(mergedBlob.size)}
                  </span>
                )}
              </div>
              {mergedPreviewUrl && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">File name:</span>
                    <input
                      type="text"
                      value={mergedFileName}
                      onChange={(e) => setMergedFileName(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="merged.pdf"
                    />
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors"
                  >
                    Download Merged PDF
                  </button>
                </div>
              )}
            </div>
            <div className="h-[600px] w-full bg-gray-50 rounded-lg border border-gray-200">
              {selectedFileIndex !== null && files[selectedFileIndex] && (
                <iframe
                  src={previewFile(files[selectedFileIndex].file)}
                  className="w-full h-full border-0 rounded-lg"
                  title="PDF Preview"
                />
              )}
              {mergedPreviewUrl && selectedFileIndex === null && (
                <iframe
                  src={mergedPreviewUrl}
                  className="w-full h-full border-0 rounded-lg"
                  title="Merged PDF Preview"
                />
              )}
              {!selectedFileIndex && !mergedPreviewUrl && (
                <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                  Select a file to preview or merge PDFs to see the result
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
