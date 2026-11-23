import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Restaurant } from "@/models/Restaurant";
import { MenuItem } from "@/models/MenuItem";
import { DeliveryPartner } from "@/models/DeliveryPartner";
import { CITY_CENTRE, SEEDED_DELIVERY_PARTNERS } from "@/lib/constants";
import { RESTAURANT_IMAGES, FOOD_IMAGES } from "@/lib/images";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const seedSecret = process.env.SEED_SECRET;
    if (!seedSecret) {
      return NextResponse.json(
        { error: "Seed endpoint not found: SEED_SECRET is unset in server environment" },
        { status: 404 }
      );
    }

    const providedSecret = request.headers.get("x-seed-secret");
    if (providedSecret !== seedSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid x-seed-secret header" },
        { status: 401 }
      );
    }

    if (!isMongoConfigured()) {
      return NextResponse.json({
        success: true,
        message: "In-memory MockDB store is active with pre-seeded data.",
      });
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json({
        success: true,
        message: "MongoDB offline. In-memory MockDB store is active with pre-seeded data.",
      });
    }

    // Ensure 2dsphere indexes are built for $geoNear
    await Restaurant.createIndexes();
    await MenuItem.createIndexes();
    await User.createIndexes();
    await DeliveryPartner.createIndexes();

    // 1. Seed Admin User (idempotent upsert by email)
    const adminEmail = (process.env.ADMIN_EMAIL || "charan@admin.com").toLowerCase();
    const adminRawPass = process.env.ADMIN_PASSWORD || "Bitcoin@100";
    const adminHashedPass = await hashPassword(adminRawPass);

    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: "Charan",
        email: adminEmail,
        password: adminHashedPass,
        role: "admin",
        address: "Tastevio HQ, Indiranagar 100 Feet Rd, Bengaluru",
      },
      { upsert: true, new: true }
    );

    // 2. Seed Demo Customer Users
    const demoUsersToSeed = [
      { name: "Charan", email: "charan@tastevio.com", address: "Flat 402, Green Glen Heights, Bengaluru" },
      { name: "Sai", email: "sai@tastevio.com", address: "Plot 12, Rainbow Colony, Koramangala, Bengaluru" },
      { name: "Sita Ram", email: "sitaram@tastevio.com", address: "Villa 8, Sunrise Enclave, Whitefield, Bengaluru" },
      { name: "Priya", email: "priya@tastevio.com", address: "Apartment 101, Lakeview Residency, HSR Layout, Bengaluru" },
      { name: "Kalifia", email: "kalifia@tastevio.com", address: "Tower C, Palm Grove, JP Nagar, Bengaluru" },
      { name: "Demo Customer", email: "demo@example.com", address: "Flat 402, Green Glen Heights, Bengaluru" },
    ];

    const demoHashedPass = await hashPassword("Bitcoin@100");

    for (const u of demoUsersToSeed) {
      await User.findOneAndUpdate(
        { email: u.email },
        {
          name: u.name,
          email: u.email,
          password: demoHashedPass,
          role: "user",
          address: u.address,
        },
        { upsert: true, new: true }
      );
    }

    // 3. Seed 10 Delivery Partners (idempotent upsert by vehicleNo)
    for (const partner of SEEDED_DELIVERY_PARTNERS) {
      await DeliveryPartner.findOneAndUpdate(
        { vehicleNo: partner.vehicleNo },
        {
          name: partner.name,
          phone: partner.phone,
          vehicleNo: partner.vehicleNo,
          rating: partner.rating,
        },
        { upsert: true }
      );
    }

    // 4. Seed 4 Restaurants with real coordinates within 1-5km of Bengaluru centre
    const restaurantData = [
      {
        name: "Royal Biryani Darbar",
        slug: "royal-biryani-darbar",
        cuisine: ["Biryani", "North Indian"],
        image: RESTAURANT_IMAGES.biryani,
        rating: 4.6,
        deliveryTime: 32,
        location: CITY_CENTRE.name,
        coordinates: {
          type: "Point" as const,
          coordinates: [80.6240, 16.4450] as [number, number], // [lng, lat] KL University Vaddeswaram (~0.3 km)
        },
        isOpen: true,
        dishes: [
          {
            name: "Hyderabadi Chicken Dum Biryani",
            description: "Fragrant basmati rice layered with succulent chicken pieces and traditional spices.",
            price: 320,
            category: "Main Course",
            isVeg: false,
            image: FOOD_IMAGES.chickenBiryani,
            isAvailable: true,
          },
          {
            name: "Royal Paneer Tikka Biryani",
            description: "Tandoori spiced paneer cubes slow-cooked with basmati rice and saffron.",
            price: 260,
            category: "Main Course",
            isVeg: true,
            image: FOOD_IMAGES.vegBiryani,
            isAvailable: true,
          },
          {
            name: "Murgh Butter Chicken",
            description: "Boneless tandoori chicken simmered in a creamy, velvety tomato butter gravy.",
            price: 290,
            category: "Main Course",
            isVeg: false,
            image: FOOD_IMAGES.butterChicken,
            isAvailable: true,
          },
          {
            name: "Shahi Gulab Jamun (2 Pcs)",
            description: "Warm, melt-in-mouth milk solids soaked in aromatic cardamom-rose syrup.",
            price: 80,
            category: "Desserts",
            isVeg: true,
            image: FOOD_IMAGES.gulabJamun,
            isAvailable: true,
          },
        ],
      },
      {
        name: "Udupi Grand Tiffin",
        slug: "udupi-grand-tiffin",
        cuisine: ["South Indian"],
        image: RESTAURANT_IMAGES.southIndian,
        rating: 4.8,
        deliveryTime: 20,
        location: CITY_CENTRE.name,
        coordinates: {
          type: "Point" as const,
          coordinates: [80.6210, 16.4395] as [number, number], // [lng, lat] KL Green Fields (~0.4 km)
        },
        isOpen: true,
        dishes: [
          {
            name: "Special Ghee Masala Dosa",
            description: "Golden crisp crepe roasted with pure desi ghee, filled with spiced potato masala.",
            price: 110,
            category: "South Indian",
            isVeg: true,
            image: FOOD_IMAGES.masalaDosa,
            isAvailable: true,
          },
          {
            name: "Steamed Idli & Medu Vada Combo",
            description: "Two fluffy steamed rice cakes and one crispy lentil doughnut with sambar & chutney.",
            price: 90,
            category: "South Indian",
            isVeg: true,
            image: FOOD_IMAGES.idliVada,
            isAvailable: true,
          },
          {
            name: "Dal Makhani with Garlic Naan",
            description: "Black lentils slow-cooked overnight with cream, butter, and handmade garlic naan.",
            price: 220,
            category: "Main Course",
            isVeg: true,
            image: FOOD_IMAGES.dalMakhani,
            isAvailable: true,
          },
          {
            name: "Traditional South Filter Coffee",
            description: "Authentic decoction brewed filter coffee frothed with rich hot milk.",
            price: 45,
            category: "Beverages",
            isVeg: true,
            image: FOOD_IMAGES.filterCoffee,
            isAvailable: true,
          },
        ],
      },
      {
        name: "Bella Napoli Pizzeria",
        slug: "bella-napoli-pizzeria",
        cuisine: ["Pizza"],
        image: RESTAURANT_IMAGES.italian,
        rating: 4.7,
        deliveryTime: 35,
        location: CITY_CENTRE.name,
        coordinates: {
          type: "Point" as const,
          coordinates: [80.6190, 16.4480] as [number, number], // [lng, lat] KL Student Hub (~0.7 km)
        },
        isOpen: true,
        dishes: [
          {
            name: "Classic Margherita Pizza (10\")",
            description: "San Marzano tomato sauce, fresh mozzarella fior di latte, and basil leaves.",
            price: 340,
            category: "Pizza",
            isVeg: true,
            image: FOOD_IMAGES.margheritaPizza,
            isAvailable: true,
          },
          {
            name: "Farmhouse Loaded Pizza (10\")",
            description: "Topped with bell peppers, sweet corn, black olives, red onions, and mozzarella.",
            price: 410,
            category: "Pizza",
            isVeg: true,
            image: FOOD_IMAGES.farmhousePizza,
            isAvailable: true,
          },
          {
            name: "Cheesy Stuffed Garlic Bread",
            description: "Freshly baked dough brushed with herb butter and filled with molten cheese.",
            price: 160,
            category: "Starters",
            isVeg: true,
            image: FOOD_IMAGES.garlicBread,
            isAvailable: true,
          },
          {
            name: "Belgian Chocolate Fudge Brownie",
            description: "Rich dark chocolate brownie served with warm chocolate fudge glaze.",
            price: 150,
            category: "Desserts",
            isVeg: true,
            image: FOOD_IMAGES.chocolateBrownie,
            isAvailable: true,
          },
        ],
      },
      {
        name: "Burger & Brew Diner",
        slug: "burger-and-brew-diner",
        cuisine: ["Burgers"],
        image: RESTAURANT_IMAGES.burgers,
        rating: 4.5,
        deliveryTime: 25,
        location: CITY_CENTRE.name,
        coordinates: {
          type: "Point" as const,
          coordinates: [80.6280, 16.4410] as [number, number], // [lng, lat] Tadepalle Bypass (~0.6 km)
        },
        isOpen: true,
        dishes: [
          {
            name: "Flame Grilled Chicken Burger",
            description: "Juicy chicken patty grilled over flames with cheddar, lettuce, and secret sauce.",
            price: 240,
            category: "Burgers",
            isVeg: false,
            image: FOOD_IMAGES.chickenBurger,
            isAvailable: true,
          },
          {
            name: "Crispy Paneer Deluxe Burger",
            description: "Spiced crumbed paneer block topped with pickled jalapenos and cheese spread.",
            price: 210,
            category: "Burgers",
            isVeg: true,
            image: FOOD_IMAGES.vegBurger,
            isAvailable: true,
          },
          {
            name: "Peri Peri Crispy French Fries",
            description: "Hot crispy potato fries dusted with piquant peri peri seasoning.",
            price: 120,
            category: "Starters",
            isVeg: true,
            image: FOOD_IMAGES.frenchFries,
            isAvailable: true,
          },
          {
            name: "Paneer Butter Masala Bowl",
            description: "Tender paneer cubes in velvety butter gravy served with two warm rotis.",
            price: 230,
            category: "Main Course",
            isVeg: true,
            image: FOOD_IMAGES.paneerButterMasala,
            isAvailable: true,
          },
        ],
      },
    ];

    let totalDishes = 0;

    for (const restData of restaurantData) {
      const { dishes, ...restaurantFields } = restData;

      const restaurant = await Restaurant.findOneAndUpdate(
        { slug: restaurantFields.slug },
        restaurantFields,
        { upsert: true, new: true }
      );

      for (const dish of dishes) {
        await MenuItem.findOneAndUpdate(
          { restaurantId: restaurant._id, name: dish.name },
          { ...dish, restaurantId: restaurant._id },
          { upsert: true }
        );
        totalDishes++;
      }
    }

    return NextResponse.json(
      {
        message: "Database seeded successfully and idempotently",
        summary: {
          adminEmail,
          demoUsers: demoUsersToSeed.map((u) => u.email),
          restaurantsCount: restaurantData.length,
          menuItemsCount: totalDishes,
          deliveryPartnersCount: SEEDED_DELIVERY_PARTNERS.length,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
