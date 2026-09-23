import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Luggage,
  Sparkles,
  Calendar,
  MapPin,
  Check,
  RotateCcw,
  ArrowLeftRight,
  Plus,
  Trash2,
  Bookmark,
  ChevronRight,
  X,
  Compass,
  Shirt,
  Sun,
  CloudSnow,
  Flower2,
  TreePine,
  Briefcase,
  Heart,
  Smile,
  Palmtree,
  CheckCircle2,
} from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import Toast from "../components/Toast";
import { API_BASE_URL, getImageUrl } from "../config/api";

const QUICK_DESTINATIONS = [
  "Paris",
  "Tokyo",
  "Goa",
  "London",
  "New York",
  "Barcelona",
];

const VIBE_OPTIONS = [
  { id: "vacation", label: "Vacation", icon: Palmtree, desc: "Relaxed resort & holiday" },
  { id: "business", label: "Business & City", icon: Briefcase, desc: "Sharp smart-casual" },
  { id: "romantic", label: "Romantic Date", icon: Heart, desc: "Chic & evening ready" },
  { id: "casual", label: "Casual Holiday", icon: Smile, desc: "Effortless everyday wear" },
];

const SEASON_OPTIONS = [
  { id: "summer", label: "Summer", icon: Sun },
  { id: "winter", label: "Winter", icon: CloudSnow },
  { id: "spring", label: "Spring", icon: Flower2 },
  { id: "autumn", label: "Autumn", icon: TreePine },
];

const DURATION_PRESETS = [3, 4, 5, 7];

