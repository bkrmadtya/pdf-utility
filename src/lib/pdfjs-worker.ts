import { GlobalWorkerOptions } from "pdfjs-dist";

if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.2.133/build/pdf.worker.min.js";
}
