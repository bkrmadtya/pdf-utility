import { FileText, X, RotateCcw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { useState } from "react";
import PDFPreview from "@/components/PDFPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FileListProps {
  files: PDFFileWithPages[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onMerge: () => void;
  isProcessing: boolean;
  onPageSelectionChange?: (fileId: string, selectedPages: number[]) => void;
}

export function FileList({
  files,
  onRemoveFile,
  onClearAll,
  onMerge,
  isProcessing,
  onPageSelectionChange,
}: FileListProps) {
  const [expandedFileIds, setExpandedFileIds] = useState<string[]>([]);

  if (!files || files.length === 0) return null;

  const handlePageSelection = (fileId: string, pageNumber: number, checked: boolean | string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const isChecked = checked === true || checked === "checked";
    let newSelectedPages: number[];
    if (isChecked) {
      newSelectedPages = [...file.selectedPages, pageNumber].sort((a, b) => a - b);
    } else {
      newSelectedPages = file.selectedPages.filter((p) => p !== pageNumber);
    }

    onPageSelectionChange?.(fileId, newSelectedPages);
  };

  const handleSelectAllPages = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const newSelectedPageIndices = Array.from({ length: file.pages }, (_, i) => i);
    onPageSelectionChange?.(fileId, newSelectedPageIndices);
  };

  const toggleFileExpansion = (fileId: string) => {
    setExpandedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-100">
          Selected Files ({files.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
        >
          <X className="size-4 me-2" />
          Clear All
        </Button>
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden bg-zinc-900/80 border-zinc-800">
            <CardContent>
              <div className="flex items-start gap-3 sm:gap-4">
                {/* File Icon */}
                <div className="size-10 sm:size-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="size-5 sm:size-6 text-blue-400" />
                </div>
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-zinc-100 truncate text-sm sm:text-base">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-zinc-400">
                        <span>{file.size}</span>
                        <span>
                          {file.pages} page{file.pages > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveFile(file.id)}
                      className="hover:bg-zinc-800 -mt-1 -mr-1"
                    >
                      <Trash className="size-4 text-red-400 font-bold" />
                    </Button>
                  </div>

                  {/* Page Selection */}
                  <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm text-zinc-400">Pages:</span>
                    <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                      {file.selectedPages.length === file.pages
                        ? "All"
                        : file.selectedPages.map((page) => page + 1).join(", ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-zinc-800"
                      onClick={() => toggleFileExpansion(file.id)}
                    >
                      {expandedFileIds.includes(file.id) ? "Hide Pages" : "Select Pages"}
                    </Button>
                  </div>
                </div>
              </div>
              {/* PDF Previews and Page Selection */}
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out grid-rows-[0fr] opacity-0",
                  {
                    "grid-rows-[1fr] opacity-100": expandedFileIds.includes(file.id),
                  }
                )}
              >
                <div className="overflow-hidden">
                  <Button
                    id={`select-all-${file.id}`}
                    variant="ghost"
                    size="sm"
                    className="float-right text-xs h-6 px-2 my-2 text-blue-400 hover:text-blue-300 hover:bg-zinc-800"
                    onClick={() => handleSelectAllPages(file.id)}
                  >
                    Select All Pages
                  </Button>
                  <div className="w-full overflow-x-auto scrollbar-thin">
                    <ul className="min-w-min flex gap-4 pb-4">
                      {Array.from({ length: file.pages }, (_, i) => i).map((pageNum) => (
                        <li
                          key={pageNum}
                          className="flex flex-col items-center gap-2 w-24 sm:w-30 aspect-[4/3]"
                        >
                          <PDFPreview file={file.file} pageNumber={pageNum} />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`page-${file.id}-${pageNum}`}
                              checked={file.selectedPages.includes(pageNum)}
                              onCheckedChange={(checked: boolean | "checked" | "unchecked") =>
                                handlePageSelection(file.id, pageNum, checked)
                              }
                            />
                            <label
                              htmlFor={`page-${file.id}-${pageNum}`}
                              className="text-sm text-zinc-300 cursor-pointer"
                            >
                              Page {pageNum + 1}
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Merge Button */}
      <div className="flex justify-center pt-4">
        <Button
          id="merge-button"
          size="lg"
          onClick={onMerge}
          disabled={isProcessing}
          className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <RotateCcw className="size-4 me-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Merge PDFs"
          )}
        </Button>
      </div>
    </div>
  );
}
