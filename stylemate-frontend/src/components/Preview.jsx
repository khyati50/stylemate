import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";

function Preview() {
  return (
    <section id="preview" className="bg-white py-24 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}

          <div>
            <p className="text-[#8B6F47] font-semibold uppercase tracking-widest">
              App Preview
            </p>

            <h2 className="mt-3 font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E] leading-tight">
              Manage Your Wardrobe Like Never Before
            </h2>

            <p className="mt-6 text-lg text-gray-600 leading-8">
              Upload your clothes, organize them effortlessly, and discover
              outfit combinations for every occasion. StyleMate keeps your
              wardrobe accessible anytime, anywhere.
            </p>

            <div className="mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 mt-2 rounded-full bg-[#8B6F47]" />
                <p className="text-gray-700">
                  Store all your clothing items digitally.
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 mt-2 rounded-full bg-[#8B6F47]" />
                <p className="text-gray-700">
                  Filter clothes by category, season, and occasion.
                </p>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-3 h-3 mt-2 rounded-full bg-[#8B6F47]" />
                <p className="text-gray-700">
                  Get personalized outfit recommendations instantly.
                </p>
              </div>
            </div>

            <Link
              to="/register"
              className="inline-block mt-10 bg-[#8B6F47] hover:bg-[#735A37] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 hover:-translate-y-1"
            >
              Try StyleMate
            </Link>
          </div>

          {/* Right */}

          <div className="flex justify-center">
            <div className="bg-[#FAF7F2] rounded-3xl shadow-xl p-8">
              <img
                src={heroImage}
                alt="StyleMate Preview"
                className="w-full max-w-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Preview;
