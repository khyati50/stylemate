import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Sparkles,
  RefreshCw,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import OutfitCard from "../components/OutfitCard";
import Toast from "../components/Toast";

const STARTER_PROMPTS = [
  "What should I wear to college tomorrow?",
  "Can I wear sneakers with chinos?",
  "Give me a party outfit for tonight.",
  "Does navy go with black?",
];

function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, variant }

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  const handleClearChat = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:5000/api/chat/clear", {
          method: "DELETE",
          headers: {
            authorization: token,
          },
        });
      }
    } catch (err) {
      console.error("Failed to clear chat on backend:", err);
    } finally {
      setMessages([]);
      setInputMessage("");
      showToast("Conversation cleared");
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (
      typeof textToSend === "string" ? textToSend : inputMessage
    ).trim();

    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/chat/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({ message: query }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        const assistantMsg = {
          id: Date.now() + 1,
          logId: data.logId || null,
          userFeedback: null,
          sender: "assistant",
          text: data.response_text,
          outfit: data.outfit,
          allOutfits: data.all_outfits || (data.outfit ? [data.outfit] : []),
          currentOutfitIndex: 0,
          parsedContext: data.parsed_context,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg = {
          id: Date.now() + 1,
          sender: "assistant",
          text:
            data.message ||
            "I couldn't find a matching outfit. Try adding more clothes to your wardrobe, or give me more context.",
          error: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Something went wrong while connecting to the assistant. Please try again.",
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleNextOutfit = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (
          msg.id !== messageId ||
          !msg.allOutfits ||
          msg.allOutfits.length <= 1
        ) {
          return msg;
        }
        const nextIndex =
          ((msg.currentOutfitIndex || 0) + 1) % msg.allOutfits.length;
        return {
          ...msg,
          currentOutfitIndex: nextIndex,
          outfit: msg.allOutfits[nextIndex],
        };
      })
    );
  };

  const handleFeedback = async (logId, messageId, feedbackType) => {
    if (!logId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/chat/feedback/${logId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
          body: JSON.stringify({ feedback: feedbackType }),
        }
      );

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, userFeedback: feedbackType } : msg
          )
        );
        showToast(
          feedbackType === "liked"
            ? "Thanks for your feedback! 👍"
            : "Feedback noted 👎"
        );
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleWearOutfit = async (outfit, occasion, logId, messageId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          outfit,
          occasion: occasion || "casual",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showToast("Outfit saved to history!");

        if (logId) {
          try {
            await fetch(`http://localhost:5000/api/chat/feedback/${logId}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                authorization: token,
              },
              body: JSON.stringify({ feedback: "worn" }),
            });
            if (messageId) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === messageId ? { ...msg, userFeedback: "worn" } : msg
                )
              );
            }
          } catch (fbErr) {
            console.error("Failed to submit worn feedback:", fbErr);
          }
        }
      } else {
        showToast(data.message || "Failed to save outfit to history.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E] flex flex-col">
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 flex flex-col">
        <AuthNavbar />

        {/* Standardized Editorial Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <Sparkles size={12} />
                <span>✦ AI Fashion Assistant</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                Ask StyleMate
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Tell StyleMate about your day, the weather, or an event, and get an outfit curated from your wardrobe.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleClearChat}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#EAE5DD] bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-2xs hover:border-[#8B6F47] hover:text-[#8B6F47] hover:bg-[#FAF7F2] transition-all cursor-pointer"
                title="Start a new conversation"
              >
                <RotateCcw size={13} />
                <span>New Conversation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 md:space-y-6 pb-6 px-1">
          {messages.length === 0 ? (
            <div className="my-auto py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#EAE5DD] text-2xl">
                ✨
              </div>
              <h3 className="font-['Playfair_Display'] text-xl md:text-2xl font-bold text-[#2E2E2E]">
                What are you getting dressed for?
              </h3>
              <p className="mt-1 text-xs md:text-sm text-gray-500 max-w-md mx-auto">
                Ask a styling question or click one of the ideas below to start:
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded-2xl border border-[#EAE5DD] bg-white px-4 py-2.5 text-xs md:text-sm text-[#2E2E2E] shadow-sm hover:border-[#8B6F47] hover:text-[#8B6F47] hover:bg-[#FAF7F2] transition-all cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-lg rounded-2xl rounded-tr-xs bg-[#8B6F47] px-4 py-3 text-white text-xs sm:text-sm shadow-sm leading-relaxed">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={msg.id} className="flex justify-start">
                  <div
                    className={`${
                      msg.outfit ? "max-w-3xl" : "max-w-2xl"
                    } w-full rounded-2xl rounded-tl-xs border p-4 md:p-6 shadow-sm ${
                      msg.error
                        ? "border-red-200 bg-red-50/50"
                        : "border-[#EAE5DD] bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 text-[#8B6F47] text-xs font-semibold uppercase tracking-wider">
                      <Sparkles size={14} />
                      <span>StyleMate</span>

                      {!msg.error && !msg.outfit && (
                        <span className="rounded-full bg-[#8B6F47]/10 border border-[#8B6F47]/20 px-2.5 py-0.5 text-[10px] font-medium text-[#8B6F47] normal-case tracking-normal">
                          {msg.parsedContext?.intent === "clarification_needed"
                            ? "Tip"
                            : msg.parsedContext?.intent === "chit_chat"
                            ? "Chat"
                            : "Stylist Advice"}
                        </span>
                      )}

                      {msg.outfit && msg.parsedContext?.occasion && (
                        <span className="rounded-full bg-[#FAF7F2] border border-[#8B6F47]/20 px-2 py-0.5 text-[10px] text-[#8B6F47] normal-case tracking-normal">
                          {msg.parsedContext.occasion}
                        </span>
                      )}

                      {msg.outfit && msg.parsedContext?.season && (
                        <span className="rounded-full bg-[#FAF7F2] border border-[#8B6F47]/20 px-2 py-0.5 text-[10px] text-[#8B6F47] normal-case tracking-normal">
                          {msg.parsedContext.season}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs sm:text-sm md:text-base leading-relaxed ${
                        msg.error ? "text-red-700" : "text-[#2E2E2E]"
                      }`}
                    >
                      {msg.text}
                    </p>

                    {msg.outfit && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        {/* Grid of Outfit Slots */}
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                          {msg.outfit.fullBody ? (
                            <OutfitCard
                              title="Full Body"
                              item={msg.outfit.fullBody}
                            />
                          ) : (
                            <>
                              <OutfitCard
                                title="Top"
                                item={msg.outfit.top}
                              />
                              <OutfitCard
                                title="Bottom"
                                item={msg.outfit.bottom}
                              />
                            </>
                          )}
                          <OutfitCard
                            title="Footwear"
                            item={msg.outfit.footwear}
                          />
                          {msg.outfit.outerwear && (
                            <OutfitCard
                              title="Outerwear"
                              item={msg.outfit.outerwear}
                            />
                          )}
                          {msg.outfit.accessory && (
                            <OutfitCard
                              title="Accessory"
                              item={msg.outfit.accessory}
                            />
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() =>
                              handleWearOutfit(
                                msg.outfit,
                                msg.parsedContext?.occasion,
                                msg.logId,
                                msg.id
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#8B6F47] px-4 py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm transition-all hover:bg-[#725a39] active:scale-[0.98] cursor-pointer"
                          >
                            <Check size={15} />
                            <span>Wear This Outfit</span>
                          </button>

                          {msg.allOutfits && msg.allOutfits.length > 1 && (
                            <button
                              onClick={() => handleNextOutfit(msg.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-[#8B6F47] bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-[#8B6F47] shadow-sm transition-all hover:bg-[#8B6F47] hover:text-white active:scale-[0.98] cursor-pointer"
                            >
                              <RefreshCw size={14} />
                              <span>
                                Try Another Look (
                                {(msg.currentOutfitIndex || 0) + 1} of{" "}
                                {msg.allOutfits.length})
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Feedback controls bar for assistant messages */}
                    {!msg.error && msg.logId && (
                      <div className="mt-3.5 pt-2 flex items-center justify-end border-t border-gray-100/80">
                        <div className="inline-flex items-center gap-1.5">
                          {msg.userFeedback === "worn" && (
                            <span className="text-[11px] font-medium text-[#8B6F47] bg-[#FAF7F2] border border-[#8B6F47]/20 px-2 py-0.5 rounded-full mr-1">
                              Worn ✨
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400 mr-1 select-none">
                            Helpful?
                          </span>
                          <button
                            onClick={() =>
                              handleFeedback(msg.logId, msg.id, "liked")
                            }
                            type="button"
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              msg.userFeedback === "liked"
                                ? "bg-emerald-50 border-emerald-400 text-emerald-600 shadow-xs"
                                : "bg-white border-[#EAE5DD] text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50"
                            }`}
                            title="Helpful recommendation (thumbs up)"
                          >
                            <ThumbsUp
                              size={13}
                              className={
                                msg.userFeedback === "liked"
                                  ? "fill-emerald-600 text-emerald-600"
                                  : ""
                              }
                            />
                          </button>
                          <button
                            onClick={() =>
                              handleFeedback(msg.logId, msg.id, "disliked")
                            }
                            type="button"
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                              msg.userFeedback === "disliked"
                                ? "bg-rose-50 border-rose-400 text-rose-600 shadow-xs"
                                : "bg-white border-[#EAE5DD] text-gray-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
                            }`}
                            title="Not helpful (thumbs down)"
                          >
                            <ThumbsDown
                              size={13}
                              className={
                                msg.userFeedback === "disliked"
                                  ? "fill-rose-600 text-rose-600"
                                  : ""
                              }
                            />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-xs border border-[#EAE5DD] bg-white px-5 py-4 shadow-sm flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  StyleMate is styling
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8B6F47] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8B6F47] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8B6F47] animate-bounce"></span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mt-2 sticky bottom-4 z-20"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-[#EAE5DD] bg-white p-2 shadow-lg">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask StyleMate anything (e.g. 'What should I wear to a dinner party tonight?')..."
              disabled={loading}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#2E2E2E] outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="rounded-xl bg-[#8B6F47] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#725a39] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={15} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Chat;
