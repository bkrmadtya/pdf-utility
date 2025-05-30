const Footer = () => {
  return (
    <footer className="absolute bottom-0 left-0 right-0 text-center space-y-2 sm:space-y-3 max-w-2xl mx-auto px-4">
      <p className="text-sm sm:text-base md:text-lg font-semibold text-zinc-300 flex items-center justify-center gap-2">
        <span className="text-base sm:text-lg md:text-xl">🔒</span> 100% Secure & Private
      </p>
      <p className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed">
        All files are processed locally in your browser.
      </p>
      <p className="text-[10px] sm:text-xs md:text-sm text-zinc-500 font-medium tracking-wide">
        NO DATA COLLECTION • NO SERVER STORAGE • NO TRACKING
      </p>
    </footer>
  );
};

export default Footer;
