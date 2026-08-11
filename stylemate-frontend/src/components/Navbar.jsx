import { useState } from "react";
import { Link } from "react-router-dom";
import { Shirt, Menu, X } from "lucide-react";

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-4 md:py-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-[#2E2E2E]">
          <Shirt size={26} className="text-[#8B6F47]" />
          <span className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold">
            StyleMate
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          <a
            href="#features"
            className="font-medium text-gray-700 hover:text-[#8B6F47] transition-colors"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="font-medium text-gray-700 hover:text-[#8B6F47] transition-colors"
          >
            How It Works
          </a>

          <a
            href="#preview"
            className="font-medium text-gray-700 hover:text-[#8B6F47] transition-colors"
          >
            Preview
          </a>

          <Link
            to="/login"
            className="font-medium text-gray-700 hover:text-[#8B6F47] transition-colors"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-full bg-[#8B6F47] px-6 py-3 text-white font-medium hover:bg-[#735A37] transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAE5DD] bg-white text-[#2E2E2E] md:hidden shadow-xs"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mx-4 mt-1 rounded-2xl border border-[#EAE5DD] bg-white p-4 shadow-xl md:hidden flex flex-col space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            How It Works
          </a>
          <a
            href="#preview"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            Preview
          </a>
          <Link
            to="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2.5 px-4 text-center text-sm font-semibold text-white bg-[#8B6F47] rounded-xl shadow-xs"
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

