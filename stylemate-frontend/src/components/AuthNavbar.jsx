import { Link, useLocation, useNavigate } from "react-router-dom";

function AuthNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

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
    <nav className="mb-10 flex items-center justify-between border-b border-gray-200 pb-5">
      <Link
        to="/wardrobe"
        className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E]"
      >
        StyleMate
      </Link>

      <div className="flex items-center gap-8">
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
          className="rounded-xl border border-red-500 px-4 py-2 text-red-500 transition hover:bg-red-500 hover:text-white"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AuthNavbar;
