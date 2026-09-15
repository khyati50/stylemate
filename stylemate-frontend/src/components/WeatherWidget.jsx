import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, ChevronDown, MapPin } from "lucide-react";

function WeatherWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const fetchForecast = async (cityName, lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      let url = "http://localhost:5000/api/weather/forecast";
      const params = new URLSearchParams();
      if (cityName) params.set("city", cityName);
      if (lat != null && lon != null) {
        params.set("lat", lat);
        params.set("lon", lon);
      }
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
        if (data.location?.city) {
          try {
            localStorage.setItem(
              "stylemate_weather_destination",
              JSON.stringify({
                city: data.location.city,
                lat: data.location.latitude,
                lon: data.location.longitude,
              })
            );
          } catch {
            // Storage quota or privacy restriction
          }
        }
      } else {
        setError("Unable to load weather forecast.");
      }
    } catch (err) {
      console.error("Forecast error:", err);
      setError("Failed to load forecast.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadInitialForecast = async () => {
      let targetCity = "New Delhi";
      let targetLat = null;
      let targetLon = null;

      const saved = localStorage.getItem("stylemate_weather_destination");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.city) {
            targetCity = parsed.city;
            targetLat = parsed.lat;
            targetLon = parsed.lon;
          }
        } catch {
          // Ignore invalid JSON in storage
        }
      }

      if (active) {
        await fetchForecast(targetCity, targetLat, targetLon);
      }
    };

    loadInitialForecast();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSearchInput = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/weather/cities?q=${encodeURIComponent(
            value.trim()
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.cities || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Failed to search cities:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectCity = (city) => {
    setSearchQuery("");
    setSearchResults([]);
    fetchForecast(city.name, city.latitude, city.longitude);
  };

  const handleStyleForDay = (day) => {
    setIsOpen(false);
    const city =
      weather?.location?.city || weather?.location?.name || "New Delhi";
    const season = day.suggestedSeason || "summer";
    const temp = day.tempMax != null ? day.tempMax : "";
    navigate(
      `/recommendation?season=${encodeURIComponent(
        season
      )}&temp=${encodeURIComponent(temp)}&city=${encodeURIComponent(city)}`
    );
  };

  const getSeasonBadge = (season) => {
    const s = (season || "").toLowerCase();
    switch (s) {
      case "summer":
        return "bg-amber-50 text-amber-800 border-amber-200/80";
      case "winter":
        return "bg-sky-50 text-sky-800 border-sky-200/80";
      case "autumn":
        return "bg-orange-50 text-orange-800 border-orange-200/80";
      case "spring":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/80";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200/80";
    }
  };

  const dailyList = weather?.daily || weather?.forecast || [];

  return (
    <>
      {/* Collapsed State: Navbar Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 rounded-full border border-[#EAE5DD] bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#2E2E2E] shadow-xs transition-all hover:border-[#8B6F47]/50 hover:bg-[#FAF7F2] hover:shadow-sm"
        title="Open Weather & Destination Planner"
      >
        {loading && !weather ? (
          <span className="flex items-center gap-1.5 text-gray-400">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[#8B6F47]" />
            <span>Weather...</span>
          </span>
        ) : (
          <>
            <span className="text-base leading-none">
              {weather?.current?.icon || "☀️"}
            </span>
            <span className="font-medium text-[#2E2E2E]">
              {weather?.location?.city || "New Delhi"}
            </span>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-[#8B6F47]">
              {weather?.current?.temp ?? "--"}°C
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 hidden sm:inline">
              6-Day Forecast
            </span>
            <ChevronDown
              size={13}
              className="text-gray-400 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-[#8B6F47]"
            />
          </>
        )}
      </button>

      {/* Expanded Weather Drawer / Modal via Portal to escape parent backdrop-filter */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="relative flex flex-col w-full max-w-4xl max-h-[88vh] rounded-3xl bg-[#FAF7F2] border border-[#EAE5DD] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#EAE5DD] px-6 py-4 bg-white/80 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B6F47]/10 text-xl text-[#8B6F47]">
                  🌤️
                </div>
                <div>
                  <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E]">
                    Weather & Destination Planner
                  </h2>
                  <p className="text-xs text-gray-500">
                    Forecast-driven styling for any city or destination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-[#2E2E2E]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* City Search Bar with Dropdown */}
              <div className="relative">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Search destination or city (e.g. Paris, Goa, London, Mumbai)..."
                    className="w-full rounded-2xl border border-[#EAE5DD] bg-white py-3.5 pl-11 pr-10 text-sm text-[#2E2E2E] shadow-xs outline-none transition placeholder:text-gray-400 hover:border-[#8B6F47]/40 focus:border-[#8B6F47] focus:ring-4 focus:ring-[#8B6F47]/10"
                  />
                  {searching && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B6F47] border-t-transparent" />
                    </div>
                  )}
                  {searchQuery && !searching && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-30 overflow-hidden rounded-2xl border border-[#EAE5DD] bg-white shadow-xl">
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {searchResults.map((city, idx) => (
                        <button
                          key={`${city.name}-${city.latitude}-${idx}`}
                          type="button"
                          onClick={() => handleSelectCity(city)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#FAF7F2]"
                        >
                          <div className="flex items-center gap-2.5">
                            <MapPin size={15} className="text-[#8B6F47]" />
                            <div>
                              <span className="text-sm font-semibold text-[#2E2E2E]">
                                {city.name}
                              </span>
                              {city.admin1 && (
                                <span className="ml-1 text-xs text-gray-500">
                                  · {city.admin1}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-[#8B6F47]">
                            {city.country}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Current Weather Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-[#8B6F47]/20 bg-gradient-to-br from-[#8B6F47]/10 via-white to-[#FAF7F2] p-5 md:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#8B6F47]">
                      <span>Current Destination</span>
                    </div>
                    <h3 className="mt-1 font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#2E2E2E]">
                      {weather?.location?.city || "New Delhi"}
                      {weather?.location?.country && (
                        <span className="ml-2 text-sm md:text-base font-normal text-gray-500">
                          , {weather.location.country}
                        </span>
                      )}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {weather?.current?.condition} · High:{" "}
                      {weather?.current?.tempMax}°C · Low:{" "}
                      {weather?.current?.tempMin}°C
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-4xl md:text-5xl">
                      {weather?.current?.icon || "☀️"}
                    </span>
                    <div>
                      <span className="text-3xl md:text-4xl font-bold text-[#2E2E2E]">
                        {weather?.current?.temp ?? "--"}°
                      </span>
                      <span className="text-sm font-medium text-gray-500">C</span>
                    </div>
                  </div>
                </div>

                {/* Brief Stylist Tip */}
                {weather?.current?.stylingTip && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-white/95 border border-[#EAE5DD] p-3 text-xs md:text-sm text-[#2E2E2E] shadow-2xs">
                    <span className="text-base text-[#8B6F47]">✨</span>
                    <div>
                      <span className="font-semibold text-[#8B6F47]">
                        Stylist Tip:{" "}
                      </span>
                      <span className="text-gray-700">
                        {weather.current.stylingTip}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 6-Day Forecast Grid */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                    6-Day Destination Forecast
                  </h4>
                  <span className="text-xs text-gray-500">
                    Click "Style for this Day" to personalize outfits
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {dailyList.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-col justify-between rounded-2xl border border-[#EAE5DD] bg-white p-3.5 shadow-2xs transition-all hover:border-[#8B6F47]/40 hover:shadow-md"
                    >
                      <div>
                        {/* Day and Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#2E2E2E]">
                            {day.dayName}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {day.formattedDate}
                          </span>
                        </div>

                        {/* Weather Icon & Condition */}
                        <div className="my-2 text-center">
                          <div className="text-3xl">{day.icon}</div>
                          <div
                            className="mt-1 truncate text-xs font-medium text-gray-600"
                            title={day.condition}
                          >
                            {day.condition}
                          </div>
                        </div>

                        {/* Temp & Visual Bar */}
                        <div className="my-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#2E2E2E]">
                            <span>{day.tempMax}°C</span>
                            <span className="text-gray-400 text-[11px] font-normal">
                              {day.tempMin}°C
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#8B6F47]/60 to-[#8B6F47]"
                              style={{
                                width: `${Math.min(
                                  Math.max((day.tempMax / 40) * 100, 20),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Season Badge */}
                        <div className="mt-2 text-center">
                          <span
                            className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getSeasonBadge(
                              day.suggestedSeason
                            )}`}
                          >
                            {day.suggestedSeason}
                          </span>
                        </div>
                      </div>

                      {/* Style for this Day Button */}
                      <button
                        type="button"
                        onClick={() => handleStyleForDay(day)}
                        className="mt-3 w-full rounded-xl bg-[#8B6F47] py-2 px-1 text-center text-[11px] font-semibold text-white shadow-xs transition hover:bg-[#725a39] active:scale-[0.98]"
                      >
                        Style for this Day ✨
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default WeatherWidget;
