import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { useCallback, useMemo, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Modifier,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableFileCard from "@/components/SortableFileCard";
import ZoomPreviewModal from "@/components/ZoomPreviewModal";

// Creates a modifier that locks dragging to the vertical axis AND clamps the
// dragged card within the bounds of a given container element.
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
  onRotatePage: (fileId: string, pageNumber: number) => void;
  uniformWidth: boolean;
  onToggleUniformWidth: () => void;
};

const FileList = ({
  files,
  onRemoveFile,
  onClearAll,
  onMerge,
  isProcessing,
  onPageSelectionChange,
  onReorderFiles,
  onRotatePage,
  uniformWidth,
  onToggleUniformWidth,
}: FileListProps) => {
  const [zoomPreview, setZoomPreview] = useState<{
    fileId: string;
    pageNumber: number;
  } | null>(null);

  // Ref to the sortable list wrapper — used to clamp dragging within its bounds.
  const listContainerRef = useRef<HTMLDivElement>(null);
  const verticalClampModifier = useMemo(() => createVerticalClampModifier(listContainerRef), []);

  // Keep a ref to the latest files so the memoized callbacks below can read
  // current state without listing `files` as a dependency.
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
    setZoomPreview({ fileId, pageNumber });
  }, []);

  const handleRotatePage = useCallback(
    (fileId: string, pageNumber: number) => {
      onRotatePage(fileId, pageNumber);
    },
    [onRotatePage]
  );

  const closeZoomPreview = useCallback(() => setZoomPreview(null), []);

  if (!files || files.length === 0) return null;

  // Get the current file for zoom modal
  const zoomFile = zoomPreview ? files.find((f) => f.id === zoomPreview.fileId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 mb-1">Selected Files</h2>
          <p className="text-sm text-zinc-400">
            {files.length} file{files.length !== 1 ? "s" : ""} ready to merge
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Uniform Width Toggle - applies to merged PDF output */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="uniform-width"
              checked={uniformWidth}
              onCheckedChange={onToggleUniformWidth}
              className="border-zinc-600"
            />
            <label
              htmlFor="uniform-width"
              className="text-sm text-zinc-300 cursor-pointer select-none hover:text-zinc-100 transition-colors whitespace-nowrap"
              title="Scale all pages to the same width in the merged PDF"
            >
              Uniform page width
            </label>
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
                onRotatePage={handleRotatePage}
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
      {zoomPreview && zoomFile && (
        <ZoomPreviewModal
          file={zoomFile}
          pageNumber={zoomPreview.pageNumber}
          onClose={closeZoomPreview}
          onRotatePage={onRotatePage}
        />
      )}
    </div>
  );
};

export default FileList;
