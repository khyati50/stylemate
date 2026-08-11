import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import loginHero from "../assets/loginHero.jpg";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  async function HandleLogin() {
    try {
      setMessage("");

      const request = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await request.json();

      if (request.ok) {
        localStorage.setItem("token", data.token);
        navigate("/wardrobe");
      }

      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF7F2] flex justify-center items-start lg:items-center px-4 pt-6 pb-6 sm:px-6 sm:py-10 lg:py-10">
      <div className="w-full max-w-md sm:max-w-xl lg:max-w-6xl bg-white rounded-3xl sm:rounded-[35px] overflow-hidden shadow-xl lg:shadow-2xl grid lg:grid-cols-2 border border-[#EAE5DD]/60">
        {/* VISUAL / BRANDING HEADER (Mobile: Top Banner of Single Card, Desktop: Right Column) */}
        <div className="lg:order-2 flex items-center justify-center bg-gradient-to-br from-[#F7F3EE] to-[#EFE5D7] p-0 sm:p-6 lg:p-8 h-40 sm:h-52 lg:h-auto overflow-hidden">
          <img
            src={loginHero}
            alt="Login Illustration"
            className="h-full w-full object-cover lg:object-contain lg:w-[97%] lg:rounded-2xl"
          />
        </div>

        {/* FORM SECTION (Mobile: Bottom Half of Single Card, Desktop: Left Column) */}
        <div className="lg:order-1 px-6 py-6 sm:px-10 sm:py-10 lg:px-14 lg:py-16 flex flex-col justify-center bg-white">
          <h1 className="font-['Playfair_Display'] text-2xl sm:text-4xl lg:text-5xl font-bold text-[#2E2E2E]">
            Welcome Back
          </h1>

          <p className="mt-2 sm:mt-3 text-xs sm:text-base lg:text-lg text-gray-600 leading-relaxed sm:leading-8">
            Continue organizing your wardrobe and discover outfit combinations
            for every occasion.
          </p>

          <div className="mt-5 sm:mt-8 space-y-3.5 sm:space-y-6">
            {/* Email */}

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    email: event.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl py-3 sm:py-4 pl-11 sm:pl-14 pr-4 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
              />
            </div>

            {/* Password */}

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    password: event.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-xl py-3 sm:py-4 pl-11 sm:pl-14 pr-4 text-sm sm:text-base outline-none focus:border-[#8B6F47] transition"
              />
            </div>

            {message && <p className="text-red-500 text-xs sm:text-sm">{message}</p>}

            <button
              onClick={HandleLogin}
              className="w-full bg-[#8B6F47] hover:bg-[#735A37] hover:shadow-lg transition-all duration-300 text-white font-semibold rounded-xl py-3 sm:py-4 text-sm sm:text-base"
            >
              Login
            </button>
          </div>

          <p className="mt-5 sm:mt-8 text-center text-xs sm:text-base text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#8B6F47] font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );


}

export default Login;

