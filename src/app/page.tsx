"use client";

import { useState } from "react";
import { verifyPassword } from "./actions";

export default function Home() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login() {
    if (!password.trim()) return;
    setIsLoading(true);
    setError("");

    try {
      // 1. The server securely verifies and attaches the unhackable cookie
      const result = await verifyPassword(password);

      if (result && result.success) {
        // THE FIX: We put the old dummy key back so your frontend stops kicking you out
        localStorage.setItem("gallery-auth", "true");
        
        // Navigate to the gallery
        window.location.href = "/albums";
      } else {
        setError("Incorrect password");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Connection error. Try again.");
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="bg-circle bg1"></div>
      <div className="bg-circle bg2"></div>
      <div className="bg-circle bg3"></div>

      <div className="glass-card">
        <div className="logo">
          <div className="logo-ring"></div>
          <div className="logo-dot"></div>
        </div>

        <h1>Private Gallery</h1>
        <p>Secure access to your private photo collection.</p>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                login();
              }
            }}
            disabled={isLoading}
          />

          {error && <span className="error">{error}</span>}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Enter Gallery"}
          </button>
        </div>
      </div>
    </main>
  );
}