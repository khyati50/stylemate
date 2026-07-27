import { Link } from "react-router-dom";
import { Shirt } from "lucide-react";

function Navbar() {
  return (
    <nav className="absolute top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-[#2E2E2E]">
          <Shirt size={28} className="text-[#8B6F47]" />
          <span className="font-['Playfair_Display'] text-3xl font-bold">
            StyleMate
          </span>
        </Link>

        {/* Navigation */}
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
      </div>
    </nav>
  );
}

export default Navbar;
