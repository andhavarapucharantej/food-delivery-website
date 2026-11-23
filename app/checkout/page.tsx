"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { useToast } from "@/contexts/ToastContext";
import { CITY_CENTRE } from "@/lib/constants";
import { CheckoutMapWrapper } from "@/components/CheckoutMapWrapper";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, restaurantName, totalAmount, clearCart, closeDrawer, mounted } = useCart();
  const { location } = useLocation();
  const toast = useToast();

  const [address, setAddress] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: location.coords?.lat || CITY_CENTRE.lat,
    lng: location.coords?.lng || CITY_CENTRE.lng,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  // Sync coords from location if not yet customized
  useEffect(() => {
    if (location.coords) {
      setCoordinates(location.coords);
    }
  }, [location.coords]);

  // Fetch prefilled address from current logged in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user?.address) {
            setAddress(data.user.address);
          }
        }
      } catch {
        // Ignore fetch errors
      } finally {
        setUserLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please enter a complete delivery address");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
        })),
        deliveryAddress: address.trim(),
        deliveryCoordinates: coordinates,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      toast.success("Order placed successfully! Connecting to driver...");
      clearCart();
      closeDrawer();
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("fd_cart_state");
          localStorage.setItem("fd_cart_state", "[]");
        } catch {
          // Ignore
        }
      }
      router.push(`/orders/${data.order._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error placing order";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 bg-[#FAF9F6] rounded w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-[#FAF9F6] rounded-[8px] border border-[#E8E8E8]" />
          <div className="h-72 bg-[#FAF9F6] rounded-[8px] border border-[#E8E8E8]" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-4xl">🛒</span>
        <h1 className="text-lg font-bold text-[#1C1C1C] mt-3">Your cart is empty</h1>
        <p className="text-xs text-[#696969] mt-1">Add items before heading to checkout.</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-[8px] bg-[#E23744] text-xs font-bold text-[#FFFFFF]"
        >
          Explore Restaurants
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1C1C] mb-6">
        Checkout & Delivery
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Form: Delivery Address & Interactive Pin */}
        <div className="md:col-span-7 space-y-6">
          <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#1C1C1C] mb-3">
              1. Delivery Address & GPS Pin
            </h2>

            {/* Interactive Leaflet Map Wrapper */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#696969] mb-1.5">
                Pinpoint exact doorstep on map:
              </label>
              <CheckoutMapWrapper
                initialLat={coordinates.lat}
                initialLng={coordinates.lng}
                onChange={(coords) => setCoordinates(coords)}
              />
              <div className="mt-1.5 text-[11px] text-[#696969]">
                Coordinates: <span className="font-mono text-[#1C1C1C]">{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} id="checkout-form">
              <div>
                <label
                  htmlFor="address"
                  className="block text-xs font-semibold text-[#1C1C1C] mb-1.5"
                >
                  Full Street Address & Flat / House No. *
                </label>
                <textarea
                  id="address"
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Palm Residency, 4th Cross Road, Indiranagar"
                  className="w-full rounded-[8px] border border-[#E8E8E8] bg-[#FAF9F6] p-3 text-xs text-[#1C1C1C] placeholder-[#696969] focus:outline-none focus:border-[#E23744] focus:bg-[#FFFFFF]"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Right Summary: Items & Payment CTA */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs">
            <h2 className="text-sm font-extrabold text-[#1C1C1C] pb-3 border-b border-[#E8E8E8]">
              Order Summary
            </h2>
            <p className="text-xs text-[#696969] mt-2 mb-3">
              Restaurant: <span className="font-bold text-[#1C1C1C]">{restaurantName}</span>
            </p>

            {/* Item list */}
            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-[#E8E8E8]/60 mb-4 pr-1">
              {items.map((item) => (
                <div
                  key={item.menuItemId}
                  className="pt-2 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <span className="font-semibold text-[#696969]">{item.quantity}x</span>
                    <span className="font-medium text-[#1C1C1C] truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#1C1C1C]">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Bill Details */}
            <div className="space-y-1.5 pt-3 border-t border-[#E8E8E8] text-xs text-[#696969]">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="text-[#2E7D32] font-semibold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="text-[#2E7D32] font-semibold">₹0</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8E8E8] text-sm font-extrabold text-[#1C1C1C]">
                <span>To Pay</span>
                <span className="text-base text-[#E23744]">₹{totalAmount}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="mt-5 w-full py-3 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-extrabold hover:opacity-95 disabled:opacity-50 transition-opacity cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-[#FFFFFF] border-t-transparent animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Place Order • ₹{totalAmount} →</span>
              )}
            </button>
            <p className="text-[10px] text-center text-[#696969] mt-2">
              Cash on delivery / Instant card confirmation simulated
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
