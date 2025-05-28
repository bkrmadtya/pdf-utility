import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, GripVertical } from "lucide-react";
import PDFPreview from "./PDFPreview";
import { PDFFileWithPages } from "@/utils/pdfMerger";
import { formatFileSize } from "@/utils/format";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`bg-gray-800/50 p-4 rounded-lg border border-gray-700 ${
        isDragging ? "cursor-grabbing" : ""
      }`}
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-gray-300 transition-colors"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <h3 className="text-sm font-medium text-gray-100">{fileData.file.name}</h3>
          <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
            {formatFileSize(fileSize)}
          </Badge>
        </div>
        <Button
          variant="ghost"
          onClick={() => onRemove(index)}
          className="text-sm text-red-400 hover:text-red-300 p-1 h-auto cursor-pointer"
          title="Remove file"
          aria-label="Remove file"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <section className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-400">Select pages:</span>
          {!isSinglePage && (
            <nav className="flex gap-2">
              <Button
                variant="link"
                onClick={() => onSelectAllPages(index)}
                className="text-xs cursor-pointer text-gray-300 hover:text-gray-100"
              >
                Select All
              </Button>
              <Button
                variant="link"
                onClick={() => onClearPageSelection(index)}
                className="text-xs text-gray-400 hover:text-gray-300 cursor-pointer"
              >
                Clear
              </Button>
            </nav>
          )}
        </div>

        <p className="text-xs text-gray-400 mb-4">
          {isSinglePage
            ? "Single page document (automatically selected)"
            : fileData.selectedPages.length === 0
            ? "No pages selected (will use all pages)"
            : `${fileData.selectedPages.length} page${
                fileData.selectedPages.length === 1 ? "" : "s"
              } selected`}
        </p>

        <section aria-labelledby="preview-heading">
          <h4 id="preview-heading" className="text-sm font-medium text-gray-100 mb-2">
            Preview:
          </h4>
          <ul className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1" role="list">
            {Array.from({ length: pageCount }, (_, i) => (
              <li
                key={i}
                className={`relative max-w-[150px] cursor-pointer transition-opacity ${
                  !fileData.selectedPages.includes(i) ? "opacity-50" : ""
                }`}
                onClick={() => !isSinglePage && onTogglePageSelection(index, i)}
              >
                <PDFPreview file={fileData.file} pageNumber={i + 1} />
                <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  Page {i + 1}
                </span>
                {fileData.selectedPages.includes(i) && (
                  <>
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                    <div className="absolute top-1 left-1 bg-green-500 rounded-full p-0.5 pointer-events-none">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </article>
  );
};

export default PDFFileItem;
