import { useRef, useEffect, memo } from "react";
import { RenderTask } from "pdfjs-dist";

interface PDFPreviewProps {
  file: File;
  pageNumber: number;
}

const PDFPreview = memo(({ file, pageNumber }: PDFPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || !containerRef.current || !isMounted) return;

      try {
        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const pdfjsLib = await import("pdfjs-dist");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNumber);

        if (!isMounted) return;

        // Get the original page dimensions with a smaller initial scale
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        // Calculate the scale to fit the container width while maintaining aspect ratio
        const containerWidth = containerRef.current.clientWidth;
        const scale = (containerWidth / viewport.width) * 0.5; // Additional scaling factor
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions to match the scaled viewport
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Reset the canvas transformation
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Store the render task
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: scaledViewport,
          transform: [1, 0, 0, 1, 0, 0], // Identity matrix to prevent flipping
        });

        await renderTaskRef.current.promise;
      } catch (error) {
        if (!isMounted) return;

        if (error instanceof Error && error.name === "RenderingCancelled") {
          // Ignore cancellation errors
          return;
        }
        console.error("Error rendering PDF:", error);
      }
    };

    renderPage();

    // Cleanup function
    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [file, pageNumber]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas ref={canvasRef} className="w-full h-auto rounded-lg border bg-white" />
    </div>
  );
});

PDFPreview.displayName = "PDFPreview";

export default PDFPreview;
