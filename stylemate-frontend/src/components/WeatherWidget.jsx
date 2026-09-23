import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  ChevronDown,
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Droplets,
  Wind,
  Sparkles,
  Thermometer,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

function WeatherWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState("whole_day"); // "whole_day" | "7_day"

  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const fetchForecast = async (cityName, lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/api/weather/forecast`;
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
            if (active) {
              await fetchForecast(targetCity, targetLat, targetLon);
            }
            return;
          }
        } catch {
          // Ignore invalid JSON in storage
        }
      }

      // If no saved destination, attempt browser geolocation for exact location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (active) {
              fetchForecast(null, pos.coords.latitude, pos.coords.longitude);
            }
          },
          () => {
            if (active) {
              fetchForecast(targetCity, targetLat, targetLon);
            }
          },
          { timeout: 4000 }
        );
      } else if (active) {
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
          `${API_BASE_URL}/api/weather/cities?q=${encodeURIComponent(
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

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setSearchQuery("");
        setSearchResults([]);
        fetchForecast(null, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        console.warn("Geolocation error:", err.message);
        setError("Could not access your location. Please check browser permissions.");
      },
      { timeout: 10000 }
    );
  };

  const handleStyleForDay = (day) => {
    setIsOpen(false);
    const city =
      weather?.location?.city || weather?.location?.name || "Your Location";
    const season = day.suggestedSeason || "summer";
    const temp = day.tempMax != null ? day.tempMax : "";
    navigate(
      `/recommendation?season=${encodeURIComponent(
        season
      )}&temp=${encodeURIComponent(temp)}&city=${encodeURIComponent(city)}`
    );
  };

  const dailyList = weather?.daily || weather?.forecast || [];
  const hourlyList = weather?.hourly || [];
  const dayPhases = weather?.dayPhases || [];

  return (
    <>
      {/* Collapsed State: Navbar Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 rounded-full border border-[#EAE5DD] bg-white/95 px-3.5 py-1.5 text-xs font-medium text-[#2E2E2E] shadow-xs transition-all hover:border-[#8B6F47]/50 hover:bg-[#FAF7F2] hover:shadow-sm"
        title="Open Weather & Destination Forecast"
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
            <span className="font-semibold text-[#2E2E2E] max-w-[110px] truncate">
              {weather?.location?.city || "New Delhi"}
            </span>
            <span className="text-gray-300">·</span>
            <span className="font-bold text-[#8B6F47]">
              {weather?.current?.temp ?? "--"}°C
            </span>
            {weather?.current?.apparentTemp && (
              <span className="text-[11px] text-gray-400 hidden lg:inline">
                (Feels {weather.current.apparentTemp}°)
              </span>
            )}
            <ChevronDown
              size={13}
              className="text-gray-400 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:text-[#8B6F47]"
            />
          </>
        )}
      </button>

      {/* Expanded Weather Modal via Portal */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-3xl bg-[#FAF7F2] border border-[#EAE5DD] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] overflow-hidden my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#EAE5DD] px-5 sm:px-7 py-4 bg-white/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8B6F47]/10 text-xl text-[#8B6F47]">
                    🌤️
                  </div>
                  <div>
                    <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E]">
                      Weather & Destination Planner
                    </h2>
                    <p className="text-xs text-[#8C8277]">
                      24-Hour hourly progression, day-phase styling, and 7-day outlook
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-[#2E2E2E] cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
                {/* Search Bar with GPS Location Button */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                        <Search size={18} />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder="Search any destination (e.g. Paris, Goa, London, Mumbai, Dubai)..."
                        className="w-full rounded-2xl border border-[#EAE5DD] bg-white py-3 pl-11 pr-10 text-xs sm:text-sm text-[#2E2E2E] shadow-2xs outline-none transition placeholder:text-gray-400 hover:border-[#8B6F47]/40 focus:border-[#8B6F47] focus:ring-4 focus:ring-[#8B6F47]/10"
                      />
                      {searching && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
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
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* GPS Locate Me Button */}
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="shrink-0 flex items-center gap-1.5 px-3.5 py-3 rounded-2xl border border-[#EAE5DD] bg-white text-xs font-semibold text-[#8B6F47] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#8B6F47]/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Detect your current location"
                    >
                      <Navigation size={14} className={locating ? "animate-spin text-[#8B6F47]" : ""} />
                      <span className="hidden sm:inline">
                        {locating ? "Locating..." : "My Location"}
                      </span>
                    </button>
                  </div>

                  {/* Search Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-30 overflow-hidden rounded-2xl border border-[#EAE5DD] bg-white shadow-xl">
                      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                        {searchResults.map((city, idx) => (
                          <button
                            key={`${city.name}-${city.latitude}-${idx}`}
                            type="button"
                            onClick={() => handleSelectCity(city)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#FAF7F2] cursor-pointer"
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

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
                    {error}
                  </div>
                )}

                {/* Live Destination Overview Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-[#8B6F47]/20 bg-gradient-to-br from-[#FAF7F2] via-white to-[#FAF7F2] p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B6F47]">
                        <Sparkles size={11} />
                        <span>Current Destination</span>
                      </div>

                      <h3 className="mt-1 font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1A1918]">
                        {weather?.location?.city || "New Delhi"}
                        {weather?.location?.country && (
                          <span className="ml-2 text-sm sm:text-base font-normal text-[#8C8277]">
                            , {weather.location.country}
                          </span>
                        )}
                      </h3>

                      <p className="mt-0.5 text-xs text-[#8C8277]">
                        {weather?.current?.condition} · Range: {weather?.current?.tempMin}°C – {weather?.current?.tempMax}°C
                      </p>
                    </div>

                    {/* Temp & Icon */}
                    <div className="flex items-center gap-3.5 bg-white/80 border border-[#EAE5DD] px-4 py-2.5 rounded-2xl shadow-2xs">
                      <span className="text-4xl sm:text-5xl select-none">
                        {weather?.current?.icon || "☀️"}
                      </span>
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-bold text-[#1A1918]">
                            {weather?.current?.temp ?? "--"}°
                          </span>
                          <span className="text-sm font-semibold text-[#8C8277]">C</span>
                        </div>
                        {weather?.current?.apparentTemp && (
                          <span className="text-[11px] font-medium text-[#8B6F47]">
                            Feels like {weather.current.apparentTemp}°C
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 Metrics Strip */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-[#EAE5DD]/70">
                    <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-[#EAE5DD] px-3 py-2">
                      <Droplets size={15} className="text-sky-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Humidity</div>
                        <div className="text-xs font-bold text-[#2E2E2E]">
                          {weather?.current?.humidity != null ? `${weather.current.humidity}%` : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-[#EAE5DD] px-3 py-2">
                      <Wind size={15} className="text-teal-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Wind Speed</div>
                        <div className="text-xs font-bold text-[#2E2E2E]">
                          {weather?.current?.windSpeed != null ? `${weather.current.windSpeed} km/h` : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-[#EAE5DD] px-3 py-2">
                      <span className="text-sm shrink-0">🌧️</span>
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">Rain Chance</div>
                        <div className="text-xs font-bold text-[#2E2E2E]">
                          {weather?.current?.precipitationProbability != null ? `${weather.current.precipitationProbability}%` : "0%"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-white/70 border border-[#EAE5DD] px-3 py-2">
                      <Thermometer size={15} className="text-amber-600 shrink-0" />
                      <div>
                        <div className="text-[10px] text-gray-400 font-medium">High / Low</div>
                        <div className="text-xs font-bold text-[#2E2E2E]">
                          {weather?.current?.tempMax}° / {weather?.current?.tempMin}°
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stylist Outfit Tip */}
                  {weather?.current?.stylingTip && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-white/95 border border-[#EAE5DD] p-3 text-xs sm:text-sm text-[#2E2E2E] shadow-2xs">
                      <span className="text-base text-[#8B6F47]">✨</span>
                      <div>
                        <span className="font-bold text-[#8B6F47]">
                          Stylist Advice:{" "}
                        </span>
                        <span className="text-gray-700 leading-relaxed">
                          {weather.current.stylingTip}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Switcher: Whole Day Breakdown vs 7-Day Forecast */}
                <div className="flex items-center justify-between border-b border-[#EAE5DD] pb-3">
                  <div className="flex items-center gap-2 bg-[#EBE6DE]/50 p-1 rounded-2xl border border-[#EAE5DD]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("whole_day")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "whole_day"
                          ? "bg-white text-[#1A1918] shadow-xs"
                          : "text-[#8C8277] hover:text-[#1A1918]"
                      }`}
                    >
                      <Clock size={14} />
                      <span>Whole Day Breakdown</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("7_day")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "7_day"
                          ? "bg-white text-[#1A1918] shadow-xs"
                          : "text-[#8C8277] hover:text-[#1A1918]"
                      }`}
                    >
                      <Calendar size={14} />
                      <span>7-Day Forecast</span>
                    </button>
                  </div>

                  <span className="text-xs text-[#8C8277] hidden sm:inline">
                    {activeTab === "whole_day"
                      ? "24-hour timeline & outfit phases"
                      : "Daily outlook for planning looks"}
                  </span>
                </div>

                {/* Tab 1: Whole Day Breakdown */}
                {activeTab === "whole_day" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {/* 24-Hour Hourly Timeline Carousel */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                          24-Hour Hourly Progression
                        </h4>
                        <span className="text-[11px] text-gray-400">
                          Scroll horizontally ➔
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                        {hourlyList.map((hour, idx) => (
                          <div
                            key={`${hour.time}-${idx}`}
                            className={`shrink-0 w-20 flex flex-col items-center justify-between rounded-2xl p-3 text-center border transition-all ${
                              idx === 0
                                ? "bg-[#8B6F47]/10 border-[#8B6F47]/40 shadow-xs"
                                : "bg-white border-[#EAE5DD] hover:border-[#8B6F47]/30"
                            }`}
                          >
                            <span className="text-[11px] font-bold text-[#2E2E2E]">
                              {hour.label}
                            </span>

                            <span className="text-2xl my-2 select-none">
                              {hour.icon}
                            </span>

                            <span className="text-xs font-extrabold text-[#1A1918]">
                              {hour.temp}°
                            </span>

                            {hour.apparentTemp && (
                              <span className="text-[10px] text-gray-400 font-medium">
                                ({hour.apparentTemp}°)
                              </span>
                            )}

                            {hour.precipitationProbability > 0 && (
                              <span className="mt-1 inline-flex items-center text-[10px] font-bold text-sky-600">
                                💧{hour.precipitationProbability}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4 Day Phase Styling Cards */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B6F47] mb-3">
                        Today's Outfit Phases
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {dayPhases.map((phase) => (
                          <div
                            key={phase.phase}
                            className="flex flex-col justify-between rounded-2xl border border-[#EAE5DD] bg-white p-4 shadow-2xs hover:shadow-xs transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-2xl select-none">{phase.icon}</span>
                                <div>
                                  <span className="text-xs font-bold text-[#1A1918]">
                                    {phase.phase}
                                  </span>
                                  <div className="text-[11px] text-gray-400">
                                    {phase.timeRange}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-base font-bold text-[#1A1918]">
                                  {phase.temp}°C
                                </span>
                                {phase.precipitationProbability > 0 && (
                                  <div className="text-[10px] font-semibold text-sky-600">
                                    💧 {phase.precipitationProbability}%
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Outfit Guidance */}
                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-start gap-2">
                              <span className="text-xs text-[#8B6F47]">✦</span>
                              <p className="text-xs text-gray-600 leading-relaxed font-normal">
                                {phase.stylingAdvice}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: 7-Day Forecast */}
                {activeTab === "7_day" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                        7-Day Travel & Styling Forecast
                      </h4>
                      <span className="text-xs text-gray-400">
                        Click "Style for this Day" to curate outfits
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                      {dailyList.map((day) => (
                        <div
                          key={day.date}
                          className="flex flex-col justify-between rounded-2xl border border-[#EAE5DD] bg-white p-3.5 shadow-2xs transition-all hover:border-[#8B6F47]/40 hover:shadow-sm"
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
                              <div className="text-3xl select-none">{day.icon}</div>
                              <div
                                className="mt-1 truncate text-xs font-medium text-gray-600"
                                title={day.condition}
                              >
                                {day.condition}
                              </div>
                            </div>

                            {/* Temp Range & Bar */}
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
                                      Math.max((day.tempMax / 42) * 100, 20),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Rain Indicator (Replaces crude summer/winter badge) */}
                            <div className="mt-2 text-center">
                              {day.precipitationProbability >= 35 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                                  💧 {day.precipitationProbability}% Rain
                                </span>
                              ) : day.precipitationProbability > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 border border-slate-200/80 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                  ⛅ {day.precipitationProbability}% Chance
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  ☀️ Dry & Fair
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Style for this Day Action */}
                          <button
                            type="button"
                            onClick={() => handleStyleForDay(day)}
                            className="mt-3.5 w-full rounded-xl bg-[#8B6F47] py-2 px-1 text-center text-[11px] font-bold text-white shadow-2xs transition hover:bg-[#725a39] active:scale-[0.98] cursor-pointer"
                          >
                            Style Look ✨
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default WeatherWidget;
