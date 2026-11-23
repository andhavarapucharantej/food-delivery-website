"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          address: address.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Account created successfully!");
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating account";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] grid grid-cols-1 md:grid-cols-2">
      {/* Left Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-[#1C1C1C]">Create an Account</h1>
            <p className="text-xs text-[#696969] mt-1">
              Join Tastevio and start ordering your favourite food
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1C1C1C] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
              />
            </div>

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
              <label className="block text-xs font-bold text-[#1C1C1C] mb-1">
                Password (min 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1C1C1C] mb-1">
                Default Delivery Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat 101, Lakeview Appts, Indiranagar"
                className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1C1C] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 disabled:opacity-50 cursor-pointer shadow-xs transition-opacity"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-[#696969] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-[#E23744] hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Visual Brand Panel */}
      <div className="hidden md:flex flex-col items-center justify-center bg-[#FAF9F6] border-l border-[#E8E8E8] p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[#2E7D32] text-[#FFFFFF] flex items-center justify-center font-black text-3xl shadow-md mb-6">
          🥗
        </div>
        <h2 className="text-2xl font-black text-[#1C1C1C] max-w-xs">
          Fast, Fresh, & Contactless
        </h2>
        <p className="text-xs text-[#696969] mt-2 max-w-sm">
          Track your orders live with interactive telemetry, free deliveries on featured restaurants, and instant confirmations.
        </p>
      </div>
    </main>
  );
}
