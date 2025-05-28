"use client";

import { useState } from "react";
import { mergePDFs } from "../utils/pdfMerger";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPreviewUrl, setMergedPreviewUrl] = useState<string | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert("Please select at least 2 PDF files to merge");
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
      alert("Failed to merge PDFs. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (mergedBlob) {
      const url = URL.createObjectURL(mergedBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
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
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{file.name}</span>
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
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                files.length < 2 || isMerging
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              }`}
            >
              {isMerging ? "Merging..." : "Merge PDFs"}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              {mergedPreviewUrl && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm shadow-sm transition-colors"
                >
                  Download Merged PDF
                </button>
              )}
            </div>
            <div className="h-[600px] w-full bg-gray-50 rounded-lg border border-gray-200">
              {selectedFileIndex !== null && files[selectedFileIndex] && (
                <iframe
                  src={previewFile(files[selectedFileIndex])}
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
