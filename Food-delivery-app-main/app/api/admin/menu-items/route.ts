import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDocs, serializeDoc } from "@/lib/serialize";
import { MockDB, MockMenuItem } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      let items = MockDB.getMenuItems();
      if (restaurantId && restaurantId !== "all") {
        items = items.filter((m) => m.restaurantId === restaurantId);
      }
      const rests = MockDB.getRestaurants();
      const populated = items.map((i) => {
        const rest = rests.find((r) => r._id === i.restaurantId);
        return {
          ...i,
          restaurantId: {
            _id: rest?._id || "",
            name: rest?.name || "Restaurant",
            slug: rest?.slug || "",
          },
        };
      });
      return NextResponse.json({ menuItems: populated }, { status: 200 });
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ menuItems: MockDB.getMenuItems() }, { status: 200 });
    }

    const filter: Record<string, unknown> = {};
    if (restaurantId && mongoose.isValidObjectId(restaurantId)) {
      filter.restaurantId = new Types.ObjectId(restaurantId);
    }

    const items = await MenuItem.find(filter)
      .populate("restaurantId", "name slug")
      .sort({ restaurantId: 1, category: 1, name: 1 });

    return NextResponse.json({ menuItems: serializeDocs(items) }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      restaurantId,
      name,
      description,
      price,
      category,
      isVeg,
      image,
      isAvailable,
    } = body as {
      restaurantId?: unknown;
      name?: unknown;
      description?: unknown;
      price?: unknown;
      category?: unknown;
      isVeg?: unknown;
      image?: unknown;
      isAvailable?: unknown;
    };

    if (!restaurantId) {
      return NextResponse.json({ error: "Valid restaurantId is required" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    if (
      typeof price !== "number" ||
      !Number.isInteger(price) ||
      price < 0
    ) {
      return NextResponse.json(
        { error: "Price must be a non-negative integer (rupees)" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || category.trim().length === 0) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const newDish: MockMenuItem = {
        _id: `dish_${Math.random().toString(36).substring(2, 9)}`,
        restaurantId: restaurantId as string,
        name: name.trim(),
        description: typeof description === "string" ? description.trim() : "",
        price,
        category: category.trim(),
        isVeg: typeof isVeg === "boolean" ? isVeg : true,
        image: typeof image === "string" && image.trim().length > 0 ? image.trim() : "/placeholder-food.svg",
        isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
      };

      MockDB.addMenuItem(newDish);
      return NextResponse.json({ menuItem: newDish }, { status: 201 });
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 503 });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const existing = await MenuItem.findOne({
      restaurantId: restaurant._id,
      name: name.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { error: `An item named "${name.trim()}" already exists for this restaurant` },
        { status: 409 }
      );
    }

    const menuItem = await MenuItem.create({
      restaurantId: restaurant._id,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      price,
      category: category.trim(),
      isVeg: typeof isVeg === "boolean" ? isVeg : true,
      image:
        typeof image === "string" && image.trim().length > 0
          ? image.trim()
          : "/placeholder-food.svg",
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
    });

    return NextResponse.json({ menuItem: serializeDoc(menuItem) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
