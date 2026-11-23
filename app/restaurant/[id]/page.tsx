"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { FoodImage } from "@/components/FoodImage";
import { useCart } from "@/contexts/CartContext";

interface MenuItemData {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
}

interface RestaurantData {
  _id: string;
  name: string;
  slug: string;
  cuisine: string[];
  image: string;
  rating: number;
  deliveryTime: number;
  location: string;
  isOpen: boolean;
}

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { items, addItem, updateQuantity } = useCart();

  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurantMenu = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/restaurants/${id}`);
        if (!res.ok) {
          throw new Error("Restaurant not found");
        }
        const data = await res.json();
        setRestaurant(data.restaurant);
        setMenuItems(data.menuItems || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading restaurant";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantMenu();
  }, [id]);

  // Group dishes by category
  const categories = Array.from(new Set(menuItems.map((m) => m.category)));

  // Lookup quantity of an item currently in cart
  const getItemQuantity = (itemId: string): number => {
    const found = items.find((i) => i.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-64 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8] mb-6" />
        <div className="h-8 bg-[#FAF9F6] rounded w-1/3 mb-4" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-[8px] bg-[#FAF9F6] border border-[#E8E8E8]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold text-[#1C1C1C] mt-3">Restaurant Not Found</h2>
        <p className="text-xs text-[#696969] mt-1">{error || "Could not load menu"}</p>
        <Link
          href="/"
          className="inline-block mt-4 px-4 py-2 rounded-[8px] bg-[#E23744] text-xs font-bold text-[#FFFFFF]"
        >
          Back to Restaurants
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Restaurant Header Banner */}
      <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-4 sm:p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="relative w-full sm:w-64 h-48 rounded-[8px] overflow-hidden bg-[#FAF9F6] flex-shrink-0">
            <FoodImage
              src={restaurant.image}
              alt={restaurant.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 256px"
              priority
            />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1C1C]">
                  {restaurant.name}
                </h1>
                <div className="flex items-center gap-1 bg-[#2E7D32] text-[#FFFFFF] text-xs font-extrabold px-2 py-0.5 rounded-[4px]">
                  <span>★</span>
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-xs font-medium text-[#696969] mb-3">
                {restaurant.cuisine.join(" • ")}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#1C1C1C]">
                <div className="flex items-center gap-1 font-semibold">
                  <span>🕒</span>
                  <span>{restaurant.deliveryTime} mins delivery time</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-[#696969]">
                  <span>📍</span>
                  <span>{restaurant.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E8E8E8] flex items-center justify-between text-xs text-[#696969]">
              <span>
                {restaurant.isOpen ? (
                  <span className="text-[#2E7D32] font-bold">● Open Now</span>
                ) : (
                  <span className="text-[#E23744] font-bold">● Currently Closed</span>
                )}
              </span>
              <span>100% Hygienic Food Handling</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Menu Categories */}
      <div className="space-y-8">
        {categories.map((category) => {
          const itemsInCategory = menuItems.filter((m) => m.category === category);
          return (
            <section key={category} className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] p-4 sm:p-6">
              <h2 className="text-base font-extrabold text-[#1C1C1C] pb-3 border-b border-[#E8E8E8] flex items-center justify-between">
                <span>{category}</span>
                <span className="text-xs font-normal text-[#696969]">
                  {itemsInCategory.length} items
                </span>
              </h2>

              <div className="divide-y divide-[#E8E8E8]">
                {itemsInCategory.map((dish) => {
                  const qtyInCart = getItemQuantity(dish._id);

                  return (
                    <div
                      key={dish._id}
                      className="py-4 flex items-start justify-between gap-4"
                    >
                      {/* Left: Dish Information */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Veg/Non-Veg Square Indicator */}
                          <span
                            className={`w-4 h-4 border rounded-[3px] flex items-center justify-center ${
                              dish.isVeg ? "border-[#2E7D32]" : "border-[#E23744]"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                dish.isVeg ? "bg-[#2E7D32]" : "bg-[#E23744]"
                              }`}
                            />
                          </span>
                          <span className="text-xs font-semibold text-[#696969]">
                            {dish.isVeg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[#1C1C1C] mb-1">
                          {dish.name}
                        </h3>

                        <div className="text-sm font-extrabold text-[#1C1C1C] mb-1.5">
                          ₹{dish.price}
                        </div>

                        {dish.description && (
                          <p className="text-xs text-[#696969] line-clamp-2 max-w-lg">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Dish Image & Quantity Controls */}
                      <div className="relative flex flex-col items-center flex-shrink-0">
                        <div className="relative w-28 h-24 rounded-[8px] overflow-hidden bg-[#FAF9F6] border border-[#E8E8E8]">
                          <FoodImage
                            src={dish.image}
                            alt={dish.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        </div>

                        {/* Add / Quantity Button Overlay */}
                        <div className="-mt-3.5 z-10">
                          {qtyInCart === 0 ? (
                            <button
                              onClick={() =>
                                addItem({
                                  menuItemId: dish._id,
                                  restaurantId: restaurant._id,
                                  restaurantName: restaurant.name,
                                  name: dish.name,
                                  price: dish.price,
                                  isVeg: dish.isVeg,
                                  image: dish.image,
                                })
                              }
                              className="px-5 py-1.5 rounded-[6px] bg-[#FFFFFF] border border-[#E8E8E8] text-[#2E7D32] font-black text-xs hover:border-[#2E7D32] shadow-xs cursor-pointer"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="flex items-center bg-[#FFFFFF] border border-[#2E7D32] rounded-[6px] shadow-xs overflow-hidden">
                              <button
                                onClick={() => updateQuantity(dish._id, -1)}
                                className="px-2 py-1 text-[#E23744] font-black text-xs hover:bg-[#FAF9F6] cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-black text-[#2E7D32]">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => updateQuantity(dish._id, 1)}
                                className="px-2 py-1 text-[#2E7D32] font-black text-xs hover:bg-[#FAF9F6] cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
