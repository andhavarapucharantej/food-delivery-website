import React from "react";
import Link from "next/link";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Restaurant } from "@/models/Restaurant";
import { User } from "@/models/User";
import { serializeDocs } from "@/lib/serialize";
import { MockDB } from "@/lib/mockStore";

interface RecentOrderSummary {
  _id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: { name: string; email: string };
  restaurantId?: { name: string };
}

export default async function AdminDashboardPage() {
  let totalOrdersCount = 0;
  let activeRestaurantsCount = 0;
  let totalUsersCount = 0;
  let totalRevenue = 0;
  let recentOrders: RecentOrderSummary[] = [];

  if (!isMongoConfigured()) {
    // 1. In-Memory Mock Store Fallback
    const orders = MockDB.getOrders();
    totalOrdersCount = orders.length;
    activeRestaurantsCount = MockDB.getRestaurants().filter((r) => r.isOpen).length;
    totalUsersCount = MockDB.getUsers().length;
    totalRevenue = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    recentOrders = orders.slice(0, 6).map((o) => {
      const user = MockDB.findUserById(o.userId);
      return {
        _id: o._id,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        userId: { name: user?.name || "Customer", email: user?.email || "" },
        restaurantId: { name: o.restaurantId.name },
      };
    });
  } else {
    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      const orders = MockDB.getOrders();
      totalOrdersCount = orders.length;
      activeRestaurantsCount = MockDB.getRestaurants().filter((r) => r.isOpen).length;
      totalUsersCount = MockDB.getUsers().length;
      totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((sum, o) => sum + o.totalAmount, 0);
    } else {
      const [ordCount, restCount, userCount, revAgg, recentRaw] = await Promise.all([
        Order.countDocuments({}),
        Restaurant.countDocuments({ isOpen: true }),
        User.countDocuments({}),
        Order.aggregate([
          { $match: { status: { $ne: "Cancelled" } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.find({})
          .populate("userId", "name email")
          .populate("restaurantId", "name")
          .sort({ createdAt: -1 })
          .limit(6),
      ]);

      totalOrdersCount = ordCount;
      activeRestaurantsCount = restCount;
      totalUsersCount = userCount;
      totalRevenue = revAgg.length > 0 ? revAgg[0].total : 0;
      recentOrders = serializeDocs<RecentOrderSummary>(recentRaw);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C]">
          System Overview & Metrics
        </h1>
        <p className="text-xs text-[#696969] mt-0.5">
          Real-time metrics calculated directly from database collections
        </p>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="p-5 rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#696969] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Orders</span>
            <span className="text-lg">📦</span>
          </div>
          <div className="text-2xl font-black text-[#1C1C1C]">{totalOrdersCount}</div>
          <div className="text-[11px] text-[#2E7D32] font-semibold mt-1">
            Lifetime orders placed
          </div>
        </div>

        {/* Net Revenue */}
        <div className="p-5 rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#696969] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Net Revenue</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl font-black text-[#E23744]">₹{totalRevenue}</div>
          <div className="text-[11px] text-[#696969] font-medium mt-1">
            Excludes cancelled orders
          </div>
        </div>

        {/* Active Restaurants */}
        <div className="p-5 rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#696969] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Active Restaurants</span>
            <span className="text-lg">🏪</span>
          </div>
          <div className="text-2xl font-black text-[#1C1C1C]">{activeRestaurantsCount}</div>
          <div className="text-[11px] text-[#2E7D32] font-semibold mt-1">
            Accepting live orders
          </div>
        </div>

        {/* Total Users */}
        <div className="p-5 rounded-[8px] bg-[#FFFFFF] border border-[#E8E8E8] shadow-xs">
          <div className="flex items-center justify-between text-[#696969] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Registered Users</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="text-2xl font-black text-[#1C1C1C]">{totalUsersCount}</div>
          <div className="text-[11px] text-[#696969] font-medium mt-1">
            Customers and admins
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Orders Table */}
      <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8] mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-[#1C1C1C]">Recent Orders</h2>
            <p className="text-[11px] text-[#696969]">Latest orders placed across restaurants</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-[#E23744] hover:underline"
          >
            Manage All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#696969]">
            No orders found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E8E8] text-[#696969] font-bold">
                  <th className="pb-2">Order ID</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Restaurant</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 font-mono text-[#1C1C1C]">
                      {ord._id.substring(0, 10)}...
                    </td>
                    <td className="py-2.5 text-[#1C1C1C]">
                      {ord.userId?.name || "Customer"}
                    </td>
                    <td className="py-2.5 font-medium text-[#1C1C1C]">
                      {ord.restaurantId?.name || "Restaurant"}
                    </td>
                    <td className="py-2.5 font-bold text-[#1C1C1C]">₹{ord.totalAmount}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF9F6] border border-[#E8E8E8] text-[#1C1C1C]">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        href={`/orders/${ord._id}`}
                        className="text-[#E23744] font-bold hover:underline"
                      >
                        Track
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
