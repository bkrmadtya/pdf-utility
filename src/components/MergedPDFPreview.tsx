import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/utils/format";
import { RefObject } from "react";

interface MergedPDFPreviewProps {
  mergedPreviewUrl: string;
  mergedBlob: Blob | null;
  mergedFileNameRef: RefObject<HTMLInputElement | null>;
  onDownload: () => void;
}

const MergedPDFPreview = ({
  mergedPreviewUrl,
  mergedBlob,
  mergedFileNameRef,
  onDownload,
}: MergedPDFPreviewProps) => {
  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Merged PDF</CardTitle>
            <CardDescription>Preview and download your merged PDF</CardDescription>
          </div>
          {mergedBlob && (
            <Badge variant="secondary" className="bg-gray-700 text-gray-200">
              Size: {formatFileSize(mergedBlob.size)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Label htmlFor="merged-filename" className="text-sm font-medium text-gray-100">
              File name:
            </Label>
            <Input
              id="merged-filename"
              type="text"
              ref={mergedFileNameRef}
              defaultValue="merged.pdf"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
              placeholder="merged.pdf"
            />
          </div>
          <Button
            onClick={onDownload}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Download Merged PDF
          </Button>
        </div>
        <Separator className="my-4 bg-gray-700" />
        <div className="h-[600px] w-full bg-gray-800/50 rounded-lg border border-gray-700">
          <iframe
            src={mergedPreviewUrl}
            className="w-full h-full border-0 rounded-lg"
            title="Preview of merged PDF"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MergedPDFPreview;
