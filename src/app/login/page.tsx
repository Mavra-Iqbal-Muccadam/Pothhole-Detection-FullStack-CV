"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CAD593] via-white to-[#A1C349] flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left illustration / branding panel */}
        <div className="hidden md:flex flex-col justify-between bg-[#2A3C24] text-white p-8 relative">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Road Health Portal</h1>
            <p className="mt-3 text-sm text-gray-100/80 max-w-xs">
              AI-powered detection of potholes and cracks to help authorities keep roads safe and citizens informed.
            </p>
          </div>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#A1C349] text-[#2A3C24] font-semibold">1</span>
              <div>
                <p className="font-semibold">Capture or upload road media</p>
                <p className="text-gray-100/70">Images and videos of road conditions.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#A1C349] text-[#2A3C24] font-semibold">2</span>
              <div>
                <p className="font-semibold">Automatic crack & pothole detection</p>
                <p className="text-gray-100/70">AI highlights damaged segments instantly.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#A1C349] text-[#2A3C24] font-semibold">3</span>
              <div>
                <p className="font-semibold">Prioritize maintenance</p>
                <p className="text-gray-100/70">Government dashboard for actionable insights.</p>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 bg-[radial-gradient(circle_at_top,_#A1C349,_transparent_60%)]" />
        </div>

        {/* Right auth form panel */}
        <div className="p-8 bg-white">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-2xl font-semibold text-[#2A3C24]">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {activeTab === "login"
                ? "Sign in to submit or manage road issue reports."
                : "Sign up to start reporting and monitoring road health."}
            </p>
          </div>

          <div className="flex mb-6 rounded-full bg-[#CAD593]/40 p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`w-1/2 py-2 text-center text-sm font-semibold rounded-full transition ${
                activeTab === "login"
                  ? "bg-[#2A3C24] text-white shadow-sm"
                  : "text-[#2A3C24]/70 hover:bg-[#CAD593]/60"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setActiveTab("signup")}
              className={`w-1/2 py-2 text-center text-sm font-semibold rounded-full transition ${
                activeTab === "signup"
                  ? "bg-[#2A3C24] text-white shadow-sm"
                  : "text-[#2A3C24]/70 hover:bg-[#CAD593]/60"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* LOGIN FORM */}
          {activeTab === "login" && <LoginForm />}

          {/* SIGNUP FORM */}
          {activeTab === "signup" && <SignupForm />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------ */
/* LOGIN FORM COMPONENT */
/* ------------------------------------------------ */
function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          ...form,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        console.log("Login response:", data);
        const user = data?.data;

        if (typeof window !== "undefined" && user) {
          try {
            localStorage.setItem("currentUser", JSON.stringify(user));
          } catch (e) {
            console.error("Failed to persist currentUser", e);
          }
        }

        setToast({ type: "success", message: "Login successful. Redirecting..." });
        const role = user?.role;
        if (role === "government") {
          router.push("/government-dashboard");
        } else {
          router.push("/user-dashboard");
        }
      } else {
        console.error("Login error:", data);
        setToast({ type: "error", message: data?.error || "Login failed" });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setToast({ type: "error", message: "Unexpected error during login" });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-[#CAD593] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A1C349] text-black"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-[#CAD593] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A1C349] text-black"
      />

      <button
        type="submit"
        className={`w-full bg-[#2A3C24] text-white py-2 rounded-lg font-semibold transition ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1e2a1a]"
        }`}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

    </form>
  );
}

/* ------------------------------------------------ */
/* SIGNUP FORM COMPONENT */
/* ------------------------------------------------ */
function SignupForm() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "signup",
          ...form,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        console.log("Signup response:", data);
        setToast({ type: "success", message: "Signup successful" });
      } else {
        console.error("Signup error:", data);
        setToast({ type: "error", message: data?.error || "Signup failed" });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setToast({ type: "error", message: "Unexpected error during signup" });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* FULL NAME FIELD (Signup Only) */}
      <input
        type="text"
        name="full_name"
        placeholder="Full Name"
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-[#CAD593] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A1C349] text-black"
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-[#CAD593] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A1C349] text-black"
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        onChange={handleChange}
        disabled={loading}
        className="w-full border border-[#CAD593] rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#A1C349] text-black"
      />

      <button
        type="submit"
        className={`w-full bg-[#2A3C24] text-white py-2 rounded-lg font-semibold transition ${
          loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1e2a1a]"
        }`}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
