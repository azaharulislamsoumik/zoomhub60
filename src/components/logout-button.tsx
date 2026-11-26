"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      window.location.assign("/login");
    } catch {
      setError("Unable to logout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="logout-button"
      >
        <LogOut size={16} />
        {loading ? "Signing out..." : "Logout"}
      </button>

      {error && <p role="alert">{error}</p>}
    </div>
  );
}