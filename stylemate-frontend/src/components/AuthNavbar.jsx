import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

function AuthNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const navLinkClass = (path) =>
    `transition ${
      location.pathname === path
        ? "text-[#8B6F47] font-semibold"
        : "text-gray-600 hover:text-[#8B6F47]"
    }`;

  return (
    <nav className="relative mb-6 md:mb-10 border-b border-[#EAE5DD] pb-4 md:pb-5">
      <div className="flex items-center justify-between">
        <Link
          to="/wardrobe"
          className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#2E2E2E]"
        >
          StyleMate
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/wardrobe" className={navLinkClass("/wardrobe")}>
            Wardrobe
          </Link>

          <Link to="/recommendation" className={navLinkClass("/recommendation")}>
            Recommendations
          </Link>

          <Link to="/history" className={navLinkClass("/history")}>
            History
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500 px-4 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAE5DD] bg-white text-[#2E2E2E] md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mt-4 rounded-2xl border border-[#EAE5DD] bg-white p-4 shadow-lg md:hidden flex flex-col space-y-3">
          <Link
            to="/wardrobe"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl text-sm font-medium ${
              location.pathname === "/wardrobe"
                ? "bg-[#8B6F47]/10 text-[#8B6F47]"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Wardrobe
          </Link>

          <Link
            to="/recommendation"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl text-sm font-medium ${
              location.pathname === "/recommendation"
                ? "bg-[#8B6F47]/10 text-[#8B6F47]"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Recommendations
          </Link>

          <Link
            to="/history"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-2 px-3 rounded-xl text-sm font-medium ${
              location.pathname === "/history"
                ? "bg-[#8B6F47]/10 text-[#8B6F47]"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            History
          </Link>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="w-full text-left py-2 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

export default AuthNavbar;

