import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#1A1918] flex items-center justify-center p-6 selection:bg-[#96784E]/20">
          <div className="max-w-md w-full bg-[#FAF7F2] border border-[#EAE5DD] rounded-2xl p-8 text-center shadow-lg shadow-[#8B6F47]/5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase bg-[#8B6F47]/10 text-[#8B6F47] border border-[#8B6F47]/20 mb-6">
              <span className="text-sm">✦</span>
              <span>Style Glitch</span>
            </div>

            <h1 className="font-['Playfair_Display'] text-2xl md:text-3xl font-semibold text-[#1A1918] mb-3 tracking-tight">
              Something went unexpectedly off-trend
            </h1>

            <p className="text-sm md:text-base text-[#1A1918]/70 mb-8 leading-relaxed">
              An unexpected styling glitch occurred. Your closet and preferences remain completely safe.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8B6F47] hover:bg-[#735A37] text-white text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm cursor-pointer"
              >
                Try Refreshing
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/wardrobe";
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#EAE5DD] hover:border-[#8B6F47] hover:text-[#8B6F47] bg-white text-[#1A1918] text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-sm cursor-pointer"
              >
                Back to Wardrobe
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
