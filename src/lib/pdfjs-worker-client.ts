if (typeof window !== "undefined") {
  (async () => {
    const { GlobalWorkerOptions } = await import("pdfjs-dist");

    GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  })();
}
