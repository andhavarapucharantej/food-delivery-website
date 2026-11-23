import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDocs } from "@/lib/serialize";
import { MockDB } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      return NextResponse.json(
        {
          orders: MockDB.getOrders(),
          serverNow: Date.now(),
        },
        { status: 200 }
      );
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { orders: MockDB.getOrders(), serverNow: Date.now() },
        { status: 200 }
      );
    }

    const orders = await Order.find({})
      .populate("restaurantId", "name image location slug")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        orders: serializeDocs(orders),
        serverNow: Date.now(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
