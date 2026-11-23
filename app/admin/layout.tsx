import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: Verify JWT cookie and role on server
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Admin Top Navigation */}
      <div className="bg-[#1C1C1C] text-[#FFFFFF] border-b border-[#E8E8E8]/20 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-[6px] bg-[#E23744] text-[#FFFFFF] text-xs font-black flex items-center justify-center">
              TV
            </span>
            <span className="font-extrabold text-sm tracking-wide">
              Tastevio Administration
            </span>
            <span className="bg-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded text-[#FFFFFF]">
              Master Role
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[#696969] hidden sm:inline">Signed in as {user.email}</span>
            <Link
              href="/"
              className="px-3 py-1.5 rounded-[6px] bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] font-bold transition-colors"
            >
              ← Customer Website
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Secondary Sub-Nav Tabs */}
      <div className="bg-[#FFFFFF] border-b border-[#E8E8E8] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-6 text-xs font-bold">
          <Link
            href="/admin"
            className="py-3 border-b-2 border-[#E23744] text-[#E23744]"
          >
            📊 Analytics & Overview
          </Link>
          <Link
            href="/admin/restaurants"
            className="py-3 text-[#696969] hover:text-[#1C1C1C] transition-colors"
          >
            🏪 Restaurants
          </Link>
          <Link
            href="/admin/menu-items"
            className="py-3 text-[#696969] hover:text-[#1C1C1C] transition-colors"
          >
            🍽️ Dishes & Menu
          </Link>
          <Link
            href="/admin/orders"
            className="py-3 text-[#696969] hover:text-[#1C1C1C] transition-colors"
          >
            📦 Live Orders Manager
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
