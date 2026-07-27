import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import registerHero from "../assets/registerHero.png";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  async function HandleRegister() {
    try {
      if (formData.password !== formData.confirmPassword) {
        setMessage("Passwords do not match");
        return;
      }

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

      setMessage(data.message);

      if (response.ok) {
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-7xl bg-white rounded-[35px] overflow-hidden shadow-2xl grid lg:grid-cols-[45%_55%]">
        {/* LEFT */}

        <div className="px-12 py-14 flex items-center">
          <div className="w-full max-w-lg">
            <h1 className="font-['Playfair_Display'] text-4xl font-bold text-[#2E2E2E]">
              Create Account
            </h1>

            <p className="mt-4 max-w-md text-gray-600 text-lg leading-8">
              Build your digital wardrobe and receive personalized outfit
              recommendations for every occasion.
            </p>

            <div className="mt-8 space-y-4">
              {/* Username */}

              <div className="relative">
                <User
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      username: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
                />
              </div>

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
                  className="w-full rounded-xl border border-gray-300 py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
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
                  className="w-full rounded-xl border border-gray-300 py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
                />
              </div>

              {/* Confirm Password */}

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      confirmPassword: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 py-4 pl-14 pr-4 outline-none focus:border-[#8B6F47] transition"
                />
              </div>

              {message && <p className="text-sm text-red-500">{message}</p>}

              <button
                onClick={HandleRegister}
                className="w-full rounded-xl bg-[#8B6F47] py-4 text-white font-semibold hover:bg-[#735A37] hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
              >
                Create Account
              </button>
            </div>

            <p className="mt-7 text-center text-gray-600">
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

        {/* RIGHT */}

        <div className="bg-gradient-to-br from-[#F7F3EE] to-[#EFE5D7] flex items-center justify-center p-8">
          <img
            src={registerHero}
            alt="Register Illustration"
            className="w-full max-w-3xl rounded-3xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}

export default Register;
