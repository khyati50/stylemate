import { Shirt, Sparkles, WandSparkles } from "lucide-react";

const features = [
  {
    icon: Shirt,
    title: "Digital Wardrobe",
    description:
      "Store and organize all your clothing items in one beautiful digital wardrobe.",
  },
  {
    icon: Sparkles,
    title: "Outfit Planning",
    description:
      "Mix and match outfits effortlessly for every occasion and season.",
  },
  {
    icon: WandSparkles,
    title: "Smart Suggestions",
    description:
      "Receive personalized outfit recommendations based on your wardrobe.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-white py-24 px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-[#8B6F47] font-semibold tracking-widest uppercase">
            Features
          </p>

          <h2 className="mt-3 font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E]">
            Why Choose StyleMate?
          </h2>

          <p className="mt-5 max-w-2xl mx-auto text-lg text-gray-600 leading-8">
            Everything you need to organize your wardrobe and create stylish
            outfits with ease.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="bg-[#FAF7F2] rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <Icon size={32} className="text-[#8B6F47]" strokeWidth={2} />
                </div>

                <h3 className="mt-8 text-2xl font-semibold text-[#2E2E2E]">
                  {feature.title}
                </h3>

                <p className="mt-4 text-gray-600 leading-8">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
