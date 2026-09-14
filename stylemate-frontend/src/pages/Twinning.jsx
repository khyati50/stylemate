import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Heart,
  Plus,
  LogIn,
  Trash2,
  LogOut,
} from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import OutfitCard from "../components/OutfitCard";
import Toast from "../components/Toast";

const OCCASIONS = [
  "Casual",
  "Party",
  "Formal",
  "Date",
  "College",
  "Wedding",
  "Festival",
];

const SEASONS = ["Summer", "Winter", "Monsoon", "Spring", "Autumn"];

function Twinning() {
  const navigate = useNavigate();

  // Screen management: 'start' (Screen 1), 'lobby' (Screen 2), 'results' (Screen 3)
  const [screen, setScreen] = useState("start");

  // Session state
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'initiator' | 'partner' | 'viewer'
  const [initiatorUsername, setInitiatorUsername] = useState("");
  const [partnerUsername, setPartnerUsername] = useState("");

  // Input states for Screen 1
  const [joinCode, setJoinCode] = useState("");
  const [mySessions, setMySessions] = useState([]);

  // Lobby controls for Screen 2
  const [selectedOccasion, setSelectedOccasion] = useState("Casual");
  const [selectedSeason, setSelectedSeason] = useState("Summer");

  // Results state for Screen 3
  const [pairs, setPairs] = useState([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  // Tracking adjustments to prevent poller from prematurely returning to results
  const isAdjustingRef = useRef(false);
  const adjustTimestampRef = useRef(0);

  // UI status
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null); // { message, variant }

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  const getAuthToken = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return null;
    }
    return token;
  }, [navigate]);

  // Fetch recent sessions
  const fetchMySessions = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/twinning/my-sessions", {
        headers: { authorization: token },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.sessions) {
        setMySessions(data.sessions);
      }
    } catch (err) {
      console.error("fetchMySessions error:", err);
    }
  }, [navigate]);

  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/twinning/my-sessions", {
      headers: { authorization: token },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.sessions) {
          setMySessions(data.sessions);
        }
      })
      .catch((err) => console.error("fetchMySessions error:", err));

    return () => {
      ignore = true;
    };
  }, []);

  // Reset to Screen 1
  const handleNewSession = useCallback(() => {
    isAdjustingRef.current = false;
    adjustTimestampRef.current = 0;
    setSession(null);
    setUserRole(null);
    setPairs([]);
    setCurrentPairIndex(0);
    setJoinCode("");
    setScreen("start");
    fetchMySessions();
  }, [fetchMySessions]);

  // Polling helper to refresh session state when in Lobby (Screen 2)
  const fetchSessionDetails = useCallback(
    async (code) => {
      const token = getAuthToken();
      if (!token || !code) return;

      try {
        const res = await fetch(`http://localhost:5000/api/twinning/${code}`, {
          headers: { authorization: token },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (res.status === 404) {
          showToast("The host has closed this twinning room.", "error");
          handleNewSession();
          return;
        }

        const data = await res.json();
        if (res.ok && data.session) {
          setSession(data.session);
          setUserRole(data.userRole);
          setInitiatorUsername(data.initiatorUsername || "Host");
          setPartnerUsername(data.partnerUsername || "");

          // Sync occasion & season if updated on backend and not actively adjusting locally
          if (data.session.occasion && !isAdjustingRef.current) {
            const occ =
              data.session.occasion.charAt(0).toUpperCase() +
              data.session.occasion.slice(1).toLowerCase();
            if (OCCASIONS.includes(occ)) {
              setSelectedOccasion(occ);
            }
          }
          if (data.session.season && !isAdjustingRef.current) {
            const sea =
              data.session.season.charAt(0).toUpperCase() +
              data.session.season.slice(1).toLowerCase();
            if (SEASONS.includes(sea)) {
              setSelectedSeason(sea);
            }
          }

          // Auto-advance if status transitioned to 'completed'
          // Only advance if completed AND either not adjusting or new generation completed after adjustment started
          const sessionUpdatedTime = data.session.updatedAt
            ? new Date(data.session.updatedAt).getTime()
            : 0;
          const isFreshGeneration =
            !isAdjustingRef.current ||
            sessionUpdatedTime > adjustTimestampRef.current;

          if (
            data.session.status === "completed" &&
            data.session.pairs &&
            data.session.pairs.length > 0 &&
            screen === "lobby" &&
            isFreshGeneration
          ) {
            isAdjustingRef.current = false;
            setPairs(data.session.pairs);
            setCurrentPairIndex(0);
            setScreen("results");
            showToast("Coordinated outfits are ready!");
          }
        }
      } catch (err) {
        console.error("fetchSessionDetails error:", err);
      }
    },
    [getAuthToken, handleNewSession, navigate, screen]
  );

  // Delete room (host) or leave room (partner)
  const handleDeleteSession = async (codeToDelete, e) => {
    if (e) e.stopPropagation();
    const token = getAuthToken();
    if (!token || !codeToDelete) return;

    let currentUserId = null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = payload.id;
    } catch (_) {}

    const targetSession =
      session?.sessionCode === codeToDelete
        ? session
        : mySessions.find((s) => s.sessionCode === codeToDelete);

    const isHost = targetSession
      ? targetSession.initiatorId === currentUserId ||
        (session?.sessionCode === codeToDelete && userRole === "initiator")
      : userRole === "initiator";

    const confirmMessage = isHost
      ? "Are you sure you want to delete this session?"
      : "Are you sure you want to leave this session?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/twinning/${codeToDelete}`,
        {
          method: "DELETE",
          headers: { authorization: token },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to delete session", "error");
        return;
      }

      showToast(data.message || "Session deleted successfully");
      if (session?.sessionCode === codeToDelete) {
        handleNewSession();
      }
      fetchMySessions();
    } catch (err) {
      console.error("handleDeleteSession error:", err);
      showToast("Failed to delete session", "error");
    }
  };

  // Set up 5-second polling interval in Screen 2 (Lobby)
  useEffect(() => {
    if (screen !== "lobby" || !session?.sessionCode) return;

    const interval = setInterval(() => {
      fetchSessionDetails(session.sessionCode);
    }, 5000);

    return () => clearInterval(interval);
  }, [screen, session?.sessionCode, fetchSessionDetails]);

  // Create a new session
  const handleCreateSession = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/twinning/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to create session", "error");
        return;
      }

      setSession(data.session);
      setUserRole("initiator");
      setInitiatorUsername("You");
      setPartnerUsername("");
      setScreen("lobby");
      showToast("Room code created! Share it with your partner.");
      fetchMySessions();
    } catch (err) {
      console.error(err);
      showToast("Network error creating session", "error");
    } finally {
      setLoading(false);
    }
  };

  // Join existing session with code
  const handleJoinSession = async (e) => {
    if (e) e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) {
      showToast("Please enter a valid 6-character room code", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/twinning/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({ sessionCode: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not join session", "error");
        return;
      }

      setSession(data.session);
      setUserRole("partner");
      await fetchSessionDetails(code);

      if (data.session.status === "completed" && data.session.pairs) {
        setPairs(data.session.pairs);
        setCurrentPairIndex(0);
        setScreen("results");
        showToast("Connected to session! Viewing results.");
      } else {
        setScreen("lobby");
        showToast("Connected! You joined the twinning room.");
      }
      fetchMySessions();
    } catch (err) {
      console.error(err);
      showToast("Network error joining session", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick jump into an existing session from history
  const handleOpenExistingSession = async (s) => {
    setLoading(true);
    try {
      await fetchSessionDetails(s.sessionCode);
      if (s.status === "completed" && s.pairs && s.pairs.length > 0) {
        setPairs(s.pairs);
        setCurrentPairIndex(0);
        setScreen("results");
      } else {
        setScreen("lobby");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to open session", "error");
    } finally {
      setLoading(false);
    }
  };

  // Adjust occasion or season from results screen
  const handleAdjustSettings = async () => {
    isAdjustingRef.current = true;
    adjustTimestampRef.current = Date.now();
    setScreen("lobby");

    if (session?.occasion) {
      const occ =
        session.occasion.charAt(0).toUpperCase() +
        session.occasion.slice(1).toLowerCase();
      if (OCCASIONS.includes(occ)) setSelectedOccasion(occ);
    }
    if (session?.season) {
      const sea =
        session.season.charAt(0).toUpperCase() +
        session.season.slice(1).toLowerCase();
      if (SEASONS.includes(sea)) setSelectedSeason(sea);
    }

    const token = getAuthToken();
    if (token && session?.sessionCode) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/twinning/${session.sessionCode}/settings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              authorization: token,
            },
            body: JSON.stringify({ resetStatus: true }),
          }
        );
        const data = await res.json();
        if (res.ok && data.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error("handleAdjustSettings error:", err);
      }
    }
  };

  const handleOccasionChange = async (e) => {
    const newOccasion = e.target.value;
    setSelectedOccasion(newOccasion);
    isAdjustingRef.current = true;
    adjustTimestampRef.current = Date.now();

    const token = getAuthToken();
    if (token && session?.sessionCode) {
      try {
        await fetch(
          `http://localhost:5000/api/twinning/${session.sessionCode}/settings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              authorization: token,
            },
            body: JSON.stringify({
              occasion: newOccasion.toLowerCase(),
              resetStatus: true,
            }),
          }
        );
      } catch (err) {
        console.error("Failed to sync occasion:", err);
      }
    }
  };

  const handleSeasonChange = async (e) => {
    const newSeason = e.target.value;
    setSelectedSeason(newSeason);
    isAdjustingRef.current = true;
    adjustTimestampRef.current = Date.now();

    const token = getAuthToken();
    if (token && session?.sessionCode) {
      try {
        await fetch(
          `http://localhost:5000/api/twinning/${session.sessionCode}/settings`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              authorization: token,
            },
            body: JSON.stringify({
              season: newSeason.toLowerCase(),
              resetStatus: true,
            }),
          }
        );
      } catch (err) {
        console.error("Failed to sync season:", err);
      }
    }
  };

  // Generate twinning looks
  const handleGenerate = async () => {
    const token = getAuthToken();
    if (!token || !session?.sessionCode) return;

    isAdjustingRef.current = false;
    setGenerating(true);
    try {
      const res = await fetch("http://localhost:5000/api/twinning/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          sessionCode: session.sessionCode,
          occasion: selectedOccasion.toLowerCase(),
          season: selectedSeason.toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Failed to generate outfits", "error");
        return;
      }

      setPairs(data.pairs || []);
      setCurrentPairIndex(0);
      setSession(data.session);
      setScreen("results");
      showToast("Coordinated outfits generated successfully!");
      fetchMySessions();
    } catch (err) {
      console.error(err);
      showToast("Error generating coordinated outfits", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast("Session code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Current active pair in Screen 3
  const currentPair = pairs[currentPairIndex] || null;

  // Perspective mapping:
  // If current user is initiator -> Left is initiator, Right is partner
  // If current user is partner -> Left is partner, Right is initiator
  const isInitiator = userRole === "initiator";
  const yourOutfit = currentPair
    ? isInitiator
      ? currentPair.outfit_a
      : currentPair.outfit_b
    : null;
  const partnerOutfit = currentPair
    ? isInitiator
      ? currentPair.outfit_b
      : currentPair.outfit_a
    : null;

  const yourName = isInitiator
    ? initiatorUsername || "You"
    : partnerUsername || "You";
  const theirName = isInitiator
    ? partnerUsername || "Partner"
    : initiatorUsername || "Host";

  const matchPercent = currentPair
    ? Math.min(100, Math.max(0, Math.round((currentPair.pair_score || 0.85) * 100)))
    : 90;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <AuthNavbar />

        {toast && (
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => setToast(null)}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 1: START OR JOIN                                       */}
        {/* ------------------------------------------------------------- */}
        {screen === "start" && (
          <div className="mx-auto max-w-5xl">
            {/* Header */}
            <div className="mb-10 text-center md:mb-14">
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#8B6F47]/20 bg-[#8B6F47]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#8B6F47]">
                <Heart size={14} className="fill-[#8B6F47]" />
                <span>Synchronized Style Engine</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E] md:text-5xl">
                Couple & Friend Twinning
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
                Coordinate and harmonize your looks with your partner or best friend.
                StyleMate aligns your individual wardrobes into perfectly synchronized ensembles.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {/* Card 1: Create Session */}
              <div className="flex flex-col justify-between rounded-3xl border border-[#EAE5DD] bg-white p-7 shadow-sm transition-all hover:shadow-md md:p-9">
                <div>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B6F47]/10 text-[#8B6F47]">
                    <Plus size={24} />
                  </div>
                  <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2E2E2E]">
                    Host a Room
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Generate a unique 6-character room code. Share it with your partner
                    so both of your wardrobes can be harmonized together.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleCreateSession}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8B6F47] px-6 py-4 font-medium text-white shadow-sm transition-all hover:bg-[#725a39] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Creating room...</span>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Create Twinning Room</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 2: Join Session */}
              <div className="flex flex-col justify-between rounded-3xl border border-[#EAE5DD] bg-white p-7 shadow-sm transition-all hover:shadow-md md:p-9">
                <div>
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B6F47]/10 text-[#8B6F47]">
                    <LogIn size={24} />
                  </div>
                  <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2E2E2E]">
                    Join a Room
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    Received a room code from your partner? Enter the 6-character code
                    below to link up and generate coordinated looks.
                  </p>

                  <form onSubmit={handleJoinSession} className="mt-6">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      6-Character Room Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="e.g. 7K9X2B"
                      className="w-full rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] px-4 py-3.5 text-center font-mono text-xl font-bold tracking-widest text-[#2E2E2E] uppercase placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#8B6F47] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8B6F47]"
                    />
                  </form>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleJoinSession}
                    disabled={loading || joinCode.trim().length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#8B6F47] bg-[#8B6F47] px-6 py-4 font-medium text-white shadow-sm transition-all hover:bg-[#725a39] active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[#8B6F47]"
                  >
                    {loading ? (
                      <span>Joining room...</span>
                    ) : (
                      <>
                        <ArrowRight size={18} />
                        <span>Join Room</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Past Sessions List */}
            {mySessions && mySessions.length > 0 && (
              <div className="mt-12 md:mt-16">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Your Previous Rooms
                  </h3>
                  <span className="text-xs text-gray-400">
                    {mySessions.length} total
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mySessions.slice(0, 6).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenExistingSession(s)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-[#EAE5DD] bg-white p-4 shadow-sm transition hover:border-[#8B6F47]/50 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold tracking-wider text-[#8B6F47]">
                            {s.sessionCode}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              s.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : s.status === "active"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {s.occasion ? `${s.occasion} · ` : ""}
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSession(s.sessionCode, e)}
                          className="rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete Session"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="rounded-xl p-2 text-gray-400 transition group-hover:bg-[#8B6F47]/10 group-hover:text-[#8B6F47]">
                          <ArrowRight size={16} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 2: LOBBY                                               */}
        {/* ------------------------------------------------------------- */}
        {screen === "lobby" && session && (
          <div className="mx-auto max-w-4xl">
            {/* Lobby Header */}
            <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-gray-200/60 pb-6 md:flex-row">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#8B6F47]">
                  Twinning Room
                </span>
                <h1 className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E] md:text-4xl">
                  Preparation Lobby
                </h1>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleNewSession}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Exit Room
                </button>
                <button
                  onClick={() => handleDeleteSession(session.sessionCode)}
                  className="flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  {userRole === "initiator" ? (
                    <>
                      <Trash2 size={14} />
                      <span>Delete Room</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={14} />
                      <span>Leave Lobby</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Room Code Showcase Box */}
            <div className="mb-8 rounded-3xl border border-[#8B6F47]/30 bg-gradient-to-br from-white to-[#FAF7F2] p-6 text-center shadow-sm md:p-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B6F47]">
                Share This Code With Your Partner
              </span>

              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="rounded-2xl border border-[#8B6F47]/20 bg-white px-6 py-3 font-mono text-3xl font-extrabold tracking-widest text-[#2E2E2E] shadow-inner md:text-4xl">
                  {session.sessionCode}
                </div>

                <button
                  onClick={() => handleCopyCode(session.sessionCode)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8B6F47] bg-[#8B6F47] text-white shadow-sm transition hover:bg-[#725a39] active:scale-95"
                  title="Copy Code"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                They can enter this code in the "Join a Room" card on their StyleMate app.
              </p>
            </div>

            {/* Connected Participants */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              {/* Initiator (Host) Card */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#EAE5DD] bg-white p-5 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B6F47]/10 font-['Playfair_Display'] text-xl font-bold text-[#8B6F47]">
                  {initiatorUsername ? initiatorUsername.charAt(0).toUpperCase() : "H"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-[#2E2E2E]">
                      {initiatorUsername || "Host"}
                    </h3>
                    {userRole === "initiator" && (
                      <span className="rounded-full bg-[#8B6F47]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B6F47]">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Host · Connected</span>
                  </div>
                </div>
              </div>

              {/* Partner Card */}
              <div className="flex items-center gap-4 rounded-2xl border border-[#EAE5DD] bg-white p-5 shadow-sm">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl font-['Playfair_Display'] text-xl font-bold ${
                    session.partnerId
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {session.partnerId
                    ? partnerUsername
                      ? partnerUsername.charAt(0).toUpperCase()
                      : "P"
                    : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-[#2E2E2E]">
                      {session.partnerId
                        ? partnerUsername || "Partner"
                        : "Awaiting Partner..."}
                    </h3>
                    {userRole === "partner" && (
                      <span className="rounded-full bg-[#8B6F47]/10 px-2 py-0.5 text-[10px] font-bold text-[#8B6F47]">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                    {session.partnerId ? (
                      <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Partner · Ready</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-amber-600">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        <span>Waiting for partner to join...</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Settings: Occasion & Season */}
            <div className="mb-8 rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-sm md:p-8">
              <h2 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E] mb-5">
                Outfit Occasion & Season
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Select Occasion
                  </label>
                  <select
                    value={selectedOccasion}
                    onChange={handleOccasionChange}
                    className="w-full rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] px-4 py-3.5 text-sm font-medium text-[#2E2E2E] focus:border-[#8B6F47] focus:bg-white focus:outline-none"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Select Season
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={handleSeasonChange}
                    className="w-full rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] px-4 py-3.5 text-sm font-medium text-[#2E2E2E] focus:border-[#8B6F47] focus:bg-white focus:outline-none"
                  >
                    {SEASONS.map((sea) => (
                      <option key={sea} value={sea}>
                        {sea}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
                <button
                  onClick={handleGenerate}
                  disabled={
                    generating ||
                    (session.status !== "active" && session.status !== "completed")
                  }
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#8B6F47] px-10 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#725a39] active:scale-[0.99] disabled:opacity-40 disabled:hover:bg-[#8B6F47]"
                >
                  {generating ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Synthesizing Harmonized Looks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Generate Coordinated Outfits</span>
                    </>
                  )}
                </button>

                {session.status === "waiting" && (
                  <p className="mt-3 text-xs text-amber-600 font-medium">
                    Waiting for your partner to join before looks can be generated.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SCREEN 3: SIDE-BY-SIDE RESULT SHOWCASE                        */}
        {/* ------------------------------------------------------------- */}
        {screen === "results" && currentPair && (
          <div>
            {/* Top Toolbar */}
            <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-gray-200/60 pb-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#8B6F47]">
                    Twinning Result
                  </span>
                  <span className="rounded-full bg-[#8B6F47]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#8B6F47]">
                    Room: {session?.sessionCode}
                  </span>
                </div>
                <h1 className="mt-1 font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E] md:text-4xl">
                  Coordinated Look Showcase
                </h1>
              </div>

              {/* Pair Switcher Dots */}
              {pairs.length > 1 && (
                <div className="flex items-center gap-4 rounded-2xl border border-[#EAE5DD] bg-white px-4 py-2.5 shadow-sm">
                  <span className="text-xs font-semibold text-gray-500">
                    Pair {currentPairIndex + 1} of {pairs.length}
                  </span>
                  <div className="flex gap-1.5">
                    {pairs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPairIndex(idx)}
                        className={`h-2.5 rounded-full transition-all ${
                          idx === currentPairIndex
                            ? "w-6 bg-[#8B6F47]"
                            : "w-2.5 bg-gray-300 hover:bg-gray-400"
                        }`}
                        title={`View Pair ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Side-by-Side Outfits: Desktop 2 Columns, Mobile Stacked */}
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Column 1: Your Outfit */}
              <div className="flex flex-col rounded-3xl border border-[#EAE5DD] bg-white p-5 md:p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B6F47]">
                      Your Look
                    </span>
                    <h2 className="font-['Playfair_Display'] text-xl md:text-2xl font-bold text-[#2E2E2E]">
                      {yourName}
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#8B6F47]/10 px-3 py-1 text-xs font-bold text-[#8B6F47]">
                    You
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {yourOutfit?.fullBody ? (
                    <div className="col-span-2">
                      <OutfitCard title="Full Body" item={yourOutfit.fullBody} />
                    </div>
                  ) : (
                    <>
                      {yourOutfit?.top && (
                        <OutfitCard title="Top" item={yourOutfit.top} />
                      )}
                      {yourOutfit?.bottom && (
                        <OutfitCard title="Bottom" item={yourOutfit.bottom} />
                      )}
                    </>
                  )}
                  {yourOutfit?.footwear && (
                    <OutfitCard title="Footwear" item={yourOutfit.footwear} />
                  )}
                  {yourOutfit?.outerwear && (
                    <OutfitCard title="Outerwear" item={yourOutfit.outerwear} />
                  )}
                  {yourOutfit?.accessory && (
                    <OutfitCard title="Accessory" item={yourOutfit.accessory} />
                  )}
                </div>
              </div>

              {/* Column 2: Partner's Outfit */}
              <div className="flex flex-col rounded-3xl border border-[#EAE5DD] bg-white p-5 md:p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      Partner's Look
                    </span>
                    <h2 className="font-['Playfair_Display'] text-xl md:text-2xl font-bold text-[#2E2E2E]">
                      {theirName}
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                    Partner
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {partnerOutfit?.fullBody ? (
                    <div className="col-span-2">
                      <OutfitCard title="Full Body" item={partnerOutfit.fullBody} />
                    </div>
                  ) : (
                    <>
                      {partnerOutfit?.top && (
                        <OutfitCard title="Top" item={partnerOutfit.top} />
                      )}
                      {partnerOutfit?.bottom && (
                        <OutfitCard title="Bottom" item={partnerOutfit.bottom} />
                      )}
                    </>
                  )}
                  {partnerOutfit?.footwear && (
                    <OutfitCard title="Footwear" item={partnerOutfit.footwear} />
                  )}
                  {partnerOutfit?.outerwear && (
                    <OutfitCard title="Outerwear" item={partnerOutfit.outerwear} />
                  )}
                  {partnerOutfit?.accessory && (
                    <OutfitCard title="Accessory" item={partnerOutfit.accessory} />
                  )}
                </div>
              </div>
            </div>

            {/* Coordination Card Below */}
            <div className="mt-8 rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-100 pb-5 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B6F47]/10 text-[#8B6F47]">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B6F47]">
                      AI Harmony Analysis
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                      Pair Coordination Insights
                    </h3>
                  </div>
                </div>

                {/* Match Score Badge */}
                <div className="flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-5 py-2.5 text-white shadow-sm">
                  <Heart size={16} className="fill-white" />
                  <span className="text-base font-extrabold tracking-wide">
                    {matchPercent}% Match
                  </span>
                </div>
              </div>

              {/* Coordination Reason */}
              <div className="mt-5 rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] p-4 md:p-5">
                <p className="text-sm font-medium leading-relaxed text-[#2E2E2E] md:text-base">
                  {currentPair.coordination_reason ||
                    "Both outfits are balanced in style and tonal harmony for this event."}
                </p>

                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-[#EAE5DD]">
                  {currentPair.style_a && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs">
                      Style: {currentPair.style_a}
                      {currentPair.style_b && currentPair.style_b !== currentPair.style_a
                        ? ` & ${currentPair.style_b}`
                        : ""}
                    </span>
                  )}
                  {currentPair.color_descriptor && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs capitalize">
                      Palette: {currentPair.color_descriptor}
                    </span>
                  )}
                  {session.occasion && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs capitalize">
                      Occasion: {session.occasion}
                    </span>
                  )}
                  {session.season && (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-2xs capitalize">
                      Season: {session.season}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {pairs.length > 1 && (
                  <button
                    onClick={() =>
                      setCurrentPairIndex((prev) => (prev + 1) % pairs.length)
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#8B6F47] bg-white px-6 py-3.5 text-sm font-semibold text-[#8B6F47] shadow-sm transition hover:bg-[#8B6F47] hover:text-white"
                  >
                    <RefreshCw size={16} />
                    <span>Try Another Pair</span>
                    <span className="rounded-full bg-[#8B6F47]/10 px-2 py-0.5 text-xs">
                      {currentPairIndex + 1}/{pairs.length}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleAdjustSettings}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  <span>Adjust Occasion / Season</span>
                </button>

                <button
                  onClick={handleNewSession}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#725a39]"
                >
                  <Plus size={16} />
                  <span>New Twinning Session</span>
                </button>

                <button
                  onClick={() => handleDeleteSession(session?.sessionCode)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
                >
                  {isInitiator ? (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Room</span>
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      <span>Leave Room</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Twinning;
