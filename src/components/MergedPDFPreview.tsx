import { memo } from "react";
import { FileText, Download } from "lucide-react";

import { PDFFileWithPages } from "@/utils/pdfMerger";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PDFPreview from "./PDFPreview";

type MergedPDF = {
  mergedFile: { previewUrl: string } & PDFFileWithPages;
};

type MergedPDFPreviewProps = {
  onNameChange: (name: string) => void;
  onDownload: () => void;
} & MergedPDF;

const Preview = memo(({ mergedFile }: MergedPDF) => (
  <>
    <h3 id="merged-pdf-preview" className="text-sm sm:text-base text-white font-bold text-center">
      Preview
    </h3>
    <iframe
      src={mergedFile.previewUrl}
      className="w-full hidden sm:block h-[400px] sm:h-[600px] border-0 rounded-lg"
      title="Preview of merged PDF"
    />
    <div className="block sm:hidden h-[400px] overflow-y-scroll w-full p-4 bg-zinc-600 space-y-4 rounded-lg scroll-thin">
      {Array.from({ length: mergedFile.pages }).map((_, index) => (
        <PDFPreview key={index} file={mergedFile.file} pageNumber={index} scaleFactor={2} />
      ))}
    </div>
  </>
));
Preview.displayName = "Preview";

const MergedPDFPreview = ({ mergedFile, onNameChange, onDownload }: MergedPDFPreviewProps) => {
  if (!mergedFile.previewUrl) return null;

  const name = mergedFile?.name?.replace?.(".pdf", "");
  const pages = mergedFile.pages;

  return (
    <div className="space-y-6">
      {/* File Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-blue-100 border border-blue-600 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="size-14 bg-blue-200 rounded-lg flex items-center justify-center">
            <FileText className="size-6 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="max-w-fit flex items-center font-medium bg-white/90 border-none px-2 divide-x-2 divide-slate-400 shadow-none rounded-md">
              <Input
                defaultValue={name || "merged-document"}
                placeholder="file-name"
                aria-label="File Name"
                id="merged-file-name"
                onChange={(e) => onNameChange(e.target.value)}
                className="h-7 text-xs sm:text-sm text-zinc-800 text-right placeholder:text-gray-400 transparent border-0 focus-visible:ring-0 rounded-none shadow-none focus-visible:[box-shadow:inset_0_-1px_0_#155dfc] inset-shadow-blue-600"
              />
              <div className="text-xs sm:text-sm pl-1 font-medium text-slate-400 border-l-2 border-slate-450">
                .pdf
              </div>
            </div>
            <p className="text-xs sm:text-sm text-blue-800">
              {mergedFile.size} <span className="mx-1">•</span> {pages} page
              {pages > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          className="max-w-32 ml-auto sm:mx-0 px-8 bg-black hover:bg-black/80"
          type="button"
          onClick={onDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
      <Preview mergedFile={mergedFile} />
    </div>
  );
};

export default MergedPDFPreview;
