import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MergedPDFPreviewProps {
  previewUrl: string;
  name: string;
  size: string;
  pages: number;
  onNameChange: (name: string) => void;
  onDownload: () => void;
}

export function MergedPDFPreview({
  previewUrl,
  name,
  size,
  pages,
  onNameChange,
  onDownload,
}: MergedPDFPreviewProps) {
  if (!previewUrl) return null;

  return (
    <>
      <h3 id="merged-pdf-preview" className="text-white font-bold text-center">
        Merged Document
      </h3>

      <div className="space-y-4">
        {/* File Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-blue-100 border border-blue-600 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="size-14 bg-blue-200 rounded-lg flex items-center justify-center">
              <FileText className="size-6 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1 font-semibold">
                <Input
                  defaultValue={name || "merged-document.pdf"}
                  onChange={(e) => onNameChange(e.target.value)}
                  className="h-7 text-xs sm:text-sm text-zinc-800 font-medium bg-white/90 focus-visible:ring-1 focus-visible:ring-blue-600  border-none px-2 shadow-none max-w-fit"
                />
                <span className="text-xs sm:text-sm font-medium text-blue-800  flex-shrink-0">
                  .pdf
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-800">
                {size} <span className="mx-1">•</span> {pages} page
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

        {/* PDF Preview */}
        <iframe
          src={previewUrl}
          className="w-full hidden sm:block h-[400px] sm:h-[600px] border-0 rounded-lg"
          title="Preview of merged PDF"
        />
      </div>
    </>
  );
}
