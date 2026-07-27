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
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6 py-10">
      <div className="max-w-6xl w-full bg-white rounded-[35px] overflow-hidden shadow-2xl grid lg:grid-cols-2">
        {/* LEFT */}

        <div className="px-14 py-16 flex flex-col justify-center">
          <h1 className="font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E]">
            Welcome Back
          </h1>

          <p className="mt-4 text-lg text-gray-600 leading-8">
            Continue organizing your wardrobe and discover outfit combinations
            for every occasion.
          </p>

          <div className="mt-10 space-y-6">
            {/* Email */}

            <div className="relative">
              <Mail
                size={20}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
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
                className="w-full border border-gray-300 rounded-xl py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
              />
            </div>

            {/* Password */}

            <div className="relative">
              <Lock
                size={20}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
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
                className="w-full border border-gray-300 rounded-xl py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
              />
            </div>

            {message && <p className="text-red-500 text-sm">{message}</p>}

            <button
              onClick={HandleLogin}
              className="w-full bg-[#8B6F47] hover:bg-[#735A37] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-white font-semibold rounded-xl py-4"
            >
              Login
            </button>
          </div>

          <p className="mt-8 text-center text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#8B6F47] font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>

        {/* RIGHT */}

        <div className="hidden lg:flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#F7F3EE] to-[#EFE5D7]">
          <img
            src={loginHero}
            alt="Login Illustration"
            className="w-[97%] rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}

export default Login;
