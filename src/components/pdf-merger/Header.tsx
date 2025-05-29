import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="text-center space-y-8">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-zinc-100 text-balance">PDF Utility</h1>
        <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
          Free Tool
        </Badge>
      </div>
      <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto text-pretty">
        Combine multiple PDF files into one document. Select pages, preview, and download instantly.
      </p>
    </header>
  );
}
