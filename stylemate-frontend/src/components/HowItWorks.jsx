import { Upload, FolderOpen, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Clothes",
    description:
      "Add your clothing items with images, colors, categories, occasions, and seasons to build your digital wardrobe.",
  },
  {
    icon: FolderOpen,
    title: "Organize Your Wardrobe",
    description:
      "Keep everything neatly organized and filter your collection by category, color, occasion, or season.",
  },
  {
    icon: Sparkles,
    title: "Get Outfit Recommendations",
    description:
      "Receive outfit suggestions tailored to your selected occasion using the clothes already in your wardrobe.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#FAF7F2] py-24 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-[#8B6F47] font-semibold uppercase tracking-widest">
            How It Works
          </p>

          <h2 className="mt-3 font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E]">
            Get Started in 3 Simple Steps
          </h2>

          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-600 leading-8">
            StyleMate makes outfit planning simple by helping you digitize and
            organize your wardrobe in just a few steps.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={index}
                className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute -top-5 left-8 w-10 h-10 rounded-full bg-[#8B6F47] text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="mt-6 w-16 h-16 rounded-2xl bg-[#FAF7F2] flex items-center justify-center">
                  <Icon size={32} className="text-[#8B6F47]" />
                </div>

                <h3 className="mt-8 text-2xl font-semibold text-[#2E2E2E]">
                  {step.title}
                </h3>

                <p className="mt-4 text-gray-600 leading-8">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
