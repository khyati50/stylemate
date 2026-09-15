import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import registerHero from "../assets/registerHero.png";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function HandleRegister() {
    if (loading) return;

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login?registered=true");
        return;
      }

      setMessage(data.message || "Registration failed. Please try again.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex justify-center items-start lg:items-center px-4 pt-6 pb-6 sm:px-6 sm:py-10 lg:py-10">
      <div className="w-full max-w-md sm:max-w-xl lg:max-w-7xl bg-white rounded-3xl sm:rounded-[35px] overflow-hidden shadow-xl lg:shadow-2xl grid lg:grid-cols-[45%_55%] border border-[#EAE5DD]/60">
        {/* VISUAL / BRANDING HEADER (Mobile: Top Banner of Single Card, Desktop: Right Column) */}
        <div className="lg:order-2 flex items-center justify-center bg-gradient-to-br from-[#F7F3EE] to-[#EFE5D7] p-0 sm:p-6 lg:p-8 h-36 sm:h-48 lg:h-auto overflow-hidden">
          <img
            src={registerHero}
            alt="Register Illustration"
            className="h-full w-full object-cover lg:object-contain lg:w-full lg:max-w-3xl lg:rounded-3xl lg:shadow-lg"
          />
        </div>

        {/* FORM SECTION (Mobile: Bottom Half of Single Card, Desktop: Left Column) */}
        <div className="lg:order-1 px-6 py-6 sm:px-10 sm:py-10 lg:px-12 lg:py-14 flex items-center bg-white">
          <div className="w-full max-w-lg">
            <h1 className="font-['Playfair_Display'] text-2xl sm:text-4xl lg:text-5xl font-bold text-[#2E2E2E]">
              Create Account
            </h1>

            <p className="mt-2 sm:mt-3 max-w-md text-xs sm:text-base lg:text-lg text-gray-600 leading-relaxed sm:leading-8">
              Build your digital wardrobe and receive personalized outfit
              recommendations for every occasion.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                HandleRegister();
              }}
              className="mt-5 sm:mt-8 space-y-3 sm:space-y-5"
            >
              {/* Username */}
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      username: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 sm:py-4 pl-11 sm:pl-14 pr-4 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      email: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 sm:py-4 pl-11 sm:pl-14 pr-4 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      password: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 sm:py-4 pl-11 sm:pl-14 pr-12 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  required
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      confirmPassword: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-3 sm:py-4 pl-11 sm:pl-14 pr-12 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {message && (
                <div className="flex items-center gap-2 text-red-500 text-xs sm:text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#8B6F47] py-3 sm:py-4 text-sm sm:text-base text-white font-semibold hover:bg-[#735A37] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <p className="mt-5 sm:mt-8 text-center text-xs sm:text-base text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#8B6F47] hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );


}

export default Register;

