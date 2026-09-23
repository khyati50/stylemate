function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 selection:bg-[#96784E]/20"
    >
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <span className="text-3xl text-[#8B6F47] select-none" aria-hidden="true">
          ✦
        </span>
        <p className="text-xs sm:text-sm font-medium tracking-widest text-[#8B6F47] uppercase font-sans">
          Curating your experience...
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
