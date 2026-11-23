import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Order, IOrder } from "@/models/Order";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";
import { MockDB, MockOrder } from "@/lib/mockStore";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverNow = Date.now();

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured() || !mongoose.isValidObjectId(id)) {
      const mockOrder = MockDB.findOrderById(id);
      if (mockOrder) {
        if (mockOrder.userId !== authUser.id && authUser.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Lazy simulation for mock order
        const elapsed = (serverNow - new Date(mockOrder.createdAt).getTime()) / 1000;
        let newStatus: MockOrder["status"] = mockOrder.status;

        if (mockOrder.status !== "Cancelled" && mockOrder.status !== "Delivered") {
          if (elapsed < 20) {
            newStatus = "Placed";
          } else if (elapsed < 60) {
            newStatus = "Preparing";
          } else {
            const outElapsed =
              (serverNow -
                new Date(
                  mockOrder.outForDeliveryAt ||
                    new Date(new Date(mockOrder.createdAt).getTime() + 60000).toISOString()
                ).getTime()) /
              1000;
            if (outElapsed / (mockOrder.etaSeconds || 180) >= 1) {
              newStatus = "Delivered";
            } else {
              newStatus = "Out for Delivery";
              if (!mockOrder.outForDeliveryAt) {
                mockOrder.outForDeliveryAt = new Date().toISOString();
              }
            }
          }
          mockOrder.status = newStatus;
          MockDB.updateOrder(id, { status: newStatus, outForDeliveryAt: mockOrder.outForDeliveryAt });
        }

        return NextResponse.json(
          { order: mockOrder, serverNow },
          { status: 200 }
        );
      }

      if (!isMongoConfigured()) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      const mockOrder = MockDB.findOrderById(id);
      if (mockOrder) {
        return NextResponse.json({ order: mockOrder, serverNow }, { status: 200 });
      }
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await Order.findById(id).populate(
      "restaurantId",
      "name image location coordinates slug"
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.userId.toString() !== authUser.id &&
      authUser.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view this order" },
        { status: 403 }
      );
    }

    const simulateDelivery = process.env.SIMULATE_DELIVERY === "true";
    if (
      simulateDelivery &&
      order.status !== "Cancelled" &&
      order.status !== "Delivered" &&
      order.createdAt
    ) {
      const elapsedSeconds = (serverNow - new Date(order.createdAt).getTime()) / 1000;
      let newStatus: IOrder["status"] = order.status;
      let newOutForDeliveryAt = order.outForDeliveryAt;

      if (elapsedSeconds < 20) {
        newStatus = "Placed";
      } else if (elapsedSeconds < 60) {
        newStatus = "Preparing";
      } else {
        if (!newOutForDeliveryAt) {
          newOutForDeliveryAt = new Date(
            new Date(order.createdAt).getTime() + 60_000
          );
        }

        const outDeliveryElapsed =
          (serverNow - new Date(newOutForDeliveryAt).getTime()) / 1000;
        const eta = Math.max(90, order.etaSeconds || 120);

        if (outDeliveryElapsed / eta >= 1) {
          newStatus = "Delivered";
        } else {
          newStatus = "Out for Delivery";
        }
      }

      if (
        newStatus !== order.status ||
        newOutForDeliveryAt !== order.outForDeliveryAt
      ) {
        order.status = newStatus;
        if (newOutForDeliveryAt) {
          order.outForDeliveryAt = newOutForDeliveryAt;
        }
        await order.save();
      }
    }

    return NextResponse.json(
      {
        order: serializeDoc(order),
        serverNow,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured() || !mongoose.isValidObjectId(id)) {
      const mockOrder = MockDB.findOrderById(id);
      if (mockOrder) {
        if (mockOrder.userId !== authUser.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (mockOrder.status !== "Placed") {
          return NextResponse.json(
            { error: "Order can only be cancelled while in 'Placed' status" },
            { status: 400 }
          );
        }
        mockOrder.status = "Cancelled";
        MockDB.updateOrder(id, { status: "Cancelled" });
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

    if (order.userId.toString() !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot cancel another user's order" },
        { status: 403 }
      );
    }

    if (order.status !== "Placed") {
      return NextResponse.json(
        {
          error: `Cannot cancel order in "${order.status}" status. Orders can only be cancelled while in "Placed" status.`,
        },
        { status: 400 }
      );
    }

    order.status = "Cancelled";
    await order.save();

    return NextResponse.json({ order: serializeDoc(order) }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
