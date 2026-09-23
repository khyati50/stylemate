import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shirt,
  Sparkles,
  ShoppingBag,
  Luggage,
  MessageSquare,
  BookOpen,
  BarChart2,
  Users,
  Sliders,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import WeatherWidget from "./WeatherWidget";

const PRIMARY_ITEMS = [
  { to: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { to: "/recommendation", label: "Studio", icon: Sparkles },
  { to: "/shopping", label: "Shopping", icon: ShoppingBag },
  { to: "/capsule", label: "Capsule", icon: Luggage },
];

const STUDIO_TOOLS = [
  {
    to: "/chat",
    label: "AI Stylist",
    description: "Conversational fashion assistant",
    icon: MessageSquare,
  },
  {
    to: "/twinning",
    label: "Twinning",
    description: "Couple & friend synchronized looks",
    icon: Users,
  },
  {
    to: "/gap-analysis",
    label: "Wardrobe Audit",
    description: "Health score & closet gaps",
    icon: BarChart2,
  },
  {
    to: "/history",
    label: "Outfit Journal",
    description: "Saved looks & wear history",
    icon: BookOpen,
  },
];

function AuthNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const isDropdownActive = STUDIO_TOOLS.some(
    (tool) => location.pathname === tool.to
  );

  function confirmLogout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("stylemate_app_launched");
    setShowLogoutModal(false);
    navigate("/login");
  }

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setToolsOpen(false);
        setMobileMenuOpen(false);
        setShowLogoutModal(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setToolsOpen(false);
    setMobileMenuOpen(false);
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToolsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setToolsOpen(false);
    }, 180);
  };

  return (
    <header className="sticky top-3 z-40 mb-6 md:mb-8 transition-all">
      <div className="bg-white/85 backdrop-blur-xl border border-[#EBE6DE]/90 shadow-[0_10px_35px_-5px_rgba(150,120,78,0.08)] rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 transition-all">
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          {/* Left: Brand Identity with Glowing Sparkle */}
          <Link
            to="/wardrobe"
            className="group flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-95"
            aria-label="StyleMate Home"
          >
            <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold tracking-tight text-[#1A1918]">
              StyleMate
            </span>
            <span
              className="text-[#96784E] text-sm sm:text-base font-normal select-none transition-transform duration-500 ease-out group-hover:rotate-90 inline-block drop-shadow-[0_0_8px_rgba(150,120,78,0.35)]"
              aria-hidden="true"
            >
              ✦
            </span>
          </Link>

          {/* Center: Segmented Luxury Pill Navigation (Desktop >= 1024px) */}
          <nav
            className="hidden lg:flex items-center bg-[#F5F2EB]/80 p-1 rounded-xl border border-[#EAE5DD]/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] gap-1"
            aria-label="Main Navigation"
          >
            {PRIMARY_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#1A1918] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#EAE5DD]/80"
                      : "text-[#6E655F] hover:text-[#1A1918] hover:bg-white/60 font-medium border border-transparent"
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? "text-[#96784E]"
                        : "text-[#8C8277] group-hover:text-[#1A1918]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Studio Tools Dropdown Hub */}
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setToolsOpen((prev) => !prev)}
                className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer ${
                  isDropdownActive || toolsOpen
                    ? "bg-white text-[#1A1918] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#EAE5DD]/80"
                    : "text-[#6E655F] hover:text-[#1A1918] hover:bg-white/60 font-medium border border-transparent"
                }`}
                aria-expanded={toolsOpen}
                aria-haspopup="true"
              >
                <span className="text-[#96784E] text-[11px] leading-none select-none">
                  ✦
                </span>
                <span>Studio Tools</span>
                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform duration-200 ${
                    toolsOpen
                      ? "rotate-180 text-[#96784E]"
                      : "text-[#8C8277] group-hover:text-[#1A1918]"
                  }`}
                />
              </button>

              {/* Luxury Frosted Card Dropdown */}
              {toolsOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 rounded-2xl border border-[#EBE6DE] bg-white/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 mb-1 border-b border-[#EAE5DD]/60">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#96784E]">
                      Editorial Features
                    </p>
                  </div>
                  <div className="space-y-1">
                    {STUDIO_TOOLS.map((tool) => {
                      const ToolIcon = tool.icon;
                      const isToolActive = location.pathname === tool.to;
                      return (
                        <Link
                          key={tool.to}
                          to={tool.to}
                          onClick={() => setToolsOpen(false)}
                          className={`group flex items-center gap-3 p-2 rounded-xl transition-all ${
                            isToolActive
                              ? "bg-[#FAF7F2] border border-[#EAE5DD]"
                              : "hover:bg-[#FAF7F2] border border-transparent hover:border-[#EAE5DD]/60"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              isToolActive
                                ? "bg-[#96784E] text-white"
                                : "bg-[#F5F2EB] text-[#8C8277] group-hover:bg-[#96784E]/10 group-hover:text-[#96784E]"
                            }`}
                          >
                            <ToolIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-semibold ${
                                  isToolActive
                                    ? "text-[#96784E]"
                                    : "text-[#1A1918]"
                                }`}
                              >
                                {tool.label}
                              </span>
                              {isToolActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#96784E]" />
                              )}
                            </div>
                            <p className="text-[11px] text-[#8C8277] truncate">
                              {tool.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Context & Account Utilities (Desktop >= 1024px) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <WeatherWidget />

            {/* Style DNA / Preferences */}
            <div className="group relative flex items-center">
              <Link
                to="/preferences"
                className={`p-2 rounded-xl border transition-all duration-200 ${
                  location.pathname === "/preferences"
                    ? "bg-[#96784E]/10 text-[#96784E] border-[#96784E]/30 shadow-xs"
                    : "text-[#6E655F] hover:text-[#1A1918] hover:bg-[#F5F2EB] border-transparent hover:border-[#EAE5DD]"
                }`}
                aria-label="Style DNA & Preferences"
              >
                <Sliders size={16} />
              </Link>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#1A1918] text-white text-[10px] font-medium py-0.5 px-2 rounded-md whitespace-nowrap shadow-lg z-50">
                Style DNA
              </span>
            </div>

            {/* Refined Logout Button */}
            <div className="group relative flex items-center">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="p-2 rounded-xl text-[#6E655F] hover:text-rose-700 hover:bg-rose-50/80 border border-transparent hover:border-rose-200/60 transition-all duration-200 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-[#1A1918] text-white text-[10px] font-medium py-0.5 px-2 rounded-md whitespace-nowrap shadow-lg z-50">
                Sign Out
              </span>
            </div>
          </div>

          {/* Mobile & Tablet Controls (< 1024px) */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="hidden sm:block">
              <WeatherWidget />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAE5DD] bg-white/90 text-[#1A1918] hover:border-[#96784E]/40 hover:bg-[#FAF7F2] shadow-xs transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Slide-Down Luxury Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="mt-3 rounded-2xl border border-[#EAE5DD] bg-white/98 backdrop-blur-xl p-4 shadow-2xl lg:hidden flex flex-col space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Weather on mobile if hidden on small screens */}
            <div className="sm:hidden pb-3 border-b border-[#EAE5DD]/70 flex justify-center">
              <WeatherWidget />
            </div>

            {/* Core Fashion Hubs */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#96784E] mb-2 px-1">
                Core Wardrobe
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRIMARY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#96784E]/10 text-[#96784E] border border-[#96784E]/30 shadow-xs"
                          : "bg-[#FAF7F2]/80 text-[#1A1918] hover:bg-[#F5F2EB] border border-[#EAE5DD]/60"
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg ${
                          isActive
                            ? "bg-[#96784E] text-white"
                            : "bg-white text-[#8C8277]"
                        }`}
                      >
                        <Icon size={15} />
                      </div>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Studio Tools & Features */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#96784E] mb-2 px-1">
                Studio Features
              </p>
              <div className="space-y-1.5">
                {STUDIO_TOOLS.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isToolActive = location.pathname === tool.to;
                  return (
                    <Link
                      key={tool.to}
                      to={tool.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                        isToolActive
                          ? "bg-[#FAF7F2] border border-[#EAE5DD]"
                          : "hover:bg-[#FAF7F2] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            isToolActive
                              ? "bg-[#96784E] text-white"
                              : "bg-[#F5F2EB] text-[#8C8277]"
                          }`}
                        >
                          <ToolIcon size={15} />
                        </div>
                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              isToolActive ? "text-[#96784E]" : "text-[#1A1918]"
                            }`}
                          >
                            {tool.label}
                          </p>
                          <p className="text-[10px] text-[#8C8277]">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      {isToolActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#96784E]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Bar: Preferences & Logout */}
            <div className="pt-3 border-t border-[#EAE5DD]/80 flex items-center justify-between gap-2">
              <Link
                to="/preferences"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  location.pathname === "/preferences"
                    ? "bg-[#96784E]/10 text-[#96784E] border-[#96784E]/30"
                    : "text-[#6E655F] hover:text-[#1A1918] bg-[#FAF7F2] border-[#EAE5DD]"
                }`}
              >
                <Sliders size={14} />
                <span>Style DNA</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/50 transition cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setShowLogoutModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
          >
            <div
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#EAE5DD] animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with a warm bronze LogOut icon badge */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#8B6F47]/10 text-[#8B6F47] border border-[#8B6F47]/20 flex items-center justify-center shrink-0">
                  <LogOut size={22} />
                </div>
                <div>
                  <h3
                    id="logout-dialog-title"
                    className="font-['Playfair_Display'] text-xl font-bold text-[#1A1918]"
                  >
                    Sign Out of StyleMate?
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#96784E]">
                    Session Confirmation
                  </span>
                </div>
              </div>

              {/* Body */}
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                Are you sure you want to end your styling session? Your wardrobe
                items, preferences, and saved outfits are securely synced.
              </p>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE5DD]/80">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#EAE5DD] text-gray-600 hover:bg-[#FAF7F2] font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmLogout}
                  className="px-5 py-2.5 rounded-xl bg-[#8B6F47] hover:bg-[#735A37] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

export default AuthNavbar;

