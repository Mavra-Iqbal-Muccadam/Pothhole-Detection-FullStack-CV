"use client";
import { useEffect } from "react";

type ToastProps = {
  type: "success" | "error";
  message: string;
  onClose: () => void;
  duration?: number; // ms
};

export default function Toast({ type, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const base = "fixed right-4 bottom-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3";
  const styles =
    type === "success"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white";

  return (
    <div className={`${base} ${styles}`} role="status" aria-live="polite">
      <span className="inline-block w-2 h-2 rounded-full bg-white/90" />
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white focus:outline-none"
        aria-label="Close toast"
      >
        ×
      </button>
    </div>
  );
}
