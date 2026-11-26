
"use client";

import { FormEvent, useState } from "react";
import { Video, LockKeyhole, Mail } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Video size={24} />
          </div>
          <h1>ZoomHub <span>60</span></h1>
          <p>ACCOUNT CONTROL CENTER</p>
        </div>

        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to access your administrator workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email address
            <div className="login-input-wrap">
              <Mail size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                maxLength={254}
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="login-input-wrap">
              <LockKeyhole size={17} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </div>
          </label>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-footer">
          <LockKeyhole size={13} />
          Secure administrator access
        </div>
      </section>
    </main>
  );
}
