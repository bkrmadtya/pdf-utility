import { memo } from "react";
import { ZoomIn, RotateCw } from "lucide-react";
import PDFPreview from "@/components/PDFPreview";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type FilePreviewStripProps = {
  fileId: string;
  file: File;
  pages: number;
  selectedPages: number[];
  pageRotations: Record<number, number>;
  onTogglePage: (fileId: string, pageNumber: number, checked: boolean) => void;
  onZoomPreview: (fileId: string, pageNumber: number) => void;
  onRotatePage: (fileId: string, pageNumber: number) => void;
};

const FilePreviewStrip = memo(
  ({
    fileId,
    file,
    pages,
    selectedPages,
    pageRotations,
    onTogglePage,
    onZoomPreview,
    onRotatePage,
  }: FilePreviewStripProps) => {
    return (
      <div className="relative">
        <div className="w-full overflow-x-auto scrollbar-thin pb-2">
          <ul className="flex items-end gap-3 pt-2 px-1">
            {Array.from({ length: pages }, (_, i) => i).map((pageNum) => {
              const isSelected = selectedPages.includes(pageNum);
              const rotation = pageRotations[pageNum] ?? 0;
              // Normalize to 0/90/180/270 for layout decisions; `rotation` itself
              // keeps accumulating so the CSS transform animates forward.
              const normalizedRotation = ((rotation % 360) + 360) % 360;
              const isRotated90or270 = normalizedRotation === 90 || normalizedRotation === 270;

              return (
                <li key={pageNum} className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div
                    className={cn(
                      "relative group rounded-lg ring-2 transition-all duration-300 overflow-hidden flex items-center justify-center",
                      isSelected
                        ? "ring-blue-500 shadow-lg shadow-blue-500/20"
                        : "ring-zinc-700/50 hover:ring-zinc-600"
                    )}
                    style={{
                      width: 140,
                      height: 180,
                    }}
                  >
                    {/* Preview with CSS rotation - scales down to fit container when rotated */}
                    <div
                      className="flex items-center justify-center w-full h-full"
                      style={{
                        transform: rotation
                          ? `rotate(${rotation}deg)${isRotated90or270 ? " scale(0.78)" : ""}`
                          : undefined,
                        transformOrigin: "center center",
                        transition: "transform 0.3s ease-in-out",
                      }}
                    >
                      <PDFPreview file={file} pageNumber={pageNum} className="w-full h-full" />
                    </div>
                    <div
                      className={cn(
                        "absolute inset-0 transition-opacity duration-200 pointer-events-none",
                        isSelected ? "bg-blue-500/10" : "bg-zinc-950/0 group-hover:bg-blue-500/5"
                      )}
                    />
                    {/* Page Number Badge */}
                    <div className="absolute top-2 right-0 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md border border-zinc-700/50 z-10">
                      {pageNum + 1}
                    </div>
                    {/* Zoom Icon - Bottom Left (always visible on mobile, hover on desktop) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoomPreview(fileId, pageNum);
                      }}
                      className="absolute bottom-2 left-2 p-1.5 bg-black/70 hover:bg-blue-600 backdrop-blur-sm rounded-md border border-zinc-700/50 hover:border-blue-500 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                      aria-label={`Zoom page ${pageNum + 1}`}
                    >
                      <ZoomIn className="size-4 text-white" />
                    </button>
                    {/* Rotate Icon - Bottom Right (always visible on mobile, hover on desktop) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotatePage(fileId, pageNum);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-blue-600 backdrop-blur-sm rounded-md border border-zinc-700/50 hover:border-blue-500 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10"
                      aria-label={`Rotate page ${pageNum + 1}`}
                    >
                      <RotateCw className="size-4 text-white" />
                    </button>
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

export default FilePreviewStrip;
