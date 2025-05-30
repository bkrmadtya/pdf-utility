"use client";

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
    handlePageSelectionChange,
  } = usePDFMerger();

  return (
    <>
      <FileUpload onFileSelect={handleFileSelection} />
      <FileList
        files={files}
        onRemoveFile={removeFile}
        onClearAll={clearAllFiles}
        onMerge={handleMerge}
        isProcessing={isProcessing}
        onPageSelectionChange={handlePageSelectionChange}
      />
      <MergedPDFPreview
        previewUrl={mergedFile.previewUrl}
        name={mergedFile.name}
        size={mergedFile.size}
        pages={mergedFile.pages}
        onNameChange={(name) => setMergedFile((prev) => ({ ...prev, name }))}
        onDownload={handleDownload}
      />
    </>
  );
}
