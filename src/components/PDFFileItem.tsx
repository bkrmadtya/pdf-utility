import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import PDFPreview from "./PDFPreview";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { formatFileSize } from "@/utils/format";

interface PDFFileItemProps {
  fileData: PDFFileWithPages;
  index: number;
  pageCount: number;
  fileSize: number;
  isSinglePage: boolean;
  onRemove: (index: number) => void;
  onTogglePageSelection: (fileIndex: number, pageNumber: number) => void;
  onSelectAllPages: (fileIndex: number) => void;
  onClearPageSelection: (fileIndex: number) => void;
}

const PDFFileItem = ({
  fileData,
  index,
  pageCount,
  fileSize,
  isSinglePage,
  onRemove,
  onTogglePageSelection,
  onSelectAllPages,
  onClearPageSelection,
}: PDFFileItemProps) => {
  return (
    <li className="bg-muted/50 p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{fileData.file.name}</span>
          <Badge variant="secondary" className="text-xs">
            {formatFileSize(fileSize)}
          </Badge>
        </div>
        <Button
          variant="ghost"
          onClick={() => onRemove(index)}
          className="text-sm text-destructive hover:text-destructive p-1 h-auto cursor-pointer"
          title="Remove file"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">Select pages:</span>
          {!isSinglePage && (
            <>
              <Button
                variant="link"
                onClick={() => onSelectAllPages(index)}
                className="text-xs cursor-pointer"
              >
                Select All
              </Button>
              <Button
                variant="link"
                onClick={() => onClearPageSelection(index)}
                className="text-xs text-muted-foreground cursor-pointer"
              >
                Clear
              </Button>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mb-4" role="group">
          {Array.from({ length: pageCount }, (_, i) => (
            <Button
              key={i}
              variant={fileData.selectedPages.includes(i) ? "default" : "outline"}
              size="sm"
              onClick={() => onTogglePageSelection(index, i)}
              disabled={isSinglePage}
              className={`w-8 h-8 text-xs ${isSinglePage ? "cursor-not-allowed opacity-75" : ""}`}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {isSinglePage
            ? "Single page document (automatically selected)"
            : fileData.selectedPages.length === 0
            ? "No pages selected (will use all pages)"
            : `${fileData.selectedPages.length} page${
                fileData.selectedPages.length === 1 ? "" : "s"
              } selected`}
        </div>

        {/* Preview section */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Preview:</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {fileData.selectedPages.map((pageNum) => (
              <div key={pageNum} className="relative max-w-[150px]">
                <PDFPreview file={fileData.file} pageNumber={pageNum + 1} />
                <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                  Page {pageNum + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
};

export default PDFFileItem;
