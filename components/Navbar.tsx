"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocation } from "@/contexts/LocationContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { CITY_CENTRE } from "@/lib/constants";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface SearchResultRestaurant {
  _id: string;
  name: string;
  slug: string;
  image: string;
  cuisine: string[];
}

interface SearchResultMenuItem {
  _id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  restaurantId: {
    _id: string;
    name: string;
    slug: string;
  };
}

const CITIES = [
  "Vijayawada (KL University)",
  "Vijayawada",
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Pune",
] as const;

export function Navbar() {
  const router = useRouter();
  const { location, setCity, useMyLocation, isLocating, mounted } = useLocation();
  const { totalCount, openDrawer } = useCart();
  const toast = useToast();

  const [user, setUser] = useState<UserSession | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    restaurants: SearchResultRestaurant[];
    menuItems: SearchResultMenuItem[];
  }>({ restaurants: [], menuItems: [] });

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch session
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      // Ignore network errors
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ restaurants: [], menuItems: [] });
      setIsSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setIsSearchOpen(true);
        }
      } catch {
        // Ignore search fetch errors
      } finally {
        setIsSearchLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setIsProfileOpen(false);
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Location Bar */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="w-8 h-8 rounded-[8px] bg-[#E23744] text-[#FFFFFF] font-black text-sm flex items-center justify-center shadow-xs">
              TV
            </span>
            <span className="font-extrabold text-xl tracking-tight text-[#1C1C1C]">
              Tastevio
            </span>
          </Link>

          {/* Location Controls */}
          <div className="hidden md:flex items-center gap-2 border-l border-[#E8E8E8] pl-4">
            <div className="relative">
              <select
                value={mounted ? location.city : CITY_CENTRE.name}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Select city"
                className="appearance-none bg-[#FAF9F6] border border-[#E8E8E8] rounded-[8px] px-3 py-1.5 pr-7 text-xs font-semibold text-[#1C1C1C] hover:border-[#1C1C1C] cursor-pointer focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    📍 {c}
                  </option>
                ))}
              </select>
              <span className="absolute right-2 top-2 pointer-events-none text-[10px] text-[#696969]">
                ▼
              </span>
            </div>

            <button
              onClick={useMyLocation}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer ${
                mounted && location.mode === "gps"
                  ? "bg-[#2E7D32]/10 border-[#2E7D32] text-[#2E7D32]"
                  : "bg-[#FFFFFF] border-[#E8E8E8] text-[#1C1C1C] hover:border-[#E23744]"
              }`}
            >
              <span className={isLocating ? "animate-spin" : ""}>🎯</span>
              <span>
                {isLocating
                  ? "Detecting..."
                  : mounted && location.mode === "gps"
                  ? "GPS Active"
                  : "Use my location"}
              </span>
            </button>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for restaurants, biryani, pizza..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.restaurants.length || searchResults.menuItems.length) {
                  setIsSearchOpen(true);
                }
              }}
              className="w-full bg-[#FAF9F6] border border-[#E8E8E8] rounded-[8px] py-2 pl-9 pr-4 text-xs text-[#1C1C1C] placeholder-[#696969] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
            />
            <span className="absolute left-3 top-2.5 text-xs text-[#696969]">🔍</span>
            {isSearchLoading && (
              <span className="absolute right-3 top-2.5 text-xs text-[#E23744] animate-spin">
                ⌛
              </span>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#FFFFFF] rounded-[8px] border border-[#E8E8E8] shadow-lg max-h-96 overflow-y-auto z-50 p-2">
              {searchResults.restaurants.length === 0 && searchResults.menuItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#696969]">
                  No matching restaurants or dishes found
                </div>
              ) : (
                <>
                  {searchResults.restaurants.length > 0 && (
                    <div className="mb-2">
                      <div className="px-2 py-1 text-[11px] font-bold text-[#696969] uppercase tracking-wider">
                        Restaurants
                      </div>
                      {searchResults.restaurants.map((r) => (
                        <Link
                          key={r._id}
                          href={`/restaurant/${r._id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#FAF9F6] text-xs"
                        >
                          <span className="font-semibold text-[#1C1C1C]">{r.name}</span>
                          <span className="text-[11px] text-[#696969]">{r.cuisine.join(", ")}</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.menuItems.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[11px] font-bold text-[#696969] uppercase tracking-wider border-t border-[#E8E8E8] pt-2">
                        Dishes
                      </div>
                      {searchResults.menuItems.map((dish) => (
                        <Link
                          key={dish._id}
                          href={`/restaurant/${dish.restaurantId._id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between p-2 rounded-[6px] hover:bg-[#FAF9F6] text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full inline-block ${
                                dish.isVeg ? "bg-[#2E7D32]" : "bg-[#E23744]"
                              }`}
                            />
                            <span className="font-medium text-[#1C1C1C]">{dish.name}</span>
                            <span className="text-[10px] text-[#696969]">
                              in {dish.restaurantId.name}
                            </span>
                          </div>
                          <span className="font-semibold text-[#1C1C1C]">₹{dish.price}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Cart Drawer Toggle & User Profile */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Cart Button */}
          <button
            onClick={openDrawer}
            className="relative flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E8E8E8] rounded-[8px] px-3 py-1.5 text-xs font-bold text-[#1C1C1C] hover:border-[#E23744] cursor-pointer"
          >
            <span>🛒</span>
            <span className="hidden sm:inline">Cart</span>
            {mounted && totalCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-[#E23744] text-[#FFFFFF] text-[10px] font-extrabold w-4 h-4 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          {/* User Auth / Profile Dropdown */}
          <div ref={profileRef} className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setIsProfileOpen((p) => !p)}
                  className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E8E8E8] rounded-[8px] px-3 py-1.5 text-xs font-semibold text-[#1C1C1C] hover:border-[#1C1C1C] cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-[#E23744] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[80px] truncate">{user.name}</span>
                  <span className="text-[9px] text-[#696969]">▼</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#FFFFFF] rounded-[8px] border border-[#E8E8E8] shadow-md p-1.5 z-50 text-xs">
                    <div className="p-2 border-b border-[#E8E8E8] mb-1">
                      <p className="font-bold text-[#1C1C1C] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#696969] truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-2 py-1.5 rounded-[6px] hover:bg-[#FAF9F6] text-[#1C1C1C] font-medium"
                    >
                      📦 My Orders
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-2 py-1.5 rounded-[6px] hover:bg-[#FAF9F6] text-[#E23744] font-bold"
                      >
                        ⚡ Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2 py-1.5 rounded-[6px] hover:bg-[#FAF9F6] text-[#E23744] font-medium cursor-pointer"
                    >
                      🚪 Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-semibold text-[#1C1C1C] hover:border-[#1C1C1C]"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-[8px] bg-[#E23744] text-xs font-semibold text-[#FFFFFF] hover:opacity-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
