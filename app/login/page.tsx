"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const showDemo = searchParams.get("demo") === "true";
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success(`Welcome back, ${data.user.name}!`);
      const targetUrl = data.user.role === "admin" && callbackUrl === "/" ? "/admin" : callbackUrl;
      router.push(targetUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials";
      toast.error(msg);
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string, role: "admin" | "user" = "user") => {
    setLoading(true);
    const targetPass = "Bitcoin@100";
    setEmail(targetEmail);
    setPassword(targetPass);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success(
        role === "admin"
          ? "Logged in as Admin (Charan)! Redirecting to Dashboard..."
          : `Welcome back, ${data.user.name}!`
      );
      const targetUrl = role === "admin" && callbackUrl === "/" ? "/admin" : callbackUrl;
      router.push(targetUrl);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-[#1C1C1C]">Sign In to Tastevio</h1>
        <p className="text-xs text-[#696969] mt-1">
          Enjoy live food delivery from top restaurants
        </p>
      </div>

      {/* 1-Click Instant Login (Hidden by default for security, visible only via ?demo=true) */}
      {showDemo && (
        <>
          <div className="mb-5 p-3.5 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] text-xs">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-[#1C1C1C] text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                Quick Test Logins (Password: Bitcoin@100):
              </p>
              <span className="text-[10px] text-[#696969] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E8E8E8]">
                Demo Mode
              </span>
            </div>
            
            {/* Admin Button */}
            <div className="mb-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("charan@admin.com", "admin")}
                className="w-full py-2 px-3 rounded-[6px] bg-[#FFFFFF] border border-[#E23744]/40 font-bold text-xs text-[#E23744] hover:border-[#E23744] hover:bg-[#E23744]/5 transition-all cursor-pointer shadow-2xs flex items-center justify-between disabled:opacity-50"
              >
                <span>👑 Charan (Admin)</span>
                <span className="text-[10px] text-[#E23744]/70">charan@admin.com</span>
              </button>
            </div>

            {/* Customer Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("charan@tastevio.com", "user")}
                className="py-1.5 px-2 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] font-bold text-[11px] text-[#1C1C1C] hover:border-[#1C1C1C] transition-all cursor-pointer text-left truncate disabled:opacity-50"
              >
                👤 Charan
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("sai@tastevio.com", "user")}
                className="py-1.5 px-2 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] font-bold text-[11px] text-[#1C1C1C] hover:border-[#1C1C1C] transition-all cursor-pointer text-left truncate disabled:opacity-50"
              >
                👤 Sai
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("sitaram@tastevio.com", "user")}
                className="py-1.5 px-2 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] font-bold text-[11px] text-[#1C1C1C] hover:border-[#1C1C1C] transition-all cursor-pointer text-left truncate disabled:opacity-50"
              >
                👤 Sita Ram
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("priya@tastevio.com", "user")}
                className="py-1.5 px-2 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] font-bold text-[11px] text-[#1C1C1C] hover:border-[#1C1C1C] transition-all cursor-pointer text-left truncate disabled:opacity-50"
              >
                👤 Priya
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin("kalifia@tastevio.com", "user")}
                className="col-span-2 py-1.5 px-2 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] font-bold text-[11px] text-[#1C1C1C] hover:border-[#1C1C1C] transition-all cursor-pointer text-left truncate disabled:opacity-50"
              >
                👤 Kalifia
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E8E8]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#696969]">
              <span className="bg-[#FFFFFF] px-2">or sign in with credentials</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1C1C1C] mb-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1C1C1C] mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-xs transition-opacity"
        >
          {loading ? "Signing In..." : "Continue"}
        </button>
      </form>

      <p className="text-center text-xs text-[#696969] mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-[#E23744] hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2">
      {/* Left Column: Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <Suspense
          fallback={
            <div className="w-full max-w-sm h-64 bg-[#FAF9F6] rounded-[8px] animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Column: Visual brand panel */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#FAF9F6] border-l border-[#E8E8E8] p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[#E23744] text-[#FFFFFF] flex items-center justify-center font-black text-2xl shadow-md mb-6">
          TV
        </div>
        <h2 className="text-2xl font-black text-[#1C1C1C] max-w-xs">
          Craving Delicious Food?
        </h2>
        <p className="text-xs text-[#696969] mt-2 max-w-sm">
          Get freshly prepared biryanis, crispy pizzas, and tiffins delivered right to your door in minutes with live telemetry tracking.
        </p>
      </div>
    </main>
  );
}
