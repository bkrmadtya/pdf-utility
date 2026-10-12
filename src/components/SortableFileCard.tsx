import { memo } from "react";
import { Trash, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { useSortable } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { formatNumberToRanges } from "@/utils/format";
import FilePreviewStrip from "@/components/FilePreviewStrip";

export type SortableFileCardProps = {
  file: PDFFileWithPages;
  onRemoveFile: (id: string) => void;
  onTogglePage: (fileId: string, pageNumber: number, checked: boolean) => void;
  onSelectAll: (fileId: string, selectAll: boolean) => void;
  onZoomPreview: (fileId: string, pageNumber: number) => void;
  onRotatePage: (fileId: string, pageNumber: number) => void;
};

const SortableFileCard = memo(
  ({
    file,
    onRemoveFile,
    onTogglePage,
    onSelectAll,
    onZoomPreview,
    onRotatePage,
  }: SortableFileCardProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: file.id,
    });

    // Only translate vertically — strip scaleX/scaleY (which skews the card to match
    // the target's size) and lock horizontal movement to 0 so dragging is vertical-only.
    const style = {
      transform: transform ? `translate3d(0px, ${Math.round(transform.y)}px, 0)` : undefined,
      transition,
      willChange: isDragging ? ("transform" as const) : undefined,
    };

    const isAllSelected = file.selectedPages.length === file.pages;

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          "overflow-hidden bg-zinc-900/60 backdrop-blur-sm border-zinc-700/50 hover:border-zinc-600/50 p-0",
          // While dragging, drop the expensive color/shadow transition so the card
          // tracks the pointer 1:1; keep it only for the settle animation otherwise.
          isDragging
            ? "opacity-50 shadow-2xl ring-2 ring-blue-500/50 relative z-10"
            : "transition-colors duration-200"
        )}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="flex-shrink-0 w-10 h-10 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-5 text-zinc-500" />
            </button>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-50 text-base sm:text-lg mb-2 truncate">
                    {file.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {file.size}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                      {file.pages} page{file.pages > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(file.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
                >
                  <Trash className="size-4" />
                </Button>
              </div>

              {/* Page Selection Controls - Only show for multi-page files */}
              {file.pages > 1 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-zinc-800/50">
                  <span className="text-sm font-medium text-zinc-300">Selected:</span>
                  <Badge
                    variant="outline"
                    className="text-xs border-blue-600/50 bg-blue-950/30 text-blue-300 font-medium"
                  >
                    {isAllSelected
                      ? "All Pages"
                      : file.selectedPages.length === 0
                        ? "None"
                        : formatNumberToRanges(file.selectedPages.map((page) => page + 1))}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-3 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 border border-blue-600/20 hover:border-blue-500/40 transition-colors"
                    onClick={() => onSelectAll(file.id, !isAllSelected)}
                  >
                    {isAllSelected ? "Unselect All" : "Select All"}
                  </Button>
                </div>
              )}

              {/* PDF Previews - Always Visible (isolated + memoized) */}
              <FilePreviewStrip
                fileId={file.id}
                file={file.file}
                pages={file.pages}
                selectedPages={file.selectedPages}
                pageRotations={file.pageRotations}
                onTogglePage={onTogglePage}
                onZoomPreview={onZoomPreview}
                onRotatePage={onRotatePage}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

SortableFileCard.displayName = "SortableFileCard";

export default SortableFileCard;
