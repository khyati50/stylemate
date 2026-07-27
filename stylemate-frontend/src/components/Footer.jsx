import { Link } from "react-router-dom";
import { Shirt, Mail, Heart } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-[#2E2E2E] text-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & About */}

          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Shirt className="text-[#C8A97E]" size={30} />

              <h2 className="font-['Playfair_Display'] text-3xl font-bold">
                StyleMate
              </h2>
            </div>

            <p className="mt-5 text-gray-300 leading-8 max-w-md">
              Your personal digital wardrobe to organize clothes, discover
              outfit combinations, and dress confidently for every occasion.
            </p>
          </div>

          {/* Navigation */}

          <div>
            <h3 className="text-lg font-semibold mb-5">Navigation</h3>

            <div className="flex flex-col gap-3">
              <a href="#features" className="hover:text-[#C8A97E] transition">
                Features
              </a>

              <a
                href="#how-it-works"
                className="hover:text-[#C8A97E] transition"
              >
                How It Works
              </a>

              <a href="#preview" className="hover:text-[#C8A97E] transition">
                Preview
              </a>

              <Link to="/login" className="hover:text-[#C8A97E] transition">
                Login
              </Link>
            </div>
          </div>

          {/* Contact */}

          <div>
            <h3 className="text-lg font-semibold mb-5">Connect</h3>

            <div className="flex gap-4">
              <a
                href="mailto:your@email.com"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#8B6F47] transition"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} StyleMate. All rights reserved.
          </p>

          <p className="flex items-center gap-2 text-gray-400 text-sm">
            Made with <Heart size={16} className="text-red-400 fill-red-400" />{" "}
            for fashion lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
