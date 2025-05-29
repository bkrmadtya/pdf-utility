import { FileText, X, RotateCcw, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFFileWithPages } from "@/utils/pdfMerger";

interface FileListProps {
  files: PDFFileWithPages[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onMerge: () => void;
  isProcessing: boolean;
}

export function FileList({
  files,
  onRemoveFile,
  onClearAll,
  onMerge,
  isProcessing,
}: FileListProps) {
  if (!files || files.length === 0) return null;

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
                        : file.selectedPages.join(", ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2 text-blue-400 hover:text-blue-300 hover:bg-zinc-800"
                    >
                      Select Pages
                    </Button>
                  </div>
                </div>{" "}
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
