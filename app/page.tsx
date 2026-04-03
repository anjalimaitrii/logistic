"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [step, setStep] = useState<"ID" | "OTP">("ID");
  const [phoneNumber, setPhoneNumber] = useState("712 345 678");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Handle OTP focus management
  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box
    if (value !== "" && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 font-sans">
      {/* ─── PREMIUM VISUAL HEADER ─── */}
      <div className="w-full h-56 bg-secondary relative overflow-hidden flex flex-col justify-end p-6 pb-8 shrink-0">
        {/* Background Gradients and Shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary-mid to-secondary" />
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl opacity-40" />

        {/* Abstract Logistics SVG Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

        {/* Subtle Route SVG */}
        <svg className="absolute top-1/4 left-1/4 w-full h-auto opacity-10" viewBox="0 0 400 100" fill="none">
          <path d="M0,50 Q100,10 200,50 T400,50" stroke="white" strokeWidth="2" strokeDasharray="10,8" />
          <path d="M50,80 Q150,40 250,80 T450,40" stroke="white" strokeWidth="1" strokeDasharray="5,10" />
        </svg>

        {/* Branding */}
        <div className="relative z-10 flex items-center gap-3 animate-fade-in-down">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-2xl shadow-primary/40">
            <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
              <path d="M20 8H17L15 4H9L7 8H4C2.9 8 2 8.9 2 10V19C2 19.55 2.45 20 3 20H5C5 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20H15C15 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20H21C21.55 20 22 19.55 22 19V10C22 8.9 21.1 8 20 8M7 20C6.45 20 6 19.55 6 19s.45-1 1-1 1 .45 1 1-.45 1-1 1M17 20c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-2xl text-white tracking-tight leading-none">FleetTrack</span>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[2px] mt-1">Global Logistics</span>
          </div>
        </div>
      </div>

      {/* ─── LOGIN FORM BODY ─── */}
      <div className="flex-1 bg-neutral-50 px-6 sm:px-8 py-10 -mt-6 rounded-t-[32px] relative z-20 shadow-2xl overflow-hidden max-w-md mx-auto w-full">
        <div className={`transition-all duration-500 ease-in-out transform flex flex-col ${step === 'ID' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 absolute pointer-events-none'}`}>
          <h1 className="font-display font-extrabold text-3xl text-neutral-900 tracking-tight leading-tight">Welcome Back</h1>
          <p className="text-neutral-500 font-medium text-sm mt-2 mb-10">Sign in to manage your fleet across Africa.</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="flex items-center bg-neutral-100 border-2 border-neutral-200 rounded-2xl overflow-hidden focus-within:border-primary focus-within:bg-white transition-all duration-200 shadow-sm focus-within:shadow-xl focus-within:shadow-primary/5">
                <div className="flex items-center gap-2 px-4 py-4 border-r border-neutral-200 bg-neutral-100/50">
                  <span className="text-2xl">🇰🇪</span>
                  <span className="text-sm font-bold text-neutral-700">+254</span>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="712 345 678"
                  className="w-full py-4 px-5 text-lg font-bold text-neutral-900 outline-none bg-transparent placeholder:text-neutral-300 tracking-wider"
                />
              </div>
            </div>

            <button
              onClick={() => setStep("OTP")}
              className="w-full bg-linear-to-r from-primary to-primary-mid text-white font-display font-extrabold py-5 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center gap-3 group active:scale-95 transition-all hover:scale-[1.01]"
            >
              NEXT
              <svg className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-neutral-400 font-bold">
                Or login with <span className="text-secondary cursor-pointer hover:text-primary transition-colors">Email + Password</span>
              </p>
            </div>
          </div>
        </div>

        {/* ─── STEP 2: OTP FLOW ─── */}
        <div className={`transition-all duration-500 ease-in-out transform flex flex-col h-full ${step === 'OTP' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute pointer-events-none'}`}>
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setStep("ID")} className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <h2 className="font-display font-extrabold text-2xl text-neutral-900 tracking-tight">Enter OTP</h2>
          </div>

          <div className="bg-neutral-100 border border-neutral-200 rounded-2xl p-4 flex justify-between items-center mb-8 shadow-inner">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest">Active Number</span>
              <span className="font-display font-extrabold text-neutral-900 tracking-tight text-sm">+254 {phoneNumber}</span>
            </div>
            <button onClick={() => setStep("ID")} className="text-primary font-bold text-xs hover:bg-primary-light px-3 py-1.5 rounded-lg transition-colors">
              Change
            </button>
          </div>

          <p className="text-neutral-500 font-bold text-sm mb-8 leading-relaxed">We have sent a 4-digit verification code to your number.</p>

          <div className="grid grid-cols-4 gap-4 mb-10">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-full h-16 text-center text-2xl font-display font-extrabold bg-white border-2 border-neutral-200 rounded-2xl focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 shadow-sm"
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="w-full">
              <button className="w-full bg-linear-to-r from-primary to-primary-mid text-white font-display font-extrabold py-5 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center gap-3 group active:scale-95 transition-all hover:scale-[1.01]">
                LOGIN AS CLIENT
                <svg className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </button>
            </Link>

            <Link href="/admin/dashboard" className="w-full">
              <button className="w-full bg-secondary text-white font-display font-extrabold py-5 rounded-2xl shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 group active:scale-95 transition-all hover:scale-[1.01] border border-white/10 uppercase tracking-wider">
                LOGIN AS ADMIN
                <svg className="w-5 h-5 fill-white group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </button>
            </Link>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm font-bold text-neutral-400">Resend OTP in <span className="text-neutral-900">30 seconds</span></p>
          </div>
        </div>
      </div>

      {/* ─── PWA BADGE / FOOTER ─── */}
      <div className="py-8 mt-auto flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-full text-[10px] font-bold tracking-[2px] shadow-xl uppercase animate-pulse">
          <svg className="w-4 h-4 fill-primary" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
          PWA • Install on any device
        </div>
        <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-[1px]">© 2026 FleetTrack Global</p>
      </div>

      {/* Global CSS for minor custom animations */}
      <style jsx global>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

