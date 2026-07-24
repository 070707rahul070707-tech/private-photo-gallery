"use client";

import { useState } from "react";

export default function Home() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const correctPassword = "smithaslut"; // <-- Change your password here

  function login() {
    if (password.trim() === correctPassword) {
      localStorage.setItem("gallery-auth", "true");
      
      // THE FIX: Natively force the mobile browser to load the next URL
      window.location.href = "/albums";
    } else {
      setError("Incorrect password");
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

        <p>
          Secure access to your private photo collection.
        </p>

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
          />

          {error && <span className="error">{error}</span>}

          <button 
            type="button" 
            onClick={(e) => { 
              e.preventDefault(); 
              login(); 
            }}
          >
            Enter Gallery
          </button>
        </div>

      </div>

    </main>
  );
}