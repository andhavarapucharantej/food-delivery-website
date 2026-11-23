import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Restaurant } from "@/models/Restaurant";
import { MenuItem } from "@/models/MenuItem";
import { serializeDocs } from "@/lib/serialize";
import { MockDB } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 1) {
      return NextResponse.json(
        { restaurants: [], menuItems: [] },
        { status: 200 }
      );
    }

    const lowerQ = q.toLowerCase();

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const allRests = MockDB.getRestaurants();
      const allDishes = MockDB.getMenuItems();

      const matchedRests = allRests.filter(
        (r) =>
          r.name.toLowerCase().includes(lowerQ) ||
          r.cuisine.some((c) => c.toLowerCase().includes(lowerQ))
      );

      const matchedDishes = allDishes
        .filter(
          (d) =>
            d.isAvailable &&
            (d.name.toLowerCase().includes(lowerQ) ||
              d.description.toLowerCase().includes(lowerQ))
        )
        .map((dish) => {
          const rest = allRests.find((r) => r._id === dish.restaurantId);
          return {
            ...dish,
            restaurantId: {
              _id: rest?._id || "",
              name: rest?.name || "Restaurant",
              slug: rest?.slug || "",
            },
          };
        });

      return NextResponse.json(
        {
          restaurants: matchedRests.slice(0, 10),
          menuItems: matchedDishes.slice(0, 20),
        },
        { status: 200 }
      );
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ restaurants: [], menuItems: [] }, { status: 200 });
    }

    const regex = new RegExp(q, "i");

    const [restaurants, menuItems] = await Promise.all([
      Restaurant.find({
        isOpen: true,
        $or: [{ name: { $regex: regex } }, { cuisine: { $in: [regex] } }],
      })
        .limit(10)
        .sort({ rating: -1 }),
      MenuItem.find({
        isAvailable: true,
        $or: [{ name: { $regex: regex } }, { description: { $regex: regex } }],
      })
        .populate("restaurantId", "name slug image location")
        .limit(20),
    ]);

    return NextResponse.json(
      {
        restaurants: serializeDocs(restaurants),
        menuItems: serializeDocs(menuItems),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