export default function PackingCapsule() {
  const navigate = useNavigate();

  // Configuration state
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(4);
  const [customDays, setCustomDays] = useState("");
  const [vibe, setVibe] = useState("vacation");
  const [season, setSeason] = useState("summer");

  // Active Capsule state
  const [capsule, setCapsule] = useState(null);
  const [capsuleItems, setCapsuleItems] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [destinationProfile, setDestinationProfile] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);

  // Filter & Checklist state
  const [checklistFilter, setChecklistFilter] = useState("all");

  // Closet & Saved trips state
  const [fullWardrobe, setFullWardrobe] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [showSavedTripsModal, setShowSavedTripsModal] = useState(false);
  const [showAddPieceModal, setShowAddPieceModal] = useState(false);
  const [addPieceSearch, setAddPieceSearch] = useState("");

  // Slot swap drawer state
  const [swapState, setSwapState] = useState(null); // { dayIndex, slotName, currentItem }

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [shufflingDayIndex, setShufflingDayIndex] = useState(null);
  const [savingTrip, setSavingTrip] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem("token");

  // Helper to categorize an item client-side
  const getItemSlotType = (item) => {
    if (!item) return "top";
    const cat = (item.category || "").toLowerCase();
    const name = (item.name || "").toLowerCase();
    const text = `${cat} ${name}`;
    if (/full|dress|jumpsuit|romper/i.test(text)) return "fullBody";
    if (/footwear|shoe|sneaker|boots|loafers|sandals|heels/i.test(text)) return "footwear";
    if (/outerwear|jacket|coat|blazer|cardigan/i.test(text)) return "outerwear";
    if (/bottom|pants|jeans|trousers|shorts|skirt/i.test(text)) return "bottom";
    if (/accessory|bag|hat|belt|scarf|sunglasses/i.test(text)) return "accessory";
    return "top";
  };

  const fetchWardrobe = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/clothing/my-wardrobe`, {
        headers: { authorization: token },
      });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.wardrobe) {
        setFullWardrobe(data.wardrobe);
      }
    } catch (err) {
      console.error("fetchWardrobe error:", err);
    }
  };

  const fetchSavedTrips = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/my-trips`, {
        headers: { authorization: token },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTrips(data.trips || []);
      }
    } catch (err) {
      console.error("fetchSavedTrips error:", err);
    }
  };

  // Fetch full wardrobe and saved trips on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWardrobe();
    fetchSavedTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate Capsule
  const handleGenerateCapsule = async () => {
    if (!destination.trim()) {
      setToast({ message: "Please specify a travel destination.", variant: "error" });
      return;
    }

    const tripDuration = customDays ? parseInt(customDays, 10) : days;
    if (isNaN(tripDuration) || tripDuration < 2 || tripDuration > 14) {
      setToast({ message: "Trip duration must be between 2 and 14 days.", variant: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          destination: destination.trim(),
          days: tripDuration,
          vibe,
          season,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.message || "Failed to generate capsule.", variant: "error" });
        return;
      }

      setCapsule(data);
      setCapsuleItems(data.capsuleItems || []);
      setItinerary(data.itinerary || []);
      setMetrics(data.metrics || null);
      setDestinationProfile(data.destinationProfile || data.metrics?.destinationProfile || null);
      setActiveTripId(null);
      setToast({ message: `Capsule generated for ${data.destination}!`, variant: "success" });

      // Smooth scroll to results
      setTimeout(() => {
        window.scrollTo({ top: 380, behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error(err);
      setToast({ message: "Network error. Please try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Packed status on an item
  const toggleItemPacked = (itemId) => {
    setCapsuleItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, packed: !item.packed } : item
      )
    );
  };

  // Remove an item from suitcase
  const handleRemoveSuitcaseItem = (itemId) => {
    const updatedItems = capsuleItems.filter((it) => it.id !== itemId);
    setCapsuleItems(updatedItems);

    // If an itinerary outfit was using this item, replace with another item or null
    setItinerary((prev) =>
      prev.map((day) => {
        const outfit = { ...day.outfit };
        for (const [slot, piece] of Object.entries(outfit)) {
          if (piece && piece.id === itemId) {
            // Find another piece from suitcase of same category
            const altPiece = updatedItems.find(
              (it) => getItemSlotType(it) === getItemSlotType(piece)
            );
            outfit[slot] = altPiece || null;
          }
        }
        return { ...day, outfit };
      })
    );

    // Update metrics
    if (metrics) {
      setMetrics({
        ...metrics,
        totalPacked: updatedItems.length,
      });
    }

    setToast({ message: "Item removed from suitcase.", variant: "success" });
  };

  // Add piece from closet to suitcase
  const handleAddPieceToSuitcase = (wardrobeItem) => {
    if (capsuleItems.some((it) => it.id === wardrobeItem.id)) {
      setToast({ message: "This piece is already packed in your suitcase!", variant: "error" });
      return;
    }

    const newItem = {
      id: wardrobeItem.id,
      name: wardrobeItem.name,
      category: wardrobeItem.category,
      imageUrl: wardrobeItem.imageUrl,
      colors: wardrobeItem.colors,
      styles: wardrobeItem.styles,
      seasons: wardrobeItem.seasons,
      occasions: wardrobeItem.occasions,
      status: wardrobeItem.status || "available",
      packed: false,
    };

    const updated = [...capsuleItems, newItem];
    setCapsuleItems(updated);

    if (metrics) {
      setMetrics({
        ...metrics,
        totalPacked: updated.length,
        possibleOutfits: metrics.possibleOutfits + 2,
      });
    }

    setShowAddPieceModal(false);
    setToast({ message: `Added "${wardrobeItem.name}" to suitcase!`, variant: "success" });
  };

  // Shuffle Look for a specific day
  const handleShuffleDayLook = async (dayIndex) => {
    setShufflingDayIndex(dayIndex);
    const dayData = itinerary[dayIndex];
    if (!dayData) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/reroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          capsuleItemIds: capsuleItems.map((it) => it.id),
          capsuleItems,
          currentOutfit: dayData.outfit,
          dayIndex,
          vibe,
          season,
          destination: capsule?.destination || destination,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.message || "Failed to shuffle look.", variant: "error" });
        return;
      }

      setItinerary((prev) => {
        const next = [...prev];
        next[dayIndex] = {
          ...next[dayIndex],
          outfit: data.updatedOutfit,
        };
        return next;
      });

      setToast({ message: `Day ${dayData.day} outfit refreshed!`, variant: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Could not shuffle outfit.", variant: "error" });
    } finally {
      setShufflingDayIndex(null);
    }
  };

  // Swap Garment in a slot
  const handleSwapItem = (selectedItem) => {
    if (!swapState) return;
    const { dayIndex, slotName } = swapState;

    // Check if selectedItem is already in capsuleItems, if not add it to suitcase!
    if (!capsuleItems.some((it) => it.id === selectedItem.id)) {
      setCapsuleItems((prev) => [
        ...prev,
        { ...selectedItem, packed: false },
      ]);
      if (metrics) {
        setMetrics({
          ...metrics,
          totalPacked: metrics.totalPacked + 1,
          possibleOutfits: metrics.possibleOutfits + 2,
        });
      }
    }

    const selectedType = getItemSlotType(selectedItem);

    setItinerary((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const outfit = { ...day.outfit };

      if (selectedType === "fullBody") {
        outfit.fullBody = selectedItem;
        outfit.top = null;
        outfit.bottom = null;
      } else if (slotName === "fullBody" && selectedType === "top") {
        outfit.top = selectedItem;
        outfit.fullBody = null;
      } else if (slotName === "fullBody" && selectedType === "bottom") {
        outfit.bottom = selectedItem;
        outfit.fullBody = null;
      } else {
        outfit[slotName] = selectedItem;
      }

      next[dayIndex] = { ...day, outfit };
      return next;
    });

    setSwapState(null);
    setToast({ message: `Updated with "${selectedItem.name}"!`, variant: "success" });
  };

  // Remove a garment slot from a specific day
  const handleRemoveSlotItem = (dayIndex, slotName) => {
    setItinerary((prev) => {
      const next = [...prev];
      const day = next[dayIndex];
      const outfit = { ...day.outfit, [slotName]: null };
      next[dayIndex] = { ...day, outfit };
      return next;
    });
    setToast({ message: `Removed piece from Day ${dayIndex + 1} outfit.`, variant: "success" });
  };

  // Save Trip
  const handleSaveTrip = async () => {
    if (!capsule || !destination) return;
    setSavingTrip(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          destination,
          days: capsule.days || days,
          vibe,
          season,
          capsuleItems,
          itinerary,
          metrics,
          destinationProfile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({ message: data.message || "Failed to save trip.", variant: "error" });
        return;
      }

      setActiveTripId(data.trip.id);
      fetchSavedTrips();
      setToast({ message: "Trip saved to your profile!", variant: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Error saving trip.", variant: "error" });
    } finally {
      setSavingTrip(false);
    }
  };

  // Load a Saved Trip
  const handleLoadTrip = (trip) => {
    setDestination(trip.destination);
    setDays(trip.days);
    setCustomDays("");
    setVibe(trip.vibe);
    setSeason(trip.season);
    const profile = trip.metrics?.destinationProfile || null;
    setCapsule({
      destination: trip.destination,
      destinationProfile: profile,
      days: trip.days,
      vibe: trip.vibe,
      season: trip.season,
      capsuleItems: trip.capsuleItems,
      itinerary: trip.itinerary,
      metrics: trip.metrics,
    });
    setCapsuleItems(trip.capsuleItems || []);
    setItinerary(trip.itinerary || []);
    setMetrics(trip.metrics || null);
    setDestinationProfile(profile);
    setActiveTripId(trip.id);
    setShowSavedTripsModal(false);
    setToast({ message: `Loaded trip to ${trip.destination}!`, variant: "success" });

    setTimeout(() => {
      window.scrollTo({ top: 380, behavior: "smooth" });
    }, 100);
  };

  // Delete a Saved Trip
  const handleDeleteTrip = async (tripId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved travel capsule?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/capsule/${tripId}`, {
        method: "DELETE",
        headers: { authorization: token },
      });
      if (res.ok) {
        setSavedTrips((prev) => prev.filter((t) => t.id !== tripId));
        if (activeTripId === tripId) setActiveTripId(null);
        setToast({ message: "Saved trip removed.", variant: "success" });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to delete trip.", variant: "error" });
    }
  };

  // Checklist stats
  const packedCount = capsuleItems.filter((it) => it.packed).length;
  const packedPercent =
    capsuleItems.length > 0 ? Math.round((packedCount / capsuleItems.length) * 100) : 0;

  // Filter checklist items
  const filteredChecklistItems = capsuleItems.filter((item) => {
    if (checklistFilter === "all") return true;
    const slot = getItemSlotType(item);
    if (checklistFilter === "tops") return slot === "top";
    if (checklistFilter === "bottoms") return slot === "bottom";
    if (checklistFilter === "shoes") return slot === "footwear";
    if (checklistFilter === "outerwear") return slot === "outerwear";
    if (checklistFilter === "dresses") return slot === "fullBody";
    if (checklistFilter === "accessories") return slot === "accessory";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AuthNavbar />

        {/* Standardized Editorial Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <Luggage size={12} />
                <span>✦ Travel Capsule</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                Travel Packing Capsule
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Pack lighter, dress sharper. AI-curated travel capsules and daily looks from your wardrobe.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowSavedTripsModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#8B6F47]/40 bg-white px-4 py-2.5 text-xs font-semibold text-[#8B6F47] shadow-2xs transition hover:bg-[#8B6F47] hover:text-white cursor-pointer"
              >
                <Bookmark size={15} />
                <span>Saved Trips ({savedTrips.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trip Configuration Card */}
        <div className="mb-10 rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-8 shadow-xs">
          <div className="mb-6 flex items-center gap-2">
            <Compass size={18} className="text-[#8B6F47]" />
            <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
              Plan Your Capsule
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Destination */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                1. Where are you traveling?
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="e.g. Paris, Tokyo, Goa, Amalfi Coast"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2]/50 py-3 pl-11 pr-4 text-sm font-medium text-[#2E2E2E] placeholder-gray-400 transition focus:border-[#8B6F47] focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Quick Destination Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_DESTINATIONS.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      destination.toLowerCase() === dest.toLowerCase()
                        ? "bg-[#8B6F47] text-white shadow-xs"
                        : "border border-[#EAE5DD] bg-white text-gray-600 hover:border-[#8B6F47]/50"
                    }`}
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </div>

            {/* Trip Duration */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                2. Trip Duration
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDays(d);
                      setCustomDays("");
                    }}
                    className={`flex-1 min-w-[70px] rounded-2xl border py-2.5 text-center text-sm font-semibold transition ${
                      !customDays && days === d
                        ? "border-[#8B6F47] bg-[#8B6F47] text-white shadow-xs"
                        : "border-[#EAE5DD] bg-white text-gray-700 hover:border-[#8B6F47]/40"
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
                <div className="relative flex-1 min-w-[90px]">
                  <input
                    type="number"
                    min="2"
                    max="14"
                    placeholder="Custom"
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      if (e.target.value) setDays(parseInt(e.target.value, 10));
                    }}
                    className={`w-full rounded-2xl border py-2.5 px-3 text-center text-sm font-semibold transition focus:outline-hidden ${
                      customDays
                        ? "border-[#8B6F47] bg-[#8B6F47] text-white placeholder-white/80 shadow-xs"
                        : "border-[#EAE5DD] bg-white text-gray-700 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Vibe Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                3. Trip Style / Vibe
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {VIBE_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = vibe === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVibe(item.id)}
                      className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#8B6F47] bg-[#8B6F47]/10 text-[#8B6F47]"
                          : "border-[#EAE5DD] bg-white text-gray-700 hover:border-[#8B6F47]/40"
                      }`}
                    >
                      <Icon size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[11px] text-gray-500 leading-tight">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Season Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                4. Weather / Season
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {SEASON_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = season === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSeason(item.id)}
                      className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? "border-[#8B6F47] bg-[#8B6F47]/10 text-[#8B6F47]"
                          : "border-[#EAE5DD] bg-white text-gray-700 hover:border-[#8B6F47]/40"
                      }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleGenerateCapsule}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#8B6F47] px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#725937] hover:shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Curating Wardrobe Capsule...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Packing Capsule</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CAPSULE RESULTS SECTION */}
        {capsule && (
          <div className="space-y-12">
            {/* Overview Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-[#EAE5DD] bg-gradient-to-br from-[#2E2E2E] to-[#1F1F1F] p-6 md:p-8 text-white shadow-lg">
              <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#8B6F47] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                      {vibe}
                    </span>
                    <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium text-white/90">
                      {season}
                    </span>
                    <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-medium text-white/90">
                      {capsule.days || days} Days
                    </span>
                  </div>
                  <h2 className="mt-3 font-['Playfair_Display'] text-2xl md:text-4xl font-bold tracking-tight text-white">
                    {capsule.destination || destination} Capsule
                  </h2>
                  <p className="mt-1 text-sm text-gray-300">
                    Calculated luggage efficiency: zero overpacking with maximum styling versatility.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSaveTrip}
                    disabled={savingTrip}
                    className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#2E2E2E] shadow-sm transition hover:bg-[#FAF7F2] disabled:opacity-50"
                  >
                    <Bookmark size={15} />
                    <span>{savingTrip ? "Saving..." : activeTripId ? "Update Saved Trip" : "Save Trip"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCapsule(null);
                      setDestinationProfile(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/20"
                  >
                    <RotateCcw size={15} />
                    <span>Change Settings</span>
                  </button>
                </div>
              </div>

              {/* Versatility Metric Badges */}
              {metrics && (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B6F47] text-white">
                      <Luggage size={18} />
                    </span>
                    <div>
                      <div className="text-xl font-bold text-white leading-tight">
                        {capsuleItems.length} Pieces
                      </div>
                      <div className="text-[11px] text-gray-300">Total packed in luggage</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <div className="text-xl font-bold text-white leading-tight">
                        {metrics.possibleOutfits} Outfits
                      </div>
                      <div className="text-[11px] text-gray-300">Possible combinations</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 backdrop-blur-xs">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <CheckCircle2 size={18} />
                    </span>
                    <div>
                      <div className="text-xl font-bold text-white leading-tight">
                        0 Overpacking
                      </div>
                      <div className="text-[11px] text-gray-300">Every piece worn 2+ times</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Intelligence Card */}
            {destinationProfile && (
              <div className="border border-[#EAE5DD] bg-white rounded-3xl p-5 shadow-xs mb-8 transition hover:border-[#8B6F47]/40">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#8B6F47]/10 text-[#8B6F47]">
                        <Compass size={14} />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                        {destinationProfile.archetypeLabel} • {destinationProfile.destinationName}{destinationProfile.country ? `, ${destinationProfile.country}` : ""}
                      </span>
                    </div>
                    <h3 className="font-['Playfair_Display'] text-xl md:text-2xl font-bold text-[#2E2E2E]">
                      Destination Style Intelligence
                    </h3>
                  </div>

                  {destinationProfile.weather && (
                    <div className="flex items-center gap-2.5 self-start md:self-auto rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] px-4 py-2 shadow-xs">
                      <span className="text-2xl leading-none">{destinationProfile.weather.icon}</span>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-[#2E2E2E]">
                          {destinationProfile.weather.icon} {destinationProfile.weather.temp}°C • {destinationProfile.weather.condition}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Live Destination Weather
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {destinationProfile.styleDna && (
                  <div className="mt-4 pt-3.5 border-t border-[#EAE5DD]/70 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-[#8B6F47] mt-0.5 shrink-0" />
                    <p className="text-xs md:text-sm italic text-gray-700 leading-relaxed font-['Playfair_Display']">
                      "{destinationProfile.styleDna}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 1: The Packed Suitcase (Interactive Checklist) */}
            <div className="rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-8 shadow-xs">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#EAE5DD]">
                <div>
                  <div className="flex items-center gap-2">
                    <Luggage size={20} className="text-[#8B6F47]" />
                    <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#2E2E2E]">
                      The Packed Suitcase
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Interactive packing checklist. Check items off as you lay them into your luggage.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddPieceModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#8B6F47] bg-[#8B6F47]/10 px-3.5 py-2 text-xs font-bold text-[#8B6F47] transition hover:bg-[#8B6F47] hover:text-white"
                  >
                    <Plus size={15} />
                    <span>+ Add Piece From Closet</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 mb-6">
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                  <span>Luggage Checklist Progress</span>
                  <span className="text-[#8B6F47]">
                    {packedCount} of {capsuleItems.length} packed ({packedPercent}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#FAF7F2] border border-[#EAE5DD]">
                  <div
                    className="h-full bg-[#8B6F47] transition-all duration-500 rounded-full"
                    style={{ width: `${packedPercent}%` }}
                  />
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: "all", label: "All Items" },
                  { id: "tops", label: "Tops" },
                  { id: "bottoms", label: "Bottoms" },
                  { id: "shoes", label: "Footwear" },
                  { id: "outerwear", label: "Outerwear" },
                  { id: "dresses", label: "Full Body" },
                  { id: "accessories", label: "Accessories" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setChecklistFilter(tab.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      checklistFilter === tab.id
                        ? "bg-[#2E2E2E] text-white"
                        : "border border-[#EAE5DD] bg-[#FAF7F2] text-gray-600 hover:border-[#8B6F47]/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Suitcase Items Grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredChecklistItems.map((item) => {
                  const isPacked = Boolean(item.packed);
                  return (
                    <div
                      key={item.id}
                      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition duration-300 ${
                        isPacked
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-[#EAE5DD] bg-white hover:border-[#8B6F47]/40 hover:shadow-md"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <Shirt size={28} className="text-gray-300" />
                        )}

                        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#8B6F47] shadow-xs backdrop-blur-xs">
                          {item.category}
                        </span>

                        {/* Remove item button */}
                        <button
                          onClick={() => handleRemoveSuitcaseItem(item.id)}
                          title="Remove from suitcase"
                          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-gray-400 opacity-80 shadow-xs transition hover:opacity-100 hover:bg-red-50 hover:text-red-600 border border-gray-100"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Info & Checklist Toggle */}
                      <div className="flex flex-1 flex-col justify-between p-3">
                        <div className="mb-2">
                          <h4 className="text-xs font-bold text-[#2E2E2E] truncate">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 capitalize truncate">
                            {Array.isArray(item.colors) ? item.colors.join(", ") : item.colors || item.category}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleItemPacked(item.id)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition ${
                            isPacked
                              ? "bg-emerald-600 text-white"
                              : "border border-[#EAE5DD] bg-white text-gray-700 hover:border-emerald-600 hover:text-emerald-700"
                          }`}
                        >
                          <Check size={13} className={isPacked ? "opacity-100" : "opacity-40"} />
                          <span>{isPacked ? "Packed ✓" : "Pack"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredChecklistItems.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-500">
                  No items match this category filter.
                </div>
              )}
            </div>

            {/* SECTION 2: Day-by-Day Travel Itinerary */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-[#8B6F47]" />
                    <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#2E2E2E]">
                      Day-by-Day Travel Itinerary
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Thoughtfully sequenced looks. Tap any garment to swap pieces, or shuffle the entire day.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {itinerary.map((dayPlan, dayIdx) => {
                  const isShuffling = shufflingDayIndex === dayIdx;
                  const outfit = dayPlan.outfit || {};

                  // Slots to display
                  const slots = [];
                  if (outfit.fullBody) {
                    slots.push({ key: "fullBody", label: "Full Body / Dress", item: outfit.fullBody });
                  } else {
                    slots.push({ key: "top", label: "Top", item: outfit.top });
                    slots.push({ key: "bottom", label: "Bottom", item: outfit.bottom });
                  }
                  slots.push({ key: "footwear", label: "Footwear", item: outfit.footwear });
                  slots.push({ key: "outerwear", label: "Layer / Outerwear", item: outfit.outerwear });
                  slots.push({ key: "accessory", label: "Accessory", item: outfit.accessory });

                  return (
                    <div
                      key={dayPlan.day}
                      className="rounded-3xl border border-[#EAE5DD] bg-white p-6 md:p-7 shadow-xs transition hover:border-[#8B6F47]/40"
                    >
                      {/* Day Header */}
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#EAE5DD]/70 pb-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8B6F47]">
                            Day {dayPlan.day}
                          </span>
                          <h4 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                            {dayPlan.theme}
                          </h4>
                        </div>

                        <button
                          onClick={() => handleShuffleDayLook(dayIdx)}
                          disabled={isShuffling}
                          className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#EAE5DD] bg-[#FAF7F2] px-3.5 py-2 text-xs font-bold text-[#2E2E2E] shadow-xs transition hover:border-[#8B6F47] hover:bg-[#8B6F47] hover:text-white disabled:opacity-50"
                        >
                          <RotateCcw
                            size={14}
                            className={isShuffling ? "animate-spin text-[#8B6F47]" : ""}
                          />
                          <span>{isShuffling ? "Shuffling..." : "🎲 Shuffle Look"}</span>
                        </button>
                      </div>

                      {/* Garment Slots Grid */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {slots.map((slot) => {
                          if (!slot.item) {
                            return (
                              <div
                                key={slot.key}
                                onClick={() =>
                                  setSwapState({
                                    dayIndex: dayIdx,
                                    slotName: slot.key,
                                    currentItem: null,
                                  })
                                }
                                className="cursor-pointer border-2 border-dashed border-[#EAE5DD] hover:border-[#8B6F47] rounded-2xl p-3 flex flex-col items-center justify-center text-center transition bg-[#FAF7F2]/50 hover:bg-white aspect-[4/5]"
                              >
                                <Plus size={20} className="text-[#8B6F47] mb-1" />
                                <span className="text-[11px] font-bold text-gray-700">+ Add {slot.label}</span>
                                <span className="text-[9px] text-gray-400">
                                  {slot.key === "outerwear" || slot.key === "accessory" ? "Optional layer" : "Select piece"}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={slot.key}
                              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2]/40 transition hover:border-[#8B6F47]/50 hover:bg-white hover:shadow-sm"
                            >
                              {/* Slot Image */}
                              <div className="relative aspect-[4/5] w-full overflow-hidden bg-white flex items-center justify-center">
                                {slot.item?.imageUrl ? (
                                  <img
                                    src={getImageUrl(slot.item.imageUrl)}
                                    alt={slot.item.name}
                                    className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <Shirt size={28} className="text-gray-300" />
                                )}

                                <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gray-700 shadow-xs">
                                  {slot.label}
                                </span>

                                {/* Swap & Remove Buttons on Hover */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                                  <button
                                    onClick={() =>
                                      setSwapState({
                                        dayIndex: dayIdx,
                                        slotName: slot.key,
                                        currentItem: slot.item,
                                      })
                                    }
                                    title={`Swap ${slot.label}`}
                                    className="flex items-center gap-1 rounded-xl bg-white/95 px-2 py-1 text-[10px] font-bold text-[#8B6F47] shadow-md border border-[#EAE5DD] transition hover:bg-[#8B6F47] hover:text-white"
                                  >
                                    <ArrowLeftRight size={11} />
                                    <span>Swap</span>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSlotItem(dayIdx, slot.key)}
                                    title={`Remove ${slot.label}`}
                                    className="flex items-center gap-1 rounded-xl bg-white/95 px-2 py-1 text-[10px] font-bold text-red-600 shadow-md border border-red-100 transition hover:bg-red-50"
                                  >
                                    <X size={11} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>

                              {/* Slot Details */}
                              <div className="p-2.5">
                                <h5 className="text-xs font-bold text-[#2E2E2E] truncate">
                                  {slot.item?.name || "No piece"}
                                </h5>
                                <p className="text-[10px] text-gray-500 capitalize truncate">
                                  {slot.item?.category || ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: Garment Swap Drawer / Modal */}
        {swapState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#EAE5DD] pb-4 mb-5">
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    {swapState.currentItem ? "Swap" : "Add"}{" "}
                    {swapState.slotName === "fullBody"
                      ? "Full Body Dress"
                      : swapState.slotName === "outerwear"
                      ? "Layer / Outerwear"
                      : swapState.slotName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Day {itinerary[swapState.dayIndex]?.day} •{" "}
                    {swapState.currentItem ? `Current: ${swapState.currentItem.name}` : "No piece currently assigned"}
                  </p>
                </div>
                <button
                  onClick={() => setSwapState(null)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Prominent Remove Piece action if slot currently has an item */}
              {swapState.currentItem && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                  <span className="text-xs text-red-800 font-medium">Don't want to wear this piece today?</span>
                  <button
                    onClick={() => {
                      handleRemoveSlotItem(swapState.dayIndex, swapState.slotName);
                      setSwapState(null);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Remove Piece Completely</span>
                  </button>
                </div>
              )}

              {/* Sub-section A: From Suitcase (0 Extra Luggage) */}
              <div className="mb-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <Luggage size={16} className="text-[#8B6F47]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                    From Your Packed Suitcase (Free Luggage)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {capsuleItems
                    .filter((it) => {
                      const targetType = swapState.slotName || (swapState.currentItem ? getItemSlotType(swapState.currentItem) : "top");
                      return getItemSlotType(it) === targetType && (!swapState.currentItem || it.id !== swapState.currentItem.id);
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSwapItem(item)}
                        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2]/50 p-2.5 transition hover:border-[#8B6F47] hover:bg-white hover:shadow-md"
                      >
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-white mb-2 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition"
                            />
                          ) : (
                            <Shirt size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#2E2E2E] truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {item.category}
                        </div>
                      </div>
                    ))}
                </div>

                {capsuleItems.filter((it) => {
                  const targetType = swapState.slotName || (swapState.currentItem ? getItemSlotType(swapState.currentItem) : "top");
                  return getItemSlotType(it) === targetType && (!swapState.currentItem || it.id !== swapState.currentItem.id);
                }).length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">
                    No other pieces of this type in your suitcase. Pick from your closet below!
                  </p>
                )}
              </div>

              {/* Sub-section B: From Full Digital Closet */}
              <div className="border-t border-[#EAE5DD] pt-5">
                <div className="flex items-center gap-1.5 mb-3">
                  <Shirt size={16} className="text-gray-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    From Your Digital Closet (Adds to Suitcase)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fullWardrobe
                    .filter((it) => {
                      const targetType = swapState.slotName || (swapState.currentItem ? getItemSlotType(swapState.currentItem) : "top");
                      return (
                        getItemSlotType(it) === targetType &&
                        !capsuleItems.some((c) => c.id === it.id)
                      );
                    })
                    .slice(0, 9)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSwapItem(item)}
                        className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#EAE5DD] bg-white p-2.5 transition hover:border-[#8B6F47] hover:shadow-md"
                      >
                        <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#FAF7F2] mb-2 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              className="h-full w-full object-cover object-center group-hover:scale-105 transition"
                            />
                          ) : (
                            <Shirt size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#2E2E2E] truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {item.category}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Add Extra Piece to Suitcase from Closet */}
        {showAddPieceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#EAE5DD] pb-4 mb-4">
                <div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    Pack an Extra Piece from Your Closet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select any garment to pack into your travel suitcase.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPieceModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search input */}
              <input
                type="text"
                placeholder="Search closet garments by name, style, color..."
                value={addPieceSearch}
                onChange={(e) => setAddPieceSearch(e.target.value)}
                className="mb-4 w-full rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2]/50 px-4 py-2.5 text-xs text-[#2E2E2E] placeholder-gray-400 focus:border-[#8B6F47] focus:bg-white focus:outline-hidden"
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {fullWardrobe
                  .filter((it) => {
                    const isAlreadyInSuitcase = capsuleItems.some((c) => c.id === it.id);
                    if (isAlreadyInSuitcase) return false;
                    if (!addPieceSearch.trim()) return true;
                    const query = addPieceSearch.toLowerCase();
                    return (
                      it.name?.toLowerCase().includes(query) ||
                      it.category?.toLowerCase().includes(query)
                    );
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddPieceToSuitcase(item)}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#EAE5DD] bg-white p-2.5 transition hover:border-[#8B6F47] hover:shadow-md"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-xl bg-[#FAF7F2] mb-2 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="h-full w-full object-cover object-center group-hover:scale-105 transition"
                          />
                        ) : (
                          <Shirt size={24} className="text-gray-300" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-[#2E2E2E] truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {item.category}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Saved Trips Drawer / Modal */}
        {showSavedTripsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#EAE5DD] pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <Bookmark size={18} className="text-[#8B6F47]" />
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    Your Saved Travel Capsules
                  </h3>
                </div>
                <button
                  onClick={() => setShowSavedTripsModal(false)}
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              {savedTrips.length === 0 ? (
                <div className="py-12 text-center">
                  <Luggage size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No saved trips yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Generate a packing capsule and save it to review anytime!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => handleLoadTrip(trip)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2]/40 p-4 transition hover:border-[#8B6F47] hover:bg-white hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-['Playfair_Display'] text-base font-bold text-[#2E2E2E] group-hover:text-[#8B6F47] transition">
                            {trip.destination}
                          </h4>
                          <span className="rounded-full bg-[#8B6F47]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#8B6F47]">
                            {trip.days} Days
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {trip.vibe} • {trip.season} • {trip.capsuleItems?.length || 0} pieces packed
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          title="Delete saved trip"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight
                          size={18}
                          className="text-gray-400 group-hover:text-[#8B6F47] transition"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast notifications */}
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
