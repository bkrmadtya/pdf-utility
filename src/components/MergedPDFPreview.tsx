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
          {mergedBlob && <Badge variant="secondary">Size: {formatFileSize(mergedBlob.size)}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Label htmlFor="merged-filename" className="text-sm font-medium">
              File name:
            </Label>
            <Input
              id="merged-filename"
              type="text"
              ref={mergedFileNameRef}
              defaultValue="merged.pdf"
              className="flex-1"
              placeholder="merged.pdf"
            />
          </div>
          <Button onClick={onDownload} variant="default">
            Download Merged PDF
          </Button>
        </div>
        <Separator className="my-4" />
        <div className="h-[600px] w-full bg-muted/50 rounded-lg border">
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
