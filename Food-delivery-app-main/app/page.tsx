"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocation } from "@/contexts/LocationContext";
import { FoodImage } from "@/components/FoodImage";
import { CUISINES } from "@/lib/constants";
import { ThreeDSection } from "@/components/ThreeDSection";

interface RestaurantCardData {
  _id: string;
  name: string;
  slug: string;
  cuisine: string[];
  image: string;
  rating: number;
  deliveryTime: number;
  location: string;
  isOpen: boolean;
  distanceKm?: number;
}

export default function HomePage() {
  const { location, mounted } = useLocation();

  const [restaurants, setRestaurants] = useState<RestaurantCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("All");
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (mounted && location.mode === "gps" && location.coords) {
        params.set("lat", location.coords.lat.toString());
        params.set("lng", location.coords.lng.toString());
        params.set("radiusKm", "15");
      } else if (location.city) {
        params.set("city", location.city);
      }

      if (selectedCuisine && selectedCuisine !== "All") {
        params.set("cuisine", selectedCuisine);
      }

      if (vegOnly) {
        params.set("vegOnly", "true");
      }

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || []);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.city, location.mode, location.coords, selectedCuisine, vegOnly, mounted]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Cuisine Categories Strip */}
      <section className="mb-6">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#1C1C1C]">
            Inspiration for your first order
          </h2>
          {/* Veg Only Toggle */}
          <button
            onClick={() => setVegOnly((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-xs font-bold border transition-colors cursor-pointer ${
              vegOnly
                ? "bg-[#2E7D32]/10 border-[#2E7D32] text-[#2E7D32]"
                : "bg-[#FFFFFF] border-[#E8E8E8] text-[#696969] hover:border-[#1C1C1C]"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-[2px] border flex items-center justify-center ${
                vegOnly ? "border-[#2E7D32]" : "border-[#696969]"
              }`}
            >
              {vegOnly && <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />}
            </span>
            <span>Pure Veg Only</span>
          </button>
        </div>

        {/* Scrollable Cuisines */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CUISINES.map((cuisine) => {
            const isSelected = selectedCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-4 py-2 rounded-[8px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#E23744] text-[#FFFFFF] shadow-xs"
                    : "bg-[#FFFFFF] text-[#1C1C1C] border border-[#E8E8E8] hover:border-[#1C1C1C]"
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </section>

      {/* Restaurant Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#1C1C1C]">
            Top Restaurants Near You
          </h1>
          <p className="text-xs text-[#696969] mt-0.5">
            {mounted && location.mode === "gps"
              ? "Sorted by distance from your current GPS pin"
              : `Delivering in ${location.city || "Bengaluru"}`}
          </p>
        </div>
        <span className="text-xs font-bold text-[#696969]">
          {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
        </span>
      </div>

      {/* Restaurant Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-3 animate-pulse"
            >
              <div className="w-full h-44 rounded-[8px] bg-[#FAF9F6] mb-3" />
              <div className="h-4 bg-[#FAF9F6] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[#FAF9F6] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-12 text-center my-6">
          <span className="text-4xl">🍽️</span>
          <h3 className="mt-3 text-base font-bold text-[#1C1C1C]">No restaurants found</h3>
          <p className="text-xs text-[#696969] mt-1">
            Try switching cities, clearing the Pure Veg filter, or clicking &quot;Use my location&quot;.
          </p>
          <button
            onClick={() => {
              setSelectedCuisine("All");
              setVegOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-[8px] bg-[#E23744] text-xs font-bold text-[#FFFFFF]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant._id}
              href={`/restaurant/${restaurant._id}`}
              className="group block rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-3 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              {/* Restaurant Image */}
              <div className="relative w-full h-44 rounded-[8px] overflow-hidden bg-[#FAF9F6] mb-3">
                <FoodImage
                  src={restaurant.image}
                  alt={restaurant.name}
                  fill
                  className="object-cover group-hover:scale-102 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Open/Closed Badge */}
                {!restaurant.isOpen && (
                  <div className="absolute inset-0 bg-[#1C1C1C]/60 flex items-center justify-center">
                    <span className="bg-[#FFFFFF] text-[#1C1C1C] text-[11px] font-bold px-2 py-1 rounded-[4px]">
                      Currently Closed
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Star Rating Pill */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h2 className="font-extrabold text-sm text-[#1C1C1C] truncate group-hover:text-[#E23744] transition-colors">
                  {restaurant.name}
                </h2>
                <div className="flex items-center gap-1 bg-[#2E7D32] text-[#FFFFFF] text-[11px] font-extrabold px-1.5 py-0.5 rounded-[4px] flex-shrink-0">
                  <span>★</span>
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Cuisines */}
              <p className="text-xs text-[#696969] truncate mb-2">
                {restaurant.cuisine.join(", ")}
              </p>

              {/* Badges Footer: Delivery Time + Distance (when GPS active) */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8E8E8] text-[11px] text-[#696969]">
                <div className="flex items-center gap-1 font-semibold text-[#1C1C1C]">
                  <span>🕒</span>
                  <span>{restaurant.deliveryTime} mins</span>
                </div>

                {/* Display distance when GPS mode is active */}
                {restaurant.distanceKm !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-bold text-[#2E7D32]">
                      {restaurant.distanceKm} km away
                    </span>
                  </>
                )}

                <span className="ml-auto text-[#696969] truncate">
                  {restaurant.location}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 3D Animations & Telemetry Showcase at Last */}
      <ThreeDSection />
    </main>
  );
}
