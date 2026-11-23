"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { ORDER_STATUSES, OrderStatus } from "@/lib/constants";

interface AdminOrderRecord {
  _id: string;
  userId?: {
    name: string;
    email: string;
  };
  restaurantId: {
    _id: string;
    name: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  deliveryAddress: string;
  deliveryPartner: {
    name: string;
    phone: string;
    vehicleNo: string;
  };
  status: OrderStatus;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Order status changed to "${newStatus}"`);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating status";
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C]">
            Live Orders Management
          </h1>
          <p className="text-xs text-[#696969] mt-0.5">
            Real-time status progression, assign delivery drivers, and monitor dispatch
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] text-xs font-semibold text-[#1C1C1C] hover:border-[#1C1C1C] cursor-pointer"
        >
          ↻ Refresh List
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#696969]">Loading live orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF]">
          <span className="text-4xl">📦</span>
          <p className="text-sm font-bold text-[#1C1C1C] mt-2">No orders placed yet</p>
          <p className="text-xs text-[#696969] mt-1">
            Orders placed on the customer site will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E8E8] text-[#696969] font-bold">
                <tr>
                  <th className="p-3">Order / Time</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Dishes</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Status Progression</th>
                  <th className="p-3 text-right">Live View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {orders.map((ord) => {
                  const dateStr = new Date(ord.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={ord._id} className="hover:bg-[#FAF9F6]">
                      <td className="p-3">
                        <span className="font-mono font-bold text-[#1C1C1C]">
                          #{ord._id.substring(0, 8)}
                        </span>
                        <div className="text-[11px] text-[#696969]">{dateStr}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-[#1C1C1C]">
                          {ord.userId?.name || "Customer"}
                        </div>
                        <div className="text-[11px] text-[#696969]">
                          {ord.userId?.email || ""}
                        </div>
                      </td>

                      <td className="p-3 font-semibold text-[#1C1C1C]">
                        {ord.restaurantId?.name || "Restaurant"}
                      </td>

                      <td className="p-3 max-w-xs truncate text-[#696969]">
                        {ord.items.map((i) => `${i.name} (${i.quantity}x)`).join(", ")}
                      </td>

                      <td className="p-3 font-extrabold text-[#1C1C1C]">
                        ₹{ord.totalAmount}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-[#1C1C1C]">
                          {ord.deliveryPartner?.name}
                        </div>
                        <div className="text-[11px] text-[#696969] font-mono">
                          {ord.deliveryPartner?.vehicleNo}
                        </div>
                      </td>

                      <td className="p-3">
                        <select
                          value={ord.status}
                          disabled={updatingId === ord._id}
                          onChange={(e) => handleStatusChange(ord._id, e.target.value)}
                          className="rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] px-2.5 py-1 text-xs font-bold text-[#1C1C1C] cursor-pointer focus:outline-none focus:border-[#E23744]"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3 text-right">
                        <Link
                          href={`/orders/${ord._id}`}
                          className="px-2.5 py-1 rounded-[6px] bg-[#E23744] text-[#FFFFFF] font-bold text-[11px] hover:opacity-95 shadow-xs"
                        >
                          Track 🛵
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
