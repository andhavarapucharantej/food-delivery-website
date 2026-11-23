"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

interface OrderItemSummary {
  name: string;
  price: number;
  quantity: number;
}

interface OrderHistoryRecord {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
    image: string;
    location: string;
  };
  items: OrderItemSummary[];
  totalAmount: number;
  deliveryAddress: string;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderHistoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const toast = useToast();

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds for real-time status updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?"
    );
    if (!confirmCancel) return;

    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cancelling order";
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: OrderHistoryRecord["status"]) => {
    switch (status) {
      case "Placed":
        return "bg-[#1C1C1C]/10 text-[#1C1C1C] border-[#1C1C1C]/20";
      case "Preparing":
        return "bg-[#696969]/10 text-[#696969] border-[#696969]/20";
      case "Out for Delivery":
        return "bg-[#E23744]/10 text-[#E23744] border-[#E23744]/30";
      case "Delivered":
        return "bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/30";
      case "Cancelled":
        return "bg-gray-200 text-gray-700 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 bg-[#FAF9F6] rounded w-1/4 mb-4" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-[#FAF9F6] rounded-[8px] border border-[#E8E8E8]" />
        ))}
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1C1C]">
            Your Orders
          </h1>
          <p className="text-xs text-[#696969] mt-0.5">
            Auto-refreshing status every 10 seconds
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-semibold text-[#1C1C1C] hover:border-[#1C1C1C] cursor-pointer"
        >
          ↻ Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-12 text-center">
          <span className="text-4xl">📦</span>
          <h2 className="text-base font-bold text-[#1C1C1C] mt-3">No orders yet</h2>
          <p className="text-xs text-[#696969] mt-1">
            Browse our curated restaurants and enjoy your first meal!
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-[8px] bg-[#E23744] text-xs font-bold text-[#FFFFFF]"
          >
            Order Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPlaced = order.status === "Placed";
            const dateStr = new Date(order.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <div
                key={order._id}
                className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E8E8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#1C1C1C]">
                        {order.restaurantId?.name || "Restaurant"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#696969] mt-0.5">
                      Order ID: <span className="font-mono">{order._id.substring(0, 10)}...</span> • {dateStr}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPlaced && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="px-3 py-1.5 rounded-[6px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-bold text-[#E23744] hover:bg-[#FAF9F6] cursor-pointer"
                      >
                        {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    <Link
                      href={`/orders/${order._id}`}
                      className="px-4 py-1.5 rounded-[6px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 shadow-xs"
                    >
                      Track Order →
                    </Link>
                  </div>
                </div>

                {/* Items & Amount Summary */}
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#696969] gap-2">
                  <div className="truncate max-w-lg">
                    {order.items.map((i) => `${i.name} (${i.quantity}x)`).join(", ")}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 font-medium">
                    <span>Delivered to: {order.deliveryAddress.substring(0, 25)}...</span>
                    <span className="text-sm font-extrabold text-[#1C1C1C]">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
