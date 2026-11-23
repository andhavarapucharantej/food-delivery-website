import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Restaurant } from "@/models/Restaurant";
import { MenuItem } from "@/models/MenuItem";
import { CITY_CENTRE } from "@/lib/constants";
import { isValidCoordinates } from "@/lib/geo";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDocs, serializeDoc } from "@/lib/serialize";
import { MockDB, MockRestaurant } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin required" }, { status: 403 });
    }

    if (!isMongoConfigured()) {
      const rests = MockDB.getRestaurants().map((r) => {
        const dishCount = MockDB.findMenuItemsByRestaurant(r._id).length;
        return {
          ...r,
          menuItemsCount: dishCount,
        };
      });
      return NextResponse.json({ restaurants: rests }, { status: 200 });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ restaurants: MockDB.getRestaurants() }, { status: 200 });
    }

    const restaurants = await Restaurant.find({}).sort({ createdAt: -1 });

    const counts = await MenuItem.aggregate([
      { $group: { _id: "$restaurantId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const result = restaurants.map((r) => {
      const serialized = serializeDoc<Record<string, unknown>>(r);
      return {
        ...serialized,
        menuItemsCount: countMap.get(r._id.toString()) || 0,
      };
    });

    return NextResponse.json({ restaurants: result }, { status: 200 });
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
      name,
      slug,
      cuisine,
      image,
      rating,
      deliveryTime,
      location,
      lat,
      lng,
      isOpen,
    } = body as {
      name?: unknown;
      slug?: unknown;
      cuisine?: unknown;
      image?: unknown;
      rating?: unknown;
      deliveryTime?: unknown;
      location?: unknown;
      lat?: unknown;
      lng?: unknown;
      isOpen?: unknown;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    const restaurantSlug =
      typeof slug === "string" && slug.trim().length > 0
        ? slug.trim().toLowerCase()
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const targetLat = typeof lat === "number" ? lat : CITY_CENTRE.lat;
    const targetLng = typeof lng === "number" ? lng : CITY_CENTRE.lng;

    if (!isValidCoordinates(targetLat, targetLng)) {
      return NextResponse.json(
        { error: "Coordinates must have latitude -90..90 and longitude -180..180" },
        { status: 400 }
      );
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const newRest: MockRestaurant = {
        _id: `rest_${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        slug: restaurantSlug,
        cuisine: Array.isArray(cuisine) ? (cuisine as string[]) : ["North Indian"],
        image: typeof image === "string" && image.trim().length > 0 ? image.trim() : "/placeholder-food.svg",
        rating: typeof rating === "number" ? Math.min(5, Math.max(0, rating)) : 4.5,
        deliveryTime: typeof deliveryTime === "number" ? deliveryTime : 30,
        location: typeof location === "string" && location.trim().length > 0 ? location.trim() : CITY_CENTRE.name,
        coordinates: {
          type: "Point",
          coordinates: [targetLng, targetLat],
        },
        isOpen: typeof isOpen === "boolean" ? isOpen : true,
      };

      MockDB.addRestaurant(newRest);
      return NextResponse.json({ restaurant: newRest }, { status: 201 });
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 503 });
    }

    const existingSlug = await Restaurant.findOne({ slug: restaurantSlug });
    if (existingSlug) {
      return NextResponse.json(
        { error: `Restaurant with slug "${restaurantSlug}" already exists` },
        { status: 409 }
      );
    }

    const restaurant = await Restaurant.create({
      name: name.trim(),
      slug: restaurantSlug,
      cuisine: Array.isArray(cuisine) ? cuisine : ["North Indian"],
      image:
        typeof image === "string" && image.trim().length > 0
          ? image.trim()
          : "/placeholder-food.svg",
      rating: typeof rating === "number" ? Math.min(5, Math.max(0, rating)) : 4.5,
      deliveryTime: typeof deliveryTime === "number" ? deliveryTime : 30,
      location:
        typeof location === "string" && location.trim().length > 0
          ? location.trim()
          : CITY_CENTRE.name,
      coordinates: {
        type: "Point",
        coordinates: [targetLng, targetLat],
      },
      isOpen: typeof isOpen === "boolean" ? isOpen : true,
    });

    return NextResponse.json({ restaurant: serializeDoc(restaurant) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
