"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { useCart } from "@/contexts/CartContext";
import { geoJsonToLatLng } from "@/lib/geo";
import { TrackingMapWrapper } from "@/components/TrackingMapWrapper";

interface OrderDetail {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
    image: string;
    location: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [lng, lat]
    };
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  deliveryCoordinates: {
    lat: number;
    lng: number;
  };
  deliveryPartner: {
    name: string;
    phone: string;
    vehicleNo: string;
    rating: number;
  };
  etaSeconds: number;
  outForDeliveryAt?: string;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt: string;
}

const STEPPER_STAGES = ["Placed", "Preparing", "Out for Delivery", "Delivered"] as const;

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();
  const { clearCart, closeDrawer } = useCart();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [clockOffset, setClockOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(5);

  // Ensure cart is cleared upon arriving on tracking page after placement
  useEffect(() => {
    clearCart();
    closeDrawer();
  }, [clearCart, closeDrawer]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        throw new Error("Order not found or access denied");
      }
      const data = await res.json();
      setOrder(data.order);
      if (typeof data.serverNow === "number") {
        setClockOffset(data.serverNow - Date.now());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading tracking";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 10 seconds for real-time status & serverNow
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live countdown timer for ETA
  useEffect(() => {
    if (!order || order.status === "Delivered" || order.status === "Cancelled") return;

    const updateCountdown = () => {
      const now = Date.now() + clockOffset;
      const outDeliveryMs = order.outForDeliveryAt
        ? new Date(order.outForDeliveryAt).getTime()
        : new Date(order.createdAt).getTime() + 60_000;

      const totalEtaMs = (order.etaSeconds || 180) * 1000;
      const targetArrivalMs = outDeliveryMs + totalEtaMs;
      const remainingMs = Math.max(0, targetArrivalMs - now);
      const mins = Math.ceil(remainingMs / 60000);
      setRemainingMinutes(Math.max(1, mins));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 2000);
    return () => clearInterval(interval);
  }, [order, clockOffset]);

  const handleCallPartner = () => {
    if (!order) return;
    toast.info(`Calling delivery partner: ${order.deliveryPartner.phone} (Masked)`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-[#FAF9F6] rounded w-1/3" />
        <div className="h-24 bg-[#FAF9F6] rounded-[8px] border border-[#E8E8E8]" />
        <div className="h-72 bg-[#FAF9F6] rounded-[8px] border border-[#E8E8E8]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold text-[#1C1C1C] mt-3">Tracking Error</h2>
        <p className="text-xs text-[#696969] mt-1">{error || "Could not locate order details"}</p>
        <Link
          href="/orders"
          className="inline-block mt-4 px-4 py-2 rounded-[8px] bg-[#E23744] text-xs font-bold text-[#FFFFFF]"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  // Calculate current stepper index
  const currentStepIndex = STEPPER_STAGES.indexOf(
    order.status as (typeof STEPPER_STAGES)[number]
  );
  const isCancelled = order.status === "Cancelled";

  // Convert restaurant GeoJSON [lng, lat] to Leaflet { lat, lng }
  const restaurantCoords = geoJsonToLatLng(
    order.restaurantId.coordinates.coordinates
  );

  const outForDeliveryAtMs = order.outForDeliveryAt
    ? new Date(order.outForDeliveryAt).getTime()
    : new Date(order.createdAt).getTime() + 60_000;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1C1C]">
              Live Order Tracking
            </h1>
            <span className="text-xs text-[#2E7D32] bg-[#2E7D32]/10 px-2 py-0.5 rounded font-bold">
              ● Live Updates
            </span>
          </div>
          <p className="text-xs text-[#696969] mt-0.5">
            Order #{order._id.substring(0, 8)} • From{" "}
            <span className="font-semibold text-[#1C1C1C]">
              {order.restaurantId.name}
            </span>
          </p>
        </div>

        <Link
          href="/orders"
          className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-bold text-[#1C1C1C] hover:border-[#1C1C1C]"
        >
          ← Orders List
        </Link>
      </div>

      {/* Cancelled Banner */}
      {isCancelled && (
        <div className="p-4 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span>This order has been cancelled. No charge was deducted.</span>
          </div>
          <Link href="/" className="underline text-red-900 font-bold">
            Order Again
          </Link>
        </div>
      )}

      {/* Stepper Bar: Placed -> Preparing -> Out for Delivery -> Delivered */}
      {!isCancelled && (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs">
          <div className="flex items-center justify-between relative">
            {/* Background connecting line */}
            <div className="absolute left-6 right-6 top-3 h-0.5 bg-[#E8E8E8] z-0" />

            {STEPPER_STAGES.map((stage, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div
                  key={stage}
                  className="relative z-10 flex flex-col items-center flex-1 text-center"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                      isPassed
                        ? "bg-[#2E7D32] border-[#2E7D32] text-[#FFFFFF]"
                        : "bg-[#FFFFFF] border-[#E8E8E8] text-[#696969]"
                    } ${isCurrent ? "ring-3 ring-[#2E7D32]/20" : ""}`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 ${
                      isCurrent
                        ? "text-[#2E7D32]"
                        : isPassed
                        ? "text-[#1C1C1C]"
                        : "text-[#696969]"
                    }`}
                  >
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Map Section (Active during Out for Delivery or completed) */}
      {!isCancelled && order.status === "Out for Delivery" && (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-[#1C1C1C]">
              Rider Live Route
            </h2>
            <span className="text-xs font-bold text-[#E23744] bg-[#E23744]/10 px-2 py-0.5 rounded">
              Arriving in ~{remainingMinutes} min
            </span>
          </div>

          <TrackingMapWrapper
            restaurantCoords={restaurantCoords}
            deliveryCoords={order.deliveryCoordinates}
            outForDeliveryAtMs={outForDeliveryAtMs}
            etaSeconds={order.etaSeconds}
            clockOffset={clockOffset}
            restaurantName={order.restaurantId.name}
          />
        </div>
      )}

      {/* Partner Card */}
      {!isCancelled && (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-full bg-[#E23744]/10 text-[#E23744] font-extrabold text-xl flex items-center justify-center flex-shrink-0">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#1C1C1C]">
                  {order.deliveryPartner.name}
                </span>
                <span className="bg-[#2E7D32] text-[#FFFFFF] text-[10px] font-bold px-1.5 py-0.2 rounded">
                  ★ {order.deliveryPartner.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-[#696969] mt-0.5 font-mono">
                Vehicle: {order.deliveryPartner.vehicleNo}
              </p>
              <p className="text-[10px] text-[#696969] mt-0.5">
                Simulated delivery telemetry • Sanitized partner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleCallPartner}
              className="px-4 py-2 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] text-[#1C1C1C] text-xs font-bold hover:border-[#1C1C1C] cursor-pointer flex items-center gap-1.5"
            >
              <span>📞</span>
              <span>Call Partner</span>
            </button>
          </div>
        </div>
      )}

      {/* Order Summary & Delivery Address */}
      <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs text-xs space-y-3">
        <h3 className="font-extrabold text-sm text-[#1C1C1C] pb-2 border-b border-[#E8E8E8]">
          Delivery Details
        </h3>
        <div className="flex justify-between">
          <span className="text-[#696969]">Delivery Address:</span>
          <span className="font-medium text-[#1C1C1C] text-right max-w-xs">
            {order.deliveryAddress}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#696969]">Total Amount:</span>
          <span className="font-extrabold text-[#E23744] text-sm">
            ₹{order.totalAmount}
          </span>
        </div>
        <div className="pt-2 border-t border-[#E8E8E8] space-y-1">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-[#696969]">
              <span>
                {i.quantity}x {i.name}
              </span>
              <span>₹{i.price * i.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
