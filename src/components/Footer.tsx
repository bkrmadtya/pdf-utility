const Footer = () => {
  return (
    <footer className="absolute max-w-2xl bottom-0 left-0 right-0 text-center space-y-1.5 mx-auto">
      <p className="text-sm sm:text-base font-semibold text-zinc-300">
        <span className="text-base sm:text-lg md:text-xl">🔒</span> 100% Secure & Private
      </p>
      <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
        All files are processed locally in your browser.
      </p>
      <p className="text-[10px] sm:text-xs text-zinc-500 font-medium tracking-wide">
        NO DATA COLLECTION • NO SERVER STORAGE • NO TRACKING
      </p>
    </footer>
  );
};

export default Footer;
