import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (files: FileList | null) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onFileSelect(e.dataTransfer.files);
  };

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer border-zinc-800 hover:border-zinc-700 bg-zinc-900/80",
        { "border-blue-500 bg-blue-950/40": isDragOver }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleButtonClick}
    >
      <CardContent className="p-4 sm:p-8">
        <div className="text-center space-y-3 sm:space-y-4">
          <div
            className={cn(
              "size-12 sm:size-16 mx-auto rounded-full flex items-center justify-center transition-colors bg-zinc-800",
              { "bg-blue-800": isDragOver }
            )}
          >
            <Upload
              className={cn("size-6 sm:size-8 transition-colors text-blue-400", {
                "text-blue-300": isDragOver,
              })}
            />
          </div>
          <div>
            <Button
              size="lg"
              className="mb-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              Choose PDF Files
            </Button>
            <p className="text-sm text-zinc-400">
              {isDragOver ? "Drop your PDF files here" : "or drag and drop your files here"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Supports multiple PDF files</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
