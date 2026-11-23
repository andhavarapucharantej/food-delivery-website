"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { FOOD_IMAGES } from "@/lib/images";

interface AdminMenuItem {
  _id: string;
  restaurantId: {
    _id: string;
    name: string;
  };
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  image: string;
  isAvailable: boolean;
}

interface RestaurantOption {
  _id: string;
  name: string;
}

export default function AdminMenuItemsPage() {
  const toast = useToast();
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetRestId, setTargetRestId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("250");
  const [category, setCategory] = useState("Main Course");
  const [isVeg, setIsVeg] = useState(true);
  const [image, setImage] = useState<string>(FOOD_IMAGES.paneerButterMasala);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/admin/restaurants");
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants || []);
        if (data.restaurants?.length > 0 && !targetRestId) {
          setTargetRestId(data.restaurants[0]._id);
        }
      }
    } catch {
      // Ignore
    }
  };

  const fetchItems = async () => {
    try {
      const url =
        selectedRestaurantId && selectedRestaurantId !== "all"
          ? `/api/admin/menu-items?restaurantId=${selectedRestaurantId}`
          : "/api/admin/menu-items";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data.menuItems || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId]);

  const handleToggleAvailable = async (item: AdminMenuItem) => {
    try {
      const res = await fetch(`/api/admin/menu-items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      if (res.ok) {
        toast.success(`Updated "${item.name}" availability`);
        fetchItems();
      }
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    const confirmDelete = window.confirm(`Delete dish "${itemName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/menu-items/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted ${itemName}`);
        fetchItems();
      }
    } catch {
      toast.error("Error deleting dish");
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        restaurantId: targetRestId,
        name: name.trim(),
        description: description.trim(),
        price: parseInt(price, 10),
        category: category.trim(),
        isVeg,
        image: image.trim(),
        isAvailable,
      };

      const res = await fetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create menu item");
      }

      toast.success("Dish added to menu!");
      setIsModalOpen(false);
      setName("");
      setDescription("");
      fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating menu item";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1C]">
            Dishes & Menu Catalog
          </h1>
          <p className="text-xs text-[#696969] mt-0.5">
            Quick availability switch, category organization, and integer rupee prices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#1C1C1C]"
          >
            <option value="all">All Restaurants ({restaurants.length})</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-[8px] bg-[#E23744] text-[#FFFFFF] text-xs font-bold hover:opacity-95 cursor-pointer shadow-xs whitespace-nowrap"
          >
            + Add Dish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[#696969]">Loading menu items...</div>
      ) : (
        <div className="rounded-[8px] border border-[#E8E8E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E8E8] text-[#696969] font-bold">
                <tr>
                  <th className="p-3">Dish Name</th>
                  <th className="p-3">Restaurant</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Diet</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAF9F6]">
                    <td className="p-3">
                      <div className="font-bold text-[#1C1C1C]">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-[#696969] max-w-xs truncate">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-[#1C1C1C] font-medium">
                      {item.restaurantId?.name || "Restaurant"}
                    </td>
                    <td className="p-3 text-[#696969]">{item.category}</td>
                    <td className="p-3 font-bold text-[#1C1C1C]">₹{item.price}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.isVeg
                            ? "bg-[#2E7D32]/10 text-[#2E7D32]"
                            : "bg-[#E23744]/10 text-[#E23744]"
                        }`}
                      >
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleAvailable(item)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          item.isAvailable
                            ? "bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30"
                            : "bg-gray-100 text-gray-500 border border-gray-300"
                        }`}
                      >
                        {item.isAvailable ? "In Stock" : "Sold Out"}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteItem(item._id, item.name)}
                        className="px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-[#1C1C1C]/40 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-[8px] border border-[#E8E8E8] shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold text-[#1C1C1C] mb-4">Add New Dish</h2>

            <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Restaurant *</label>
                <select
                  required
                  value={targetRestId}
                  onChange={(e) => setTargetRestId(e.target.value)}
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                >
                  {restaurants.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Paneer Tikka Masala"
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">
                    Price in ₹ (Integer) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1C1C1C] mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Starters, Main Course"
                    className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1C1C] mb-1">Image URL</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full rounded-[6px] border border-[#E8E8E8] bg-[#FAF9F6] p-2 text-xs"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                  />
                  <span className="font-semibold text-[#1C1C1C]">Pure Vegetarian</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <span className="font-semibold text-[#1C1C1C]">Available (In Stock)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E8E8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-[6px] border border-[#E8E8E8] font-semibold text-[#696969]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-[6px] bg-[#E23744] text-[#FFFFFF] font-bold"
                >
                  {submitting ? "Saving..." : "Create Dish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
