"use client";

import FileUpload from "@/components/FileUpload";
import FileList from "@/components/FileList";
import MergedPDFPreview from "@/components/MergedPDFPreview";
import { usePDFMerger } from "@/hooks/usePDFMerger";

const Component = () => {
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
        mergedFile={mergedFile}
        onNameChange={(name: string) => setMergedFile((prev) => ({ ...prev, name }))}
        onDownload={handleDownload}
      />
    </>
  );
};

export default Component;
