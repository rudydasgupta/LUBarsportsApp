"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "r.dasgupta@lancaster.ac.uk";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for admin_session cookie
    if (typeof document !== 'undefined') {
      setIsAdmin(document.cookie.includes('admin_session='));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Admin login logic
    if (email === ADMIN_EMAIL) {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      setLoading(false);
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        setError(data.error || "Login failed");
      }
      return;
    }
    // Admin login logic
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      // Check if this is the super admin
      if (email === ADMIN_EMAIL) {
        router.push("/admin");
      } else {
        router.push("/results-input");
      }
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleSubmit} className="bg-white/90 rounded-xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold mb-2 text-center">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          required
        />
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <button
          type="submit"
          className="bg-[color:var(--lu-red)] text-white font-semibold rounded px-4 py-2 mt-2 hover:bg-red-800 transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {isAdmin && (
        <div className="mt-4 text-center">
          <a href="/admin" className="text-[color:var(--lu-red)] underline font-semibold">Go to Admin Area</a>
        </div>
      )}
    </main>
  );
} 