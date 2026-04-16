import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (username === "admin" && password === "admin@123") {
      localStorage.setItem("isAdmin", "true");
      navigate({ to: "/admin/dashboard" });
    } else {
      setError("Invalid username or password.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💊</div>
          <h1 className="text-xl font-bold text-gray-900">Lifecare Medical</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Panel Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              data-ocid="admin.input"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F66]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              data-ocid="admin.input"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F66]"
            />
          </div>

          {error && (
            <p
              data-ocid="admin.error_state"
              className="text-red-500 text-sm text-center"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            data-ocid="admin.submit_button"
            className="w-full bg-[#2F8F66] text-white py-3 rounded-xl font-semibold hover:bg-[#27795a] transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-[#2F8F66] hover:underline">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
