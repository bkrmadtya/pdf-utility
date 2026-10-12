import { X, RotateCcw, Trash, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import PDFPreview from "@/components/PDFPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatNumberToRanges } from "@/utils/format";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Modifier,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";

// Creates a modifier that locks dragging to the vertical axis AND clamps the
// dragged card within the bounds of a given container element, so a card can
// never be dragged outside the list.
function createVerticalClampModifier(
  containerRef: React.RefObject<HTMLDivElement | null>
): Modifier {
  return ({ transform, draggingNodeRect }) => {
    const next = { ...transform, x: 0 };

    const container = containerRef.current;
    if (!draggingNodeRect || !container) return next;

    const containerRect = container.getBoundingClientRect();
    const minY = containerRect.top - draggingNodeRect.top;
    const maxY = containerRect.bottom - draggingNodeRect.bottom;

    next.y = Math.min(Math.max(next.y, minY), maxY);

    return next;
  };
}

type FileListProps = {
  files: PDFFileWithPages[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onMerge: () => void;
  isProcessing: boolean;
  onPageSelectionChange?: (fileId: string, selectedPages: number[]) => void;
  onReorderFiles: (activeId: string, overId: string) => void;
};

/* -------------------------------------------------------------------------- */
/* Preview strip — isolated + memoized so that the expensive canvas renders    */
/* do NOT re-run while a card is being dragged (drag updates `transform` on    */
/* every pointer frame, which would otherwise re-render the whole card).       */
/* -------------------------------------------------------------------------- */
type FilePreviewStripProps = {
  fileId: string;
  file: File;
  pages: number;
  selectedPages: number[];
  onTogglePage: (fileId: string, pageNumber: number, checked: boolean) => void;
  onZoomPreview: (fileId: string, pageNumber: number) => void;
};

const FilePreviewStrip = memo(
  ({ fileId, file, pages, selectedPages, onTogglePage, onZoomPreview }: FilePreviewStripProps) => {
    return (
      <div className="relative">
        <div className="w-full overflow-x-auto scrollbar-thin pb-2">
          <ul className="flex items-end gap-3 pt-2 px-1">
            {Array.from({ length: pages }, (_, i) => i).map((pageNum) => {
              const isSelected = selectedPages.includes(pageNum);
              return (
                <li key={pageNum} className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div
                    className={cn(
                      "relative cursor-pointer group rounded-lg overflow-hidden ring-2 transition-[box-shadow,border-color] duration-200",
                      isSelected
                        ? "ring-blue-500 shadow-lg shadow-blue-500/20"
                        : "ring-zinc-700/50 hover:ring-zinc-600"
                    )}
                    onClick={() => onZoomPreview(fileId, pageNum)}
                    style={{ width: "140px" }}
                  >
                    <PDFPreview file={file} pageNumber={pageNum} />
                    <div
                      className={cn(
                        "absolute inset-0 transition-opacity duration-200",
                        isSelected ? "bg-blue-500/10" : "bg-zinc-950/0 group-hover:bg-blue-500/5"
                      )}
                    />
                    {/* Page Number Badge */}
                    <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md border border-zinc-700/50">
                      {pageNum + 1}
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
                      <span className="text-white text-xs font-medium bg-blue-600 px-3 py-1.5 rounded-full">
                        Click to zoom
                      </span>
                    </div>
                  </div>
                  {/* Checkbox - Fixed Height for Alignment */}
                  <div className="flex items-center gap-2 h-6">
                    <Checkbox
                      id={`page-${fileId}-${pageNum}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => onTogglePage(fileId, pageNum, checked === true)}
                      className="border-zinc-600"
                    />
                    <label
                      htmlFor={`page-${fileId}-${pageNum}`}
                      className="text-sm text-zinc-300 cursor-pointer select-none hover:text-zinc-100 transition-colors whitespace-nowrap leading-none"
                    >
                      Page {pageNum + 1}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
);
FilePreviewStrip.displayName = "FilePreviewStrip";

/* -------------------------------------------------------------------------- */
/* Sortable file card                                                          */
/* -------------------------------------------------------------------------- */
type SortableFileCardProps = {
  file: PDFFileWithPages;
  onRemoveFile: (id: string) => void;
  onTogglePage: (fileId: string, pageNumber: number, checked: boolean) => void;
  onSelectAll: (fileId: string, selectAll: boolean) => void;
  onZoomPreview: (fileId: string, pageNumber: number) => void;
};

const SortableFileCard = memo(
  ({ file, onRemoveFile, onTogglePage, onSelectAll, onZoomPreview }: SortableFileCardProps) => {
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
              className="flex-shrink-0 w-10 h-16 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors border border-zinc-700/30 hover:border-zinc-600 touch-none"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4 text-zinc-500" />
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
                onTogglePage={onTogglePage}
                onZoomPreview={onZoomPreview}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
SortableFileCard.displayName = "SortableFileCard";

/* -------------------------------------------------------------------------- */
/* FileList                                                                    */
/* -------------------------------------------------------------------------- */
const FileList = ({
  files,
  onRemoveFile,
  onClearAll,
  onMerge,
  isProcessing,
  onPageSelectionChange,
  onReorderFiles,
}: FileListProps) => {
  const [zoomPreview, setZoomPreview] = useState<{
    file: PDFFileWithPages;
    pageNumber: number;
  } | null>(null);

  // Ref to the sortable list wrapper — used to clamp dragging within its bounds.
  const listContainerRef = useRef<HTMLDivElement>(null);
  const verticalClampModifier = useMemo(() => createVerticalClampModifier(listContainerRef), []);

  // Keep a ref to the latest files so the memoized callbacks below can read
  // current state without listing `files` as a dependency. That keeps the
  // callbacks referentially stable across reorders, so cards that didn't change
  // (and their PDFPreview canvases) are not re-rendered.
  const filesRef = useRef(files);
  filesRef.current = files;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorderFiles(String(active.id), String(over.id));
      }
    },
    [onReorderFiles]
  );

  // Stable callback: toggle a single page for a file.
  const handleTogglePage = useCallback(
    (fileId: string, pageNumber: number, checked: boolean) => {
      const file = filesRef.current.find((f) => f.id === fileId);
      if (!file) return;
      const newSelectedPages = checked
        ? [...file.selectedPages, pageNumber].sort((a, b) => a - b)
        : file.selectedPages.filter((p) => p !== pageNumber);
      onPageSelectionChange?.(fileId, newSelectedPages);
    },
    [onPageSelectionChange]
  );

  // Stable callback: select/unselect all pages for a file.
  const handleSelectAll = useCallback(
    (fileId: string, selectAll: boolean) => {
      const file = filesRef.current.find((f) => f.id === fileId);
      if (!file) return;
      onPageSelectionChange?.(
        fileId,
        selectAll ? Array.from({ length: file.pages }, (_, i) => i) : []
      );
    },
    [onPageSelectionChange]
  );

  const handleZoomPreview = useCallback((fileId: string, pageNumber: number) => {
    const file = filesRef.current.find((f) => f.id === fileId);
    if (file) setZoomPreview({ file, pageNumber });
  }, []);

  const closeZoomPreview = useCallback(() => setZoomPreview(null), []);

  if (!files || files.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 mb-1">Selected Files</h2>
          <p className="text-sm text-zinc-400">
            {files.length} file{files.length !== 1 ? "s" : ""} ready to merge
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20 border border-zinc-700/50 hover:border-red-600/50 transition-colors"
        >
          <X className="size-4 me-2" />
          Clear All
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[verticalClampModifier]}
      >
        <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div ref={listContainerRef} className="space-y-4">
            {files.map((file) => (
              <SortableFileCard
                key={file.id}
                file={file}
                onRemoveFile={onRemoveFile}
                onTogglePage={handleTogglePage}
                onSelectAll={handleSelectAll}
                onZoomPreview={handleZoomPreview}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Merge Button */}
      <div className="flex justify-center pt-6">
        <Button
          id="merge-button"
          size="lg"
          onClick={onMerge}
          disabled={isProcessing || !files.some((file) => file.selectedPages.length > 0)}
          className="w-full sm:w-auto px-8 py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <RotateCcw className="size-5 me-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Merge PDFs"
          )}
        </Button>
      </div>

      {/* Zoom Preview Modal */}
      {zoomPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeZoomPreview}
        >
          <div
            className="relative bg-zinc-900 rounded-xl p-6 max-w-5xl max-h-[90vh] overflow-auto shadow-2xl border border-zinc-700/50 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-1">{zoomPreview.file.name}</h3>
                <p className="text-sm text-zinc-400">
                  Page {zoomPreview.pageNumber + 1} of {zoomPreview.file.pages}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeZoomPreview}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
              >
                <X className="size-5" />
              </Button>
            </div>
            {/* Preview Content */}
            <div className="flex justify-center bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50">
              <PDFPreview
                file={zoomPreview.file.file}
                pageNumber={zoomPreview.pageNumber}
                scaleFactor={2}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
