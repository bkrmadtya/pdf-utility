import { useRef, useEffect, memo, useState } from "react";
import { RenderTask } from "pdfjs-dist";

import "@/lib/pdfjs-worker-client"; // Import PDF.js worker configuration
import { cn } from "@/lib/utils";

interface PDFPreviewProps {
  file: File;
  pageNumber: number;
  scaleFactor?: number;
}

const PDFPreview = memo(({ file, pageNumber, scaleFactor = 0.5 }: PDFPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading when within 100px of viewport
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!canvasRef.current || !containerRef.current || !isMounted || !isVisible) return;

      try {
        setIsLoading(true);
        setError(null);

        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const pdfjsLib = await import("pdfjs-dist");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNumber + 1);

        if (!isMounted) return;

        // Get the original page dimensions
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { alpha: false }); // Optimize for PDF rendering

        if (!context) return;

        // Calculate the scale to fit the container width while maintaining aspect ratio
        const scaledViewport = page.getViewport({ scale: scaleFactor });

        // Set canvas dimensions to match the scaled viewport
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Optimize canvas rendering
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // Store the render task
        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: scaledViewport,
          transform: [1, 0, 0, 1, 0, 0],
          intent: "display", // Optimize for screen display
        });

        await renderTaskRef.current.promise;
        setIsLoading(false);
      } catch (error) {
        if (!isMounted) return;

        if (error instanceof Error) {
          if (error.name === "RenderingCancelled") {
            return;
          }
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
        setIsLoading(false);
        console.error("Error rendering PDF:", error);
      }
    };

    if (isVisible) {
      renderPage();
    }

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [file, pageNumber, isVisible, scaleFactor]);

  return (
    <figure ref={containerRef} className="w-full relative">
      {isLoading && (
        <div
          className="absolute size-full inset-0 flex items-center justify-center bg-gray-600"
          role="status"
          aria-label="Loading PDF preview"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg"
          role="alert"
        >
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn(
          "w-full h-auto rounded-xs bg-white opacity-100 transition-opacity duration-300",
          { "opacity-0": isLoading }
        )}
        aria-label={`PDF preview page ${pageNumber}`}
      />
    </figure>
  );
});

PDFPreview.displayName = "PDFPreview";

export default PDFPreview;
