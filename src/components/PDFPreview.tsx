import { useRef, useEffect, memo, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

import "@/lib/pdfjs-worker-client"; // Import PDF.js worker configuration
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Module-level caches                                                         */
/*                                                                             */
/* 1. docCache: one PDFDocumentProxy per File object, shared across all pages. */
/*    Avoids re-parsing the same multi-page PDF 16 times.                      */
/*                                                                             */
/* 2. bitmapCache: rendered ImageBitmap per (file, pageNumber, scaleFactor).   */
/*    Avoids re-rendering the canvas on remount/re-render — the bitmap is      */
/*    drawn to the canvas in a single synchronous `drawImage` call.            */
/* -------------------------------------------------------------------------- */
const docCache = new WeakMap<File, Promise<PDFDocumentProxy>>();

function getPDFDocument(file: File): Promise<PDFDocumentProxy> {
  const cached = docCache.get(file);
  if (cached) return cached;

  const promise = (async () => {
    const pdfjsLib = await import("pdfjs-dist");
    const arrayBuffer = await file.arrayBuffer();
    return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  })();

  docCache.set(file, promise);
  return promise;
}

type BitmapKey = string;
const bitmapCache = new Map<BitmapKey, ImageBitmap>();

function makeBitmapKey(file: File, pageNumber: number, scaleFactor: number): BitmapKey {
  // File.name + File.size + File.lastModified creates a stable identity per file blob
  return `${file.name}:${file.size}:${file.lastModified}:${pageNumber}:${scaleFactor}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */
type PDFPreviewProps = {
  file: File;
  pageNumber: number;
  scaleFactor?: number;
  className?: string;
};

const PDFPreview = memo(({ file, pageNumber, scaleFactor = 0.5, className }: PDFPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

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

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;

      const bitmapKey = makeBitmapKey(file, pageNumber, scaleFactor);

      // Fast path: if we have a cached bitmap, draw it immediately (sync)
      const cachedBitmap = bitmapCache.get(bitmapKey);
      if (cachedBitmap) {
        canvas.width = cachedBitmap.width;
        canvas.height = cachedBitmap.height;
        context.drawImage(cachedBitmap, 0, 0);
        setAspectRatio(cachedBitmap.width / cachedBitmap.height);
        setIsLoading(false);
        return;
      }

      // Slow path: parse + render + cache
      try {
        setIsLoading(true);
        setError(null);

        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const pdf = await getPDFDocument(file);
        const page = await pdf.getPage(pageNumber + 1);

        if (!isMounted) return;

        // Get viewport - pdf.js automatically respects the page's /Rotate property
        const scaledViewport = page.getViewport({ scale: scaleFactor });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        // Store aspect ratio for CSS sizing
        setAspectRatio(scaledViewport.width / scaledViewport.height);

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        renderTaskRef.current = page.render({
          canvasContext: context,
          viewport: scaledViewport,
          intent: "display",
        });

        await renderTaskRef.current.promise;

        if (!isMounted) return;

        // Cache the rendered bitmap for instant reuse
        try {
          const bitmap = await createImageBitmap(canvas);
          bitmapCache.set(bitmapKey, bitmap);
        } catch {
          // createImageBitmap may fail in some environments; no-op
        }

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

  // Determine if portrait or landscape based on aspect ratio
  const isPortrait = aspectRatio !== null && aspectRatio < 1;

  return (
    <figure
      ref={containerRef}
      className={cn("relative flex items-center justify-center w-full h-full", className)}
    >
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
        className={cn("rounded-xs bg-white transition-opacity duration-300 block", {
          "opacity-0": isLoading,
        })}
        style={
          aspectRatio !== null
            ? {
                // Use object-fit contain behavior via width/height constraints
                // Portrait (tall): constrain by height, width follows aspect ratio
                // Landscape (wide): constrain by width, height follows aspect ratio
                ...(isPortrait
                  ? { height: "100%", width: "auto", maxWidth: "100%" }
                  : { width: "100%", height: "auto", maxHeight: "100%" }),
                aspectRatio: String(aspectRatio),
              }
            : undefined
        }
        aria-label={`PDF preview page ${pageNumber}`}
      />
    </figure>
  );
});

PDFPreview.displayName = "PDFPreview";

export default PDFPreview;
