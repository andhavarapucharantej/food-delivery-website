import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";
import { MockDB, MockOrder } from "@/lib/mockStore";

const VALID_STATUSES = [
  "Placed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authUser = await verifyAuthFromRequest(request);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status } = body as { status?: unknown };
    if (
      typeof status !== "string" ||
      !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured() || !mongoose.isValidObjectId(id)) {
      const mockOrder = MockDB.findOrderById(id);
      if (mockOrder) {
        mockOrder.status = status as MockOrder["status"];
        if (status === "Out for Delivery" && !mockOrder.outForDeliveryAt) {
          mockOrder.outForDeliveryAt = new Date().toISOString();
        }
        MockDB.updateOrder(id, {
          status: mockOrder.status,
          outForDeliveryAt: mockOrder.outForDeliveryAt,
        });
        return NextResponse.json({ order: mockOrder }, { status: 200 });
      }
      if (!isMongoConfigured()) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status as (typeof VALID_STATUSES)[number];

    if (status === "Out for Delivery" && !order.outForDeliveryAt) {
      order.outForDeliveryAt = new Date();
    }

    await order.save();

    return NextResponse.json({ order: serializeDoc(order) }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
