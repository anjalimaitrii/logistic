"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clientService } from "@/services/clientService";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"ID" | "PASSWORD">("ID");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempUserId, setTempUserId] = useState("");

  const handleNext = () => {
    if (!identifier) {
      setError("Please enter your email or phone number.");
      return;
    }
    setError("");
    setStep("PASSWORD");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await clientService.login({ identifier, password });

      if (response.client.mustChangePassword) {
        setTempUserId(response.client._id);
        setMustChangePassword(true);
        setIsLoading(false);
        return;
      }

      // Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.client));

      // Redirect to the Client Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await clientService.updatePassword(tempUserId, newPassword);
      alert("Password changed successfully! Please login with your new password.");
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ft-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          background: #EEF0F4;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .ft-root::before {
          content: '';
          position: fixed; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 70% 55% at 65% 50%, rgba(27,35,64,0.06) 0%, transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(27,35,64,0.035) 39px, rgba(27,35,64,0.035) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(27,35,64,0.035) 39px, rgba(27,35,64,0.035) 40px);
        }

        /* ─── SHELL (desktop two-column) ─── */
        .ft-shell {
          position: relative; z-index: 1;
          display: flex;
          width: 900px;
          min-height: 560px;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(27,35,64,0.16), 0 8px 24px rgba(27,35,64,0.08);
          animation: slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── LEFT PANEL ─── */
        .ft-left {
          width: 42%; flex-shrink: 0;
          background: #1B2340;
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .ft-left::before {
          content: ''; position: absolute;
          bottom: -80px; right: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(232,93,32,0.15) 0%, transparent 70%);
        }

        .ft-left::after {
          content: ''; position: absolute;
          top: -50px; left: -50px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
        }

        /* Brand */
        .ft-brand { display: flex; align-items: center; gap: 12px; z-index: 1; }

        .ft-brand-icon {
          width: 42px; height: 42px; background: #E85D20;
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }

        .ft-brand-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px; font-weight: 800; color: #fff;
          letter-spacing: 0.5px; line-height: 1;
        }

        .ft-brand-sub {
          font-size: 10px; color: rgba(255,255,255,0.38);
          letter-spacing: 2px; text-transform: uppercase;
          margin-top: 3px; font-weight: 400;
        }

        /* Middle copy */
        .ft-mid { z-index: 1; }

        .ft-mid h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 36px; font-weight: 700; color: #fff;
          line-height: 1.15; margin-bottom: 12px;
        }

        .ft-mid h2 em { color: #E85D20; font-style: normal; }

        .ft-mid p {
          font-size: 13.5px; color: rgba(255,255,255,0.42);
          line-height: 1.7; max-width: 230px; font-weight: 400;
        }

        /* Road SVG */
        .ft-road { margin-top: 22px; overflow: hidden; }
        .ft-road svg { width: 100%; }

        @keyframes drive {
          from { transform: translateX(-130px); }
          to   { transform: translateX(330px); }
        }
        .truck { animation: drive 4s linear infinite; }

        /* Stat chips */
        .ft-chips { display: flex; gap: 8px; z-index: 1; }

        .ft-chip {
          flex: 1; background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 12px;
        }

        .ft-chip-val {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 20px; font-weight: 700; color: #fff; line-height: 1;
        }

        .ft-chip-val b { color: #E85D20; }
        .ft-chip-lbl { font-size: 11px; color: rgba(255,255,255,0.32); margin-top: 3px; font-weight: 400; }

        /* ─── RIGHT PANEL ─── */
        .ft-right {
          flex: 1; background: #fff;
          position: relative; overflow: hidden;
        }

        /* Step containers */
        .ft-step {
          position: absolute; inset: 0;
          padding: 52px 48px;
          display: flex; flex-direction: column; justify-content: center;
          transition: opacity 0.38s ease, transform 0.38s ease;
        }

        .ft-step.active    { opacity: 1; transform: translateX(0);     pointer-events: all; }
        .ft-step.exit-left { opacity: 0; transform: translateX(-36px);  pointer-events: none; }
        .ft-step.exit-right{ opacity: 0; transform: translateX(36px);   pointer-events: none; }

        /* Step headings */
        .ft-step h3 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 30px; font-weight: 700; color: #1B2340; margin-bottom: 6px;
        }

        .ft-subtitle { font-size: 14px; color: #9AA3B2; font-weight: 400; margin-bottom: 32px; }

        /* Field label */
        .ft-lbl {
          display: block; font-size: 12px; font-weight: 600;
          color: #4A5568; margin-bottom: 8px; letter-spacing: 0.2px;
        }

        /* Phone field */
        .ft-phone-box {
          display: flex; align-items: stretch;
          background: #F4F6FB; border: 1.5px solid #DDE1EB;
          border-radius: 12px; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          margin-bottom: 22px;
        }

        .ft-phone-box:focus-within {
          border-color: #E85D20; background: #fff;
          box-shadow: 0 0 0 3px rgba(232,93,32,0.09);
        }

        .ft-flag {
          display: flex; align-items: center; gap: 7px;
          padding: 0 14px; border-right: 1.5px solid #DDE1EB;
          flex-shrink: 0; background: rgba(244,246,251,0.5);
        }

        .ft-flag .emoji { font-size: 20px; }
        .ft-flag .code  { font-size: 13px; font-weight: 600; color: #2C3A5E; }

        .ft-phone-box input {
          flex: 1; padding: 14px 16px;
          font-size: 15px; font-weight: 500; color: #1B2340;
          background: transparent; border: none; outline: none;
          letter-spacing: 0.5px;
        }

        .ft-phone-box input::placeholder { color: #C2C9D6; font-weight: 400; }

        /* Buttons */
        .ft-btn {
          width: 100%; border: none; border-radius: 12px;
          padding: 14px 20px; cursor: pointer;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 17px; font-weight: 700; letter-spacing: 0.8px;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: background 0.22s, box-shadow 0.22s, transform 0.15s;
        }

        .ft-btn svg { width: 17px; height: 17px; transition: transform 0.2s; }
        .ft-btn:hover svg { transform: translateX(3px); }
        .ft-btn:active { transform: translateY(1px); }

        .ft-btn-dark {
          background: #1B2340; color: #fff;
          fill: white;
        }

        .ft-btn-dark:hover {
          background: #E85D20;
          box-shadow: 0 8px 22px rgba(232,93,32,0.28);
          transform: translateY(-1px);
        }

        .ft-btn-outline {
          background: #F4F6FB; color: #1B2340;
          border: 1.5px solid #DDE1EB; fill: #1B2340;
          margin-top: 10px;
        }

        .ft-btn-outline:hover {
          background: #EBEDF5; border-color: #C5CAD8;
          transform: translateY(-1px);
        }

        /* Alt link */
        .ft-alt {
          text-align: center; margin-top: 22px;
          font-size: 13px; color: #A8B0BF; font-weight: 400;
        }

        .ft-alt a { color: #E85D20; font-weight: 500; text-decoration: none; }
        .ft-alt a:hover { text-decoration: underline; }

        /* ── OTP step ── */
        .ft-back-row {
          display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
        }

        .ft-back {
          background: none; border: none; cursor: pointer;
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #8A93AA; transition: background 0.18s, color 0.18s;
        }

        .ft-back:hover { background: #F4F6FB; color: #1B2340; }
        .ft-back svg { width: 20px; height: 20px; fill: currentColor; }

        .ft-back-row h3 { margin-bottom: 0; }

        .ft-num-card {
          background: #F8F9FC; border: 1.5px solid #EAECF2;
          border-radius: 12px; padding: 13px 16px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px;
        }

        .ft-num-card .nl { font-size: 11px; color: #A8B0BF; font-weight: 400; margin-bottom: 3px; }
        .ft-num-card .nv { font-size: 14.5px; color: #1B2340; font-weight: 600; }

        .ft-change {
          background: none; border: none; cursor: pointer;
          font-size: 13px; color: #E85D20; font-weight: 500;
          padding: 5px 10px; border-radius: 8px;
          transition: background 0.18s;
        }

        .ft-change:hover { background: rgba(232,93,32,0.07); }

        .ft-hint { font-size: 13px; color: #9AA3B2; line-height: 1.65; margin-bottom: 22px; font-weight: 400; }

        .ft-otp-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 26px; }

        .ft-otp-cell {
          width: 100%; height: 62px; text-align: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px; font-weight: 700; color: #1B2340;
          background: #F4F6FB; border: 1.5px solid #DDE1EB;
          border-radius: 12px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .ft-otp-cell:focus {
          border-color: #E85D20; background: #fff;
          box-shadow: 0 0 0 3px rgba(232,93,32,0.09);
        }

        .ft-resend { text-align: center; margin-top: 18px; font-size: 13px; color: #A8B0BF; font-weight: 400; }
        .ft-resend span { color: #1B2340; font-weight: 500; }

        /* ─── MOBILE ─── */
        @media (max-width: 680px) {
          .ft-root { padding: 0; background: #1B2340; align-items: flex-start; }

          .ft-shell {
            flex-direction: column; width: 100%; min-height: 100svh;
            border-radius: 0; box-shadow: none;
          }

          .ft-left {
            width: 100%;
            padding: 32px 24px 28px;
            flex-direction: row; align-items: center;
            justify-content: space-between;
          }

          .ft-mid, .ft-road, .ft-chips { display: none; }

          .ft-right { border-radius: 28px 28px 0 0; flex: 1; }

          .ft-step { padding: 36px 24px 40px; }
        }

        .modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(27,35,64,0.85);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content {
          background: #fff; width: 100%; max-width: 440px;
          border-radius: 24px; padding: 40px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.2);
          animation: scaleUp 0.35s cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="ft-root">
        <div className="ft-shell">

          {/* ── LEFT ── */}
          <div className="ft-left">
            <div className="ft-brand">
              <div className="ft-brand-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M20 8H17L15 4H9L7 8H4C2.9 8 2 8.9 2 10V19C2 19.55 2.45 20 3 20H5C5 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20H15C15 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20H21C21.55 20 22 19.55 22 19V10C22 8.9 21.1 8 20 8M7 20C6.45 20 6 19.55 6 19s.45-1 1-1 1 .45 1 1-.45 1-1 1M17 20c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1" />
                </svg>
              </div>
              <div>
                <div className="ft-brand-name">FleetTrack</div>
                <div className="ft-brand-sub">Global Logistics</div>
              </div>
            </div>

            <div className="ft-mid">
              <h2>Move loads.<br /><em>Stay ahead.</em></h2>
              <p>Real-time tracking and management for your entire fleet — from pickup to delivery.</p>
              <div className="ft-road">
                <svg viewBox="0 0 260 70" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="42" width="260" height="18" rx="2" fill="#253055" />
                  {[10, 50, 90, 130, 170, 210].map((x) => (
                    <rect key={x} x={x} y="50" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.12)" />
                  ))}
                  <g className="truck">
                    <rect x="0" y="26" width="38" height="16" rx="2" fill="#E85D20" />
                    <rect x="4" y="20" width="24" height="22" rx="1.5" fill="#FF8050" />
                    <rect x="28" y="28" width="10" height="14" rx="2" fill="#C94A10" />
                    <rect x="30" y="30" width="6" height="6" rx="1" fill="rgba(255,255,255,0.5)" />
                    <circle cx="10" cy="42" r="4" fill="#1B2340" />
                    <circle cx="10" cy="42" r="2" fill="#8A93AA" />
                    <circle cx="30" cy="42" r="4" fill="#1B2340" />
                    <circle cx="30" cy="42" r="2" fill="#8A93AA" />
                  </g>
                </svg>
              </div>
            </div>

            <div className="ft-chips">
              {[
                { v: "12", s: "k+", l: "Deliveries" },
                { v: "98", s: "%", l: "On-Time Rate" },
                { v: "340", s: "+", l: "Active Trucks" },
              ].map((c) => (
                <div className="ft-chip" key={c.l}>
                  <div className="ft-chip-val">{c.v}<b>{c.s}</b></div>
                  <div className="ft-chip-lbl">{c.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="ft-right">

            {/* Step 1 — Identity */}
            <div className={`ft-step ${step === "ID" ? "active" : "exit-left"}`}>
              <h3>Welcome back 👋</h3>
              <p className="ft-subtitle">Sign in to manage your fleet.</p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[12px] font-medium border border-red-100 italic">
                  ⚠️ {error}
                </div>
              )}

              <label className="ft-lbl">Email or Phone Number</label>
              <div className="ft-phone-box">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. john@example.com or 712345678"
                  autoFocus
                />
              </div>

              <button className="ft-btn ft-btn-dark" onClick={handleNext}>
                CONTINUE
                <svg viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
              </button>

              <p className="ft-alt">Need help? <a href="#">Contact Support</a></p>
            </div>

            {/* Step 2 — Password */}
            <div className={`ft-step ${step === "PASSWORD" ? "active" : "exit-right"}`}>
              <div className="ft-back-row">
                <button className="ft-back" onClick={() => setStep("ID")}>
                  <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
                </button>
                <h3>Enter Password</h3>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[12px] font-medium border border-red-100 italic">
                  ⚠️ {error}
                </div>
              )}

              <div className="ft-num-card">
                <div>
                  <div className="nl">Signing in as</div>
                  <div className="nv">{identifier || "—"}</div>
                </div>
                <button className="ft-change" onClick={() => setStep("ID")}>Change</button>
              </div>

              <label className="ft-lbl">Secret Password</label>
              <div className="ft-phone-box">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  autoFocus
                />
              </div>

              <button
                className="ft-btn ft-btn-dark"
                onClick={() => handleLogin()}
                disabled={isLoading}
              >
                {isLoading ? "AUTHENTICATING..." : "LOGIN TO DASHBOARD"}
                {!isLoading && <svg viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>}
              </button>

              <div className="mt-8 pt-8 border-t border-neutral-100 space-y-3">
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest text-center mb-2">Switch Account Type</p>

                <Link href="/admin/dashboard" style={{ display: "block" }}>
                  <button className="ft-btn ft-btn-outline" style={{ width: "100%", marginTop: 0 }}>
                    ADMIN LOGIN
                    <svg viewBox="0 0 24 24" fill="#1B2340"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── FORCE CHANGE PASSWORD MODAL ── */}
      {mustChangePassword && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
              </div>
              <h3 className="font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; color: #1B2340; margin-bottom: 8px;">Security Update</h3>
              <p className="text-[14px] text-neutral-500">For your security, you must change your temporary password before accessing the dashboard.</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-600 text-[12px] font-medium border border-red-100 italic">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              <div>
                <label className="ft-lbl">New Password</label>
                <div className="ft-phone-box">
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="ft-lbl">Confirm New Password</label>
                <div className="ft-phone-box">
                  <input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="ft-btn ft-btn-dark py-4 mt-2"
                disabled={isLoading}
              >
                {isLoading ? "UPDATING..." : "UPDATE & LOGIN"}
                {!isLoading && <svg viewBox="0 0 24 24" fill="white"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>}
              </button>
            </form>

            <p className="text-center text-[11px] text-neutral-400 mt-6 italic">
              * This is a one-time requirement for newly created accounts.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
