import { X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import PDFPreview from "@/components/PDFPreview";

export type ZoomPreviewModalProps = {
  file: PDFFileWithPages;
  pageNumber: number;
  onClose: () => void;
  onRotatePage: (fileId: string, pageNumber: number) => void;
};

const ZoomPreviewModal = ({ file, pageNumber, onClose, onRotatePage }: ZoomPreviewModalProps) => {
  const rotation = file.pageRotations[pageNumber] ?? 0;
  // Normalize to 0/90/180/270 for layout decisions; `rotation` itself keeps
  // accumulating so the CSS transform animates forward.
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = normalizedRotation === 90 || normalizedRotation === 270;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-900 rounded-xl p-4 sm:p-6 shadow-2xl border border-zinc-700/50 animate-in zoom-in-95 duration-200 flex flex-col max-w-[95vw] max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h3 className="sm:text-xl font-semibold text-zinc-50 mb-1 truncate max-w-[200px] sm:max-w-[400px]">
              {file.name}
            </h3>
            <p className="text-sm text-zinc-400">
              Page {pageNumber + 1} of {file.pages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRotatePage(file.id, pageNumber)}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
              aria-label="Rotate page"
            >
              <RotateCw className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
        {/* Preview Content */}
        <div
          className="relative flex items-center justify-center bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden"
          style={{
            width: "85vw",
            height: "75vh",
            maxWidth: "900px",
            maxHeight: "85vh",
          }}
        >
          <div
            className="flex items-center justify-center w-full h-full p-4"
            style={{
              transform: rotation
                ? `rotate(${rotation}deg)${isRotated90or270 ? " scale(0.65)" : ""}`
                : undefined,
              transition: "transform 0.3s ease-in-out",
              transformOrigin: "center center",
            }}
          >
            <PDFPreview file={file.file} pageNumber={pageNumber} scaleFactor={2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomPreviewModal;
