import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";

function Hero() {
  return (
    <section className="min-h-screen flex items-center bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto w-full px-8 lg:px-16 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-10">
          {/* Left Content */}

          <div className="lg:col-span-2 text-center lg:text-left">
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl font-bold text-[#2E2E2E] leading-[1.1]">
              Your Personal
              <br />
              Digital Wardrobe
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-md mx-auto lg:mx-0">
              Organize your wardrobe effortlessly, create stylish outfit
              combinations, and receive personalized recommendations based on
              the occasion and season.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="bg-[#8B6F47] hover:bg-[#735A37] text-white px-8 py-3 rounded-full text-lg font-medium shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                Get Started
              </Link>

              <Link
                to="/login"
                className="border-2 border-[#8B6F47] text-[#8B6F47] hover:bg-[#8B6F47] hover:text-white px-8 py-3 rounded-full text-lg font-medium transition-all duration-300 hover:-translate-y-1"
              >
                Login
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500 tracking-wide">
              Occasion Based • Seasonal • Personalized
            </p>
          </div>

          {/* Hero Image */}

          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <img
              src={heroImage}
              alt="StyleMate Hero"
              className="w-full max-w-2xl drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
