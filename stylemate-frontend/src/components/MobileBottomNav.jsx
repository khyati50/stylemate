import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shirt,
  Sparkles,
  ShoppingBag,
  Luggage,
  Menu,
  X,
  MessageSquare,
  Users,
  BarChart2,
  BookOpen,
  Sliders,
  LogOut,
} from "lucide-react";
import { createPortal } from "react-dom";

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  // Only show bottom nav for authenticated routes
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthRoute =
    token &&
    location.pathname !== "/login" &&
    location.pathname !== "/register" &&
    location.pathname !== "/";

  if (!isAuthRoute) return null;

  const PRIMARY_TABS = [
    { to: "/wardrobe", label: "Closet", icon: Shirt },
    { to: "/recommendation", label: "Studio", icon: Sparkles },
    { to: "/shopping", label: "Shop", icon: ShoppingBag },
    { to: "/capsule", label: "Capsule", icon: Luggage },
  ];

  const SECONDARY_TOOLS = [
    { to: "/chat", label: "AI Stylist", desc: "Chat with personal stylist", icon: MessageSquare },
    { to: "/twinning", label: "Twinning", desc: "Synchronize looks with partner", icon: Users },
    { to: "/gap-analysis", label: "Audit", desc: "Closet health & missing staples", icon: BarChart2 },
    { to: "/history", label: "Journal", desc: "Saved looks & wear history", icon: BookOpen },
    { to: "/preferences", label: "Preferences", desc: "Style DNA & personalization", icon: Sliders },
  ];

  const isMoreActive = SECONDARY_TOOLS.some((t) => location.pathname === t.to);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMoreOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Floating Bottom Dock (hidden on tablet/desktop) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-3 inset-x-3 z-30 md:hidden bg-white/92 backdrop-blur-xl border border-[#EBE6DE] shadow-[0_12px_36px_-6px_rgba(150,120,78,0.18)] rounded-2xl px-2 py-1.5 flex items-center justify-around transition-all"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        {PRIMARY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.to;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={() => setMoreOpen(false)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-[#96784E] font-semibold scale-105"
                  : "text-[#8C8277] hover:text-[#1A1918]"
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.3 : 1.8} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Button */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            moreOpen || isMoreActive
              ? "text-[#96784E] font-semibold scale-105"
              : "text-[#8C8277] hover:text-[#1A1918]"
          }`}
        >
          {moreOpen ? <X size={19} /> : <Menu size={19} strokeWidth={1.8} />}
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">
            More
          </span>
        </button>
      </nav>

      {/* Mobile Studio Drawer via Portal */}
      {moreOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
          >
            <div
              className="bg-[#FAF7F2] border-t border-[#EAE5DD] rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[82vh] overflow-y-auto"
              style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-2" />

              <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DD]">
                <div>
                  <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1A1918]">
                    Studio Features
                  </h3>
                  <p className="text-xs text-[#8C8277]">
                    More styling intelligence tools
                  </p>
                </div>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-white border border-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {SECONDARY_TOOLS.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                        isActive
                          ? "bg-white border-[#96784E]/50 shadow-xs"
                          : "bg-white/70 border-[#EAE5DD] hover:bg-white"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-[#96784E] text-white"
                            : "bg-[#96784E]/10 text-[#96784E]"
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#1A1918]">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#8C8277] truncate">
                          {item.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Sign Out Action in Mobile Drawer */}
              <div className="pt-2 border-t border-[#EAE5DD]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 bg-red-50/60 text-red-600 text-xs font-bold hover:bg-red-100 transition"
                >
                  <LogOut size={15} />
                  <span>Sign Out of StyleMate</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default MobileBottomNav;
