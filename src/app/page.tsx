"use client";

import { Header } from "@/components/pdf-merger/Header";
import { FileUpload } from "@/components/pdf-merger/FileUpload";
import { FileList } from "@/components/pdf-merger/FileList";
import { MergedPDFPreview } from "@/components/pdf-merger/MergedPDFPreview";
import { usePDFMerger } from "@/hooks/usePDFMerger";

export default function Component() {
  const {
    files,
    isProcessing,
    mergedFile,
    removeFile,
    clearAllFiles,
    handleFileSelection,
    handleMerge,
    handleDownload,
    setMergedFile,
  } = usePDFMerger();

  return (
    <div className="max-w-4xl mx-auto py-12 sm:pt-30 space-y-6 sm:space-y-8">
      <Header />
      <FileUpload onFileSelect={handleFileSelection} />
      <FileList
        files={files}
        onRemoveFile={removeFile}
        onClearAll={clearAllFiles}
        onMerge={handleMerge}
        isProcessing={isProcessing}
      />
      <MergedPDFPreview
        previewUrl={mergedFile.previewUrl}
        name={mergedFile.name}
        size={mergedFile.size}
        pages={mergedFile.pages}
        onNameChange={(name) => setMergedFile((prev) => ({ ...prev, name }))}
        onDownload={handleDownload}
      />
    </div>
  );
}
