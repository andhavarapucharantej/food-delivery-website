import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Restaurant } from "@/models/Restaurant";
import { MenuItem } from "@/models/MenuItem";
import { serializeDoc, serializeDocs } from "@/lib/serialize";
import { MockDB } from "@/lib/mockStore";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured() || !mongoose.isValidObjectId(id)) {
      const mockRest = MockDB.findRestaurantById(id);
      if (mockRest) {
        const items = MockDB.findMenuItemsByRestaurant(id);
        return NextResponse.json(
          {
            restaurant: mockRest,
            menuItems: items,
          },
          { status: 200 }
        );
      }
      if (!isMongoConfigured()) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
      }
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      const mockRest = MockDB.findRestaurantById(id);
      if (mockRest) {
        const items = MockDB.findMenuItemsByRestaurant(id);
        return NextResponse.json(
          { restaurant: mockRest, menuItems: items },
          { status: 200 }
        );
      }
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const menuItems = await MenuItem.find({
      restaurantId: restaurant._id,
      isAvailable: true,
    }).sort({ category: 1, name: 1 });

    return NextResponse.json(
      {
        restaurant: serializeDoc(restaurant),
        menuItems: serializeDocs(menuItems),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
