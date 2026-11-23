import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { Order, IOrderItem } from "@/models/Order";
import { MenuItem } from "@/models/MenuItem";
import { Restaurant } from "@/models/Restaurant";
import { DeliveryPartner } from "@/models/DeliveryPartner";
import { SEEDED_DELIVERY_PARTNERS } from "@/lib/constants";
import { verifyAuthFromRequest } from "@/lib/auth";
import {
  isValidCoordinates,
  haversineDistanceKm,
  computeEtaSeconds,
  geoJsonToLatLng,
} from "@/lib/geo";
import { serializeDoc, serializeDocs } from "@/lib/serialize";
import { MockDB, MockOrder } from "@/lib/mockStore";

interface RequestOrderItem {
  menuItemId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { items, deliveryAddress, deliveryCoordinates } = body as {
      items?: unknown;
      deliveryAddress?: unknown;
      deliveryCoordinates?: unknown;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart cannot be empty. Please add items to your order." },
        { status: 400 }
      );
    }

    if (
      !deliveryAddress ||
      typeof deliveryAddress !== "string" ||
      deliveryAddress.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Delivery address is required" },
        { status: 400 }
      );
    }

    const coords = deliveryCoordinates as { lat?: unknown; lng?: unknown } | null;
    if (!coords || !isValidCoordinates(coords.lat, coords.lng)) {
      return NextResponse.json(
        { error: "Valid delivery coordinates (latitude and longitude) are required" },
        { status: 400 }
      );
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const allDishes = MockDB.getMenuItems();
      let totalAmount = 0;
      const orderItems = [];
      let restId = "";

      for (const item of items as RequestOrderItem[]) {
        const dish = allDishes.find((d) => d._id === item.menuItemId);
        if (!dish) {
          return NextResponse.json({ error: "One or more dishes not found" }, { status: 400 });
        }
        restId = dish.restaurantId;
        totalAmount += dish.price * item.quantity;
        orderItems.push({
          menuItemId: dish._id,
          name: dish.name,
          price: dish.price,
          quantity: item.quantity,
        });
      }

      const rest = MockDB.findRestaurantById(restId) || MockDB.getRestaurants()[0];
      const partner = SEEDED_DELIVERY_PARTNERS[Math.floor(Math.random() * SEEDED_DELIVERY_PARTNERS.length)];

      const restCoords = geoJsonToLatLng(rest.coordinates.coordinates);
      const dist = haversineDistanceKm(restCoords.lat, restCoords.lng, coords.lat as number, coords.lng as number);
      const etaSeconds = computeEtaSeconds(dist);

      const newMockOrder: MockOrder = {
        _id: `ord_${Math.random().toString(36).substring(2, 9)}`,
        userId: authUser.id,
        restaurantId: {
          _id: rest._id,
          name: rest.name,
          image: rest.image,
          location: rest.location,
          coordinates: rest.coordinates,
        },
        items: orderItems,
        totalAmount,
        deliveryAddress: deliveryAddress.trim(),
        deliveryCoordinates: {
          lat: coords.lat as number,
          lng: coords.lng as number,
        },
        deliveryPartner: {
          name: partner.name,
          phone: partner.phone,
          vehicleNo: partner.vehicleNo,
          rating: partner.rating,
        },
        etaSeconds,
        status: "Placed",
        createdAt: new Date().toISOString(),
      };

      MockDB.addOrder(newMockOrder);
      return NextResponse.json({ order: newMockOrder }, { status: 201 });
    }

    // 2. Real MongoDB
    for (const item of items as RequestOrderItem[]) {
      if (!item.menuItemId || !mongoose.isValidObjectId(item.menuItemId)) {
        return NextResponse.json(
          { error: "Invalid menuItemId in order" },
          { status: 400 }
        );
      }
      if (
        typeof item.quantity !== "number" ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 50
      ) {
        return NextResponse.json(
          { error: "Item quantity must be an integer between 1 and 50" },
          { status: 400 }
        );
      }
    }

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ error: "Database offline" }, { status: 503 });
    }

    const itemIds = (items as RequestOrderItem[]).map(
      (i) => new Types.ObjectId(i.menuItemId)
    );
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });

    if (dbMenuItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "One or more selected menu items do not exist" },
        { status: 400 }
      );
    }

    const unavailableItem = dbMenuItems.find((i) => !i.isAvailable);
    if (unavailableItem) {
      return NextResponse.json(
        { error: `Item "${unavailableItem.name}" is currently unavailable` },
        { status: 400 }
      );
    }

    const firstRestaurantId = dbMenuItems[0].restaurantId.toString();
    const hasDifferentRestaurant = dbMenuItems.some(
      (i) => i.restaurantId.toString() !== firstRestaurantId
    );
    if (hasDifferentRestaurant) {
      return NextResponse.json(
        { error: "All items in an order must be from the same restaurant" },
        { status: 400 }
      );
    }

    const restaurant = await Restaurant.findById(firstRestaurantId);
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }
    if (!restaurant.isOpen) {
      return NextResponse.json(
        { error: `"${restaurant.name}" is currently closed and not accepting orders` },
        { status: 400 }
      );
    }

    const dbItemMap = new Map(dbMenuItems.map((i) => [i._id.toString(), i]));
    let totalAmount = 0;
    const computedItems: IOrderItem[] = [];

    for (const reqItem of items as RequestOrderItem[]) {
      const dbItem = dbItemMap.get(reqItem.menuItemId)!;
      const itemSubtotal = dbItem.price * reqItem.quantity;
      totalAmount += itemSubtotal;
      computedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: reqItem.quantity,
      });
    }

    const randomPartnerSample = await DeliveryPartner.aggregate([
      { $sample: { size: 1 } },
    ]);
    const partner =
      randomPartnerSample.length > 0
        ? randomPartnerSample[0]
        : SEEDED_DELIVERY_PARTNERS[
            Math.floor(Math.random() * SEEDED_DELIVERY_PARTNERS.length)
          ];

    const restaurantCoords = geoJsonToLatLng(restaurant.coordinates.coordinates);
    const distanceKm = haversineDistanceKm(
      restaurantCoords.lat,
      restaurantCoords.lng,
      coords.lat as number,
      coords.lng as number
    );
    const etaSeconds = computeEtaSeconds(distanceKm);

    const order = await Order.create({
      userId: new Types.ObjectId(authUser.id),
      restaurantId: restaurant._id,
      items: computedItems,
      totalAmount,
      deliveryAddress: (deliveryAddress as string).trim(),
      deliveryCoordinates: {
        lat: coords.lat as number,
        lng: coords.lng as number,
      },
      deliveryPartner: {
        name: partner.name,
        phone: partner.phone,
        vehicleNo: partner.vehicleNo,
        rating: partner.rating,
      },
      etaSeconds,
      status: "Placed",
    });

    return NextResponse.json({ order: serializeDoc(order) }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await verifyAuthFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const allOrders = MockDB.getOrders();
      const userOrders =
        authUser.role === "admin"
          ? allOrders
          : allOrders.filter((o) => o.userId === authUser.id);

      return NextResponse.json(
        {
          orders: userOrders,
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

    const filter =
      authUser.role === "admin" ? {} : { userId: new Types.ObjectId(authUser.id) };

    const orders = await Order.find(filter)
      .populate("restaurantId", "name image location slug coordinates")
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
