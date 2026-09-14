import { useEffect } from "react";

/**
 * Toast notification component.
 * @param {string} message - Text to display
 * @param {'success'|'error'} variant - Controls background color
 * @param {Function} onClose - Called when toast dismisses (auto or manual)
 */
function Toast({ message, variant = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    variant === "error" ? "bg-red-600" : "bg-[#8B6F47]";

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 ${bgColor} rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg`}
    >
      {message}
    </div>
  );
}

export default Toast;
