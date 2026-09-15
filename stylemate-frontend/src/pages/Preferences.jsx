import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sliders, Sparkles } from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import Toast from "../components/Toast";
import { API_BASE_URL } from "../config/api";

const COLOR_MAP = {
  black: "#000000",
  white: "#FFFFFF",
  navy: "#001F3F",
  grey: "#808080",
  gray: "#808080",
  beige: "#F5F5DC",
  brown: "#8B4513",
  red: "#E63946",
  blue: "#1D3557",
  green: "#2A9D8F",
  yellow: "#E9C46A",
  orange: "#F4A261",
  pink: "#FFB6C1",
  purple: "#6A0572",
  maroon: "#800000",
  olive: "#556B2F",
  mustard: "#E1AD01",
};

const PALETTE_COLORS = [
  { name: "black", label: "Black", hex: "#000000" },
  { name: "white", label: "White", hex: "#FFFFFF" },
  { name: "navy", label: "Navy", hex: "#001F3F" },
  { name: "grey", label: "Grey", hex: "#808080" },
  { name: "beige", label: "Beige", hex: "#F5F5DC" },
  { name: "brown", label: "Brown", hex: "#8B4513" },
  { name: "red", label: "Red", hex: "#E63946" },
  { name: "blue", label: "Blue", hex: "#1D3557" },
  { name: "green", label: "Green", hex: "#2A9D8F" },
  { name: "yellow", label: "Yellow", hex: "#E9C46A" },
  { name: "orange", label: "Orange", hex: "#F4A261" },
  { name: "pink", label: "Pink", hex: "#FFB6C1" },
  { name: "purple", label: "Purple", hex: "#6A0572" },
  { name: "maroon", label: "Maroon", hex: "#800000" },
  { name: "olive", label: "Olive", hex: "#556B2F" },
  { name: "mustard", label: "Mustard", hex: "#E1AD01" },
];

const AVAILABLE_STYLES = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "smart", label: "Smart" },
  { value: "sporty", label: "Sporty" },
  { value: "ethnic", label: "Ethnic" },
  { value: "streetwear", label: "Streetwear" },
];

const FORMALITY_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart-Casual" },
  { value: "formal", label: "Formal" },
];

const getColorHex = (name) => {
  if (!name) return "#CCCCCC";
  const key = name.toLowerCase().trim();
  return COLOR_MAP[key] || "#CCCCCC";
};

function Preferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, variant }

  // Manual form state
  const [manualColors, setManualColors] = useState([]);
  const [manualStyles, setManualStyles] = useState([]);
  const [manualFormality, setManualFormality] = useState("");

  const navigate = useNavigate();

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/preferences`, {
          headers: {
            authorization: token,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await response.json();
        if (response.ok && data.preferences) {
          const prefs = data.preferences;
          setPreferences(prefs);
          setManualColors(prefs.favoriteColors || []);
          setManualStyles(prefs.favoriteStyles || []);
          setManualFormality(prefs.preferredFormalityLevel || "");
        } else {
          showToast(data.message || "Failed to load preferences", "error");
        }
      } catch (err) {
        console.error("fetchPreferences error:", err);
        showToast("Error loading preferences", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [navigate]);

  const handleToggleColor = (colorName) => {
    if (manualColors.includes(colorName)) {
      setManualColors(manualColors.filter((c) => c !== colorName));
    } else {
      if (manualColors.length >= 3) {
        showToast("You can select up to 3 favorite colors.", "error");
        return;
      }
      setManualColors([...manualColors, colorName]);
    }
  };

  const handleToggleStyle = (styleName) => {
    if (manualStyles.includes(styleName)) {
      setManualStyles(manualStyles.filter((s) => s !== styleName));
    } else {
      if (manualStyles.length >= 3) {
        showToast("You can select up to 3 favorite styles.", "error");
        return;
      }
      setManualStyles([...manualStyles, styleName]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          favoriteColors: manualColors,
          favoriteStyles: manualStyles,
          preferredFormalityLevel: manualFormality || null,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setPreferences(data.preferences);
        showToast("Preferences saved successfully!", "success");
      } else {
        showToast(data.message || "Failed to save preferences", "error");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      showToast("Something went wrong while saving.", "error");
    } finally {
      setSaving(false);
    }
  };

  const totalFeedbackGiven = preferences?.totalFeedbackGiven || 0;
  const totalOutfitsWorn = preferences?.totalOutfitsWorn || 0;
  const isProfileEmpty = totalFeedbackGiven === 0 && totalOutfitsWorn === 0;

  // Build insights sentences
  const insights = [];
  if (totalFeedbackGiven >= 3) {
    const colors = preferences?.favoriteColors || [];
    if (colors.length >= 2) {
      insights.push(`You tend to prefer ${colors[0]} and ${colors[1]} tones.`);
    } else if (colors.length === 1) {
      insights.push(`You tend to prefer ${colors[0]} tones.`);
    }

    const styles = preferences?.favoriteStyles || [];
    if (styles.length >= 1) {
      insights.push(`Your highest-rated outfits are ${styles[0]} in style.`);
    }

    const occasions = preferences?.favoriteOccasions || [];
    if (occasions.length >= 1) {
      insights.push(`You most often dress for ${occasions[0]} occasions.`);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AuthNavbar />

        {/* Standardized Editorial Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <Sliders size={12} />
                <span>✦ Style DNA & Preferences</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                Style Preferences
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Your personalized style blueprint, tuned continuously by your feedback and outfit choices.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-[#EAE5DD] px-4 py-2 text-xs font-semibold text-[#8B6F47] shadow-2xs">
                <Sparkles size={13} className="text-[#8B6F47]" />
                <span>AI Profile Tuned</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B6F47] border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {/* Section 1 — Style Profile (Read-only, computed) */}
            <section className="rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                  Section 1
                </span>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E] md:text-2xl">
                  Style Profile
                </h2>
                <p className="text-xs text-gray-500">
                  Computed automatically from your outfit history and ratings.
                </p>
              </div>

              {isProfileEmpty ? (
                <div className="rounded-2xl border border-dashed border-[#8B6F47]/30 bg-[#FAF7F2]/60 p-8 text-center">
                  <p className="text-sm md:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                    Your style profile will build automatically as you use StyleMate. Rate outfits and wear looks to personalize your recommendations.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {/* Favorite Colors */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Favorite Colors
                    </h3>
                    {preferences?.favoriteColors && preferences.favoriteColors.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {preferences.favoriteColors.map((color) => (
                          <div
                            key={color}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 shadow-xs"
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: getColorHex(color) }}
                            />
                            <span className="text-xs font-medium capitalize text-[#2E2E2E]">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None recorded yet</span>
                    )}
                  </div>

                  {/* Favorite Styles */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Favorite Styles
                    </h3>
                    {preferences?.favoriteStyles && preferences.favoriteStyles.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {preferences.favoriteStyles.map((style) => (
                          <span
                            key={style}
                            className="rounded-full bg-[#8B6F47]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#8B6F47]"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None recorded yet</span>
                    )}
                  </div>

                  {/* Favorite Occasions */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Favorite Occasions
                    </h3>
                    {preferences?.favoriteOccasions && preferences.favoriteOccasions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {preferences.favoriteOccasions.map((occ) => (
                          <span
                            key={occ}
                            className="rounded-full bg-[#8B6F47]/10 px-2.5 py-1 text-xs font-medium capitalize text-[#8B6F47]"
                          >
                            {occ}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">None recorded yet</span>
                    )}
                  </div>

                  {/* Formality */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Formality
                    </h3>
                    {preferences?.preferredFormalityLevel ? (
                      <span className="inline-block rounded-full bg-[#8B6F47]/15 px-3 py-1 text-xs font-semibold capitalize text-[#8B6F47]">
                        {preferences.preferredFormalityLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not determined yet</span>
                    )}
                  </div>

                  {/* Average Rating */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Average Rating
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500 text-sm">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {(preferences?.averageRating || 0) >= star ? "★" : "☆"}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-[#2E2E2E]">
                        {(preferences?.averageRating || 0).toFixed(1)} / 5
                      </span>
                    </div>
                  </div>

                  {/* Total Outfits Worn */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Total Outfits Worn
                    </h3>
                    <p className="text-2xl font-bold text-[#2E2E2E]">
                      {totalOutfitsWorn}
                    </p>
                  </div>

                  {/* Total Feedback Given */}
                  <div className="rounded-2xl border border-gray-100 bg-[#FAF7F2]/40 p-4">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Total Feedback Given
                    </h3>
                    <p className="text-2xl font-bold text-[#2E2E2E]">
                      {totalFeedbackGiven}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Section 2 — Manual Preferences (Editable) */}
            <section className="rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                  Section 2
                </span>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E] md:text-2xl">
                  Manual Preferences
                </h2>
                <p className="text-xs text-gray-500">
                  Explicitly specify colors, styles, and formality you prefer.
                </p>
              </div>

              <div className="space-y-6">
                {/* Favorite Colors */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Favorite Colors <span className="text-gray-400 font-normal">(Max 3)</span>
                    </label>
                    <span className="text-xs font-medium text-[#8B6F47]">
                      {manualColors.length}/3 selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
                    {PALETTE_COLORS.map((col) => {
                      const isSelected = manualColors.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => handleToggleColor(col.name)}
                          className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#8B6F47] bg-[#8B6F47]/10 ring-2 ring-[#8B6F47]/20"
                              : "border-gray-200 bg-white hover:border-[#8B6F47]/50"
                          }`}
                        >
                          <span
                            className="h-4 w-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span className="text-xs font-medium text-[#2E2E2E] truncate">
                            {col.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Favorite Styles */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Favorite Styles <span className="text-gray-400 font-normal">(Max 3)</span>
                    </label>
                    <span className="text-xs font-medium text-[#8B6F47]">
                      {manualStyles.length}/3 selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {AVAILABLE_STYLES.map((st) => {
                      const isSelected = manualStyles.includes(st.value);
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => handleToggleStyle(st.value)}
                          className={`rounded-xl border px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#8B6F47] bg-[#8B6F47] text-white shadow-xs"
                              : "border-gray-200 bg-white text-gray-700 hover:border-[#8B6F47]/50"
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Formality */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Preferred Formality
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {FORMALITY_OPTIONS.map((formality) => {
                      const isSelected = manualFormality === formality.value;
                      return (
                        <button
                          key={formality.value}
                          type="button"
                          onClick={() =>
                            setManualFormality(
                              isSelected ? "" : formality.value
                            )
                          }
                          className={`rounded-xl border py-2.5 px-3 text-xs font-medium text-center transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#8B6F47] bg-[#8B6F47] text-white shadow-xs"
                              : "border-gray-200 bg-white text-gray-700 hover:border-[#8B6F47]/50"
                          }`}
                        >
                          {formality.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-2xl bg-[#8B6F47] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#725a39] disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Saving Preferences..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            </section>

            {/* Section 3 — Style Insights */}
            <section className="rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-8 shadow-sm">
              <div className="mb-6 flex flex-col gap-1 border-b border-gray-100 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                  Section 3
                </span>
                <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E] md:text-2xl">
                  Style Insights
                </h2>
                <p className="text-xs text-gray-500">
                  Synthesized observations based on your interactions and taste.
                </p>
              </div>

              {totalFeedbackGiven >= 3 ? (
                <div className="space-y-3">
                  {insights.length > 0 ? (
                    insights.map((sentence, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-2xl border border-[#8B6F47]/15 bg-[#8B6F47]/5 p-4 text-sm text-[#2E2E2E]"
                      >
                        <span className="text-base">💡</span>
                        <p className="leading-relaxed font-medium">{sentence}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No distinct trends detected yet. Continue rating and wearing outfits!
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#8B6F47]/30 bg-[#FAF7F2]/60 p-6 text-center">
                  <p className="text-sm text-gray-600 font-medium">
                    Rate more outfits to unlock insights.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

export default Preferences;
