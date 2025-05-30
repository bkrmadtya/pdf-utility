import { Badge } from "@/components/ui/badge";

const Header = () => {
  return (
    <header className="text-center space-y-8">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <h1
          id="title"
          className="relative group text-2xl sm:text-4xl font-bold text-zinc-100 text-balance"
        >
          PDF Utility
          <div className="group-hover:opacity-65 absolute inset-y-2 -inset-x-2 bg-gradient-to-r from-blue-600/80 to-pink-600/60 rounded-3xl blur-lg animate-pulse [animation-timing-function:ease-in-out] [animation-duration:3s] -z-10" />
        </h1>
        <Badge variant="secondary" className="text-xs font-bold">
          Free Tool
        </Badge>
      </div>
      <p className="text-sm sm:text-lg text-zinc-400 max-w-2xl mx-auto text-pretty">
        Combine multiple PDF files into one document. Select pages, preview, and download instantly.
      </p>
    </header>
  );
};

export default Header;
