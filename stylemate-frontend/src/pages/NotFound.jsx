import { Link } from "react-router-dom";

function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1A1918] flex flex-col items-center justify-center px-6 py-12 selection:bg-[#96784E]/20 relative overflow-hidden">
      {/* Subtle luxury ambient decorative aura */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8B6F47]/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase bg-[#8B6F47]/10 text-[#8B6F47] border border-[#8B6F47]/20 mb-6">
          <span>✦</span>
          <span>ERROR 404</span>
        </div>

        {/* Headline */}
        <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl md:text-6xl font-bold text-[#1A1918] tracking-tight mb-4">
          Look Not Found
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-[#1A1918]/70 leading-relaxed mb-10 max-w-md mx-auto">
          The silhouette or page you are looking for has been archived, moved, or never existed in this collection.
        </p>

        {/* Quick action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/wardrobe"
            className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#8B6F47] hover:bg-[#735A37] text-white text-sm font-medium tracking-wide shadow-md transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:ring-offset-2 focus:ring-offset-[#FAF7F2]"
          >
            Return to Closet
          </Link>

          <Link
            to="/recommendation"
            className="w-full sm:w-auto px-7 py-3 rounded-full border border-[#8B6F47] text-[#8B6F47] hover:bg-[#8B6F47] hover:text-white text-sm font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:ring-offset-2 focus:ring-offset-[#FAF7F2]"
          >
            Visit Studio
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFound;
